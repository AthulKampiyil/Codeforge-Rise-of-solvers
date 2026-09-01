"""Personal Code Village Management (REQ-3.x) — SQLAlchemy ORM models owned by this module."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class Topic(Base):
    """Topic (skill area) in the village system (REQ-3.x)."""
    __tablename__ = "topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class VillageTopicProgress(Base):
    """User's progress in a specific topic (REQ-3.1–3.4)."""
    __tablename__ = "village_topic_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True)
    solved_count = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=0, nullable=False)  # Computed from solved_count
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'topic_id', name='uq_user_topic'),
    )

