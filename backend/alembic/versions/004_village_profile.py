"""Materialized village profile for matchmaking and render state."""
from alembic import op

revision = "004_village_profile"
down_revision = "003_zone_polygons"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 001 in the seed branch already contains this table. IF NOT EXISTS keeps
    # the migration valid across installations created before that squash.
    op.execute("""
        CREATE TABLE IF NOT EXISTS village_profiles (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
            defense_rating DOUBLE PRECISION NOT NULL DEFAULT 0,
            total_solved INTEGER NOT NULL DEFAULT 0,
            average_level DOUBLE PRECISION NOT NULL DEFAULT 0,
            last_recomputed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_village_profiles_defense_rating ON village_profiles (defense_rating)")


def downgrade() -> None:
    # village_profiles is created by 001_baseline.py in this repository. This
    # revision keeps the materialized-profile contract in the assigned chain,
    # but must not remove a table owned by the baseline revision.
    pass
