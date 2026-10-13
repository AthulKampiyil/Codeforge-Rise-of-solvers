"""Atomic rewards and bounded historical solve backfill."""
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.modules.m1_auth.models import JudgeAccount
from app.modules.m2_platform_sync.models import SolvedProblem
from app.modules.m10_economy.models import (
    CosmeticCatalogItem, CosmeticEquipment, CosmeticInventory, CosmeticPurchase,
    EconomyBackfillState, EconomyLedger, Wallet,
)

MAX_RATING = 3500
BACKFILL_BATCH_SIZE = 500
BACKFILL_WORKER_BATCH_SIZE = 100


class EconomyError(Exception):
    """Expected economy operation rejection; callers map this to HTTP status."""


class InsufficientFunds(EconomyError):
    pass


class PurchaseConflict(EconomyError):
    pass


class InventoryOwnershipError(EconomyError):
    pass


def coins_for_rating(rating: int | None) -> int:
    """10 coins up to 899, then +5 for each completed 100 rating points."""
    if rating is None or rating < 900:
        return 10
    bounded = min(rating, MAX_RATING)
    return 10 + ((bounded - 800) // 100) * 5


class EconomyService:
    def __init__(self, db: Session):
        self.db = db

    def reward_solve(self, user_id, solve: SolvedProblem) -> bool:
        """Award once for an owned, persisted solve by a verified judge account.

        The ownership/verification row lock is held through the caller's
        transaction, and all writes remain part of that transaction.
        """
        account = (
            self.db.query(JudgeAccount)
            .filter(JudgeAccount.id == solve.judge_account_id)
            .with_for_update().populate_existing().one_or_none()
        )
        persisted_solve = self.db.query(SolvedProblem).filter(
            SolvedProblem.id == solve.id,
            SolvedProblem.judge_account_id == solve.judge_account_id,
        ).one_or_none()
        if account is None or not account.verified_flag:
            raise ValueError("Solve reward requires a verified judge account")
        if persisted_solve is None or account.user_id != user_id:
            raise ValueError("Solve reward owner does not match the persisted solve")

        # Create-if-missing and then lock before reading/updating sequence state.
        stmt = pg_insert(Wallet).values(
            user_id=user_id, coins=0, gems=0, gold=0, elixir=0, rewarded_solves=0,
        )
        self.db.execute(stmt.on_conflict_do_nothing(index_elements=[Wallet.user_id]))
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).with_for_update().populate_existing().one()

        if self.db.query(EconomyLedger.id).filter(
            EconomyLedger.solved_problem_id == solve.id,
        ).first():
            return False

        ordinal = wallet.rewarded_solves + 1
        coin_delta = coins_for_rating(persisted_solve.rating)
        gem_delta = 100 if ordinal % 50 == 0 else 0
        gold_delta = 20 * coin_delta
        elixir_delta = 20 * coin_delta
        wallet.coins += coin_delta
        wallet.gems += gem_delta
        wallet.gold += gold_delta
        wallet.elixir += elixir_delta
        wallet.rewarded_solves = ordinal
        self.db.add(EconomyLedger(
            user_id=user_id,
            solved_problem_id=solve.id,
            solve_ordinal=ordinal,
            coin_delta=coin_delta,
            gem_delta=gem_delta,
            gold_delta=gold_delta,
            elixir_delta=elixir_delta,
        ))
        self.db.flush()
        return True

    def backfill_batch(self, *, after_cursor=None, limit: int = BACKFILL_BATCH_SIZE):
        """Reward a bounded page of persisted solves belonging to verified accounts.

        Caller controls commit/rollback. Return (new rewards, last (solved_at, id)
        cursor). Repeated calls are safe; use that tuple in the next call.
        """
        if not 1 <= limit <= BACKFILL_BATCH_SIZE:
            raise ValueError(f"limit must be between 1 and {BACKFILL_BATCH_SIZE}")
        query = (
            self.db.query(SolvedProblem, JudgeAccount.user_id)
            .join(JudgeAccount, JudgeAccount.id == SolvedProblem.judge_account_id)
            .filter(JudgeAccount.verified_flag.is_(True))
        )
        if after_cursor is not None:
            solved_at, solve_id = after_cursor
            query = query.filter(
                (SolvedProblem.solved_at > solved_at)
                | ((SolvedProblem.solved_at == solved_at) & (SolvedProblem.id > solve_id))
            )
        rows = query.order_by(SolvedProblem.solved_at, SolvedProblem.id).limit(limit).all()
        rewarded = sum(self.reward_solve(user_id, solve) for solve, user_id in rows)
        last_cursor = (rows[-1][0].solved_at, rows[-1][0].id) if rows else after_cursor
        return rewarded, last_cursor

    def scheduled_backfill_batch(self, *, limit: int = BACKFILL_WORKER_BATCH_SIZE) -> dict:
        """Repair one bounded page of eligible solves missing a ledger entry.

        The checkpoint is diagnostic/progress state only. Every invocation
        re-queries the anti-join from the beginning so late inserts and judge
        accounts verified after an earlier pass cannot be stranded behind a
        cursor or a previously completed state.
        """
        if not 1 <= limit <= BACKFILL_BATCH_SIZE:
            raise ValueError(f"limit must be between 1 and {BACKFILL_BATCH_SIZE}")
        stmt = pg_insert(EconomyBackfillState).values(
            id=1, cursor_solved_at=None, cursor_solve_id=None, is_complete=False,
        )
        self.db.execute(stmt.on_conflict_do_nothing(index_elements=[EconomyBackfillState.id]))
        state = self.db.query(EconomyBackfillState).filter_by(id=1).with_for_update().one()
        rows = (
            self.db.query(SolvedProblem, JudgeAccount.user_id)
            .join(JudgeAccount, JudgeAccount.id == SolvedProblem.judge_account_id)
            .outerjoin(EconomyLedger, EconomyLedger.solved_problem_id == SolvedProblem.id)
            .filter(
                JudgeAccount.verified_flag.is_(True),
                EconomyLedger.id.is_(None),
            )
            .order_by(SolvedProblem.solved_at, SolvedProblem.id)
            .limit(limit).all()
        )
        rewarded = sum(self.reward_solve(user_id, solve) for solve, user_id in rows)
        if rows:
            last_solve = rows[-1][0]
            state.cursor_solved_at = last_solve.solved_at
            state.cursor_solve_id = last_solve.id
            state.is_complete = False
        else:
            state.is_complete = True
        self.db.commit()
        return {"rewarded": rewarded, "complete": state.is_complete}

    def purchase_cosmetic(self, *, user_id, catalog_item_id, idempotency_key: str) -> CosmeticPurchase:
        """Charge and grant one cosmetic atomically, replayable by client key."""
        if not idempotency_key or len(idempotency_key) > 128:
            raise EconomyError("idempotency_key must contain 1 to 128 characters")

        # Wallet serialization makes same-user retries and competing purchases
        # mutually exclusive, including the wallet-first creation case.
        insert_wallet = pg_insert(Wallet).values(
            user_id=user_id, coins=0, gems=0, gold=0, elixir=0, rewarded_solves=0,
        )
        self.db.execute(insert_wallet.on_conflict_do_nothing(index_elements=[Wallet.user_id]))
        wallet = self.db.query(Wallet).filter_by(user_id=user_id).with_for_update().populate_existing().one()

        previous = self.db.query(CosmeticPurchase).filter_by(
            user_id=user_id, idempotency_key=idempotency_key,
        ).one_or_none()
        if previous:
            if previous.catalog_item_id != catalog_item_id:
                raise PurchaseConflict("Idempotency key was already used for another item")
            return previous

        item = self.db.query(CosmeticCatalogItem).filter_by(
            id=catalog_item_id, is_available=True,
        ).with_for_update().one_or_none()
        if item is None:
            raise PurchaseConflict("Cosmetic is unavailable")
        owned = self.db.query(CosmeticInventory.id).filter_by(
            user_id=user_id, catalog_item_id=item.id,
        ).first()
        if owned:
            raise PurchaseConflict("Cosmetic is already owned")
        if wallet.coins < item.coin_price or wallet.gems < item.gem_price:
            raise InsufficientFunds("Insufficient wallet balance")

        wallet.coins -= item.coin_price
        wallet.gems -= item.gem_price
        inventory = CosmeticInventory(user_id=user_id, catalog_item_id=item.id)
        purchase = CosmeticPurchase(
            user_id=user_id,
            catalog_item_id=item.id,
            idempotency_key=idempotency_key,
            coin_cost=item.coin_price,
            gem_cost=item.gem_price,
        )
        self.db.add_all([inventory, purchase])
        try:
            self.db.flush()
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        self.db.refresh(purchase)
        return purchase

    def equip_cosmetic(self, *, user_id, slot: str, inventory_id=None) -> CosmeticEquipment | None:
        """Equip an owned cosmetic only in its catalog-defined cosmetic slot."""
        if inventory_id is None:
            self.db.query(CosmeticEquipment).filter_by(user_id=user_id, slot=slot).delete(synchronize_session=False)
            self.db.commit()
            return None

        owned = (
            self.db.query(CosmeticInventory, CosmeticCatalogItem)
            .join(CosmeticCatalogItem, CosmeticCatalogItem.id == CosmeticInventory.catalog_item_id)
            .filter(
                CosmeticInventory.id == inventory_id,
                CosmeticInventory.user_id == user_id,
            ).one_or_none()
        )
        if owned is None or owned[1].slot != slot:
            raise InventoryOwnershipError("Cosmetic is not owned for this equipment slot")

        stmt = pg_insert(CosmeticEquipment).values(
            user_id=user_id, slot=slot, inventory_id=inventory_id,
        ).on_conflict_do_update(
            index_elements=[CosmeticEquipment.user_id, CosmeticEquipment.slot],
            set_={"inventory_id": inventory_id},
        )
        self.db.execute(stmt)
        self.db.commit()
        return self.db.query(CosmeticEquipment).filter_by(user_id=user_id, slot=slot).one()
