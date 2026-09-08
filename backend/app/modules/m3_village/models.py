"""Personal Code Village Management (REQ-3.x) — SADD ER: TOPIC, VILLAGE_TOPIC_PROGRESS.

VILLAGE_PROFILE is a Sprint-2 addition beyond SADD Fig 6.1 (see
plan.md decisions record for the rationale): matchmaking (SADD
7.3.1.1) needs an indexed, single-row-per-user defense_rating to range
scan, which SADD 6.6 already permits as a materialized projection —
the same pattern used for league_profiles.trophy_count and
zone_contributions.aggregated_score. It is always recomputable from
VILLAGE_TOPIC_PROGRESS (SADD 6.1).

Full leveling-formula and defense-rating logic (SADD 7.3.1) lands in
plan.md Phase 5; this module currently defines the Phase 1 schema.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint

from app.db.base import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Topic(Base):
    """SADD 6.4 TOPIC entity (REQ-3.x)."""
    __tablename__ = "topics"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)  # canonical key, e.g. "graphs"
    display_name = Column(String(100), nullable=False)  # UI label, e.g. "Graphs"
    structure_key = Column(String(50), nullable=False)  # village sprite variant, e.g. "tower"
    description = Column(String(500), nullable=True)
    base_threshold = Column(Integer, nullable=False, default=10)  # progress points required per level (SADD 6.4)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class VillageTopicProgress(Base):
    """SADD 6.4 VILLAGE_TOPIC_PROGRESS (REQ-3.1–3.4). Derived, recomputable from SOLVED_PROBLEM."""
    __tablename__ = "village_topic_progress"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    topic_id = Column(GUID(), ForeignKey("topics.id", ondelete="RESTRICT"), nullable=False, index=True)
    progress_points = Column(Integer, default=0, nullable=False)  # SADD 6.4
    level = Column(Integer, default=0, nullable=False)  # computed from progress_points (Phase 5 formula)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "topic_id", name="uq_user_topic"),
    )


class VillageProfile(Base):
    """
    Materialized per-user village summary (Sprint-2 addition, see
    module docstring). Indexed on defense_rating for SADD 7.3.1.1
    matchmaking's range scan; recomputable from VILLAGE_TOPIC_PROGRESS.
    """
    __tablename__ = "village_profiles"

    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    defense_rating = Column(Float, default=0.0, nullable=False, index=True)
    total_solved = Column(Integer, default=0, nullable=False)
    average_level = Column(Float, default=0.0, nullable=False)
    last_recomputed_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
