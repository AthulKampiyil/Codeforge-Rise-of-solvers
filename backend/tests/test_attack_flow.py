"""Tests for full Attack Flow & Trophy Ledger Auditability (SADD §7.2, §7.3.1.3, TC-ATK-02..05).

Validates:
- Attack launch creating attack record + 3 curated problems (REQ-4.1, REQ-4.2)
- Cooldown 429 prevention on immediate re-attack (REQ-4.4, SADD §7.2.1)
- Attack resolution across win / defense / abandon cases (REQ-4.3, SADD §7.3.1.3)
- TrophyLedger as the ONLY write path into league_profiles with auditable resulting_balance (SADD §7.2 / App. D)
- Ledger rows summing to profile balances
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest

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

    # Mark 2 problems solved (f = 2/3 = 0.667)
    problems = db.query(AttackProblemSet).filter(AttackProblemSet.attack_id == attack.id).all()
    problems[0].solved_flag = True
    problems[1].solved_flag = True
    db.commit()

    # Resolve attack
    resolved = service.resolve_attack(str(attack.id))
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

    # 0 problems solved
    resolved1 = service.resolve_attack(str(attack1.id))
    assert resolved1.status == AttackStatus.resolved

    att1_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == att1.id).first()
    tgt1_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == tgt1.id).first()

    assert att1_profile.trophy_count == 484  # 500 - 16
    assert tgt1_profile.trophy_count == 516  # 500 + 16

    # Case 3: Abandon with flat penalty 5
    att2 = _create_solver(db, "att_ab", defense_rating=1200.0, trophies=500, tier=LeagueTier.silver)
    tgt2 = _create_solver(db, "tgt_ab", defense_rating=1200.0, trophies=500, tier=LeagueTier.silver)

    attack2 = service.start_attack(str(att2.id), str(tgt2.id))
    resolved2 = service.resolve_attack(str(attack2.id), is_abandoned=True)
    assert resolved2.status == AttackStatus.abandoned

    att2_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == att2.id).first()
    tgt2_profile = db.query(LeagueProfile).filter(LeagueProfile.user_id == tgt2.id).first()

    assert att2_profile.trophy_count == 495  # 500 - 5
    assert tgt2_profile.trophy_count == 500  # unchanged defender


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
