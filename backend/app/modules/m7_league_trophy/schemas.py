"""League & Trophy Progression (REQ-7.x) — Pydantic schemas."""
from datetime import datetime

from pydantic import BaseModel


class LeagueProfileOut(BaseModel):
    """REQ-7.4: current league, trophy count, progress."""
    user_id: str
    trophy_count: int
    league_tier: str
    updated_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntryOut(BaseModel):
    """REQ-7.5: global/guild leaderboard row."""
    user_id: str
    username: str
    trophy_count: int
    league_tier: str
    rank: int
