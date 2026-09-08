"""League & Trophy Progression (REQ-7.x) — SADD ER: LEAGUE_PROFILE, TROPHY_LEDGER.

LEAGUE_PROFILE.trophy_count is a materialized, incrementally-maintained
projection of TROPHY_LEDGER (SADD 6.6) — it is never set directly; see
plan.md Phase 6 for the atomic increment + append-only ledger pattern
(SADD 6.5.1, 7.2). This module defines the Phase 1 schema baseline.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String

from app.db.base import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class LeagueTier(str, enum.Enum):
    """SADD REQ-7.2: six league tiers."""
    bronze = "bronze"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"
    diamond = "diamond"
    legend = "legend"


class LeagueProfile(Base):
    """SADD 6.4 LEAGUE_PROFILE (REQ-7.1–7.4)."""
    __tablename__ = "league_profiles"

    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    trophy_count = Column(Integer, default=0, nullable=False)
    league_tier = Column(Enum(LeagueTier, name="league_tier"), default=LeagueTier.bronze, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class TrophyEventType(str, enum.Enum):
    """What kind of scored event produced a trophy_ledger delta (SADD 7.3.1.3)."""
    attack_win = "attack_win"
    attack_loss = "attack_loss"
    successful_defense = "successful_defense"
    failed_defense = "failed_defense"
    attack_abandoned = "attack_abandoned"
    practice_milestone = "practice_milestone"


class TrophyLedger(Base):
    """SADD 6.4 TROPHY_LEDGER — append-only, auditable (REQ-7.1).

    The ONLY path that may change LEAGUE_PROFILE.trophy_count (SADD
    App. D) — never a direct setter. See plan.md Phase 6.
    """
    __tablename__ = "trophy_ledger"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    event_type = Column(Enum(TrophyEventType, name="trophy_event_type"), nullable=False)
    delta = Column(Integer, nullable=False)
    source_ref_id = Column(GUID(), nullable=True)  # e.g. the triggering attack_id
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
