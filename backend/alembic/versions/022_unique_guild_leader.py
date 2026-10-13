"""Ensure each guild has at most one leader.

Revision ID: 022_unique_guild_leader
Revises: 021_durable_auth_sessions
"""
from alembic import op
import sqlalchemy as sa


revision = "022_unique_guild_leader"
down_revision = "021_durable_auth_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    duplicates = bind.execute(sa.text("""
        SELECT guild_id, array_agg(user_id ORDER BY user_id) AS leader_ids
        FROM guild_memberships
        WHERE role = 'leader'
        GROUP BY guild_id
        HAVING count(*) > 1
        ORDER BY guild_id
    """)).fetchall()
    if duplicates:
        examples = "; ".join(
            f"guild {guild_id}: leaders {', '.join(str(user_id) for user_id in leader_ids)}"
            for guild_id, leader_ids in duplicates[:10]
        )
        raise RuntimeError(
            "Cannot enforce one leader per guild while duplicate leaders exist. "
            f"Resolve these memberships explicitly, then retry migration 022: {examples}"
        )

    # Membership operations additionally serialize on the guild row; this
    # database-level constraint protects against duplicate leaders from any
    # writer, including future code paths.
    op.create_index(
        "uq_guild_memberships_one_leader_per_guild",
        "guild_memberships",
        ["guild_id"],
        unique=True,
        postgresql_where=sa.text("role = 'leader'"),
    )


def downgrade() -> None:
    op.drop_index("uq_guild_memberships_one_leader_per_guild", table_name="guild_memberships")
