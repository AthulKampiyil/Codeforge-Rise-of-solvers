"""Admin & Game-Balance Configuration (UC-11/UC-12) — Pydantic request/response schemas."""
import uuid
from datetime import datetime
from typing import Union

from pydantic import BaseModel, Field

ConfigValue = Union[int, float, dict, str]


class ConfigEntryOut(BaseModel):
    """One row of `game_balance_config` (GET /admin/config)."""
    key: str
    value: ConfigValue
    value_type: str
    description: str | None
    updated_by: uuid.UUID | None
    updated_at: datetime

    class Config:
        from_attributes = True


class ConfigUpdateRequest(BaseModel):
    """PUT /admin/config/{key} body. Type is validated server-side against
    the key's stored `value_type` — the client doesn't declare it."""
    value: ConfigValue


class ConfigUpdateResponse(BaseModel):
    key: str
    value: ConfigValue
    value_type: str
    updated_by: uuid.UUID | None
    updated_at: datetime

    class Config:
        from_attributes = True


class UserAdminOut(BaseModel):
    """One row of the admin user-moderation list (UC-11)."""
    id: uuid.UUID
    username: str
    email: str
    is_admin: bool
    is_suspended: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SuspendUserRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=500)


class AuditLogEntryOut(BaseModel):
    """One row of `admin_audit_log` (NFR-3.5)."""
    id: uuid.UUID
    admin_user_id: uuid.UUID
    action: str
    target_type: str | None
    target_id: str | None
    details: dict | None
    created_at: datetime

    class Config:
        from_attributes = True
