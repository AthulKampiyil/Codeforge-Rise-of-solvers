"""Admin & Game-Balance Configuration (UC-11/UC-12)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m9_admin_config.schemas import (
    ConfigEntryOut,
    ConfigUpdateRequest,
    ConfigUpdateResponse,
)
from app.modules.m9_admin_config.service import GameBalanceConfig

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
