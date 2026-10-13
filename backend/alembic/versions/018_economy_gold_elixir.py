"""Add gold and elixir rewards derived from existing coin rewards.

Revision ID: 018_economy_gold_elixir
Revises: 017_attack_proof_repair
"""
from alembic import op
import sqlalchemy as sa


revision = "018_economy_gold_elixir"
down_revision = "017_attack_proof_repair"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "economy_wallets",
        sa.Column("gold", sa.BigInteger(), nullable=False, server_default="0"),
    )
    op.add_column(
        "economy_wallets",
        sa.Column("elixir", sa.BigInteger(), nullable=False, server_default="0"),
    )
    op.create_check_constraint("ck_economy_wallet_gold_nonnegative", "economy_wallets", "gold >= 0")
    op.create_check_constraint("ck_economy_wallet_elixir_nonnegative", "economy_wallets", "elixir >= 0")

    op.add_column(
        "economy_ledger",
        sa.Column("gold_delta", sa.BigInteger(), nullable=False, server_default="0"),
    )
    op.add_column(
        "economy_ledger",
        sa.Column("elixir_delta", sa.BigInteger(), nullable=False, server_default="0"),
    )
    op.execute(sa.text("UPDATE economy_ledger SET gold_delta = 20 * coin_delta, elixir_delta = 20 * coin_delta"))
    op.execute(sa.text("""
        UPDATE economy_wallets AS wallet
        SET gold = totals.gold, elixir = totals.elixir
        FROM (
            SELECT user_id, SUM(gold_delta) AS gold, SUM(elixir_delta) AS elixir
            FROM economy_ledger
            GROUP BY user_id
        ) AS totals
        WHERE wallet.user_id = totals.user_id
    """))
    op.create_check_constraint("ck_economy_ledger_gold_nonnegative", "economy_ledger", "gold_delta >= 0")
    op.create_check_constraint("ck_economy_ledger_elixir_nonnegative", "economy_ledger", "elixir_delta >= 0")


def downgrade() -> None:
    op.drop_constraint("ck_economy_ledger_elixir_nonnegative", "economy_ledger", type_="check")
    op.drop_constraint("ck_economy_ledger_gold_nonnegative", "economy_ledger", type_="check")
    op.drop_column("economy_ledger", "elixir_delta")
    op.drop_column("economy_ledger", "gold_delta")
    op.drop_constraint("ck_economy_wallet_elixir_nonnegative", "economy_wallets", type_="check")
    op.drop_constraint("ck_economy_wallet_gold_nonnegative", "economy_wallets", type_="check")
    op.drop_column("economy_wallets", "elixir")
    op.drop_column("economy_wallets", "gold")
