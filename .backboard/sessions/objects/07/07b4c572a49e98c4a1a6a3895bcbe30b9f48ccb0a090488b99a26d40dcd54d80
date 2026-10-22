"""Redis-backed rate limiting (NFR-3.4, REQ-2.2).

Used for: on-demand sync (once per 5 min per judge account), attack
initiation, and guild actions, to reduce opportunities for abuse or
leaderboard manipulation (NFR-3.4).

Implemented as a fixed-window counter — simple, O(1), and precise
enough for these budgets (we don't need sliding-window smoothness for
a 5-minute human-triggered action).
"""
from typing import Annotated, Callable

from fastapi import Depends, HTTPException, Request, status
from redis.asyncio import Redis

from app.core.redis import get_redis


class RateLimitExceeded(HTTPException):
    """429 with a Retry-After header (REQ-2.2, NFR-3.4)."""

    def __init__(self, retry_after_seconds: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after_seconds}s.",
            headers={"Retry-After": str(retry_after_seconds)},
        )


async def check_rate_limit(
    redis: Redis, key: str, limit: int, window_seconds: int
) -> None:
    """
    Fixed-window rate limit check. Raises RateLimitExceeded if the
    caller has exceeded `limit` calls within the current window.

    Args:
        key: fully-qualified Redis key, e.g. "ratelimit:sync:{account_id}"
        limit: max calls allowed per window
        window_seconds: window length in seconds
    """
    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, window_seconds)
    if current > limit:
        ttl = await redis.ttl(key)
        raise RateLimitExceeded(retry_after_seconds=max(ttl, 1))


def rate_limit(key_fn: Callable[[Request], str], limit: int, window_seconds: int):
    """
    FastAPI dependency factory. `key_fn` derives a rate-limit key from
    the request (e.g. current user id, judge account id from the path).

    Usage:
        @router.post("/sync/{judge_account_id}", dependencies=[
            Depends(rate_limit(lambda r: f"sync:{r.path_params['judge_account_id']}",
                                limit=1, window_seconds=300))
        ])
    """

    async def dependency(
        request: Request,
        redis: Annotated[Redis, Depends(get_redis)],
    ) -> None:
        key = f"ratelimit:{key_fn(request)}"
        await check_rate_limit(redis, key, limit, window_seconds)

    return dependency
