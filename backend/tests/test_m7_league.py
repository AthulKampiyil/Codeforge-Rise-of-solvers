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
from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier, TrophyEventType, TrophyLedger
from app.modules.m7_league_trophy.service import LeagueService


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
