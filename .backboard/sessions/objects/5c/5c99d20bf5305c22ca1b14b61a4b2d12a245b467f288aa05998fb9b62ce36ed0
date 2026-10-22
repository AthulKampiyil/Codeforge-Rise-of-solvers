"""Admin & Game-Balance Configuration (UC-11/UC-12)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m9_admin_config.schemas import (
    AuditLogEntryOut,
    ConfigEntryOut,
    ConfigUpdateRequest,
    ConfigUpdateResponse,
    SuspendUserRequest,
    UserAdminOut,
)
from app.modules.m9_admin_config.service import AdminModeration, GameBalanceConfig

router = APIRouter(prefix="/admin", tags=["m9_admin_config"])


@router.get("/config", response_model=list[ConfigEntryOut])
def list_config(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """List every game-balance key with its current value (UC-12)."""
    return GameBalanceConfig(db).get_all()


@router.put("/config/{key}", response_model=ConfigUpdateResponse)
def update_config(
    key: str,
    payload: ConfigUpdateRequest,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Update one game-balance key (UC-12). Validates the new value against
    the key's stored type, busts its cache entry so the change takes
    effect without a restart, and writes an admin_audit_log row (NFR-3.5).
    """
    return GameBalanceConfig(db).set(key, payload.value, str(admin.id))


@router.get("/users", response_model=list[UserAdminOut])
def list_users(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    search: Optional[str] = Query(None, description="Matches username or email"),
    suspended: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List/search users for moderation (UC-11)."""
    return AdminModeration(db).list_users(search, suspended, limit, offset)


@router.post("/users/{user_id}/suspend", response_model=UserAdminOut)
def suspend_user(
    user_id: str,
    payload: SuspendUserRequest,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """Suspend a user (UC-11). Writes an `admin_audit_log` row with the reason."""
    return AdminModeration(db).suspend_user(user_id, payload.reason, str(admin.id))


@router.post("/users/{user_id}/unsuspend", response_model=UserAdminOut)
def unsuspend_user(
    user_id: str,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """Lift a suspension (UC-11)."""
    return AdminModeration(db).unsuspend_user(user_id, str(admin.id))


@router.get("/audit-log", response_model=list[AuditLogEntryOut])
def list_audit_log(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Browse the administrative audit trail (NFR-3.5)."""
    return AdminModeration(db).list_audit_log(limit, offset)
