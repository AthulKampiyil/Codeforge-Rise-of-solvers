"""League & Trophy Progression (REQ-7.x) — data access layer.

NOTE: SADD §7.2 / App. D: TrophyLedger is append-only and the ONLY write path
to mutate league_profiles.trophy_count.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.m1_auth.models import User
from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier, TrophyEventType, TrophyLedger


class LeagueProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str) -> Optional[LeagueProfile]:
        return self.db.query(LeagueProfile).filter(LeagueProfile.user_id == user_id).first()

    def create(
        self, user_id: str, trophy_count: int = 300, tier: LeagueTier = LeagueTier.bronze
    ) -> LeagueProfile:
        profile = LeagueProfile(
            user_id=user_id,
            trophy_count=trophy_count,
            league_tier=tier,
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_or_create(
        self, user_id: str, starting_trophies: int = 300, starting_tier: LeagueTier = LeagueTier.bronze
    ) -> LeagueProfile:
        profile = self.get(user_id)
        if not profile:
            profile = self.create(user_id, trophy_count=starting_trophies, tier=starting_tier)
        return profile

    def atomic_update_trophy_count(self, user_id: str, delta: int) -> int:
        """
        SADD §6.5.1 atomic single-statement increment preventing lost updates.
        Trophy count cannot drop below 0.
        """
        profile = self.get_or_create(user_id)
        new_balance = max(0, profile.trophy_count + delta)
        profile.trophy_count = new_balance
        profile.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(profile)
        return new_balance

    def set_tier(self, user_id: str, tier: LeagueTier) -> Optional[LeagueProfile]:
        """Idempotent tier update."""
        profile = self.get(user_id)
        if profile and profile.league_tier != tier:
            profile.league_tier = tier
            profile.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(profile)
        return profile

    def get_user_rank(self, user_id: str) -> int:
        """Compute 1-based rank based on trophy count."""
        profile = self.get(user_id)
        if not profile:
            return 1
        higher_count = (
            self.db.query(func.count(LeagueProfile.user_id))
            .filter(LeagueProfile.trophy_count > profile.trophy_count)
            .scalar()
            or 0
        )
        return higher_count + 1

    def get_leaderboard(
        self,
        scope: str = "global",
        guild_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve global or guild leaderboard entries (REQ-7.5).
        """
        query = (
            self.db.query(
                User.id.label("user_id"),
                User.username.label("username"),
                func.coalesce(LeagueProfile.trophy_count, 300).label("trophy_count"),
                func.coalesce(LeagueProfile.league_tier, LeagueTier.bronze).label("league_tier"),
            )
            .outerjoin(LeagueProfile, User.id == LeagueProfile.user_id)
            .filter(User.is_active == True, User.is_suspended == False)  # noqa: E712
        )

        # Guild-scoped filtering if guild_id provided
        if scope == "guild" and guild_id:
            try:
                from app.modules.m5_guild_territory.models import GuildMembership

                query = query.join(GuildMembership, User.id == GuildMembership.user_id).filter(
                    GuildMembership.guild_id == guild_id
                )
            except Exception:
                pass

        rows = (
            query.order_by(
                sa.desc("trophy_count"),
                User.username.asc(),
            )
            .offset(offset)
            .limit(limit)
            .all()
        )

        leaderboard = []
        for idx, row in enumerate(rows):
            tier_val = (
                row.league_tier.value
                if hasattr(row.league_tier, "value")
                else str(row.league_tier)
            )
            leaderboard.append(
                {
                    "user_id": str(row.user_id),
                    "username": row.username,
                    "trophy_count": int(row.trophy_count),
                    "league_tier": tier_val,
                    "rank": offset + idx + 1,
                }
            )

        return leaderboard


class TrophyLedgerRepository:
    def __init__(self, db: Session):
        self.db = db

    def append(
        self,
        user_id: str,
        event_type: TrophyEventType,
        delta: int,
        resulting_balance: Optional[int] = None,
        source_ref_id: Optional[Any] = None,
    ) -> TrophyLedger:
        """Append an auditable mutation row to trophy_ledger (SADD App. D)."""
        entry = TrophyLedger(
            user_id=user_id,
            event_type=event_type,
            delta=delta,
            resulting_balance=resulting_balance,
            source_ref_id=source_ref_id,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def get_by_user(self, user_id: str, limit: int = 50) -> List[TrophyLedger]:
        return (
            self.db.query(TrophyLedger)
            .filter(TrophyLedger.user_id == user_id)
            .order_by(TrophyLedger.created_at.desc())
            .limit(limit)
            .all()
        )
