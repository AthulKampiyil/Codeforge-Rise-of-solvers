"""Cosmetics-only economy inventory and bounded backfill checkpoint.

Revision ID: 008_economy_cosmetics_backfill
Revises: 007_economy_wallet_ledger
"""
from alembic import op
import sqlalchemy as sa

revision = "008_economy_cosmetics_backfill"
down_revision = "007_economy_wallet_ledger"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "economy_cosmetic_catalog",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("sku", sa.String(80), nullable=False),
        sa.Column("display_name", sa.String(120), nullable=False),
        sa.Column("slot", sa.String(40), nullable=False),
        sa.Column("asset_ref", sa.String(80), nullable=False),
        sa.Column("coin_price", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("gem_price", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("coin_price >= 0", name="ck_economy_cosmetic_coin_price_nonnegative"),
        sa.CheckConstraint("gem_price >= 0", name="ck_economy_cosmetic_gem_price_nonnegative"),
        sa.CheckConstraint("coin_price > 0 OR gem_price > 0", name="ck_economy_cosmetic_price_positive"),
        sa.CheckConstraint(
            "asset_ref ~ '^original:[a-z0-9][a-z0-9_-]{0,63}$'",
            name="ck_economy_cosmetic_asset_original_allowlist",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku", name="uq_economy_cosmetic_catalog_sku"),
    )
    op.create_index("ix_economy_cosmetic_available", "economy_cosmetic_catalog", ["is_available", "sku"])

    op.create_table(
        "economy_cosmetic_inventory",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("catalog_item_id", sa.Uuid(), nullable=False),
        sa.Column("purchased_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["economy_cosmetic_catalog.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "catalog_item_id", name="uq_economy_cosmetic_inventory_user_item"),
    )
    op.create_index("ix_economy_cosmetic_inventory_user", "economy_cosmetic_inventory", ["user_id", "purchased_at"])

    op.create_table(
        "economy_cosmetic_purchases",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("catalog_item_id", sa.Uuid(), nullable=False),
        sa.Column("idempotency_key", sa.String(128), nullable=False),
        sa.Column("coin_cost", sa.BigInteger(), nullable=False),
        sa.Column("gem_cost", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("coin_cost >= 0", name="ck_economy_cosmetic_purchase_coins_nonnegative"),
        sa.CheckConstraint("gem_cost >= 0", name="ck_economy_cosmetic_purchase_gems_nonnegative"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["economy_cosmetic_catalog.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "idempotency_key", name="uq_economy_cosmetic_purchase_idempotency"),
    )
    op.create_index("ix_economy_cosmetic_purchase_user_created", "economy_cosmetic_purchases", ["user_id", "created_at"])

    op.create_table(
        "economy_cosmetic_equipment",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("slot", sa.String(40), nullable=False),
        sa.Column("inventory_id", sa.Uuid(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["inventory_id"], ["economy_cosmetic_inventory.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("user_id", "slot"),
    )
    op.create_index("ix_economy_cosmetic_equipment_inventory", "economy_cosmetic_equipment", ["inventory_id"])

    op.create_table(
        "economy_backfill_state",
        sa.Column("id", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("cursor_solved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cursor_solve_id", sa.Uuid(), nullable=True),
        sa.Column("is_complete", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.CheckConstraint("id = 1", name="ck_economy_backfill_singleton"),
        sa.CheckConstraint(
            "(cursor_solved_at IS NULL) = (cursor_solve_id IS NULL)",
            name="ck_economy_backfill_cursor_pair",
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("economy_backfill_state")
    op.drop_index("ix_economy_cosmetic_equipment_inventory", table_name="economy_cosmetic_equipment")
    op.drop_table("economy_cosmetic_equipment")
    op.drop_index("ix_economy_cosmetic_purchase_user_created", table_name="economy_cosmetic_purchases")
    op.drop_table("economy_cosmetic_purchases")
    op.drop_index("ix_economy_cosmetic_inventory_user", table_name="economy_cosmetic_inventory")
    op.drop_table("economy_cosmetic_inventory")
    op.drop_index("ix_economy_cosmetic_available", table_name="economy_cosmetic_catalog")
    op.drop_table("economy_cosmetic_catalog")
