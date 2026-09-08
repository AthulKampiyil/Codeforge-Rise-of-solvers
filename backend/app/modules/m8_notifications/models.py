"""Notification & WebSocket Models (REQ-8.x)

ORM models for WebSocket connection tracking and notifications.
Owns: M8 data schema. Used by repository layer.
"""
from uuid import uuid4
from enum import Enum
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index
from datetime import datetime
from app.db.guid import GUID
from app.db.base_class import Base


class NotificationEventType(str, Enum):
    """Realtime event types pushed via WebSocket."""
    ATTACK_INCOMING = "ATTACK_INCOMING"
    ATTACK_RESOLVED = "ATTACK_RESOLVED"
    TERRITORY_ZONE_CHANGED = "TERRITORY_ZONE_CHANGED"
    VILLAGE_UPDATED = "VILLAGE_UPDATED"
    LEAGUE_PROMOTION = "LEAGUE_PROMOTION"


class WebSocketConnection(Base):
    """Active WebSocket connection record."""
    __tablename__ = "websocket_connections"

    id = Column(GUID, primary_key=True, default=uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(255), nullable=False)
    connected_at = Column(DateTime(), nullable=False, default=datetime.utcnow)
    is_active = Column(Boolean(), nullable=False, default=True)

    __table_args__ = (
        Index("idx_ws_conn_user_active", "user_id", "is_active"),
    )


class Notification(Base):
    """Persistent notification record for audit/history."""
    __tablename__ = "notifications"

    id = Column(GUID, primary_key=True, default=uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    payload = Column(String(2000), nullable=True)
    is_read = Column(Boolean(), nullable=False, default=False)
    created_at = Column(DateTime(), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_notifications_user_read", "user_id", "is_read"),
    )
