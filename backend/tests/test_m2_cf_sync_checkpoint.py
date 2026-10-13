"""Schema contract for durable Codeforces importer progress."""
from app.modules.m2_platform_sync.models import CodeforcesSyncCheckpoint


def test_checkpoint_is_unique_per_judge_account_and_cascades_on_delete():
    table = CodeforcesSyncCheckpoint.__table__
    assert {constraint.name for constraint in table.constraints} >= {
        "uq_cf_sync_checkpoints_account",
        "ck_cf_checkpoint_head_status",
        "ck_cf_checkpoint_history_status",
        "ck_cf_checkpoint_revision",
    }
    account_fk = next(iter(table.c.judge_account_id.foreign_keys))
    assert account_fk.target_fullname == "judge_accounts.id"
    assert account_fk.ondelete == "CASCADE"


def test_checkpoint_tracks_independent_head_and_history_cursor_status():
    columns = CodeforcesSyncCheckpoint.__table__.c
    assert "head_cursor_submission_id" in columns
    assert "history_cursor_submission_id" in columns
    assert "head_status" in columns
    assert "history_status" in columns
    assert "raw_submission_count" in columns
    assert "accepted_submission_count" in columns
    assert "revision" in columns
