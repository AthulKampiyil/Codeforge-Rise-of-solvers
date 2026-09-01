"""Notification & WebSocket Schemas (REQ-8.x)

Pydantic models for WebSocket events and notifications.
Owns: HTTP-facing contract for M8. Used by router layer.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class WebSocketEventBase(BaseModel):
    """Base WebSocket event."""
    event_type: str
    timestamp: datetime
    user_id: UUID


class AttackReceivedEvent(WebSocketEventBase):
    """Attack received notification."""
    attacker_id: UUID
    attacker_username: str
    challenge_topic: str
    attack_id: UUID


class AttackResolvedEvent(WebSocketEventBase):
    """Attack resolution notification."""
    attack_id: UUID
    success: bool
    score: int


class TerritoryLostEvent(WebSocketEventBase):
    """Territory lost notification."""
    zone_id: UUID
    zone_name: str
    losing_guild_id: UUID
    winning_guild_id: Optional[UUID]


class TerritoryGainedEvent(WebSocketEventBase):
    """Territory gained notification."""
    zone_id: UUID
    zone_name: str
    guild_id: UUID


class GuildInvitationEvent(WebSocketEventBase):
    """Guild invitation notification."""
    guild_id: UUID
    guild_name: str
    inviter_id: UUID
    inviter_username: str


class GuildMemberJoinedEvent(WebSocketEventBase):
    """Guild member joined notification."""
    guild_id: UUID
    guild_name: str
    new_member_id: UUID
    new_member_username: str
    role: str


class SyncCompleteEvent(WebSocketEventBase):
    """Judge sync completion notification."""
    judge_name: str
    total_problems_synced: int
    new_problems: int


class LeaguePromotionEvent(WebSocketEventBase):
    """League tier promotion notification."""
    old_tier: str
    new_tier: str
    points: int


class NotificationOut(BaseModel):
    """Notification record response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    event_type: str
    payload: Optional[str]
    is_read: bool
    created_at: datetime


class ConnectionStatusOut(BaseModel):
    """WebSocket connection status response."""
    user_id: UUID
    is_connected: bool
    last_connection: Optional[datetime]
