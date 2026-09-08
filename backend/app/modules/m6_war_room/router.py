"""Guild War Room (REQ-6.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from typing import Annotated, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m6_war_room.service import WarRoomService

router = APIRouter(prefix="/guilds", tags=["m6_war_room"])


@router.get("/{guild_id}/war-room")
def get_war_room_summary(
    guild_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> Dict[str, Any]:
    """Retrieve consolidated War Room summary for a guild (Leader/Officer role-gated)."""
    service = WarRoomService(db)
    return service.get_war_room_summary(guild_id, str(current_user.id))
