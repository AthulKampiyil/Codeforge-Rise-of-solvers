"""Notification & Realtime Gateway — FastAPI routes + WebSocket endpoint."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.core.logging import get_logger
from app.core.redis import get_redis
from app.core.security import verify_access_token
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m8_notifications.schemas import NotificationOut
from app.modules.m8_notifications.service import NotificationService, registry

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


@ws_router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket, token: str = Query(...)):
    """
    Realtime event channel (SADD Appendix B: WS /ws/events).

    Auth: `?token=<jwt access token>`. On connect, registers this
    socket in the process-local ConnectionRegistry and a Redis presence
    key with a heartbeat TTL; on disconnect, both are cleaned up.
    """
    try:
        payload = verify_access_token(token)
        user_id = payload["sub"]
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return

    await websocket.accept()
    registry.add(user_id, websocket)

    from app.core.redis import get_async_redis

    redis: Redis = get_async_redis()
    presence_key = f"ws:online:{user_id}"
    await redis.setex(presence_key, 60, "1")

    try:
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
        registry.remove(user_id, websocket)
        await redis.aclose()
