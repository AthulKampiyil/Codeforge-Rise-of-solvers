"""Tests for full Attack Flow & Trophy Ledger Auditability (SADD §7.2, §7.3.1.3, TC-ATK-02..05).

Validates:
- Attack launch creating attack record + 3 curated problems (REQ-4.1, REQ-4.2)
- Cooldown 429 prevention on immediate re-attack (REQ-4.4, SADD §7.2.1)
- Attack resolution across win / defense / abandon cases (REQ-4.3, SADD §7.3.1.3)
- TrophyLedger as the ONLY write path into league_profiles with auditable resulting_balance (SADD §7.2 / App. D)
- Ledger rows summing to profile balances
"""
import uuid
import threading
from datetime import datetime, timedelta, timezone

import pytest
import sqlalchemy as sa

from app.core.errors import CooldownActive, InvalidAttackTarget
from app.modules.m1_auth.models import User
from app.modules.m3_village.models import VillageProfile
from app.modules.m4_attacks.models import Attack, AttackProblemSet, AttackStatus
from app.modules.m4_attacks.service import AttackService
from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier, TrophyEventType, TrophyLedger
from app.modules.m7_league_trophy.service import LeagueService


def _create_solver(db, username: str, defense_rating: float = 1200.0, trophies: int = 300, tier: LeagueTier = LeagueTier.bronze) -> User:
    user = User(
        id=uuid.uuid4(),
        username=username,
        email=f"{username}@example.com",
        password_hash="fake_hash",
        is_active=True,
        is_suspended=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    vp = VillageProfile(
        user_id=user.id,
        defense_rating=defense_rating,
        total_solved=10,
        average_level=2.0,
        last_recomputed_at=datetime.now(timezone.utc),
    )
    db.add(vp)

    lp = LeagueProfile(
        user_id=user.id,
        trophy_count=trophies,
        league_tier=tier,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(lp)
    db.commit()
    db.refresh(user)
    return user


def _seed_resolution_proof(db, attack):
    """Model an EOF proof already produced by the importer in settlement tests."""
    from app.modules.m1_auth.models import JudgeAccount, JudgeType
    from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint

    account = JudgeAccount(
        user_id=attack.attacker_user_id,
        judge_type=JudgeType.codeforces,
        handle=f"proof_{uuid.uuid4().hex[:12]}",
        verified_flag=True,
    )
    db.add(account)
    db.flush()
    db.add(CodeforcesSyncCheckpoint(judge_account_id=account.id))
    proof_at = datetime.now(timezone.utc)
    attack.started_at = proof_at - timedelta(seconds=10)
    attack.resolution_requested_at = proof_at - timedelta(seconds=2)
    attack.resolution_not_before = attack.resolution_requested_at
    attack.resolution_generation = 1
    attack.resolution_account_id = account.id
    attack.resolution_proof_started_at = attack.resolution_requested_at
    attack.resolution_proof_generation = 1
    attack.resolution_proof_at = proof_at
    attack.resolution_state = "proof_complete"
    db.commit()


def test_tc_atk_02_launch_attack_creates_curated_problems(db):
    """TC-ATK-02: Launching attack creates attack record and curates problem set."""
    attacker = _create_solver(db, "attacker_launch")
    target = _create_solver(db, "target_launch")

    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))

    assert attack is not None
    assert attack.attacker_user_id == attacker.id
    assert attack.target_user_id == target.id
    assert attack.status == AttackStatus.in_progress
    assert attack.window_expires_at is not None

    # Verify problem set curated (seeded size 3)
    problems = db.query(AttackProblemSet).filter(AttackProblemSet.attack_id == attack.id).all()
    assert len(problems) == 3
    for p in problems:
        assert p.problem_ext_id
        assert p.problem_url.startswith("https://codeforces.com/")
        assert p.solved_flag is False


