"""Invalidate legacy EOF proofs that have no trustworthy scan start time."""
from alembic import op
import sqlalchemy as sa


revision = "017_attack_proof_repair"
down_revision = "016_seed_village_skins"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("""
        UPDATE cf_sync_checkpoints
        SET finalization_attack_id = NULL,
            finalization_not_before = NULL,
            finalization_generation = NULL,
            head_scan_offset = 1,
            head_scan_max_submission_id = NULL,
            head_scan_generation = NULL,
            head_scan_started_at = NULL,
            head_status = 'complete',
            revision = revision + 1
        WHERE finalization_attack_id IN (
            SELECT id FROM attacks
            WHERE status IN ('created', 'in_progress')
              AND resolution_proof_at IS NOT NULL
              AND resolution_proof_started_at IS NULL
        )
    """))
    op.execute(sa.text("""
        UPDATE attacks
        SET resolution_proof_at = NULL,
            resolution_proof_generation = NULL,
            resolution_proof_started_at = NULL,
            resolution_generation = NULL,
            resolution_state = CASE
                WHEN resolution_account_id IS NULL THEN 'waiting_for_account'
                ELSE 'queued'
            END
        WHERE status IN ('created', 'in_progress')
          AND resolution_proof_at IS NOT NULL
          AND resolution_proof_started_at IS NULL
    """))


def downgrade() -> None:
    # The removed proof timestamps are intentionally not reconstructed.
    pass
