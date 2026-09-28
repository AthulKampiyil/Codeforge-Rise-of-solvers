"""M6 War Room schemas — request/response shapes for REQ-6.1–6.3."""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class MemberTopicLevel(BaseModel):
    topic_name: str
    level: int


class MemberZoneContribution(BaseModel):
    zone_id: str
    contribution: float
    share_pct: float


class MemberOut(BaseModel):
    user_id: str
    username: str
    defense_rating: float
    league_tier: str
    last_sync_at: Optional[datetime] = None
    topic_levels: dict[str, int] = Field(default_factory=dict)
    zone_contributions: list[MemberZoneContribution] = Field(default_factory=list)
    aligns_with_contested: list[str] = Field(default_factory=list)


class ContestedZoneOut(BaseModel):
    zone_id: str
    zone_name: str
    our_score: float
    leading_guild: str
    leading_score: float
    gap_pct: float
    top_affinity_topics: list[str]


class WarRoomOut(BaseModel):
    guild: dict
    contested_zones: list[ContestedZoneOut] = Field(default_factory=list)
    members: list[MemberOut] = Field(default_factory=list)
