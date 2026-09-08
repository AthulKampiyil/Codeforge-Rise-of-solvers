"""Async Village Attacks (REQ-4.x) — Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AttackRequest(BaseModel):
    """Request to attack a target (REQ-4.1)."""
    target_user_id: str


class AttackOut(BaseModel):
    id: str
    attacker_user_id: str
    target_user_id: str
    status: str
    score: int
    solved_fraction: Optional[float]
    started_at: datetime
    window_expires_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class AttackTargetOut(BaseModel):
    """Matchmaking candidate (REQ-4.1). Populated for real in plan.md Phase 7."""
    id: str
    username: str
    defense_rating: float


class AttackCooldownStatusOut(BaseModel):
    can_attack: bool
    next_available_at: Optional[datetime]
