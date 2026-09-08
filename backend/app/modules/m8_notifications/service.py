"""Notification & Realtime Gateway (SADD 4.4) — Redis pub/sub fan-out.

Sprint 1 kept a module-global Python dict of live WebSocket objects.
That cannot work once more than one process exists: the Background
Worker resolves attacks and recalculates territory in a *different
process* than whichever API node holds a given user's socket, so a
Worker-originated event could never reach a client. This rewrite
publishes every event to Redis; each API node subscribes and forwards
to whichever sockets it happens to be holding locally — the property
that lets the stateless API tier scale horizontally (SADD 2.2.1).
"""
import json
import uuid
from typing import Iterable, Literal, Optional, Union
from uuid import UUID

from fastapi import WebSocket
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.modules.m8_notifications.models import Notification
from app.modules.m8_notifications.schemas import EventEnvelope, EventType

logger = get_logger(__name__)

CHANNEL = "codeforge:events"


class ConnectionRegistry:
    """
    Per-process registry of locally-held WebSocket connections.

    Deliberately a plain in-memory structure, not Redis: Redis only
    needs to know that a user is "online somewhere" (for presence,
    plan.md Phase 3 `ws:online:{user_id}`); it never needs to route a
    message to a WebSocket object, which only exists inside one
    process's memory.
    """

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}

    def add(self, user_id: str, ws: WebSocket) -> None:
        self._connections.setdefault(user_id, set()).add(ws)

    def remove(self, user_id: str, ws: WebSocket) -> None:
        sockets = self._connections.get(user_id)
        if sockets:
            sockets.discard(ws)
            if not sockets:
                del self._connections[user_id]

    def get(self, user_id: str) -> set[WebSocket]:
        return self._connections.get(user_id, set())

    def all_sockets(self) -> list[WebSocket]:
        return [ws for sockets in self._connections.values() for ws in sockets]


# One registry per process (module-level singleton is correct here —
# it is process-local state by design, not shared mutable global state
# that needs to be avoided).
registry = ConnectionRegistry()


class NotificationService:
    """Publishes domain events and serves notification history."""

    def __init__(self, db: Session):
        self.db = db

    async def publish(
        self,
        redis: Redis,
        event_type: EventType,
        payload: dict,
        user_ids: Optional[Iterable[Union[UUID, str]]] = None,
        broadcast: bool = False,
    ) -> None:
        """
        Publish a domain event (SADD Appendix B.1 envelope) via Redis
        pub/sub, and persist it to notification history for each
        targeted user (broadcast events are ambient map/state changes,
        not personal notifications, so they are not persisted per-user).
        """
        envelope = EventEnvelope(event_type=event_type, payload=payload)
        target_ids = [str(u) for u in user_ids] if user_ids else None

        message = {
            "envelope": json.loads(envelope.model_dump_json()),
            "target_user_ids": target_ids,
            "broadcast": broadcast,
        }
        await redis.publish(CHANNEL, json.dumps(message))

        if target_ids:
            for uid in target_ids:
                self._persist(uid, event_type.value, payload)

    def _persist(self, user_id: str, event_type: str, payload: dict) -> Notification:
        notification = Notification(user_id=user_id, event_type=event_type, payload=payload)
        self.db.add(notification)
        self.db.commit()
        return notification

    def get_user_notifications(self, user_id: str, limit: int = 50) -> list[Notification]:
        return self.db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).limit(limit).all()

    def get_unread_count(self, user_id: str) -> int:
        return self.db.query(Notification).filter(
            Notification.user_id == user_id, Notification.is_read == False  # noqa: E712
        ).count()

    def mark_as_read(self, notification_id: str, user_id: str) -> Optional[Notification]:
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id, Notification.user_id == user_id
        ).first()
        if notification:
            notification.is_read = True
            self.db.commit()
        return notification


async def run_subscriber_loop(redis_client: Redis) -> None:
    """
    Long-running task, one per API process, started in main.py's
    lifespan. Subscribes to the shared event channel and forwards each
    message to whichever sockets this process happens to hold locally.

    A node holding none of a message's target sockets simply drops it
    at zero cost — this is what SADD 2.2.1's "stateless application
    nodes can be scaled horizontally" actually requires in practice.
    """
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(CHANNEL)
    logger.info("realtime_subscriber_started", channel=CHANNEL)

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            try:
                data = json.loads(message["data"])
                envelope = data["envelope"]

                if data.get("broadcast"):
                    targets = registry.all_sockets()
                else:
                    targets = []
                    for uid in data.get("target_user_ids") or []:
                        targets.extend(registry.get(uid))

                for ws in targets:
                    try:
                        await ws.send_json(envelope)
                    except Exception:
                        # Socket likely closed between lookup and send;
                        # the WS handler's own disconnect path cleans it up.
                        pass
            except Exception:
                logger.exception("realtime_subscriber_message_error")
    finally:
        await pubsub.unsubscribe(CHANNEL)
        await pubsub.aclose()
