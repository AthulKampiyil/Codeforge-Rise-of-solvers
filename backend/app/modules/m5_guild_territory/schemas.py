"""Guild & Territory Schemas (REQ-5.x)

Pydantic models for request/response validation.
Owns: HTTP-facing contract for M5. Used by router layer.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class GuildCreate(BaseModel):
    """Request to create a new guild."""
    name: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=500)


class GuildOut(BaseModel):
    """Guild response model."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    owner_id: UUID
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class GuildMembershipOut(BaseModel):
    """Guild membership response model."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    guild_id: UUID
    user_id: UUID
    role: str  # leader, officer, member
    joined_at: datetime


class GuildDetailOut(GuildOut):
    """Guild with members detail."""
    memberships: List[GuildMembershipOut] = []


class TerritoryZoneOut(BaseModel):
    """Territory zone response model."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    zone_name: str
    owning_guild_id: Optional[UUID]
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class JoinRequestCreate(BaseModel):
    """Request to join a guild."""
    guild_id: UUID


class JoinRequestApprove(BaseModel):
    """Approve a join request."""
    user_id: UUID
    role: str = Field(default="member", pattern="^(leader|officer|member)$")
