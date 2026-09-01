"""Notification & WebSocket Models (REQ-8.x)

ORM models for notification tracking and WebSocket connection management.
Owns: M8 data schema. Used by service layer.
"""
from uuid import uuid4
from enum import Enum
from sqlalchemy import Column, String, UUID, DateTime, Boolean, ForeignKey, Index
from datetime import datetime
from app.db.base import Base


class NotificationEventType(str, Enum):
    """WebSocket notification event types."""
    attack_received = "attack_received"
    attack_resolved = "attack_resolved"
    territory_lost = "territory_lost"
    territory_gained = "territory_gained"
    guild_invitation = "guild_invitation"
    guild_member_joined = "guild_member_joined"
    sync_complete = "sync_complete"
    league_promotion = "league_promotion"


class WebSocketConnection(Base):
    """Track active WebSocket connections for users."""
    __tablename__ = "websocket_connections"

    id = Column(UUID(), primary_key=True, default=uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(100), nullable=False, index=True)
    connected_at = Column(DateTime(), nullable=False, default=datetime.utcnow)
    disconnected_at = Column(DateTime(), nullable=True)
    is_active = Column(Boolean(), nullable=False, default=True)

    __table_args__ = (
        Index("idx_websocket_connections_user", "user_id"),
        Index("idx_websocket_connections_active", "is_active"),
    )


class Notification(Base):
    """Notification record for audit/history."""
    __tablename__ = "notifications"

    id = Column(UUID(), primary_key=True, default=uuid4)
    user_id = Column(UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)  # attack_received, territory_lost, etc.
    payload = Column(String(1000), nullable=True)  # JSON serialized event data
    is_read = Column(Boolean(), nullable=False, default=False)
    created_at = Column(DateTime(), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_notifications_user", "user_id"),
        Index("idx_notifications_created", "created_at"),
    )
