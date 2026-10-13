"""Attack resolution idempotency and durable realtime outbox.

Revision ID: 006_attack_integrity_outbox
Revises: 005_trophy_ledger
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "006_attack_integrity_outbox"
down_revision = "005_trophy_ledger"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "uq_trophy_ledger_source_event_user",
        "trophy_ledger",
        ["source_ref_id", "event_type", "user_id"],
        unique=True,
        postgresql_where=sa.text("source_ref_id IS NOT NULL"),
        sqlite_where=sa.text("source_ref_id IS NOT NULL"),
    )
    op.create_table(
        "notification_outbox",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("event_id", sa.String(36), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("payload", JSONB(), nullable=False),
        sa.Column("target_user_ids", JSONB(), nullable=True),
        sa.Column("broadcast", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_notification_outbox_event_id", "notification_outbox", ["event_id"], unique=True)
    op.create_index("ix_notification_outbox_created_at", "notification_outbox", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_notification_outbox_created_at", table_name="notification_outbox")
    op.drop_index("ix_notification_outbox_event_id", table_name="notification_outbox")
    op.drop_table("notification_outbox")
    op.drop_index("uq_trophy_ledger_source_event_user", table_name="trophy_ledger")
