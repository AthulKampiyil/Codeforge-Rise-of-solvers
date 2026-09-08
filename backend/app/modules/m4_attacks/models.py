"""Async Village Attacks (REQ-4.x) — SADD ER: ATTACK, ATTACK_PROBLEM_SET.

Cooldown state moved to users.attack_cooldown_expires_at (SADD 7.2.1) —
there is no attack_cooldowns table in this schema. Full matchmaking,
curation, and resolution logic (SADD 7.3.1.1) land in plan.md Phase 7;
this module defines the Phase 1 schema baseline.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String

from app.db.base import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AttackStatus(str, enum.Enum):
    """SADD 7.6 Attack lifecycle state diagram."""
    created = "created"
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"
    resolved = "resolved"


class Attack(Base):
    """SADD 6.4 ATTACK entity (REQ-4.1–4.4)."""
    __tablename__ = "attacks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    attacker_user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    target_user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(Enum(AttackStatus, name="attack_status"), default=AttackStatus.created, nullable=False)
    score = Column(Integer, default=0, nullable=False)  # REQ-4.3
    solved_fraction = Column(Float, nullable=True)  # f in the Elo formula (SADD 7.3.1.3)
    started_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    window_expires_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class AttackProblemSet(Base):
    """SADD 6.4 ATTACK_PROBLEM_SET (REQ-4.2)."""
    __tablename__ = "attack_problem_sets"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    attack_id = Column(GUID(), ForeignKey("attacks.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_ext_id = Column(String(100), nullable=False)
    problem_name = Column(String(255), nullable=True)
    problem_url = Column(String(500), nullable=True)
    topic_id = Column(GUID(), ForeignKey("topics.id", ondelete="RESTRICT"), nullable=True)
    rating = Column(Integer, nullable=True)
    solved_flag = Column(Boolean, default=False, nullable=False)
    solved_at = Column(DateTime(timezone=True), nullable=True)
