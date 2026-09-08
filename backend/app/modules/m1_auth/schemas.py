"""Authentication & Account Linking (REQ-1.x) — Pydantic schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.modules.m1_auth.models import JudgeType


class UserCreate(BaseModel):
    """Registration payload (REQ-1.1)."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Login payload (REQ-1.2)."""
    email: EmailStr
    password: str


class UserOut(BaseModel):
    """User response (no sensitive fields)."""
    id: uuid.UUID
    username: str
    email: EmailStr
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response (REQ-1.6)."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutResponse(BaseModel):
    message: str = "Logged out successfully"


class JudgeLinkRequest(BaseModel):
    """Judge account linking request (REQ-1.3)."""
    judge_type: JudgeType
    handle: str = Field(..., min_length=1, max_length=255)


class JudgeAccountOut(BaseModel):
    """Linked judge account response."""
    id: uuid.UUID
    judge_type: JudgeType
    handle: str
    verified_flag: bool
    last_sync_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class JudgeLinkResponse(BaseModel):
    """Judge linking response with verification instructions (REQ-1.4)."""
    verification_token: str
    message: str = (
        "Set your Codeforces profile First Name to this token, "
        "then call the verify endpoint."
    )
    judge_account: JudgeAccountOut


class JudgeVerifyResponse(BaseModel):
    message: str = "Judge account verified"
    judge_account: JudgeAccountOut
