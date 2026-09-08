"""Guild & Territory Router (REQ-5.x) — FastAPI routes."""
from typing import Annotated, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m5_guild_territory.schemas import (
    GuildCreate,
    GuildDetailOut,
    GuildOut,
    JoinRequestOut,
    TerritoryZoneOut,
)
from app.modules.m5_guild_territory.service import GuildService

router = APIRouter(prefix="/guilds", tags=["m5_guild_territory"])


@router.post("", response_model=GuildOut, status_code=status.HTTP_201_CREATED)
def create_guild(
    guild_data: GuildCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new guild; current user becomes Leader (REQ-5.1)."""
    service = GuildService(db)
    guild = service.create_guild(guild_data.name, current_user.id, guild_data.description)
    return GuildOut.model_validate(guild)


@router.get("", response_model=List[GuildOut])
def list_guilds(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return [GuildOut.model_validate(g) for g in GuildService(db).list_all_guilds()]


@router.get("/me", response_model=GuildDetailOut | None)
def get_my_guild(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """The guild the current user belongs to, if any (SRS 5.5: at most one)."""
    service = GuildService(db)
    guild = service.get_user_guild(current_user.id)
    if not guild:
        return None
    members = service.get_guild_members(guild.id)
    data = GuildOut.model_validate(guild).model_dump()
    data["memberships"] = members
    return GuildDetailOut(**data)


@router.get("/{guild_id}", response_model=GuildDetailOut)
def get_guild(
    guild_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    service = GuildService(db)
    guild = service.get_guild(guild_id)
    members = service.get_guild_members(guild.id)
    data = GuildOut.model_validate(guild).model_dump()
    data["memberships"] = members
    return GuildDetailOut(**data)


@router.post("/{guild_id}/join-requests", response_model=JoinRequestOut, status_code=status.HTTP_201_CREATED)
def request_to_join(
    guild_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """REQ-5.2: request to join an existing guild."""
    service = GuildService(db)
    request = service.request_to_join(guild_id, current_user.id)
    return JoinRequestOut.model_validate(request)


@router.get("/{guild_id}/join-requests", response_model=List[JoinRequestOut])
def list_pending_requests(
    guild_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Leader/Officer only (REQ-5.2)."""
    service = GuildService(db)
    return [JoinRequestOut.model_validate(r) for r in service.get_pending_requests(guild_id, current_user.id)]


@router.post("/{guild_id}/join-requests/{request_id}/approve", response_model=JoinRequestOut)
def approve_join_request(
    guild_id: str,
    request_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """REQ-5.2: Leader/Officer approves a pending join request."""
    service = GuildService(db)
    request = service.approve_join_request(guild_id, request_id, current_user.id)
    return JoinRequestOut.model_validate(request)


@router.post("/{guild_id}/join-requests/{request_id}/reject", response_model=JoinRequestOut)
def reject_join_request(
    guild_id: str,
    request_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    service = GuildService(db)
    request = service.reject_join_request(guild_id, request_id, current_user.id)
    return JoinRequestOut.model_validate(request)


@router.delete("/{guild_id}/members/{user_id}")
def remove_guild_member(
    guild_id: str,
    user_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Leader/Officer only (SRS Business Rule 5.5)."""
    service = GuildService(db)
    service.remove_member(guild_id, user_id, current_user.id)
    return {"message": "Member removed"}


@router.post("/{guild_id}/leave")
def leave_guild(
    guild_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    service = GuildService(db)
    service.leave_guild(guild_id, current_user.id)
    return {"message": "Left guild"}


@router.get("/territory/zones", response_model=List[TerritoryZoneOut])
def get_all_zones(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """REQ-5.5: territory-control map visible to all authenticated users."""
    service = GuildService(db)
    return [TerritoryZoneOut.model_validate(z) for z in service.get_all_zones()]
