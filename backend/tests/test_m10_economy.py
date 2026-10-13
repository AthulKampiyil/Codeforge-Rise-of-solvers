import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from app.modules.m1_auth.models import JudgeAccount, JudgeType, User
from app.modules.m2_platform_sync.models import SolvedProblem
from app.modules.m2_platform_sync.judge_adapters.base import NormalizedSolve
from app.modules.m2_platform_sync.judge_adapters.codeforces import CodeforcesSubmissionPage, RawSubmission
from app.modules.m2_platform_sync.sync_scheduler import SyncScheduler
from app.modules.m10_economy.models import (
    CosmeticCatalogItem, CosmeticEquipment, CosmeticInventory, CosmeticPurchase,
    EconomyBackfillState, EconomyLedger, Wallet,
)
from app.modules.m10_economy.service import (
    EconomyService, InsufficientFunds, InventoryOwnershipError, PurchaseConflict,
    coins_for_rating,
)


@pytest.mark.parametrize(("rating", "expected"), [
    (None, 10), (-1, 10), (800, 10), (899, 10), (900, 15),
    (1000, 20), (3500, 145), (5000, 145),
])
def test_coins_for_rating(rating, expected):
    assert coins_for_rating(rating) == expected


def _make_user_account(db, *, verified=True):
    user = User(
        id=uuid.uuid4(), username=f"eco_{uuid.uuid4().hex[:10]}",
        email=f"{uuid.uuid4().hex}@example.com", password_hash="h",
        is_active=True, is_suspended=False,
    )
    db.add(user)
    db.flush()
    account = JudgeAccount(
        id=uuid.uuid4(), user_id=user.id, judge_type=JudgeType.codeforces,
        handle=f"h_{uuid.uuid4().hex[:8]}", verified_flag=verified,
    )
    db.add(account)
    db.flush()
    return user, account


def _solve(db, account, idx, rating=800):
    solve = SolvedProblem(
        id=uuid.uuid4(), judge_account_id=account.id, problem_ext_id=f"eco-{idx}",
        topic_tags=[], rating=rating, solved_at=datetime.now(timezone.utc),
    )
    db.add(solve)
    db.flush()
    return solve


def _cosmetic(db, *, sku="test-item", slot="head", coins=10, gems=0):
    item = CosmeticCatalogItem(
        id=uuid.uuid4(), sku=sku, display_name=sku, slot=slot,
        asset_ref=f"original:{sku}", coin_price=coins, gem_price=gems, is_available=True,
    )
    db.add(item)
    db.flush()
    return item


def test_reward_is_idempotent_and_awards_gems_at_fiftieth_solve(db):
    user, account = _make_user_account(db)
    service = EconomyService(db)
    solves = [_solve(db, account, i) for i in range(1, 51)]
    for solve in solves:
        assert service.reward_solve(user.id, solve) is True
    assert service.reward_solve(user.id, solves[-1]) is False

    wallet = db.query(Wallet).filter_by(user_id=user.id).one()
    assert (wallet.coins, wallet.gems, wallet.gold, wallet.elixir, wallet.rewarded_solves) == (
        500, 100, 10000, 10000, 50,
    )
    assert db.query(EconomyLedger).filter_by(user_id=user.id).count() == 50
    assert db.query(EconomyLedger).filter_by(solved_problem_id=solves[-1].id).one().gem_delta == 100
    assert db.query(EconomyLedger).filter_by(solved_problem_id=solves[-1].id).one().gold_delta == 200
    assert db.query(EconomyLedger).filter_by(solved_problem_id=solves[-1].id).one().elixir_delta == 200


def test_backfill_is_bounded_and_ignores_unverified_accounts(db):
    user, account = _make_user_account(db)
    unverified_user, unverified_account = _make_user_account(db, verified=False)
    for i in range(3):
        _solve(db, account, i)
    _solve(db, unverified_account, 3)

    service = EconomyService(db)
    first_count, cursor = service.backfill_batch(limit=2)
    assert first_count == 2
    second_count, next_cursor = service.backfill_batch(after_cursor=cursor, limit=2)
    assert second_count == 1
    assert next_cursor is not None and len(next_cursor) == 2
    assert db.query(Wallet).filter_by(user_id=user.id).one().rewarded_solves == 3
    assert db.query(Wallet).filter_by(user_id=unverified_user.id).count() == 0

    with pytest.raises(ValueError):
        service.backfill_batch(limit=501)


