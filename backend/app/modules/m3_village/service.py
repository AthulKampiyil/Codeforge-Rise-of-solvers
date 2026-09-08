"""Personal Code Village Management (REQ-3.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).

NOTE: The real defense-rating and leveling formulas (SADD 7.3.1) land
in plan.md Phase 5, along with VillageProfile maintenance and the
VILLAGE_UPDATED realtime event. This file currently reports progress
as tracked by sync_scheduler.py's placeholder leveling logic.
"""
from sqlalchemy.orm import Session

from app.modules.m3_village.models import Topic
from app.modules.m3_village.repository import VillageRepository


class VillageService:
    """Business logic for personal code village progression (REQ-3.1–3.4)."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = VillageRepository(db)

    def get_user_village(self, user_id: str) -> dict:
        """
        Get user's complete village profile (REQ-3.4).

        TODO (plan.md Phase 5): source defense_rating from
        VillageProfile (materialized, matchmaking-indexed) instead of
        computing it ad hoc here.
        """
        progress_records = self.repo.get_all_by_user(user_id)

        if not progress_records:
            return {
                "user_id": user_id,
                "total_solved": 0,
                "average_level": 0.0,
                "topics": [],
                "defense_rating": 0.0,
            }

        topics = []
        total_solved = 0
        total_level = 0

        for progress in progress_records:
            topic = self.db.query(Topic).filter(Topic.id == progress.topic_id).first()
            if topic:
                topics.append({
                    "id": str(progress.topic_id),
                    "name": topic.name,
                    "display_name": topic.display_name,
                    "structure_key": topic.structure_key,
                    "progress_points": progress.progress_points,
                    "level": progress.level,
                })
                total_solved += progress.progress_points
                total_level += progress.level

        average_level = total_level / len(progress_records) if progress_records else 0.0

        return {
            "user_id": user_id,
            "total_solved": total_solved,
            "average_level": round(average_level, 2),
            "topics": sorted(topics, key=lambda t: t["level"], reverse=True),
            "defense_rating": 0.0,  # TODO (Phase 5): SADD 7.3.1 formula
        }
