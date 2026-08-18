"""Authentication & Account Linking (REQ-1.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["m1_auth"])

# TODO: define endpoints per SRS REQ-IDs mapped to this module (see SADD 4.2)