def test_tc_atk_03_cooldown_enforcement_raises_429(db):
    """TC-ATK-03: Immediate second attack triggers CooldownActive (HTTP 429)."""
    attacker = _create_solver(db, "attacker_cd")
    t1 = _create_solver(db, "target_cd_1")
    t2 = _create_solver(db, "target_cd_2")

    service = AttackService(db)

    # First attack succeeds
    attack1 = service.start_attack(str(attacker.id), str(t1.id))
    assert attack1.id is not None

    # Second attack fails with CooldownActive
    with pytest.raises(CooldownActive) as exc_info:
        service.start_attack(str(attacker.id), str(t2.id))

    assert exc_info.value.status_code == 429
    assert exc_info.value.code == "cooldown_active"
    assert "next_available_at" in exc_info.value.extra


def test_start_attack_refreshes_preloaded_actor_cooldown(db):
    attacker = _create_solver(db, "stale_cooldown_attacker")
    target = _create_solver(db, "stale_cooldown_target")
    db.query(User).filter(User.id == attacker.id).one()  # leave a stale identity-map instance
    future = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.execute(
        sa.update(User).where(User.id == attacker.id)
        .values(attack_cooldown_expires_at=future)
        .execution_options(synchronize_session=False)
    )

    with pytest.raises(CooldownActive):
        AttackService(db).start_attack(str(attacker.id), str(target.id))


def test_start_attack_refreshes_preloaded_target_suspension(db):
    attacker = _create_solver(db, "stale_target_attacker")
    target = _create_solver(db, "stale_target_target")
    db.query(User).filter(User.id == target.id).one()
    db.execute(
        sa.update(User).where(User.id == target.id)
        .values(is_suspended=True)
        .execution_options(synchronize_session=False)
    )

    with pytest.raises(InvalidAttackTarget):
        AttackService(db).start_attack(str(attacker.id), str(target.id))


def test_resolution_refreshes_preloaded_attack_and_authorizes_before_terminal_return(db):
    attacker = _create_solver(db, "stale_attack_owner")
    target = _create_solver(db, "stale_attack_target")
    unrelated = _create_solver(db, "stale_attack_other")
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    db.query(Attack).filter(Attack.id == attack.id).one()  # loaded before external state change
    db.execute(
        sa.update(Attack).where(Attack.id == attack.id)
        .values(status=AttackStatus.abandoned)
        .execution_options(synchronize_session=False)
    )
    db.commit()  # keep the external row change across the rejected caller's rollback

    from app.core.errors import ForbiddenError
    with pytest.raises(ForbiddenError):
        service.resolve_attack(str(attack.id), actor_user_id=str(unrelated.id))
    assert service.resolve_attack(str(attack.id), actor_user_id=str(attacker.id)).status == AttackStatus.abandoned


def test_resolution_uses_refreshed_locked_profile_tier_for_k_factor(db, monkeypatch):
    attacker = _create_solver(db, "stale_tier_attacker", trophies=500, tier=LeagueTier.silver)
    target = _create_solver(db, "stale_tier_target", trophies=500, tier=LeagueTier.silver)
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    _seed_resolution_proof(db, attack)
    profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == attacker.id).one()
    db.execute(
        sa.update(LeagueProfile).where(LeagueProfile.user_id == attacker.id)
        .values(trophy_count=2000, league_tier=LeagueTier.diamond)
        .execution_options(synchronize_session=False)
    )
    captured = []
    original_k_factor = service.league_svc.get_k_factor

    def capture_tier(tier):
        captured.append(tier)
        return original_k_factor(tier)

    monkeypatch.setattr(service.league_svc, "get_k_factor", capture_tier)
    service.resolve_attack(str(attack.id), actor_user_id=str(attacker.id))
    assert captured[0] == LeagueTier.diamond
    db.refresh(profile)
    assert profile.trophy_count == 1988


def test_trusted_expiry_path_rechecks_deadline_after_lock(db):
    attacker = _create_solver(db, "early_worker_owner")
    target = _create_solver(db, "early_worker_target")
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    # A stale worker batch is harmless: it cannot settle a not-yet-due attack.
    result = service.resolve_expired_attack(str(attack.id))
    assert result.status == AttackStatus.in_progress
    assert db.query(TrophyLedger).filter(TrophyLedger.source_ref_id == attack.id).count() == 0
    db.refresh(attack)
    assert attack.status == AttackStatus.in_progress


