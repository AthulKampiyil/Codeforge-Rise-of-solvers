"""Guild & Territory Service (REQ-5.x)

Business logic for guild management and territory control.
Owns: All guild operations (creation, membership, territory). Called by router.
"""
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from app.modules.m5_guild_territory.repository import GuildRepository, GuildMembershipRepository, TerritoryRepository
from app.modules.m5_guild_territory.models import Guild, GuildMembership, TerritoryZone


class GuildService:
    """Guild business logic."""

    def __init__(self, db: Session):
        self.guild_repo = GuildRepository(db)
        self.membership_repo = GuildMembershipRepository(db)
        self.territory_repo = TerritoryRepository(db)

    def create_guild(self, name: str, owner_id: UUID, description: str = None) -> Guild:
        """
        Create a new guild.
        
        Constraint: Owner automatically becomes leader.
        Constraint: Only 1 guild per user (no multiple guild ownership).
        """
        # Check if user already owns a guild
        existing = self.membership_repo.get_user_guild(owner_id)
        if existing:
            raise ValueError(f"User already owns guild: {existing.name}")

        # Create guild
        guild = self.guild_repo.create_guild(
            guild_id=uuid4(),
            name=name,
            owner_id=owner_id,
            description=description
        )

        # Make owner a leader member
        self.membership_repo.create_membership(
            membership_id=uuid4(),
            guild_id=guild.id,
            user_id=owner_id,
            role="leader"
        )

        return guild

    def get_guild(self, guild_id: UUID) -> Guild:
        """Get guild by ID."""
        return self.guild_repo.get_guild_by_id(guild_id)

    def get_guild_by_name(self, name: str) -> Guild:
        """Get guild by name (unique constraint)."""
        return self.guild_repo.get_guild_by_name(name)

    def list_all_guilds(self) -> list:
        """List all guilds."""
        return self.guild_repo.get_all_guilds()

    def get_user_guild(self, user_id: UUID) -> Guild:
        """Get the single guild owned by user (or None if not owner)."""
        return self.membership_repo.get_user_guild(user_id)

    def add_member(self, guild_id: UUID, user_id: UUID, role: str = "member") -> GuildMembership:
        """Add user to guild with specified role."""
        # Check if already member
        existing = self.membership_repo.get_membership(guild_id, user_id)
        if existing:
            raise ValueError(f"User already member of guild")

        return self.membership_repo.create_membership(
            membership_id=uuid4(),
            guild_id=guild_id,
            user_id=user_id,
            role=role
        )

    def remove_member(self, guild_id: UUID, user_id: UUID) -> bool:
        """Remove user from guild."""
        return self.membership_repo.delete_membership(guild_id, user_id)

    def get_guild_members(self, guild_id: UUID) -> list:
        """Get all members of guild."""
        return self.membership_repo.get_memberships_by_guild(guild_id)

    def get_user_guilds(self, user_id: UUID) -> list:
        """Get all guilds user is member of."""
        return self.membership_repo.get_memberships_by_user(user_id)

    def get_all_zones(self) -> list:
        """Get all territory zones with ownership info."""
        return self.territory_repo.get_all_zones()

    def get_guild_territory(self, guild_id: UUID) -> list:
        """Get all zones owned by guild."""
        return self.territory_repo.get_zones_by_guild(guild_id)

    def claim_zone(self, zone_id: UUID, guild_id: UUID) -> TerritoryZone:
        """Guild claims a zone."""
        return self.territory_repo.claim_zone(zone_id, guild_id)

    def release_zone(self, zone_id: UUID) -> TerritoryZone:
        """Release a zone from guild control."""
        return self.territory_repo.release_zone(zone_id)
