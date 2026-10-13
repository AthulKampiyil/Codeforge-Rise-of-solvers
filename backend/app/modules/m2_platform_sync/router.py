"""Coding Platform Sync (REQ-2.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Annotated
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.core.dependencies import get_current_active_user, get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m2_platform_sync.models import SyncLog, CodeforcesSyncCheckpoint, SolvedProblem
from app.modules.m10_economy.models import EconomyLedger
from app.modules.m2_platform_sync.schemas import SolvedHistoryPageOut
from app.modules.m1_auth.models import JudgeAccount, JudgeType
from app.core.config import settings
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/platform_sync", tags=["m2_platform_sync"])


@router.get("/problems", response_model=SolvedHistoryPageOut)
def get_solved_history(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> SolvedHistoryPageOut:
    """Return bounded, stable history for the user's verified Codeforces account."""
    account = db.query(JudgeAccount).filter(
        JudgeAccount.user_id == current_user.id,
        JudgeAccount.judge_type == JudgeType.codeforces,
        JudgeAccount.verified_flag.is_(True),
    ).first()
    if account is None:
        raise HTTPException(status_code=404, detail="No verified Codeforces account")

    facts = db.query(SolvedProblem).filter(SolvedProblem.judge_account_id == account.id)
    total = facts.count()
    rows = (
        db.query(SolvedProblem, EconomyLedger.id)
        .outerjoin(EconomyLedger, EconomyLedger.solved_problem_id == SolvedProblem.id)
        .filter(SolvedProblem.judge_account_id == account.id)
        .order_by(SolvedProblem.solved_at.desc(), SolvedProblem.id.desc())
        .offset(offset).limit(limit).all()
    )
    return SolvedHistoryPageOut(
        items=[{
            "problem_id": solve.problem_ext_id,
            "tags": solve.topic_tags,
            "rating": solve.rating,
            "solved_at": solve.solved_at,
            "credited": ledger_id is not None,
        } for solve, ledger_id in rows],
        offset=offset,
        limit=limit,
        total=total,
    )


@router.get("/status")
def get_sync_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> list[dict]:
    """
    Get sync status for all of user's linked judges.

    Returns:
    [
        {
            "judge_name": "codeforces",
            "status": "up_to_date" | "in_progress" | "failed",
            "last_synced_at": ISO datetime or null,
            "last_error": string or null
        },
        ...
    ]
    """
    accounts = db.query(JudgeAccount).filter(JudgeAccount.user_id == current_user.id).all()
    output = []
    for account in accounts:
        log = db.query(SyncLog).filter(SyncLog.judge_account_id == account.id).first()
        checkpoint = db.query(CodeforcesSyncCheckpoint).filter(
            CodeforcesSyncCheckpoint.judge_account_id == account.id
        ).with_for_update().first()
        pending_request = bool(
            checkpoint
            and checkpoint.request_generation > checkpoint.served_generation
        )
        full_reconciliation_due = bool(
            checkpoint
            and (
                checkpoint.full_reconciled_at is None
                or checkpoint.full_reconciled_at <= datetime.now(timezone.utc)
                - timedelta(minutes=settings.SYNC_POLL_INTERVAL_MINUTES)
            )
        )
        active_checkpoint = bool(
            checkpoint
            and (
                checkpoint.head_status == "in_progress"
                or checkpoint.history_status == "in_progress"
                or checkpoint.full_scan_offset is not None
            )
        )
        active_sync = pending_request or active_checkpoint
        supported_judge = account.judge_type == JudgeType.codeforces
        sync_status = (
            "in_progress" if active_sync
            else log.status.value if log and supported_judge
            else "failed" if not supported_judge
            else "in_progress"
        )
        output.append({
            "judge_name": account.judge_type.value,
            "status": sync_status,
            "last_synced_at": log.last_synced_at.isoformat() if log and log.last_synced_at else None,
            "last_error": log.last_error if log else None,
            "history_state": checkpoint.history_status if checkpoint else "pending",
            "history_rows": checkpoint.raw_submission_count if checkpoint else 0,
            "history_pages": checkpoint.history_page_count if checkpoint else 0,
            "head_state": checkpoint.head_status if checkpoint else "pending",
            "request_state": "pending" if pending_request else "idle",
            "request_generation": checkpoint.request_generation if checkpoint else 0,
            "served_generation": checkpoint.served_generation if checkpoint else 0,
            "full_reconciliation_state": (
                "in_progress" if checkpoint and checkpoint.full_scan_offset is not None
                else "pending" if full_reconciliation_due
                else "complete" if checkpoint and checkpoint.full_reconciled_at
                else "pending"
            ),
            "full_reconciled_at": (
                checkpoint.full_reconciled_at.isoformat()
                if checkpoint and checkpoint.full_reconciled_at else None
            ),
        })
    return output


@router.post("/sync", status_code=status.HTTP_202_ACCEPTED)
async def request_sync(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    judge: JudgeType = JudgeType.codeforces,
) -> dict:
    """Queue an on-demand sync without waiting on Codeforces."""
    account = db.query(JudgeAccount).filter(
        JudgeAccount.user_id == current_user.id,
        JudgeAccount.judge_type == judge,
    ).with_for_update().first()
    if account is None:
        raise HTTPException(status_code=404, detail="No linked judge account")
    if not account.verified_flag:
        raise HTTPException(status_code=409, detail="Judge account must be verified before syncing")
    account_id = str(account.id)
    try:
        db.execute(pg_insert(CodeforcesSyncCheckpoint).values(judge_account_id=account.id).on_conflict_do_nothing(
            constraint="uq_cf_sync_checkpoints_account"
        ))
        checkpoint = db.query(CodeforcesSyncCheckpoint).filter(
            CodeforcesSyncCheckpoint.judge_account_id == account.id
        ).with_for_update().populate_existing().first()
        now = datetime.now(timezone.utc)
        cooldown_seconds = max(300, settings.ONDEMAND_SYNC_COOLDOWN_SECONDS)
        if checkpoint.requested_at:
            requested_at = checkpoint.requested_at
            if requested_at.tzinfo is None:
                requested_at = requested_at.replace(tzinfo=timezone.utc)
            elapsed = (now - requested_at).total_seconds()
            if elapsed < cooldown_seconds:
                db.rollback()
                raise HTTPException(429, detail={
                    "code": "sync_cooldown",
                    "retry_after_seconds": int(cooldown_seconds - elapsed) + 1,
                })
        checkpoint.requested_at = now
        checkpoint.request_generation += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(503, detail="Sync queue unavailable") from exc
    return {"status": "queued", "judge_account_id": account_id}
