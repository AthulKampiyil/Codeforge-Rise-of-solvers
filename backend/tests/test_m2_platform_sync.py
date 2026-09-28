"""M2 Platform Sync tests — REQ-2.x.

Validates:
- TopicTagger maps Codeforces tags to fixed village topics
- PlatformSyncService.get_due_sync_accounts filters correctly
- PlatformSyncService.send_to_dlq creates/escalates DLQ entries
- PlatformSyncService.clear_dlq removes entries
- PlatformSyncService.get_due_dlq_retries returns due retries
- SyncScheduler persists solves idempotently and levels topics
- SyncScheduler routes failures to the DLQ with the right reason
"""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import httpx
import pytest
import respx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.m1_auth.models import JudgeAccount, JudgeType, User
from app.modules.m2_platform_sync.models import (
    DlqFailureReason,
    SolvedProblem,
    SyncDeadLetter,
    SyncLog,
    SyncStatus,
)
from app.modules.m2_platform_sync.service import PlatformSyncService
from app.modules.m2_platform_sync.sync_scheduler import SyncScheduler
from app.modules.m2_platform_sync.topic_tagger import TopicTagger
from app.modules.m3_village.models import Topic, VillageProfile, VillageTopicProgress
from app.modules.m3_village.service import VillageService
from app.modules.m8_notifications.schemas import EventType, VillageUpdatedPayload

USER_STATUS_URL = f"{settings.CODEFORCES_API_BASE}/user.status"


# ── TopicTagger tests ──────────────────────────────────────────────────


class TestTopicTagger:
    def test_map_tags_dp(self):
        assert TopicTagger.map_tags(["dp", "trees"]) == {"dynamic-programming", "data-structures"}

    def test_map_tags_math(self):
        assert TopicTagger.map_tags(["math", "number-theory"]) == {"mathematics"}

    def test_map_tags_strings(self):
        assert TopicTagger.map_tags(["strings", "pattern-matching"]) == {"strings"}

    def test_map_tags_greedy(self):
        assert TopicTagger.map_tags(["greedy", "optimization"]) == {"greedy", "optimization"}

    def test_map_tags_graphs(self):
        assert TopicTagger.map_tags(["graphs", "graph"]) == {"algorithms"}

    def test_map_tags_unknown_tag_ignored(self):
        assert TopicTagger.map_tags(["unknown-tag"]) == set()

    def test_map_tags_empty(self):
        assert TopicTagger.map_tags([]) == set()

    def test_get_topic_by_name_valid(self):
        assert TopicTagger.get_topic_by_name("dynamic-programming") == "dynamic-programming"
        assert TopicTagger.get_topic_by_name("strings") == "strings"

    def test_get_topic_by_name_invalid(self):
        assert TopicTagger.get_topic_by_name("nonexistent") is None
        # Judge tags are not village topics; map_tags does that translation.
        assert TopicTagger.get_topic_by_name("dp") is None

    def test_get_topic_by_name_case_insensitive(self):
        assert TopicTagger.get_topic_by_name("Dynamic-Programming") == "dynamic-programming"


# ── PlatformSyncService tests ──────────────────────────────────────────


def _make_judge_account(db: Session, user_id: uuid.UUID, judge_type: JudgeType = JudgeType.codeforces, verified: bool = True, last_sync_at=None):
    ja = JudgeAccount(
        id=uuid.uuid4(),
        user_id=user_id,
        judge_type=judge_type,
        handle=f"user_{uuid.uuid4().hex[:8]}",
        verified_flag=verified,
        last_sync_at=last_sync_at,
    )
    db.add(ja)
    db.commit()
    db.refresh(ja)
    return ja