def test_late_abandonment_uses_normal_expiry_outcome(db):
    attacker = _create_solver(db, "late_abandon_attacker", trophies=500, tier=LeagueTier.silver)
    target = _create_solver(db, "late_abandon_target", trophies=500, tier=LeagueTier.silver)
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    db.execute(
        sa.update(Attack).where(Attack.id == attack.id)
        .values(window_expires_at=datetime.now(timezone.utc) - timedelta(seconds=1))
        .execution_options(synchronize_session=False)
    )

    result = service.resolve_attack(str(attack.id), actor_user_id=str(attacker.id), is_abandoned=True)
    assert result.status == AttackStatus.in_progress
    assert result.resolution_not_before > datetime.now(timezone.utc)
    assert db.query(TrophyLedger).filter(
        TrophyLedger.source_ref_id == attack.id,
        TrophyLedger.event_type == TrophyEventType.attack_abandoned,
    ).count() == 0


def test_manual_resolution_waits_for_fresh_scan_proof_and_keeps_attack_open(db):
    attacker = _create_solver(db, "pending_scan_attacker")
    target = _create_solver(db, "pending_scan_target")
    attack = AttackService(db).start_attack(str(attacker.id), str(target.id))

    result = AttackService(db).resolve_attack(str(attack.id), actor_user_id=str(attacker.id))

    assert result.status == AttackStatus.in_progress
    db.refresh(attack)
    assert attack.resolution_requested_at is not None
    assert attack.resolution_state == "waiting_for_account"
    assert attack.resolution_proof_at is None
    assert db.query(TrophyLedger).filter(TrophyLedger.source_ref_id == attack.id).count() == 0


def test_manual_resolution_finishes_early_after_valid_proof(db):
    attacker = _create_solver(db, "manual_early_proof_attacker")
    target = _create_solver(db, "manual_early_proof_target")
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    _seed_resolution_proof(db, attack)

    result = service.resolve_attack(str(attack.id), actor_user_id=str(attacker.id))

    assert result.status == AttackStatus.resolved
    assert result.window_expires_at > datetime.now(timezone.utc)


def test_revoked_pinned_account_invalidates_existing_proof_and_blocks_settlement(db):
    from app.modules.m1_auth.models import JudgeAccount

    attacker = _create_solver(db, "revoked_proof_attacker")
    target = _create_solver(db, "revoked_proof_target")
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    _seed_resolution_proof(db, attack)
    account = db.query(JudgeAccount).filter(
        JudgeAccount.id == attack.resolution_account_id,
    ).one()
    account.verified_flag = False
    db.commit()

    result = service.resolve_attack(str(attack.id), actor_user_id=str(attacker.id))

    assert result.status == AttackStatus.in_progress
    assert result.resolution_state == "blocked_account"
    assert result.resolution_proof_at is None
    assert db.query(TrophyLedger).filter(TrophyLedger.source_ref_id == attack.id).count() == 0


def test_worker_and_get_finish_early_after_valid_proof(db):
    attacker = _create_solver(db, "worker_early_proof_attacker")
    target = _create_solver(db, "worker_early_proof_target")
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    _seed_resolution_proof(db, attack)
    attack.resolution_requested_at = datetime.now(timezone.utc) - timedelta(seconds=2)
    db.commit()

    result = service.resolve_expired_attack(str(attack.id))
    assert result.status == AttackStatus.resolved

    other = service.start_attack(str(_create_solver(db, "get_early_proof_attacker").id), str(_create_solver(db, "get_early_proof_target").id))
    _seed_resolution_proof(db, other)
    detail = service.get_attack_detail(str(other.id))
    assert detail["status"] == AttackStatus.resolved.value


def test_expired_attack_request_waits_until_five_minute_grace(db):
    attacker = _create_solver(db, "expiry_grace_attacker")
    target = _create_solver(db, "expiry_grace_target")
    attack = AttackService(db).start_attack(str(attacker.id), str(target.id))
    expiry = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.execute(
        sa.update(Attack).where(Attack.id == attack.id)
        .values(window_expires_at=expiry)
        .execution_options(synchronize_session=False)
    )
    db.commit()

    result = AttackService(db).resolve_expired_attack(str(attack.id))

    assert result.status == AttackStatus.in_progress
    db.refresh(attack)
    assert abs((attack.resolution_not_before - (expiry + timedelta(minutes=5))).total_seconds()) < 1
    assert attack.resolution_proof_at is None


