"""Separate manual head traversal from periodic full reconciliation."""
from alembic import op
import sqlalchemy as sa


revision = "013_cf_request_reconciliation"
down_revision = "012_cf_importer_hardening"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cf_sync_checkpoints", sa.Column("head_scan_generation", sa.Integer(), nullable=True))
    op.add_column("cf_sync_checkpoints", sa.Column("full_scan_offset", sa.Integer(), nullable=True))
    op.add_column("cf_sync_checkpoints", sa.Column("full_scan_max_submission_id", sa.Integer(), nullable=True))
    op.add_column("cf_sync_checkpoints", sa.Column("full_reconciled_at", sa.DateTime(timezone=True), nullable=True))
    op.create_check_constraint(
        "ck_cf_checkpoint_full_offset", "cf_sync_checkpoints",
        "full_scan_offset IS NULL OR full_scan_offset >= 1",
    )
    # 012 used -1 in the recent-head maximum field to mark a full scan.
    # Move any interrupted scans to their independent durable cursor.
    op.execute(sa.text("""
        UPDATE cf_sync_checkpoints
        SET full_scan_offset = head_scan_offset,
            full_scan_max_submission_id = NULL,
            head_scan_offset = NULL,
            head_scan_max_submission_id = NULL,
            head_status = CASE WHEN head_status = 'in_progress' THEN 'complete' ELSE head_status END
        WHERE head_scan_max_submission_id = -1
    """))


def downgrade() -> None:
    op.drop_constraint("ck_cf_checkpoint_full_offset", "cf_sync_checkpoints", type_="check")
    op.drop_column("cf_sync_checkpoints", "full_reconciled_at")
    op.drop_column("cf_sync_checkpoints", "full_scan_max_submission_id")
    op.drop_column("cf_sync_checkpoints", "full_scan_offset")
    op.drop_column("cf_sync_checkpoints", "head_scan_generation")
