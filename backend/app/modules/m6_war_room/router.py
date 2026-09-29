"""M6 War Room router — REQ-6.1–6.3.

Owns HTTP-facing endpoints only; business logic lives in service.py.
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m6_war_room.schemas import WarRoomOut
from app.modules.m6_war_room.service import WarRoomService

router = APIRouter(prefix="/war_room", tags=["m6_war_room"])


@router.get("/{guild_id}", response_model=WarRoomOut)
def get_war_room(
    guild_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
) -> WarRoomOut:
    """
    Get guild war room view (REQ-6.1–6.3).

    Role-gated: Leader or Officer only (NFR-3.3). Plain members and
    non-members get 403. Returns contested zones with real scores, the
    member topic-strength matrix, and per-member zone contributions.
    """
    svc = WarRoomService(db)
    return svc.get_war_room(guild_id, str(current_user.id))
