"""Coding Platform Sync (REQ-2.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m2_platform_sync.models import SyncLog
from app.modules.m1_auth.models import JudgeAccount, JudgeType
from app.modules.m2_platform_sync.sync_scheduler import SyncScheduler
from app.core.config import settings
from app.core.redis import get_redis
from app.modules.m8_notifications.service import NotificationService
from redis.asyncio import Redis

router = APIRouter(prefix="/platform_sync", tags=["m2_platform_sync"])


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
    logs = db.query(SyncLog).filter(SyncLog.user_id == str(current_user.id)).all()
    return [
        {
            "judge_name": log.judge_name,
            "status": log.status.value,
            "last_synced_at": log.last_synced_at.isoformat() if log.last_synced_at else None,
            "last_error": log.last_error,
        }
        for log in logs
    ]


@router.post("/sync")
async def request_sync(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
    judge: JudgeType = JudgeType.codeforces,
) -> dict:
    """Run an on-demand sync, enforcing the per-account cooldown."""
    account = db.query(JudgeAccount).filter(
        JudgeAccount.user_id == current_user.id,
        JudgeAccount.judge_type == judge,
    ).first()
    if account is None:
        raise HTTPException(status_code=404, detail="No linked judge account")
    if account.last_sync_at:
        elapsed = (datetime.now(timezone.utc) - account.last_sync_at).total_seconds()
        if elapsed < settings.ONDEMAND_SYNC_COOLDOWN_SECONDS:
            retry_after = int(settings.ONDEMAND_SYNC_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"code": "sync_cooldown", "retry_after_seconds": retry_after},
                headers={"Retry-After": str(retry_after)},
            )
    async def publish(event_type, payload, user_ids):
        await NotificationService(db).publish(redis, event_type, payload, user_ids)

    succeeded = await SyncScheduler(db, event_publisher=publish).sync_judge_account(str(account.id))
    if not succeeded:
        raise HTTPException(status_code=502, detail="Judge sync failed")
    return {"status": "up_to_date", "last_synced_at": account.last_sync_at}
