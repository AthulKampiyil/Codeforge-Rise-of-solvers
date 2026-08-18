"""Guild War Room (REQ-6.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/war_room", tags=["m6_war_room"])

# TODO: define endpoints per SRS REQ-IDs mapped to this module (see SADD 4.2)
