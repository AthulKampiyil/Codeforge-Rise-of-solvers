"""League & Trophy Progression (REQ-7.x) — data access layer.

NOTE: The atomic increment pattern (SADD 6.5.1) and Elo calculation
(SADD 7.3.1.3) land in plan.md Phase 6. This module currently exposes
a get-or-create for LeagueProfile and a simple append to TrophyLedger.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.m7_league_trophy.models import LeagueProfile, LeagueTier, TrophyLedger


class LeagueProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str) -> Optional[LeagueProfile]:
        return self.db.query(LeagueProfile).filter(LeagueProfile.user_id == user_id).first()

    def create(self, user_id: str, tier: LeagueTier = LeagueTier.bronze) -> LeagueProfile:
        profile = LeagueProfile(user_id=user_id, league_tier=tier)
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def set_tier(self, user_id: str, tier: LeagueTier) -> Optional[LeagueProfile]:
        """Idempotent tier write (SADD 6.5.1: WHERE league_tier != :new_tier is Phase 6's job)."""
        profile = self.get(user_id)
        if profile and profile.league_tier != tier:
            profile.league_tier = tier
            self.db.commit()
        return profile


class TrophyLedgerRepository:
    def __init__(self, db: Session):
        self.db = db

    def append(self, user_id: str, event_type, delta: int, source_ref_id=None) -> TrophyLedger:
        entry = TrophyLedger(user_id=user_id, event_type=event_type, delta=delta, source_ref_id=source_ref_id)
        self.db.add(entry)
        self.db.commit()
        return entry

    def get_by_user(self, user_id: str, limit: int = 50) -> list[TrophyLedger]:
        return self.db.query(TrophyLedger).filter(
            TrophyLedger.user_id == user_id
        ).order_by(TrophyLedger.created_at.desc()).limit(limit).all()
