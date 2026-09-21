"""Trophy ledger auditability — add resulting_balance (SADD App. D).

Revision ID: 005_trophy_ledger
Revises: 004_village_profile
Create Date: 2026-09-15
"""
from alembic import op
import sqlalchemy as sa

revision = "005_trophy_ledger"
down_revision = "004_village_profile"   # Niranjan's migration — NOT "002_seed"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure resulting_balance column exists on trophy_ledger table for auditable balance tracking
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        op.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'trophy_ledger' AND column_name = 'resulting_balance'
                ) THEN
                    ALTER TABLE trophy_ledger ADD COLUMN resulting_balance INTEGER;
                END IF;
            END $$;
        """)
    else:
        # Fallback for SQLite / other test dialects
        try:
            op.add_column("trophy_ledger", sa.Column("resulting_balance", sa.Integer(), nullable=True))
        except Exception:
            pass


def downgrade() -> None:
    op.drop_column("trophy_ledger", "resulting_balance")