def test_reward_rollback_does_not_persist_wallet_or_ledger(db):
    user, account = _make_user_account(db)
    solve = _solve(db, account, 1)
    service = EconomyService(db)
    service.reward_solve(user.id, solve)
    db.rollback()
    assert db.query(Wallet).filter_by(user_id=user.id).count() == 0
    assert db.query(EconomyLedger).filter_by(solved_problem_id=solve.id).count() == 0


def test_reward_rejects_unverified_or_mismatched_owner(db):
    user, account = _make_user_account(db)
    other_user, _ = _make_user_account(db)
    unverified_user, unverified_account = _make_user_account(db, verified=False)
    solve = _solve(db, account, 1)
    unverified_solve = _solve(db, unverified_account, 2)
    service = EconomyService(db)

    with pytest.raises(ValueError, match="owner"):
        service.reward_solve(other_user.id, solve)
    with pytest.raises(ValueError, match="verified"):
        service.reward_solve(unverified_user.id, unverified_solve)

    assert db.query(Wallet).count() == 0
    assert db.query(EconomyLedger).count() == 0


@pytest.mark.asyncio
async def test_repeated_sync_rewards_a_solve_only_once(db):
    user, account = _make_user_account(db)

    class RedisLock:
        async def set(self, *args, **kwargs):
            return True

        async def eval(self, *args, **kwargs):
            return 1

        async def aclose(self):
            pass

    scheduler = SyncScheduler(db, redis=RedisLock())
    scheduler.adapter.fetch_submission_page = AsyncMock(side_effect=[
        CodeforcesSubmissionPage(1, [RawSubmission(101, "OK")], [NormalizedSolve(
            problem_ext_id="sync-award", topic_tags=[], rating=1000,
            solved_at=datetime.now(timezone.utc), submission_id=101,
        )]),
        CodeforcesSubmissionPage(0, [], []),
    ])
    assert await scheduler.sync_judge_account(str(account.id)) is True
    assert await scheduler.sync_judge_account(str(account.id)) is True
    assert [call.args[1] for call in scheduler.adapter.fetch_submission_page.await_args_list] == [1, 2]

    wallet = db.query(Wallet).filter_by(user_id=user.id).one()
    assert (wallet.coins, wallet.gems, wallet.gold, wallet.elixir, wallet.rewarded_solves) == (20, 0, 400, 400, 1)
    assert db.query(EconomyLedger).filter_by(user_id=user.id).count() == 1


@pytest.mark.asyncio
async def test_sync_rejects_account_revoked_during_remote_fetch(db):
    user, account = _make_user_account(db)

    class RedisLock:
        async def set(self, *args, **kwargs):
            return True

        async def eval(self, *args, **kwargs):
            return 1

        async def aclose(self):
            pass

    scheduler = SyncScheduler(db, redis=RedisLock())

    async def revoke_then_return_solve(handle, from_index, count=100):
        db.query(JudgeAccount).filter(JudgeAccount.id == account.id).update(
            {JudgeAccount.verified_flag: False}, synchronize_session=False,
        )
        db.commit()
        return CodeforcesSubmissionPage(1, [RawSubmission(102, "OK")], [NormalizedSolve(
            problem_ext_id="revoked-sync", topic_tags=[], rating=1000,
            solved_at=datetime.now(timezone.utc), submission_id=102,
        )])

    scheduler.adapter.fetch_submission_page = AsyncMock(side_effect=revoke_then_return_solve)
    assert await scheduler.sync_judge_account(str(account.id)) is False
    scheduler.adapter.fetch_submission_page.assert_awaited_once()
    assert db.query(SolvedProblem).filter_by(judge_account_id=account.id).count() == 0
    assert db.query(Wallet).filter_by(user_id=user.id).count() == 0
    assert db.query(EconomyLedger).count() == 0


