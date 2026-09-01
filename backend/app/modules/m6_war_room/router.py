"""Guild War Room (REQ-6.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/war_room", tags=["m6_war_room"])


@router.get("/")
def get_war_room():
    """Stub: Get guild war room (TODO Sprint 2)."""
    return {"message": "Guild war room coming in Sprint 2"}

