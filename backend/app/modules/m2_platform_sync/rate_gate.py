"""Application-wide fail-closed Codeforces HTTP dispatch lease."""
import asyncio
import uuid

from app.core.redis import get_async_redis


_ACQUIRE = """
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local active_ttl = redis.call('PTTL', KEYS[1])
if active_ttl ~= -2 then
  return math.max(active_ttl, 1)
end
local next_at = tonumber(redis.call('GET', KEYS[2]) or '0')
if next_at > now then
  return next_at - now
end
redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[2], 'NX')
return 0
"""

_OWNED = "return redis.call('GET', KEYS[1]) == ARGV[1] and 1 or 0"

_RELEASE = """
if redis.call('GET', KEYS[1]) ~= ARGV[1] then
  return 0
end
redis.call('DEL', KEYS[1])
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local cooldown = now + tonumber(ARGV[2])
redis.call('SET', KEYS[2], cooldown, 'PX', tonumber(ARGV[2]) + 1000)
return 1
"""

_ACTIVE_KEY = "m2:codeforces:request-active"
_COOLDOWN_KEY = "m2:codeforces:request-cooldown"
_COOLDOWN_MS = 2000
CODEFORCES_REQUEST_DEADLINE_SECONDS = 8
# Longer than the total request deadline, allowing the request to release its
# token even at the deadline. A delayed caller validates ownership before send.
_LEASE_TTL_MS = 12_000


class CodeforcesRateBusy(Exception):
    """A Codeforces request cannot be dispatched yet."""

    def __init__(self, retry_after: float):
        self.retry_after = max(0.001, float(retry_after))
        super().__init__(f"Codeforces request rate limited; retry after {self.retry_after:.3f}s")


class CodeforcesRequestLease:
    """Token-owned Redis lease held for one complete outgoing HTTP request."""

    def __init__(self, redis, own_client: bool, token: str):
        self.redis = redis
        self.own_client = own_client
        self.token = token
        self._released = False

    async def __aenter__(self):
        return self

    async def assert_owned(self) -> None:
        try:
            owned = await self.redis.eval(_OWNED, 1, _ACTIVE_KEY, self.token)
        except Exception as exc:
            raise RuntimeError("Codeforces request lease unavailable") from exc
        if not owned:
            raise RuntimeError("Codeforces request lease lost")

    async def __aexit__(self, exc_type, exc, tb):
        if self._released:
            return False
        self._released = True
        try:
            # Ensure cancellation of the HTTP task does not strand the lease
            # until TTL expiry; the shielded cleanup itself remains bounded by
            # Redis' client timeout.
            release = asyncio.create_task(
                self.redis.eval(
                    _RELEASE,
                    2,
                    _ACTIVE_KEY,
                    _COOLDOWN_KEY,
                    self.token,
                    _COOLDOWN_MS,
                )
            )
            released = await asyncio.shield(release)
            if not released:
                raise RuntimeError("Codeforces request lease lost before release")
        except Exception as release_error:
            raise RuntimeError("Codeforces request lease release failed") from release_error
        finally:
            if self.own_client:
                close = asyncio.create_task(self.redis.aclose())
                await asyncio.shield(close)
        return False


async def wait_for_codeforces_slot(redis=None) -> CodeforcesRequestLease:
    """Acquire an immediate exclusive request lease or raise busy; never queue."""
    own = redis is None
    client = redis or get_async_redis()
    token = uuid.uuid4().hex
    try:
        retry_ms = await client.eval(
            _ACQUIRE,
            2,
            _ACTIVE_KEY,
            _COOLDOWN_KEY,
            token,
            _LEASE_TTL_MS,
        )
        if retry_ms < 0:
            raise RuntimeError("Invalid Codeforces rate gate response")
        if retry_ms:
            raise CodeforcesRateBusy(retry_ms / 1000)
        return CodeforcesRequestLease(client, own, token)
    except CodeforcesRateBusy:
        if own:
            await client.aclose()
        raise
    except Exception as exc:
        if own:
            await client.aclose()
        raise RuntimeError("Codeforces request rate gate unavailable") from exc
