"""Coding Platform Sync (REQ-2.x) — Pydantic request/response schemas."""

from datetime import datetime
from pydantic import BaseModel


class SolvedHistoryItemOut(BaseModel):
    problem_id: str
    tags: list[str]
    rating: int | None
    solved_at: datetime
    credited: bool


class SolvedHistoryPageOut(BaseModel):
    items: list[SolvedHistoryItemOut]
    offset: int
    limit: int
    total: int
