"""Authentication & Account Linking (REQ-1.x)

FastAPI route definitions for this module.
Owns: HTTP-facing endpoints only. Delegate business logic to service.py.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.m1_auth.service import AuthService
from app.modules.m1_auth.schemas import (
    UserCreate, UserLogin, TokenResponse, LogoutResponse,
    JudgeLinkRequest, JudgeLinkResponse, UserOut, LinkedJudgeProfileOut
)
from app.modules.m1_auth.models import User

router = APIRouter(prefix="/auth", tags=["m1_auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserCreate,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Register a new user (REQ-1.1).
    
    - Email and username must be unique
    - Password must be at least 8 characters
    - Password is hashed with bcrypt (NFR-3.2), never stored plaintext
    """
    service = AuthService(db)
    user = service.register(payload)
    return user


@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLogin,
    db: Annotated[Session, Depends(get_db)]
):
    """
    Login and receive JWT tokens (REQ-1.2, REQ-1.6).
    
    - Access token valid for 7 days of idle time (REQ-1.6)
    - Refresh token for session renewal
    - Returns generic "Incorrect email or password" to prevent user enumeration
    """
    service = AuthService(db)
    user = service.authenticate(payload)
    access_token, refresh_token = service.issue_tokens(str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.from_orm(user)
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Logout and invalidate session (REQ-1.6).
    
    TODO: In a real system, we'd blacklist the token here using Redis.
    For Sprint 1, this is a stub endpoint that always succeeds.
    """
    # TODO (Sprint 2): Blacklist token in Redis
    return LogoutResponse()


@router.post("/judges/link", response_model=JudgeLinkResponse)
def request_judge_link(
    payload: JudgeLinkRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Request judge profile linking (REQ-1.3, REQ-1.4).
    
    Generates a one-time verification token that the user must submit
    as a comment/proof on the judge platform to prove handle ownership.
    
    TODO (Sprint 2): Wire verification to M2 judge adapters
    to confirm the token actually appears on the judge platform.
    """
    service = AuthService(db)
    profile, token = service.request_judge_link(
        str(current_user.id),
        payload.judge_name,
        payload.handle
    )
    return JudgeLinkResponse(
        verification_token=token,
        linked_profile=LinkedJudgeProfileOut.from_orm(profile)
    )


@router.delete("/judges/{judge_name}", response_model=dict)
def unlink_judge(
    judge_name: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Unlink a judge profile (REQ-1.5).
    
    Only the user who linked the judge can unlink it.
    """
    from app.modules.m1_auth.models import JudgeName
    
    try:
        judge = JudgeName(judge_name)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid judge name. Supported: {', '.join([j.value for j in JudgeName])}"
        )
    
    service = AuthService(db)
    service.unlink_judge(str(current_user.id), judge)
    return {"message": f"Unlinked from {judge_name}"}


@router.get("/judges/me", response_model=list[LinkedJudgeProfileOut])
def get_my_judges(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get all linked judge profiles for the current user.
    """
    service = AuthService(db)
    from app.modules.m1_auth.repository import LinkedJudgeProfileRepository
    repo = LinkedJudgeProfileRepository(db)
    profiles = repo.get_by_user(str(current_user.id))
    return [LinkedJudgeProfileOut.from_orm(p) for p in profiles]

