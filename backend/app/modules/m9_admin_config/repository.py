"""Admin & Game-Balance Configuration (UC-11/UC-12) — data access layer."""
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.modules.m9_admin_config.models import AdminAuditLog, GameBalanceConfig


class GameBalanceConfigRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, key: str) -> Optional[GameBalanceConfig]:
        return self.db.query(GameBalanceConfig).filter(GameBalanceConfig.key == key).first()

    def get_all(self) -> list[GameBalanceConfig]:
        return self.db.query(GameBalanceConfig).order_by(GameBalanceConfig.key).all()

    def set_value(self, key: str, value: Any, updated_by: Optional[str]) -> Optional[GameBalanceConfig]:
        row = self.get(key)
        if row is None:
            return None
        row.value = value
        row.updated_by = updated_by
        self.db.commit()
        self.db.refresh(row)
        return row


class AdminAuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        admin_user_id: str,
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> AdminAuditLog:
        """Record one administrative action (NFR-3.5 auditability)."""
        entry = AdminAuditLog(
            admin_user_id=admin_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry
