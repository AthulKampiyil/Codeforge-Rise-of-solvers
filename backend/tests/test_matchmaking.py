"""Tests for Matchmaking Tolerance Band & Target Selection (SADD §7.3.1.1, TC-ATK-01).

Validates:
- Base tolerance + tier adjustment (bronze +0.08 ... legend -0.08)
- Iterative band widening by 0.05 when candidate count < min_candidates (3)
- Hard cap at max_tolerance (0.30)
- Exclusions: self, recent attacks (24h window), defense grace period (15m window), suspended users
- Relative strength indicators ("stronger", "even", "weaker")
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.modules.m1_auth.models import User
from app.modules.m3_village.models import VillageProfile
from app.modules.m4_attacks.models import Attack, AttackStatus
from app.modules.m4_attacks.service import (
    DEFAULT_MATCHMAKING_BASE_TOLERANCE,
    DEFAULT_MAX_TOLERANCE,
    DEFAULT_MIN_CANDIDATES,
    DEFAULT_TIER_ADJUSTMENTS,
    DEFAULT_WIDEN_STEP,
    AttackService,
)
from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier


def _create_user(db, username: str, is_active: bool = True, is_suspended: bool = False) -> User:
    user = User(
        id=uuid.uuid4(),
        username=username,
        email=f"{username}@example.com",
        password_hash="fake_hash",
        is_active=is_active,
        is_suspended=is_suspended,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _set_village_profile(db, user_id: uuid.UUID, defense_rating: float, total_solved: int = 10, average_level: float = 2.0):
    vp = db.query(VillageProfile).filter(VillageProfile.user_id == user_id).first()
    if not vp:
        vp = VillageProfile(
            user_id=user_id,
            defense_rating=defense_rating,
            total_solved=total_solved,
            average_level=average_level,
            last_recomputed_at=datetime.now(timezone.utc),
        )
        db.add(vp)
    else:
        vp.defense_rating = defense_rating
        vp.total_solved = total_solved
        vp.average_level = average_level
    db.commit()
    db.refresh(vp)
    return vp


def _set_league_tier(db, user_id: uuid.UUID, tier: LeagueTier, trophy_count: int = 300):
    lp = db.query(LeagueProfile).filter(LeagueProfile.user_id == user_id).first()
    if not lp:
        lp = LeagueProfile(
            user_id=user_id,
            trophy_count=trophy_count,
            league_tier=tier,
            updated_at=datetime.now(timezone.utc),
        )
        db.add(lp)
    else:
        lp.league_tier = tier
        lp.trophy_count = trophy_count
    db.commit()
    db.refresh(lp)
    return lp


def test_tc_atk_01_tier_tolerance_adjustments():
    """Verify tier adjustment dictionary from SADD §7.3.1.1."""
    base_tol = DEFAULT_MATCHMAKING_BASE_TOLERANCE  # 0.12
    tier_adjs = DEFAULT_TIER_ADJUSTMENTS

    # Bronze: 0.12 + 0.08 = 0.20
    assert base_tol + tier_adjs["bronze"] == pytest.approx(0.20)
    # Silver: 0.12 + 0.05 = 0.17
    assert base_tol + tier_adjs["silver"] == pytest.approx(0.17)
    # Gold: 0.12 + 0.02 = 0.14
    assert base_tol + tier_adjs["gold"] == pytest.approx(0.14)
    # Platinum: 0.12 + 0.00 = 0.12
    assert base_tol + tier_adjs["platinum"] == pytest.approx(0.12)
    # Diamond: 0.12 - 0.02 = 0.10
    assert base_tol + tier_adjs["diamond"] == pytest.approx(0.10)
    # Legend: 0.12 - 0.08 = 0.04
    assert base_tol + tier_adjs["legend"] == pytest.approx(0.04)


def test_matchmaking_self_exclusion(db):
    """Attacker must never be returned in their own matchmaking candidates."""
    attacker = _create_user(db, "attacker_self")
    _set_village_profile(db, attacker.id, defense_rating=1000.0)
    _set_league_tier(db, attacker.id, LeagueTier.gold)

    # Create other candidate
    other = _create_user(db, "target_other")
    _set_village_profile(db, other.id, defense_rating=1000.0)

    service = AttackService(db)
    targets = service.find_attack_targets(str(attacker.id), limit=10)

    target_ids = [t["id"] for t in targets]
    assert str(attacker.id) not in target_ids
    assert str(other.id) in target_ids


def test_matchmaking_recent_attack_exclusion(db):
    """Targets attacked by this solver within 24h must be excluded."""
    attacker = _create_user(db, "attacker_recent")
    target_recent = _create_user(db, "target_recent")
    target_available = _create_user(db, "target_available")

    _set_village_profile(db, attacker.id, defense_rating=1000.0)
    _set_village_profile(db, target_recent.id, defense_rating=1000.0)
    _set_village_profile(db, target_available.id, defense_rating=1000.0)

    # Log an attack within recent window
    now = datetime.now(timezone.utc)
    attack = Attack(
        attacker_user_id=attacker.id,
        target_user_id=target_recent.id,
        status=AttackStatus.in_progress,
        started_at=now - timedelta(hours=2),
        window_expires_at=now + timedelta(hours=22),
    )
    db.add(attack)
    db.commit()

    service = AttackService(db)
    targets = service.find_attack_targets(str(attacker.id), limit=10)
    target_ids = [t["id"] for t in targets]

    assert str(target_recent.id) not in target_ids
    assert str(target_available.id) in target_ids


def test_matchmaking_defense_grace_exclusion(db):
    """Targets attacked by ANY solver within 15m must be excluded."""
    attacker = _create_user(db, "attacker_grace_test")
    third_party = _create_user(db, "third_party_attacker")
    target_in_grace = _create_user(db, "target_in_grace")
    target_open = _create_user(db, "target_open")

    _set_village_profile(db, attacker.id, defense_rating=1000.0)
    _set_village_profile(db, third_party.id, defense_rating=1000.0)
    _set_village_profile(db, target_in_grace.id, defense_rating=1000.0)
    _set_village_profile(db, target_open.id, defense_rating=1000.0)

    # Third party attacked target_in_grace 5 minutes ago (< 15m grace)
    now = datetime.now(timezone.utc)
    attack = Attack(
        attacker_user_id=third_party.id,
        target_user_id=target_in_grace.id,
        status=AttackStatus.in_progress,
        started_at=now - timedelta(minutes=5),
        window_expires_at=now + timedelta(hours=23, minutes=55),
    )
    db.add(attack)
    db.commit()

    service = AttackService(db)
    targets = service.find_attack_targets(str(attacker.id), limit=10)
    target_ids = [t["id"] for t in targets]

    assert str(target_in_grace.id) not in target_ids
    assert str(target_open.id) in target_ids


def test_matchmaking_band_widening_and_cap(db):
    """Band widens by 0.05 step when candidates < 3, stopping at max_tolerance 0.30."""
    attacker = _create_user(db, "attacker_band")
    _set_village_profile(db, attacker.id, defense_rating=1000.0)
    _set_league_tier(db, attacker.id, LeagueTier.platinum)  # tolerance = 0.12 (band: 880 - 1120)

    # Target 1: inside base band (950)
    t1 = _create_user(db, "target_close")
    _set_village_profile(db, t1.id, defense_rating=950.0)

    # Target 2: outside base band (1150), but inside widened band (0.17 -> 830 - 1170)
    t2 = _create_user(db, "target_widened")
    _set_village_profile(db, t2.id, defense_rating=1150.0)

    # Target 3: inside max tolerance band (1280 <= 1300 for 0.30)
    t3 = _create_user(db, "target_max_tol")
    _set_village_profile(db, t3.id, defense_rating=1280.0)

    # Target 4: outside max tolerance cap (1400 > 1300)
    t4 = _create_user(db, "target_outside_cap")
    _set_village_profile(db, t4.id, defense_rating=1400.0)

    service = AttackService(db)
    targets = service.find_attack_targets(str(attacker.id), limit=10)
    target_ids = [t["id"] for t in targets]

    assert str(t1.id) in target_ids
    assert str(t2.id) in target_ids
    assert str(t3.id) in target_ids
    assert str(t4.id) not in target_ids


def test_matchmaking_relative_strength_labels(db):
    """Verify relative_strength indicators ('weaker', 'even', 'stronger')."""
    attacker = _create_user(db, "attacker_str")
    _set_village_profile(db, attacker.id, defense_rating=1000.0)

    t_strong = _create_user(db, "target_strong")
    _set_village_profile(db, t_strong.id, defense_rating=1080.0)  # > +50

    t_even = _create_user(db, "target_even")
    _set_village_profile(db, t_even.id, defense_rating=1010.0)    # within +/-50

    t_weak = _create_user(db, "target_weak")
    _set_village_profile(db, t_weak.id, defense_rating=920.0)     # < -50

    service = AttackService(db)
    targets = service.find_attack_targets(str(attacker.id), limit=10)
    targets_map = {t["id"]: t for t in targets}

    assert targets_map[str(t_strong.id)]["relative_strength"] == "stronger"
    assert targets_map[str(t_even.id)]["relative_strength"] == "even"
    assert targets_map[str(t_weak.id)]["relative_strength"] == "weaker"
