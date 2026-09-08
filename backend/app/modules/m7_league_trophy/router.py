"""League & Trophy Progression (REQ-7.x) — FastAPI routes."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m7_league_trophy.schemas import LeagueProfileOut
from app.modules.m7_league_trophy.service import LeagueService

router = APIRouter(prefix="/league", tags=["m7_league_trophy"])


@router.get("/me", response_model=LeagueProfileOut)
def get_my_league(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """REQ-7.4: current user's trophy count and league tier."""
    service = LeagueService(db)
    return LeagueProfileOut(**service.get_profile_out(str(current_user.id)))
