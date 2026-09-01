"""Async Village Attacks (REQ-4.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m4_attacks.service import AttackService
from app.modules.m4_attacks.schemas import AttackRequest, AttackOut, AttackTargetOut, AttackCooldownStatusOut

router = APIRouter(prefix="/attacks", tags=["m4_attacks"])


@router.get("/targets", response_model=list[AttackTargetOut])
def get_attack_targets(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = 10
) -> list[AttackTargetOut]:
    """
    Get list of potential attack targets via matchmaking (REQ-4.2).

    TODO (Sprint 2): Implement real strength-based matching.
    For Sprint 1: Returns empty list (stub).
    """
    service = AttackService(db)
    targets = service.find_attack_targets(str(current_user.id), limit)
    return targets


@router.post("/", response_model=AttackOut)
def launch_attack(
    request: AttackRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> AttackOut:
    """
    Launch an attack on a defender (REQ-4.1, REQ-4.4).

    Returns:
    {
        "id": UUID,
        "attacker_user_id": UUID,
        "defender_user_id": UUID,
        "status": "pending",
        "score": 0,
        "challenge_topic": string or null,
        "created_at": ISO datetime,
        "resolved_at": null
    }
    """
    service = AttackService(db)

    # Check cooldown
    if not service.can_attack(str(current_user.id)):
        raise HTTPException(status_code=429, detail="On cooldown. Use GET /attacks/cooldown to check status.")

    attack = service.start_attack(
        str(current_user.id),
        request.defender_user_id,
        request.challenge_topic
    )

    if not attack:
        raise HTTPException(status_code=400, detail="Attack creation failed")

    return AttackOut.from_orm(attack)


@router.get("/cooldown", response_model=AttackCooldownStatusOut)
def get_cooldown_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> AttackCooldownStatusOut:
    """
    Check attack cooldown status (REQ-4.4).

    Returns:
    {
        "can_attack": bool,
        "cooldown_minutes": int,
        "next_available_at": ISO datetime or null
    }
    """
    service = AttackService(db)
    status = service.get_cooldown_status(str(current_user.id))
    return AttackCooldownStatusOut(**status)

