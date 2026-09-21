"""Guild & Territory Service (REQ-5.x)

Business logic for guild management and territory control.
"""
from uuid import UUID, uuid4

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.errors import ConflictError, ForbiddenError, GuildNameTaken, NotFoundError
from app.modules.m5_guild_territory.models import Guild, GuildRole, JoinRequestStatus
from app.modules.m5_guild_territory.repository import (
    GuildJoinRequestRepository,
    GuildMembershipRepository,
    GuildRepository,
    TerritoryRepository,
)


class GuildService:
    """Guild business logic."""

    def __init__(self, db: Session):
        self.guild_repo = GuildRepository(db)
        self.membership_repo = GuildMembershipRepository(db)
        self.join_request_repo = GuildJoinRequestRepository(db)
        self.territory_repo = TerritoryRepository(db)

    def recalculate_guild_zone_scores(self, guild_id: UUID):
        members = self.membership_repo.get_memberships_by_guild(guild_id)
        zones = self.territory_repo.get_all_zones()
        from app.modules.m3_village.service import VillageService
        village_svc = VillageService(self.membership_repo.db)
        
        decay_per_day_row = self.membership_repo.db.execute(
            text("SELECT value FROM game_balance_config WHERE key = 'territory.decay_per_day'")
        ).fetchone()
        decay_per_day = 0.02
        if decay_per_day_row and decay_per_day_row[0] is not None:
            try: decay_per_day = float(decay_per_day_row[0])
            except (ValueError, TypeError): pass
            
        decay_floor_row = self.membership_repo.db.execute(
            text("SELECT value FROM game_balance_config WHERE key = 'territory.decay_floor'")
        ).fetchone()
        decay_floor = 0.50
        if decay_floor_row and decay_floor_row[0] is not None:
            try: decay_floor = float(decay_floor_row[0])
            except (ValueError, TypeError): pass

        for z in zones:
            guild_score = 0.0
            for m in members:
                row = self.membership_repo.db.execute(
                    text("SELECT last_sync_at FROM judge_accounts WHERE user_id = :uid"), 
                    {"uid": m.user_id}
                ).fetchone()
                if row and row[0]:
                    from datetime import datetime, timezone
                    days = (datetime.now(timezone.utc) - row[0].replace(tzinfo=timezone.utc)).days
                    decay = max(decay_floor, 1.0 - decay_per_day * days)
                else:
                    decay = decay_floor
                    
                village = village_svc.get_user_village(str(m.user_id))
                member_score = 0.0
                for t_name, affinity in z.topic_affinity.items():
                    level = next((t["level"] for t in village["topics"] if t["name"] == t_name), 0)
                    member_score += float(affinity) * level
                guild_score += member_score * decay
                
            self.membership_repo.db.execute(text("""
                INSERT INTO zone_contributions (zone_id, guild_id, aggregated_score, updated_at)
                VALUES (:zid, :gid, :score, now())
                ON CONFLICT (zone_id, guild_id)
                DO UPDATE SET aggregated_score = EXCLUDED.aggregated_score, updated_at = now()
            """), {"zid": z.id, "gid": guild_id, "score": guild_score})
            
        self.membership_repo.db.commit()
        
        for z in zones:
            self.resolve_zone_ownership(z.id)

    def resolve_zone_ownership(self, zone_id: UUID):
        margin_row = self.membership_repo.db.execute(
            text("SELECT value FROM game_balance_config WHERE key = 'territory.hysteresis_margin'")
        ).fetchone()
        margin = 0.05
        if margin_row and margin_row[0] is not None:
            try:
                margin = float(margin_row[0])
            except (ValueError, TypeError):
                pass

        rows = self.membership_repo.db.execute(
            text("SELECT guild_id, aggregated_score FROM zone_contributions WHERE zone_id = :zid FOR UPDATE"),
            {"zid": zone_id}
        ).fetchall()
        
        if not rows:
            return
            
        leader_row = max(rows, key=lambda r: float(r[1]))
        leader_id = leader_row[0]
        leader_score = float(leader_row[1])
        
        zone = self.territory_repo.get_zone_by_id(zone_id)
        incumbent_id = zone.owning_guild_id
        
        if incumbent_id != leader_id:
            flip = False
            if incumbent_id is None:
                flip = True
            else:
                incumbent_score = next((float(r[1]) for r in rows if r[0] == incumbent_id), 0.0)
                if leader_score > incumbent_score * (1 + margin):
                    flip = True
                    
            if flip:
                zone.owning_guild_id = leader_id
                self.membership_repo.db.commit()
                self._publish_territory_change(zone, incumbent_id, leader_id, rows)

    def _publish_territory_change(self, zone, old_owner, new_owner, scores_rows):
        from app.core.redis import get_sync_redis
        import json
        from app.modules.m8_notifications.schemas import EventEnvelope, EventType, TerritoryZoneChangedPayload
        
        guild_scores = [{"guild_id": str(r[0]), "score": float(r[1])} for r in scores_rows]
        
        payload = TerritoryZoneChangedPayload(
            zone_id=zone.id,
            zone_name=zone.name,
            previous_owner_guild_id=old_owner,
            new_owner_guild_id=new_owner,
            guild_scores=guild_scores
        )
        envelope = EventEnvelope(event_type=EventType.TERRITORY_ZONE_CHANGED, payload=payload.model_dump(mode='json'))
        
        message = {
            "envelope": json.loads(envelope.model_dump_json()),
            "target_user_ids": None,
            "broadcast": True,
        }
        
        redis = get_sync_redis()
        redis.publish("codeforge:events", json.dumps(message))

    def create_guild(self, name: str, creator_id: UUID, description: str = None) -> Guild:
        if self.membership_repo.get_active_membership(creator_id):
            raise ConflictError("You already belong to a guild. Leave it before creating another.")

        if self.guild_repo.get_guild_by_name(name):
            raise GuildNameTaken(f"Guild name '{name}' is already taken")

        guild = self.guild_repo.create_guild(guild_id=uuid4(), name=name, description=description)
        self.membership_repo.create_membership(guild.id, creator_id, role=GuildRole.leader)
        self.recalculate_guild_zone_scores(guild.id)
        return guild

    def get_guild(self, guild_id) -> Guild:
        guild = self.guild_repo.get_guild_by_id(guild_id)
        if not guild:
            raise NotFoundError("Guild not found")
        return guild

    def list_all_guilds(self) -> list:
        return self.guild_repo.get_all_guilds()

    def get_user_guild(self, user_id: UUID):
        membership = self.membership_repo.get_active_membership(user_id)
        if not membership:
            return None
        return self.guild_repo.get_guild_by_id(membership.guild_id)

    def get_guild_members(self, guild_id) -> list:
        from app.modules.m3_village.service import VillageService
        from app.modules.m4_attacks.service import AttackService
        
        village_svc = VillageService(self.membership_repo.db)
        attack_svc = AttackService(self.membership_repo.db)
        
        memberships = self.membership_repo.get_memberships_by_guild(guild_id)
        result = []
        for m in memberships:
            row = self.membership_repo.db.execute(
                text("SELECT username FROM users WHERE id = :uid"), 
                {"uid": m.user_id}
            ).fetchone()
            username = row[0] if row else "Unknown"
            
            level = "—"
            solved_count = "—"
            if hasattr(village_svc, "get_user_village"):
                v_profile = village_svc.get_user_village(str(m.user_id))
                if v_profile:
                    level = v_profile.get("average_level", "—")
                    solved_count = v_profile.get("total_solved", "—")
            
            attack_count = "—"
            if hasattr(attack_svc, "get_attack_count"):
                attack_count = attack_svc.get_attack_count(str(m.user_id))
            
            result.append({
                "guild_id": m.guild_id,
                "user_id": m.user_id,
                "role": m.role.value if hasattr(m.role, 'value') else m.role,
                "joined_at": m.joined_at,
                "username": username,
                "level": level,
                "solved_count": solved_count,
                "attack_count": attack_count,
            })
        return result

    def request_to_join(self, guild_id, user_id):
        if self.membership_repo.get_active_membership(user_id):
            raise ConflictError("You already belong to a guild.")
        if self.join_request_repo.get_pending_by_guild_and_user(guild_id, user_id):
            raise ConflictError("You already have a pending request for this guild.")
        self.get_guild(guild_id)
        return self.join_request_repo.create(guild_id, user_id)

    def _require_leader_or_officer(self, guild_id, approver_id) -> None:
        membership = self.membership_repo.get_membership(guild_id, approver_id)
        if not membership or membership.role not in (GuildRole.leader, GuildRole.officer):
            raise ForbiddenError("Only a guild Leader or Officer may do this (SRS 5.5).")

    def approve_join_request(self, guild_id, request_id, approver_id):
        self._require_leader_or_officer(guild_id, approver_id)

        request = self.join_request_repo.get_by_id(request_id)
        if not request or request.guild_id != guild_id:
            raise NotFoundError("Join request not found")
        if request.status != JoinRequestStatus.pending:
            raise ConflictError("This request has already been decided.")

        if self.membership_repo.get_active_membership(request.user_id):
            raise ConflictError("Requester already belongs to a guild.")

        self.membership_repo.create_membership(guild_id, request.user_id, role=GuildRole.member)
        res = self.join_request_repo.decide(request_id, JoinRequestStatus.approved, approver_id)
        self.recalculate_guild_zone_scores(guild_id)
        return res

    def reject_join_request(self, guild_id, request_id, approver_id):
        self._require_leader_or_officer(guild_id, approver_id)
        request = self.join_request_repo.get_by_id(request_id)
        if not request or request.guild_id != guild_id:
            raise NotFoundError("Join request not found")
        return self.join_request_repo.decide(request_id, JoinRequestStatus.rejected, approver_id)

    def get_pending_requests(self, guild_id, requester_id):
        self._require_leader_or_officer(guild_id, requester_id)
        return self.join_request_repo.get_pending_by_guild(guild_id)

    def remove_member(self, guild_id, target_user_id, remover_id) -> bool:
        self._require_leader_or_officer(guild_id, remover_id)
        target_membership = self.membership_repo.get_membership(guild_id, target_user_id)
        if target_membership and target_membership.role == GuildRole.leader:
            raise ForbiddenError("Cannot remove the guild Leader. Transfer leadership first.")
        if self.membership_repo.delete_membership(guild_id, target_user_id):
            self.recalculate_guild_zone_scores(guild_id)
            return True
        return False

    def leave_guild(self, guild_id, user_id) -> bool:
        membership = self.membership_repo.get_membership(guild_id, user_id)
        if membership and membership.role == GuildRole.leader:
            raise ForbiddenError("The Leader cannot leave without transferring leadership first.")
        if self.membership_repo.delete_membership(guild_id, user_id):
            self.recalculate_guild_zone_scores(guild_id)
            return True
        return False

    def get_all_zones(self) -> list:
        zones = self.territory_repo.get_all_zones()
        for z in zones:
            scores_query = self.territory_repo.db.execute(
                text("SELECT guild_id, aggregated_score FROM zone_contributions WHERE zone_id = :zid"),
                {"zid": z.id}
            ).fetchall()
            z.scores = {str(row[0]): float(row[1]) for row in scores_query}
        return zones

    def get_guild_territory(self, guild_id) -> list:
        zones = self.territory_repo.get_zones_by_guild(guild_id)
        for z in zones:
            scores_query = self.territory_repo.db.execute(
                text("SELECT guild_id, aggregated_score FROM zone_contributions WHERE zone_id = :zid"),
                {"zid": z.id}
            ).fetchall()
            z.scores = {str(row[0]): float(row[1]) for row in scores_query}
        return zones
