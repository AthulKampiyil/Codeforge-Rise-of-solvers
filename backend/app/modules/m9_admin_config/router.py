"""Admin & Game-Balance Configuration (UC-11/UC-12)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/admin_config", tags=["m9_admin_config"])

# TODO: define endpoints per SRS REQ-IDs mapped to this module (see SADD 4.2)
