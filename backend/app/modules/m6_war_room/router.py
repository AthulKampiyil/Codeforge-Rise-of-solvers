"""Guild War Room (REQ-6.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dependencies import get_current_active_user
from app.modules.m1_auth.models import User
from app.db.session import get_db
from app.modules.m6_war_room.schemas import WarRoomResponse
from app.modules.m6_war_room.service import WarRoomService

router = APIRouter(prefix="/war_room", tags=["m6_war_room"])


@router.get("/{guild_id}", response_model=WarRoomResponse)
def get_war_room(guild_id: UUID, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get guild war room (Leader/Officer only)."""
    service = WarRoomService(db)
    return service.get_war_room_data(str(guild_id), current_user.id)
