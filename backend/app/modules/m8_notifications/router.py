"""Notification & WebSocket Router (REQ-8.x)

FastAPI route definitions for WebSocket and notifications.
Owns: HTTP-facing endpoints and WebSocket handler.
"""
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from typing import Annotated
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.core.security import verify_token
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m8_notifications.service import NotificationService
from app.modules.m8_notifications.schemas import NotificationOut, ConnectionStatusOut
from uuid import UUID

router = APIRouter(prefix="/notifications", tags=["m8_notifications"])


@router.get("/status", response_model=ConnectionStatusOut)
def get_connection_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> ConnectionStatusOut:
    """Get WebSocket connection status for current user."""
    service = NotificationService(db)
    status = service.get_connection_status(current_user.id)
    return ConnectionStatusOut(**status)


@router.get("/history")
def get_notification_history(
    limit: int = Query(50, ge=1, le=200),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None
) -> list:
    """Get notification history for current user."""
    service = NotificationService(db)
    notifications = service.get_user_notifications(current_user.id, limit=limit)
    return [NotificationOut.model_validate(n) for n in notifications]


@router.post("/mark-read/{notification_id}")
def mark_notification_read(
    notification_id: str,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Annotated[Session, Depends(get_db)] = None
) -> dict:
    """Mark a notification as read."""
    service = NotificationService(db)
    try:
        notif_uuid = UUID(notification_id)
        service.mark_as_read(notif_uuid)
        return {"message": "Marked as read"}
    except (ValueError, AttributeError):
        return {"error": "Invalid notification ID"}


async def handle_ws_session(websocket: WebSocket, token: str):
    if not token:
        await websocket.close(code=1008, reason="Token required")
        return

    try:
        user_id = verify_token(token)
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return

    await websocket.accept()

    for db in get_db():
        service = NotificationService(db)
        connection_record = service.register_connection(user_id, websocket, f"ws-{user_id}")
        break

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        service.unregister_connection(user_id, websocket)
    except Exception:
        service.unregister_connection(user_id, websocket)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    """WebSocket endpoint for realtime notifications (/notifications/ws)."""
    await handle_ws_session(websocket, token)
