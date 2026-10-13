"""Durable importer pagination, restart and concurrency contracts."""
import pytest
from datetime import datetime, timedelta, timezone

from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesSubmissionPage, RawSubmission
from app.modules.m2_platform_sync.judge_adapters.base import NormalizedSolve
from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint, SolvedProblem
from app.modules.m2_platform_sync.sync_scheduler import SyncScheduler
from app.modules.m4_attacks.models import Attack, AttackStatus
from app.modules.m4_attacks.service import AttackService
from test_m2_platform_sync import _make_judge_account, _make_user, _page


class _LockRedis:
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


def _raw_page(ids, verdicts=None, solves=()):
    verdicts = verdicts or ["WRONG_ANSWER"] * len(ids)
    return CodeforcesSubmissionPage(
        raw_count=len(ids),
        submissions=[RawSubmission(submission_id, verdict) for submission_id, verdict in zip(ids, verdicts)],
        accepted_solves=list(solves),
    )


@pytest.mark.asyncio
async def test_short_and_all_wrong_answer_pages_advance_raw_offset_and_restart(db):
    account = _make_judge_account(db, _make_user(db).id)
    scheduler = SyncScheduler(db, redis=_LockRedis())
    offsets = []

    async def fetch(handle, from_index, count=100):
        offsets.append(from_index)
        return {
            1: _raw_page([900, 899]),
            3: _raw_page([898]),
            4: _raw_page([]),
        }[from_index]

    scheduler.adapter.fetch_submission_page = fetch
    assert await scheduler.sync_judge_account(str(account.id))
    checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account.id).one()
    assert checkpoint.history_cursor_submission_id == 3
    assert checkpoint.history_status == "in_progress"

    # A new scheduler instance resumes from the durable offset after restart.
    scheduler = SyncScheduler(db, redis=_LockRedis())
    scheduler.adapter.fetch_submission_page = fetch
    assert await scheduler.sync_judge_account(str(account.id))
    checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account.id).one()
    assert checkpoint.history_cursor_submission_id == 4
    assert checkpoint.raw_submission_count == 3
    assert checkpoint.accepted_submission_count == 0
    assert checkpoint.history_status == "in_progress"

    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert checkpoint.history_status == "complete"
    assert offsets == [1, 3, 4]


@pytest.mark.asyncio
async def test_head_scan_keeps_old_watermark_until_boundary_is_reached(db):
    account = _make_judge_account(db, _make_user(db).id)
    checkpoint = CodeforcesSyncCheckpoint(
        judge_account_id=account.id,
        history_status="complete",
        head_cursor_submission_id=50,
        head_status="in_progress",
        head_scan_offset=1,
        head_reconciled_at=datetime.now(timezone.utc) + timedelta(minutes=1),
    )
    db.add(checkpoint)
    db.commit()
    scheduler = SyncScheduler(db, redis=_LockRedis())
    seen_offsets = []

    async def fetch(handle, from_index, count=100):
        seen_offsets.append(from_index)
        if from_index == 1:
            return _raw_page([100, 90])
        return _raw_page([70, 50])

    scheduler.adapter.fetch_submission_page = fetch
    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert checkpoint.head_cursor_submission_id == 50
    assert checkpoint.head_scan_offset == 3
    assert checkpoint.head_status == "in_progress"

    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert checkpoint.head_cursor_submission_id == 100
    assert checkpoint.head_scan_offset is None
    assert checkpoint.head_status == "complete"
    assert seen_offsets == [1, 3]


@pytest.mark.asyncio
@pytest.mark.parametrize("conflict", ["ownership", "revision"])
async def test_network_response_is_discarded_after_ownership_or_revision_conflict(db, conflict):
    user = _make_user(db)
    account = _make_judge_account(db, user.id)
    scheduler = SyncScheduler(db, redis=_LockRedis())

    async def mutate_while_fetching(*args, **kwargs):
        checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account.id).one()
        if conflict == "ownership":
            account.verified_flag = False
        else:
            checkpoint.revision += 1
        db.commit()
        return _page()

    scheduler.adapter.fetch_submission_page = mutate_while_fetching
    assert await scheduler.sync_judge_account(str(account.id)) is False
    assert db.query(SolvedProblem).filter_by(judge_account_id=account.id).count() == 0


@pytest.mark.asyncio
async def test_pending_manual_generation_prioritizes_head_during_history_and_is_acknowledged(db):
    account = _make_judge_account(db, _make_user(db).id)
    checkpoint = CodeforcesSyncCheckpoint(
        judge_account_id=account.id, history_status="in_progress",
        history_cursor_submission_id=201, head_cursor_submission_id=50,
        request_generation=7, served_generation=6,
    )
    db.add(checkpoint)
    db.commit()
    scheduler = SyncScheduler(db, redis=_LockRedis())
    offsets = []

    async def fetch(handle, from_index, count=100):
        offsets.append(from_index)
        return _raw_page([100, 50])

    scheduler.adapter.fetch_submission_page = fetch
    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert offsets == [1]
    assert checkpoint.history_cursor_submission_id == 201
    assert checkpoint.served_generation == 7
    assert checkpoint.head_status == "complete"


