"""Create server-authoritative purchasable topic outposts.

Revision ID: 019_village_topic_outposts
Revises: 018_economy_gold_elixir
"""
from alembic import op
import sqlalchemy as sa


revision = "019_village_topic_outposts"
down_revision = "018_economy_gold_elixir"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "village_topic_outposts",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("tier >= 0", name="ck_village_topic_outpost_tier_nonnegative"),
        sa.CheckConstraint("tier <= 5", name="ck_village_topic_outpost_tier_max"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("user_id", "topic_id"),
    )
    op.create_table(
        "village_topic_outpost_operations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=False),
        sa.Column("idempotency_key", sa.String(128), nullable=False),
        sa.Column("expected_tier", sa.Integer(), nullable=False),
        sa.Column("gold_cost", sa.BigInteger(), nullable=False),
        sa.Column("elixir_cost", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "expected_tier >= 0 AND expected_tier < 5",
            name="ck_village_outpost_operation_expected_tier",
        ),
        sa.CheckConstraint("gold_cost >= 0", name="ck_village_outpost_operation_gold_nonnegative"),
        sa.CheckConstraint("elixir_cost >= 0", name="ck_village_outpost_operation_elixir_nonnegative"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "idempotency_key", name="uq_village_outpost_user_idempotency"),
    )
    op.create_index(
        "ix_village_outpost_operations_user_created",
        "village_topic_outpost_operations", ["user_id", "created_at", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_village_outpost_operations_user_created", table_name="village_topic_outpost_operations")
    op.drop_table("village_topic_outpost_operations")
    op.drop_table("village_topic_outposts")
