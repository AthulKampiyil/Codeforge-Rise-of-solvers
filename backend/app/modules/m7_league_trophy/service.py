"""League & Trophy Progression (REQ-7.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).

SADD §7.2 / App. D: TrophyLedger is the ONLY write path into league_profiles.
"""
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier, TrophyEventType, TrophyLedger
from app.modules.m7_league_trophy.repository import LeagueProfileRepository, TrophyLedgerRepository
from app.modules.m7_league_trophy.trophy_calculator import calculate_trophy_delta
from app.modules.m8_notifications.schemas import EventType

logger = get_logger(__name__)

# Seeded defaults from 002_seed.py
DEFAULT_LEAGUE_THRESHOLDS = {
    LeagueTier.bronze: 0,
    LeagueTier.silver: 400,
    LeagueTier.gold: 800,
    LeagueTier.platinum: 1300,
    LeagueTier.diamond: 1900,
    LeagueTier.legend: 2600,
}
DEFAULT_STARTING_TROPHIES = 300
DEFAULT_K_FACTORS = {
    "bronze": 32,
    "silver": 32,
    "gold": 32,
    "platinum": 24,
    "diamond": 24,
    "legend": 16,
}
DEFAULT_DEFENSE_THRESHOLD = 0.34
DEFAULT_ABANDON_PENALTY = 5
DEFAULT_ELO_DIVISOR = 400


