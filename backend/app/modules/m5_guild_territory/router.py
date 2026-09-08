"""Guild & Territory Router (REQ-5.x)

FastAPI route definitions for guild management.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m5_guild_territory.service import GuildService
from app.modules.m5_guild_territory.schemas import (
    GuildCreate, GuildOut, GuildDetailOut, TerritoryZoneOut, JoinRequestApprove
)

router = APIRouter(prefix="/guilds", tags=["m5_guild_territory"])


@router.post("", response_model=GuildOut, status_code=status.HTTP_201_CREATED)
def create_guild(
    guild_data: GuildCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> GuildOut:
    """Create a new guild (current user becomes owner/leader)."""
    try:
        service = GuildService(db)
        guild = service.create_guild(
            name=guild_data.name,
            owner_id=current_user.id,
            description=guild_data.description
        )
        return GuildOut.model_validate(guild)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[GuildOut])
def list_guilds(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> List[GuildOut]:
    """List all guilds."""
    service = GuildService(db)
    guilds = service.list_all_guilds()
    return [GuildOut.model_validate(g) for g in guilds]


@router.get("/my-guild", response_model=GuildDetailOut)
def get_my_guild(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> GuildDetailOut:
    """Get guild owned by current user."""
    service = GuildService(db)
    guild = service.get_user_guild(current_user.id)
    if not guild:
        raise HTTPException(status_code=404, detail="User does not own a guild")
    
    memberships = service.get_guild_members(guild.id)
    guild_dict = GuildOut.model_validate(guild).model_dump()
    guild_dict["memberships"] = memberships
    return GuildDetailOut(**guild_dict)


@router.post("/{guild_id}/join-request", status_code=201)
def request_join_guild(
    guild_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> dict:
    """Submit a request to join a guild (REQ-5.2)."""
    service = GuildService(db)
    try:
        req = service.request_to_join(guild_id, str(current_user.id))
        return {"message": "Join request submitted", "request_id": str(req.id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{guild_id}/requests")
def list_join_requests(
    guild_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> list:
    """List pending join requests for a guild (Leader/Officer only)."""
    service = GuildService(db)
    membership = service.membership_repo.get_membership(guild_id, current_user.id)
    if not membership or membership.role not in ["leader", "officer"]:
        raise HTTPException(status_code=403, detail="Only leaders/officers can view join requests")
    
    reqs = service.get_pending_requests(guild_id)
    return [{"id": str(r.id), "user_id": str(r.user_id), "status": r.status, "created_at": r.created_at.isoformat()} for r in reqs]


@router.post("/{guild_id}/requests/{request_id}/approve")
def approve_join_request(
    guild_id: str,
    request_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> dict:
    """Approve a pending join request (REQ-5.2)."""
    service = GuildService(db)
    try:
        membership = service.approve_join_request(request_id, str(current_user.id))
        return {"message": "Join request approved", "membership_id": str(membership.id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{guild_id}/requests/{request_id}/reject")
def reject_join_request(
    guild_id: str,
    request_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> dict:
    """Reject a pending join request (REQ-5.2)."""
    service = GuildService(db)
    try:
        service.reject_join_request(request_id, str(current_user.id))
        return {"message": "Join request rejected"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{guild_id}", response_model=GuildDetailOut)
def get_guild(
    guild_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> GuildDetailOut:
    """Get guild details by ID."""
    service = GuildService(db)
    guild = service.get_guild(guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    
    memberships = service.get_guild_members(guild.id)
    guild_dict = GuildOut.model_validate(guild).model_dump()
    guild_dict["memberships"] = memberships
    return GuildDetailOut(**guild_dict)


@router.post("/{guild_id}/members")
def add_guild_member(
    guild_id: str,
    member_data: JoinRequestApprove,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> dict:
    """Add a member to guild (leader/officer only)."""
    service = GuildService(db)
    guild = service.get_guild(guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")

    membership = service.membership_repo.get_membership(guild.id, current_user.id)
    if not membership or membership.role not in ["leader", "officer"]:
        raise HTTPException(status_code=403, detail="Only leaders/officers can add members")

    try:
        new_membership = service.add_member(guild.id, member_data.user_id, member_data.role)
        return {"message": "Member added", "id": str(new_membership.id)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{guild_id}/members/{user_id}")
def remove_guild_member(
    guild_id: str,
    user_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> dict:
    """Remove a member from guild (leader/officer only)."""
    service = GuildService(db)
    guild = service.get_guild(guild_id)
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")

    membership = service.membership_repo.get_membership(guild.id, current_user.id)
    if not membership or membership.role not in ["leader", "officer"]:
        raise HTTPException(status_code=403, detail="Only leaders/officers can remove members")

    success = service.remove_member(guild.id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found in guild")
    
    return {"message": "Member removed"}


@router.get("/territory/zones", response_model=List[TerritoryZoneOut])
def get_all_zones(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> List[TerritoryZoneOut]:
    """Get all territory zones with ownership info."""
    service = GuildService(db)
    zones = service.get_all_zones()
    return [TerritoryZoneOut.model_validate(z) for z in zones]
