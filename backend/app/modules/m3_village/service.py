"""Personal Code Village Management (REQ-3.x) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).
"""
from sqlalchemy.orm import Session
from app.modules.m3_village.models import VillageTopicProgress, Topic
from app.modules.m3_village.repository import VillageRepository


class VillageService:
    """
    Business logic for personal code village progression (REQ-3.1–3.4).

    Responsibilities:
    - Get user's village profile (all topics + levels)
    - Calculate aggregate stats (defense rating placeholder for Sprint 2)
    """

    def __init__(self, db: Session):
        self.db = db
        self.repo = VillageRepository(db)

    def get_user_village(self, user_id: str) -> dict:
        """
        Get user's complete village profile (REQ-3.4).

        Returns:
        {
            "user_id": UUID string,
            "total_solved": int (sum of all topics' solved_count),
            "average_level": float,
            "topics": [
                {
                    "id": UUID,
                    "name": string,
                    "solved_count": int,
                    "level": int (floor(sqrt(solved_count)))
                },
                ...
            ],
            "defense_rating": float  # TODO (Sprint 2): implement real calculation
        }
        """
        # Fetch all progress records for user
        progress_records = self.repo.get_all_by_user(user_id)

        if not progress_records:
            return {
                "user_id": user_id,
                "total_solved": 0,
                "average_level": 0.0,
                "topics": [],
                "defense_rating": 0.0,  # TODO: real calculation in Sprint 2
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
                    "solved_count": progress.solved_count,
                    "level": progress.level,
                })
                total_solved += progress.solved_count
                total_level += progress.level

        average_level = total_level / len(progress_records) if progress_records else 0.0

        return {
            "user_id": user_id,
            "total_solved": total_solved,
            "average_level": round(average_level, 2),
            "topics": sorted(topics, key=lambda t: t["level"], reverse=True),  # Sorted by level DESC
            "defense_rating": 0.0,  # TODO: real calculation in Sprint 2
        }

    def get_topic_leaderboard(self, topic_name: str, limit: int = 10) -> list[dict]:
        """
        Get top users for a specific topic (placeholder for future leaderboard features).

        Returns:
            List of {"user_id": UUID, "handle": str, "level": int, "solved_count": int}
        """
        # TODO (Sprint 2): Implement leaderboard with user names/handles
        return []

