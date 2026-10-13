"""Admin & Game-Balance Configuration (UC-11/UC-12) — SADD tables not on
Fig 6.1 but required to realize UC-11/UC-12 and NFR-3.5 as specified.

Full admin service logic (config get/set with Redis invalidation,
moderation, audit decorator) lands in plan.md Phase 10. This module
defines the Phase 1 schema baseline.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GameBalanceConfig(Base):
    """UC-12: tunable game-balance values (cooldowns, K-factors,
    thresholds, hysteresis margin, circuit-breaker limits — see
    plan.md Phase 1 seed data for the full key list).
    """
    __tablename__ = "game_balance_config"

    key = Column(String(100), primary_key=True)
    value = Column(JSONB, nullable=False)
    value_type = Column(String(20), nullable=False)  # "int" | "float" | "dict" | "str"
    description = Column(String(500), nullable=True)
    updated_by = Column(GUID(), nullable=True)  # admin user id
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class AdminAuditLog(Base):
    """NFR-3.5: administrative actions must be logged for auditability."""
    __tablename__ = "admin_audit_log"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    admin_user_id = Column(GUID(), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # e.g. "suspend_user", "set_config"
    target_type = Column(String(50), nullable=True)  # e.g. "user", "guild", "config_key"
    target_id = Column(String(100), nullable=True)
    details = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
