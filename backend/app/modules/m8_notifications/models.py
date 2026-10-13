"""Notification & Realtime Gateway — persistence for notification history.

SADD 4.4 makes M8 a stateless gateway over Redis pub/sub — connection
state (who's online, which local process holds their socket) lives in
Redis/process memory, NOT in Postgres. Sprint 1's WebSocketConnection
table is dropped: persisting a DB row on every connect/disconnect is
both the wrong layer (SADD says Redis) and a write-amplification
problem under load. Only the notification *history* (for the bell
icon / audit trail) is durable.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Notification(Base):
    """Durable notification record (audit/history, REQ-4.5 "summarize the outcome")."""
    __tablename__ = "notifications"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    payload = Column(JSONB, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)


class NotificationOutbox(Base):
    """Durable realtime publication queue; rows remain retryable until delivered."""
    __tablename__ = "notification_outbox"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    event_id = Column(String(36), nullable=False, unique=True, index=True)
    event_type = Column(String(50), nullable=False)
    payload = Column(JSONB, nullable=False)
    target_user_ids = Column(JSONB, nullable=True)
    broadcast = Column(Boolean, nullable=False, default=False)
    attempts = Column(Integer, nullable=False, default=0)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
