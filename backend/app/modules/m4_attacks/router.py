"""Async Village Attacks (REQ-4.x) — FastAPI routes."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m4_attacks.schemas import (
    AttackCooldownStatusOut,
    AttackDetailOut,
    AttackOut,
    AttackRequest,
    AttackTargetOut,
)
from app.modules.m4_attacks.service import AttackService

router = APIRouter(prefix="/attacks", tags=["m4_attacks"])


@router.get("/targets", response_model=list[AttackTargetOut])
def get_attack_targets(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = 10,
):
    """Matchmaking candidates (REQ-4.1). Real algorithm: plan.md Phase 7."""
    service = AttackService(db)
    return service.find_attack_targets(str(current_user.id), limit)


@router.post("", response_model=AttackOut, status_code=201)
def launch_attack(
    request: AttackRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Launch an attack (REQ-4.1, REQ-4.4)."""
    service = AttackService(db)
    attack = service.start_attack(str(current_user.id), request.target_user_id)
    return AttackOut.model_validate(attack)


@router.get("/cooldown", response_model=AttackCooldownStatusOut)
def get_cooldown_status(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Check attack cooldown status (REQ-4.4)."""
    service = AttackService(db)
    return AttackCooldownStatusOut(**service.get_cooldown_status(str(current_user.id)))


@router.get("/active", response_model=list[AttackOut])
def get_my_active_attacks(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get caller's recent attacks."""
    service = AttackService(db)
    attacks = service.attack_repo.get_attacks_by_attacker(str(current_user.id), limit=10)
    return [AttackOut.model_validate(a) for a in attacks]


@router.get("/{attack_id}", response_model=AttackDetailOut)
def get_attack_detail(
    attack_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get attack detail with curated problem set, live progress, and outcome preview (REQ-4.2)."""
    service = AttackService(db)
    return AttackDetailOut(**service.get_attack_detail(attack_id))


@router.post("/{attack_id}/resolve", response_model=AttackDetailOut)
def resolve_attack_endpoint(
    attack_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    is_abandoned: bool = False,
):
    """Resolve an attack on-demand (REQ-4.3)."""
    service = AttackService(db)
    service.resolve_attack(attack_id, is_abandoned=is_abandoned)
    return AttackDetailOut(**service.get_attack_detail(attack_id))

