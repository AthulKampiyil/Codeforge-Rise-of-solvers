"""Async Village Attacks (REQ-4.x) — Pydantic schemas."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class AttackRequest(BaseModel):
    """Request to launch attack on target (REQ-4.1)."""
    target_user_id: UUID


class AttackProblemOut(BaseModel):
    """Curated problem item with Open on Codeforces URL (REQ-4.2)."""
    id: UUID
    problem_ext_id: str
    problem_name: Optional[str] = None
    problem_url: Optional[str] = None
    topic_id: Optional[UUID] = None
    rating: Optional[int] = None
    solved_flag: bool = False
    solved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttackOut(BaseModel):
    """Basic attack outcome/record (REQ-4.1)."""
    id: UUID
    attacker_user_id: UUID
    target_user_id: UUID
    status: str
    score: int
    solved_fraction: Optional[float] = None
    started_at: datetime
    window_expires_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttackDetailOut(AttackOut):
    """Detailed attack view for /attack/:id with problem set and outcome preview."""
    problems: List[AttackProblemOut] = []
    attacker_username: Optional[str] = None
    target_username: Optional[str] = None
    attacker_defense_rating: Optional[float] = None
    target_defense_rating: Optional[float] = None
    attacker_trophy_delta: Optional[int] = None
    target_trophy_delta: Optional[int] = None
    remaining_seconds: Optional[int] = None


class AttackTargetOut(BaseModel):
    """Matchmaking candidate with strength indicator (REQ-4.1)."""
    id: UUID
    username: str
    defense_rating: float
    level: Optional[int] = None
    relative_strength: Optional[str] = None  # "weaker" | "even" | "stronger"


class AttackCooldownStatusOut(BaseModel):
    """Cooldown status backed by PostgreSQL source of truth (SADD §7.2.1)."""
    can_attack: bool
    cooldown_minutes: int = 60
    next_available_at: Optional[datetime] = None
    remaining_seconds: Optional[int] = None
