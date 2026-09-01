import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import enum


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class JudgeName(str, enum.Enum):
    """Supported judge platforms (REQ-1.3, REQ-1.4)."""
    codeforces = "codeforces"
    leetcode = "leetcode"
    codechef = "codechef"


class LinkedJudgeProfile(Base):
    """Judge account linking (REQ-1.3–1.5)."""
    __tablename__ = "linked_judge_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    judge_name = Column(Enum(JudgeName), nullable=False)
    handle = Column(String(255), nullable=False)
    verified = Column(Boolean, default=False)  # True once user proves handle ownership (REQ-1.4)
    verification_token = Column(String(255), nullable=True)  # One-time token for ownership proof
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        # Composite unique: a user can't link the same judge twice
        # but different users can have the same judge handle
    )
