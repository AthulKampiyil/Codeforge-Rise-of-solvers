"""Bounded economy wallet and solve reward ledger.

Revision ID: 007_economy_wallet_ledger
Revises: 006_attack_integrity_outbox
"""
from alembic import op
import sqlalchemy as sa

revision = "007_economy_wallet_ledger"
down_revision = "006_attack_integrity_outbox"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "economy_wallets",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("coins", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("gems", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("rewarded_solves", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("coins >= 0", name="ck_economy_wallet_coins_nonnegative"),
        sa.CheckConstraint("gems >= 0", name="ck_economy_wallet_gems_nonnegative"),
        sa.CheckConstraint("rewarded_solves >= 0", name="ck_economy_wallet_solves_nonnegative"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_table(
        "economy_ledger",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("solved_problem_id", sa.Uuid(), nullable=False),
        sa.Column("solve_ordinal", sa.Integer(), nullable=False),
        sa.Column("coin_delta", sa.BigInteger(), nullable=False),
        sa.Column("gem_delta", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("solve_ordinal > 0", name="ck_economy_ledger_ordinal_positive"),
        sa.CheckConstraint("coin_delta > 0", name="ck_economy_ledger_coins_positive"),
        sa.CheckConstraint("gem_delta >= 0", name="ck_economy_ledger_gems_nonnegative"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["solved_problem_id"], ["solved_problems.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("solved_problem_id", name="uq_economy_ledger_solved_problem"),
    )
    op.create_index("ix_economy_ledger_user_created", "economy_ledger", ["user_id", "created_at", "id"])
    op.create_index("ix_economy_ledger_user_ordinal", "economy_ledger", ["user_id", "solve_ordinal"])


def downgrade() -> None:
    op.drop_index("ix_economy_ledger_user_ordinal", table_name="economy_ledger")
    op.drop_index("ix_economy_ledger_user_created", table_name="economy_ledger")
    op.drop_table("economy_ledger")
    op.drop_table("economy_wallets")
