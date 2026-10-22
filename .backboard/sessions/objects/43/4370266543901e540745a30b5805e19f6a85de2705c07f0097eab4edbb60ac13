"""Tests for M8 Notification & Realtime Gateway (SADD Appendix B.1),
against plan.md Phase 3's Redis pub/sub rewrite.

Sprint 1 kept live WebSocket objects in a plain Python dict, which
cannot work across processes (the Worker can never reach a socket held
by an API node). These tests exercise the Redis-based fan-out directly
rather than spinning up multiple processes.
"""
import asyncio

import pytest

from app.modules.m1_auth.models import User
from app.modules.m8_notifications.schemas import EventType
from app.modules.m8_notifications.service import (
    CHANNEL,
    ConnectionRegistry,
    NotificationService,
    run_subscriber_loop,
)

# notifications.user_id is a UUID column with a FK to users.id — real,
# persisted users are required wherever a value actually gets persisted.
USER_1 = "11111111-1111-1111-1111-111111111111"
USER_2 = "22222222-2222-2222-2222-222222222222"


def _ensure_user(db, user_id: str) -> None:
    if db.get(User, user_id) is not None:
        return
    db.add(User(id=user_id, username=f"u{user_id[:8]}", email=f"{user_id[:8]}@example.com", password_hash="fake_hash"))
    db.commit()


class FakeWebSocket:
    """Minimal stand-in for fastapi.WebSocket — records sent envelopes."""

    def __init__(self):
        self.sent: list[dict] = []

    async def send_json(self, data: dict) -> None:
        self.sent.append(data)


class TestConnectionRegistry:
    def test_add_get_remove(self):
        registry = ConnectionRegistry()
        ws = FakeWebSocket()
        registry.add("user-1", ws)
        assert ws in registry.get("user-1")

        registry.remove("user-1", ws)
        assert registry.get("user-1") == set()

    def test_all_sockets_spans_users(self):
        registry = ConnectionRegistry()
        ws1, ws2 = FakeWebSocket(), FakeWebSocket()
        registry.add("user-1", ws1)
        registry.add("user-2", ws2)
        assert set(registry.all_sockets()) == {ws1, ws2}


class TestEventEnvelope:
    def test_envelope_shape_matches_sadd_appendix_b1(self):
        """SADD Appendix B.1: {event_type, event_id, version, timestamp, payload}."""
        from app.modules.m8_notifications.schemas import EventEnvelope

        envelope = EventEnvelope(
            event_type=EventType.VILLAGE_UPDATED,
            payload={"user_id": "abc", "new_level": 3},
        )
        data = envelope.model_dump(mode="json")
        assert set(data.keys()) == {"event_type", "event_id", "version", "timestamp", "payload"}
        assert data["version"] == "1.0"


@pytest.mark.asyncio
class TestPubSubFanOut:
    async def test_publish_reaches_locally_registered_socket(self, redis_client, db):
        """
        Simulates the cross-process guarantee: publish() (as any
        process, including the Worker, would call it) and a
        subscriber loop (as an API node would run it) forwarding to a
        socket that process happens to hold.
        """
        import app.modules.m8_notifications.service as service_module

        _ensure_user(db, USER_1)

        registry = ConnectionRegistry()
        service_module.registry = registry  # this "process" holds the socket below
        ws = FakeWebSocket()
        registry.add(USER_1, ws)

        subscriber_task = asyncio.create_task(run_subscriber_loop(redis_client))
        await asyncio.sleep(0.1)  # let the SUBSCRIBE land before publishing

        notification_service = NotificationService(db)
        await notification_service.publish(
            redis_client,
            EventType.ATTACK_INCOMING,
            {"attack_id": "a1", "target_user_id": USER_1},
            user_ids=[USER_1],
        )

        for _ in range(20):
            if ws.sent:
                break
            await asyncio.sleep(0.05)

        subscriber_task.cancel()
        try:
            await subscriber_task
        except asyncio.CancelledError:
            pass

        assert len(ws.sent) == 1
        assert ws.sent[0]["event_type"] == "ATTACK_INCOMING"
        assert ws.sent[0]["payload"]["target_user_id"] == USER_1

    async def test_publish_persists_notification_for_targeted_users(self, redis_client, db):
        _ensure_user(db, USER_1)
        notification_service = NotificationService(db)
        await notification_service.publish(
            redis_client,
            EventType.LEAGUE_TIER_CHANGED,
            {"user_id": USER_1, "new_tier": "silver"},
            user_ids=[USER_1],
        )

        history = notification_service.get_user_notifications(USER_1)
        assert len(history) == 1
        assert history[0].event_type == "LEAGUE_TIER_CHANGED"

    async def test_broadcast_reaches_every_registered_socket(self, redis_client, db):
        import app.modules.m8_notifications.service as service_module

        registry = ConnectionRegistry()
        service_module.registry = registry
        ws1, ws2 = FakeWebSocket(), FakeWebSocket()
        registry.add("user-1", ws1)
        registry.add("user-2", ws2)

        subscriber_task = asyncio.create_task(run_subscriber_loop(redis_client))
        await asyncio.sleep(0.1)

        notification_service = NotificationService(db)
        await notification_service.publish(
            redis_client,
            EventType.TERRITORY_ZONE_CHANGED,
            {"zone_id": "z1", "new_owner_guild_id": "g1"},
            broadcast=True,
        )

        for _ in range(20):
            if ws1.sent and ws2.sent:
                break
            await asyncio.sleep(0.05)

        subscriber_task.cancel()
        try:
            await subscriber_task
        except asyncio.CancelledError:
            pass

        assert len(ws1.sent) == 1 and len(ws2.sent) == 1
