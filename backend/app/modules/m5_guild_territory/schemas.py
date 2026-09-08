"""Guild & Territory Schemas (REQ-5.x)."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class GuildCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=500)


class GuildOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class GuildMembershipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    guild_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime


class GuildDetailOut(GuildOut):
    memberships: List[GuildMembershipOut] = []


class TerritoryZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    owning_guild_id: Optional[UUID]
    topic_affinity: dict
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class JoinRequestCreate(BaseModel):
    """REQ-5.2 — a solver requests to join an existing guild."""
    pass  # guild_id comes from the path


class JoinRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    guild_id: UUID
    user_id: UUID
    status: str
    created_at: datetime


class RoleUpdate(BaseModel):
    role: str = Field(pattern="^(leader|officer|member)$")