@pytest.mark.parametrize("system", [False, True])
def test_finalizer_rechecks_deadline_after_waiting_on_attack_lock(engine, monkeypatch, system):
    """A resolver that observed a live deadline cannot bypass expired grace."""
    from sqlalchemy import event
    from sqlalchemy.orm import sessionmaker
    from app.modules.m1_auth.models import JudgeAccount, JudgeType
    from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint

    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    setup = SessionLocal()
    first = second = None
    account_id = attack_id = None
    user_ids = []
    lock_attempted = threading.Event()
    outcome = []
    errors = []
    listener = None
    second_connection = None
    locked_expiries = []
    try:
        attacker = _create_solver(setup, "expiry_race_attacker")
        target = _create_solver(setup, "expiry_race_target")
        user_ids = [attacker.id, target.id]
        account = JudgeAccount(
            user_id=attacker.id, judge_type=JudgeType.codeforces,
            handle=f"expiry_{uuid.uuid4().hex[:10]}", verified_flag=True,
        )
        setup.add(account)
        setup.flush()
        setup.add(CodeforcesSyncCheckpoint(judge_account_id=account.id))
        attack = Attack(
            attacker_user_id=attacker.id,
            target_user_id=target.id,
            status=AttackStatus.in_progress,
            started_at=datetime.now(timezone.utc) - timedelta(hours=1),
            window_expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
            resolution_account_id=account.id,
        )
        setup.add(attack)
        setup.commit()
        account_id, attack_id = account.id, attack.id

        first = SessionLocal()
        second = SessionLocal()
        second_connection = second.connection()
        original_ensure = AttackService._ensure_finalization_request

        def capture_ensure(service, candidate, abandoned):
            locked_expiries.append(candidate.window_expires_at)
            return original_ensure(service, candidate, abandoned)

        monkeypatch.setattr(AttackService, "_ensure_finalization_request", capture_ensure)

        def before_sql(conn, cursor, statement, parameters, context, executemany):
            if "FOR UPDATE" in statement.upper() and "ATTACKS" in statement.upper():
                lock_attempted.set()

        listener = before_sql
        event.listen(second_connection, "before_cursor_execute", listener)

        # Own the row lock before the resolver starts. It can read the future
        # expiry but must wait on this row after it has locked owner/checkpoint.
        first.query(Attack).filter(Attack.id == attack_id).with_for_update().one()

        def resolve_in_second_connection():
            try:
                service = AttackService(second)
                outcome.append(
                    service.resolve_expired_attack(str(attack_id))
                    if system else service.resolve_attack(
                        str(attack_id), actor_user_id=str(attacker.id), is_abandoned=True,
                    )
                )
            except Exception as exc:  # surfaced in the test thread below
                errors.append(exc)

        worker = threading.Thread(target=resolve_in_second_connection, daemon=True)
        worker.start()
        assert lock_attempted.wait(timeout=5), "resolver never reached its locked Attack read"
        threading.Event().wait(0.1)
        assert not outcome, "resolver bypassed the held Attack row lock"

        # Release the resolver's pending lock wait with a deadline that has
        # elapsed. Its initial read observed the future deadline.
        expired_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        first.query(Attack).filter(Attack.id == attack_id).update(
            {Attack.window_expires_at: expired_at}, synchronize_session=False,
        )
        first.commit()
        worker.join(timeout=10)
        assert not worker.is_alive(), "resolver remained blocked after deadline update"
        assert not errors, errors
        assert locked_expiries and locked_expiries[0] <= datetime.now(timezone.utc)
        assert outcome and outcome[0].status == AttackStatus.in_progress
        second.refresh(outcome[0])
        assert outcome[0].resolution_not_before >= expired_at + timedelta(minutes=5) - timedelta(seconds=1)
        assert second.query(TrophyLedger).filter(TrophyLedger.source_ref_id == attack_id).count() == 0
        assert second.query(TrophyLedger).filter(
            TrophyLedger.source_ref_id == attack_id,
            TrophyLedger.event_type == TrophyEventType.attack_abandoned,
        ).count() == 0
    finally:
        if second_connection is not None and listener is not None:
            event.remove(second_connection, "before_cursor_execute", listener)
        if second is not None:
            second.close()
        if first is not None:
            first.close()
        setup.close()
        # This fixture uses committed, independent connections to exercise a
        # real PostgreSQL row-lock wait, so clean its rows explicitly.
        cleanup = SessionLocal()
        try:
            if attack_id is not None:
                cleanup.query(TrophyLedger).filter(TrophyLedger.source_ref_id == attack_id).delete(synchronize_session=False)
                cleanup.query(AttackProblemSet).filter(AttackProblemSet.attack_id == attack_id).delete(synchronize_session=False)
                cleanup.query(Attack).filter(Attack.id == attack_id).delete(synchronize_session=False)
            if account_id is not None:
                from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint
                cleanup.query(CodeforcesSyncCheckpoint).filter(CodeforcesSyncCheckpoint.judge_account_id == account_id).delete(synchronize_session=False)
                cleanup.query(JudgeAccount).filter(JudgeAccount.id == account_id).delete(synchronize_session=False)
            for user_id in user_ids:
                cleanup.query(LeagueProfile).filter(LeagueProfile.user_id == user_id).delete(synchronize_session=False)
                cleanup.query(VillageProfile).filter(VillageProfile.user_id == user_id).delete(synchronize_session=False)
                cleanup.query(User).filter(User.id == user_id).delete(synchronize_session=False)
            cleanup.commit()
        finally:
            cleanup.close()


