"""Make verified judge identities case-insensitively unique.

Revision ID: 009_verified_judge_identity_ci
Revises: 008_economy_cosmetics_backfill
"""
from alembic import op
import sqlalchemy as sa

revision = "009_verified_judge_identity_ci"
down_revision = "008_economy_cosmetics_backfill"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Keep the audit executable in both online and offline Alembic modes.
    # Report colliding identities and row IDs; never silently pick a winner.
    op.execute(sa.text("""
        DO $$
        DECLARE collisions text;
        BEGIN
            SELECT string_agg(
                format('%s %L: handles=%s, account_ids=%s', judge_type, normalized_handle,
                       handles, account_ids), '; ' ORDER BY judge_type, normalized_handle
            ) INTO collisions
            FROM (
                SELECT judge_type, lower(handle) AS normalized_handle,
                       array_agg(handle ORDER BY id) AS handles,
                       array_agg(id::text ORDER BY id) AS account_ids
                FROM judge_accounts WHERE verified_flag IS TRUE
                GROUP BY judge_type, lower(handle) HAVING count(*) > 1
            ) AS duplicate_identities;
            IF collisions IS NOT NULL THEN
                RAISE EXCEPTION 'Cannot enforce verified judge identity uniqueness; '
                    'manual resolution required: %', collisions;
            END IF;
        END $$;
    """))

    op.drop_constraint("uq_judge_accounts_type_handle", "judge_accounts", type_="unique")
    op.create_index(
        "uq_judge_accounts_verified_type_handle_ci",
        "judge_accounts",
        ["judge_type", sa.text("lower(handle)")],
        unique=True,
        postgresql_where=sa.text("verified_flag IS TRUE"),
    )


def downgrade() -> None:
    op.drop_index("uq_judge_accounts_verified_type_handle_ci", table_name="judge_accounts")
    op.create_unique_constraint(
        "uq_judge_accounts_type_handle", "judge_accounts", ["judge_type", "handle"]
    )
