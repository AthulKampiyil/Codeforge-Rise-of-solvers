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
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from threading import Barrier
from unittest.mock import AsyncMock

import httpx
import pytest
import respx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.m1_auth.models import JudgeAccount, JudgeType, User
from app.modules.m2_platform_sync.models import (
    CodeforcesSyncCheckpoint,
    DlqFailureReason,
    SolvedProblem,
    SyncDeadLetter,
    SyncLog,
    SyncStatus,
)
from app.modules.m2_platform_sync.judge_adapters.base import NormalizedSolve
from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesSubmissionPage
from app.modules.m2_platform_sync.service import PlatformSyncService
from app.modules.m2_platform_sync.sync_scheduler import SyncScheduler
from app.modules.m2_platform_sync.sync_scheduler import SyncBusy
from app.modules.m2_platform_sync.topic_tagger import TopicTagger
from app.modules.m3_village.models import Topic, VillageProfile, VillageTopicProgress
from app.modules.m3_village.service import VillageService
from app.modules.m8_notifications.models import Notification, NotificationOutbox
from app.modules.m8_notifications.schemas import EventType, VillageUpdatedPayload

USER_STATUS_URL = f"{settings.CODEFORCES_API_BASE}/user.status"
_submission_sequence = 0


def _page(solves=(), raw_count=None, submission_ids=()):
    from app.modules.m2_platform_sync.judge_adapters.codeforces import RawSubmission
    solves = list(solves)
    ids = list(submission_ids) or [1_000_000 - index for index in range(len(solves))]
    return CodeforcesSubmissionPage(
        raw_count=len(ids) if raw_count is None else raw_count,
        submissions=[RawSubmission(value, "OK") for value in ids],
        accepted_solves=solves,
    )


@pytest.fixture(autouse=True)
def _sync_scheduler_redis(monkeypatch):
    """Keep scheduler lock tests isolated from any developer Redis instance."""
    class LockRedis:
        held = set()

        async def set(self, key, token, nx=False, ex=None):
            if key in self.held:
                return None
            self.held.add(key)
            return True

        async def eval(self, script, count, key, token):
            self.held.discard(key)
            return 1

        async def aclose(self):
            pass

    monkeypatch.setattr("app.core.redis.get_async_redis", LockRedis)


# ── TopicTagger tests ──────────────────────────────────────────────────


