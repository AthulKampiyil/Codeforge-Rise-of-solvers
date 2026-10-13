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

from sqlalchemy import (
    BigInteger, CheckConstraint, Column, DateTime, Float, ForeignKey, Integer,
    String, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base
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


class TopicOutpost(Base):
    """Purchased outpost tier, separate from solve-derived topic level."""
    __tablename__ = "village_topic_outposts"

    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    topic_id = Column(GUID(), ForeignKey("topics.id", ondelete="RESTRICT"), primary_key=True)
    tier = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("tier >= 0", name="ck_village_topic_outpost_tier_nonnegative"),
        CheckConstraint("tier <= 5", name="ck_village_topic_outpost_tier_max"),
    )


class TopicOutpostUpgradeOperation(Base):
    """Immutable idempotency and audit record for one purchased tier."""
    __tablename__ = "village_topic_outpost_operations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    topic_id = Column(GUID(), ForeignKey("topics.id", ondelete="RESTRICT"), nullable=False)
    idempotency_key = Column(String(128), nullable=False)
    expected_tier = Column(Integer, nullable=False)
    gold_cost = Column(BigInteger, nullable=False)
    elixir_cost = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "idempotency_key", name="uq_village_outpost_user_idempotency"),
        CheckConstraint("expected_tier >= 0 AND expected_tier < 5", name="ck_village_outpost_operation_expected_tier"),
        CheckConstraint("gold_cost >= 0", name="ck_village_outpost_operation_gold_nonnegative"),
        CheckConstraint("elixir_cost >= 0", name="ck_village_outpost_operation_elixir_nonnegative"),
    )


class TopicOutpostLayout(Base):
    """Persisted full topic-outpost placement for one user."""
    __tablename__ = "village_topic_outpost_layouts"

    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    revision = Column(Integer, nullable=False, default=0)
    items = Column(JSONB, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("revision >= 0", name="ck_village_outpost_layout_revision_nonnegative"),
    )


class TopicOutpostLayoutOperation(Base):
    """Idempotency record for an applied full-layout replacement."""
    __tablename__ = "village_topic_outpost_layout_operations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    idempotency_key = Column(String(128), nullable=False)
    request_identity = Column(String(64), nullable=False)
    expected_revision = Column(Integer, nullable=False)
    applied_revision = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "idempotency_key", name="uq_village_outpost_layout_user_idempotency"),
        CheckConstraint("expected_revision >= 0", name="ck_village_outpost_layout_expected_revision_nonnegative"),
        CheckConstraint("applied_revision > 0", name="ck_village_outpost_layout_applied_revision_positive"),
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
