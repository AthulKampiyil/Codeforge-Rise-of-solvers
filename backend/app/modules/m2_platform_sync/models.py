"""Coding Platform Sync (REQ-2.x) — SQLAlchemy ORM models owned by this module."""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from app.db.guid import GUID
from app.db.base_class import Base


class SyncStatus(str, enum.Enum):
    """Status of sync operation (REQ-2.4)."""
    up_to_date = "up_to_date"
    in_progress = "in_progress"
    failed = "failed"


class SyncLog(Base):
    """Sync operation log (REQ-2.4)."""
    __tablename__ = "sync_logs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    judge_name = Column(String(50), nullable=False)
    last_synced_at = Column(DateTime, nullable=True)
    status = Column(Enum(SyncStatus), nullable=False, default=SyncStatus.up_to_date)
    last_error = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
