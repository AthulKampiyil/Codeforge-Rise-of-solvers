"""Tests for League & Trophy Progression (REQ-7.x, SADD §7.2, §7.3.1.3).

Validates:
- League tier boundaries and threshold transitions
- Profile initialization with default 300 trophies & Bronze tier
- Append-only TrophyLedger auditability and balance integrity
- Global and guild-scoped leaderboard queries and rankings
- Next-tier progress percentage calculation
- Worker reconciliation pass for out-of-sync profile tiers
"""
import uuid
from datetime import datetime, timezone

import pytest

from app.modules.m1_auth.models import User
from app.modules.m5_guild_territory.models import Guild, GuildMembership, GuildRole
from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier, TrophyEventType, TrophyLedger
from app.modules.m7_league_trophy.service import LeagueService
from app.modules.m8_notifications.models import Notification, NotificationOutbox


def _create_user(db, username: str) -> User:
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
    return user


def test_league_tier_boundary_calculation(db):
    """Verify tier_for across all threshold intervals."""
    service = LeagueService(db)

    assert service.tier_for(0) == LeagueTier.bronze
    assert service.tier_for(300) == LeagueTier.bronze
    assert service.tier_for(399) == LeagueTier.bronze
    assert service.tier_for(400) == LeagueTier.silver
    assert service.tier_for(799) == LeagueTier.silver
    assert service.tier_for(800) == LeagueTier.gold
    assert service.tier_for(1299) == LeagueTier.gold
    assert service.tier_for(1300) == LeagueTier.platinum
    assert service.tier_for(1899) == LeagueTier.platinum
    assert service.tier_for(1900) == LeagueTier.diamond
    assert service.tier_for(2599) == LeagueTier.diamond
    assert service.tier_for(2600) == LeagueTier.legend
    assert service.tier_for(5000) == LeagueTier.legend


def test_league_profile_get_or_create_defaults(db):
    """New profile is created with 300 trophies and Bronze tier."""
    user = _create_user(db, "league_default_user")
    service = LeagueService(db)

    profile = service.get_or_create_profile(str(user.id))
    assert profile.user_id == user.id
    assert profile.trophy_count == 300
    assert profile.league_tier == LeagueTier.bronze

    # Idempotent fetch
    profile2 = service.get_or_create_profile(str(user.id))
    assert profile2.user_id == profile.user_id


def test_league_ledger_history_and_auditability(db):
    """Trophy ledger rows record delta, resulting_balance, and source ref."""
    user = _create_user(db, "ledger_audit_user")
    service = LeagueService(db)

    # Initial: 300 trophies
    p1, l1, _ = service.record_trophy_event(
        user_id=str(user.id),
        event_type=TrophyEventType.attack_win,
        delta=25,
    )
    assert p1.trophy_count == 325
    assert l1.delta == 25
    assert l1.resulting_balance == 325
    assert l1.event_type == TrophyEventType.attack_win

    # Second event: Loss -10
    p2, l2, _ = service.record_trophy_event(
        user_id=str(user.id),
        event_type=TrophyEventType.attack_loss,
        delta=-10,
    )
    assert p2.trophy_count == 315
    assert l2.delta == -10
    assert l2.resulting_balance == 315

    # Retrieve history
    history = service.get_ledger_history(str(user.id))
    assert len(history) == 2
    assert history[0]["resulting_balance"] == 315
    assert history[1]["resulting_balance"] == 325


def test_trophy_cannot_drop_below_zero(db):
    """Trophy balance is bounded below at 0."""
    user = _create_user(db, "zero_clamp_user")
    service = LeagueService(db)

    # User starts at 300, deduct 500 -> 0
    p, l, _ = service.record_trophy_event(
        user_id=str(user.id),
        event_type=TrophyEventType.attack_loss,
        delta=-500,
    )
    assert p.trophy_count == 0
    assert l.resulting_balance == 0


def test_trophy_event_commit_rolls_back_balance_when_ledger_append_fails(db, monkeypatch):
    user = _create_user(db, "ledger_rollback_user")
    service = LeagueService(db)
    profile = service.profile_repo.create(str(user.id), trophy_count=500, tier=LeagueTier.silver)

    def fail_append(**kwargs):
        raise RuntimeError("injected ledger write failure")

    monkeypatch.setattr(service.ledger_repo, "append", fail_append)
    with pytest.raises(RuntimeError, match="injected ledger write failure"):
        service.record_trophy_event(
            user_id=str(user.id), event_type=TrophyEventType.attack_win, delta=25,
        )

    db.refresh(profile)
    assert profile.trophy_count == 500
    assert db.query(TrophyLedger).filter(TrophyLedger.user_id == user.id).count() == 0


def test_trophy_ledger_partial_unique_index_metadata_matches_migration():
    index = next(
        index for index in TrophyLedger.__table__.indexes
        if index.name == "uq_trophy_ledger_source_event_user"
    )
    assert index.unique is True
    assert [column.name for column in index.columns] == ["source_ref_id", "event_type", "user_id"]


