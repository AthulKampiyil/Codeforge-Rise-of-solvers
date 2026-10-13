"""Server-authoritative topic outpost purchasing."""
import uuid

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.modules.m10_economy.models import Wallet
from app.modules.m3_village.models import (
    Topic, TopicOutpost, TopicOutpostUpgradeOperation, VillageTopicProgress,
)


class OutpostUpgradeError(Exception):
    """Expected rejection of an outpost upgrade request."""


class OutpostNotFound(OutpostUpgradeError):
    pass


class OutpostConflict(OutpostUpgradeError):
    pass


class OutpostInsufficientFunds(OutpostUpgradeError):
    pass


class TopicOutpostService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _builder_capacity(rewarded_solves: int) -> int:
        if rewarded_solves < 25:
            return 2
        if rewarded_solves < 100:
            return 3
        if rewarded_solves < 250:
            return 4
        return 5

    def _wallet_snapshot(self, user_id) -> dict:
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).one_or_none()
        solves = wallet.rewarded_solves if wallet else 0
        return {
            "coins": wallet.coins if wallet else 0,
            "gems": wallet.gems if wallet else 0,
            "gold": wallet.gold if wallet else 0,
            "elixir": wallet.elixir if wallet else 0,
            "rewarded_solves": solves,
            "builder_capacity": self._builder_capacity(solves),
        }

    def _snapshot(self, user_id) -> dict:
        rows = (
            self.db.query(Topic.id, TopicOutpost.tier)
            .join(VillageTopicProgress, VillageTopicProgress.topic_id == Topic.id)
            .outerjoin(
                TopicOutpost,
                (TopicOutpost.topic_id == Topic.id) & (TopicOutpost.user_id == user_id),
            )
            .filter(
                VillageTopicProgress.user_id == user_id,
                VillageTopicProgress.progress_points > 0,
            )
            .order_by(Topic.id)
            .all()
        )
        items = []
        for topic_id, tier_value in rows:
            tier = tier_value or 0
            cost = 100 * (tier + 1) if tier < 5 else None
            items.append({
                "topic_id": topic_id,
                "tier": tier,
                "next_gold_cost": cost,
                "next_elixir_cost": cost,
            })
        return {"items": items, "wallet": self._wallet_snapshot(user_id)}

    def get_snapshot(self, user_id) -> dict:
        return self._snapshot(user_id)

    def upgrade(self, *, user_id, topic_id, idempotency_key: str, expected_tier: int) -> dict:
        try:
            return self._upgrade(
                user_id=user_id, topic_id=topic_id,
                idempotency_key=idempotency_key, expected_tier=expected_tier,
            )
        except Exception:
            self.db.rollback()
            raise

    def _upgrade(self, *, user_id, topic_id, idempotency_key: str, expected_tier: int) -> dict:
        # The wallet lock serializes this user's purchases, including the case
        # where the requested topic has not yet acquired an outpost row.
        self.db.execute(pg_insert(Wallet).values(
            user_id=user_id, coins=0, gems=0, gold=0, elixir=0, rewarded_solves=0,
        ).on_conflict_do_nothing(index_elements=[Wallet.user_id]))
        wallet = (
            self.db.query(Wallet).filter(Wallet.user_id == user_id)
            .with_for_update().populate_existing().one()
        )

        prior = self.db.query(TopicOutpostUpgradeOperation).filter_by(
            user_id=user_id, idempotency_key=idempotency_key,
        ).one_or_none()
        if prior is not None:
            if prior.topic_id != topic_id or prior.expected_tier != expected_tier:
                raise OutpostConflict("Idempotency key was already used for a different upgrade request")
            self.db.commit()
            result = self._snapshot(user_id)
            result["upgraded_topic_id"] = str(prior.topic_id)
            return result

        progress = (
            self.db.query(VillageTopicProgress)
            .filter(
                VillageTopicProgress.user_id == user_id,
                VillageTopicProgress.topic_id == topic_id,
                VillageTopicProgress.progress_points > 0,
            )
            .with_for_update().one_or_none()
        )
        if progress is None or self.db.query(Topic.id).filter(Topic.id == topic_id).one_or_none() is None:
            raise OutpostNotFound("No progressed topic belongs to this user")

        self.db.execute(pg_insert(TopicOutpost).values(
            user_id=user_id, topic_id=topic_id, tier=0,
        ).on_conflict_do_nothing(index_elements=[TopicOutpost.user_id, TopicOutpost.topic_id]))
        outpost = (
            self.db.query(TopicOutpost)
            .filter_by(user_id=user_id, topic_id=topic_id)
            .with_for_update().populate_existing().one()
        )
        if outpost.tier != expected_tier:
            raise OutpostConflict("Outpost tier changed; refresh before upgrading")
        if outpost.tier >= 5:
            raise OutpostConflict("Outpost is already at maximum tier")

        cost = 100 * (outpost.tier + 1)
        if wallet.gold < cost or wallet.elixir < cost:
            raise OutpostInsufficientFunds("Insufficient gold or elixir")

        wallet.gold -= cost
        wallet.elixir -= cost
        outpost.tier += 1
        self.db.add(TopicOutpostUpgradeOperation(
            id=uuid.uuid4(), user_id=user_id, topic_id=topic_id,
            idempotency_key=idempotency_key, expected_tier=expected_tier,
            gold_cost=cost, elixir_cost=cost,
        ))
        self.db.flush()
        self.db.commit()
        result = self._snapshot(user_id)
        result["upgraded_topic_id"] = str(topic_id)
        return result
