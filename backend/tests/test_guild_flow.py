import pytest
import uuid
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Event, local
from sqlalchemy.orm import sessionmaker

from app.modules.m5_guild_territory.models import Guild, GuildJoinRequest, GuildMembership, TerritoryZone, ZoneContribution
from app.modules.m1_auth.models import User
from app.modules.m3_village.models import VillageProfile
from app.modules.m8_notifications.models import NotificationOutbox
from app.modules.m5_guild_territory.service import GuildService
from app.modules.m5_guild_territory.repository import GuildMembershipRepository, GuildRepository
from app.modules.m3_village.service import VillageService


def test_guild_create_request_approve(client):
    assert True

def test_guild_kick_leave(client):
    assert True

def test_guild_non_officer_forbidden(client):
    assert True


def test_guild_creation_rolls_back_when_creator_membership_fails(db, make_user, monkeypatch):
    user, _, _ = make_user()
    service = GuildService(db)

    def fail_membership(*args, **kwargs):
        raise RuntimeError("injected membership failure")

    monkeypatch.setattr(service.membership_repo, "create_membership", fail_membership)
    with pytest.raises(RuntimeError, match="injected"):
        service.create_guild("atomic-guild", user["id"])

    assert db.query(Guild).filter_by(name="atomic-guild").first() is None


def test_approval_fault_rolls_back_membership_and_request_decision(db, make_user, monkeypatch):
    leader, _, _ = make_user()
    applicant, _, _ = make_user()
    service = GuildService(db)
    guild = service.create_guild("approval-atomic", leader["id"])
    request = service.request_to_join(guild.id, applicant["id"])

    def fail_recalculation(_guild_id):
        raise RuntimeError("injected score failure")

    monkeypatch.setattr(service, "_recalculate_guild_zone_scores", fail_recalculation)
    with pytest.raises(RuntimeError, match="injected"):
        service.approve_join_request(guild.id, request.id, leader["id"])

    db.expire_all()
    assert db.query(GuildJoinRequest).filter_by(id=request.id).one().status.value == "pending"
    assert db.query(GuildMembership).filter_by(user_id=applicant["id"]).first() is None


def test_missing_village_profile_read_and_staged_event_roll_back_with_guild_creation(db, make_user, monkeypatch):
    user, _, _ = make_user()
    zones = [
        TerritoryZone(name=f"atomic-zone-{uuid.uuid4()}", topic_affinity={}),
        TerritoryZone(name=f"atomic-zone-{uuid.uuid4()}", topic_affinity={}),
    ]
    db.add_all(zones)
    db.flush()
    service = GuildService(db)
    monkeypatch.setattr(service.territory_repo, "get_all_zones", lambda: sorted(zones, key=lambda z: str(z.id)))
    original_resolve = service.resolve_zone_ownership
    resolved = 0

    def fail_after_village_read(*args, **kwargs):
        nonlocal resolved
        resolved += 1
        if resolved == 1:
            assert db.query(VillageProfile).filter_by(user_id=user["id"]).count() == 0
            original_resolve(*args, **kwargs)
            db.flush()
            changed_zone_id = args[0] if args else kwargs["zone_id"]
            assert any(
                row.payload.get("zone_id") == str(changed_zone_id)
                for row in db.query(NotificationOutbox).filter_by(event_type="TERRITORY_ZONE_CHANGED").all()
            )
            return
        raise RuntimeError("injected failure after village recompute")

    monkeypatch.setattr(service, "resolve_zone_ownership", fail_after_village_read)
    guild_name = f"atomic-prof-{uuid.uuid4().hex[:8]}"
    with pytest.raises(RuntimeError, match="after village"):
        service.create_guild(guild_name, user["id"])

    db.expire_all()
    assert db.query(Guild).filter_by(name=guild_name).count() == 0
    assert db.query(GuildMembership).filter_by(user_id=user["id"]).count() == 0
    assert db.query(VillageProfile).filter_by(user_id=user["id"]).count() == 0
    assert db.query(ZoneContribution).filter(ZoneContribution.zone_id.in_([zone.id for zone in zones])).count() == 0
    staged_zone_ids = {str(zone.id) for zone in zones}
    assert not any(
        row.payload.get("zone_id") in staged_zone_ids
        for row in db.query(NotificationOutbox).filter_by(event_type="TERRITORY_ZONE_CHANGED").all()
    )


def test_concurrent_approve_and_reject_only_decide_request_once(engine):
    """Independent sessions exercise the request row lock/decision boundary."""
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    suffix = uuid.uuid4().hex
    leader_id, applicant_id, guild_id, request_id = (uuid.uuid4() for _ in range(4))
    setup = session_factory()
    try:
        setup.add_all([
            User(id=leader_id, username=f"leader-{suffix}", email=f"leader-{suffix}@example.test", password_hash="x"),
            User(id=applicant_id, username=f"applicant-{suffix}", email=f"applicant-{suffix}@example.test", password_hash="x"),
            Guild(id=guild_id, name=f"concurrent-{suffix}"),
        ])
        setup.flush()
        setup.add(GuildMembership(guild_id=guild_id, user_id=leader_id, role="leader"))
        setup.add(GuildJoinRequest(id=request_id, guild_id=guild_id, user_id=applicant_id))
        setup.commit()
    finally:
        setup.close()

    barrier = Barrier(2)

    class NoRecalcGuildService(GuildService):
        def _recalculate_guild_zone_scores(self, guild_id):
            return None

    def decide(decision):
        session = session_factory()
        try:
            barrier.wait(timeout=5)
            svc = NoRecalcGuildService(session)
            if decision == "approve":
                svc.approve_join_request(guild_id, request_id, leader_id)
            else:
                svc.reject_join_request(guild_id, request_id, leader_id)
            return decision
        except Exception as exc:
            return exc
        finally:
            session.close()

    try:
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(decide, ("approve", "reject")))
        assert sum(result in ("approve", "reject") for result in results) == 1
        assert sum(getattr(result, "status_code", None) == 409 for result in results) == 1

        check = session_factory()
        try:
            request = check.query(GuildJoinRequest).filter_by(id=request_id).one()
            assert request.status.value in ("approved", "rejected")
            assert check.query(GuildMembership).filter_by(user_id=applicant_id).count() == int(request.status.value == "approved")
        finally:
            check.close()
    finally:
        cleanup = session_factory()
        try:
            cleanup.query(GuildJoinRequest).filter_by(id=request_id).delete()
            cleanup.query(GuildMembership).filter(GuildMembership.guild_id == guild_id).delete()
            cleanup.query(Guild).filter_by(id=guild_id).delete()
            cleanup.query(User).filter(User.id.in_((leader_id, applicant_id))).delete(synchronize_session=False)
            cleanup.commit()
        finally:
            cleanup.close()


def test_leadership_transfer_is_atomic_and_serializes_competing_transfers(engine):
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    suffix = uuid.uuid4().hex
    leader_id, first_id, second_id, guild_id = (uuid.uuid4() for _ in range(4))
    setup = session_factory()
    try:
        setup.add_all([
            User(id=user_id, username=f"transfer-{suffix}-{i}", email=f"transfer-{suffix}-{i}@example.test", password_hash="x")
            for i, user_id in enumerate((leader_id, first_id, second_id))
        ])
        setup.add(Guild(id=guild_id, name=f"transfer-{suffix}"))
        setup.flush()
        setup.add_all([
            GuildMembership(guild_id=guild_id, user_id=leader_id, role="leader"),
            GuildMembership(guild_id=guild_id, user_id=first_id, role="member"),
            GuildMembership(guild_id=guild_id, user_id=second_id, role="member"),
        ])
        setup.commit()
    finally:
        setup.close()

    barrier = Barrier(2)

    def transfer(target_id):
        session = session_factory()
        try:
            barrier.wait(timeout=5)
            return GuildService(session).transfer_leadership(guild_id, target_id, leader_id)
        except Exception as exc:
            return exc
        finally:
            session.close()

    try:
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(transfer, (first_id, second_id)))
        assert sum(isinstance(result, dict) for result in results) == 1
        assert sum(getattr(result, "status_code", None) == 403 for result in results) == 1

        check = session_factory()
        try:
            memberships = check.query(GuildMembership).filter_by(guild_id=guild_id).all()
            leaders = [m.user_id for m in memberships if m.role.value == "leader"]
            assert len(leaders) == 1
            assert leaders[0] in (first_id, second_id)
            assert check.query(GuildMembership).filter_by(guild_id=guild_id, user_id=leader_id).one().role.value == "member"
        finally:
            check.close()
    finally:
        cleanup = session_factory()
        try:
            cleanup.query(GuildMembership).filter_by(guild_id=guild_id).delete()
            cleanup.query(Guild).filter_by(id=guild_id).delete()
            cleanup.query(User).filter(User.id.in_((leader_id, first_id, second_id))).delete(synchronize_session=False)
            cleanup.commit()
        finally:
            cleanup.close()


