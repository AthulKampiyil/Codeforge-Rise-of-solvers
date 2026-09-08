"""Guild & Territory Repository (REQ-5.x)

Data access layer for guilds and membership.
Owns: Database queries. Delegates business logic to service.py.
"""
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.modules.m5_guild_territory.models import Guild, GuildMembership, GuildJoinRequest, TerritoryZone


class GuildRepository:
    """Guild data access."""

    def __init__(self, db: Session):
        self.db = db

    def create_guild(self, guild_id: UUID, name: str, owner_id: UUID, description: str = None) -> Guild:
        """Create a new guild."""
        guild = Guild(
            id=guild_id,
            name=name,
            owner_id=owner_id,
            description=description
        )
        self.db.add(guild)
        self.db.commit()
        self.db.refresh(guild)
        return guild

    def get_guild_by_id(self, guild_id: UUID | str) -> Guild:
        """Get guild by ID."""
        return self.db.query(Guild).filter(Guild.id == guild_id).first()

    def get_guild_by_name(self, name: str) -> Guild:
        """Get guild by name (unique)."""
        return self.db.query(Guild).filter(Guild.name == name).first()

    def get_guilds_by_owner(self, owner_id: UUID | str) -> list:
        """Get all guilds owned by user."""
        return self.db.query(Guild).filter(Guild.owner_id == owner_id).all()

    def get_all_guilds(self) -> list:
        """Get all guilds."""
        return self.db.query(Guild).all()


class GuildMembershipRepository:
    """Guild membership data access."""

    def __init__(self, db: Session):
        self.db = db

    def create_membership(self, membership_id: UUID, guild_id: UUID, user_id: UUID, role: str = "member") -> GuildMembership:
        """Create a guild membership."""
        membership = GuildMembership(
            id=membership_id,
            guild_id=guild_id,
            user_id=user_id,
            role=role
        )
        self.db.add(membership)
        self.db.commit()
        self.db.refresh(membership)
        return membership

    def get_membership(self, guild_id: UUID | str, user_id: UUID | str) -> GuildMembership:
        """Get membership for user in guild."""
        return self.db.query(GuildMembership).filter(
            and_(
                GuildMembership.guild_id == guild_id,
                GuildMembership.user_id == user_id
            )
        ).first()

    def get_memberships_by_guild(self, guild_id: UUID | str) -> list:
        """Get all members of a guild."""
        return self.db.query(GuildMembership).filter(GuildMembership.guild_id == guild_id).all()

    def get_memberships_by_user(self, user_id: UUID | str) -> list:
        """Get all guilds user is member of."""
        return self.db.query(GuildMembership).filter(GuildMembership.user_id == user_id).all()

    def get_user_guild(self, user_id: UUID | str) -> Guild:
        """Get the single guild a user owns (if any)."""
        return self.db.query(Guild).filter(Guild.owner_id == user_id).first()

    def delete_membership(self, guild_id: UUID | str, user_id: UUID | str) -> bool:
        """Remove user from guild."""
        result = self.db.query(GuildMembership).filter(
            and_(
                GuildMembership.guild_id == guild_id,
                GuildMembership.user_id == user_id
            )
        ).delete()
        self.db.commit()
        return result > 0


class GuildJoinRequestRepository:
    """Join request data access (REQ-5.2)."""

    def __init__(self, db: Session):
        self.db = db

    def create_request(self, guild_id: str, user_id: str) -> GuildJoinRequest:
        req = GuildJoinRequest(guild_id=guild_id, user_id=user_id, status="pending")
        self.db.add(req)
        self.db.commit()
        self.db.refresh(req)
        return req

    def get_pending_by_guild(self, guild_id: str) -> list:
        return self.db.query(GuildJoinRequest).filter(
            and_(GuildJoinRequest.guild_id == guild_id, GuildJoinRequest.status == "pending")
        ).all()

    def get_request_by_id(self, req_id: str) -> GuildJoinRequest:
        return self.db.query(GuildJoinRequest).filter(GuildJoinRequest.id == req_id).first()

    def update_status(self, req_id: str, status: str) -> GuildJoinRequest:
        req = self.get_request_by_id(req_id)
        if req:
            req.status = status
            self.db.commit()
            self.db.refresh(req)
        return req


class TerritoryRepository:
    """Territory zone data access."""

    def __init__(self, db: Session):
        self.db = db

    def get_all_zones(self) -> list:
        """Get all territory zones."""
        return self.db.query(TerritoryZone).all()

    def get_zone_by_name(self, zone_name: str) -> TerritoryZone:
        """Get zone by name."""
        return self.db.query(TerritoryZone).filter(TerritoryZone.zone_name == zone_name).first()

    def get_zones_by_guild(self, guild_id: UUID | str) -> list:
        """Get all zones owned by guild."""
        return self.db.query(TerritoryZone).filter(TerritoryZone.owning_guild_id == guild_id).all()

    def get_zone_by_id(self, zone_id: UUID | str) -> TerritoryZone:
        """Get zone by ID."""
        return self.db.query(TerritoryZone).filter(TerritoryZone.id == zone_id).first()

    def claim_zone(self, zone_id: UUID | str, guild_id: UUID | str) -> TerritoryZone:
        """Claim a zone for a guild (set owning_guild_id)."""
        zone = self.get_zone_by_id(zone_id)
        if zone:
            zone.owning_guild_id = guild_id
            self.db.commit()
            self.db.refresh(zone)
        return zone

    def release_zone(self, zone_id: UUID | str) -> TerritoryZone:
        """Release a zone (set owning_guild_id to null)."""
        zone = self.get_zone_id(zone_id) if hasattr(self, 'get_zone_id') else self.get_zone_by_id(zone_id)
        if zone:
            zone.owning_guild_id = None
            self.db.commit()
            self.db.refresh(zone)
        return zone
