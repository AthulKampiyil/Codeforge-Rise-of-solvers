"""League & Trophy Progression (REQ-7.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/league_trophy", tags=["m7_league_trophy"])

# TODO: define endpoints per SRS REQ-IDs mapped to this module (see SADD 4.2)
