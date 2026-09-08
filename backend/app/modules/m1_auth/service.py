import secrets
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.modules.m1_auth.repository import UserRepository, LinkedJudgeProfileRepository
from app.modules.m1_auth.models import JudgeName
from app.modules.m1_auth.schemas import UserCreate, UserLogin
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token


class AuthService:
    """Authentication & judge linking service (M1)."""

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.judge_repo = LinkedJudgeProfileRepository(db)
        self.db = db

    def register(self, payload: UserCreate):
        """Register a new user (REQ-1.1, NFR-3.2)."""
        if self.user_repo.get_by_email(payload.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        if self.user_repo.get_by_username(payload.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        user = self.user_repo.create(
            username=payload.username,
            email=payload.email,
            hashed_password=hash_password(payload.password),
        )
        return user

    def authenticate(self, payload: UserLogin):
        """Authenticate user (REQ-1.2, reject without user enumeration)."""
        user = self.user_repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            # Generic error message to prevent user enumeration
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        return user

    def issue_tokens(self, user_id: str):
        """Issue access & refresh tokens (REQ-1.6: 7-day idle validity)."""
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        return access_token, refresh_token

    def request_judge_link(self, user_id: str, judge_name: JudgeName, handle: str):
        """
        Request judge profile linking (REQ-1.3, REQ-1.4).
        
        Generates a one-time verification token the user must submit
        as proof of handle ownership on the judge platform.
        """
        # Check if already linked
        existing = self.judge_repo.get_by_user_and_judge(user_id, judge_name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Already linked to {judge_name.value}"
            )

        # Generate verification token
        verification_token = secrets.token_urlsafe(32)

        # Create profile (unverified)
        profile = self.judge_repo.create(
            user_id=user_id,
            judge_name=judge_name,
            handle=handle,
            verification_token=verification_token
        )

        return profile, verification_token

    def verify_judge_profile(self, verification_token: str):
        """
        Verify a judge profile by token (REQ-1.4).
        
        TODO: This will be wired to M2's judge adapters in Sprint 2
        to confirm the user actually posted the verification token
        on the judge platform. For now, stub as always-pass with a
        TODO comment for whoever wires it up.
        """
        profile = self.judge_repo.get_by_verification_token(verification_token)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Verification token not found"
            )

        # TODO (Sprint 2): Call M2 adapter to confirm token posted on judge
        # For now, always approve (stub).
        verified_profile = self.judge_repo.verify(profile.id)
        return verified_profile

    def unlink_judge(self, user_id: str, judge_name: JudgeName) -> bool:
        """Unlink a judge profile (REQ-1.5)."""
        profile = self.judge_repo.get_by_user_and_judge(user_id, judge_name)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No linked profile for {judge_name.value}"
            )
        return self.judge_repo.delete(profile.id)
