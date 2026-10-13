"""Add durable Codeforces sync cursors.

Revision ID: 010_cf_sync_checkpoint
Revises: 009_verified_judge_identity_ci
"""
from alembic import op
import sqlalchemy as sa


revision = "010_cf_sync_checkpoint"
down_revision = "009_verified_judge_identity_ci"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cf_sync_checkpoints",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("judge_account_id", sa.Uuid(), nullable=False),
        sa.Column("head_cursor_submission_id", sa.Integer(), nullable=True),
        sa.Column("history_cursor_submission_id", sa.Integer(), nullable=True),
        sa.Column("head_status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("history_status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("raw_submission_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("accepted_submission_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("revision", sa.Integer(), server_default="0", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "head_cursor_submission_id IS NULL OR head_cursor_submission_id >= 0",
            name="ck_cf_checkpoint_head_cursor",
        ),
        sa.CheckConstraint(
            "history_cursor_submission_id IS NULL OR history_cursor_submission_id >= 0",
            name="ck_cf_checkpoint_history_cursor",
        ),
        sa.CheckConstraint("head_status IN ('pending', 'in_progress', 'complete', 'failed')", name="ck_cf_checkpoint_head_status"),
        sa.CheckConstraint("history_status IN ('pending', 'in_progress', 'complete', 'failed')", name="ck_cf_checkpoint_history_status"),
        sa.CheckConstraint("raw_submission_count >= 0", name="ck_cf_checkpoint_raw_count"),
        sa.CheckConstraint("accepted_submission_count >= 0", name="ck_cf_checkpoint_accepted_count"),
        sa.CheckConstraint("revision >= 0", name="ck_cf_checkpoint_revision"),
        sa.ForeignKeyConstraint(["judge_account_id"], ["judge_accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("judge_account_id", name="uq_cf_sync_checkpoints_account"),
    )
    op.create_index("ix_cf_sync_checkpoints_head_status", "cf_sync_checkpoints", ["head_status"])
    op.create_index("ix_cf_sync_checkpoints_history_status", "cf_sync_checkpoints", ["history_status"])


def downgrade() -> None:
    op.drop_index("ix_cf_sync_checkpoints_history_status", table_name="cf_sync_checkpoints")
    op.drop_index("ix_cf_sync_checkpoints_head_status", table_name="cf_sync_checkpoints")
    op.drop_table("cf_sync_checkpoints")