def test_league_leaderboard_ordering_and_ranks(db):
    """Leaderboard ranks users by trophy count descending."""
    u1 = _create_user(db, "rank_user_1")
    u2 = _create_user(db, "rank_user_2")
    u3 = _create_user(db, "rank_user_3")

    service = LeagueService(db)
    service.profile_repo.create(str(u1.id), trophy_count=900, tier=LeagueTier.gold)
    service.profile_repo.create(str(u2.id), trophy_count=1500, tier=LeagueTier.platinum)
    service.profile_repo.create(str(u3.id), trophy_count=400, tier=LeagueTier.silver)

    lb = service.get_leaderboard(str(u1.id), scope="global", limit=10)
    user_ids = [entry["user_id"] for entry in lb]

    assert str(u2.id) in user_ids
    assert str(u1.id) in user_ids
    assert str(u3.id) in user_ids

    # u2 has most trophies -> rank should be before u1, u1 before u3
    idx_u2 = user_ids.index(str(u2.id))
    idx_u1 = user_ids.index(str(u1.id))
    idx_u3 = user_ids.index(str(u3.id))

    assert idx_u2 < idx_u1 < idx_u3
    assert lb[idx_u2]["trophy_count"] == 1500
    assert lb[idx_u2]["league_tier"] == LeagueTier.platinum.value


def test_leaderboard_global_is_public_and_exposes_only_public_fields(client, db, make_user):
    user_data, _, _ = make_user("public_leaderboard_user")
    user = db.get(User, uuid.UUID(user_data["id"]))
    LeagueService(db).profile_repo.create(str(user.id), trophy_count=900, tier=LeagueTier.gold)

    response = client.get("/league/leaderboard?scope=global")

    assert response.status_code == 200
    entry = next(row for row in response.json() if row["user_id"] == str(user.id))
    assert set(entry) == {"user_id", "username", "trophy_count", "league_tier", "rank"}


def test_leaderboard_guest_cannot_access_guild_scope(client):
    response = client.get("/league/leaderboard?scope=guild")
    assert response.status_code == 401


def test_leaderboard_guild_scope_is_limited_to_authenticated_members(client, db, make_user):
    member_data, member_headers, _ = make_user("guild_leaderboard_member")
    other_data, _, _ = make_user("guild_leaderboard_other")
    member = db.get(User, uuid.UUID(member_data["id"]))
    other = db.get(User, uuid.UUID(other_data["id"]))
    guild = Guild(id=uuid.uuid4(), name=f"leaderboard-{uuid.uuid4().hex[:8]}")
    db.add(guild)
    db.flush()
    db.add(GuildMembership(guild_id=guild.id, user_id=member.id, role=GuildRole.member))
    LeagueService(db).profile_repo.create(str(member.id), trophy_count=900, tier=LeagueTier.gold)
    LeagueService(db).profile_repo.create(str(other.id), trophy_count=1500, tier=LeagueTier.platinum)
    db.commit()

    response = client.get("/league/leaderboard?scope=guild", headers=member_headers)

    assert response.status_code == 200
    assert [row["user_id"] for row in response.json()] == [str(member.id)]


def test_leaderboard_guild_scope_rejects_guildless_user(client, make_user):
    _, headers, _ = make_user("guildless_leaderboard_user")
    response = client.get("/league/leaderboard?scope=guild", headers=headers)
    assert response.status_code == 403


def test_leaderboard_excludes_suspended_users(client, db):
    suspended = User(
        id=uuid.uuid4(),
        username="suspended_leaderboard_user",
        email="suspended_leaderboard_user@example.com",
        password_hash="fake_hash",
        is_active=True,
        is_suspended=True,
    )
    db.add(suspended)
    LeagueService(db).profile_repo.create(str(suspended.id), trophy_count=9999, tier=LeagueTier.legend)
    db.commit()

    response = client.get("/league/leaderboard?scope=global")

    assert response.status_code == 200
    assert str(suspended.id) not in {row["user_id"] for row in response.json()}


def test_league_profile_out_progress_and_next_tier(db):
    """get_profile_out calculates next tier threshold and progress percentage."""
    user = _create_user(db, "progress_pct_user")
    service = LeagueService(db)

    # Silver tier: 400 - 800 (width 400). At 600 trophies -> 50%
    service.profile_repo.create(str(user.id), trophy_count=600, tier=LeagueTier.silver)

    profile_out = service.get_profile_out(str(user.id))
    assert profile_out["trophy_count"] == 600
    assert profile_out["league_tier"] == LeagueTier.silver.value
    assert profile_out["next_tier"] == LeagueTier.gold.value
    assert profile_out["next_tier_threshold"] == 800
    assert profile_out["progress_pct"] == pytest.approx(50.0, abs=0.5)


def test_league_tier_reconciliation_worker(db):
    """Worker reconciliation pass detects and repairs drifted profile tiers."""
    user = _create_user(db, "drifted_tier_user")
    service = LeagueService(db)

    # Profile has 1500 trophies (should be Platinum), but tier is set to Bronze
    profile = service.profile_repo.create(str(user.id), trophy_count=1500, tier=LeagueTier.bronze)

    # Worker detects out-of-sync profile
    due = service.get_due_tier_reconciliations()
    assert any(p.user_id == user.id for p in due)

    # Worker executes reconciliation pass
    reconciled_count = service.reconcile_league_tiers()
    assert reconciled_count >= 1

    # Verify tier corrected to Platinum
    db.refresh(profile)
    assert profile.league_tier == LeagueTier.platinum


def test_tier_reconciliation_refreshes_locked_profile_before_calculating(db, monkeypatch):
    """A newer trophy update must not be overwritten using a stale candidate snapshot."""
    user = _create_user(db, "fresh_tier_reconcile_user")
    service = LeagueService(db)
    profile = service.profile_repo.create(str(user.id), trophy_count=500, tier=LeagueTier.bronze)
    stale_candidate = profile

    # Simulate a concurrent trophy event having completed after the worker's
    # candidate query but before its row lock. Avoid updating the ORM identity map.
    db.query(LeagueProfile).filter(LeagueProfile.user_id == user.id).update(
        {LeagueProfile.trophy_count: 2200, LeagueProfile.league_tier: LeagueTier.diamond},
        synchronize_session=False,
    )
    monkeypatch.setattr(service, "get_due_tier_reconciliations", lambda: [stale_candidate])

    assert service.reconcile_league_tiers() == 0
    db.refresh(profile)
    assert profile.trophy_count == 2200
    assert profile.league_tier == LeagueTier.diamond


def test_tier_reconciliation_locks_candidates_until_batch_commit_and_stages_outbox(db, monkeypatch):
    """A later row changed after selection is refreshed, without partial batch commits."""
    first_id = uuid.UUID("00000000-0000-0000-0000-000000000101")
    later_id = uuid.UUID("00000000-0000-0000-0000-000000000102")
    db.add_all([
        User(
            id=first_id, username="batch_reconcile_first",
            email="batch_reconcile_first@example.com", password_hash="fake_hash",
            is_active=True, is_suspended=False,
        ),
        User(
            id=later_id, username="batch_reconcile_later",
            email="batch_reconcile_later@example.com", password_hash="fake_hash",
            is_active=True, is_suspended=False,
        ),
    ])
    db.commit()

    service = LeagueService(db)
    first = service.profile_repo.create(str(first_id), trophy_count=500, tier=LeagueTier.bronze)
    later = service.profile_repo.create(str(later_id), trophy_count=1000, tier=LeagueTier.bronze)

    # Avoid requiring a Redis service while asserting the durable transaction.
    delivered_after_commit = []

    def assert_committed_then_dispatch():
        db.expire_all()
        assert db.get(LeagueProfile, first_id).league_tier == LeagueTier.silver
        notification = db.query(Notification).filter(
            Notification.user_id == first_id,
            Notification.event_type == "LEAGUE_TIER_CHANGED",
        ).one()
        outbox_rows = db.query(NotificationOutbox).filter(
            NotificationOutbox.event_type == "LEAGUE_TIER_CHANGED",
        ).all()
        assert sum(row.payload.get("user_id") == str(first_id) for row in outbox_rows) == 1
        assert notification.payload["user_id"] == str(first_id)
        delivered_after_commit.append(True)

    monkeypatch.setattr(service, "_publish_reconciliation_outbox", assert_committed_then_dispatch)
    lock_many = service.profile_repo.lock_many
    later_updated = False

    def change_later_before_its_lock(user_ids):
        nonlocal later_updated
        if user_ids == [str(later_id)] and not later_updated:
            later_updated = True
            # Represents a newer trophy event completing between candidate
            # selection and this candidate's fresh lock/read.
            db.query(LeagueProfile).filter(LeagueProfile.user_id == later_id).update(
                {
                    LeagueProfile.trophy_count: 2200,
                    LeagueProfile.league_tier: LeagueTier.diamond,
                },
                synchronize_session=False,
            )
        return lock_many(user_ids)

    monkeypatch.setattr(service.profile_repo, "lock_many", change_later_before_its_lock)
    assert service.reconcile_league_tiers() == 1

    db.refresh(first)
    db.refresh(later)
    assert first.league_tier == LeagueTier.silver
    assert later.trophy_count == 2200
    assert later.league_tier == LeagueTier.diamond
    outbox = next(
        row for row in db.query(NotificationOutbox).filter(
            NotificationOutbox.event_type == "LEAGUE_TIER_CHANGED",
        ).all()
        if row.payload.get("user_id") == str(first_id)
    )
    notification = db.query(Notification).filter(
        Notification.user_id == first_id,
        Notification.event_type == "LEAGUE_TIER_CHANGED",
    ).one()
    assert outbox.event_type == "LEAGUE_TIER_CHANGED"
    assert outbox.payload["user_id"] == str(first_id)
    assert notification.user_id == first_id
    assert notification.payload == outbox.payload
    assert delivered_after_commit == [True]
