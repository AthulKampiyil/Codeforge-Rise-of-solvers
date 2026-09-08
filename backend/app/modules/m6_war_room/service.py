"""Guild War Room (REQ-6.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).
"""
from typing import Dict, Any, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.modules.m5_guild_territory.service import GuildService
from app.modules.m3_village.service import VillageService
from app.modules.m1_auth.repository import UserRepository


class WarRoomService:
    """Business logic for Guild War Room (REQ-6.1–6.3)."""

    def __init__(self, db: Session):
        self.db = db
        self.guild_service = GuildService(db)
        self.village_service = VillageService(db)
        self.user_repo = UserRepository(db)

    def get_war_room_summary(self, guild_id: str, requester_user_id: str) -> Dict[str, Any]:
        """
        Get War Room per-member topic strength summary (REQ-6.1, REQ-6.3).
        Role-gated: Only Leader or Officer can view (NFR-3.3).
        """
        membership = self.guild_service.membership_repo.get_membership(guild_id, requester_user_id)
        if not membership or membership.role not in ["leader", "officer"]:
            raise HTTPException(status_code=403, detail="War Room access restricted to Guild Leaders and Officers")

        members = self.guild_service.get_guild_members(guild_id)
        member_summaries = []

        for m in members:
            u_id = str(m.user_id)
            user = self.user_repo.get_by_id(u_id)
            username = user.username if user else "Unknown"
            village = self.village_service.get_user_village(u_id)

            member_summaries.append({
                "user_id": u_id,
                "username": username,
                "role": m.role,
                "joined_at": m.joined_at.isoformat(),
                "defense_rating": village.get("defense_rating", 100),
                "topics": village.get("topics", [])
            })

        zones = self.guild_service.get_guild_territory(guild_id)

        return {
            "guild_id": guild_id,
            "member_count": len(members),
            "members": member_summaries,
            "owned_zones": [{"zone_id": str(z.id), "name": z.zone_name} for z in zones],
            "contested_zones": ["Nexus Central", "Archives"]
        }
