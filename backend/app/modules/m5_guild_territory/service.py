"""Guild & Territory Service (REQ-5.x)

Business logic for guild management and territory control.

NOTE: Zone-score aggregation, ownership-resolution with hysteresis,
and the Redlock-deduplicated reconciliation sweep (SADD 7.3.1.2,
6.5.1–6.5.2) land in plan.md Phase 8. This file currently implements
guild creation and the join-request workflow (REQ-5.1, REQ-5.2) plus a
read-only territory-map view (REQ-5.5).
"""
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

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

    def create_guild(self, name: str, creator_id: UUID, description: str = None) -> Guild:
        """Create a guild; the creator becomes Leader (REQ-5.1).

        Business rule: a solver may belong to at most one guild at a
        time (SRS 5.5), enforced here and by the DB unique index.
        """
        if self.membership_repo.get_active_membership(creator_id):
            raise ConflictError("You already belong to a guild. Leave it before creating another.")

        if self.guild_repo.get_guild_by_name(name):
            raise GuildNameTaken(f"Guild name '{name}' is already taken")

        guild = self.guild_repo.create_guild(guild_id=uuid4(), name=name, description=description)
        self.membership_repo.create_membership(guild.id, creator_id, role=GuildRole.leader)
        return guild

    def get_guild(self, guild_id) -> Guild:
        guild = self.guild_repo.get_guild_by_id(guild_id)
        if not guild:
            raise NotFoundError("Guild not found")
        return guild

    def list_all_guilds(self) -> list:
        return self.guild_repo.get_all_guilds()

    def get_user_guild(self, user_id: UUID):
        """The single guild a user belongs to, or None (SRS 5.5: at most one)."""
        membership = self.membership_repo.get_active_membership(user_id)
        if not membership:
            return None
        return self.guild_repo.get_guild_by_id(membership.guild_id)

    def get_guild_members(self, guild_id) -> list:
        return self.membership_repo.get_memberships_by_guild(guild_id)

    def request_to_join(self, guild_id, user_id):
        """REQ-5.2: a solver requests to join an existing guild."""
        if self.membership_repo.get_active_membership(user_id):
            raise ConflictError("You already belong to a guild.")
        if self.join_request_repo.get_pending_by_guild_and_user(guild_id, user_id):
            raise ConflictError("You already have a pending request for this guild.")
        self.get_guild(guild_id)  # 404 if the guild doesn't exist
        return self.join_request_repo.create(guild_id, user_id)

    def _require_leader_or_officer(self, guild_id, approver_id) -> None:
        membership = self.membership_repo.get_membership(guild_id, approver_id)
        if not membership or membership.role not in (GuildRole.leader, GuildRole.officer):
            raise ForbiddenError("Only a guild Leader or Officer may do this (SRS 5.5).")

    def approve_join_request(self, guild_id, request_id, approver_id):
        """REQ-5.2: only a Leader/Officer may approve a join request."""
        self._require_leader_or_officer(guild_id, approver_id)

        request = self.join_request_repo.get_by_id(request_id)
        if not request or request.guild_id != guild_id:
            raise NotFoundError("Join request not found")
        if request.status != JoinRequestStatus.pending:
            raise ConflictError("This request has already been decided.")

        if self.membership_repo.get_active_membership(request.user_id):
            raise ConflictError("Requester already belongs to a guild.")

        self.membership_repo.create_membership(guild_id, request.user_id, role=GuildRole.member)
        return self.join_request_repo.decide(request_id, JoinRequestStatus.approved, approver_id)

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
        """REQ-5.2/SRS 5.5: only a Leader/Officer may remove a member."""
        self._require_leader_or_officer(guild_id, remover_id)
        target_membership = self.membership_repo.get_membership(guild_id, target_user_id)
        if target_membership and target_membership.role == GuildRole.leader:
            raise ForbiddenError("Cannot remove the guild Leader. Transfer leadership first.")
        return self.membership_repo.delete_membership(guild_id, target_user_id)

    def leave_guild(self, guild_id, user_id) -> bool:
        membership = self.membership_repo.get_membership(guild_id, user_id)
        if membership and membership.role == GuildRole.leader:
            raise ForbiddenError("The Leader cannot leave without transferring leadership first.")
        return self.membership_repo.delete_membership(guild_id, user_id)

    def get_all_zones(self) -> list:
        """REQ-5.5: territory-control map visible to all authenticated users."""
        return self.territory_repo.get_all_zones()

    def get_guild_territory(self, guild_id) -> list:
        return self.territory_repo.get_zones_by_guild(guild_id)