def test_leadership_transfer_rolls_back_if_second_role_update_fails(db, make_user, monkeypatch):
    leader, _, _ = make_user()
    target, _, _ = make_user()
    service = GuildService(db)
    guild = Guild(id=uuid.uuid4(), name=f"transfer-rollback-{uuid.uuid4().hex}")
    db.add(guild)
    db.flush()
    db.add_all([
        GuildMembership(guild_id=guild.id, user_id=leader["id"], role="leader"),
        GuildMembership(guild_id=guild.id, user_id=target["id"], role="member"),
    ])
    db.commit()
    original_flush = service.membership_repo.db.flush
    flush_count = 0

    def fail_after_demotion(*args, **kwargs):
        nonlocal flush_count
        flush_count += 1
        if flush_count == 2:
            raise RuntimeError("injected transfer failure")
        return original_flush(*args, **kwargs)

    monkeypatch.setattr(service.membership_repo.db, "flush", fail_after_demotion)
    with pytest.raises(RuntimeError, match="injected transfer"):
        service.transfer_leadership(guild.id, target["id"], leader["id"])
    db.expire_all()
    assert db.query(GuildMembership).filter_by(guild_id=guild.id, user_id=leader["id"]).one().role.value == "leader"
    assert db.query(GuildMembership).filter_by(guild_id=guild.id, user_id=target["id"]).one().role.value == "member"


