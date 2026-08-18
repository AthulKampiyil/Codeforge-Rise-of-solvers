"""Notification & Realtime Gateway (WebSocket)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/notifications", tags=["m8_notifications"])

# TODO: define endpoints per SRS REQ-IDs mapped to this module (see SADD 4.2)
