"""Persist attack finalization requests and qualifying head-scan proofs."""
from alembic import op
import sqlalchemy as sa


revision = "014_attack_finalization"
down_revision = "013_cf_request_reconciliation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("attacks", sa.Column("resolution_requested_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("attacks", sa.Column("resolution_not_before", sa.DateTime(timezone=True), nullable=True))
    op.add_column("attacks", sa.Column("resolution_state", sa.String(24), nullable=True))
    op.add_column("attacks", sa.Column("resolution_account_id", sa.Uuid(), nullable=True))
    op.add_column("attacks", sa.Column("resolution_generation", sa.Integer(), nullable=True))
    op.add_column("attacks", sa.Column("resolution_proof_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("attacks", sa.Column("resolution_proof_generation", sa.Integer(), nullable=True))
    op.add_column("attacks", sa.Column("resolution_abandoned", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.create_foreign_key("fk_attacks_resolution_account", "attacks", "judge_accounts", ["resolution_account_id"], ["id"], ondelete="SET NULL")
    op.add_column("cf_sync_checkpoints", sa.Column("head_scan_started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("cf_sync_checkpoints", sa.Column("finalization_attack_id", sa.Uuid(), nullable=True))
    op.add_column("cf_sync_checkpoints", sa.Column("finalization_not_before", sa.DateTime(timezone=True), nullable=True))
    op.add_column("cf_sync_checkpoints", sa.Column("finalization_generation", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("cf_sync_checkpoints", "finalization_generation")
    op.drop_column("cf_sync_checkpoints", "finalization_not_before")
    op.drop_column("cf_sync_checkpoints", "finalization_attack_id")
    op.drop_column("cf_sync_checkpoints", "head_scan_started_at")
    op.drop_constraint("fk_attacks_resolution_account", "attacks", type_="foreignkey")
    for column in ("resolution_abandoned", "resolution_proof_generation", "resolution_proof_at", "resolution_generation", "resolution_account_id", "resolution_state", "resolution_not_before", "resolution_requested_at"):
        op.drop_column("attacks", column)