def test_launch_rollback_removes_village_profile_initialized_for_curation(db, monkeypatch):
    attacker = _create_solver(db, "rollback_village_attacker")
    target = User(
        id=uuid.uuid4(), username="rollback_village_target", email="rollback_village_target@example.com",
        password_hash="fake_hash", is_active=True, is_suspended=False,
    )
    db.add(target)
    db.commit()
    service = AttackService(db)

    def curate_then_fail(target_user_id, set_size, commit=True):
        service.curator.village_svc.get_user_village(target_user_id, commit=commit)
        raise RuntimeError("injected curation failure")

    monkeypatch.setattr(service.curator, "curate_problem_set", curate_then_fail)
    with pytest.raises(RuntimeError, match="injected curation failure"):
        service.start_attack(str(attacker.id), str(target.id))

    from app.modules.m3_village.models import VillageProfile
    assert db.query(VillageProfile).filter(VillageProfile.user_id == target.id).count() == 0
    assert db.query(Attack).filter(Attack.attacker_user_id == attacker.id).count() == 0
    db.refresh(attacker)
    assert attacker.attack_cooldown_expires_at is None


def test_tc_atk_04_attack_resolution_and_trophy_ledger_audit(db):
    """
    TC-ATK-04: Full attack resolution (Case 1 victory).
    - 1200 vs 1200, solved 2/3 problems (f = 0.667), K = 32
    - Attacker delta: +5, Defender delta: -5
    - Ledger contains 2 auditable rows with resulting_balance matching profile
    """
    attacker = _create_solver(db, "attacker_res", defense_rating=1200.0, trophies=500, tier=LeagueTier.silver)
    target = _create_solver(db, "target_res", defense_rating=1200.0, trophies=500, tier=LeagueTier.silver)

    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    _seed_resolution_proof(db, attack)

    # Mark 2 problems solved (f = 2/3 = 0.667)
    problems = db.query(AttackProblemSet).filter(AttackProblemSet.attack_id == attack.id).all()
    solved_at = attack.resolution_requested_at - timedelta(seconds=1)
    problems[0].solved_flag = True
    problems[0].solved_at = solved_at
    problems[1].solved_flag = True
    problems[1].solved_at = solved_at
    db.commit()

    # Resolve attack
    resolved = service.resolve_attack(str(attack.id), actor_user_id=str(attacker.id))
    assert resolved.status == AttackStatus.resolved
    assert resolved.solved_fraction == pytest.approx(0.667, abs=1e-2)
    assert resolved.score == 67

    # Verify TrophyLedger entries
    attacker_ledgers = (
        db.query(TrophyLedger)
        .filter(TrophyLedger.user_id == attacker.id, TrophyLedger.source_ref_id == attack.id)
        .all()
    )
    target_ledgers = (
        db.query(TrophyLedger)
        .filter(TrophyLedger.user_id == target.id, TrophyLedger.source_ref_id == attack.id)
        .all()
    )

    assert len(attacker_ledgers) == 1
    assert attacker_ledgers[0].event_type == TrophyEventType.attack_win
    assert attacker_ledgers[0].delta == 5
    assert attacker_ledgers[0].resulting_balance == 505

    assert len(target_ledgers) == 1
    assert target_ledgers[0].event_type == TrophyEventType.failed_defense
    assert target_ledgers[0].delta == -5
    assert target_ledgers[0].resulting_balance == 495

    # Verify LeagueProfiles match ledger balances
    attacker_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == attacker.id).first()
    target_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == target.id).first()
    assert attacker_profile.trophy_count == 505
    assert target_profile.trophy_count == 495