@pytest.mark.asyncio
async def test_first_history_page_sets_head_boundary_without_completing_import(db):
    account = _make_judge_account(db, _make_user(db).id)
    scheduler = SyncScheduler(db, redis=_LockRedis())
    scheduler.adapter.fetch_submission_page = lambda *args, **kwargs: None

    async def fetch(*args, **kwargs):
        return _raw_page([900, 899])

    scheduler.adapter.fetch_submission_page = fetch
    assert await scheduler.sync_judge_account(str(account.id))
    checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account.id).one()
    assert checkpoint.head_cursor_submission_id == 900
    assert checkpoint.history_status == "in_progress"
    assert checkpoint.history_page_count == 1
    assert account.last_sync_at is None


@pytest.mark.asyncio
async def test_request_arriving_during_fetch_remains_pending_after_old_generation_ack(db):
    account = _make_judge_account(db, _make_user(db).id)
    checkpoint = CodeforcesSyncCheckpoint(
        judge_account_id=account.id, history_status="complete", head_status="complete",
        head_cursor_submission_id=50, head_reconciled_at=datetime.now(timezone.utc),
        request_generation=3, served_generation=2,
    )
    db.add(checkpoint)
    db.commit()
    scheduler = SyncScheduler(db, redis=_LockRedis())

    async def fetch(*args, **kwargs):
        live_checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account.id).one()
        live_checkpoint.request_generation = 4
        live_checkpoint.requested_at = datetime.now(timezone.utc)
        db.commit()
        return _raw_page([100, 50])

    scheduler.adapter.fetch_submission_page = fetch
    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert checkpoint.request_generation == 4
    assert checkpoint.served_generation == 3


@pytest.mark.asyncio
async def test_new_request_restarts_fresh_head_and_does_not_touch_full_cursor(db):
    account = _make_judge_account(db, _make_user(db).id)
    checkpoint = CodeforcesSyncCheckpoint(
        judge_account_id=account.id, history_status="complete", head_status="complete",
        head_cursor_submission_id=50, head_reconciled_at=datetime.now(timezone.utc) + timedelta(days=1),
        full_scan_offset=7, full_scan_max_submission_id=300,
        full_reconciled_at=datetime.now(timezone.utc) + timedelta(days=1),
        request_generation=1, served_generation=0,
    )
    db.add(checkpoint)
    db.commit()
    scheduler = SyncScheduler(db, redis=_LockRedis())
    offsets = []

    async def fetch(handle, from_index, count=100):
        offsets.append(from_index)
        if len(offsets) == 1:
            return _raw_page([100, 90])
        return _raw_page([100, 50])

    scheduler.adapter.fetch_submission_page = fetch
    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert checkpoint.head_scan_offset == 3
    assert checkpoint.served_generation == 0
    assert checkpoint.full_scan_offset == 7

    checkpoint.request_generation = 2
    checkpoint.requested_at = datetime.now(timezone.utc)
    db.commit()
    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert offsets == [1, 1]
    assert checkpoint.served_generation == 2
    assert checkpoint.full_scan_offset == 7


