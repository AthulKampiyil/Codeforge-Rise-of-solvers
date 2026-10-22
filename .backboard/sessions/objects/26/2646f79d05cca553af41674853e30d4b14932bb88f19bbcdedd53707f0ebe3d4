"""M6 War Room service — business logic for REQ-6.1–6.3.

Composes a read-only view over M3 (VillageService) and M5 (GuildService).
No new tables — M6 is a read-only composition per SADD §4.4.

Cross-module access goes through the other module's service.py only
(SADD §4.1); the one exception is the M6 repository, which owns M6's own
read queries. Those queries are plain SELECTs over M3/M5 tables and add
no writes, so they cannot violate the modules' own invariants.
"""
from typing import Optional
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, NotFoundError
from app.modules.m3_village.service import VillageService
from app.modules.m5_guild_territory.service import GuildService
from app.modules.m6_war_room.repository import WarRoomRepository
from app.modules.m6_war_room.schemas import (
    ContestedZoneOut,
    MemberOut,
    MemberZoneContribution,
    WarRoomOut,
)

# Both thresholds are admin-tunable in game_balance_config (UC-12); the
# literals below are only fallbacks for an unseeded database.
DEFAULT_CONTESTED_MARGIN = 0.20
DEFAULT_ALIGNMENT_TOPIC_COUNT = 2
WAR_ROOM_ROLES = ("leader", "officer")


