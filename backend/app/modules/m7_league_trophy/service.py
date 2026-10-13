"""League & Trophy Progression (REQ-7.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).

SADD §7.2 / App. D: TrophyLedger is the ONLY write path into league_profiles.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import HTTPException, status
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


    def get_current_season(self) -> dict:
        """Return current season metadata."""
        from datetime import datetime, timezone, timedelta

        # Fallback values if not seeded
        default_start = (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()
        default_end = (datetime.now(timezone.utc) + timedelta(days=45)).isoformat()

        name = self.get_config("season.name", "Season III")
        start_str = self.get_config("season.start", default_start)
        end_str = self.get_config("season.end", default_end)

        # Parse ISO strings safely
        try:
            start_date = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        except:
            start_date = datetime.now(timezone.utc) - timedelta(days=45)

        try:
            end_date = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
        except:
            end_date = datetime.now(timezone.utc) + timedelta(days=45)

        now = datetime.now(timezone.utc)
        delta = now - start_date
        current_week = max(1, (delta.days // 7) + 1)

        return {
            "season_name": name,
            "season_start": start_date,
            "season_end": end_date,
            "current_week": current_week
        }

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

    def get_or_create_profile(self, user_id: str, commit: bool = True) -> LeagueProfile:
        starting_trophies = int(self.get_config("league.starting_trophies", DEFAULT_STARTING_TROPHIES))
        starting_tier = self.tier_for(starting_trophies)
        return self.profile_repo.get_or_create(
            user_id,
            starting_trophies=starting_trophies,
            starting_tier=starting_tier,
            commit=commit,
        )

    def lock_attack_profiles(self, user_ids: List[str]) -> Dict[str, LeagueProfile]:
        """Initialize if needed, then lock/refresh attack profiles in stable ID order."""
        starting_trophies = int(self.get_config("league.starting_trophies", DEFAULT_STARTING_TROPHIES))
        starting_tier = self.tier_for(starting_trophies)
        ordered_ids = sorted({str(user_id) for user_id in user_ids})
        for user_id in ordered_ids:
            self.profile_repo.get_or_create(
                user_id, starting_trophies=starting_trophies,
                starting_tier=starting_tier, commit=False,
            )
        profiles = self.profile_repo.lock_many(ordered_ids)
        return {str(profile.user_id): profile for profile in profiles}

    def get_due_tier_reconciliations(self) -> List[LeagueProfile]:
        """
        Worker query: find all profiles whose stored league_tier differs from the tier
        computed from their trophy_count.
        """
        profiles = self.profile_repo.get_all_profiles()
        due = []
        for p in profiles:
            expected_tier = self.tier_for(p.trophy_count)
            if p.league_tier != expected_tier:
                due.append(p)
        return due

    def reconcile_league_tiers(self) -> int:
        """
        Worker reconciliation pass: ensures all league_profiles have their
        league_tier in sync with their trophy_count per game_balance_config thresholds.
        Returns the count of reconciled profiles.
        """
        due_profiles = self.get_due_tier_reconciliations()
        reconciled_count = 0
        notifications = []
        try:
            # Candidate snapshots are not authoritative. Re-lock and refresh one
            # profile at a time in deterministic order, keeping every lock until
            # the whole repair batch and its outbox rows commit together.
            for candidate in sorted(due_profiles, key=lambda p: str(p.user_id)):
                locked = self.profile_repo.lock_many([str(candidate.user_id)])
                if not locked:
                    continue
                profile = locked[0]
                old_tier = profile.league_tier
                new_tier = self.tier_for(profile.trophy_count)
                if old_tier == new_tier:
                    continue
                self.profile_repo.set_tier(str(profile.user_id), new_tier, commit=False)
                self._enqueue_tier_change(
                    str(profile.user_id), old_tier, new_tier, profile.trophy_count
                )
                notifications.append((str(profile.user_id), old_tier, new_tier, profile.trophy_count))
                reconciled_count += 1
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        if notifications:
            self._publish_reconciliation_outbox()
        return reconciled_count

    def record_trophy_event(
        self,
        user_id: str,
        event_type: TrophyEventType,
        delta: int,
        source_ref_id: Optional[Any] = None,
        commit: bool = True,
    ) -> tuple[LeagueProfile, TrophyLedger, bool]:
        """
        SADD §7.2 / App. D: TrophyLedger is the ONLY write path into league_profiles.
        Every mutation creates an auditable ledger entry and updates the balance atomically.
        If a tier boundary is crossed, publishes LEAGUE_TIER_CHANGED.
        """
        try:
            profile = self.get_or_create_profile(user_id, commit=False)
            # Re-select with a row lock and refresh any identity-map snapshot.
            profile = self.profile_repo.lock_many([user_id])[0]
            old_tier = profile.league_tier
            new_balance = self.profile_repo.atomic_update_trophy_count(user_id, delta, commit=False)
            ledger_entry = self.ledger_repo.append(
                user_id=user_id, event_type=event_type, delta=delta,
                resulting_balance=new_balance, source_ref_id=source_ref_id, commit=False,
            )

            new_tier = self.tier_for(new_balance)
            tier_changed = new_tier != old_tier
            if tier_changed:
                self.profile_repo.set_tier(user_id, new_tier, commit=False)
                from app.modules.m8_notifications.service import NotificationService
                NotificationService(self.db).enqueue(
                    EventType.LEAGUE_TIER_CHANGED,
                    {"user_id": str(user_id), "previous_tier": old_tier.value,
                     "new_tier": new_tier.value, "trophy_count": new_balance},
                    user_ids=[user_id],
                )

            self.db.flush()
            if commit:
                self.db.commit()
            self.db.refresh(profile)
            return profile, ledger_entry, tier_changed
        except Exception:
            if commit:
                self.db.rollback()
            raise

    def reconcile_profiles(self, limit: int = 200) -> int:
        """
        Worker reconciliation pass. Trophy movement is event-driven via
        record_trophy_event(); this only repairs drift, it never
        re-applies trophy deltas.

        Two drift classes are repaired:
        1. A user has TrophyLedger rows but no league_profiles row.
        2. A profile's league_tier no longer matches tier_for(trophy_count)
           (e.g. an admin retuned league thresholds at runtime).

        Returns the number of profiles repaired.
        """
        repaired = 0
        notifications = []
        try:
            missing_users = self.profile_repo.get_profiles_with_ledger_but_no_profile(limit=limit)
            for user_id in sorted(missing_users):
                self.get_or_create_profile(user_id, commit=False)
                repaired += 1

            candidates = self.profile_repo.get_all_for_reconcile(limit=limit)
            for candidate in sorted(candidates, key=lambda p: str(p.user_id)):
                locked = self.profile_repo.lock_many([str(candidate.user_id)])
                if not locked:
                    continue
                profile = locked[0]
                old_tier = profile.league_tier
                expected_tier = self.tier_for(profile.trophy_count)
                if old_tier != expected_tier:
                    self.profile_repo.set_tier(
                        str(profile.user_id), expected_tier, commit=False
                    )
                    self._enqueue_tier_change(
                        str(profile.user_id), old_tier, expected_tier, profile.trophy_count
                    )
                    notifications.append(
                        (str(profile.user_id), old_tier, expected_tier, profile.trophy_count)
                    )
                    repaired += 1
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        if notifications:
            self._publish_reconciliation_outbox()
        return repaired

    def _enqueue_tier_change(
        self, user_id: str, old_tier: LeagueTier, new_tier: LeagueTier, trophy_count: int
    ) -> None:
        from app.modules.m8_notifications.service import NotificationService

        NotificationService(self.db).enqueue(
            EventType.LEAGUE_TIER_CHANGED,
            {
                "user_id": str(user_id),
                "previous_tier": old_tier.value,
                "new_tier": new_tier.value,
                "trophy_count": trophy_count,
            },
            user_ids=[user_id],
        )

    def _publish_reconciliation_outbox(self) -> None:
        """Attempt delivery only after repaired tiers and outbox rows commit."""
        try:
            from app.modules.m8_notifications.service import NotificationService

            NotificationService(self.db).publish_pending_sync()
        except Exception:
            # The durable outbox remains available for the next worker attempt.
            logger.exception("league_tier_reconciliation_publish_deferred")

    def publish_tier_change(
        self, user_id: str, old_tier: LeagueTier, new_tier: LeagueTier, trophy_count: int
    ) -> None:
        """Publish a tier change after a caller-owned transaction commits."""
        self._publish_tier_change(user_id, old_tier, new_tier, trophy_count)

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
            from app.modules.m8_notifications.service import NotificationService
            NotificationService(self.db).enqueue(
                EventType.LEAGUE_TIER_CHANGED, payload, user_ids=[user_id]
            )
            self.db.commit()
        except Exception:
            self.db.rollback()
            logger.exception("failed_to_enqueue_league_tier_changed")

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
        current_user_id: Optional[str],
        scope: str = "global",
        limit: int = 50,
        offset: int = 0,
    ) -> List[dict]:
        """Fetch global or guild leaderboard (REQ-7.5)."""
        guild_id = None
        if scope == "guild":
            if current_user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required for guild leaderboard",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            from app.modules.m5_guild_territory.service import GuildService

            guild = GuildService(self.db).get_user_guild(UUID(str(current_user_id)))
            if guild is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="An active guild membership is required",
                )
            guild_id = str(guild.id)

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