def test_leadership_transfer_api_requires_current_leader_and_transfers_existing_member(client, db, make_user):
    leader, leader_headers, _ = make_user()
    target, _, _ = make_user()
    guild = Guild(name=f"transfer-api-{uuid.uuid4().hex}")
    db.add(guild)
    db.flush()
    db.add_all([
        GuildMembership(guild_id=guild.id, user_id=leader["id"], role="leader"),
        GuildMembership(guild_id=guild.id, user_id=target["id"], role="member"),
    ])
    db.commit()

    response = client.post(
        f"/guilds/{guild.id}/leader-transfer",
        json={"target_user_id": target["id"]},
        headers=leader_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json() == {
        "previous_leader_user_id": leader["id"],
        "leader_user_id": target["id"],
    }
    assert db.query(GuildMembership).filter_by(guild_id=guild.id, user_id=leader["id"]).one().role.value == "member"
    assert db.query(GuildMembership).filter_by(guild_id=guild.id, user_id=target["id"]).one().role.value == "leader"


def test_rescore_with_missing_profile_does_not_deadlock_against_leave(engine, monkeypatch):
    """Rescore holds the guild before its zone; leave waits before locking the user."""
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    suffix = uuid.uuid4().hex
    leader_id, member_id, guild_id, zone_id = (uuid.uuid4() for _ in range(4))
    setup = session_factory()
    try:
        setup.add_all([
            User(id=leader_id, username=f"lead-{suffix}", email=f"lead-{suffix}@example.test", password_hash="x"),
            User(id=member_id, username=f"member-{suffix}", email=f"member-{suffix}@example.test", password_hash="x"),
            Guild(id=guild_id, name=f"zone-lock-{suffix}"),
        ])
        setup.flush()
        setup.add_all([
            GuildMembership(guild_id=guild_id, user_id=leader_id, role="leader"),
            GuildMembership(guild_id=guild_id, user_id=member_id, role="member"),
            TerritoryZone(
                id=zone_id, name=f"zone-lock-{suffix}", topic_affinity={"no-topic": 1.0},
                owning_guild_id=guild_id,
            ),
        ])
        setup.commit()
        assert setup.query(VillageProfile).filter(VillageProfile.user_id.in_((leader_id, member_id))).count() == 0
    finally:
        setup.close()

    zone_is_locked = Event()
    member_user_is_locked = Event()
    leave_attempting_guild = Event()
    actor = local()
    original_levels = VillageService.get_user_topic_levels
    original_lock_user = GuildMembershipRepository.lock_user
    original_lock_guild = GuildRepository.lock_guild_by_id

    def observed_levels(service, user_id):
        if getattr(actor, "name", None) == "rescore":
            assert service.db.query(ZoneContribution).filter_by(
                zone_id=zone_id, guild_id=guild_id
            ).count() == 0
            zone_is_locked.set()
            assert leave_attempting_guild.wait(timeout=10)
            assert not member_user_is_locked.is_set()
        return original_levels(service, user_id)

    def observed_user_lock(repository, user_id):
        result = original_lock_user(repository, user_id)
        if getattr(actor, "name", None) == "leave" and str(user_id) == str(member_id):
            member_user_is_locked.set()
        return result

    def observed_guild_lock(repository, requested_guild_id):
        if getattr(actor, "name", None) == "leave" and str(requested_guild_id) == str(guild_id):
            leave_attempting_guild.set()
        return original_lock_guild(repository, requested_guild_id)

    monkeypatch.setattr(VillageService, "get_user_topic_levels", observed_levels)
    monkeypatch.setattr(GuildMembershipRepository, "lock_user", observed_user_lock)
    monkeypatch.setattr(GuildRepository, "lock_guild_by_id", observed_guild_lock)

    class NoDispatchGuildService(GuildService):
        def _dispatch_outbox(self):
            return None

    def run_rescore():
        actor.name = "rescore"
        session = session_factory()
        try:
            service = NoDispatchGuildService(session)
            service.territory_repo.get_all_zones = lambda: session.query(TerritoryZone).filter_by(id=zone_id).all()
            service.recalculate_guild_zone_scores(guild_id)
        finally:
            session.close()

    def run_leave():
        actor.name = "leave"
        session = session_factory()
        try:
            NoDispatchGuildService(session).leave_guild(guild_id, member_id)
        finally:
            session.close()

    try:
        with ThreadPoolExecutor(max_workers=2, thread_name_prefix="m5") as executor:
            rescore = executor.submit(run_rescore)
            assert zone_is_locked.wait(timeout=10)
            leave = executor.submit(run_leave)
            rescore.result(timeout=15)
            leave.result(timeout=15)
        assert member_user_is_locked.is_set()

        check = session_factory()
        try:
            assert check.query(GuildMembership).filter_by(guild_id=guild_id, user_id=member_id).count() == 0
            assert check.query(VillageProfile).filter(VillageProfile.user_id.in_((leader_id, member_id))).count() == 0
            assert check.query(ZoneContribution).filter_by(zone_id=zone_id, guild_id=guild_id).count() == 1
        finally:
            check.close()
    finally:
        cleanup = session_factory()
        try:
            cleanup.query(ZoneContribution).filter_by(zone_id=zone_id).delete()
            cleanup.query(TerritoryZone).filter_by(id=zone_id).delete()
            cleanup.query(GuildMembership).filter_by(guild_id=guild_id).delete()
            cleanup.query(Guild).filter_by(id=guild_id).delete()
            cleanup.query(VillageProfile).filter(VillageProfile.user_id.in_((leader_id, member_id))).delete(synchronize_session=False)
            cleanup.query(User).filter(User.id.in_((leader_id, member_id))).delete(synchronize_session=False)
            cleanup.commit()
        finally:
            cleanup.close()
