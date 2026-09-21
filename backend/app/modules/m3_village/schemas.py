"""Personal Code Village Management (REQ-3.x) — Pydantic schemas."""
from datetime import datetime

from pydantic import BaseModel


class TopicOut(BaseModel):
    id: str
    name: str
    display_name: str
    structure_key: str
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class VillageTopicProgressOut(BaseModel):
    """Individual topic progress in a user's village (REQ-3.1, REQ-3.2)."""
    id: str
    name: str
    display_name: str
    structure_key: str
    progress_points: int
    level: int
    points_to_next_level: int = 0
    progress_pct: float = 0.0

    class Config:
        from_attributes = True


class VillageProfileOut(BaseModel):
    """User's complete village profile (REQ-3.3, REQ-3.4)."""
    user_id: str
    total_solved: int
    average_level: float
    topics: list[VillageTopicProgressOut]
    defense_rating: float
    username: str | None = None
