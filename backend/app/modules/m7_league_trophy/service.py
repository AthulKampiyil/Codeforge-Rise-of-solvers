"""League & Trophy Progression (REQ-7.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).

NOTE: The atomic single-statement increment (SADD 6.5.1), the
Elo-style trophy calculation (SADD 7.3.1.3), and leaderboards (REQ-7.5)
land in plan.md Phase 6. This file currently provides get-or-create so
M4's attack resolution (also deferred to Phase 7) has a stable
interface to call once it exists.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier
from app.modules.m7_league_trophy.repository import LeagueProfileRepository, TrophyLedgerRepository

# TODO (Phase 6): move to game_balance_config (league.thresholds).
LEAGUE_THRESHOLDS = {
    LeagueTier.bronze: 0,
    LeagueTier.silver: 400,
    LeagueTier.gold: 800,
    LeagueTier.platinum: 1300,
    LeagueTier.diamond: 1900,
    LeagueTier.legend: 2600,
}


class LeagueService:
    """Business logic for league tier and trophy progression (REQ-7.x)."""

    def __init__(self, db: Session):
        self.db = db
        self.profile_repo = LeagueProfileRepository(db)
        self.ledger_repo = TrophyLedgerRepository(db)

    def get_or_create_profile(self, user_id: str) -> LeagueProfile:
        profile = self.profile_repo.get(user_id)
        if not profile:
            profile = self.profile_repo.create(user_id)
        return profile

    def tier_for(self, trophy_count: int) -> LeagueTier:
        """REQ-7.2/7.3: six tiers, threshold-based (SADD 7.3.1.3 resolves the exact values)."""
        tier = LeagueTier.bronze
        for candidate, minimum in sorted(LEAGUE_THRESHOLDS.items(), key=lambda kv: kv[1]):
            if trophy_count >= minimum:
                tier = candidate
        return tier

    def get_profile_out(self, user_id: str) -> dict:
        profile = self.get_or_create_profile(user_id)
        return {
            "user_id": str(profile.user_id),
            "trophy_count": profile.trophy_count,
            "league_tier": profile.league_tier.value,
            "updated_at": profile.updated_at,
        }
