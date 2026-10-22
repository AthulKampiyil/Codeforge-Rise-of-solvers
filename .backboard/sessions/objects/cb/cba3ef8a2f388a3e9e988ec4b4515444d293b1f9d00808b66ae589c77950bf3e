"""Personal Code Village Management (REQ-3.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter, Depends
from typing import Annotated
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m3_village.service import VillageService
from app.modules.m3_village.schemas import VillageProfileOut
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

