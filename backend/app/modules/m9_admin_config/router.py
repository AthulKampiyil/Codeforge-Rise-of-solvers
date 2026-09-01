"""Admin & Game-Balance Configuration (UC-11/UC-12)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/admin_config", tags=["m9_admin_config"])


@router.get("/")
def get_admin_config():
    """Stub: Get admin configuration (TODO Sprint 2)."""
    return {"message": "Admin configuration coming in Sprint 2"}

