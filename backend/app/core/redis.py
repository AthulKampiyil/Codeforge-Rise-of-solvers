"""Redis client + Redlock helpers (SADD 2.4, 6.5.2).

Redis is NOT the correctness mechanism for gameplay state (that's
PostgreSQL's job — see SADD 6.5.1/6.5.2). Redis is used here for:
  - a read-through/write-through cache for attack cooldowns (7.2.1)
  - rate limiting (NFR-3.4)
  - pub/sub fan-out for the realtime gateway (M8)
  - best-effort job-scheduling deduplication via Redlock (6.5.2) —
    NEVER for protecting ZONE_CONTRIBUTION/TERRITORY_ZONE correctness.
"""
import secrets
from typing import AsyncGenerator, Optional

import redis.asyncio as aioredis
import redis as sync_redis

from app.core.config import settings

# Async client — used by request handlers and the notification gateway.
_async_pool = aioredis.ConnectionPool.from_url(
    settings.REDIS_URL, decode_responses=True
)


def get_async_redis() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=_async_pool)


async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """FastAPI dependency yielding an async Redis client."""
    client = get_async_redis()
    try:
        yield client
    finally:
        await client.aclose()


# Sync client — used by the background worker's synchronous job code.
_sync_pool = sync_redis.ConnectionPool.from_url(
    settings.REDIS_URL, decode_responses=True
)


def get_sync_redis() -> sync_redis.Redis:
    return sync_redis.Redis(connection_pool=_sync_pool)


# --- Redlock (SADD 6.5.2) -------------------------------------------------
#
# Used ONLY for job-scheduling deduplication (e.g. "only one worker
# replica should run the territory reconciliation sweep at a time").
# A lost lock during a sweep costs at most redundant, idempotent
# recomputation — never incorrect data — which is exactly the class of
# problem Redlock is appropriate for (SADD 6.5.2).

_RELEASE_LUA = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


async def redlock_acquire(client: aioredis.Redis, key: str, ttl_seconds: int) -> Optional[str]:
    """Try to acquire a Redlock. Returns the owner token if acquired, else None."""
    token = secrets.token_hex(16)
    acquired = await client.set(key, token, nx=True, ex=ttl_seconds)
    return token if acquired else None


async def redlock_release(client: aioredis.Redis, key: str, token: str) -> bool:
    """Release a Redlock only if we still own it (compare-and-delete)."""
    result = await client.eval(_RELEASE_LUA, 1, key, token)
    return bool(result)


def redlock_acquire_sync(client: sync_redis.Redis, key: str, ttl_seconds: int) -> Optional[str]:
    """Sync variant for the background worker."""
    token = secrets.token_hex(16)
    acquired = client.set(key, token, nx=True, ex=ttl_seconds)
    return token if acquired else None


def redlock_release_sync(client: sync_redis.Redis, key: str, token: str) -> bool:
    result = client.eval(_RELEASE_LUA, 1, key, token)
    return bool(result)