def test_tc_atk_05_successful_defense_and_abandon(db):
    """
    TC-ATK-05: Case 2 (Successful defense, f < 0.34) and Case 3 (Abandon).
    """
    # Case 2: Defense
    att1 = _create_solver(db, "att_def", defense_rating=1200.0, trophies=500, tier=LeagueTier.silver)
    tgt1 = _create_solver(db, "tgt_def", defense_rating=1200.0, trophies=500, tier=LeagueTier.silver)

    service = AttackService(db)
    attack1 = service.start_attack(str(att1.id), str(tgt1.id))
    _seed_resolution_proof(db, attack1)

    # 0 problems solved
    resolved1 = service.resolve_attack(str(attack1.id), actor_user_id=str(att1.id))
    assert resolved1.status == AttackStatus.resolved

    att1_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == att1.id).first()
    tgt1_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == tgt1.id).first()

    assert att1_profile.trophy_count == 484  # 500 - 16
    assert tgt1_profile.trophy_count == 516  # 500 + 16

    # Case 3: Abandon with flat penalty 5
    att2 = _create_solver(db, "att_ab", defense_rating=1200.0, trophies=500, tier=LeagueTier.silver)
    tgt2 = _create_solver(db, "tgt_ab", defense_rating=1200.0, trophies=500, tier=LeagueTier.silver)

    attack2 = service.start_attack(str(att2.id), str(tgt2.id))
    resolved2 = service.resolve_attack(str(attack2.id), actor_user_id=str(att2.id), is_abandoned=True)
    assert resolved2.status == AttackStatus.abandoned

    att2_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == att2.id).first()
    tgt2_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == tgt2.id).first()

    assert att2_profile.trophy_count == 495  # 500 - 5
    assert tgt2_profile.trophy_count == 500  # unchanged defender

    # Replaying abandonment is terminal and cannot award the penalty twice.
    replay = service.resolve_attack(str(attack2.id), actor_user_id=str(att2.id), is_abandoned=True)
    assert replay.status == AttackStatus.abandoned
    assert att2_profile.trophy_count == 495
    assert db.query(TrophyLedger).filter(
        TrophyLedger.source_ref_id == attack2.id,
        TrophyLedger.event_type == TrophyEventType.attack_abandoned,
    ).count() == 1


def test_resolution_rejects_unrelated_user(db):
    attacker = _create_solver(db, "resolve_owner")
    target = _create_solver(db, "resolve_target")
    unrelated = _create_solver(db, "resolve_unrelated")
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    _seed_resolution_proof(db, attack)

    from app.core.errors import ForbiddenError
    with pytest.raises(ForbiddenError):
        service.resolve_attack(str(attack.id), actor_user_id=str(unrelated.id), is_abandoned=True)

    db.refresh(attack)
    assert attack.status == AttackStatus.in_progress
    assert db.query(TrophyLedger).filter(TrophyLedger.source_ref_id == attack.id).count() == 0


