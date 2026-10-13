"""Worker dispatch contracts for bounded, fair importer scheduling."""
from types import SimpleNamespace

import pytest


@pytest.mark.asyncio
async def test_due_dispatch_continues_after_busy_account(monkeypatch):
    from worker import main as worker_main
    from app.modules.m2_platform_sync.sync_scheduler import SyncBusy

    accounts = [SimpleNamespace(id="a"), SimpleNamespace(id="b"), SimpleNamespace(id="c")]
    monkeypatch.setattr(
        "app.modules.m2_platform_sync.service.PlatformSyncService.get_due_sync_accounts",
        lambda self, db, limit: accounts,
    )
    attempted = []

    class Scheduler:
        def __init__(self, db):
            pass

        async def sync_judge_account(self, account_id):
            attempted.append(account_id)
            if account_id == "a":
                raise SyncBusy(5)
            return account_id == "b"

    monkeypatch.setattr("app.modules.m2_platform_sync.sync_scheduler.SyncScheduler", Scheduler)
    result = await worker_main.job_sync_due_accounts(object())
    assert attempted == ["a", "b", "c"]
    assert result == {"due": 3, "succeeded": 1, "failed": 1, "busy": 1}


@pytest.mark.asyncio
async def test_real_due_selector_includes_queued_finalization_and_keeps_dlq_backoff(db, monkeypatch):
    from datetime import datetime, timedelta, timezone
    from test_m2_platform_sync import _make_judge_account, _make_user
    from app.modules.m1_auth.models import JudgeAccount
    from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint, SyncDeadLetter, DlqFailureReason
    from app.modules.m4_attacks.models import Attack, AttackStatus
    from app.modules.m2_platform_sync.service import PlatformSyncService

    now = datetime.now(timezone.utc)
    queued_account = _make_judge_account(db, _make_user(db).id, last_sync_at=now)
    backed_off_account = _make_judge_account(db, _make_user(db).id, last_sync_at=now)
    for account in (queued_account, backed_off_account):
        db.add(CodeforcesSyncCheckpoint(
            judge_account_id=account.id,
            history_status="complete",
            head_status="complete",
            full_reconciled_at=now + timedelta(days=1),
            head_reconciled_at=now + timedelta(days=1),
            request_generation=0,
            served_generation=0,
        ))
    db.flush()
    target = _make_user(db)
    db.add(Attack(
        attacker_user_id=queued_account.user_id,
        target_user_id=target.id,
        status=AttackStatus.in_progress,
        started_at=now - timedelta(hours=1),
        window_expires_at=now + timedelta(hours=1),
        resolution_account_id=queued_account.id,
        resolution_requested_at=now,
        resolution_not_before=now,
        resolution_state="queued",
    ))
    db.add(SyncDeadLetter(
        judge_account_id=backed_off_account.id,
        failure_reason=DlqFailureReason.unknown,
        attempt_count=1,
        last_attempted_at=now,
        next_retry_at=now + timedelta(hours=1),
    ))
    db.commit()

    # Assert the actual service query, then let the real worker dispatch that
    # selection through a stub scheduler to avoid a network fetch.
    selected = PlatformSyncService().get_due_sync_accounts(db)
    assert [account.id for account in selected] == [queued_account.id]
    attempted = []

    class Scheduler:
        def __init__(self, session):
            pass

        async def sync_judge_account(self, account_id):
            attempted.append(account_id)
            return True

    monkeypatch.setattr("app.modules.m2_platform_sync.sync_scheduler.SyncScheduler", Scheduler)
    from worker import main as worker_main
    result = await worker_main.job_sync_due_accounts(db)
    assert attempted == [str(queued_account.id)]
    assert result == {"due": 1, "succeeded": 1, "failed": 0, "busy": 0}


@pytest.mark.asyncio
async def test_pending_requests_are_read_from_database_not_redis(monkeypatch):
    from worker import main as worker_main
    from app.modules.m2_platform_sync.sync_scheduler import SyncBusy

    monkeypatch.setattr(
        "app.modules.m2_platform_sync.service.PlatformSyncService.get_pending_sync_account_ids",
        lambda self, db, limit: ["busy", "next"],
    )
    attempted = []

    class Scheduler:
        def __init__(self, db):
            pass

        async def sync_judge_account(self, account_id):
            attempted.append(account_id)
            if account_id == "busy":
                raise SyncBusy(5)
            return True

    monkeypatch.setattr("app.modules.m2_platform_sync.sync_scheduler.SyncScheduler", Scheduler)
    result = await worker_main.job_process_requested_sync(object())
    assert attempted == ["busy", "next"]
    assert result == {"queued": 2, "succeeded": 1, "failed": 0, "busy": 1}


@pytest.mark.asyncio
async def test_dlq_retry_batch_is_bounded_and_busy_does_not_abort_batch(monkeypatch):
    from worker import main as worker_main
    from app.core.config import settings
    from app.modules.m2_platform_sync.sync_scheduler import SyncBusy

    entries = [SimpleNamespace(judge_account_id=str(index)) for index in range(4)]
    limits = []

    def due_entries(self, db, limit):
        limits.append(limit)
        return entries[:limit]

    monkeypatch.setattr(
        "app.modules.m2_platform_sync.service.PlatformSyncService.get_due_dlq_retries",
        due_entries,
    )
    monkeypatch.setattr(settings, "CODEFORCES_IMPORT_ACCOUNTS_PER_TICK", 2)
    attempted = []

    class Scheduler:
        def __init__(self, db):
            pass

        async def sync_judge_account(self, account_id):
            attempted.append(account_id)
            if account_id == "0":
                raise SyncBusy(1)
            return True

    monkeypatch.setattr("app.modules.m2_platform_sync.sync_scheduler.SyncScheduler", Scheduler)
    assert await worker_main.job_retry_dlq(object()) == {
        "retried": 2, "succeeded": 1, "failed": 0, "busy": 1,
    }
    assert limits == [2]
    assert attempted == ["0", "1"]
