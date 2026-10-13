"""Strengthen finalization proof timestamps and checkpoint references."""
from alembic import op
import sqlalchemy as sa


revision = "015_attack_finalize"
down_revision = "014_attack_finalization"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "attacks",
        sa.Column("resolution_proof_started_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_cf_sync_checkpoints_finalization_attack",
        "cf_sync_checkpoints", "attacks", ["finalization_attack_id"], ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_cf_sync_checkpoints_finalization_attack",
        "cf_sync_checkpoints", type_="foreignkey",
    )
    op.drop_column("attacks", "resolution_proof_started_at")
