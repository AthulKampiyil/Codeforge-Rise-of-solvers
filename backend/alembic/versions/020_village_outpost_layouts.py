"""Persist per-user topic outpost layouts and idempotent operations.

Revision ID: 020_village_outpost_layouts
Revises: 019_village_topic_outposts
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "020_village_outpost_layouts"
down_revision = "019_village_topic_outposts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "village_topic_outpost_layouts",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("items", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("revision >= 0", name="ck_village_outpost_layout_revision_nonnegative"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_table(
        "village_topic_outpost_layout_operations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("idempotency_key", sa.String(128), nullable=False),
        sa.Column("request_identity", sa.String(64), nullable=False),
        sa.Column("expected_revision", sa.Integer(), nullable=False),
        sa.Column("applied_revision", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "expected_revision >= 0",
            name="ck_village_outpost_layout_expected_revision_nonnegative",
        ),
        sa.CheckConstraint(
            "applied_revision > 0",
            name="ck_village_outpost_layout_applied_revision_positive",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "idempotency_key",
            name="uq_village_outpost_layout_user_idempotency",
        ),
    )
    op.create_index(
        "ix_village_outpost_layout_operations_user_created",
        "village_topic_outpost_layout_operations", ["user_id", "created_at", "id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_village_outpost_layout_operations_user_created",
        table_name="village_topic_outpost_layout_operations",
    )
    op.drop_table("village_topic_outpost_layout_operations")
    op.drop_table("village_topic_outpost_layouts")
