"""Notification & WebSocket Service (REQ-8.x)

Business logic for WebSocket connections and event broadcasting.
Owns: Connection registry, event broadcasting. Called by router.
"""
from uuid import UUID, uuid4
from datetime import datetime
from typing import Dict, Optional, Callable
from sqlalchemy.orm import Session
from app.modules.m8_notifications.models import WebSocketConnection, Notification


# Global connection registry: {user_id: [WebSocket, ...]}
# In production, use Redis for distributed systems
active_connections: Dict[UUID, list] = {}


class NotificationService:
    """WebSocket and notification management."""

    def __init__(self, db: Session):
        self.db = db

    def register_connection(self, user_id: UUID, websocket, session_id: str) -> WebSocketConnection:
        """Register a new WebSocket connection."""
        connection = WebSocketConnection(
            id=uuid4(),
            user_id=user_id,
            session_id=session_id,
            is_active=True
        )
        self.db.add(connection)
        self.db.commit()
        self.db.refresh(connection)

        # Add to active connections registry
        if user_id not in active_connections:
            active_connections[user_id] = []
        active_connections[user_id].append(websocket)

        return connection

    def unregister_connection(self, user_id: UUID, websocket) -> bool:
        """Unregister a WebSocket connection."""
        if user_id in active_connections:
            try:
                active_connections[user_id].remove(websocket)
                if not active_connections[user_id]:
                    del active_connections[user_id]
                return True
            except ValueError:
                return False
        return False

    def get_user_connections(self, user_id: UUID) -> list:
        """Get all active WebSocket connections for a user."""
        return active_connections.get(user_id, [])

    async def broadcast_to_user(self, user_id: UUID, event: dict) -> int:
        """
        Broadcast event to all connections for a user.
        
        Returns: Number of successful sends
        """
        connections = self.get_user_connections(user_id)
        success_count = 0

        for connection in connections:
            try:
                await connection.send_json(event)
                success_count += 1
            except Exception:
                # Connection likely closed; skip
                pass

        return success_count

    async def broadcast_to_all(self, event: dict) -> int:
        """
        Broadcast event to all connected users.
        
        Returns: Number of successful sends
        """
        total_sent = 0

        for user_id, connections in active_connections.items():
            for connection in connections:
                try:
                    await connection.send_json(event)
                    total_sent += 1
                except Exception:
                    pass

        return total_sent

    def log_notification(self, user_id: UUID, event_type: str, payload: str = None) -> Notification:
        """Log a notification to database for persistence."""
        notification = Notification(
            id=uuid4(),
            user_id=user_id,
            event_type=event_type,
            payload=payload,
            is_read=False
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_user_notifications(self, user_id: UUID, limit: int = 50) -> list:
        """Get recent notifications for user."""
        return self.db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).limit(limit).all()

    def mark_as_read(self, notification_id: UUID) -> Notification:
        """Mark notification as read."""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id
        ).first()
        if notification:
            notification.is_read = True
            self.db.commit()
            self.db.refresh(notification)
        return notification

    def get_connection_status(self, user_id: UUID) -> dict:
        """Get connection status for user."""
        is_connected = user_id in active_connections and len(active_connections[user_id]) > 0
        
        # Get last connection from DB
        last_connection = self.db.query(WebSocketConnection).filter(
            WebSocketConnection.user_id == user_id
        ).order_by(WebSocketConnection.connected_at.desc()).first()

        return {
            "user_id": user_id,
            "is_connected": is_connected,
            "last_connection": last_connection.connected_at if last_connection else None
        }