def test_seeded_village_skins_are_cosmetic_and_purchasable(db):
    items = {
        item.sku: item
        for item in db.query(CosmeticCatalogItem).filter(
            CosmeticCatalogItem.sku.in_(("village-skin-pine-dusk", "village-skin-amber-paths")),
        ).all()
    }
    assert set(items) == {"village-skin-pine-dusk", "village-skin-amber-paths"}
    pine_dusk = items["village-skin-pine-dusk"]
    amber_paths = items["village-skin-amber-paths"]
    assert (pine_dusk.asset_ref, pine_dusk.slot, pine_dusk.coin_price, pine_dusk.gem_price) == (
        "original:pine-dusk", "village-skin", 500, 0,
    )
    assert (amber_paths.asset_ref, amber_paths.slot, amber_paths.coin_price, amber_paths.gem_price) == (
        "original:amber-paths", "village-skin", 0, 100,
    )
    assert all(item.is_available for item in items.values())

    user, _ = _make_user_account(db)
    db.add(Wallet(user_id=user.id, coins=500, gems=0, rewarded_solves=0))
    db.flush()
    service = EconomyService(db)
    purchase = service.purchase_cosmetic(
        user_id=user.id, catalog_item_id=pine_dusk.id, idempotency_key="buy-pine-dusk",
    )
    inventory = db.query(CosmeticInventory).filter_by(
        user_id=user.id, catalog_item_id=pine_dusk.id,
    ).one()
    equipment = service.equip_cosmetic(
        user_id=user.id, slot="village-skin", inventory_id=inventory.id,
    )

    assert purchase.catalog_item_id == pine_dusk.id
    assert equipment is not None and equipment.inventory_id == inventory.id
    assert db.query(Wallet).filter_by(user_id=user.id).one().coins == 0


def test_purchase_charges_once_for_idempotency_key(db):
    user, _ = _make_user_account(db)
    item = _cosmetic(db, coins=25, gems=2)
    db.add(Wallet(user_id=user.id, coins=100, gems=10, rewarded_solves=0))
    db.flush()
    service = EconomyService(db)

    first = service.purchase_cosmetic(
        user_id=user.id, catalog_item_id=item.id, idempotency_key="buy-once",
    )
    retry = service.purchase_cosmetic(
        user_id=user.id, catalog_item_id=item.id, idempotency_key="buy-once",
    )

    wallet = db.query(Wallet).filter_by(user_id=user.id).one()
    assert first.id == retry.id
    assert (wallet.coins, wallet.gems) == (75, 8)
    assert db.query(CosmeticPurchase).filter_by(user_id=user.id).count() == 1
    assert db.query(CosmeticInventory).filter_by(user_id=user.id, catalog_item_id=item.id).count() == 1


def test_purchase_rejects_insufficient_funds_and_reused_key_for_other_item(db):
    user, _ = _make_user_account(db)
    first_item = _cosmetic(db, sku="one", coins=20)
    second_item = _cosmetic(db, sku="two", coins=10)
    db.add(Wallet(user_id=user.id, coins=15, gems=0, rewarded_solves=0))
    db.flush()
    service = EconomyService(db)

    with pytest.raises(InsufficientFunds):
        service.purchase_cosmetic(
            user_id=user.id, catalog_item_id=first_item.id, idempotency_key="key-a",
        )
    assert db.query(Wallet).filter_by(user_id=user.id).one().coins == 15

    service.purchase_cosmetic(user_id=user.id, catalog_item_id=second_item.id, idempotency_key="key-a")
    with pytest.raises(PurchaseConflict, match="another item"):
        service.purchase_cosmetic(user_id=user.id, catalog_item_id=first_item.id, idempotency_key="key-a")
    assert db.query(Wallet).filter_by(user_id=user.id).one().coins == 5


def test_cosmetic_equip_requires_owned_item_and_matching_slot(db):
    user, _ = _make_user_account(db)
    other_user, _ = _make_user_account(db)
    item = _cosmetic(db, sku="owned-head", slot="head")
    other_item = _cosmetic(db, sku="other-head", slot="head")
    inventory = CosmeticInventory(user_id=user.id, catalog_item_id=item.id)
    other_inventory = CosmeticInventory(user_id=other_user.id, catalog_item_id=other_item.id)
    db.add_all([inventory, other_inventory])
    db.flush()
    service = EconomyService(db)

    equipment = service.equip_cosmetic(user_id=user.id, slot="head", inventory_id=inventory.id)
    assert equipment is not None and equipment.inventory_id == inventory.id
    with pytest.raises(InventoryOwnershipError):
        service.equip_cosmetic(user_id=user.id, slot="head", inventory_id=other_inventory.id)
    with pytest.raises(InventoryOwnershipError):
        service.equip_cosmetic(user_id=user.id, slot="body", inventory_id=inventory.id)
    assert db.query(CosmeticEquipment).filter_by(user_id=user.id, slot="head").one().inventory_id == inventory.id


