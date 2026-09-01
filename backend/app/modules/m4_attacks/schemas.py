"""Async Village Attacks (REQ-4.x) — Pydantic request/response schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AttackRequest(BaseModel):
    """Request to attack a defender (REQ-4.1)."""
    defender_user_id: str
    challenge_topic: Optional[str] = None


class AttackOut(BaseModel):
    """Attack response (REQ-4.1)."""
    id: str
    attacker_user_id: str
    defender_user_id: str
    status: str
    score: int
    challenge_topic: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class AttackTargetOut(BaseModel):
    """Matchmaking target for attacking (REQ-4.2)."""
    id: str
    username: str
    level: int  # Average level from village
    total_solved: int
    defense_rating: float


class AttackCooldownStatusOut(BaseModel):
    """Cooldown status (REQ-4.4)."""
    can_attack: bool
    cooldown_minutes: int
    next_available_at: Optional[datetime]