def _make_user(db: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        username=f"u_{uuid.uuid4().hex[:8]}",
        email=f"u_{uuid.uuid4().hex[:8]}@example.com",
        password_hash="h",
        is_active=True,
        is_suspended=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class TestPlatformSyncService:
    def test_get_due_sync_accounts_only_verified(self, db: Session):
        user = _make_user(db)
        svc = PlatformSyncService()

        # Unverified should be excluded
        _make_judge_account(db, user.id, verified=False)
        due = svc.get_due_sync_accounts(db)
        assert all(ja.verified_flag for ja in due)

    def test_get_due_sync_accounts_returns_due(self, db: Session):
        user = _make_user(db)
        svc = PlatformSyncService()

        # Account with no last_sync_at is always due
        ja = _make_judge_account(db, user.id, last_sync_at=None)
        due = svc.get_due_sync_accounts(db)
        assert ja in due

    def test_get_due_sync_accounts_excludes_recent_sync(self, db: Session):
        user = _make_user(db)
        svc = PlatformSyncService()

        # Account synced 1 minute ago is NOT due
        ja = _make_judge_account(db, user.id, last_sync_at=datetime.now(timezone.utc) - timedelta(minutes=1))
        due = svc.get_due_sync_accounts(db)
        assert ja not in due

    def test_send_to_dlq_creates_new_entry(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        svc = PlatformSyncService()

        dlq = svc.send_to_dlq(db, ja.id, DlqFailureReason.rate_limited, {"error": "429"})
        assert dlq.judge_account_id == ja.id
        assert dlq.failure_reason == DlqFailureReason.rate_limited
        assert dlq.attempt_count == 1

    def test_send_to_dlq_escalates_existing(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        svc = PlatformSyncService()

        svc.send_to_dlq(db, ja.id, DlqFailureReason.rate_limited)
        dlq2 = svc.send_to_dlq(db, ja.id, DlqFailureReason.circuit_open)

        assert dlq2.attempt_count == 2
        assert dlq2.failure_reason == DlqFailureReason.circuit_open

    def test_clear_dlq_removes_entry(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        svc = PlatformSyncService()

        svc.send_to_dlq(db, ja.id, DlqFailureReason.rate_limited)
        cleared = svc.clear_dlq(db, ja.id)
        assert cleared is True

        due = svc.get_due_sync_accounts(db)
        assert ja in due

    def test_clear_dlq_no_entry(self, db: Session):
        svc = PlatformSyncService()
        cleared = svc.clear_dlq(db, uuid.uuid4())
        assert cleared is False

    def test_get_due_dlq_retries_not_yet_due(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        svc = PlatformSyncService()

        # Set next_retry_at in the future
        future = datetime.now(timezone.utc) + timedelta(hours=1)
        dlq = SyncDeadLetter(
            id=uuid.uuid4(),
            judge_account_id=ja.id,
            failure_reason=DlqFailureReason.rate_limited,
            attempt_count=1,
            last_attempted_at=datetime.now(timezone.utc),
            next_retry_at=future,
        )
        db.add(dlq)
        db.commit()

        due = svc.get_due_dlq_retries(db)
        assert ja.id not in [d.judge_account_id for d in due]

    def test_get_due_dlq_retries_due(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        svc = PlatformSyncService()

        past = datetime.now(timezone.utc) - timedelta(minutes=10)
        dlq = SyncDeadLetter(
            id=uuid.uuid4(),
            judge_account_id=ja.id,
            failure_reason=DlqFailureReason.rate_limited,
            attempt_count=1,
            last_attempted_at=datetime.now(timezone.utc),
            next_retry_at=past,
        )
        db.add(dlq)
        db.commit()

        due = svc.get_due_dlq_retries(db)
        assert ja.id in [d.judge_account_id for d in due]


# ── SyncScheduler tests ────────────────────────────────────────────────


def _sub(problem_id: str, tags=("dp",), rating: int = 2400, age_minutes: int = 0, verdict: str = "OK"):
    return {
        "verdict": verdict,
        "creationTimeSeconds": int(
            (datetime.now(timezone.utc) - timedelta(minutes=age_minutes)).timestamp()
        ),
        "problem": {
            "contestId": problem_id,
            "index": "A",
            "tags": list(tags),
            "rating": rating,
        },
    }


def _mock_submissions(*subs):
    """Route Codeforces user.status to a fixed set of accepted submissions."""
    return respx.get(USER_STATUS_URL).mock(
        return_value=httpx.Response(200, json={"status": "OK", "result": list(subs)})
    )


def _reset_sync_watermark(db: Session, ja: JudgeAccount):
    """Forget the last sync so a re-sync re-receives the same solves.

    Without this the adapter's `since` filter would legitimately drop them
    and the test would pass without exercising idempotency at all.
    """
    ja.last_sync_at = None
    db.commit()


def _progress(db: Session, user_id, topic_name: str) -> VillageTopicProgress:
    topic = db.query(Topic).filter(Topic.name == topic_name).first()
    return (
        db.query(VillageTopicProgress)
        .filter(
            VillageTopicProgress.user_id == user_id,
            VillageTopicProgress.topic_id == topic.id,
        )
        .first()
    )


class TestSyncSchedulerHappyPath:
    async def test_persists_solve_and_touches_topic_progress(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        _mock_submissions(_sub("1234"))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        solves = db.query(SolvedProblem).filter(SolvedProblem.judge_account_id == ja.id).all()
        assert len(solves) == 1
        assert solves[0].problem_ext_id == "1234-A"
        assert solves[0].rating == 2400

        progress = _progress(db, user.id, "dynamic-programming")
        assert progress is not None
        # points_for(2400) = 1 + (2400 - 800) // 200 = 9
        assert progress.progress_points == 9

    async def test_marks_account_up_to_date(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        _mock_submissions(_sub("1234"))

        with respx.mock:
            await SyncScheduler(db).sync_judge_account(str(ja.id))

        db.refresh(ja)
        assert ja.last_sync_at is not None

        log = db.query(SyncLog).filter(SyncLog.judge_account_id == ja.id).one()
        assert log.status == SyncStatus.up_to_date
        assert log.last_error is None
        assert log.last_synced_at is not None

    async def test_resync_is_idempotent(self, db: Session):
        """REQ-2.5 — a re-sync must not double-count solves or points."""
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        scheduler = SyncScheduler(db)

        with respx.mock:
            _mock_submissions(_sub("1234"))
            assert await scheduler.sync_judge_account(str(ja.id)) is True

        _reset_sync_watermark(db, ja)

        with respx.mock:
            _mock_submissions(_sub("1234"))
            assert await scheduler.sync_judge_account(str(ja.id)) is True

        assert db.query(SolvedProblem).filter(SolvedProblem.judge_account_id == ja.id).count() == 1
        assert _progress(db, user.id, "dynamic-programming").progress_points == 9

    async def test_unmapped_tags_record_solve_without_progress(self, db: Session):
        """A solve whose tags map to no seeded topic still counts as solved."""
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        _mock_submissions(_sub("1234", tags=("interactive",)))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        assert db.query(SolvedProblem).filter(SolvedProblem.judge_account_id == ja.id).count() == 1
        assert db.query(VillageTopicProgress).filter(VillageTopicProgress.user_id == user.id).count() == 0

    async def test_empty_history_is_a_successful_no_op(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        _mock_submissions()

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        assert db.query(SolvedProblem).filter(SolvedProblem.judge_account_id == ja.id).count() == 0
        log = db.query(SyncLog).filter(SyncLog.judge_account_id == ja.id).one()
        assert log.status == SyncStatus.up_to_date

    async def test_judge_transport_failure_does_not_park_the_account(self, db: Session):
        """A 503 is not the account's fault — it must not enter the DLQ."""
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(503))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        assert db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).count() == 0


class TestSyncSchedulerLeveling:
    async def test_level_uses_progress_points_not_sqrt(self, db: Session):
        """Two 2400-rated DP solves = 18 points, which clears DP's 14-point
        threshold for level 1. `floor(sqrt(2))` would also give 1, so use a
        second case the placeholder gets wrong: 1 solve = 9 points stays
        level 0, and 3 solves = 27 points reach level 1."""
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        scheduler = SyncScheduler(db)

        with respx.mock:
            _mock_submissions(_sub("1"))
            await scheduler.sync_judge_account(str(ja.id))
        assert _progress(db, user.id, "dynamic-programming").level == 0

        _reset_sync_watermark(db, ja)
        with respx.mock:
            _mock_submissions(_sub("1"), _sub("2"), _sub("3"))
            await scheduler.sync_judge_account(str(ja.id))

        assert _progress(db, user.id, "dynamic-programming").progress_points == 27
        assert _progress(db, user.id, "dynamic-programming").level == 1

    async def test_recomputes_defense_rating_after_sync(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        _mock_submissions(_sub("1"), _sub("2"), _sub("3"))

        with respx.mock:
            await SyncScheduler(db).sync_judge_account(str(ja.id))

        profile = db.query(VillageProfile).filter(VillageProfile.user_id == user.id).one()
        assert profile.total_solved == 3
        assert profile.average_level == 1.0
        # defense_base 100 + level_weight 10 * 1, never the old hard-coded 0.0
        assert profile.defense_rating >= 110.0

    async def test_publishes_village_updated_when_a_level_changes(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        events: list[tuple] = []
        _mock_submissions(_sub("1"), _sub("2"), _sub("3"))

        with respx.mock:
            await SyncScheduler(db, event_publisher=lambda t, p, r: events.append((t, p, r))).sync_judge_account(str(ja.id))

        assert len(events) == 1
        event_type, payload, recipients = events[0]
        assert event_type == EventType.VILLAGE_UPDATED
        assert recipients == [user.id]
        assert payload["topic_name"] == "dynamic-programming"
        assert payload["previous_level"] == 0
        assert payload["new_level"] == 1
        assert payload["source"] == "sync"
        # The payload must satisfy the published Appendix B.1 contract.
        assert VillageUpdatedPayload(**payload)

    async def test_does_not_publish_when_the_level_is_unchanged(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        events: list[tuple] = []
        _mock_submissions(_sub("1"))

        with respx.mock:
            await SyncScheduler(db, event_publisher=lambda t, p, r: events.append((t, p, r))).sync_judge_account(str(ja.id))

        assert events == []

    async def test_awaits_an_async_publisher(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        seen: list = []

        async def publisher(event_type, payload, recipients):
            seen.append(event_type)

        _mock_submissions(_sub("1"), _sub("2"), _sub("3"))

        with respx.mock:
            await SyncScheduler(db, event_publisher=publisher).sync_judge_account(str(ja.id))

        assert seen == [EventType.VILLAGE_UPDATED]


class TestSyncSchedulerFailurePath:
    async def _fail_with(self, db: Session, ja: JudgeAccount, message: str):
        scheduler = SyncScheduler(db)
        scheduler.adapter.get_submissions = AsyncMock(side_effect=Exception(message))
        return await scheduler.sync_judge_account(str(ja.id))

    async def test_failure_parks_account_in_dlq(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)

        assert await self._fail_with(db, ja, "429 Too Many Requests") is False

        dlq = db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).one()
        assert dlq.failure_reason == DlqFailureReason.rate_limited
        assert dlq.attempt_count == 1
        assert "429" in dlq.payload_snapshot["error"]

        log = db.query(SyncLog).filter(SyncLog.judge_account_id == ja.id).one()
        assert log.status == SyncStatus.failed
        assert log.last_error == "429 Too Many Requests"

    async def test_freshly_parked_account_is_in_backoff(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        await self._fail_with(db, ja, "429 Too Many Requests")

        due_ids = [e.judge_account_id for e in PlatformSyncService().get_due_dlq_retries(db)]
        assert ja.id not in due_ids
        # ...and it is also held back from the regular sync sweep.
        assert ja not in PlatformSyncService().get_due_sync_accounts(db)

    @pytest.mark.parametrize(
        "message,expected",
        [
            ("429 Too Many Requests", DlqFailureReason.rate_limited),
            ("codeforces rate limit exceeded", DlqFailureReason.rate_limited),
            ("Circuit breaker open for codeforces", DlqFailureReason.circuit_open),
            ("Failed to decode JSON response body", DlqFailureReason.parse_error),
            ("401 Unauthorized: token expired", DlqFailureReason.auth_expired),
            ("403 Forbidden", DlqFailureReason.auth_expired),
            ("upstream judge returned nothing useful", DlqFailureReason.unknown),
        ],
    )
    async def test_failure_reason_classification(self, db: Session, message, expected):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)

        await self._fail_with(db, ja, message)

        dlq = db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).one()
        assert dlq.failure_reason == expected

    async def test_repeated_failures_escalate_backoff(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)

        await self._fail_with(db, ja, "429 Too Many Requests")
        dlq = db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).one()
        first_retry_at = dlq.next_retry_at

        await self._fail_with(db, ja, "429 Too Many Requests")
        db.refresh(dlq)
        assert dlq.attempt_count == 2
        assert dlq.next_retry_at > first_retry_at

    async def test_successful_sync_clears_the_dlq_entry(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        await self._fail_with(db, ja, "429 Too Many Requests")
        assert db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).count() == 1

        _mock_submissions(_sub("1"))
        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        assert db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).count() == 0


class TestSyncSchedulerGuards:
    async def test_unknown_account_returns_false_without_logging(self, db: Session):
        assert await SyncScheduler(db).sync_judge_account(str(uuid.uuid4())) is False
        assert db.query(SyncLog).count() == 0

    async def test_unverified_account_is_rejected_not_parked(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id, verified=False)

        assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is False

        log = db.query(SyncLog).filter(SyncLog.judge_account_id == ja.id).one()
        assert log.status == SyncStatus.failed
        assert log.last_error == "Account not verified"
        # An unverified link is a user-action problem, not a dead letter.
        assert db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).count() == 0

    async def test_unsupported_judge_is_rejected_not_parked(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id, judge_type=JudgeType.leetcode)

        assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is False

        log = db.query(SyncLog).filter(SyncLog.judge_account_id == ja.id).one()
        assert "Adapter not implemented" in log.last_error
        assert db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).count() == 0


class TestSyncAllAccounts:
    async def test_summarizes_succeeded_and_failed(self, db: Session):
        # One account per judge per user (uq_judge_accounts_user_type), so
        # the two accounts under test need two users.
        good = _make_judge_account(db, _make_user(db).id)
        broken = _make_judge_account(db, _make_user(db).id)

        scheduler = SyncScheduler(db)
        synced: list[str] = []

        async def fake_sync(judge_account_id: str) -> bool:
            synced.append(judge_account_id)
            return judge_account_id != str(broken.id)

        scheduler.sync_judge_account = fake_sync

        summary = await scheduler.sync_all_accounts()

        assert summary == {"total": 2, "succeeded": 1, "failed": 1}
        assert set(synced) == {str(good.id), str(broken.id)}

    async def test_skips_unverified_accounts(self, db: Session):
        user = _make_user(db)
        unverified = _make_judge_account(db, user.id, verified=False)

        scheduler = SyncScheduler(db)
        called: list[str] = []

        async def fake_sync(judge_account_id: str) -> bool:
            called.append(judge_account_id)
            return True

        scheduler.sync_judge_account = fake_sync

        assert await scheduler.sync_all_accounts() == {"total": 0, "succeeded": 0, "failed": 0}
        assert called == []
        assert unverified.verified_flag is False


# ── M3 worker-facing query (Niranjan owns this; the worker calls it) ──


class TestGetStaleProfiles:
    def _profile(self, db: Session, user_id, last_recomputed_at) -> VillageProfile:
        profile = VillageProfile(
            user_id=user_id,
            defense_rating=100.0,
            total_solved=0,
            average_level=0.0,
            last_recomputed_at=last_recomputed_at,
        )
        db.add(profile)
        db.commit()
        return profile

    def test_returns_profiles_older_than_the_cutoff(self, db: Session):
        user = _make_user(db)
        stale = self._profile(db, user.id, datetime.now(timezone.utc) - timedelta(days=3))

        stale_ids = [p.user_id for p in VillageService(db).get_stale_profiles(older_than_minutes=1440)]
        assert stale.user_id in stale_ids

    def test_excludes_freshly_recomputed_profiles(self, db: Session):
        user = _make_user(db)
        fresh = self._profile(db, user.id, datetime.now(timezone.utc) - timedelta(minutes=5))

        stale_ids = [p.user_id for p in VillageService(db).get_stale_profiles(older_than_minutes=1440)]
        assert fresh.user_id not in stale_ids

    def test_orders_oldest_first_and_honours_limit(self, db: Session):
        now = datetime.now(timezone.utc)
        older = self._profile(db, _make_user(db).id, now - timedelta(days=10))
        newer = self._profile(db, _make_user(db).id, now - timedelta(days=5))
        self._profile(db, _make_user(db).id, now - timedelta(minutes=1))

        stale = VillageService(db).get_stale_profiles(older_than_minutes=60, limit=2)
        assert [p.user_id for p in stale] == [older.user_id, newer.user_id]

    def test_recompute_profile_creates_a_row_for_an_unprofiled_user(self, db: Session):
        user = _make_user(db)
        assert db.query(VillageProfile).filter(VillageProfile.user_id == user.id).count() == 0

        VillageService(db).recompute_profile(user.id)

        profile = db.query(VillageProfile).filter(VillageProfile.user_id == user.id).one()
        # An empty village is zeros, not a crash (Niranjan's lane acceptance case).
        assert profile.total_solved == 0
        assert profile.average_level == 0.0
        assert profile.defense_rating == 100.0
