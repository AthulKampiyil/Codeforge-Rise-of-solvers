"""Personal Code Village (REQ-3.x) — SQLAlchemy ORM models owned by this module."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from app.db.guid import GUID
from app.db.base_class import Base


class Topic(Base):
    """Supported problem topic (e.g. algorithms, data-structures)."""
    __tablename__ = "topics"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class VillageTopicProgress(Base):
    """User topic level progress (REQ-3.1)."""
    __tablename__ = "village_topic_progress"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(GUID, ForeignKey("topics.id"), nullable=False, index=True)
    solved_count = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    progress_points = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "topic_id", name="uq_user_topic"),
    )
