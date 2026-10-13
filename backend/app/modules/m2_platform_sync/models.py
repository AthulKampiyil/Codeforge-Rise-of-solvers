"""Coding Platform Sync (REQ-2.x) — SADD ER: SOLVED_PROBLEM, sync_dead_letter.

Full SyncService logic (circuit breaker, DLQ sweeper, topic
reconciliation) lands in plan.md Phase 4. This module defines the
Phase 1 schema baseline: SOLVED_PROBLEM is kept separate from derived
village state (SADD 6.1) so a leveling-formula change never requires
a judge resync.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    ARRAY,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    CheckConstraint,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base_class import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SolvedProblem(Base):
    """SADD 6.4 SOLVED_PROBLEM — immutable, externally-sourced fact.

    Never mutated once written. VILLAGE_TOPIC_PROGRESS is derived from
    this table and can always be recomputed from it (SADD 6.1).
    """
    __tablename__ = "solved_problems"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    judge_account_id = Column(GUID(), ForeignKey("judge_accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    problem_ext_id = Column(String(100), nullable=False)  # e.g. "1234-A"
    topic_tags = Column(ARRAY(String), nullable=False, default=list)
    rating = Column(Integer, nullable=True)
    solved_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        # Makes re-sync idempotent — supports REQ-2.5 no-data-loss under retry.
        UniqueConstraint("judge_account_id", "problem_ext_id", name="uq_solved_problems_account_problem"),
    )


class SyncStatus(str, enum.Enum):
    """Status of a platform sync operation (REQ-2.4)."""
    up_to_date = "up_to_date"
    in_progress = "in_progress"
    failed = "failed"
    degraded = "degraded"  # judge-wide circuit open (SADD 10.1) — not the user's fault


class SyncLog(Base):
    """Tracks sync status for a user's judge account (REQ-2.4)."""
    __tablename__ = "sync_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    judge_account_id = Column(GUID(), ForeignKey("judge_accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    judge_name = Column(String(50), nullable=False)  # denormalized for cheap display
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(SyncStatus, name="sync_status"), default=SyncStatus.up_to_date, nullable=False)
    last_error = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class DlqFailureReason(str, enum.Enum):
    """SADD 4.4 sync_dead_letter.failure_reason."""
    rate_limited = "rate_limited"
    circuit_open = "circuit_open"
    parse_error = "parse_error"
    auth_expired = "auth_expired"
    unknown = "unknown"


class SyncDeadLetter(Base):
    """SADD 4.4 — durable (PostgreSQL, survives Redis restarts) dead-letter queue.

    One bad account (or one blocked judge, via the circuit breaker)
    must never stall the main sync queue for everyone else.
    """
    __tablename__ = "sync_dead_letter"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    judge_account_id = Column(GUID(), ForeignKey("judge_accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    failure_reason = Column(Enum(DlqFailureReason, name="dlq_failure_reason"), nullable=False)
    attempt_count = Column(Integer, default=0, nullable=False)
    last_attempted_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    next_retry_at = Column(DateTime(timezone=True), nullable=False)
    payload_snapshot = Column(JSONB, nullable=True)  # last raw response/error, for debugging drift
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("judge_account_id", name="uq_sync_dead_letter_account"),
    )


class CodeforcesSyncCheckpoint(Base):
    """Durable per-account progress for Codeforces head and history imports."""
    __tablename__ = "cf_sync_checkpoints"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    judge_account_id = Column(
        GUID(), ForeignKey("judge_accounts.id", ondelete="CASCADE"), nullable=False
    )
    head_cursor_submission_id = Column(Integer, nullable=True)
    head_scan_offset = Column(Integer, nullable=True)
    head_scan_max_submission_id = Column(Integer, nullable=True)
    head_scan_generation = Column(Integer, nullable=True)
    history_cursor_submission_id = Column(Integer, nullable=True)
    full_scan_offset = Column(Integer, nullable=True)
    full_scan_max_submission_id = Column(Integer, nullable=True)
    full_reconciled_at = Column(DateTime(timezone=True), nullable=True)
    head_status = Column(String(20), nullable=False, default="pending")
    history_status = Column(String(20), nullable=False, default="pending")
    raw_submission_count = Column(Integer, nullable=False, default=0)
    accepted_submission_count = Column(Integer, nullable=False, default=0)
    history_page_count = Column(Integer, nullable=False, default=0)
    revision = Column(Integer, nullable=False, default=0)
    requested_at = Column(DateTime(timezone=True), nullable=True)
    request_generation = Column(Integer, nullable=False, default=0)
    served_generation = Column(Integer, nullable=False, default=0)
    head_reconciled_at = Column(DateTime(timezone=True), nullable=True)
    head_scan_started_at = Column(DateTime(timezone=True), nullable=True)
    finalization_attack_id = Column(GUID(), ForeignKey("attacks.id", ondelete="SET NULL"), nullable=True)
    finalization_not_before = Column(DateTime(timezone=True), nullable=True)
    finalization_generation = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("judge_account_id", name="uq_cf_sync_checkpoints_account"),
        CheckConstraint("head_cursor_submission_id IS NULL OR head_cursor_submission_id >= 0", name="ck_cf_checkpoint_head_cursor"),
        CheckConstraint("head_scan_offset IS NULL OR head_scan_offset >= 1", name="ck_cf_checkpoint_head_offset"),
        CheckConstraint("full_scan_offset IS NULL OR full_scan_offset >= 1", name="ck_cf_checkpoint_full_offset"),
        CheckConstraint("history_cursor_submission_id IS NULL OR history_cursor_submission_id >= 0", name="ck_cf_checkpoint_history_cursor"),
        CheckConstraint("head_status IN ('pending', 'in_progress', 'complete', 'failed')", name="ck_cf_checkpoint_head_status"),
        CheckConstraint("history_status IN ('pending', 'in_progress', 'complete', 'failed')", name="ck_cf_checkpoint_history_status"),
        CheckConstraint("raw_submission_count >= 0", name="ck_cf_checkpoint_raw_count"),
        CheckConstraint("accepted_submission_count >= 0", name="ck_cf_checkpoint_accepted_count"),
        CheckConstraint("revision >= 0", name="ck_cf_checkpoint_revision"),
        CheckConstraint("history_page_count >= 0", name="ck_cf_checkpoint_history_pages"),
        CheckConstraint("request_generation >= 0", name="ck_cf_checkpoint_request_generation"),
        CheckConstraint("served_generation >= 0", name="ck_cf_checkpoint_served_generation"),
    )
