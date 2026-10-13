"""Wallet projection and append-only solve reward ledger."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, Column, DateTime, ForeignKey,
    Index, Integer, String, UniqueConstraint,
)

from app.db.base_class import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Wallet(Base):
    __tablename__ = "economy_wallets"

    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    coins = Column(BigInteger, nullable=False, default=0)
    gems = Column(BigInteger, nullable=False, default=0)
    gold = Column(BigInteger, nullable=False, default=0)
    elixir = Column(BigInteger, nullable=False, default=0)
    rewarded_solves = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        CheckConstraint("coins >= 0", name="ck_economy_wallet_coins_nonnegative"),
        CheckConstraint("gems >= 0", name="ck_economy_wallet_gems_nonnegative"),
        CheckConstraint("gold >= 0", name="ck_economy_wallet_gold_nonnegative"),
        CheckConstraint("elixir >= 0", name="ck_economy_wallet_elixir_nonnegative"),
        CheckConstraint("rewarded_solves >= 0", name="ck_economy_wallet_solves_nonnegative"),
    )


class EconomyLedger(Base):
    __tablename__ = "economy_ledger"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    solved_problem_id = Column(GUID(), ForeignKey("solved_problems.id", ondelete="RESTRICT"), nullable=False)
    solve_ordinal = Column(Integer, nullable=False)
    coin_delta = Column(BigInteger, nullable=False)
    gem_delta = Column(BigInteger, nullable=False)
    gold_delta = Column(BigInteger, nullable=False)
    elixir_delta = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        CheckConstraint("solve_ordinal > 0", name="ck_economy_ledger_ordinal_positive"),
        CheckConstraint("coin_delta > 0", name="ck_economy_ledger_coins_positive"),
        CheckConstraint("gem_delta >= 0", name="ck_economy_ledger_gems_nonnegative"),
        CheckConstraint("gold_delta >= 0", name="ck_economy_ledger_gold_nonnegative"),
        CheckConstraint("elixir_delta >= 0", name="ck_economy_ledger_elixir_nonnegative"),
        UniqueConstraint("solved_problem_id", name="uq_economy_ledger_solved_problem"),
        Index("ix_economy_ledger_user_created", "user_id", "created_at", "id"),
        Index("ix_economy_ledger_user_ordinal", "user_id", "solve_ordinal"),
    )


class CosmeticCatalogItem(Base):
    """A purchasable cosmetic; asset refs are restricted to original assets."""
    __tablename__ = "economy_cosmetic_catalog"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    sku = Column(String(80), nullable=False)
    display_name = Column(String(120), nullable=False)
    slot = Column(String(40), nullable=False)
    asset_ref = Column(String(80), nullable=False)
    coin_price = Column(BigInteger, nullable=False, default=0)
    gem_price = Column(BigInteger, nullable=False, default=0)
    is_available = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        UniqueConstraint("sku", name="uq_economy_cosmetic_catalog_sku"),
        CheckConstraint("coin_price >= 0", name="ck_economy_cosmetic_coin_price_nonnegative"),
        CheckConstraint("gem_price >= 0", name="ck_economy_cosmetic_gem_price_nonnegative"),
        CheckConstraint("coin_price > 0 OR gem_price > 0", name="ck_economy_cosmetic_price_positive"),
        CheckConstraint(
            "asset_ref ~ '^original:[a-z0-9][a-z0-9_-]{0,63}$'",
            name="ck_economy_cosmetic_asset_original_allowlist",
        ),
        Index("ix_economy_cosmetic_available", "is_available", "sku"),
    )


class CosmeticInventory(Base):
    __tablename__ = "economy_cosmetic_inventory"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    catalog_item_id = Column(
        GUID(), ForeignKey("economy_cosmetic_catalog.id", ondelete="RESTRICT"), nullable=False,
    )
    purchased_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "catalog_item_id", name="uq_economy_cosmetic_inventory_user_item"),
        Index("ix_economy_cosmetic_inventory_user", "user_id", "purchased_at"),
    )


class CosmeticPurchase(Base):
    __tablename__ = "economy_cosmetic_purchases"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    catalog_item_id = Column(
        GUID(), ForeignKey("economy_cosmetic_catalog.id", ondelete="RESTRICT"), nullable=False,
    )
    idempotency_key = Column(String(128), nullable=False)
    coin_cost = Column(BigInteger, nullable=False)
    gem_cost = Column(BigInteger, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "idempotency_key", name="uq_economy_cosmetic_purchase_idempotency"),
        CheckConstraint("coin_cost >= 0", name="ck_economy_cosmetic_purchase_coins_nonnegative"),
        CheckConstraint("gem_cost >= 0", name="ck_economy_cosmetic_purchase_gems_nonnegative"),
        Index("ix_economy_cosmetic_purchase_user_created", "user_id", "created_at"),
    )


class CosmeticEquipment(Base):
    __tablename__ = "economy_cosmetic_equipment"

    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    slot = Column(String(40), primary_key=True)
    inventory_id = Column(
        GUID(), ForeignKey("economy_cosmetic_inventory.id", ondelete="RESTRICT"), nullable=False,
    )
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    __table_args__ = (Index("ix_economy_cosmetic_equipment_inventory", "inventory_id"),)


class EconomyBackfillState(Base):
    """Durable checkpoint for one bounded historical reward backfill pass."""
    __tablename__ = "economy_backfill_state"

    id = Column(Integer, primary_key=True, default=1)
    cursor_solved_at = Column(DateTime(timezone=True), nullable=True)
    cursor_solve_id = Column(GUID(), nullable=True)
    is_complete = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint("id = 1", name="ck_economy_backfill_singleton"),
        CheckConstraint(
            "(cursor_solved_at IS NULL) = (cursor_solve_id IS NULL)",
            name="ck_economy_backfill_cursor_pair",
        ),
    )
