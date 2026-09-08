"""Guild & Territory Service (REQ-5.x)

Business logic for guild management and territory control.
Owns: All guild operations (creation, membership, territory). Called by router.
"""
from uuid import UUID, uuid4
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.modules.m5_guild_territory.repository import (
    GuildRepository, GuildMembershipRepository, GuildJoinRequestRepository, TerritoryRepository
)
from app.modules.m5_guild_territory.models import Guild, GuildMembership, TerritoryZone
from app.modules.m3_village.service import VillageService


class GuildService:
    """Guild & Territory business logic."""

    HYSTERESIS_MARGIN = 0.05

    def __init__(self, db: Session):
        self.db = db
        self.guild_repo = GuildRepository(db)
        self.membership_repo = GuildMembershipRepository(db)
        self.request_repo = GuildJoinRequestRepository(db)
        self.territory_repo = TerritoryRepository(db)
        self.village_service = VillageService(db)

    def create_guild(self, name: str, owner_id: UUID, description: str = None) -> Guild:
        existing = self.membership_repo.get_user_guild(owner_id)
        if existing:
            raise ValueError(f"User already owns guild: {existing.name}")

        guild = self.guild_repo.create_guild(
            guild_id=uuid4(),
            name=name,
            owner_id=owner_id,
            description=description
        )

        self.membership_repo.create_membership(
            membership_id=uuid4(),
            guild_id=guild.id,
            user_id=owner_id,
            role="leader"
        )
        return guild

    def get_guild(self, guild_id: UUID | str) -> Guild:
        return self.guild_repo.get_guild_by_id(guild_id)

    def get_guild_by_name(self, name: str) -> Guild:
        return self.guild_repo.get_guild_by_name(name)

    def list_all_guilds(self) -> list:
        return self.guild_repo.get_all_guilds()

    def get_user_guild(self, user_id: UUID | str) -> Guild:
        return self.membership_repo.get_user_guild(user_id)

    def request_to_join(self, guild_id: str, user_id: str):
        existing_mem = self.membership_repo.get_membership(guild_id, user_id)
        if existing_mem:
            raise ValueError("User is already a member of this guild")
        return self.request_repo.create_request(guild_id, user_id)

    def get_pending_requests(self, guild_id: str) -> list:
        return self.request_repo.get_pending_by_guild(guild_id)

    def approve_join_request(self, req_id: str, approver_user_id: str) -> GuildMembership:
        req = self.request_repo.get_request_by_id(req_id)
        if not req:
            raise ValueError("Join request not found")

        membership = self.membership_repo.get_membership(req.guild_id, approver_user_id)
        if not membership or membership.role not in ["leader", "officer"]:
            raise ValueError("Only leaders and officers can approve join requests")

        self.request_repo.update_status(req_id, "approved")
        return self.add_member(req.guild_id, req.user_id, "member")

    def reject_join_request(self, req_id: str, approver_user_id: str):
        req = self.request_repo.get_request_by_id(req_id)
        if not req:
            raise ValueError("Join request not found")

        membership = self.membership_repo.get_membership(req.guild_id, approver_user_id)
        if not membership or membership.role not in ["leader", "officer"]:
            raise ValueError("Only leaders and officers can reject join requests")

        return self.request_repo.update_status(req_id, "rejected")

    def add_member(self, guild_id: UUID | str, user_id: UUID | str, role: str = "member") -> GuildMembership:
        existing = self.membership_repo.get_membership(guild_id, user_id)
        if existing:
            raise ValueError(f"User already member of guild")

        return self.membership_repo.create_membership(
            membership_id=uuid4(),
            guild_id=guild_id,
            user_id=user_id,
            role=role
        )

    def remove_member(self, guild_id: UUID | str, user_id: UUID | str) -> bool:
        return self.membership_repo.delete_membership(guild_id, user_id)

    def get_guild_members(self, guild_id: UUID | str) -> list:
        return self.membership_repo.get_memberships_by_guild(guild_id)

    def get_user_guilds(self, user_id: UUID | str) -> list:
        return self.membership_repo.get_memberships_by_user(user_id)

    def get_all_zones(self) -> list:
        return self.territory_repo.get_all_zones()

    def get_guild_territory(self, guild_id: UUID | str) -> list:
        return self.territory_repo.get_zones_by_guild(guild_id)

    def recalculate_territory_ownership(self, zone_id: str) -> Optional[TerritoryZone]:
        """
        Recalculate zone ownership with 5% hysteresis margin per SADD 7.3.1.2.
        """
        zone = self.territory_repo.get_zone_by_id(zone_id)
        if not zone:
            return None

        guilds = self.guild_repo.get_all_guilds()
        scores: Dict[str, float] = {}

        for g in guilds:
            members = self.get_guild_members(g.id)
            g_score = 0.0
            for m in members:
                village = self.village_service.get_user_village(str(m.user_id))
                g_score += village.get("defense_rating", 100)
            scores[str(g.id)] = g_score

        if not scores:
            return zone

        leading_guild_id = max(scores, key=scores.get)
        leading_score = scores[leading_guild_id]

        current_owner = str(zone.owning_guild_id) if zone.owning_guild_id else None

        if current_owner is None:
            zone.owning_guild_id = leading_guild_id
            self.db.commit()
            self.db.refresh(zone)
        elif leading_guild_id != current_owner:
            owner_score = scores.get(current_owner, 0.0)
            if leading_score > owner_score * (1 + self.HYSTERESIS_MARGIN):
                zone.owning_guild_id = leading_guild_id
                self.db.commit()
                self.db.refresh(zone)

        return zone