class TestTopicTagger:
    """The tagger must target the seeded topics table vocabulary
    (plan.md §4.6). A name that is not seeded silently drops progress."""

    def test_map_tags_dp(self):
        assert TopicTagger.map_tags(["dp", "trees"]) == {"dynamic-programming", "trees"}

    def test_map_tags_math(self):
        assert TopicTagger.map_tags(["math", "number theory"]) == {"math"}

    def test_map_tags_strings(self):
        assert TopicTagger.map_tags(["strings", "string suffix structures"]) == {"strings"}

    def test_map_tags_greedy(self):
        assert TopicTagger.map_tags(["greedy"]) == {"greedy"}

    def test_map_tags_graphs(self):
        assert TopicTagger.map_tags(["graphs", "dfs and similar"]) == {"graphs"}

    def test_map_tags_implementation_family_to_arrays(self):
        assert TopicTagger.map_tags(
            ["implementation", "sortings", "two pointers", "binary search", "brute force"]
        ) == {"arrays"}

    def test_map_tags_underscore_and_hyphen_variants(self):
        assert TopicTagger.map_tags(["data-structures", "data_structures"]) == {"data-structures"}

    def test_every_mapped_topic_is_seeded(self):
        assert set(TopicTagger.TAG_TO_TOPIC.values()) <= TopicTagger.FIXED_TOPICS

    def test_map_tags_unknown_tag_ignored_and_counted(self):
        TopicTagger.UNMAPPED_TAG_COUNTER.clear()
        assert TopicTagger.map_tags(["zzzunknown"]) == set()
        assert TopicTagger.UNMAPPED_TAG_COUNTER["zzzunknown"] == 1

    def test_map_tags_empty(self):
        assert TopicTagger.map_tags([]) == set()

    def test_get_topic_by_name_seeded_topics(self):
        assert TopicTagger.get_topic_by_name("dynamic-programming") == "dynamic-programming"
        assert TopicTagger.get_topic_by_name("strings") == "strings"
        assert TopicTagger.get_topic_by_name("math") == "math"

    def test_get_topic_by_name_invalid(self):
        assert TopicTagger.get_topic_by_name("nonexistent") is None

    def test_get_topic_by_name_rejects_unseeded_legacy_topics(self):
        # These were in the old pre-seed map; they must not resolve.
        assert TopicTagger.get_topic_by_name("algorithms") is None
        assert TopicTagger.get_topic_by_name("mathematics") is None
        assert TopicTagger.get_topic_by_name("optimization") is None

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

    def test_pending_request_query_respects_dlq_backoff_and_is_bounded(self, db: Session):
        svc = PlatformSyncService()
        ready = _make_judge_account(db, _make_user(db).id)
        blocked = _make_judge_account(db, _make_user(db).id)
        for account in (ready, blocked):
            db.add(CodeforcesSyncCheckpoint(
                judge_account_id=account.id, request_generation=1, served_generation=0,
            ))
        db.add(SyncDeadLetter(
            judge_account_id=blocked.id,
            failure_reason=DlqFailureReason.unknown,
            attempt_count=1,
            last_attempted_at=datetime.now(timezone.utc),
            next_retry_at=datetime.now(timezone.utc) + timedelta(hours=1),
        ))
        db.commit()

        assert svc.get_pending_sync_account_ids(db, limit=1) == [str(ready.id)]
        assert svc.get_pending_sync_account_ids(db, limit=10) == [str(ready.id)]

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
    global _submission_sequence
    _submission_sequence += 1
    contest_id = int(problem_id) if problem_id.isdigit() else 999999
    index = "A" if problem_id.isdigit() else problem_id
    return {
        "id": 1_000_000 - _submission_sequence,
        "verdict": verdict,
        "creationTimeSeconds": int(
            (datetime.now(timezone.utc) - timedelta(minutes=age_minutes)).timestamp()
        ),
        "problem": {
            "contestId": contest_id,
            "index": index,
            "tags": list(tags),
            "rating": rating,
        },
    }


def _mock_submissions(*subs):
    """Serve one explicit raw page, then the empty page terminating history."""
    def response(request):
        offset = int(request.url.params.get("from", "1"))
        rows = list(subs) if offset == 1 else []
        return httpx.Response(200, json={"status": "OK", "result": rows})
    return respx.get(USER_STATUS_URL).mock(side_effect=response)


