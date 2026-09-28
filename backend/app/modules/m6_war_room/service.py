"""Guild War Room (REQ-6.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).
"""
from sqlalchemy.orm import Session
from app.core.errors import ForbiddenError
from app.modules.m5_guild_territory.service import GuildService
from app.modules.m3_village.service import VillageService

class WarRoomService:
    def __init__(self, db: Session):
        self.db = db
        self.guild_svc = GuildService(db)
        self.village_svc = VillageService(db)

    def get_war_room_data(self, guild_id: str, user_id: str) -> dict:
        # Require Leader or Officer
        mem = self.guild_svc.membership_repo.get_membership(guild_id, user_id)
        from app.modules.m5_guild_territory.models import GuildRole
        if not mem or mem.role not in (GuildRole.leader, GuildRole.officer):
            raise ForbiddenError("Only a guild Leader or Officer may do this (SRS 5.5).")

        # Get contested zones (all zones where scores exist)
        all_zones = self.guild_svc.get_all_zones()
        contested_zones = []
        for z in all_zones:
            if len(z.scores) > 0:
                contested_zones.append({
                    "id": z.id,
                    "name": z.name,
                    "owner_guild_id": z.owning_guild_id,
                    "scores": z.scores
                })

        # Get guild members and their village topics
        members = self.guild_svc.get_guild_members(guild_id)
        war_room_members = []
        for m in members:
            village = self.village_svc.get_user_village(str(m["user_id"]))
            topics = [{"name": t["name"], "level": t["level"]} for t in village.get("topics", [])]
            war_room_members.append({
                "user_id": m["user_id"],
                "username": m["username"],
                "role": str(m["role"]),
                "defense_rating": float(village.get("defense_rating", 0.0)),
                "total_solved": int(village.get("total_solved", 0)),
                "average_level": float(village.get("average_level", 0.0)),
                "topics": topics
            })

        return {
            "guild_id": guild_id,
            "contested_zones": contested_zones,
            "members": war_room_members
        }