def test_worker_backfill_advances_one_bounded_retryable_page(db):
    user, account = _make_user_account(db)
    for i in range(3):
        _solve(db, account, i)
    service = EconomyService(db)

    first = service.scheduled_backfill_batch(limit=2)
    assert first == {"rewarded": 2, "complete": False}
    state = db.query(EconomyBackfillState).filter_by(id=1).one()
    assert state.cursor_solved_at is not None and state.cursor_solve_id is not None

    second = service.scheduled_backfill_batch(limit=2)
    assert second == {"rewarded": 1, "complete": False}
    third = service.scheduled_backfill_batch(limit=2)
    assert third == {"rewarded": 0, "complete": True}
    assert service.scheduled_backfill_batch(limit=2) == {"rewarded": 0, "complete": True}
    assert db.query(Wallet).filter_by(user_id=user.id).one().rewarded_solves == 3


def test_worker_backfill_reconciles_late_solve_behind_completed_cursor(db):
    user, account = _make_user_account(db)
    original = _solve(db, account, 1)
    original.solved_at = datetime(2025, 1, 2, tzinfo=timezone.utc)
    db.flush()
    service = EconomyService(db)

    assert service.scheduled_backfill_batch(limit=1) == {"rewarded": 1, "complete": False}
    assert service.scheduled_backfill_batch(limit=1) == {"rewarded": 0, "complete": True}

    late = _solve(db, account, 2)
    late.solved_at = datetime(2025, 1, 1, tzinfo=timezone.utc)
    db.flush()
    assert service.scheduled_backfill_batch(limit=1) == {"rewarded": 1, "complete": False}
    assert service.scheduled_backfill_batch(limit=1) == {"rewarded": 0, "complete": True}
    assert db.query(EconomyLedger).filter_by(solved_problem_id=late.id).count() == 1
    assert db.query(Wallet).filter_by(user_id=user.id).one().coins == 20


def test_worker_backfill_reconciles_account_verified_after_completion(db):
    user, account = _make_user_account(db, verified=False)
    solve = _solve(db, account, 1)
    service = EconomyService(db)

    assert service.scheduled_backfill_batch(limit=1) == {"rewarded": 0, "complete": True}
    account.verified_flag = True
    db.commit()

    assert service.scheduled_backfill_batch(limit=1) == {"rewarded": 1, "complete": False}
    assert service.scheduled_backfill_batch(limit=1) == {"rewarded": 0, "complete": True}
    assert db.query(EconomyLedger).filter_by(solved_problem_id=solve.id).count() == 1
    assert db.query(Wallet).filter_by(user_id=user.id).one().coins == 10


def test_http_purchase_equip_inventory_includes_catalog_item_id(client, make_user, db):
    user, headers, _ = make_user()
    item = _cosmetic(db, sku=f"http-{uuid.uuid4().hex[:8]}", slot="head", coins=10)
    db.add(Wallet(user_id=uuid.UUID(user["id"]), coins=50, gems=0, rewarded_solves=0))
    db.flush()

    purchase = client.post(
        "/economy/purchases",
        json={"catalog_item_id": str(item.id), "idempotency_key": "http-purchase"},
        headers=headers,
    )
    assert purchase.status_code == 201, purchase.text
    inventory_item = db.query(CosmeticInventory).filter_by(
        user_id=uuid.UUID(user["id"]), catalog_item_id=item.id,
    ).one()
    equipped = client.put(
        "/economy/equipment/head",
        json={"inventory_id": str(inventory_item.id)},
        headers=headers,
    )
    assert equipped.status_code == 200, equipped.text

    response = client.get("/economy/inventory", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["equipped"] == [{
        "slot": "head",
        "inventory_id": str(inventory_item.id),
        "catalog_item_id": str(item.id),
        "updated_at": body["equipped"][0]["updated_at"],
    }]


@pytest.mark.parametrize(("solves", "capacity"), [(0, 2), (24, 2), (25, 3), (99, 3), (100, 4), (249, 4), (250, 5)])
def test_wallet_response_derives_builder_capacity(client, make_user, db, solves, capacity):
    user, headers, _ = make_user()
    db.add(Wallet(
        user_id=uuid.UUID(user["id"]), coins=0, gems=0, gold=0, elixir=0,
        rewarded_solves=solves,
    ))
    db.flush()

    response = client.get("/economy/wallet", headers=headers)
    assert response.status_code == 200, response.text
    assert response.json()["builder_capacity"] == capacity
    assert response.json()["rewarded_solves"] == solves
