"""Async Village Attacks (REQ-4.x) — SQLAlchemy ORM models owned by this module."""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Boolean, Float
from app.db.guid import GUID
from app.db.base_class import Base


class AttackStatus(str, enum.Enum):
    """Lifecycle status of an attack (REQ-4.3, SADD 7.6)."""
    pending = "pending"
    in_progress = "in_progress"
    success = "success"
    failed = "failed"
    abandoned = "abandoned"


class Attack(Base):
    """Async attack instance (REQ-4.1–4.3)."""
    __tablename__ = "attacks"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    attacker_user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    defender_user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(AttackStatus), nullable=False, default=AttackStatus.pending)
    score = Column(Integer, default=0, nullable=False)
    challenge_topic = Column(String(100), nullable=True)  # Topic targeted
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class AttackCooldown(Base):
    """Attack cooldown state per user (REQ-4.4)."""
    __tablename__ = "attack_cooldowns"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    last_attack_at = Column(DateTime, nullable=True)
    cooldown_minutes = Column(Integer, default=30, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
