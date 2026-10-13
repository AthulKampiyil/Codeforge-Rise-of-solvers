"""Token-owned Codeforces request leases without a live Redis server."""
import asyncio

import pytest

from app.modules.m2_platform_sync.rate_gate import (
    CodeforcesRateBusy,
    wait_for_codeforces_slot,
)


class SharedRedis:
    def __init__(self, state=None):
        self.state = state if state is not None else {
            "now": 10_000,
            "active": None,
            "cooldown_until": 0,
        }

    async def eval(self, script, _key_count, *args):
        if "local active_ttl" in script:
            token, ttl = args[2:]
            active = self.state["active"]
            if active and active[1] > self.state["now"]:
                return max(1, active[1] - self.state["now"])
            remaining = self.state["cooldown_until"] - self.state["now"]
            if remaining > 0:
                return remaining
            self.state["active"] = (token, self.state["now"] + int(ttl))
            return 0
        if "local cooldown =" in script:
            token, cooldown = args[2:]
            active = self.state["active"]
            if not active or active[0] != token or active[1] <= self.state["now"]:
                return 0
            self.state["active"] = None
            self.state["cooldown_until"] = self.state["now"] + int(cooldown)
            return 1
        if "return redis.call('GET'" in script:
            token = args[1]
            active = self.state["active"]
            return int(bool(active and active[0] == token and active[1] > self.state["now"]))
        raise AssertionError(f"Unexpected Redis script: {script}")

    async def aclose(self):
        pass


@pytest.mark.asyncio
async def test_two_redis_clients_share_token_owned_inflight_lease_and_cooldown():
    state = {"now": 10_000, "active": None, "cooldown_until": 0}
    first_client, second_client = SharedRedis(state), SharedRedis(state)

    lease = await wait_for_codeforces_slot(first_client)
    with pytest.raises(CodeforcesRateBusy) as busy:
        await wait_for_codeforces_slot(second_client)
    assert busy.value.retry_after >= 0.001

    async with lease:
        await lease.assert_owned()

    with pytest.raises(CodeforcesRateBusy) as busy:
        await wait_for_codeforces_slot(second_client)
    assert busy.value.retry_after == 2

    state["now"] += 2000
    next_lease = await wait_for_codeforces_slot(second_client)
    async with next_lease:
        await next_lease.assert_owned()


@pytest.mark.asyncio
async def test_delayed_dispatch_cannot_use_expired_lease():
    redis = SharedRedis()
    lease = await wait_for_codeforces_slot(redis)

    # Simulate a task delayed after acquisition until its bounded lease expires.
    redis.state["now"] += 12_001
    with pytest.raises(RuntimeError, match="lease lost"):
        await lease.assert_owned()
    with pytest.raises(RuntimeError, match="lease release failed"):
        await lease.__aexit__(None, None, None)


@pytest.mark.asyncio
async def test_cancelled_request_releases_lease_and_applies_cooldown():
    redis = SharedRedis()
    entered = asyncio.Event()

    async def request():
        lease = await wait_for_codeforces_slot(redis)
        async with lease:
            await lease.assert_owned()
            entered.set()
            await asyncio.Future()

    task = asyncio.create_task(request())
    await entered.wait()
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task

    assert redis.state["active"] is None
    assert redis.state["cooldown_until"] == redis.state["now"] + 2000


@pytest.mark.asyncio
async def test_redis_outage_fails_closed_on_acquire_and_lease_loss():
    class BrokenRedis(SharedRedis):
        async def eval(self, *args):
            raise OSError("redis offline")

    with pytest.raises(RuntimeError, match="rate gate unavailable"):
        await wait_for_codeforces_slot(BrokenRedis())

    redis = SharedRedis()
    lease = await wait_for_codeforces_slot(redis)
    redis.eval = BrokenRedis().eval
    with pytest.raises(RuntimeError, match="lease unavailable"):
        await lease.assert_owned()
