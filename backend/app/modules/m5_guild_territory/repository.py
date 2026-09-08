"""Guild & Territory Repository (REQ-5.x) — data access layer.

NOTE: Zone-score aggregation and ownership-resolution queries (SADD
6.5.1, 7.3.1.2) land in plan.md Phase 8. This module currently exposes
straightforward CRUD matching the Phase 1 schema.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.m5_guild_territory.models import (
    Guild,
    GuildJoinRequest,
    GuildMembership,
    JoinRequestStatus,
    TerritoryZone,
)


class GuildRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_guild(self, guild_id: UUID, name: str, description: Optional[str] = None) -> Guild:
        guild = Guild(id=guild_id, name=name, description=description)
        self.db.add(guild)
        self.db.commit()
        self.db.refresh(guild)
        return guild

    def get_guild_by_id(self, guild_id) -> Optional[Guild]:
        return self.db.query(Guild).filter(Guild.id == guild_id).first()

    def get_guild_by_name(self, name: str) -> Optional[Guild]:
        return self.db.query(Guild).filter(Guild.name == name).first()

    def get_all_guilds(self) -> List[Guild]:
        return self.db.query(Guild).all()


class GuildMembershipRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_membership(self, guild_id, user_id, role: str = "member") -> GuildMembership:
        membership = GuildMembership(guild_id=guild_id, user_id=user_id, role=role)
        self.db.add(membership)
        self.db.commit()
        self.db.refresh(membership)
        return membership

    def get_membership(self, guild_id, user_id) -> Optional[GuildMembership]:
        return self.db.query(GuildMembership).filter(
            GuildMembership.guild_id == guild_id,
            GuildMembership.user_id == user_id,
        ).first()

    def get_memberships_by_guild(self, guild_id) -> List[GuildMembership]:
        return self.db.query(GuildMembership).filter(GuildMembership.guild_id == guild_id).all()

    def get_active_membership(self, user_id) -> Optional[GuildMembership]:
        """A solver belongs to at most one guild at a time (SADD 6.5.3)."""
        return self.db.query(GuildMembership).filter(GuildMembership.user_id == user_id).first()

    def update_role(self, guild_id, user_id, role: str) -> Optional[GuildMembership]:
        membership = self.get_membership(guild_id, user_id)
        if membership:
            membership.role = role
            self.db.commit()
        return membership

    def delete_membership(self, guild_id, user_id) -> bool:
        membership = self.get_membership(guild_id, user_id)
        if membership:
            self.db.delete(membership)
            self.db.commit()
            return True
        return False


class GuildJoinRequestRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, guild_id, user_id) -> GuildJoinRequest:
        request = GuildJoinRequest(guild_id=guild_id, user_id=user_id)
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        return request

    def get_by_id(self, request_id) -> Optional[GuildJoinRequest]:
        return self.db.query(GuildJoinRequest).filter(GuildJoinRequest.id == request_id).first()

    def get_pending_by_guild(self, guild_id) -> List[GuildJoinRequest]:
        return self.db.query(GuildJoinRequest).filter(
            GuildJoinRequest.guild_id == guild_id,
            GuildJoinRequest.status == JoinRequestStatus.pending,
        ).all()

    def get_pending_by_guild_and_user(self, guild_id, user_id) -> Optional[GuildJoinRequest]:
        return self.db.query(GuildJoinRequest).filter(
            GuildJoinRequest.guild_id == guild_id,
            GuildJoinRequest.user_id == user_id,
            GuildJoinRequest.status == JoinRequestStatus.pending,
        ).first()

    def decide(self, request_id, status: JoinRequestStatus, decided_by) -> Optional[GuildJoinRequest]:
        from datetime import datetime, timezone

        request = self.get_by_id(request_id)
        if request:
            request.status = status
            request.decided_by = decided_by
            request.decided_at = datetime.now(timezone.utc)
            self.db.commit()
        return request


class TerritoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_zones(self) -> List[TerritoryZone]:
        return self.db.query(TerritoryZone).all()

    def get_zone_by_id(self, zone_id) -> Optional[TerritoryZone]:
        return self.db.query(TerritoryZone).filter(TerritoryZone.id == zone_id).first()

    def get_zones_by_guild(self, guild_id) -> List[TerritoryZone]:
        return self.db.query(TerritoryZone).filter(TerritoryZone.owning_guild_id == guild_id).all()
