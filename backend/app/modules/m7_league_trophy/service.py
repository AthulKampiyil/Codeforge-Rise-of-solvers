"""League & Trophy Progression (REQ-7.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.modules.m7_league_trophy.models import Trophy, LeagueTier, TROPHY_THRESHOLDS
from app.modules.m7_league_trophy.repository import TrophyRepository


class LeagueService:
    """
    Business logic for league tier and trophy progression (REQ-7.x).

    Responsibilities:
    - Create initial trophy/league record
    - Calculate league tier from points
    - Promote/demote based on thresholds
    """

    def __init__(self, db: Session):
        self.db = db
        self.repo = TrophyRepository(db)

    def get_or_create_trophy(self, user_id: str) -> Trophy:
        """Get user's trophy, create if missing."""
        trophy = self.repo.get_trophy(user_id)
        if not trophy:
            trophy = self.repo.create_trophy(user_id)
        return trophy

    def get_league_tier(self, points: int) -> LeagueTier:
        """
        Calculate league tier from points (REQ-7.x).

        Uses TROPHY_THRESHOLDS dictionary to determine tier.
        """
        for tier, thresholds in sorted(TROPHY_THRESHOLDS.items(), key=lambda x: x[1]["min_points"], reverse=True):
            if points >= thresholds["min_points"]:
                return tier
        return LeagueTier.bronze

    def add_points(self, user_id: str, points: int) -> Optional[Trophy]:
        """
        Add points to user's trophy and update tier (REQ-7.x).

        Steps:
        1. Get or create trophy
        2. Add points
        3. Recalculate tier
        4. Promote/demote if needed
        """
        trophy = self.get_or_create_trophy(user_id)
        new_points = trophy.points + points
        trophy = self.repo.update_trophy(user_id, new_points)

        if trophy:
            new_tier = self.get_league_tier(new_points)
            if new_tier != trophy.tier:
                trophy = self.repo.update_tier(user_id, new_tier)

        return trophy

    def get_user_trophy(self, user_id: str) -> Optional[dict]:
        """Get user's current trophy/league status (REQ-7.x)."""
        trophy = self.get_or_create_trophy(user_id)
        return {
            "tier": trophy.tier.value,
            "points": trophy.points,
            "trophy_count": trophy.trophy_count,
            "updated_at": trophy.updated_at.isoformat(),
        }

