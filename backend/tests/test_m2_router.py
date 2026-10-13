def test_suspended_user_cannot_request_manual_sync(client, make_user, db):
    from app.modules.m1_auth.models import User

    user, headers, _ = make_user()
    db.query(User).filter(User.id == user["id"]).update(
        {User.is_suspended: True}, synchronize_session=False,
    )
    db.commit()

    response = client.post("/platform_sync/sync", headers=headers)

    assert response.status_code == 403
    assert response.json()["code"] == "account_suspended"


def test_sync_status_exposes_pending_request_head_history_and_full_reconciliation(db):
    from app.modules.m1_auth.models import JudgeAccount, JudgeType
    from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint
    from test_m2_platform_sync import _make_judge_account, _make_user

    user = _make_user(db)
    account = _make_judge_account(db, user.id, judge_type=JudgeType.codeforces)
    db.add(CodeforcesSyncCheckpoint(
        judge_account_id=account.id,
        history_status="in_progress",
        head_status="in_progress",
        request_generation=4,
        served_generation=3,
        full_scan_offset=101,
    ))
    db.commit()

    from app.modules.m2_platform_sync.router import get_sync_status
    status = get_sync_status(user, db)[0]
    assert status["status"] == "in_progress"
    assert status["request_state"] == "pending"
    assert status["request_generation"] == 4
    assert status["served_generation"] == 3
    assert status["head_state"] == "in_progress"
    assert status["history_state"] == "in_progress"
    assert status["full_reconciliation_state"] == "in_progress"


def test_failed_sync_stays_failed_while_reconciliation_is_pending(db):
    from datetime import datetime, timedelta, timezone

    from app.modules.m1_auth.models import JudgeType
    from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint, SyncLog, SyncStatus
    from test_m2_platform_sync import _make_judge_account, _make_user

    user = _make_user(db)
    account = _make_judge_account(db, user.id, judge_type=JudgeType.codeforces)
    db.add(CodeforcesSyncCheckpoint(
        judge_account_id=account.id,
        history_status="failed",
        head_status="failed",
        full_reconciled_at=datetime.now(timezone.utc) - timedelta(days=1),
    ))
    db.add(SyncLog(
        user_id=user.id,
        judge_account_id=account.id,
        judge_name=account.judge_type.value,
        status=SyncStatus.failed,
        last_error="Codeforces unavailable",
    ))
    db.commit()

    from app.modules.m2_platform_sync.router import get_sync_status
    status = get_sync_status(user, db)[0]
    assert status["status"] == "failed"
    assert status["last_error"] == "Codeforces unavailable"
    assert status["full_reconciliation_state"] == "pending"


def test_up_to_date_status_is_not_masked_by_due_reconciliation(db):
    from datetime import datetime, timedelta, timezone

    from app.modules.m1_auth.models import JudgeType
    from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint, SyncLog, SyncStatus
    from test_m2_platform_sync import _make_judge_account, _make_user

    user = _make_user(db)
    account = _make_judge_account(db, user.id, judge_type=JudgeType.codeforces)
    db.add(CodeforcesSyncCheckpoint(
        judge_account_id=account.id,
        history_status="complete",
        head_status="complete",
        full_reconciled_at=datetime.now(timezone.utc) - timedelta(days=1),
    ))
    db.add(SyncLog(
        user_id=user.id,
        judge_account_id=account.id,
        judge_name=account.judge_type.value,
        status=SyncStatus.up_to_date,
    ))
    db.commit()

    from app.modules.m2_platform_sync.router import get_sync_status
    status = get_sync_status(user, db)[0]
    assert status["status"] == "up_to_date"
    assert status["full_reconciliation_state"] == "pending"


def test_unsupported_judge_is_not_reported_as_up_to_date(db):
    from app.modules.m1_auth.models import JudgeType
    from app.modules.m2_platform_sync.models import SyncLog, SyncStatus
    from test_m2_platform_sync import _make_judge_account, _make_user

    user = _make_user(db)
    account = _make_judge_account(db, user.id, judge_type=JudgeType.leetcode)
    db.add(SyncLog(
        user_id=user.id,
        judge_account_id=account.id,
        judge_name=account.judge_type.value,
        status=SyncStatus.up_to_date,
    ))
    db.commit()

    from app.modules.m2_platform_sync.router import get_sync_status
    status = get_sync_status(user, db)[0]
    assert status["status"] == "failed"
