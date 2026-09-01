"""Coding Platform Sync (REQ-2.x) — SQLAlchemy ORM models owned by this module."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import enum


class SyncStatus(str, enum.Enum):
    """Status of a platform sync operation (REQ-2.4)."""
    up_to_date = "up_to_date"
    in_progress = "in_progress"
    failed = "failed"


class SyncLog(Base):
    """Tracks sync status for user's judge profiles (REQ-2.4)."""
    __tablename__ = "sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    judge_name = Column(String(50), nullable=False)  # e.g., "codeforces"
    last_synced_at = Column(DateTime, nullable=True)  # NULL = never synced
    status = Column(Enum(SyncStatus), default=SyncStatus.up_to_date, nullable=False)
    last_error = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

