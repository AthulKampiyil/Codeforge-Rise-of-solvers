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


class TestWebSocketAuth:
    @pytest.mark.asyncio
    async def test_revoked_token_is_rejected_before_websocket_accept(self, client, make_user, redis_client):
        from fastapi import WebSocketDisconnect
        from app.core.security import decode_token

        _, _, tokens = make_user()
        claims = decode_token(tokens["access_token"])
        await redis_client.set(f"auth:session-revoked:{claims['sid']}", "1", ex=60)
        with pytest.raises(WebSocketDisconnect) as exc:
            with client.websocket_connect(f"/ws/events?token={tokens['access_token']}"):
                pass
        assert exc.value.code == 1008

    @pytest.mark.asyncio
    async def test_access_token_is_accepted_from_the_handshake_subprotocol(self, client, make_user):
        """The token belongs in the handshake header, not the URL (M9)."""
        from app.modules.m8_notifications.router import WS_BEARER_SUBPROTOCOL

        _, _, tokens = make_user()
        with client.websocket_connect(
            "/ws/events", subprotocols=[WS_BEARER_SUBPROTOCOL, tokens["access_token"]],
        ) as ws:
            ws.send_text("ping")
            assert ws.receive_text() == "pong"

    @pytest.mark.asyncio
    async def test_websocket_without_any_token_is_rejected(self, client):
        from fastapi import WebSocketDisconnect

        with pytest.raises(WebSocketDisconnect) as exc:
            with client.websocket_connect("/ws/events"):
                pass
        assert exc.value.code == 1008

    @pytest.mark.asyncio
    async def test_idle_websocket_is_closed_after_session_revocation(self, client, make_user, redis_client):
        import asyncio
        from fastapi import WebSocketDisconnect
        from app.core.security import decode_token
        _, _, tokens = make_user()
        claims = decode_token(tokens["access_token"])
        with client.websocket_connect(f"/ws/events?token={tokens['access_token']}") as ws:
            await redis_client.set(f"auth:session-revoked:{claims['sid']}", "1", ex=60)
            # Server watcher is independent of client ping/message activity.
            with pytest.raises(WebSocketDisconnect) as exc:
                await asyncio.wait_for(asyncio.to_thread(ws.receive_text), timeout=5)
            assert exc.value.code == 1008

    @pytest.mark.asyncio
    async def test_idle_websocket_checks_durable_revocation_in_injected_test_db(
        self, client, make_user, db,
    ):
        import asyncio
        from fastapi import WebSocketDisconnect
        from app.core.security import decode_token
        from app.modules.m1_auth.repository import AuthSessionRepository

        _, _, tokens = make_user()
        claims = decode_token(tokens["access_token"])
        with client.websocket_connect(f"/ws/events?token={tokens['access_token']}") as ws:
            # Revoke in PostgreSQL without setting any Redis denylist key.
            assert AuthSessionRepository(db).revoke(claims["sid"], claims["sub"])
            with pytest.raises(WebSocketDisconnect) as exc:
                await asyncio.wait_for(asyncio.to_thread(ws.receive_text), timeout=5)
            assert exc.value.code == 1008

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

    async def test_redis_failure_leaves_persisted_notification_and_retryable_outbox(self, db):
        from app.modules.m8_notifications.models import NotificationOutbox

        _ensure_user(db, USER_1)
        class BrokenRedis:
            async def publish(self, *args, **kwargs):
                raise RuntimeError("redis unavailable")

        service = NotificationService(db)
        with pytest.raises(RuntimeError, match="redis unavailable"):
            await service.publish(
                BrokenRedis(), EventType.ATTACK_INCOMING,
                {"attack_id": "failed-delivery"}, user_ids=[USER_1],
            )

        assert len(service.get_user_notifications(USER_1)) == 1
        row = db.query(NotificationOutbox).filter(
            NotificationOutbox.event_type == EventType.ATTACK_INCOMING.value
        ).one()
        assert row.delivered_at is None

    async def test_async_delivery_status_commit_failure_rolls_back_session(self, db, monkeypatch):
        from app.modules.m8_notifications.models import Notification, NotificationOutbox

        _ensure_user(db, USER_1)
        class RedisAcceptsPublish:
            async def publish(self, *args, **kwargs):
                return 1

        service = NotificationService(db)
        real_commit = db.commit
        commits = 0

        def fail_delivery_commit():
            nonlocal commits
            commits += 1
            if commits == 2:
                raise RuntimeError("delivery status commit failed")
            return real_commit()

        monkeypatch.setattr(db, "commit", fail_delivery_commit)
        with pytest.raises(RuntimeError, match="delivery status commit failed"):
            await service.publish(
                RedisAcceptsPublish(), EventType.ATTACK_INCOMING,
                {"attack_id": "commit-failure"}, user_ids=[USER_1],
            )

        row = db.query(NotificationOutbox).filter(
            NotificationOutbox.event_type == EventType.ATTACK_INCOMING.value
        ).one()
        assert row.delivered_at is None
        assert db.query(Notification).filter(
            Notification.user_id == USER_1
        ).count() == 1

    async def test_sync_delivery_status_commit_failure_rolls_back_session(self, db, monkeypatch):
        import app.core.redis as redis_module
        from app.modules.m8_notifications.models import NotificationOutbox

        service = NotificationService(db)
        row = service.enqueue(EventType.ATTACK_INCOMING, {"attack_id": "sync-commit-failure"})
        db.commit()

        class RedisAcceptsPublish:
            def publish(self, *args, **kwargs):
                return 1

        monkeypatch.setattr(redis_module, "get_sync_redis", lambda: RedisAcceptsPublish())
        monkeypatch.setattr(db, "commit", lambda: (_ for _ in ()).throw(RuntimeError("sync commit failed")))
        with pytest.raises(RuntimeError, match="sync commit failed"):
            service.publish_pending_sync()

        # A subsequent query succeeds and the delivery marker remains retryable.
        persisted = db.query(NotificationOutbox).filter(NotificationOutbox.id == row.id).one()
        assert persisted.delivered_at is None

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
