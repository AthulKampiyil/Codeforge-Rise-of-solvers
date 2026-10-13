from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class WalletOut(BaseModel):
    coins: int
    gems: int
    gold: int
    elixir: int
    rewarded_solves: int
    builder_capacity: int


class LedgerEntryOut(BaseModel):
    id: UUID
    solved_problem_id: UUID
    solve_ordinal: int
    coin_delta: int
    gem_delta: int
    gold_delta: int
    elixir_delta: int
    created_at: datetime

    class Config:
        from_attributes = True


class LedgerPageOut(BaseModel):
    items: list[LedgerEntryOut]
    offset: int
    limit: int


class CosmeticCatalogOut(BaseModel):
    id: UUID
    sku: str
    display_name: str
    slot: str
    asset_ref: str
    coin_price: int
    gem_price: int

    class Config:
        from_attributes = True


class CosmeticInventoryItemOut(BaseModel):
    inventory_id: UUID
    purchased_at: datetime
    item: CosmeticCatalogOut


class CosmeticEquipmentOut(BaseModel):
    slot: str
    inventory_id: UUID
    catalog_item_id: UUID
    updated_at: datetime

    class Config:
        from_attributes = True


class CosmeticInventoryOut(BaseModel):
    items: list[CosmeticInventoryItemOut]
    equipped: list[CosmeticEquipmentOut]


class CosmeticPurchaseRequest(BaseModel):
    catalog_item_id: UUID
    idempotency_key: str = Field(min_length=1, max_length=128)


class CosmeticPurchaseOut(BaseModel):
    id: UUID
    catalog_item_id: UUID
    idempotency_key: str
    coin_cost: int
    gem_cost: int
    created_at: datetime

    class Config:
        from_attributes = True


class EquipCosmeticRequest(BaseModel):
    inventory_id: UUID | None


class EquipCosmeticOut(BaseModel):
    slot: str
    inventory_id: UUID
    updated_at: datetime

    class Config:
        from_attributes = True
