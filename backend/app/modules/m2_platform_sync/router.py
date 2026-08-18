"""Coding Platform Sync (REQ-2.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/platform_sync", tags=["m2_platform_sync"])

# TODO: define endpoints per SRS REQ-IDs mapped to this module (see SADD 4.2)
