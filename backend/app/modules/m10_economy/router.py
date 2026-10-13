from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m10_economy.models import (
    CosmeticCatalogItem, CosmeticEquipment, CosmeticInventory, EconomyLedger, Wallet,
)
from app.modules.m10_economy.schemas import (
    CosmeticCatalogOut, CosmeticEquipmentOut, CosmeticInventoryItemOut,
    CosmeticInventoryOut, CosmeticPurchaseOut, CosmeticPurchaseRequest,
    EquipCosmeticOut, EquipCosmeticRequest, LedgerPageOut, WalletOut,
)
from app.modules.m10_economy.service import (
    EconomyError, EconomyService, InsufficientFunds, InventoryOwnershipError, PurchaseConflict,
)

router = APIRouter(prefix="/economy", tags=["m10_economy"])


def _builder_capacity(rewarded_solves: int) -> int:
    if rewarded_solves < 25:
        return 2
    if rewarded_solves < 100:
        return 3
    if rewarded_solves < 250:
        return 4
    return 5


@router.get("/wallet", response_model=WalletOut)
def get_wallet(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if wallet is None:
        return WalletOut(coins=0, gems=0, gold=0, elixir=0, rewarded_solves=0, builder_capacity=2)
    return WalletOut(
        coins=wallet.coins, gems=wallet.gems, gold=wallet.gold, elixir=wallet.elixir,
        rewarded_solves=wallet.rewarded_solves,
        builder_capacity=_builder_capacity(wallet.rewarded_solves),
    )


@router.get("/ledger", response_model=LedgerPageOut)
def get_ledger(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    entries = (
        db.query(EconomyLedger)
        .filter(EconomyLedger.user_id == current_user.id)
        .order_by(EconomyLedger.created_at.desc(), EconomyLedger.id.desc())
        .offset(offset).limit(limit).all()
    )
    return LedgerPageOut(items=entries, offset=offset, limit=limit)


@router.get("/catalog", response_model=list[CosmeticCatalogOut])
def get_cosmetic_catalog(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    # Catalog starts empty; only explicitly populated allowlisted original assets appear.
    return db.query(CosmeticCatalogItem).filter(
        CosmeticCatalogItem.is_available.is_(True),
    ).order_by(CosmeticCatalogItem.sku).limit(200).all()


@router.get("/inventory", response_model=CosmeticInventoryOut)
def get_cosmetic_inventory(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    owned = (
        db.query(CosmeticInventory, CosmeticCatalogItem)
        .join(CosmeticCatalogItem, CosmeticCatalogItem.id == CosmeticInventory.catalog_item_id)
        .filter(CosmeticInventory.user_id == current_user.id)
        .order_by(CosmeticInventory.purchased_at.desc(), CosmeticInventory.id.desc())
        .limit(500).all()
    )
    equipped = (
        db.query(CosmeticEquipment, CosmeticInventory.catalog_item_id)
        .join(CosmeticInventory, CosmeticInventory.id == CosmeticEquipment.inventory_id)
        .filter(CosmeticEquipment.user_id == current_user.id)
        .order_by(CosmeticEquipment.slot).all()
    )
    return CosmeticInventoryOut(
        items=[CosmeticInventoryItemOut(
            inventory_id=inventory.id,
            purchased_at=inventory.purchased_at,
            item=CosmeticCatalogOut.model_validate(item),
        ) for inventory, item in owned],
        equipped=[CosmeticEquipmentOut(
            slot=equipment.slot,
            inventory_id=equipment.inventory_id,
            catalog_item_id=catalog_item_id,
            updated_at=equipment.updated_at,
        ) for equipment, catalog_item_id in equipped],
    )


@router.post("/purchases", response_model=CosmeticPurchaseOut, status_code=201)
def purchase_cosmetic(
    payload: CosmeticPurchaseRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return EconomyService(db).purchase_cosmetic(
            user_id=current_user.id,
            catalog_item_id=payload.catalog_item_id,
            idempotency_key=payload.idempotency_key,
        )
    except InsufficientFunds as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PurchaseConflict as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except EconomyError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.put("/equipment/{slot}", response_model=EquipCosmeticOut | None)
def equip_cosmetic(
    slot: str,
    payload: EquipCosmeticRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        equipment = EconomyService(db).equip_cosmetic(
            user_id=current_user.id, slot=slot, inventory_id=payload.inventory_id,
        )
        return EquipCosmeticOut.model_validate(equipment) if equipment else None
    except InventoryOwnershipError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
