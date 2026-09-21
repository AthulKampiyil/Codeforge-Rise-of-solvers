"""League & Trophy Progression (REQ-7.x) — FastAPI routes."""
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m7_league_trophy.schemas import (
    LeaderboardEntryOut,
    LeagueProfileOut,
    TrophyLedgerEntryOut,
)
from app.modules.m7_league_trophy.service import LeagueService

router = APIRouter(prefix="/league", tags=["m7_league_trophy"])


@router.get("/me", response_model=LeagueProfileOut)
def get_my_league(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """REQ-7.4: current user's trophy count, rank, and league tier."""
    service = LeagueService(db)
    return LeagueProfileOut(**service.get_profile_out(str(current_user.id)))


@router.get("/leaderboard", response_model=List[LeaderboardEntryOut])
def get_leaderboard(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    scope: str = Query("global", regex="^(global|guild)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """REQ-7.5: global or guild-scoped leaderboard standings."""
    service = LeagueService(db)
    entries = service.get_leaderboard(
        current_user_id=str(current_user.id), scope=scope, limit=limit, offset=offset
    )
    return [LeaderboardEntryOut(**entry) for entry in entries]


@router.get("/ledger", response_model=List[TrophyLedgerEntryOut])
def get_my_trophy_ledger(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(50, ge=1, le=100),
):
    """SADD App. D: retrieve current user's append-only trophy audit ledger."""
    service = LeagueService(db)
    entries = service.get_ledger_history(str(current_user.id), limit=limit)
    return [TrophyLedgerEntryOut(**entry) for entry in entries]
