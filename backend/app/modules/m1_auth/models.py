"""User Authentication & Account Linking (REQ-1.x) — SADD ER: USER, JUDGE_ACCOUNT."""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """SADD 6.4 USER entity."""
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_suspended = Column(Boolean, default=False, nullable=False)  # UC-11
    # PostgreSQL source of truth for attack cooldowns (SADD 7.2.1) —
    # Redis is a read-through/write-through cache on top of this column.
    attack_cooldown_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    judge_accounts = relationship("JudgeAccount", back_populates="user", cascade="all, delete-orphan")


class JudgeType(str, enum.Enum):
    """Supported/plannable judge platforms (REQ-1.3, REQ-1.4).

    Only `codeforces` has a working adapter (see plan.md decision:
    Codeforces only). `leetcode`/`codechef` remain in the enum so the
    schema demonstrates the SRS 5.4 extensibility claim — linking one
    raises a domain error until an adapter exists (SADD 4.4).
    """
    codeforces = "codeforces"
    leetcode = "leetcode"
    codechef = "codechef"


class JudgeAccount(Base):
    """SADD 6.4 JUDGE_ACCOUNT entity (REQ-1.3–1.5)."""
    __tablename__ = "judge_accounts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    judge_type = Column(Enum(JudgeType, name="judge_type"), nullable=False)
    handle = Column(String(255), nullable=False)
    verified_flag = Column(Boolean, default=False, nullable=False)  # REQ-1.4, NFR-3.1
    verification_token = Column(String(255), nullable=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)  # REQ-2.4
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="judge_accounts")

    __table_args__ = (
        # A user can't link the same judge twice; two users cannot claim
        # the same external profile (SADD 6.5.3).
        UniqueConstraint("judge_type", "handle", name="uq_judge_accounts_type_handle"),
        UniqueConstraint("user_id", "judge_type", name="uq_judge_accounts_user_type"),
    )
