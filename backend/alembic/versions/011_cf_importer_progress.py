"""Persist head traversal and request cooldown independently of page updates."""
from alembic import op
import sqlalchemy as sa


revision = "011_cf_importer_progress"
down_revision = "010_cf_sync_checkpoint"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cf_sync_checkpoints", sa.Column("head_scan_offset", sa.Integer(), nullable=True))
    op.add_column("cf_sync_checkpoints", sa.Column("head_scan_max_submission_id", sa.Integer(), nullable=True))
    op.add_column("cf_sync_checkpoints", sa.Column("requested_at", sa.DateTime(timezone=True), nullable=True))
    op.create_check_constraint(
        "ck_cf_checkpoint_head_offset", "cf_sync_checkpoints",
        "head_scan_offset IS NULL OR head_scan_offset >= 1",
    )


def downgrade() -> None:
    op.drop_constraint("ck_cf_checkpoint_head_offset", "cf_sync_checkpoints", type_="check")
    op.drop_column("cf_sync_checkpoints", "requested_at")
    op.drop_column("cf_sync_checkpoints", "head_scan_max_submission_id")
    op.drop_column("cf_sync_checkpoints", "head_scan_offset")
