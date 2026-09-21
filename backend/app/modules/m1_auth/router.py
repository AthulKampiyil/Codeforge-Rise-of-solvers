"""Authentication & Account Linking (REQ-1.x) — FastAPI routes."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_current_user
from app.core.redis import get_redis
from app.core.security import verify_access_token
from app.db.session import get_db
from app.modules.m1_auth.models import JudgeType, User
from app.modules.m1_auth.repository import JudgeAccountRepository
from app.modules.m1_auth.schemas import (
    JudgeAccountOut,
    JudgeLinkRequest,
    JudgeLinkResponse,
    JudgeVerifyResponse,
    LogoutResponse,
    RefreshRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserOut,
)
from app.modules.m1_auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["m1_auth"])
security = HTTPBearer()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Annotated[Session, Depends(get_db)]):
    """Register a new user (REQ-1.1)."""
    service = AuthService(db)
    return service.register(payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Annotated[Session, Depends(get_db)]):
    """Login and receive JWT tokens (REQ-1.2, REQ-1.6)."""
    service = AuthService(db)
    user = service.authenticate(payload)
    access_token, refresh_token = service.issue_tokens(str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
):
    """Rotate a refresh token for a new access/refresh pair (REQ-1.6)."""
    service = AuthService(db)
    access_token, new_refresh_token = await service.refresh(redis, payload.refresh_token)
    from app.core.security import decode_token
    user_id = decode_token(access_token)["sub"]
    user = service.user_repo.get_by_id(user_id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserOut.model_validate(user),
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
):
    """
    Logout and invalidate session (REQ-1.6).

    Denylists this access token's jti in Redis so it is rejected on
    every subsequent request, even though it hasn't expired yet.
    """
    payload = verify_access_token(credentials.credentials)
    service = AuthService(db)
    await service.logout(redis, payload["jti"], payload["exp"])
    return LogoutResponse()


@router.get("/me", response_model=UserOut)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.post("/judge-accounts", response_model=JudgeLinkResponse)
def request_judge_link(
    payload: JudgeLinkRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Request judge account linking (REQ-1.3, REQ-1.4)."""
    service = AuthService(db)
    account, token = service.request_judge_link(str(current_user.id), payload.judge_type, payload.handle)
    return JudgeLinkResponse(
        verification_token=token,
        judge_account=JudgeAccountOut.model_validate(account),
    )


@router.post("/judge-accounts/{judge_account_id}/verify", response_model=JudgeVerifyResponse)
async def verify_judge_account(
    judge_account_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Complete ownership verification (REQ-1.4, NFR-3.1)."""
    service = AuthService(db)
    account = await service.verify_judge_account(judge_account_id)
    return JudgeVerifyResponse(judge_account=JudgeAccountOut.model_validate(account))


@router.get("/judge-accounts", response_model=list[JudgeAccountOut])
def get_my_judge_accounts(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get all linked judge accounts for the current user."""
    repo = JudgeAccountRepository(db)
    return repo.get_by_user(str(current_user.id))


@router.delete("/judge-accounts/{judge_type}")
def unlink_judge(
    judge_type: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Unlink a judge account (REQ-1.5)."""
    try:
        judge = JudgeType(judge_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid judge type. Supported: {', '.join(j.value for j in JudgeType)}",
        )

    service = AuthService(db)
    service.unlink_judge(str(current_user.id), judge)
    return {"message": f"Unlinked from {judge_type}"}