@pytest.mark.asyncio
async def test_periodic_reconciliation_traverses_past_previous_head_watermark(db, monkeypatch):
    from datetime import timedelta
    from app.core.config import settings

    account = _make_judge_account(db, _make_user(db).id)
    checkpoint = CodeforcesSyncCheckpoint(
        judge_account_id=account.id, history_status="complete", head_status="complete",
        head_cursor_submission_id=50, head_reconciled_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(checkpoint)
    db.commit()
    monkeypatch.setattr(settings, "SYNC_POLL_INTERVAL_MINUTES", 1)
    scheduler = SyncScheduler(db, redis=_LockRedis())
    offsets = []

    async def fetch(handle, from_index, count=100):
        offsets.append(from_index)
        return {1: _raw_page([100, 90]), 3: _raw_page([80, 70]), 5: _raw_page([])}[from_index]

    scheduler.adapter.fetch_submission_page = fetch
    for _ in range(3):
        assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert offsets == [1, 3, 5]
    assert checkpoint.head_cursor_submission_id == 100
    assert checkpoint.head_status == "complete"
    assert checkpoint.full_reconciled_at > datetime.now(timezone.utc) - timedelta(minutes=1)


@pytest.mark.asyncio
async def test_active_attack_prioritizes_head_then_allows_history_page(db):
    from datetime import timedelta
    from app.modules.m4_attacks.models import Attack, AttackStatus

    user = _make_user(db)
    account = _make_judge_account(db, user.id)
    checkpoint = CodeforcesSyncCheckpoint(
        judge_account_id=account.id, history_status="in_progress",
        history_cursor_submission_id=201, head_cursor_submission_id=50,
    )
    db.add(checkpoint)
    db.add(Attack(
        attacker_user_id=user.id, target_user_id=_make_user(db).id,
        status=AttackStatus.in_progress,
        started_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        window_expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
    ))
    db.commit()
    scheduler = SyncScheduler(db, redis=_LockRedis())
    offsets = []

    async def fetch(handle, from_index, count=100):
        offsets.append(from_index)
        return _raw_page([100, 50]) if from_index == 1 else _raw_page([20, 10])

    scheduler.adapter.fetch_submission_page = fetch
    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert checkpoint.head_status == "complete"
    assert checkpoint.history_cursor_submission_id == 201
    assert await scheduler.sync_judge_account(str(account.id))
    db.refresh(checkpoint)
    assert offsets == [1, 201]
    assert checkpoint.history_cursor_submission_id == 203


@pytest.mark.asyncio
async def test_late_accepted_verdict_is_imported_and_later_nonaccepted_reconcile_does_not_claw_back(db):
    account = _make_judge_account(db, _make_user(db).id)
    scheduler = SyncScheduler(db, redis=_LockRedis())
    accepted_solve = NormalizedSolve(
        problem_ext_id="1234-A", topic_tags=["dp"], rating=1800,
        solved_at=datetime.now(timezone.utc), submission_id=100,
    )

    async def fetch(handle, from_index, count=100):
        checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account.id).one()
        if checkpoint.history_status != "complete":
            if from_index == 1:
                return _raw_page([100], ["WRONG_ANSWER"])
            return _raw_page([])
        if checkpoint.head_status != "complete":
            return _raw_page([100], ["OK"], [accepted_solve])
        if checkpoint.full_scan_offset is not None:
            return _raw_page([100], ["WRONG_ANSWER"]) if from_index == 1 else _raw_page([])
        return _raw_page([])

    scheduler.adapter.fetch_submission_page = fetch
    for _ in range(5):
        assert await scheduler.sync_judge_account(str(account.id))

    solve = db.query(SolvedProblem).filter_by(
        judge_account_id=account.id, problem_ext_id="1234-A",
    ).one()
    assert solve.solved_at == accepted_solve.solved_at
    checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account.id).one()
    assert checkpoint.full_reconciled_at is not None


@pytest.mark.asyncio
async def test_two_attacks_on_one_account_queue_scan_proof_and_settle_independently(db, monkeypatch):
    user = _make_user(db)
    account = _make_judge_account(db, user.id)
    targets = [_make_user(db), _make_user(db)]
    attacks = [
        Attack(
            attacker_user_id=user.id,
            target_user_id=target.id,
            status=AttackStatus.in_progress,
            started_at=datetime.now(timezone.utc) - timedelta(hours=1),
            window_expires_at=datetime.now(timezone.utc) + timedelta(hours=23),
        )
        for target in targets
    ]
    db.add_all(attacks)
    db.commit()

    service = AttackService(db)
    for attack in attacks:
        assert service.resolve_attack(str(attack.id), actor_user_id=str(user.id)).status == AttackStatus.in_progress
    db.refresh(attacks[0])
    db.refresh(attacks[1])
    assert attacks[0].resolution_state == "pending_scan"
    assert attacks[1].resolution_state == "queued"
    assert attacks[0].resolution_generation != attacks[1].resolution_generation
    checkpoint = db.query(CodeforcesSyncCheckpoint).filter_by(judge_account_id=account.id).one()
    assert checkpoint.finalization_attack_id == attacks[0].id

    async def eof(*args, **kwargs):
        return _raw_page([])

    monkeypatch.setattr(
        "app.modules.m2_platform_sync.judge_adapters.codeforces.CodeforcesAdapter.fetch_submission_page",
        eof,
    )
    monkeypatch.setattr("app.core.redis.get_async_redis", lambda: _LockRedis())
    from worker import main as worker_main

    # First scan completes the active assignment. Make the checkpoint and
    # account otherwise fully current so the queued attack itself must make
    # the real worker due selector return this account again.
    assert await worker_main.job_sync_due_accounts(db) == {
        "due": 1, "succeeded": 1, "failed": 0, "busy": 0,
    }
    db.refresh(checkpoint)
    account.last_sync_at = datetime.now(timezone.utc)
    checkpoint.history_status = "complete"
    checkpoint.head_status = "complete"
    checkpoint.full_reconciled_at = datetime.now(timezone.utc) + timedelta(days=1)
    checkpoint.head_reconciled_at = datetime.now(timezone.utc)
    db.commit()

    assert await worker_main.job_sync_due_accounts(db) == {
        "due": 1, "succeeded": 1, "failed": 0, "busy": 0,
    }
    for expected in attacks:
        db.refresh(expected)
        assert expected.resolution_proof_at is not None
        assert expected.resolution_proof_generation == expected.resolution_generation
        assert service.resolve_attack(str(expected.id), actor_user_id=str(user.id)).status == AttackStatus.resolved

    assert db.query(Attack).filter(
        Attack.id.in_([attack.id for attack in attacks]),
        Attack.status == AttackStatus.resolved,
    ).count() == 2
