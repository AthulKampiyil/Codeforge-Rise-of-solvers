"""Harden importer request acknowledgement and page accounting."""
from alembic import op
import sqlalchemy as sa


revision = "012_cf_importer_hardening"
down_revision = "011_cf_importer_progress"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cf_sync_checkpoints", sa.Column(
        "history_page_count", sa.Integer(), server_default="0", nullable=False,
    ))
    op.add_column("cf_sync_checkpoints", sa.Column(
        "request_generation", sa.Integer(), server_default="0", nullable=False,
    ))
    op.add_column("cf_sync_checkpoints", sa.Column(
        "served_generation", sa.Integer(), server_default="0", nullable=False,
    ))
    op.add_column("cf_sync_checkpoints", sa.Column(
        "head_reconciled_at", sa.DateTime(timezone=True), nullable=True,
    ))
    op.create_check_constraint(
        "ck_cf_checkpoint_history_pages", "cf_sync_checkpoints", "history_page_count >= 0",
    )
    op.create_check_constraint(
        "ck_cf_checkpoint_request_generation", "cf_sync_checkpoints", "request_generation >= 0",
    )
    op.create_check_constraint(
        "ck_cf_checkpoint_served_generation", "cf_sync_checkpoints", "served_generation >= 0",
    )


def downgrade() -> None:
    op.drop_constraint("ck_cf_checkpoint_served_generation", "cf_sync_checkpoints", type_="check")
    op.drop_constraint("ck_cf_checkpoint_request_generation", "cf_sync_checkpoints", type_="check")
    op.drop_constraint("ck_cf_checkpoint_history_pages", "cf_sync_checkpoints", type_="check")
    op.drop_column("cf_sync_checkpoints", "head_reconciled_at")
    op.drop_column("cf_sync_checkpoints", "served_generation")
    op.drop_column("cf_sync_checkpoints", "request_generation")
    op.drop_column("cf_sync_checkpoints", "history_page_count")
