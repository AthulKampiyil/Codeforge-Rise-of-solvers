import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.modules.m1_auth.models import JudgeName


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


class LogoutResponse(BaseModel):
    """Logout confirmation."""
    message: str = "Logged out successfully"


class JudgeLinkRequest(BaseModel):
    """Judge account linking request (REQ-1.3)."""
    judge_name: JudgeName
    handle: str = Field(..., min_length=1, max_length=255)


class LinkedJudgeProfileOut(BaseModel):
    """Linked judge profile response."""
    id: uuid.UUID
    judge_name: JudgeName
    handle: str
    verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class JudgeLinkResponse(BaseModel):
    """Judge linking response with verification token (REQ-1.4)."""
    verification_token: str
    message: str = "Link request created. Submit this token as a comment on a solved problem to verify."
    linked_profile: LinkedJudgeProfileOut
