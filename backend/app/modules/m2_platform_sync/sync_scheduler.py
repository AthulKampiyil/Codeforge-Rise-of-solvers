"""Recurring + on-demand sync scheduling (REQ-2.1, REQ-2.2).

NOTE: This is the Sprint-1-equivalent sync path updated to compile
against the Phase 1 schema (JudgeAccount, SolvedProblem) and the new
JudgeAdapter interface. The full SADD 4.4 hardening — CircuitBreaker,
tenacity retry/backoff, PostgreSQL Dead-Letter Queue, rate limiting —
and the real village-leveling formula (SADD 7.3.1) are plan.md Phase 4
and Phase 5 respectively. Until then this preserves working, idempotent
sync behavior on the corrected schema.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import inspect
import uuid
import secrets

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.modules.m1_auth.models import JudgeAccount, JudgeType, User
from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesAdapter
from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint, DlqFailureReason, SolvedProblem, SyncLog, SyncStatus
from app.modules.m2_platform_sync.service import PlatformSyncService
from app.modules.m2_platform_sync.topic_tagger import TopicTagger
from app.modules.m3_village.models import Topic, VillageTopicProgress
from app.modules.m3_village.formulas import level_for, points_for
from app.modules.m3_village.service import VillageService
from app.modules.m8_notifications.schemas import EventType
from app.modules.m8_notifications.service import NotificationService
from app.core.config import settings
from app.modules.m10_economy.service import EconomyService


class SyncBusy(Exception):
    """An account sync is already running or is still in its cooldown."""

    def __init__(self, retry_after: int):
        self.retry_after = max(1, retry_after)
        super().__init__("Judge account sync is running or cooling down")


class SyncLockUnavailable(Exception):
    """Redis could not provide the exclusion needed for a safe account sync."""

logger = get_logger(__name__)


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

    def __init__(self, db: Session, event_publisher=None, redis=None):
        self.db = db
        self.adapter = CodeforcesAdapter()
        self.tagger = TopicTagger()
        self.event_publisher = event_publisher
        self.redis = redis
        self.sync_service = PlatformSyncService()

    async def sync_judge_account(self, judge_account_id: str, *, on_demand: bool = False) -> bool:
        """
        Sync one linked judge account.

        Returns:
            True if sync succeeded, False otherwise
        """
        from app.core.redis import get_async_redis

        owns_redis = self.redis is None
        redis = self.redis or get_async_redis()
        lock_key = f"m2:sync:account:{judge_account_id}"
        token = secrets.token_hex(16)
        account: Optional[JudgeAccount] = None
        try:
            try:
                acquired = await redis.set(lock_key, token, nx=True, ex=900)
            except Exception as exc:
                raise SyncLockUnavailable("Unable to acquire judge sync lock; retry shortly") from exc
            if not acquired:
                raise SyncBusy(5)

            # Establish one global lock order: account, then checkpoint. Keep
            # this short transaction entirely before the remote await.
            account = (self.db.query(JudgeAccount).filter(JudgeAccount.id == judge_account_id)
                       .with_for_update().populate_existing().first())
            if not account:
                self.db.rollback()
                return False
            if account.judge_type != JudgeType.codeforces:
                self._update_sync_log(account, SyncStatus.failed, f"Adapter not implemented: {account.judge_type.value}")
                return False
            if not account.verified_flag:
                self._update_sync_log(account, SyncStatus.failed, "Account not verified")
                return False

            handle = account.handle
            account_snapshot = (account.user_id, account.handle, account.judge_type)
            # Initialize checkpoint idempotently before releasing the DB transaction.
            from sqlalchemy.dialects.postgresql import insert as checkpoint_insert
            self.db.execute(
                checkpoint_insert(CodeforcesSyncCheckpoint)
                .values(judge_account_id=account.id)
                .on_conflict_do_nothing(constraint="uq_cf_sync_checkpoints_account")
            )
            checkpoint = self.db.query(CodeforcesSyncCheckpoint).filter(
                CodeforcesSyncCheckpoint.judge_account_id == account.id
            ).with_for_update().populate_existing().first()
            now = datetime.now(timezone.utc)
            if checkpoint.finalization_attack_id is None:
                from app.modules.m4_attacks.models import Attack, AttackStatus
                queued = self.db.query(Attack).filter(
                    Attack.attacker_user_id == account.user_id,
                    Attack.resolution_account_id == account.id,
                    Attack.resolution_state == "queued",
                    Attack.status == AttackStatus.in_progress,
                ).order_by(Attack.resolution_requested_at.asc(), Attack.id.asc()).with_for_update().first()
                if queued is not None:
                    checkpoint.request_generation += 1
                    checkpoint.revision += 1
                    queued.resolution_generation = checkpoint.request_generation
                    queued.resolution_state = "pending_scan"
                    checkpoint.finalization_attack_id = queued.id
                    checkpoint.finalization_not_before = queued.resolution_not_before
                    checkpoint.finalization_generation = checkpoint.request_generation
                    checkpoint.head_scan_offset = 1
                    checkpoint.head_scan_max_submission_id = None
                    checkpoint.head_scan_generation = checkpoint.request_generation
                    checkpoint.head_scan_started_at = None
                    checkpoint.head_status = "in_progress"
            cooldown_seconds = max(300, settings.ONDEMAND_SYNC_COOLDOWN_SECONDS)
            if on_demand and checkpoint.requested_at:
                requested_at = checkpoint.requested_at
                if requested_at.tzinfo is None:
                    requested_at = requested_at.replace(tzinfo=timezone.utc)
                remaining = cooldown_seconds - int((now - requested_at).total_seconds())
                if remaining > 0:
                    self.db.rollback()
                    raise SyncBusy(remaining)
            if on_demand:
                checkpoint.requested_at = now
            checkpoint_revision = checkpoint.revision
            request_generation = checkpoint.request_generation
            pending_request = request_generation > checkpoint.served_generation
            finalization_attack_id = checkpoint.finalization_attack_id
            finalization_not_before = checkpoint.finalization_not_before
            finalization_generation = checkpoint.finalization_generation
            from app.modules.m4_attacks.models import Attack, AttackStatus
            active_attack = self.db.query(Attack.id).filter(
                Attack.attacker_user_id == account.user_id,
                Attack.status == AttackStatus.in_progress,
            ).first() is not None
            reconcile_due = (
                checkpoint.full_reconciled_at is None
                or checkpoint.full_reconciled_at <= now - timedelta(minutes=settings.SYNC_POLL_INTERVAL_MINUTES)
            )
            # Manual generations always own a fresh recent-head traversal.
            # They never borrow the independent full-reconciliation cursor.
            fresh_request_scan = finalization_attack_id is None and pending_request and (
                checkpoint.head_status != "in_progress"
                or checkpoint.head_scan_generation != request_generation
            )
            if fresh_request_scan:
                checkpoint.head_scan_offset = 1
                checkpoint.head_scan_max_submission_id = None
                checkpoint.head_scan_generation = request_generation
                checkpoint.head_scan_started_at = None
                checkpoint.head_status = "in_progress"
            elif on_demand and checkpoint.head_status != "in_progress":
                checkpoint.head_scan_offset = 1
                checkpoint.head_scan_max_submission_id = None
                checkpoint.head_scan_generation = None
                checkpoint.head_status = "in_progress"
            elif active_attack and checkpoint.head_status != "in_progress" and checkpoint.revision % 2 == 0:
                checkpoint.head_scan_offset = 1
                checkpoint.head_scan_max_submission_id = None
                checkpoint.head_scan_generation = None
                checkpoint.head_status = "in_progress"
            elif checkpoint.history_status == "complete" and checkpoint.head_status in ("pending", "failed"):
                checkpoint.head_scan_offset = 1
                checkpoint.head_scan_max_submission_id = None
                checkpoint.head_scan_generation = None
                checkpoint.head_status = "in_progress"

            if finalization_attack_id is not None and finalization_generation is not None and (
                checkpoint.head_status != "in_progress"
                or checkpoint.head_scan_generation != finalization_generation
            ):
                checkpoint.head_scan_offset = 1
                checkpoint.head_scan_max_submission_id = None
                checkpoint.head_scan_generation = finalization_generation
                checkpoint.head_scan_started_at = None
                checkpoint.head_status = "in_progress"
                checkpoint.revision += 1

            if (checkpoint.head_status == "in_progress" and finalization_attack_id is not None
                    and finalization_not_before is not None and now < finalization_not_before):
                # Grace-period scans must start after the deadline, not merely
                # finish after it. Leave the durable head cursor untouched.
                scan_mode = "history"
            elif checkpoint.head_status == "in_progress":
                scan_mode = "head"
                if finalization_attack_id is not None and checkpoint.head_scan_generation == finalization_generation:
                    if checkpoint.head_scan_started_at is None:
                        checkpoint.head_scan_started_at = now
            elif checkpoint.history_status == "complete" and (
                checkpoint.full_scan_offset is not None or reconcile_due
            ):
                scan_mode = "full"
                if checkpoint.full_scan_offset is None:
                    checkpoint.full_scan_offset = 1
                    checkpoint.full_scan_max_submission_id = None
            else:
                scan_mode = "history"
            history_offset = checkpoint.history_cursor_submission_id or 1
            head_offset = checkpoint.head_scan_offset or 1
            head_watermark = checkpoint.head_cursor_submission_id
            head_max = checkpoint.head_scan_max_submission_id
            head_scan_started_at = checkpoint.head_scan_started_at
            full_offset = checkpoint.full_scan_offset or 1
            full_max = checkpoint.full_scan_max_submission_id
            # Include scheduler-owned cursor resets in the optimistic revision
            # snapshot; otherwise a finalization scan invalidates itself.
            checkpoint_revision = checkpoint.revision
            self.db.commit()
            fetch_started_at = datetime.now(timezone.utc)
            # Exactly one bounded API page per invocation. History uses the API
            # offset cursor; head rescans the newest page for incremental/reconciliation events.
            from_index = head_offset if scan_mode == "head" else full_offset if scan_mode == "full" else history_offset
            page = await self.adapter.fetch_submission_page(
                handle, from_index, count=settings.CODEFORCES_IMPORT_PAGE_SIZE,
            )
            solves = page.accepted_solves
            # Re-select after the network call. No JudgeAccount row lock or DB
            # transaction is retained while awaiting the remote judge.
            account = (self.db.query(JudgeAccount)
                       .filter(JudgeAccount.id == judge_account_id)
                       .with_for_update().populate_existing().first())
            if account is None:
                self.db.rollback()
                return False
            # Linking ownership can be revoked or changed while the remote
            # request is in flight. Reject the entire fetch before touching
            # solve facts, rewards, village progress, or attacks.
            if (
                not account.verified_flag
                or (account.user_id, account.handle, account.judge_type) != account_snapshot
            ):
                self.db.rollback()
                return False
            checkpoint = self.db.query(CodeforcesSyncCheckpoint).filter(
                CodeforcesSyncCheckpoint.judge_account_id == account.id
            ).with_for_update().populate_existing().first()
            if checkpoint is None or checkpoint.revision != checkpoint_revision:
                self.db.rollback()
                return False
            pending_spy_events = []
            new_solve_persisted = False

            for solve in solves:
                changes = []
                try:
                    # One savepoint per immutable solve fact. All facts in this
                    # fetch remain in the account-locked transaction until the
                    # watermark and event records are safely applied.
                    with self.db.begin_nested():
                        is_new_solve = self._persist_solved_problem(account.id, solve)
                        persisted_solve = self.db.query(SolvedProblem).filter(
                            SolvedProblem.judge_account_id == account.id,
                            SolvedProblem.problem_ext_id == solve.problem_ext_id,
                        ).one()
                        # Reward on both inserts and historical un-rewarded facts. The
                        # ledger's solve FK makes repeated syncs exactly-once.
                        EconomyService(self.db).reward_solve(account.user_id, persisted_solve)
                        self._mark_matching_attacks(account.user_id, solve)
                        for topic_name in self.tagger.map_tags(solve.topic_tags):
                            # Existing facts can advance a matching attack after
                            # launch, but practice points are awarded only once.
                            change = (
                                self._update_village_progress(
                                    account.user_id, topic_name, solve.rating, commit=False,
                                )
                                if is_new_solve else None
                            )
                            if change:
                                changes.append(change)
                                if not self.event_publisher:
                                    topic, previous_level, new_level, defense = change
                                    NotificationService(self.db).enqueue(
                                        EventType.VILLAGE_UPDATED,
                                        self._village_event_payload(
                                            account, topic, previous_level, new_level,
                                            defense, solve.problem_ext_id,
                                        ),
                                        user_ids=[account.user_id],
                                    )
                        self.db.flush()
                except Exception:
                    self.db.rollback()
                    raise

                new_solve_persisted = new_solve_persisted or is_new_solve

                if changes and self.event_publisher:
                    pending_spy_events.append((solve, changes))

            # Total-solved is part of the materialized profile even when all
            # tags on this page are unmapped and no topic progress changed.
            if new_solve_persisted:
                VillageService(self.db).recompute_profile(account.user_id, commit=False)

            if scan_mode == "head":
                boundary_reached = finalization_attack_id is None and any(
                    head_watermark is not None and row.submission_id <= head_watermark
                    for row in page.submissions
                )
                observed = [row.submission_id for row in page.submissions]
                if observed:
                    head_max = max([value for value in (head_max, *observed) if value is not None])
                if page.raw_count == 0 or boundary_reached:
                    if head_max is not None:
                        checkpoint.head_cursor_submission_id = max(head_watermark or 0, head_max)
                    checkpoint.head_scan_offset = None
                    checkpoint.head_scan_max_submission_id = None
                    checkpoint.head_status = "complete"
                    checkpoint.head_reconciled_at = datetime.now(timezone.utc)
                    if checkpoint.head_scan_generation is not None:
                        checkpoint.served_generation = max(
                            checkpoint.served_generation, checkpoint.head_scan_generation,
                        )
                    checkpoint.head_scan_generation = None
                    if finalization_attack_id is not None and head_scan_started_at is not None:
                        proof_at = datetime.now(timezone.utc)
                        minimum = finalization_not_before or head_scan_started_at
                        if head_scan_started_at >= minimum:
                            from app.modules.m4_attacks.models import Attack
                            attack = self.db.query(Attack).filter(
                                Attack.id == finalization_attack_id,
                                Attack.status == AttackStatus.in_progress,
                                Attack.resolution_account_id == account.id,
                            Attack.resolution_generation == finalization_generation,
                            ).with_for_update().populate_existing().first()
                            if attack is not None:
                                attack.resolution_proof_started_at = head_scan_started_at
                                attack.resolution_proof_at = proof_at
                                attack.resolution_proof_generation = finalization_generation
                                attack.resolution_state = "proof_complete"
                        checkpoint.finalization_attack_id = None
                        checkpoint.finalization_not_before = None
                        checkpoint.finalization_generation = None
                        checkpoint.head_scan_started_at = None
                else:
                    checkpoint.head_scan_offset = from_index + page.raw_count
                    checkpoint.head_scan_max_submission_id = head_max
                    checkpoint.head_status = "in_progress"
            elif scan_mode == "full":
                observed = [row.submission_id for row in page.submissions]
                if observed:
                    full_max = max([value for value in (full_max, *observed) if value is not None])
                if page.raw_count == 0:
                    if full_max is not None:
                        checkpoint.head_cursor_submission_id = max(
                            checkpoint.head_cursor_submission_id or 0, full_max,
                        )
                    checkpoint.full_scan_offset = None
                    checkpoint.full_scan_max_submission_id = None
                    checkpoint.full_reconciled_at = datetime.now(timezone.utc)
                else:
                    checkpoint.full_scan_offset = from_index + page.raw_count
                    checkpoint.full_scan_max_submission_id = full_max
            elif page.raw_count == 0:
                checkpoint.history_status = "complete"
            else:
                # Advance over every raw row, regardless of verdict. Short pages
                # are not terminal; only an empty page completes history.
                checkpoint.history_cursor_submission_id = from_index + page.raw_count
                checkpoint.history_status = "in_progress"
            if scan_mode == "history" and checkpoint.head_cursor_submission_id is None:
                observed = [row.submission_id for row in page.submissions]
                if observed:
                    # The first history page defines the durable boundary for
                    # subsequent head traversals without skipping old history.
                    checkpoint.head_cursor_submission_id = max(observed)
            if scan_mode == "history":
                checkpoint.raw_submission_count += page.raw_count
                checkpoint.accepted_submission_count += len(page.accepted_solves)
                checkpoint.history_page_count += 1
            checkpoint.revision += 1
            history_complete = checkpoint.history_status == "complete"
            full_due_after_page = (
                checkpoint.full_reconciled_at is None
                or checkpoint.full_reconciled_at <= datetime.now(timezone.utc)
                - timedelta(minutes=settings.SYNC_POLL_INTERVAL_MINUTES)
            )
            fully_caught_up = (
                history_complete
                and checkpoint.head_status == "complete"
                and checkpoint.full_scan_offset is None
                and not full_due_after_page
            )
            if fully_caught_up:
                account.last_sync_at = fetch_started_at
            self.db.commit()

            # Dispatch only after solve facts, progress and outbox rows are
            # durable. Failures leave the outbox retryable and must not
            # turn a committed sync into a failed/rolled-back solve.
            if self.event_publisher:
                for solve, changes in pending_spy_events:
                    for topic, previous_level, new_level, defense in changes:
                        payload = self._village_event_payload(
                            account, topic, previous_level, new_level, defense, solve.problem_ext_id,
                        )
                        try:
                            result = self.event_publisher(
                                EventType.VILLAGE_UPDATED, payload, [account.user_id],
                            )
                            if inspect.isawaitable(result):
                                await result
                        except Exception:
                            logger.exception("m2_sync_event_spy_failed", judge_account_id=str(account.id))
            else:
                try:
                    NotificationService(self.db).publish_pending_sync()
                except Exception:
                    logger.exception("m2_sync_outbox_dispatch_failed", judge_account_id=str(account.id))

            # Clear from dead-letter queue if it was previously parked there
            self.sync_service.clear_dlq(self.db, account.id)
            self._update_sync_log(
                account,
                SyncStatus.up_to_date if fully_caught_up else SyncStatus.in_progress,
                None,
            )
            return True

        except (SyncBusy, SyncLockUnavailable):
            raise
        except Exception as e:  # noqa: BLE001 — real classification is Phase 4's CircuitBreaker
            try:
                from app.modules.m2_platform_sync.rate_gate import CodeforcesRateBusy
                if isinstance(e, CodeforcesRateBusy):
                    raise
            except ImportError:
                pass
            if account is None:
                self.db.rollback()
                raise
            # A failed solve savepoint or post-commit step must not poison the
            # session used to persist DLQ and sync-log state.
            self.db.rollback()
            err_msg = str(e).lower()
            if "429" in err_msg or "rate limit" in err_msg:
                reason = DlqFailureReason.rate_limited
            elif "circuit" in err_msg:
                reason = DlqFailureReason.circuit_open
            elif "json" in err_msg or "decode" in err_msg or "parse" in err_msg:
                reason = DlqFailureReason.parse_error
            elif "401" in err_msg or "403" in err_msg or "auth" in err_msg or "token" in err_msg:
                reason = DlqFailureReason.auth_expired
            else:
                reason = DlqFailureReason.unknown

            self.sync_service.send_to_dlq(
                self.db,
                account.id,
                reason,
                error_snapshot={"error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()},
            )
            self._update_sync_log(account, SyncStatus.failed, str(e))
            return False
        finally:
            try:
                await redis.eval(
                    'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
                    1, lock_key, token,
                )
            except Exception:
                logger.exception("m2_sync_lock_release_failed", judge_account_id=judge_account_id)
            if owns_redis:
                await redis.aclose()

    @staticmethod
    def _village_event_payload(account, topic, previous_level, new_level, defense, problem_ext_id):
        return {
            "user_id": str(account.user_id),
            "topic_id": str(topic.id),
            "topic_name": topic.name,
            "previous_level": previous_level,
            "new_level": new_level,
            "new_defense_rating": defense,
            "source": "sync",
            "source_ref_id": str(uuid.uuid5(uuid.NAMESPACE_URL, str(problem_ext_id))),
        }

    def _mark_matching_attacks(self, user_id, solve):
        """Serialize solve flags against M4 settlement and enforce its time window."""
        from app.modules.m4_attacks.models import Attack, AttackProblemSet, AttackStatus

        attacks = (
            self.db.query(Attack)
            .filter(
                Attack.attacker_user_id == user_id,
                Attack.status == AttackStatus.in_progress,
            )
            .order_by(Attack.id.asc())
            .with_for_update()
            .populate_existing()
            .all()
        )
        solve_at = solve.solved_at
        if solve_at.tzinfo is None:
            solve_at = solve_at.replace(tzinfo=timezone.utc)
        for attack in attacks:
            # Recheck the refreshed value after waiting on a settlement lock.
            if attack.status != AttackStatus.in_progress:
                continue
            started_at = attack.started_at
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=timezone.utc)
            expires_at = attack.window_expires_at
            if expires_at is not None and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            scoring_end = expires_at
            requested_at = attack.resolution_requested_at
            if requested_at is not None:
                if requested_at.tzinfo is None:
                    requested_at = requested_at.replace(tzinfo=timezone.utc)
                scoring_end = min(scoring_end, requested_at) if scoring_end is not None else requested_at
            if solve_at < started_at or (scoring_end is not None and solve_at > scoring_end):
                continue
            problem = self.db.query(AttackProblemSet).filter(
                AttackProblemSet.attack_id == attack.id,
                AttackProblemSet.problem_ext_id == solve.problem_ext_id,
            ).first()
            if problem and (
                not problem.solved_flag
                or problem.solved_at is None
                or (problem.solved_at.replace(tzinfo=timezone.utc) if problem.solved_at.tzinfo is None else problem.solved_at) < started_at
                or (scoring_end is not None and (problem.solved_at.replace(tzinfo=timezone.utc) if problem.solved_at.tzinfo is None else problem.solved_at) > scoring_end)
            ):
                problem.solved_flag = True
                problem.solved_at = solve.solved_at

    async def sync_all_accounts(self) -> dict:
        """Sync all verified judge accounts (intended for the background worker)."""
        summary = {"total": 0, "succeeded": 0, "failed": 0}

        account_ids = [str(account_id) for (account_id,) in self.db.query(JudgeAccount.id).filter(
            JudgeAccount.verified_flag == True,  # noqa: E712
        ).all()]
        # The recurring sweep must not retain its enumeration transaction while
        # awaiting any individual account's remote HTTP request.
        self.db.rollback()

        for account_id in account_ids:
            summary["total"] += 1
            success = await self.sync_judge_account(account_id)
            summary["succeeded" if success else "failed"] += 1

        return summary

    def _persist_solved_problem(self, judge_account_id, solve) -> bool:
        """
        Insert an immutable SolvedProblem fact. Returns False if it
        already existed (idempotent re-sync — REQ-2.5).
        """
        exists = self.db.query(SolvedProblem).filter(
            SolvedProblem.judge_account_id == judge_account_id,
            SolvedProblem.problem_ext_id == solve.problem_ext_id,
        ).first()
        if exists:
            return False

        stmt = (
            pg_insert(SolvedProblem)
            .values(
                judge_account_id=judge_account_id,
                problem_ext_id=solve.problem_ext_id,
                topic_tags=solve.topic_tags,
                rating=solve.rating,
                solved_at=solve.solved_at,
            )
            .on_conflict_do_nothing(constraint="uq_solved_problems_account_problem")
            .returning(SolvedProblem.id)
        )
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def _update_village_progress(
        self, user_id: str, topic_name: str, rating: int | None = None, commit: bool = True,
    ):
        """
        Create or increment VillageTopicProgress for a user+topic.

        Progress points are rating-weighted and levels use triangular costs.
        """
        # Serialize all derived village state for a user, including the
        # missing-progress/profile creation case.
        self.db.query(User).filter(User.id == user_id).with_for_update().populate_existing().first()
        topic = self.db.query(Topic).filter(Topic.name == topic_name).first()
        if not topic:
            return None  # topics are seeded; an unmapped tag yields no topic

        progress = self.db.query(VillageTopicProgress).filter(
            VillageTopicProgress.user_id == user_id,
            VillageTopicProgress.topic_id == topic.id,
        ).with_for_update().populate_existing().first()

        previous_level = progress.level if progress else 0
        earned = points_for(rating)
        if not progress:
            progress = VillageTopicProgress(user_id=user_id, topic_id=topic.id, progress_points=earned, level=0)
            self.db.add(progress)
        else:
            progress.progress_points += earned
        self.db.flush()
        progress.level = level_for(progress.progress_points, topic.base_threshold)

        village_service = VillageService(self.db)
        profile = village_service.recompute_profile(user_id, commit=commit)
        if commit:
            self.db.commit()
        # A point award changes the village even when it does not cross a
        # level boundary; consumers use this event to invalidate the profile.
        return (topic, previous_level, progress.level, profile.defense_rating)

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
