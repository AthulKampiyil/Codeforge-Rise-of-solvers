"""League & Trophy Progression (REQ-7.x) — data access layer.

Owns: all direct DB queries for this module's tables.
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.modules.m7_league_trophy.models import Trophy, LeagueTier


class TrophyRepository:
    """Data access layer for trophy records."""

    def __init__(self, db: Session):
        self.db = db

    def get_trophy(self, user_id: str) -> Optional[Trophy]:
        """Fetch user's trophy record."""
        return self.db.query(Trophy).filter(Trophy.user_id == user_id).first()

    def create_trophy(self, user_id: str, tier: LeagueTier = LeagueTier.bronze) -> Trophy:
        """Create a new trophy record."""
        trophy = Trophy(user_id=user_id, tier=tier)
        self.db.add(trophy)
        self.db.commit()
        return trophy

    def update_trophy(self, user_id: str, points: int, trophy_count: int = None) -> Optional[Trophy]:
        """Update trophy points and count."""
        trophy = self.get_trophy(user_id)
        if trophy:
            trophy.points = points
            if trophy_count is not None:
                trophy.trophy_count = trophy_count
            self.db.commit()
        return trophy

    def update_tier(self, user_id: str, tier: LeagueTier):
        """Update user's league tier."""
        trophy = self.get_trophy(user_id)
        if trophy:
            trophy.tier = tier
            self.db.commit()
        return trophy