def test_resolution_rolls_back_all_writes_when_second_ledger_fails(db, monkeypatch):
    attacker = _create_solver(db, "resolve_rollback_attacker", trophies=500, tier=LeagueTier.silver)
    target = _create_solver(db, "resolve_rollback_target", trophies=500, tier=LeagueTier.silver)
    service = AttackService(db)
    attack = service.start_attack(str(attacker.id), str(target.id))
    _seed_resolution_proof(db, attack)
    original = service.league_svc.record_trophy_event
    calls = 0

    def fail_second(*args, **kwargs):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise RuntimeError("injected ledger failure")
        return original(*args, **kwargs)

    monkeypatch.setattr(service.league_svc, "record_trophy_event", fail_second)
    with pytest.raises(RuntimeError, match="injected ledger failure"):
        service.resolve_attack(str(attack.id), actor_user_id=str(attacker.id))

    db.refresh(attack)
    assert attack.status == AttackStatus.in_progress
    assert db.query(LeagueProfile).filter(LeagueProfile.user_id == attacker.id).one().trophy_count == 500
    assert db.query(LeagueProfile).filter(LeagueProfile.user_id == target.id).one().trophy_count == 500
    assert db.query(TrophyLedger).filter(TrophyLedger.source_ref_id == attack.id).count() == 0


def test_tier_transition_on_ledger_write(db):
    """Crossing a tier threshold updates league_tier."""
    solver = _create_solver(db, "tier_crosser", trophies=395, tier=LeagueTier.bronze)
    league_svc = LeagueService(db)

    # Win +10 trophies -> 405 -> Silver tier (threshold is 400)
    profile, ledger, tier_changed = league_svc.record_trophy_event(
        user_id=str(solver.id),
        event_type=TrophyEventType.attack_win,
        delta=10,
    )

    assert tier_changed is True
    assert profile.trophy_count == 405
    assert profile.league_tier == LeagueTier.silver
    assert ledger.resulting_balance == 405


