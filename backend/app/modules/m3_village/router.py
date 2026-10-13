"""Personal Code Village Management (REQ-3.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from app.core.dependencies import get_current_active_user, get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m3_village.service import VillageService
from app.modules.m3_village.schemas import (
    OutpostSnapshotOut, OutpostUpgradeOut, OutpostUpgradeRequest, VillageProfileOut,
)
from app.modules.m3_village.outpost_service import (
    OutpostConflict, OutpostInsufficientFunds, OutpostNotFound, TopicOutpostService,
)
from app.modules.m3_village.outpost_layout_service import (
    OutpostLayoutConflict, OutpostLayoutInvalid, OutpostLayoutService,
)
from app.modules.m3_village.schemas import (
    OutpostLayoutPutOut, OutpostLayoutPutRequest, OutpostLayoutSnapshotOut,
)
from uuid import UUID
from sqlalchemy.orm import Session

router = APIRouter(prefix="/village", tags=["m3_village"])


@router.get("/me", response_model=VillageProfileOut)
def get_my_village(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> VillageProfileOut:
    """
    Get current user's village profile (REQ-3.4).

    Returns:
    {
        "user_id": UUID,
        "total_solved": int,
        "average_level": float,
        "topics": [...],
        "defense_rating": float
    }
    """
    service = VillageService(db)
    profile = service.get_user_village(str(current_user.id))
    return VillageProfileOut(**profile)


@router.get("/outposts", response_model=OutpostSnapshotOut)
def get_outposts(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OutpostSnapshotOut:
    return OutpostSnapshotOut(**TopicOutpostService(db).get_snapshot(current_user.id))


@router.post("/outposts/{topic_id}/upgrade", response_model=OutpostUpgradeOut)
def upgrade_outpost(
    topic_id: UUID,
    payload: OutpostUpgradeRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OutpostUpgradeOut:
    try:
        result = TopicOutpostService(db).upgrade(
            user_id=current_user.id,
            topic_id=topic_id,
            idempotency_key=payload.idempotency_key,
            expected_tier=payload.expected_tier,
        )
        return OutpostUpgradeOut(**result)
    except OutpostNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (OutpostConflict, OutpostInsufficientFunds) as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/outposts/layout", response_model=OutpostLayoutSnapshotOut)
def get_outpost_layout(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OutpostLayoutSnapshotOut:
    return OutpostLayoutSnapshotOut(**OutpostLayoutService(db).get_layout(current_user.id))


@router.put("/outposts/layout", response_model=OutpostLayoutPutOut)
def put_outpost_layout(
    payload: OutpostLayoutPutRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OutpostLayoutPutOut:
    try:
        result = OutpostLayoutService(db).put_layout(
            user_id=current_user.id,
            expected_revision=payload.expected_revision,
            rules_version=payload.rules_version,
            idempotency_key=payload.idempotency_key,
            items=[item.model_dump() for item in payload.items],
        )
        return OutpostLayoutPutOut(**result)
    except OutpostLayoutInvalid as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except OutpostLayoutConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
