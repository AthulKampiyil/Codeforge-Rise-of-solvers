"""Async Village Attacks (REQ-4.x) — SQLAlchemy ORM models owned by this module."""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class AttackStatus(str, enum.Enum):
    """Status of an attack (REQ-4.1)."""
    pending = "pending"
    executing = "executing"
    success = "success"
    failed = "failed"


class Attack(Base):
    """Async village attack record (REQ-4.1–4.4)."""
    __tablename__ = "attacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attacker_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    defender_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(AttackStatus), default=AttackStatus.pending, nullable=False)
    score = Column(Integer, default=0, nullable=False)  # Defense points captured
    challenge_topic = Column(String(100), nullable=True)  # Topic for defense challenge
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class AttackCooldown(Base):
    """Cooldown tracker to prevent attack spam (REQ-4.4)."""
    __tablename__ = "attack_cooldowns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    last_attack_at = Column(DateTime, nullable=True)
    cooldown_minutes = Column(Integer, default=30, nullable=False)  # Tunable cooldown (default 30 min)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