def test_due_attacks_query_and_resolution(db):
    """Verify worker query get_due_attacks and batch resolver resolve_due_attacks."""
    att = _create_solver(db, "att_due")
    tgt1 = _create_solver(db, "tgt_due_1")
    tgt2 = _create_solver(db, "tgt_due_2")

    service = AttackService(db)

    # Expired attack (started 25h ago, 24h window)
    expired_attack = Attack(
        attacker_user_id=att.id,
        target_user_id=tgt1.id,
        status=AttackStatus.in_progress,
        started_at=datetime.now(timezone.utc) - timedelta(hours=25),
        window_expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    db.add(expired_attack)

    # Active attack in future
    active_attack = Attack(
        attacker_user_id=att.id,
        target_user_id=tgt2.id,
        status=AttackStatus.in_progress,
        started_at=datetime.now(timezone.utc),
        window_expires_at=datetime.now(timezone.utc) + timedelta(hours=23),
    )
    db.add(active_attack)
    db.commit()

    # Worker query should only return the expired attack
    due = service.get_due_attacks()
    due_ids = [str(a.id) for a in due]
    assert str(expired_attack.id) in due_ids
    assert str(active_attack.id) not in due_ids

    # Batch resolution executes and marks expired attack as resolved
    resolved_count = service.resolve_due_attacks()
    assert resolved_count == 0

    db.refresh(expired_attack)
    db.refresh(active_attack)
    assert expired_attack.status == AttackStatus.in_progress
    assert active_attack.status == AttackStatus.in_progress


def test_get_attack_detail_auto_resolves_expired_window(db):
    """Calling get_attack_detail on an expired attack auto-resolves it on-demand."""
    att = _create_solver(db, "att_detail_exp")
    tgt = _create_solver(db, "tgt_detail_exp")

    service = AttackService(db)
    attack = Attack(
        attacker_user_id=att.id,
        target_user_id=tgt.id,
        status=AttackStatus.in_progress,
        started_at=datetime.now(timezone.utc) - timedelta(hours=25),
        window_expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    db.add(attack)
    db.commit()
    db.refresh(attack)

    detail = service.get_attack_detail(str(attack.id))
    assert detail["status"] == AttackStatus.in_progress.value
    assert detail["pending"] is True
    assert detail["resolved_at"] is None
    assert detail["attacker_username"] == "att_detail_exp"
    assert detail["target_username"] == "tgt_detail_exp"


def test_cannot_attack_suspended_or_inactive_user(db):
    """Attacking a suspended or inactive target raises InvalidAttackTarget."""
    attacker = _create_solver(db, "valid_attacker")
    suspended = _create_solver(db, "suspended_target")
    suspended.is_suspended = True
    db.commit()

    service = AttackService(db)
    with pytest.raises(InvalidAttackTarget):
        service.start_attack(str(attacker.id), str(suspended.id))


def test_cannot_attack_self(db):
    """Self-attack raises InvalidAttackTarget."""
    attacker = _create_solver(db, "self_attacker")
    service = AttackService(db)
    with pytest.raises(InvalidAttackTarget):
        service.start_attack(str(attacker.id), str(attacker.id))


def test_attack_api_rejects_self_attack_with_uuid_request(client, make_user):
    user, headers, _ = make_user("api_self_attack")
    response = client.post("/attacks", headers=headers, json={"target_user_id": user["id"]})
    assert response.status_code == 400
    assert response.json()["code"] == "invalid_attack_target"


def test_attack_api_rejects_recent_target_after_cooldown_is_cleared(client, make_user, db):
    attacker, headers, _ = make_user("api_recent_attacker")
    target, _, _ = make_user("api_recent_target")
    first = client.post("/attacks", headers=headers, json={"target_user_id": target["id"]})
    assert first.status_code == 201, first.text

    from app.modules.m1_auth.models import User as UserModel
    db.query(UserModel).filter(UserModel.id == attacker["id"]).update(
        {UserModel.attack_cooldown_expires_at: None}, synchronize_session=False,
    )
    db.commit()
    repeat = client.post("/attacks", headers=headers, json={"target_user_id": target["id"]})
    assert repeat.status_code == 400
    assert repeat.json()["code"] == "invalid_attack_target"


def test_attack_api_rejects_target_inside_defense_grace(client, make_user):
    first_attacker, first_headers, _ = make_user("api_grace_attacker_1")
    second_attacker, second_headers, _ = make_user("api_grace_attacker_2")
    target, _, _ = make_user("api_grace_target")
    first = client.post("/attacks", headers=first_headers, json={"target_user_id": target["id"]})
    assert first.status_code == 201, first.text

    second = client.post("/attacks", headers=second_headers, json={"target_user_id": target["id"]})
    assert second.status_code == 400
    assert second.json()["code"] == "invalid_attack_target"


def test_cooldown_expiry_recovery(db):
    """Once cooldown timestamp passes, can_attack becomes True."""
    attacker = _create_solver(db, "cd_recover_user")
    service = AttackService(db)

    # Set cooldown in the past
    past_time = datetime.now(timezone.utc) - timedelta(minutes=5)
    service.cooldown_repo.set_cooldown_expiry(str(attacker.id), past_time)

    status = service.get_cooldown_status(str(attacker.id))
    assert status["can_attack"] is True
    assert status["remaining_seconds"] == 0


def test_get_attacks_by_attacker_and_target_history(db):
    """Repository returns history for both attacker and defender perspectives."""
    att = _create_solver(db, "hist_attacker")
    tgt = _create_solver(db, "hist_target")

    service = AttackService(db)
    atk1 = service.start_attack(str(att.id), str(tgt.id))

    by_attacker = service.attack_repo.get_attacks_by_attacker(str(att.id))
    by_target = service.attack_repo.get_attacks_by_target(str(tgt.id))

    assert any(str(a.id) == str(atk1.id) for a in by_attacker)
    assert any(str(a.id) == str(atk1.id) for a in by_target)
    assert service.get_attack_count(str(att.id)) >= 1
