"""Notification & Realtime Gateway — event envelope (SADD Appendix B.1).

Every WebSocket message uses the common envelope:
    {event_type, event_id, version, timestamp, payload}

Six event types are implemented. Three are verbatim from SADD
Appendix B.1 (ATTACK_INCOMING, TERRITORY_ZONE_CHANGED, VILLAGE_UPDATED);
three more (ATTACK_RESOLVED, LEAGUE_TIER_CHANGED, SYNC_STATUS_CHANGED)
are additions the SADD's own flows require but only implies — REQ-4.5
says "notify the target solver... and summarize the outcome" (needs a
resolution event, not just the incoming one), REQ-7.3 says "promote or
demote... and notifies them", and REQ-2.4's "degraded: <judge>" status
needs a push, not just a poll. Recorded as a SADD v1.2 Appendix B.1
addendum in plan.md Phase 14.
"""
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EventType(str, Enum):
    ATTACK_INCOMING = "ATTACK_INCOMING"
    ATTACK_RESOLVED = "ATTACK_RESOLVED"
    TERRITORY_ZONE_CHANGED = "TERRITORY_ZONE_CHANGED"
    VILLAGE_UPDATED = "VILLAGE_UPDATED"
    LEAGUE_TIER_CHANGED = "LEAGUE_TIER_CHANGED"
    SYNC_STATUS_CHANGED = "SYNC_STATUS_CHANGED"


class EventEnvelope(BaseModel):
    """SADD Appendix B.1 common envelope."""
    event_type: EventType
    event_id: UUID = Field(default_factory=uuid.uuid4)
    version: str = "1.0"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payload: dict[str, Any]


# --- Payload shapes (for construction call sites; not sent as-is) ----------

class AttackIncomingPayload(BaseModel):
    """SADD Appendix B.1, verbatim."""
    attack_id: UUID
    attacker_user_id: UUID
    attacker_username: str
    attacker_defense_rating: float
    target_user_id: UUID
    curated_problem_count: int
    attack_window_expires_at: Optional[datetime]


class AttackResolvedPayload(BaseModel):
    """Addition — REQ-4.5's "summarize the outcome" needs a second event
    beyond the incoming notice."""
    attack_id: UUID
    attacker_user_id: UUID
    target_user_id: UUID
    solved_fraction: float
    attacker_trophy_delta: int
    target_trophy_delta: int


class TerritoryZoneChangedPayload(BaseModel):
    """SADD Appendix B.1, verbatim."""
    zone_id: UUID
    zone_name: str
    previous_owner_guild_id: Optional[UUID]
    new_owner_guild_id: UUID
    guild_scores: list[dict[str, Any]]


class VillageUpdatedPayload(BaseModel):
    """SADD Appendix B.1, verbatim."""
    user_id: UUID
    topic_id: UUID
    topic_name: str
    previous_level: int
    new_level: int
    new_defense_rating: float
    source: str  # "sync" | "attack_resolution"
    source_ref_id: UUID


class LeagueTierChangedPayload(BaseModel):
    """Addition — REQ-7.3 "promotes or demotes... and notifies them"."""
    user_id: UUID
    previous_tier: str
    new_tier: str
    trophy_count: int


class SyncStatusChangedPayload(BaseModel):
    """Addition — REQ-2.4 status indicator, pushed rather than polled only."""
    user_id: UUID
    judge_account_id: UUID
    judge_name: str
    status: str  # up_to_date | in_progress | failed | degraded
    last_error: Optional[str]


class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    event_type: str
    payload: Optional[dict]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
