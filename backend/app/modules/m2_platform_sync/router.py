"""Coding Platform Sync (REQ-2.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter, Depends
from typing import Annotated
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m2_platform_sync.models import SyncLog

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

