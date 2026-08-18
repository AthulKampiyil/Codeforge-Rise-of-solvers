"""Guild Management & Territory Control (REQ-5.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/guild_territory", tags=["m5_guild_territory"])

# TODO: define endpoints per SRS REQ-IDs mapped to this module (see SADD 4.2)
