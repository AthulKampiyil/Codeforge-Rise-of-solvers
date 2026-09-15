"""Admin & Game-Balance Configuration (UC-11/UC-12) — business logic.

Owns: orchestration/business rules for this module.
Cross-module calls must go through another module's service.py,
never its repository.py or models.py directly (SADD 4.1 coupling rule).
"""
import json
from typing import Any

from sqlalchemy.orm import Session

from app.core.errors import ConfigKeyNotFound, ConfigTypeMismatch
from app.core.redis import get_sync_redis
from app.modules.m9_admin_config.models import GameBalanceConfig as GameBalanceConfigRow
from app.modules.m9_admin_config.repository import AdminAuditLogRepository, GameBalanceConfigRepository

_CACHE_PREFIX = "config:"
_CACHE_TTL_SECONDS = 300


def _coerce(value: Any, value_type: str) -> Any:
    """Validate an incoming value against the key's declared `value_type`."""
    if value_type == "int" and isinstance(value, (int, float)) and not isinstance(value, bool):
        return int(value)
    if value_type == "float" and isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    if value_type == "dict" and isinstance(value, dict):
        return value
    if value_type == "str" and isinstance(value, str):
        return value
    raise ConfigTypeMismatch(f"Value does not match this key's type ('{value_type}')")


class GameBalanceConfig:
    """
    Read-through/write-through Redis cache over the `game_balance_config`
    table (UC-12). Every other module reads its tunables through
    `get(key)` instead of hard-coding constants, so an Admin can change
    game-balance behaviour at runtime with no restart — that's the
    entire point of UC-12.

    Uses the synchronous Redis client (app.core.redis.get_sync_redis)
    so it can be called from any module's ordinary (non-async)
    service.py methods, matching how the rest of the codebase's
    business logic is written.
    """

    def __init__(self, db: Session):
        self.db = db
        self.repo = GameBalanceConfigRepository(db)
        self.redis = get_sync_redis()

    def get(self, key: str) -> int | float | dict | str:
        """Read one config value by key, Redis-cached."""
        cache_key = f"{_CACHE_PREFIX}{key}"
        cached = self.redis.get(cache_key)
        if cached is not None:
            return json.loads(cached)

        row = self.repo.get(key)
        if row is None:
            raise ConfigKeyNotFound(f"Unknown config key '{key}'")

        self.redis.setex(cache_key, _CACHE_TTL_SECONDS, json.dumps(row.value))
        return row.value

    def get_all(self) -> list[GameBalanceConfigRow]:
        """List every config key with its current value (GET /admin/config)."""
        return self.repo.get_all()

    def set(self, key: str, value: Any, admin_user_id: str) -> GameBalanceConfigRow:
        """
        Write a new value for `key` (PUT /admin/config/{key}): validate
        against the stored type, persist, bust the cache entry so the
        next `get()` reads through to Postgres, and record an
        `admin_audit_log` row (NFR-3.5). Keys are seeded, never created
        ad hoc, so an unknown key is a 404.
        """
        row = self.repo.get(key)
        if row is None:
            raise ConfigKeyNotFound(f"Unknown config key '{key}'")

        coerced = _coerce(value, row.value_type)
        old_value = row.value

        updated = self.repo.set_value(key, coerced, admin_user_id)
        self.redis.delete(f"{_CACHE_PREFIX}{key}")

        AdminAuditLogRepository(self.db).create(
            admin_user_id=admin_user_id,
            action="set_config",
            target_type="config_key",
            target_id=key,
            details={"old_value": old_value, "new_value": coerced},
        )
        return updated