def _reset_sync_watermark(db: Session, ja: JudgeAccount):
    """Forget the last sync so a re-sync re-receives the same solves.

    Without this the adapter's `since` filter would legitimately drop them
    and the test would pass without exercising idempotency at all.
    """
    ja.last_sync_at = None
    checkpoint = db.query(CodeforcesSyncCheckpoint).filter(
        CodeforcesSyncCheckpoint.judge_account_id == ja.id
    ).first()
    if checkpoint:
        checkpoint.history_status = "pending"
        checkpoint.history_cursor_submission_id = None
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
    async def test_successful_fetch_watermark_does_not_consume_on_demand_cooldown(self, db: Session, monkeypatch):
        class LockRedis:
            held = set()

            async def set(self, key, token, nx=False, ex=None):
                if key in self.held:
                    return None
                self.held.add(key)
                return True

            async def eval(self, script, count, key, token):
                self.held.discard(key)
                return 1

            async def aclose(self):
                pass

        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        redis = LockRedis()
        scheduler = SyncScheduler(db, redis=redis)
        scheduler.adapter.fetch_submission_page = AsyncMock(return_value=_page())
        # A demo/development zero cannot bypass the REQ-2.2 minimum.
        monkeypatch.setattr(settings, "ONDEMAND_SYNC_COOLDOWN_SECONDS", 0)

        assert await scheduler.sync_judge_account(str(ja.id), on_demand=True) is True
        db.refresh(ja)
        assert ja.last_sync_at is None
        checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=ja.id).one()
        assert checkpoint.requested_at is not None
        with pytest.raises(SyncBusy):
            await scheduler.sync_judge_account(str(ja.id), on_demand=True)

    async def test_account_lock_excludes_concurrent_delayed_fetch(self, db: Session):
        class LockRedis:
            held = set()

            async def set(self, key, token, nx=False, ex=None):
                if key in self.held:
                    return None
                self.held.add(key)
                return True

            async def eval(self, script, count, key, token):
                self.held.discard(key)
                return 1

            async def aclose(self):
                pass

        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        redis = LockRedis()
        scheduler = SyncScheduler(db, redis=redis)
        entered = __import__("asyncio").Event()
        release = __import__("asyncio").Event()

        async def delayed_fetch(*args, **kwargs):
            entered.set()
            await release.wait()
            return _page()

        scheduler.adapter.fetch_submission_page = delayed_fetch
        first = __import__("asyncio").create_task(scheduler.sync_judge_account(str(ja.id)))
        await entered.wait()
        assert not db.in_transaction()
        with pytest.raises(SyncBusy):
            await scheduler.sync_judge_account(str(ja.id))
        release.set()
        assert await first is True

    async def test_router_persists_request_generation_and_returns_accepted(self, db: Session):
        from app.modules.m2_platform_sync import router as router_module

        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        response = await router_module.request_sync(user, db, JudgeType.codeforces)
        sync_route = next(route for route in router_module.router.routes if route.path == "/platform_sync/sync")
        assert sync_route.status_code == 202
        assert response == {"status": "queued", "judge_account_id": str(ja.id)}
        checkpoint = db.query(CodeforcesSyncCheckpoint).filter(
            CodeforcesSyncCheckpoint.judge_account_id == ja.id
        ).one()
        assert checkpoint.requested_at is not None
        assert checkpoint.request_generation == 1

    async def test_router_request_is_database_only(self, db: Session):
        from app.modules.m2_platform_sync import router as router_module

        user = _make_user(db)
        ja = _make_judge_account(db, user.id)

        result = await router_module.request_sync(user, db, JudgeType.codeforces)
        checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=ja.id).one()
        assert result["status"] == "queued"
        assert checkpoint.request_generation == 1
        assert checkpoint.served_generation == 0

    async def test_router_enforces_manual_cooldown_and_allows_request_at_boundary(self, db: Session, monkeypatch):
        from fastapi import HTTPException
        from app.modules.m2_platform_sync import router as router_module

        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        monkeypatch.setattr(settings, "ONDEMAND_SYNC_COOLDOWN_SECONDS", 0)

        await router_module.request_sync(user, db, JudgeType.codeforces)
        with pytest.raises(HTTPException) as cooldown:
            await router_module.request_sync(user, db, JudgeType.codeforces)
        assert cooldown.value.status_code == 429
        assert cooldown.value.detail["code"] == "sync_cooldown"
        assert db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=ja.id).one().request_generation == 1

        checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=ja.id).one()
        checkpoint.requested_at = datetime.now(timezone.utc) - timedelta(seconds=300)
        db.commit()
        result = await router_module.request_sync(user, db, JudgeType.codeforces)
        assert result["status"] == "queued"
        assert db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=ja.id).one().request_generation == 2

    def test_concurrent_http_sync_requests_serialize_across_independent_sessions(self, engine):
        """Two real endpoint requests share only committed setup, not a DB session/transaction."""
        from fastapi.testclient import TestClient
        from sqlalchemy.orm import sessionmaker

        from app.core.dependencies import get_current_active_user
        from app.db.session import get_db
        from app.main import app

        # This test commits fixtures and cleanup, so refuse any non-test database.
        database_name = engine.url.database or ""
        assert "test" in database_name.lower(), f"Refusing to write test data to database {database_name!r}"

        IndependentSession = sessionmaker(bind=engine, expire_on_commit=False)
        setup = IndependentSession()
        user = _make_user(setup)
        account = _make_judge_account(setup, user.id, judge_type=JudgeType.codeforces, verified=True)
        user_id, account_id = user.id, account.id
        setup.close()

        def independent_db():
            session = IndependentSession()
            try:
                yield session
            finally:
                session.close()

        def current_user():
            with IndependentSession() as session:
                return session.query(User).filter(User.id == user_id).one()

        previous_db_override = app.dependency_overrides.get(get_db)
        previous_user_override = app.dependency_overrides.get(get_current_active_user)
        app.dependency_overrides[get_db] = independent_db
        app.dependency_overrides[get_current_active_user] = current_user
        barrier = Barrier(2)

        def post_sync(_):
            barrier.wait(timeout=10)
            # Separate TestClients provide separate event loops, so the sync
            # DB work in this async route can genuinely contend on row locks.
            client = TestClient(app)
            try:
                return client.post("/platform_sync/sync")
            finally:
                client.close()

        try:
            with ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(post_sync, range(2)))

            assert sorted(response.status_code for response in responses) == [202, 429]
            rejected = next(response for response in responses if response.status_code == 429)
            assert rejected.json()["detail"]["code"] == "sync_cooldown"
            with IndependentSession() as verify:
                checkpoint = verify.query(CodeforcesSyncCheckpoint).filter_by(
                    judge_account_id=account_id,
                ).one()
                assert checkpoint.request_generation == 1
        finally:
            if previous_db_override is None:
                app.dependency_overrides.pop(get_db, None)
            else:
                app.dependency_overrides[get_db] = previous_db_override
            if previous_user_override is None:
                app.dependency_overrides.pop(get_current_active_user, None)
            else:
                app.dependency_overrides[get_current_active_user] = previous_user_override
            with IndependentSession() as cleanup:
                cleanup.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account_id).delete()
                cleanup.query(JudgeAccount).filter_by(id=account_id).delete()
                cleanup.query(User).filter_by(id=user_id).delete()
                cleanup.commit()

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

    async def test_partial_history_page_does_not_mark_account_up_to_date(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        _mock_submissions(_sub("1234"))

        with respx.mock:
            await SyncScheduler(db).sync_judge_account(str(ja.id))

        db.refresh(ja)
        assert ja.last_sync_at is None

        log = db.query(SyncLog).filter(SyncLog.judge_account_id == ja.id).one()
        assert log.status == SyncStatus.in_progress
        assert log.last_error is None
        assert log.last_synced_at is None

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

    async def test_duplicate_submission_in_sync_only_awards_points_once(self, db: Session):
        """Only the first persisted fact for a problem earns village points."""
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        _mock_submissions(_sub("1234"), _sub("1234"))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        assert db.query(SolvedProblem).filter(SolvedProblem.judge_account_id == ja.id).count() == 1
        assert _progress(db, user.id, "dynamic-programming").progress_points == 9

    async def test_unmapped_tags_record_solve_without_progress(self, db: Session):
        """A solve whose tags map to no seeded topic still counts as solved."""
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        db.add(VillageProfile(user_id=user.id, total_solved=0))
        db.flush()
        _mock_submissions(_sub("1234", tags=("interactive",)))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        assert db.query(SolvedProblem).filter(SolvedProblem.judge_account_id == ja.id).count() == 1
        assert db.query(VillageTopicProgress).filter(VillageTopicProgress.user_id == user.id).count() == 0
        profile = db.query(VillageProfile).filter(VillageProfile.user_id == user.id).one()
        assert profile.total_solved == 1

    async def test_existing_untagged_solve_is_not_retroactively_credited(self, db: Session):
        """Without a per-solve topic-credit marker, immutable facts cannot be safely backcredited."""
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        scheduler = SyncScheduler(db)
        _mock_submissions(_sub("retroactive-tags", tags=()))
        with respx.mock:
            assert await scheduler.sync_judge_account(str(ja.id)) is True

        _reset_sync_watermark(db, ja)
        _mock_submissions(_sub("retroactive-tags", tags=("dp",)))
        with respx.mock:
            assert await scheduler.sync_judge_account(str(ja.id)) is True

        solve = db.query(SolvedProblem).filter_by(
            judge_account_id=ja.id, problem_ext_id="999999-retroactive-tags",
        ).one()
        assert solve.topic_tags == []
        assert db.query(VillageTopicProgress).filter_by(user_id=user.id).count() == 0
        assert db.query(VillageProfile).filter_by(user_id=user.id).one().total_solved == 1

    async def test_empty_history_is_a_successful_no_op(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        _mock_submissions()

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        assert db.query(SolvedProblem).filter(SolvedProblem.judge_account_id == ja.id).count() == 0
        log = db.query(SyncLog).filter(SyncLog.judge_account_id == ja.id).one()
        assert log.status == SyncStatus.in_progress

    async def test_judge_transport_failure_is_parked_without_advancing_watermark(self, db: Session):
        user = _make_user(db)
        old_watermark = datetime.now(timezone.utc) - timedelta(hours=1)
        ja = _make_judge_account(db, user.id, last_sync_at=old_watermark)
        respx.get(USER_STATUS_URL).mock(return_value=httpx.Response(503))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is False

        db.refresh(ja)
        assert ja.last_sync_at == old_watermark
        assert db.query(SyncDeadLetter).filter(SyncDeadLetter.judge_account_id == ja.id).count() == 1


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

        assert len(events) == 3
        event_type, payload, recipients = events[1]
        assert event_type == EventType.VILLAGE_UPDATED
        assert recipients == [user.id]
        assert payload["topic_name"] == "dynamic-programming"
        assert payload["previous_level"] == 0
        assert payload["new_level"] == 1
        assert payload["source"] == "sync"
        # The payload must satisfy the published Appendix B.1 contract.
        assert VillageUpdatedPayload(**payload)

    async def test_default_scheduler_enqueues_targeted_event_for_level_change(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        topic = db.query(Topic).filter(Topic.name == "dynamic-programming").one()
        db.add(VillageTopicProgress(
            user_id=user.id, topic_id=topic.id, progress_points=10, level=0,
        ))
        db.commit()
        _mock_submissions(_sub("level-up", rating=2400))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        outbox = db.query(NotificationOutbox).filter(
            NotificationOutbox.event_type == EventType.VILLAGE_UPDATED.value,
        ).one()
        notification = db.query(Notification).filter(
            Notification.event_type == EventType.VILLAGE_UPDATED.value,
        ).one()
        assert outbox.target_user_ids == [str(user.id)]
        assert outbox.payload["topic_name"] == "dynamic-programming"
        assert outbox.payload["previous_level"] == 0
        assert outbox.payload["new_level"] == 1
        assert notification.user_id == user.id
        assert notification.payload == outbox.payload

    async def test_redis_failure_keeps_default_scheduler_event_retryable(self, db: Session, monkeypatch):
        import app.core.redis as redis_module

        class BrokenRedis:
            def publish(self, *args, **kwargs):
                raise RuntimeError("redis unavailable")

        monkeypatch.setattr(redis_module, "get_sync_redis", lambda: BrokenRedis())
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        topic = db.query(Topic).filter(Topic.name == "dynamic-programming").one()
        db.add(VillageTopicProgress(
            user_id=user.id, topic_id=topic.id, progress_points=10, level=0,
        ))
        db.commit()
        _mock_submissions(_sub("level-up", rating=2400))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        outbox = db.query(NotificationOutbox).filter(
            NotificationOutbox.event_type == EventType.VILLAGE_UPDATED.value,
        ).one()
        assert outbox.target_user_ids == [str(user.id)]
        assert outbox.delivered_at is None
        assert outbox.attempts == 1
        assert outbox.last_error == "redis unavailable"
        assert db.query(Notification).filter(
            Notification.event_type == EventType.VILLAGE_UPDATED.value,
        ).count() == 1
        assert db.query(SolvedProblem).filter(
            SolvedProblem.judge_account_id == ja.id,
        ).count() == 1
        assert _progress(db, user.id, "dynamic-programming").level == 1

    async def test_publishes_village_invalidation_when_points_change_without_level_up(
        self, db: Session, monkeypatch,
    ):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        events: list[tuple] = []
        commits = []
        original_commit = db.commit

        def track_commit():
            original_commit()
            commits.append(True)

        monkeypatch.setattr(db, "commit", track_commit)
        _mock_submissions(_sub("below-level-boundary", rating=800))

        def publish(event_type, payload, recipients):
            # The solve/progress transaction is durable before dispatch.
            assert len(commits) >= 2  # checkpoint commit and solve/progress commit
            events.append((event_type, payload, recipients))

        with respx.mock:
            await SyncScheduler(db, event_publisher=publish).sync_judge_account(str(ja.id))

        assert len(events) == 1
        event_type, payload, recipients = events[0]
        assert event_type == EventType.VILLAGE_UPDATED
        assert recipients == [user.id]
        assert payload["previous_level"] == payload["new_level"] == 0
        assert VillageUpdatedPayload(**payload)

    async def test_awaits_an_async_publisher(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        seen: list = []

        async def publisher(event_type, payload, recipients):
            seen.append(event_type)

        _mock_submissions(_sub("1"), _sub("2"), _sub("3"))

        with respx.mock:
            await SyncScheduler(db, event_publisher=publisher).sync_judge_account(str(ja.id))

        assert seen == [EventType.VILLAGE_UPDATED] * 3

    async def test_existing_solve_advances_active_attack_without_awarding_practice_points(self, db: Session):
        """A post-launch accepted resubmission can count for an attack, not twice for practice."""
        from app.modules.m4_attacks.models import Attack, AttackProblemSet, AttackStatus

        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        started = datetime.now(timezone.utc) - timedelta(minutes=10)
        attack = Attack(
            attacker_user_id=user.id, target_user_id=_make_user(db).id,
            status=AttackStatus.in_progress, started_at=started,
            window_expires_at=started + timedelta(hours=1),
        )
        db.add(attack)
        db.flush()
        problem = AttackProblemSet(
            attack_id=attack.id, problem_ext_id="1234-A", solved_flag=False,
        )
        db.add(problem)
        db.add(SolvedProblem(
            judge_account_id=ja.id, problem_ext_id="1234-A", topic_tags=["dp"],
            rating=2400, solved_at=started - timedelta(days=1),
        ))
        db.commit()
        _mock_submissions(_sub("1234", age_minutes=30), _sub("1234", age_minutes=1))

        with respx.mock:
            assert await SyncScheduler(db).sync_judge_account(str(ja.id)) is True

        db.refresh(problem)
        assert problem.solved_flag is True
        assert problem.solved_at >= started
        assert db.query(VillageTopicProgress).filter(
            VillageTopicProgress.user_id == user.id,
        ).count() == 0

    async def test_terminal_attack_problem_flag_is_unchanged_by_later_sync(self, db: Session):
        from app.modules.m4_attacks.models import Attack, AttackProblemSet, AttackStatus
        from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint

        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        checkpoint = CodeforcesSyncCheckpoint(judge_account_id=ja.id)
        db.add(checkpoint)
        target = _make_user(db)
        started = datetime.now(timezone.utc) - timedelta(hours=2)
        attack = Attack(
            attacker_user_id=user.id, target_user_id=target.id, status=AttackStatus.in_progress,
            started_at=started, window_expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(attack)
        db.flush()
        problem = AttackProblemSet(attack_id=attack.id, problem_ext_id="4321-A", solved_flag=False)
        db.add(problem)
        proof_at = datetime.now(timezone.utc)
        attack.resolution_requested_at = proof_at - timedelta(seconds=1)
        attack.resolution_not_before = attack.resolution_requested_at
        attack.resolution_account_id = ja.id
        attack.resolution_generation = 1
        attack.resolution_proof_started_at = attack.resolution_requested_at
        attack.resolution_proof_generation = 1
        attack.resolution_proof_at = proof_at
        db.commit()

        from app.modules.m4_attacks.service import AttackService
        AttackService(db).resolve_attack(str(attack.id), actor_user_id=str(user.id))
        db.refresh(attack)
        assert attack.status == AttackStatus.resolved
        SyncScheduler(db)._mark_matching_attacks(user.id, NormalizedSolve(
            problem_ext_id="4321-A", topic_tags=["dp"], rating=2400,
            solved_at=datetime.now(timezone.utc),
        ))
        db.refresh(problem)
        assert problem.solved_flag is False


class TestSyncSchedulerFailurePath:
    async def _fail_with(self, db: Session, ja: JudgeAccount, message: str):
        scheduler = SyncScheduler(db)
        scheduler.adapter.fetch_submission_page = AsyncMock(side_effect=Exception(message))
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

    async def test_rate_gate_busy_is_retryable_and_not_dead_lettered(self, db: Session):
        from app.modules.m2_platform_sync.rate_gate import CodeforcesRateBusy

        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        scheduler = SyncScheduler(db)
        scheduler.adapter.fetch_submission_page = AsyncMock(side_effect=CodeforcesRateBusy(2.5))

        with pytest.raises(CodeforcesRateBusy) as busy:
            await scheduler.sync_judge_account(str(ja.id))

        assert busy.value.retry_after == 2.5
        assert db.query(SyncDeadLetter).filter_by(judge_account_id=ja.id).count() == 0

    async def test_freshly_parked_account_is_in_backoff(self, db: Session):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        await self._fail_with(db, ja, "429 Too Many Requests")

        due_ids = [e.judge_account_id for e in PlatformSyncService().get_due_dlq_retries(db)]
        assert ja.id not in due_ids
        # ...and it is also held back from the regular sync sweep.
        assert ja not in PlatformSyncService().get_due_sync_accounts(db)

    async def test_persistently_failing_account_does_not_starve_healthy_dispatch(self, db: Session):
        failing = _make_judge_account(db, _make_user(db).id)
        healthy = _make_judge_account(db, _make_user(db).id)
        await self._fail_with(db, failing, "persistent upstream failure")
        await self._fail_with(db, failing, "persistent upstream failure")

        due_ids = [account.id for account in PlatformSyncService().get_due_sync_accounts(db, limit=2)]
        assert healthy.id in due_ids
        assert failing.id not in due_ids

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

    async def test_partial_two_topic_solve_rolls_back_and_retry_completes(self, db: Session, monkeypatch):
        user = _make_user(db)
        ja = _make_judge_account(db, user.id)
        scheduler = SyncScheduler(db)
        original = scheduler._update_village_progress
        attempts = 0

        def fail_after_first_topic(user_id, topic_name, rating=None, commit=True):
            nonlocal attempts
            attempts += 1
            if attempts == 2:
                raise RuntimeError("injected second-topic failure")
            return original(user_id, topic_name, rating=rating, commit=commit)

        monkeypatch.setattr(scheduler, "_update_village_progress", fail_after_first_topic)
        _mock_submissions(_sub("two-topic", tags=("dp", "math")))
        with respx.mock:
            assert await scheduler.sync_judge_account(str(ja.id)) is False

        assert db.query(SolvedProblem).filter(
            SolvedProblem.judge_account_id == ja.id,
            SolvedProblem.problem_ext_id == "999999-two-topic",
        ).count() == 0
        assert db.query(VillageTopicProgress).filter(VillageTopicProgress.user_id == user.id).count() == 0

        monkeypatch.setattr(scheduler, "_update_village_progress", original)
        _mock_submissions(_sub("two-topic", tags=("dp", "math")))
        with respx.mock:
            assert await scheduler.sync_judge_account(str(ja.id)) is True

        assert db.query(SolvedProblem).filter(
            SolvedProblem.judge_account_id == ja.id,
            SolvedProblem.problem_ext_id == "999999-two-topic",
        ).count() == 1
        assert _progress(db, user.id, "dynamic-programming").progress_points == 9
        assert _progress(db, user.id, "math").progress_points == 9


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

        async def fake_sync(judge_account_id: str, *, on_demand: bool = False) -> bool:
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

        async def fake_sync(judge_account_id: str, *, on_demand: bool = False) -> bool:
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
