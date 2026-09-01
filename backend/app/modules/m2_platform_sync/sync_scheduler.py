"""Recurring + on-demand sync scheduling (REQ-2.1, REQ-2.2)."""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.modules.m1_auth.models import User, LinkedJudgeProfile, JudgeName
from app.modules.m2_platform_sync.models import SyncLog, SyncStatus
from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesAdapter
from app.modules.m2_platform_sync.topic_tagger import TopicTagger
from app.modules.m3_village.models import Topic, VillageTopicProgress


class SyncScheduler:
    """
    Orchestrates syncing of user submissions from judge platforms (REQ-2.1–2.2).

    Responsibilities:
    - Fetch submissions from Codeforces (isolated adapter per SADD 4.3)
    - Map problem tags to topics (via TopicTagger, isolated per SADD 4.3)
    - Update VillageTopicProgress
    - Log sync status and errors
    """

    def __init__(self, db: Session):
        self.db = db
        self.adapter = CodeforcesAdapter()
        self.tagger = TopicTagger()

    async def sync_user_judge(self, user_id: str, judge_name: JudgeName) -> bool:
        """
        Sync one user's linked judge profile.

        Steps:
        1. Fetch LinkedJudgeProfile and verify verified=true
        2. Call judge adapter to fetch submissions
        3. For each submission, extract tags → topics → update VillageTopicProgress
        4. Log sync status (up_to_date, failed)

        Returns:
            True if sync succeeded, False otherwise
        """
        try:
            # Fetch linked profile
            linked_profile = self.db.query(LinkedJudgeProfile).filter(
                LinkedJudgeProfile.user_id == user_id,
                LinkedJudgeProfile.judge_name == judge_name,
            ).first()

            if not linked_profile:
                self._update_sync_log(user_id, judge_name.value, SyncStatus.failed, "Profile not linked")
                return False

            if not linked_profile.verified:
                self._update_sync_log(user_id, judge_name.value, SyncStatus.failed, "Profile not verified")
                return False

            # Fetch submissions from judge
            if judge_name == JudgeName.codeforces:
                result = await self.adapter.get_submissions(linked_profile.handle)
            else:
                # TODO (Sprint 2): Implement LeetCode and CodeChef adapters
                self._update_sync_log(user_id, judge_name.value, SyncStatus.failed, f"Adapter not implemented: {judge_name.value}")
                return False

            if result.get("status") != "OK":
                error_msg = result.get("error", "Unknown error")
                self._update_sync_log(user_id, judge_name.value, SyncStatus.failed, error_msg)
                return False

            # Process submissions and update topics
            submissions = result.get("result", [])
            for submission in submissions:
                tags = self.adapter.extract_problem_tags(submission)
                topics = self.tagger.map_tags(tags)

                for topic_name in topics:
                    self._update_village_progress(user_id, topic_name)

            # Log successful sync
            self._update_sync_log(user_id, judge_name.value, SyncStatus.up_to_date, None)
            return True

        except Exception as e:
            self._update_sync_log(user_id, judge_name.value, SyncStatus.failed, str(e))
            return False

    async def sync_all_users(self) -> dict:
        """
        Sync all users' linked profiles (intended for background worker job).

        Returns:
            Summary: {"total": int, "succeeded": int, "failed": int}
        """
        summary = {"total": 0, "succeeded": 0, "failed": 0}

        # Fetch all users with verified linked profiles
        linked_profiles = self.db.query(LinkedJudgeProfile).filter(
            LinkedJudgeProfile.verified == True
        ).all()

        for profile in linked_profiles:
            summary["total"] += 1
            success = await self.sync_user_judge(profile.user_id, profile.judge_name)
            if success:
                summary["succeeded"] += 1
            else:
                summary["failed"] += 1

        return summary

    def _update_village_progress(self, user_id: str, topic_name: str):
        """
        Create or increment VillageTopicProgress for a user+topic.

        Updates solved_count and recomputes level (floor(sqrt(count))).
        """
        # Get or create topic
        topic = self.db.query(Topic).filter(Topic.name == topic_name).first()
        if not topic:
            topic = Topic(name=topic_name)
            self.db.add(topic)
            self.db.flush()

        # Get or create progress record
        progress = self.db.query(VillageTopicProgress).filter(
            VillageTopicProgress.user_id == user_id,
            VillageTopicProgress.topic_id == topic.id,
        ).first()

        if not progress:
            progress = VillageTopicProgress(
                user_id=user_id,
                topic_id=topic.id,
                solved_count=1,
                level=1
            )
            self.db.add(progress)
        else:
            progress.solved_count += 1
            progress.level = int(progress.solved_count ** 0.5)  # floor(sqrt(count))

        self.db.commit()

    def _update_sync_log(self, user_id: str, judge_name: str, status: SyncStatus, error: Optional[str]):
        """
        Create or update sync log entry.
        """
        log = self.db.query(SyncLog).filter(
            SyncLog.user_id == user_id,
            SyncLog.judge_name == judge_name,
        ).first()

        if not log:
            log = SyncLog(
                user_id=user_id,
                judge_name=judge_name,
                status=status,
                last_error=error,
                last_synced_at=datetime.utcnow() if status == SyncStatus.up_to_date else None,
            )
            self.db.add(log)
        else:
            log.status = status
            log.last_error = error
            if status == SyncStatus.up_to_date:
                log.last_synced_at = datetime.utcnow()
            log.updated_at = datetime.utcnow()

        self.db.commit()

