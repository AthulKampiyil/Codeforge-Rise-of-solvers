"""Coding Platform Sync (REQ-2.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).

NOTE: The full SyncService (circuit breaker, DLQ, topic reconciliation)
is plan.md Phase 4. This file currently exposes the minimal surface
Phase 2 (M1 account verification) needs, so M1 can depend on M2's
service layer rather than reaching into judge_adapters directly.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.m2_platform_sync.judge_adapters.base import NormalizedUserInfo
from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesAdapter
from app.modules.m2_platform_sync.models import DlqFailureReason, SyncDeadLetter
from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint
from app.modules.m1_auth.models import JudgeAccount, JudgeType


class PlatformSyncService:
    """Public interface other modules call into (SADD 4.1)."""

    # Only Codeforces has a working adapter (plan.md decision).
    _ADAPTERS = {
        JudgeType.codeforces: CodeforcesAdapter(),
    }

    async def fetch_user_info(self, judge_type: JudgeType, handle: str) -> Optional[NormalizedUserInfo]:
        """
        Used by M1's ownership-verification flow (REQ-1.4). Returns None
        if the judge has no adapter yet or the handle doesn't exist.
        """
        adapter = self._ADAPTERS.get(judge_type)
        if adapter is None:
            return None
        return await adapter.get_user_info(handle)

    def has_adapter(self, judge_type: JudgeType) -> bool:
        return judge_type in self._ADAPTERS

    def get_due_sync_accounts(self, db: Session, limit: int = 50) -> list[JudgeAccount]:
        """
        Find verified accounts due for recurring sync (Worker requirement).

        Eligible accounts:
        - verified_flag is True
        - judge_type is Codeforces (supported adapter)
        - last_sync_at is NULL or older than SYNC_POLL_INTERVAL_MINUTES
        - not in active DLQ backoff (either not in SyncDeadLetter or next_retry_at <= now)
        """
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=settings.SYNC_POLL_INTERVAL_MINUTES)
        from app.modules.m4_attacks.models import Attack, AttackStatus

        queued_finalizations = db.query(Attack.resolution_account_id).filter(
            Attack.status.in_([AttackStatus.created, AttackStatus.in_progress]),
            Attack.resolution_account_id.isnot(None),
            Attack.resolution_state == "queued",
        )
        active_finalizations = db.query(CodeforcesSyncCheckpoint.judge_account_id).filter(
            CodeforcesSyncCheckpoint.finalization_attack_id.isnot(None),
        )

        return (
            db.query(JudgeAccount)
            .outerjoin(SyncDeadLetter, SyncDeadLetter.judge_account_id == JudgeAccount.id)
            .outerjoin(CodeforcesSyncCheckpoint, CodeforcesSyncCheckpoint.judge_account_id == JudgeAccount.id)
            .filter(
                JudgeAccount.verified_flag == True,  # noqa: E712
                JudgeAccount.judge_type == JudgeType.codeforces,
                or_(
                    JudgeAccount.last_sync_at == None,  # noqa: E711
                    JudgeAccount.last_sync_at <= cutoff,
                    JudgeAccount.id.in_(
                        db.query(CodeforcesSyncCheckpoint.judge_account_id).filter(
                            or_(
                                CodeforcesSyncCheckpoint.history_status != "complete",
                                CodeforcesSyncCheckpoint.head_status != "complete",
                                CodeforcesSyncCheckpoint.request_generation > CodeforcesSyncCheckpoint.served_generation,
                                CodeforcesSyncCheckpoint.finalization_attack_id.isnot(None),
                                CodeforcesSyncCheckpoint.full_scan_offset != None,  # noqa: E711
                                CodeforcesSyncCheckpoint.full_reconciled_at == None,  # noqa: E711
                                CodeforcesSyncCheckpoint.full_reconciled_at <= cutoff,
                            )
                        )
                    ),
                    JudgeAccount.id.in_(queued_finalizations),
                    JudgeAccount.id.in_(active_finalizations),
                ),
                or_(
                    SyncDeadLetter.id == None,  # noqa: E711
                    SyncDeadLetter.next_retry_at <= now,
                ),
            )
            .order_by(
                CodeforcesSyncCheckpoint.revision.asc().nullsfirst(),
                JudgeAccount.last_sync_at.asc().nullsfirst(),
                JudgeAccount.id.asc(),
            )
            .limit(limit)
            .all()
        )

    def get_pending_sync_account_ids(self, db: Session, limit: int = 50) -> list[str]:
        """Read durable manual requests; Redis is only a wake-up optimization."""
        rows = (
            db.query(CodeforcesSyncCheckpoint.judge_account_id)
            .join(JudgeAccount, JudgeAccount.id == CodeforcesSyncCheckpoint.judge_account_id)
            .outerjoin(SyncDeadLetter, SyncDeadLetter.judge_account_id == JudgeAccount.id)
            .filter(
                JudgeAccount.verified_flag == True,  # noqa: E712
                JudgeAccount.judge_type == JudgeType.codeforces,
                CodeforcesSyncCheckpoint.request_generation > CodeforcesSyncCheckpoint.served_generation,
                or_(SyncDeadLetter.id == None, SyncDeadLetter.next_retry_at <= datetime.now(timezone.utc)),  # noqa: E711
            )
            .order_by(
                CodeforcesSyncCheckpoint.revision.asc(),
                CodeforcesSyncCheckpoint.requested_at.asc().nullsfirst(),
                CodeforcesSyncCheckpoint.judge_account_id.asc(),
            )
            .limit(limit)
            .all()
        )
        return [str(account_id) for (account_id,) in rows]

    def send_to_dlq(
        self,
        db: Session,
        judge_account_id: uuid.UUID | str,
        reason: DlqFailureReason,
        error_snapshot: Optional[dict] = None,
        backoff_minutes: Optional[int] = None,
    ) -> SyncDeadLetter:
        """
        Record or escalate a failed sync attempt in PostgreSQL Dead-Letter Queue (SADD 4.4).
        Uses exponential backoff for repeat failures.
        """
        now = datetime.now(timezone.utc)
        dlq_entry = db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == judge_account_id).first()

        if dlq_entry is None:
            delay = backoff_minutes if backoff_minutes is not None else 5
            dlq_entry = SyncDeadLetter(
                judge_account_id=judge_account_id,
                failure_reason=reason,
                attempt_count=1,
                last_attempted_at=now,
                next_retry_at=now + timedelta(minutes=delay),
                payload_snapshot=error_snapshot,
            )
            db.add(dlq_entry)
        else:
            dlq_entry.attempt_count += 1
            dlq_entry.failure_reason = reason
            dlq_entry.last_attempted_at = now
            delay = (
                backoff_minutes
                if backoff_minutes is not None
                else min(1440, 5 * (2 ** (dlq_entry.attempt_count - 1)))
            )
            dlq_entry.next_retry_at = now + timedelta(minutes=delay)
            dlq_entry.payload_snapshot = error_snapshot

        db.commit()
        return dlq_entry

    def clear_dlq(self, db: Session, judge_account_id: uuid.UUID | str) -> bool:
        """Remove an account from the Dead-Letter Queue upon successful sync."""
        dlq_entry = db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == judge_account_id).first()
        if dlq_entry:
            db.delete(dlq_entry)
            db.commit()
            return True
        return False

    def get_due_dlq_retries(self, db: Session, limit: int = 50) -> list[SyncDeadLetter]:
        """Fetch DLQ entries that have passed their next_retry_at backoff window."""
        now = datetime.now(timezone.utc)
        return (
            db.query(SyncDeadLetter)
            .filter(SyncDeadLetter.next_retry_at <= now)
            .order_by(SyncDeadLetter.next_retry_at.asc())
            .limit(limit)
            .all()
        )
