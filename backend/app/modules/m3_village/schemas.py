"""Personal Code Village Management (REQ-3.x) — Pydantic request/response schemas."""
from pydantic import BaseModel
from datetime import datetime


class TopicOut(BaseModel):
    """Topic response schema."""
    id: str
    name: str
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class VillageTopicProgressOut(BaseModel):
    """Individual topic progress in user's village."""
    id: str
    name: str
    solved_count: int
    level: int

    class Config:
        from_attributes = True


class VillageProfileOut(BaseModel):
    """User's complete village profile (REQ-3.4)."""
    user_id: str
    total_solved: int
    average_level: float
    topics: list[VillageTopicProgressOut]
    defense_rating: float

