"""Business logic for the materialized personal code village."""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.modules.m1_auth.models import JudgeAccount, User
from app.modules.m2_platform_sync.models import SolvedProblem
from app.modules.m3_village.formulas import defense_rating, points_to_next_level, progress_percent
from app.modules.m3_village.repository import VillageRepository
from app.modules.m9_admin_config.models import GameBalanceConfig


DEFAULT_BALANCE = {
    "village.defense_base": 100,
    "village.defense_level_weight": 10,
    "village.defense_solved_weight": 0.25,
}


class VillageService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = VillageRepository(db)

    def _balance(self, key: str):
        row = self.db.query(GameBalanceConfig).filter(GameBalanceConfig.key == key).first()
        return row.value if row is not None else DEFAULT_BALANCE[key]

    def _solved_count(self, user_id: str) -> int:
        return self.db.query(SolvedProblem).join(
            JudgeAccount, JudgeAccount.id == SolvedProblem.judge_account_id
        ).filter(JudgeAccount.user_id == user_id).count()

    def recompute_profile(self, user_id: str):
        progress_records = self.repo.get_all_by_user(user_id)
        total_solved = self._solved_count(user_id)
        total_level = sum(progress.level for progress in progress_records)
        average_level = round(total_level / len(progress_records), 2) if progress_records else 0.0
        defense = defense_rating(
            self._balance("village.defense_base"),
            self._balance("village.defense_level_weight"),
            self._balance("village.defense_solved_weight"),
            [progress.level for progress in progress_records],
            total_solved,
        )
        return self.repo.save_profile(
            user_id,
            defense_rating=round(defense, 2),
            total_solved=total_solved,
            average_level=average_level,
            last_recomputed_at=datetime.now(timezone.utc),
        )

    def get_user_village(self, user_id: str) -> dict:
        profile = self.repo.get_profile(user_id) or self.recompute_profile(user_id)
        user = self.db.query(User).filter(User.id == user_id).first()
        topics = []
        for topic, progress in self.repo.get_topics_with_progress(user_id):
            points = progress.progress_points if progress else 0
            level = progress.level if progress else 0
            topics.append({
                "id": str(topic.id), "name": topic.name, "display_name": topic.display_name,
                "structure_key": topic.structure_key, "progress_points": points, "level": level,
                "points_to_next_level": points_to_next_level(points, topic.base_threshold),
                "progress_pct": progress_percent(points, topic.base_threshold),
            })
        return {
            "user_id": user_id, "username": user.username if user else None,
            "total_solved": profile.total_solved, "average_level": profile.average_level,
            "topics": sorted(topics, key=lambda t: t["level"], reverse=True),
            "defense_rating": profile.defense_rating,
        }
