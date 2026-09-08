"""Recurring + on-demand sync scheduling (REQ-2.1, REQ-2.2).

NOTE: This is the Sprint-1-equivalent sync path updated to compile
against the Phase 1 schema (JudgeAccount, SolvedProblem) and the new
JudgeAdapter interface. The full SADD 4.4 hardening — CircuitBreaker,
tenacity retry/backoff, PostgreSQL Dead-Letter Queue, rate limiting —
and the real village-leveling formula (SADD 7.3.1) are plan.md Phase 4
and Phase 5 respectively. Until then this preserves working, idempotent
sync behavior on the corrected schema.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.m1_auth.models import JudgeAccount, JudgeType, User
from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesAdapter
from app.modules.m2_platform_sync.models import SolvedProblem, SyncLog, SyncStatus
from app.modules.m2_platform_sync.topic_tagger import TopicTagger
from app.modules.m3_village.models import Topic, VillageTopicProgress


class SyncScheduler:
    """
    Orchestrates syncing of user submissions from judge platforms (REQ-2.1–2.2).

    Responsibilities:
    - Fetch submissions from Codeforces (isolated adapter per SADD 4.3)
    - Persist immutable SolvedProblem facts (idempotent via unique constraint)
    - Map problem tags to topics (via TopicTagger, isolated per SADD 4.3)
    - Update VillageTopicProgress
    - Log sync status and errors
    """

    def __init__(self, db: Session):
        self.db = db
        self.adapter = CodeforcesAdapter()
        self.tagger = TopicTagger()

    async def sync_judge_account(self, judge_account_id: str) -> bool:
        """
        Sync one linked judge account.

        Returns:
            True if sync succeeded, False otherwise
        """
        account = self.db.query(JudgeAccount).filter(JudgeAccount.id == judge_account_id).first()

        if not account:
            return False

        if account.judge_type != JudgeType.codeforces:
            self._update_sync_log(account, SyncStatus.failed, f"Adapter not implemented: {account.judge_type.value}")
            return False

        if not account.verified_flag:
            self._update_sync_log(account, SyncStatus.failed, "Account not verified")
            return False

        try:
            solves = await self.adapter.get_submissions(account.handle, since=account.last_sync_at)

            for solve in solves:
                if not self._persist_solved_problem(account.id, solve):
                    continue  # already recorded (idempotent re-sync, REQ-2.5)

                topics = self.tagger.map_tags(solve.topic_tags)
                for topic_name in topics:
                    self._update_village_progress(account.user_id, topic_name)

            account.last_sync_at = datetime.now(timezone.utc)
            self.db.commit()

            self._update_sync_log(account, SyncStatus.up_to_date, None)
            return True

        except Exception as e:  # noqa: BLE001 — real classification is Phase 4's CircuitBreaker
            self._update_sync_log(account, SyncStatus.failed, str(e))
            return False

    async def sync_all_accounts(self) -> dict:
        """Sync all verified judge accounts (intended for the background worker)."""
        summary = {"total": 0, "succeeded": 0, "failed": 0}

        accounts = self.db.query(JudgeAccount).filter(JudgeAccount.verified_flag == True).all()  # noqa: E712

        for account in accounts:
            summary["total"] += 1
            success = await self.sync_judge_account(str(account.id))
            summary["succeeded" if success else "failed"] += 1

        return summary

    def _persist_solved_problem(self, judge_account_id, solve) -> bool:
        """
        Insert an immutable SolvedProblem fact. Returns False if it
        already existed (idempotent re-sync — REQ-2.5).
        """
        record = SolvedProblem(
            judge_account_id=judge_account_id,
            problem_ext_id=solve.problem_ext_id,
            topic_tags=solve.topic_tags,
            rating=solve.rating,
            solved_at=solve.solved_at,
        )
        self.db.add(record)
        try:
            self.db.flush()
            return True
        except IntegrityError:
            self.db.rollback()
            return False

    def _update_village_progress(self, user_id: str, topic_name: str):
        """
        Create or increment VillageTopicProgress for a user+topic.

        TODO (plan.md Phase 5): replace this floor(sqrt) placeholder
        with the points-based leveling formula (SADD 7.3.1 derivative:
        triangular growth against topics.base_threshold).
        """
        topic = self.db.query(Topic).filter(Topic.name == topic_name).first()
        if not topic:
            return  # topics are seeded (plan.md Phase 1); an unmapped tag yields no topic

        progress = self.db.query(VillageTopicProgress).filter(
            VillageTopicProgress.user_id == user_id,
            VillageTopicProgress.topic_id == topic.id,
        ).first()

        if not progress:
            progress = VillageTopicProgress(user_id=user_id, topic_id=topic.id, progress_points=1, level=1)
            self.db.add(progress)
        else:
            progress.progress_points += 1
            progress.level = int(progress.progress_points ** 0.5)

        self.db.commit()

    def _update_sync_log(self, account: JudgeAccount, status: SyncStatus, error: Optional[str]):
        log = self.db.query(SyncLog).filter(SyncLog.judge_account_id == account.id).first()

        if not log:
            log = SyncLog(
                user_id=account.user_id,
                judge_account_id=account.id,
                judge_name=account.judge_type.value,
                status=status,
                last_error=error,
                last_synced_at=datetime.now(timezone.utc) if status == SyncStatus.up_to_date else None,
            )
            self.db.add(log)
        else:
            log.status = status
            log.last_error = error
            if status == SyncStatus.up_to_date:
                log.last_synced_at = datetime.now(timezone.utc)
            log.updated_at = datetime.now(timezone.utc)

        self.db.commit()