class LeagueService:
    """Business logic for league tier and trophy progression (REQ-7.x)."""

    def __init__(self, db: Session):
        self.db = db
        self.profile_repo = LeagueProfileRepository(db)
        self.ledger_repo = TrophyLedgerRepository(db)

    def get_config(self, key: str, default: Any) -> Any:
        """Read tunable value from game_balance_config table (M9, UC-12)."""
        try:
            row = self.db.execute(
                sa.text("SELECT value FROM game_balance_config WHERE key = :key"),
                {"key": key},
            ).fetchone()
            if row and row[0] is not None:
                return row[0]
        except Exception:
            pass
        return default

    def get_thresholds(self) -> Dict[LeagueTier, int]:
        raw = self.get_config("league.thresholds", None)
        if isinstance(raw, dict):
            thresholds = {}
            for tier in LeagueTier:
                if tier.value in raw:
                    thresholds[tier] = int(raw[tier.value])
                elif tier.name in raw:
                    thresholds[tier] = int(raw[tier.name])
            if thresholds:
                return thresholds
        return DEFAULT_LEAGUE_THRESHOLDS

    def tier_for(self, trophy_count: int) -> LeagueTier:
        """REQ-7.2/7.3: six tiers, threshold-based."""
        thresholds = self.get_thresholds()
        tier = LeagueTier.bronze
        for candidate, minimum in sorted(thresholds.items(), key=lambda kv: kv[1]):
            if trophy_count >= minimum:
                tier = candidate
        return tier

    def get_k_factor(self, tier: str | LeagueTier) -> int:
        tier_str = tier.value if hasattr(tier, "value") else str(tier).lower()
        k_map = self.get_config("trophy.k_factor", DEFAULT_K_FACTORS)
        return int(k_map.get(tier_str, 32))

    def get_or_create_profile(self, user_id: str) -> LeagueProfile:
        starting_trophies = int(self.get_config("league.starting_trophies", DEFAULT_STARTING_TROPHIES))
        starting_tier = self.tier_for(starting_trophies)
        return self.profile_repo.get_or_create(
            user_id, starting_trophies=starting_trophies, starting_tier=starting_tier
        )

    def record_trophy_event(
        self,
        user_id: str,
        event_type: TrophyEventType,
        delta: int,
        source_ref_id: Optional[Any] = None,
    ) -> tuple[LeagueProfile, TrophyLedger, bool]:
        """
        SADD §7.2 / App. D: TrophyLedger is the ONLY write path into league_profiles.
        Every mutation creates an auditable ledger entry and updates the balance atomically.
        If a tier boundary is crossed, publishes LEAGUE_TIER_CHANGED.
        """
        profile = self.get_or_create_profile(user_id)
        old_tier = profile.league_tier

        # Atomic mutation
        new_balance = self.profile_repo.atomic_update_trophy_count(user_id, delta)

        # Append to audit ledger with resulting balance
        ledger_entry = self.ledger_repo.append(
            user_id=user_id,
            event_type=event_type,
            delta=delta,
            resulting_balance=new_balance,
            source_ref_id=source_ref_id,
        )

        # Check for tier crossing
        new_tier = self.tier_for(new_balance)
        tier_changed = new_tier != old_tier
        if tier_changed:
            self.profile_repo.set_tier(user_id, new_tier)
            self._publish_tier_change(user_id, old_tier, new_tier, new_balance)

        # Refresh profile to reflect current values
        self.db.refresh(profile)
        return profile, ledger_entry, tier_changed

    def _publish_tier_change(
        self, user_id: str, old_tier: LeagueTier, new_tier: LeagueTier, trophy_count: int
    ) -> None:
        """Publish LEAGUE_TIER_CHANGED notification event (REQ-7.3)."""
        payload = {
            "user_id": str(user_id),
            "previous_tier": old_tier.value,
            "new_tier": new_tier.value,
            "trophy_count": trophy_count,
        }
        try:
            from app.core.redis import get_async_redis
            from app.modules.m8_notifications.service import NotificationService

            notif_service = NotificationService(self.db)
            redis_client = get_async_redis()

            # Attempt async dispatch if in an event loop, or background task
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(
                    notif_service.publish(
                        redis_client,
                        EventType.LEAGUE_TIER_CHANGED,
                        payload,
                        user_ids=[user_id],
                    )
                )
            except RuntimeError:
                # No running event loop (e.g. sync test or background execution)
                pass
        except Exception:
            logger.exception("failed_to_publish_league_tier_changed")

    def get_profile_out(self, user_id: str) -> dict:
        profile = self.get_or_create_profile(user_id)
        rank = self.profile_repo.get_user_rank(user_id)
        thresholds = self.get_thresholds()
        sorted_thresholds = sorted(thresholds.items(), key=lambda kv: kv[1])

        # Compute next tier details
        next_tier = None
        next_threshold = None
        current_threshold = 0
        for idx, (tier, threshold) in enumerate(sorted_thresholds):
            if tier == profile.league_tier:
                current_threshold = threshold
                if idx + 1 < len(sorted_thresholds):
                    next_tier, next_threshold = sorted_thresholds[idx + 1]
                break

        progress_pct = 100.0
        if next_threshold is not None and next_threshold > current_threshold:
            progress_pct = min(
                100.0,
                max(
                    0.0,
                    round(
                        (profile.trophy_count - current_threshold)
                        / (next_threshold - current_threshold)
                        * 100.0,
                        1,
                    ),
                ),
            )

        return {
            "user_id": str(profile.user_id),
            "trophy_count": profile.trophy_count,
            "league_tier": profile.league_tier.value,
            "rank": rank,
            "updated_at": profile.updated_at,
            "progress_pct": progress_pct,
            "next_tier": next_tier.value if next_tier else None,
            "next_tier_threshold": next_threshold,
            "k_factor": self.get_k_factor(profile.league_tier),
        }

    def get_leaderboard(
        self,
        current_user_id: str,
        scope: str = "global",
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        """Fetch global or guild leaderboard (REQ-7.5)."""
        guild_id = None
        if scope == "guild":
            try:
                from app.modules.m5_guild_territory.service import GuildService

                guild_svc = GuildService(self.db)
                membership = guild_svc.get_user_membership(current_user_id)
                if membership:
                    guild_id = str(membership.guild_id)
            except Exception:
                pass

        return self.profile_repo.get_leaderboard(
            scope=scope, guild_id=guild_id, limit=limit, offset=offset
        )

    def get_ledger_history(self, user_id: str, limit: int = 50) -> List[dict]:
        entries = self.ledger_repo.get_by_user(user_id, limit=limit)
        return [
            {
                "id": str(entry.id),
                "user_id": str(entry.user_id),
                "event_type": entry.event_type.value,
                "delta": entry.delta,
                "resulting_balance": entry.resulting_balance,
                "source_ref_id": str(entry.source_ref_id) if entry.source_ref_id else None,
                "created_at": entry.created_at,
            }
            for entry in entries
        ]
