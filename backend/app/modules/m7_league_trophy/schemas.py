"""League & Trophy Progression (REQ-7.x) — Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LeagueProfileOut(BaseModel):
    """REQ-7.4: current league, trophy count, progress."""
    user_id: str
    trophy_count: int
    league_tier: str
    rank: int = 1
    updated_at: datetime
    progress_pct: Optional[float] = None
    next_tier: Optional[str] = None
    next_tier_threshold: Optional[int] = None
    k_factor: Optional[int] = None

    class Config:
        from_attributes = True


class LeaderboardEntryOut(BaseModel):
    """REQ-7.5: global/guild leaderboard row."""
    user_id: str
    username: str
    trophy_count: int
    league_tier: str
    rank: int


class TrophyLedgerEntryOut(BaseModel):
    """SADD App. D auditable mutation entry."""
    id: str
    user_id: str
    event_type: str
    delta: int
    resulting_balance: Optional[int] = None
    source_ref_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
