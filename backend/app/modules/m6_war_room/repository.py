"""M6 War Room repository — data access for war-room queries."""
from typing import Optional
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.orm import Session

class WarRoomRepository:
    """Read-only queries composed by the M6 service."""

    def __init__(self, db: Session):
        self.db = db

    def get_guild(self, guild_id: UUID) -> Optional[dict]:
        row = self.db.execute(
            text(
                "SELECT id, name, description, created_at FROM guilds WHERE id = :gid"
            ),
            {"gid": guild_id},
        ).fetchone()
        if not row:
            return None
        return {
            "id": str(row.id),
            "name": row.name,
            "description": row.description,
            "created_at": row.created_at,
        }

    def get_member_summaries(self, guild_id: UUID) -> list[dict]:
        """All members of a guild with their most recent judge sync.

        A user may link several judge accounts, so the per-user sync time
        is aggregated in SQL — otherwise each linked account would emit a
        duplicate member row.
        """
        rows = self.db.execute(
            text(
                """
                SELECT u.id, u.username, u.is_suspended,
                       MAX(ja.last_sync_at) AS last_sync_at
                FROM guild_memberships gm
                JOIN users u ON u.id = gm.user_id
                LEFT JOIN judge_accounts ja ON ja.user_id = u.id
                WHERE gm.guild_id = :gid
                GROUP BY u.id, u.username, u.is_suspended
                ORDER BY u.username
                """
            ),
            {"gid": guild_id},
        ).fetchall()
        return [
            {
                "user_id": str(r.id),
                "username": r.username,
                "is_suspended": r.is_suspended,
                "last_sync_at": r.last_sync_at,
            }
            for r in rows
        ]

    def get_league_tier(self, user_id: str) -> str:
        """League tier for a member, defaulting to the entry tier."""
        row = self.db.execute(
            text("SELECT league_tier FROM league_profiles WHERE user_id = :uid"),
            {"uid": user_id},
        ).fetchone()
        if not row or row[0] is None:
            return "bronze"
        tier = row[0]
        return tier.value if hasattr(tier, "value") else str(tier)

    def get_zone_contributions(self, guild_id: UUID) -> list[dict]:
        """Per-zone contribution for this guild."""
        rows = self.db.execute(
            text(
                """
                SELECT zc.zone_id, z.name, zc.aggregated_score
                FROM zone_contributions zc
                JOIN territory_zones z ON z.id = zc.zone_id
                WHERE zc.guild_id = :gid
                """
            ),
            {"gid": guild_id},
        ).fetchall()
        return [
            {
                "zone_id": str(r.zone_id),
                "zone_name": r.name,
                "contribution": float(r.aggregated_score),
            }
            for r in rows
        ]

    def get_all_zone_scores(self) -> dict[str, dict[str, float]]:
        """zone_id -> {guild_id: score} for every zone."""
        rows = self.db.execute(
            text(
                "SELECT zone_id, guild_id, aggregated_score FROM zone_contributions"
            )
        ).fetchall()
        scores: dict[str, dict[str, float]] = {}
        for r in rows:
            scores.setdefault(str(r.zone_id), {})[str(r.guild_id)] = float(r.aggregated_score)
        return scores

    def get_zone_topic_affinity(self, zone_id: UUID) -> dict[str, float]:
        row = self.db.execute(
            text(
                "SELECT topic_affinity FROM territory_zones WHERE id = :zid"
            ),
            {"zid": zone_id},
        ).fetchone()
        if row and row.topic_affinity:
            return dict(row.topic_affinity)
        return {}

    def get_guild_name(self, guild_id: UUID) -> Optional[str]:
        row = self.db.execute(
            text("SELECT name FROM guilds WHERE id = :gid"),
            {"gid": guild_id},
        ).fetchone()
        return row.name if row else None
