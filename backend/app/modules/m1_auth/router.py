"""Authentication & Account Linking (REQ-1.x) — FastAPI routes."""
from typing import Annotated
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_current_user
from app.core.redis import get_redis
from app.core.security import verify_access_token, verify_refresh_token
from app.db.session import get_db
from app.modules.m1_auth.models import JudgeAccount, JudgeType, User
from app.modules.m1_auth.repository import JudgeAccountRepository
from app.modules.m1_auth.schemas import (
    JudgeAccountOut,
    JudgeLinkRequest,
    JudgeLinkResponse,
    JudgeVerifyResponse,
    PendingJudgeProofOut,
    LogoutRequest,
    LogoutResponse,
    RefreshRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserOut,
)
from app.modules.m1_auth.service import AuthService
from app.modules.m2_platform_sync.rate_gate import CodeforcesRateBusy

router = APIRouter(prefix="/auth", tags=["m1_auth"])
security = HTTPBearer(auto_error=False)


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
    try:
        access_token, new_refresh_token = await service.refresh(redis, payload.refresh_token)
    except Exception as exc:
        from redis.exceptions import RedisError
        from sqlalchemy.exc import SQLAlchemyError
        if isinstance(exc, (RedisError, SQLAlchemyError)):
            raise HTTPException(status_code=503, detail="Authentication service unavailable") from exc
        raise
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
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
    payload: LogoutRequest | None = None,
):
    """Revoke a session using an access token, refresh token, or both."""
    refresh_token = payload.refresh_token if payload else None
    refresh_claims = None
    if refresh_token:
        try:
            refresh_claims = verify_refresh_token(refresh_token)
        except HTTPException:
            # A valid access credential can independently authorize logout.
            refresh_claims = None

    access_claims = None
    access_expired = False
    if credentials is not None:
        try:
            access_claims = verify_access_token(credentials.credentials)
        except HTTPException:
            # Expired access can identify its session only with a valid refresh
            # credential for that same session. Other invalid access tokens
            # don't prevent a separately valid refresh credential from logout.
            if refresh_claims is not None:
                try:
                    candidate = verify_access_token(credentials.credentials, allow_expired=True)
                except HTTPException:
                    candidate = None
                if candidate is not None and candidate["exp"] <= int(datetime.now(timezone.utc).timestamp()):
                    access_claims = candidate
                    access_expired = True

    if refresh_claims is None and access_claims is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid access or refresh token required")
    if access_expired and refresh_claims is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired access token requires a valid refresh token")
    if access_claims is not None and refresh_claims is not None and (
        access_claims["sub"] != refresh_claims["sub"] or access_claims["sid"] != refresh_claims["sid"]
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tokens belong to different sessions")

    session_claims = access_claims or refresh_claims
    assert session_claims is not None
    service = AuthService(db)
    try:
        await service.logout(
            redis,
            session_claims["sid"],
            access_jti=access_claims["jti"] if access_claims else None,
            access_exp=access_claims["exp"] if access_claims else None,
            refresh_jti=refresh_claims["jti"] if refresh_claims else None,
            refresh_exp=refresh_claims["exp"] if refresh_claims else None,
            user_id=session_claims["sub"],
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Authentication service unavailable") from exc
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
    try:
        account = await service.verify_judge_account(judge_account_id, str(current_user.id))
    except CodeforcesRateBusy as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Codeforces is temporarily rate limited; retry verification shortly",
            headers={"Retry-After": str(max(1, int(exc.retry_after + 0.999)))},
        ) from exc
    return JudgeVerifyResponse(judge_account=JudgeAccountOut.model_validate(account))


@router.get("/judge-accounts", response_model=list[JudgeAccountOut])
def get_my_judge_accounts(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get all linked judge accounts for the current user."""
    repo = JudgeAccountRepository(db)
    return repo.get_by_user(str(current_user.id))


@router.get(
    "/judge-accounts/{judge_account_id}/pending-proof",
    response_model=PendingJudgeProofOut,
)
def get_pending_judge_proof(
    judge_account_id: UUID,
    response: Response,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PendingJudgeProofOut:
    """Retrieve the existing proof token for an owned, unverified account."""
    response.headers["Cache-Control"] = "no-store"
    account = db.query(JudgeAccount).filter(
        JudgeAccount.id == judge_account_id,
        JudgeAccount.user_id == current_user.id,
        JudgeAccount.verified_flag.is_(False),
    ).one_or_none()
    if account is None or not account.verification_token:
        raise HTTPException(
            status_code=404,
            detail="Pending proof not found",
            headers={"Cache-Control": "no-store"},
        )
    return PendingJudgeProofOut(verification_token=account.verification_token)


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