class WarRoomService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = WarRoomRepository(db)
        self.guild_svc = GuildService(db)
        self.village_svc = VillageService(db)

    def _game_balance(self, key: str, default: float) -> float:
        row = self.db.execute(
            text("SELECT value FROM game_balance_config WHERE key = :key"),
            {"key": key},
        ).fetchone()
        if row and row[0] is not None:
            try:
                return float(row[0])
            except (ValueError, TypeError):
                pass
        return default

    @property
    def _contested_margin(self) -> float:
        return self._game_balance("war_room.contested_margin", DEFAULT_CONTESTED_MARGIN)

    @property
    def _alignment_topic_count(self) -> int:
        raw = self._game_balance("war_room.alignment_topic_count", DEFAULT_ALIGNMENT_TOPIC_COUNT)
        return max(1, int(raw))

    def _zone_is_contested(
        self,
        scores: dict[str, float],
        margin: float,
    ) -> bool:
        """REQ-6.1: a zone is contested when the top two guild scores are
        within `margin` of each other.

        That single test covers both halves of the spec — "this guild is
        within ±margin of the leader" (we are the challenger) and "owns
        the zone with a challenger inside margin" (we are the leader under
        pressure). A guild that leads alone has nothing to contest, so a
        zone it owns by a wide margin is deliberately not contested.
        """
        ranked = sorted(scores.values(), reverse=True)
        if len(ranked) < 2:
            return False
        leader_score = ranked[0]
        if leader_score <= 0:
            return False
        return (leader_score - ranked[1]) / leader_score <= margin

    def _top_affinity_topics(self, zone_id: UUID, count: int) -> list[str]:
        affinity = self.repo.get_zone_topic_affinity(zone_id)
        ordered = sorted(affinity.items(), key=lambda item: (-item[1], item[0]))
        return [name for name, _ in ordered[:count]]

    def get_war_room(self, guild_id: UUID, requester_user_id: str) -> WarRoomOut:
        """Build the war room view for a guild.

        REQ-6.1: Leader/Officer only (NFR-3.3). Plain members and
                 non-members get 403.
        REQ-6.2: Each member carries aligns_with_contested (top-N topic
                 levels ∩ the zone's top-N affinity topics).
        REQ-6.3: Each member carries per-zone contribution and the share
                 of the guild's zone score that contribution represents.
        """
        role = self.guild_svc.get_membership_role(guild_id, UUID(requester_user_id))
        if role is None or role.lower() not in WAR_ROOM_ROLES:
            raise ForbiddenError(
                "War room access restricted to Leader and Officer (REQ-6.1 / NFR-3.3)"
            )

        guild = self.repo.get_guild(guild_id)
        if not guild:
            raise NotFoundError("Guild not found")

        margin = self._contested_margin
        topic_count = self._alignment_topic_count

        our_zones = self.repo.get_zone_contributions(guild_id)
        all_zone_scores = self.repo.get_all_zone_scores()
        zone_owners = self.repo.get_zone_owners()
        member_roles = self.repo.get_member_roles(guild_id)

        # ── Contested zones ────────────────────────────────────────────
        contested_zones: list[ContestedZoneOut] = []
        contested_zone_ids: set[str] = set()
        # zone_id -> top-N affinity topics, for the alignment pass below.
        zone_top_topics: dict[str, list[str]] = {}

        for zone in our_zones:
            zone_id_str = zone["zone_id"]
            scores = all_zone_scores.get(zone_id_str, {})
            our_score = zone["contribution"]
            if not self._zone_is_contested(scores, margin):
                continue

            leading_guild_id, leading_score = self._zone_leader(scores)
            top_affinity = self._top_affinity_topics(UUID(zone_id_str), topic_count)
            gap_pct = (
                round((leading_score - our_score) / leading_score * 100, 1)
                if leading_score > 0
                else 0.0
            )

            contested_zone_ids.add(zone_id_str)
            zone_top_topics[zone_id_str] = top_affinity
            contested_zones.append(
                ContestedZoneOut(
                    zone_id=zone_id_str,
                    zone_name=zone["zone_name"],
                    our_score=round(our_score, 2),
                    leading_guild=self.repo.get_guild_name(UUID(leading_guild_id))
                    if leading_guild_id
                    else "",
                    leading_score=round(leading_score, 2),
                    gap_pct=gap_pct,
                    top_affinity_topics=top_affinity,
                    owner_guild_id=zone_owners.get(zone_id_str),
                    scores=scores,
                )
            )

        # ── Members ────────────────────────────────────────────────────
        members: list[MemberOut] = []
        for member in self.repo.get_member_summaries(guild_id):
            if member["is_suspended"]:
                continue

            user_id = member["user_id"]
            village = self.village_svc.get_user_village(user_id)
            topic_levels = {t["name"]: t["level"] for t in village.get("topics", [])}

            # Member score per zone uses the same formula M5 aggregates with
            # (sum of affinity weight x topic level), so a member's share of
            # the guild score is meaningful.
            zone_contributions = self._member_zone_contributions(our_zones, topic_levels)

            aligns = [
                zc.zone_id
                for zc in zone_contributions
                if zc.zone_id in contested_zone_ids
                and self._member_aligns(
                    topic_levels, zone_top_topics[zc.zone_id], topic_count
                )
            ]

            members.append(
                MemberOut(
                    user_id=user_id,
                    username=member["username"],
                    defense_rating=round(float(village.get("defense_rating") or 0.0), 2),
                    league_tier=self.repo.get_league_tier(user_id),
                    last_sync_at=member["last_sync_at"],
                    topic_levels=topic_levels,
                    zone_contributions=zone_contributions,
                    aligns_with_contested=aligns,
                    role=member_roles.get(user_id, "member"),
                )
            )

        return WarRoomOut(
            guild=guild,
            contested_zones=contested_zones,
            members=members,
            guild_id=str(guild_id),
        )

    def _zone_leader(self, scores: dict[str, float]) -> tuple[Optional[str], float]:
        if not scores:
            return None, 0.0
        leader = max(scores.items(), key=lambda item: item[1])
        return leader[0], leader[1]

    def _member_top_topics(self, topic_levels: dict[str, int], count: int) -> set[str]:
        ordered = sorted(topic_levels.items(), key=lambda item: (-item[1], item[0]))
        return {name for name, level in ordered[:count] if level > 0}

    def _member_aligns(
        self, topic_levels: dict[str, int], zone_topics: list[str], count: int
    ) -> bool:
        """REQ-6.2: top-N member topics intersect the zone's top-N affinity topics."""
        return bool(self._member_top_topics(topic_levels, count) & set(zone_topics))

    def _member_zone_contributions(
        self,
        our_zones: list[dict],
        topic_levels: dict[str, int],
    ) -> list[MemberZoneContribution]:
        """REQ-6.3: per-member zone score and the guild-score share it represents."""
        contributions: list[MemberZoneContribution] = []
        for zone in our_zones:
            zone_id_str = zone["zone_id"]
            affinity = self.repo.get_zone_topic_affinity(UUID(zone_id_str))
            score = sum(
                float(weight) * topic_levels.get(name, 0)
                for name, weight in affinity.items()
            )
            guild_score = float(zone["contribution"])
            share_pct = round(score / guild_score * 100, 1) if guild_score > 0 else 0.0
            contributions.append(
                MemberZoneContribution(
                    zone_id=zone_id_str,
                    contribution=round(score, 2),
                    share_pct=min(share_pct, 100.0),
                )
            )
        return contributions
