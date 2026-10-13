"""Persisted, validated topic-outpost placement layouts."""
import hashlib
import json
import uuid

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.modules.m3_village.models import Topic, TopicOutpostLayout, TopicOutpostLayoutOperation


TOPIC_KEYS = (
    "arrays", "strings", "math", "greedy", "graphs", "trees",
    "dynamic-programming", "data-structures",
)
DEFAULT_POSITIONS = {
    "arrays": (18, 20),
    "strings": (23, 17),
    "math": (28, 18),
    "greedy": (15, 23),
    "graphs": (33, 25),
    "trees": (17, 30),
    "dynamic-programming": (24, 33),
    "data-structures": (31, 30),
}
LAYOUT_RULES = {
    "coordinate_space": "village-grid",
    "min_x": 8,
    "min_y": 8,
    "max_x_exclusive": 40,
    "max_y_exclusive": 40,
    "footprint_width": 3,
    "footprint_height": 3,
    "allowed_facings": ["default", "mirrored"],
}


class OutpostLayoutError(Exception):
    """Expected layout rejection."""


class OutpostLayoutInvalid(OutpostLayoutError):
    pass


class OutpostLayoutConflict(OutpostLayoutError):
    pass


class OutpostLayoutService:
    def __init__(self, db: Session):
        self.db = db

    def _topic_catalog(self) -> dict[str, Topic]:
        topics = self.db.query(Topic).filter(Topic.name.in_(TOPIC_KEYS)).all()
        by_key = {topic.name: topic for topic in topics}
        if set(by_key) != set(TOPIC_KEYS):
            raise RuntimeError("Canonical outpost topics are not fully seeded")
        return by_key

    def _default_items(self) -> list[dict]:
        by_key = self._topic_catalog()
        return [{
            "topic_id": str(by_key[key].id),
            "topic_key": key,
            "x": DEFAULT_POSITIONS[key][0],
            "y": DEFAULT_POSITIONS[key][1],
            "facing": "default",
        } for key in TOPIC_KEYS]

    def _ensure_locked_layout(self, user_id) -> TopicOutpostLayout:
        defaults = self._default_items()
        self.db.execute(pg_insert(TopicOutpostLayout).values(
            user_id=user_id, revision=0, items=defaults,
        ).on_conflict_do_nothing(index_elements=[TopicOutpostLayout.user_id]))
        return (
            self.db.query(TopicOutpostLayout)
            .filter_by(user_id=user_id)
            .with_for_update().populate_existing().one()
        )

    @staticmethod
    def _snapshot(row: TopicOutpostLayout) -> dict:
        by_key = {item["topic_key"]: item for item in row.items}
        return {
            "revision": row.revision,
            "rules_version": 1,
            "rules": LAYOUT_RULES,
            "items": [by_key[key] for key in TOPIC_KEYS],
        }

    def get_layout(self, user_id) -> dict:
        try:
            row = self._ensure_locked_layout(user_id)
            result = self._snapshot(row)
            self.db.commit()
            return result
        except Exception:
            self.db.rollback()
            raise

    def _normalize_request(self, *, items: list[dict], expected_revision: int, rules_version: int):
        catalog = self._topic_catalog()
        key_by_id = {str(topic.id): key for key, topic in catalog.items()}
        if len(items) != 8:
            raise OutpostLayoutInvalid("Exactly eight outpost items are required")
        normalized = []
        seen = set()
        for item in items:
            topic_id = str(item["topic_id"])
            key = key_by_id.get(topic_id)
            if key is None or key in seen:
                raise OutpostLayoutInvalid("Items must contain each canonical topic exactly once")
            seen.add(key)
            x, y, facing = item["x"], item["y"], item["facing"]
            if type(x) is not int or type(y) is not int:
                raise OutpostLayoutInvalid("Coordinates must be integers")
            if not (8 <= x and x + 3 <= 40 and 8 <= y and y + 3 <= 40):
                raise OutpostLayoutInvalid("Outpost footprint is outside the village grid")
            if facing not in ("default", "mirrored"):
                raise OutpostLayoutInvalid("Unsupported outpost facing")
            normalized.append({
                "topic_id": topic_id,
                "topic_key": key,
                "x": x,
                "y": y,
                "facing": facing,
            })
        if seen != set(TOPIC_KEYS):
            raise OutpostLayoutInvalid("Items must contain each canonical topic exactly once")
        normalized.sort(key=lambda item: TOPIC_KEYS.index(item["topic_key"]))
        for index, left in enumerate(normalized):
            for right in normalized[index + 1:]:
                if (
                    left["x"] < right["x"] + 3 and left["x"] + 3 > right["x"]
                    and left["y"] < right["y"] + 3 and left["y"] + 3 > right["y"]
                ):
                    raise OutpostLayoutInvalid("Outpost footprints may not overlap")
        identity = hashlib.sha256(json.dumps({
            "expected_revision": expected_revision,
            "rules_version": rules_version,
            "items": normalized,
        }, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        return normalized, identity

    def put_layout(
        self, *, user_id, expected_revision: int, rules_version: int,
        idempotency_key: str, items: list[dict],
    ) -> dict:
        try:
            return self._put_layout(
                user_id=user_id, expected_revision=expected_revision,
                rules_version=rules_version, idempotency_key=idempotency_key, items=items,
            )
        except Exception:
            self.db.rollback()
            raise

    def _put_layout(
        self, *, user_id, expected_revision: int, rules_version: int,
        idempotency_key: str, items: list[dict],
    ) -> dict:
        normalized, identity = self._normalize_request(
            items=items, expected_revision=expected_revision, rules_version=rules_version,
        )
        row = self._ensure_locked_layout(user_id)

        # Check idempotency before the revision, so a successful retry remains
        # replayable even after a subsequent layout has advanced the revision.
        prior = self.db.query(TopicOutpostLayoutOperation).filter_by(
            user_id=user_id, idempotency_key=idempotency_key,
        ).one_or_none()
        if prior is not None:
            if prior.request_identity != identity:
                raise OutpostLayoutConflict("Idempotency key was already used for a different layout request")
            result = {
                "operation_id": prior.id,
                "applied_revision": prior.applied_revision,
                "replayed": True,
                "layout": self._snapshot(row),
            }
            self.db.commit()
            return result

        if row.revision != expected_revision:
            raise OutpostLayoutConflict("Layout revision is stale")

        row.items = normalized
        row.revision += 1
        operation = TopicOutpostLayoutOperation(
            id=uuid.uuid4(),
            user_id=user_id,
            idempotency_key=idempotency_key,
            request_identity=identity,
            expected_revision=expected_revision,
            applied_revision=row.revision,
        )
        self.db.add(operation)
        self.db.flush()
        result = {
            "operation_id": operation.id,
            "applied_revision": row.revision,
            "replayed": False,
            "layout": self._snapshot(row),
        }
        self.db.commit()
        return result
