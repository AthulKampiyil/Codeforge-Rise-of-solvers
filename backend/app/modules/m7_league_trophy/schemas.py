"""League & Trophy Progression (REQ-7.x) — Pydantic request/response schemas."""
from pydantic import BaseModel
from datetime import datetime


class TrophyOut(BaseModel):
    """Trophy/league status response (REQ-7.x)."""
    tier: str
    points: int
    trophy_count: int
    updated_at: datetime

    class Config:
        from_attributes = True


class LeagueStandingOut(BaseModel):
    """User's position in league leaderboard (TODO Sprint 2)."""
    user_id: str
    username: str
    tier: str
    points: int
    trophy_count: int
    rank: int

