"""Notification & Realtime Gateway — FastAPI routes + WebSocket endpoint."""
from typing import Annotated
import asyncio
import time

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.dependencies import _require_session, get_current_active_user
from app.core.logging import get_logger
from app.core.redis import get_redis
from app.core.security import verify_access_token
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m8_notifications.schemas import NotificationOut
from app.modules.m8_notifications.service import NotificationService, registry

# Kept in step with src/cp/realtime.ts.
WS_BEARER_SUBPROTOCOL = "codeforge.bearer"

logger = get_logger(__name__)

router = APIRouter(prefix="/notifications", tags=["m8_notifications"])


@router.get("", response_model=list[NotificationOut])
def get_notification_history(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(50, ge=1, le=200),
):
    service = NotificationService(db)
    return [NotificationOut.model_validate(n) for n in service.get_user_notifications(str(current_user.id), limit)]


@router.get("/unread-count")
def get_unread_count(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    service = NotificationService(db)
    return {"unread_count": service.get_unread_count(str(current_user.id))}


@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    service = NotificationService(db)
    notification = service.mark_as_read(notification_id, str(current_user.id))
    if not notification:
        return {"message": "Notification not found"}
    return {"message": "Marked as read"}


# The WebSocket route lives at /ws/events per SADD Appendix B, mounted
# directly on the app (not under /notifications) in main.py.
ws_router = APIRouter(tags=["m8_notifications"])


def _bearer_subprotocol(header: str | None) -> tuple[str | None, str | None]:
    """Split `Sec-WebSocket-Protocol: codeforge.bearer, <jwt>` into (protocol, token).

    A JWT is a valid RFC 6455 subprotocol token (base64url plus dots), so the browser
    handshake can carry it in a header instead of the URL.
    """
    if not header:
        return None, None
    parts = [part.strip() for part in header.split(",")]
    if len(parts) >= 2 and parts[0] == WS_BEARER_SUBPROTOCOL:
        return parts[0], parts[1]
    return None, None


@ws_router.websocket("/ws/events")
async def websocket_events(
    websocket: WebSocket,
    token: str | None = Query(None),
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """
    Realtime event channel (SADD Appendix B: WS /ws/events).

    Auth: the access token travels in the `Sec-WebSocket-Protocol` handshake header
    as `<protocol>, <jwt>` so it stays out of URLs and access logs; `?token=<jwt>`
    is still accepted for older clients. On connect, registers this socket in the
    process-local ConnectionRegistry and a Redis presence key with a heartbeat TTL;
    on disconnect, both are cleaned up.
    """
    subprotocol, header_token = _bearer_subprotocol(websocket.headers.get("sec-websocket-protocol"))
    access_token = header_token or token
    if not access_token:
        await websocket.close(code=1008, reason="Missing token")
        return
    try:
        payload = verify_access_token(access_token)
        user_id = payload["sub"]
        from app.modules.m1_auth.repository import UserRepository
        user = UserRepository(db).get_by_id(user_id)
        if not user or not user.is_active or user.is_suspended:
            raise ValueError("User unavailable")
        await _require_session(redis, payload, db, release_db=True)
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return

    await websocket.accept(subprotocol=subprotocol)
    registry.add(user_id, websocket)
    presence_key = f"ws:online:{user_id}"

    async def watch_session():
        while True:
            await asyncio.sleep(2)
            if payload["exp"] <= int(time.time()):
                await websocket.close(code=1008, reason="Token expired")
                return
            try:
                await _require_session(redis, payload, db, release_db=True)
            except Exception:
                await websocket.close(code=1008, reason="Session revoked or unavailable")
                return

    watcher = asyncio.create_task(watch_session())

    try:
        await redis.setex(presence_key, 60, "1")
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await redis.setex(presence_key, 60, "1")  # heartbeat refresh
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("websocket_error", user_id=user_id)
    finally:
        watcher.cancel()
        try:
            await watcher
        except asyncio.CancelledError:
            pass
        registry.remove(user_id, websocket)
