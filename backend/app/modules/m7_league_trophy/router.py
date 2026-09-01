"""League & Trophy Progression (REQ-7.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter, Depends
from typing import Annotated
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m7_league_trophy.service import LeagueService
from app.modules.m7_league_trophy.schemas import TrophyOut

router = APIRouter(prefix="/league", tags=["m7_league_trophy"])


@router.get("/me", response_model=TrophyOut)
def get_my_league(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> TrophyOut:
    """
    Get current user's trophy/league status (REQ-7.x).

    Returns:
    {
        "tier": "bronze|silver|gold|platinum|diamond|legend",
        "points": int,
        "trophy_count": int,
        "updated_at": ISO datetime
    }
    """
    service = LeagueService(db)
    trophy = service.get_user_trophy(str(current_user.id))
    if trophy:
        return TrophyOut(**trophy)

    # Fallback: create new trophy record
    trophy_obj = service.get_or_create_trophy(str(current_user.id))
    return TrophyOut.from_orm(trophy_obj)

