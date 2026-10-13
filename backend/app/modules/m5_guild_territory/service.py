"""Guild & Territory Service (REQ-5.x)

Business logic for guild management and territory control.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
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

    def get_membership_role(self, guild_id: UUID, user_id: UUID) -> Optional[str]:
        """
        Role of user_id in guild_id, or None if they are not a member.

        Exposed here so other modules (e.g. M6's role gate) can authorise
        without reaching into this module's repository (SADD §4.1).
        """
        membership = self.membership_repo.get_membership(guild_id, user_id)
        if not membership:
            return None
        role = membership.role
        return role.value if hasattr(role, "value") else str(role)

    def get_due_guild_ids(self, limit: int = 25) -> List[UUID]:
        """
        Worker "what's due" query: guilds whose zone contributions are
        stale enough to warrant a rescore + ownership reconciliation.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(
            minutes=settings.TERRITORY_RECALC_INTERVAL_MINUTES
        )
        return self.territory_repo.get_guild_ids_due_for_rescore(cutoff, limit=limit)

    def recalculate_guild_zone_scores(self, guild_id: UUID):
        try:
            self._recalculate_guild_zone_scores(guild_id)
            self.membership_repo.db.commit()
        except Exception:
            self.membership_repo.db.rollback()
            raise
        self._dispatch_outbox()

    def _recalculate_guild_zone_scores(self, guild_id: UUID):
        # Guild is always the first lock for scoring and membership mutations.
        # In particular, the contribution upsert's FK check must not acquire a
        # KEY SHARE lock on the guild after a zone lock has already been taken.
        if self.guild_repo.lock_guild_by_id(guild_id) is None:
            return

        # Lock zones in stable order before reading inputs or writing scores. Every
        # rescore and ownership decision for a zone therefore observes one order.
        zone_ids = [z.id for z in self.territory_repo.get_all_zones()]
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

        for zone_id in sorted(zone_ids, key=str):
            z = self.territory_repo.lock_zone_by_id(zone_id)
            if z is None:
                continue
            members = self.membership_repo.get_memberships_by_guild(guild_id)
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

                # Scoring only needs topic levels. Avoid profile repair while
                # holding the zone lock (and thus avoid user-FK lock inversion).
                topic_levels = village_svc.get_user_topic_levels(str(m.user_id))
                member_score = 0.0
                for t_name, affinity in z.topic_affinity.items():
                    level = topic_levels.get(t_name, 0)
                    member_score += float(affinity) * level
                guild_score += member_score * decay

            self.membership_repo.db.execute(text("""
                INSERT INTO zone_contributions (zone_id, guild_id, aggregated_score, updated_at)
                VALUES (:zid, :gid, :score, now())
                ON CONFLICT (zone_id, guild_id)
                DO UPDATE SET aggregated_score = EXCLUDED.aggregated_score, updated_at = now()
            """), {"zid": z.id, "gid": guild_id, "score": guild_score})

            self.resolve_zone_ownership(z.id, locked_zone=z)

    def resolve_zone_ownership(self, zone_id: UUID, locked_zone=None):
        zone = locked_zone or self.territory_repo.lock_zone_by_id(zone_id)
        if zone is None:
            return
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
            text("SELECT guild_id, aggregated_score FROM zone_contributions WHERE zone_id = :zid ORDER BY guild_id FOR UPDATE"),
            {"zid": zone_id}
        ).fetchall()

        if not rows:
            return

        leader_row = max(rows, key=lambda r: float(r[1]))
        leader_id = leader_row[0]
        leader_score = float(leader_row[1])

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
                self._publish_territory_change(zone, incumbent_id, leader_id, rows)

    def _publish_territory_change(self, zone, old_owner, new_owner, scores_rows):
        from app.modules.m8_notifications.service import NotificationService
        from app.modules.m8_notifications.schemas import EventType, TerritoryZoneChangedPayload

        guild_scores = [{"guild_id": str(r[0]), "score": float(r[1])} for r in scores_rows]

        payload = TerritoryZoneChangedPayload(
            zone_id=zone.id,
            zone_name=zone.name,
            previous_owner_guild_id=old_owner,
            new_owner_guild_id=new_owner,
            guild_scores=guild_scores
        )
        NotificationService(self.membership_repo.db).enqueue(
            EventType.TERRITORY_ZONE_CHANGED,
            payload.model_dump(mode="json"),
            broadcast=True,
        )

    def _dispatch_outbox(self) -> None:
        """Attempt publication only after the domain transaction committed."""
        from app.modules.m8_notifications.service import NotificationService
        try:
            NotificationService(self.membership_repo.db).publish_pending_sync()
        except Exception:
            # The committed outbox row remains available to the existing retry worker.
            pass

    def create_guild(self, name: str, creator_id: UUID, description: Optional[str] = None) -> Guild:
        try:
            self.membership_repo.lock_user(creator_id)
            if self.membership_repo.get_active_membership(creator_id):
                raise ConflictError("You already belong to a guild. Leave it before creating another.")
            if self.guild_repo.get_guild_by_name(name):
                raise GuildNameTaken(f"Guild name '{name}' is already taken")
            guild = self.guild_repo.create_guild(guild_id=uuid4(), name=name, description=description)
            self.membership_repo.create_membership(guild.id, creator_id, role=GuildRole.leader)
            self._recalculate_guild_zone_scores(guild.id)
            self.membership_repo.db.commit()
        except Exception:
            self.membership_repo.db.rollback()
            raise
        self._dispatch_outbox()
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
        try:
            if self.guild_repo.lock_guild_by_id(guild_id) is None:
                raise NotFoundError("Guild not found")
            self.membership_repo.lock_user(user_id)
            if self.membership_repo.get_active_membership(user_id):
                raise ConflictError("You already belong to a guild.")
            if self.join_request_repo.get_pending_by_guild_and_user(guild_id, user_id):
                raise ConflictError("You already have a pending request for this guild.")
            request = self.join_request_repo.create(guild_id, user_id)
            self.membership_repo.db.commit()
            return request
        except Exception:
            self.membership_repo.db.rollback()
            raise

    def _require_leader_or_officer(self, guild_id, approver_id) -> None:
        membership = self.membership_repo.get_membership(guild_id, approver_id)
        if not membership or membership.role not in (GuildRole.leader, GuildRole.officer):
            raise ForbiddenError("Only a guild Leader or Officer may do this (SRS 5.5).")

    def approve_join_request(self, guild_id, request_id, approver_id):
        try:
            if self.guild_repo.lock_guild_by_id(guild_id) is None:
                raise NotFoundError("Guild not found")
            self._require_leader_or_officer(guild_id, approver_id)
            request = self.join_request_repo.lock_by_id(request_id)
            if not request or str(request.guild_id) != str(guild_id):
                raise NotFoundError("Join request not found")
            if request.status != JoinRequestStatus.pending:
                raise ConflictError("This request has already been decided.")
            self.membership_repo.lock_user(request.user_id)
            if self.membership_repo.get_active_membership(request.user_id):
                raise ConflictError("Requester already belongs to a guild.")
            self.membership_repo.create_membership(guild_id, request.user_id, role=GuildRole.member)
            res = self.join_request_repo.decide(request_id, JoinRequestStatus.approved, approver_id)
            self._recalculate_guild_zone_scores(guild_id)
            self.membership_repo.db.commit()
        except Exception:
            self.membership_repo.db.rollback()
            raise
        self._dispatch_outbox()
        return res

    def reject_join_request(self, guild_id, request_id, approver_id):
        try:
            if self.guild_repo.lock_guild_by_id(guild_id) is None:
                raise NotFoundError("Guild not found")
            self._require_leader_or_officer(guild_id, approver_id)
            request = self.join_request_repo.lock_by_id(request_id)
            if not request or str(request.guild_id) != str(guild_id):
                raise NotFoundError("Join request not found")
            if request.status != JoinRequestStatus.pending:
                raise ConflictError("This request has already been decided.")
            result = self.join_request_repo.decide(request_id, JoinRequestStatus.rejected, approver_id)
            self.membership_repo.db.commit()
            return result
        except Exception:
            self.membership_repo.db.rollback()
            raise

    def get_pending_requests(self, guild_id, requester_id):
        self._require_leader_or_officer(guild_id, requester_id)
        return self.join_request_repo.get_pending_by_guild(guild_id)

    def transfer_leadership(self, guild_id, target_user_id, current_user_id):
        """Atomically hand leadership to a different existing guild member.

        The prior leader deliberately remains in the guild as an ordinary member.
        """
        try:
            guild = self.guild_repo.lock_guild_by_id(guild_id)
            if guild is None:
                raise NotFoundError("Guild not found")
            self.membership_repo.lock_users(current_user_id, target_user_id)
            source = self.membership_repo.get_membership(guild_id, current_user_id)
            target = self.membership_repo.get_membership(guild_id, target_user_id)
            if source is None or source.role != GuildRole.leader:
                raise ForbiddenError("Only the current guild Leader may transfer leadership.")
            if target_user_id == current_user_id:
                raise ConflictError("Leadership must be transferred to a different member.")
            if target is None:
                raise NotFoundError("Target user is not a member of this guild")

            # Demote first to satisfy the PostgreSQL partial unique leader index.
            source.role = GuildRole.member
            self.membership_repo.db.flush()
            target.role = GuildRole.leader
            self.membership_repo.db.commit()
            return {
                "previous_leader_user_id": current_user_id,
                "leader_user_id": target_user_id,
            }
        except Exception:
            self.membership_repo.db.rollback()
            raise

    def remove_member(self, guild_id, target_user_id, remover_id) -> bool:
        try:
            if self.guild_repo.lock_guild_by_id(guild_id) is None:
                raise NotFoundError("Guild not found")
            self.membership_repo.lock_users(remover_id, target_user_id)
            self._require_leader_or_officer(guild_id, remover_id)
            target_membership = self.membership_repo.get_membership(guild_id, target_user_id)
            if target_membership and target_membership.role == GuildRole.leader:
                raise ForbiddenError("Cannot remove the guild Leader. Transfer leadership first.")
            removed = self.membership_repo.delete_membership(guild_id, target_user_id)
            if removed:
                self._recalculate_guild_zone_scores(guild_id)
            self.membership_repo.db.commit()
        except Exception:
            self.membership_repo.db.rollback()
            raise
        if removed:
            self._dispatch_outbox()
        return removed

    def leave_guild(self, guild_id, user_id) -> bool:
        try:
            if self.guild_repo.lock_guild_by_id(guild_id) is None:
                raise NotFoundError("Guild not found")
            self.membership_repo.lock_users(user_id)
            membership = self.membership_repo.get_membership(guild_id, user_id)
            if membership and membership.role == GuildRole.leader:
                raise ForbiddenError("The Leader cannot leave without transferring leadership first.")
            left = self.membership_repo.delete_membership(guild_id, user_id)
            if left:
                self._recalculate_guild_zone_scores(guild_id)
            self.membership_repo.db.commit()
        except Exception:
            self.membership_repo.db.rollback()
            raise
        if left:
            self._dispatch_outbox()
        return left

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

    def get_due_zones(self) -> list:
        """Returns zones due for ownership resolution (worker query)."""
        return self.territory_repo.get_all_zones()

    def get_due_guilds(self) -> list:
        """Returns guilds due for score recalculation (worker query)."""
        return self.guild_repo.get_all_guilds()
