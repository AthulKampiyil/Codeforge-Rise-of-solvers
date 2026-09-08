"""Authentication & Account Linking (REQ-1.x) — business logic."""
import secrets
from datetime import datetime, timedelta, timezone

from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.errors import (
    AlreadyLinked,
    EmailAlreadyRegistered,
    InvalidCredentials,
    UsernameAlreadyTaken,
    VerificationFailed,
    VerificationTokenNotFound,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_refresh_token,
)
from app.modules.m1_auth.models import JudgeAccount, JudgeType, User
from app.modules.m1_auth.repository import JudgeAccountRepository, UserRepository
from app.modules.m1_auth.schemas import UserCreate, UserLogin
from app.modules.m2_platform_sync.service import PlatformSyncService


class AuthService:
    """Authentication & judge linking service (M1)."""

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.judge_repo = JudgeAccountRepository(db)
        self.sync_service = PlatformSyncService()
        self.db = db

    def register(self, payload: UserCreate) -> User:
        """Register a new user (REQ-1.1, NFR-3.2)."""
        if self.user_repo.get_by_email(payload.email):
            raise EmailAlreadyRegistered("Email already registered")
        if self.user_repo.get_by_username(payload.username):
            raise UsernameAlreadyTaken("Username already taken")

        return self.user_repo.create(
            username=payload.username,
            email=payload.email,
            password_hash=hash_password(payload.password),
        )

    def authenticate(self, payload: UserLogin) -> User:
        """Authenticate user (REQ-1.2). Generic error to prevent user enumeration."""
        user = self.user_repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise InvalidCredentials("Incorrect email or password")
        return user

    def issue_tokens(self, user_id: str) -> tuple[str, str]:
        """Issue access & refresh tokens (REQ-1.6: 7-day idle validity)."""
        access_token, _ = create_access_token(user_id)
        refresh_token, _ = create_refresh_token(user_id)
        return access_token, refresh_token

    async def logout(self, redis: Redis, jti: str, exp: int) -> None:
        """
        Invalidate the current session (REQ-1.6).

        Denylists this token's jti in Redis until its natural expiry —
        after that point it would be rejected on expiry alone, so the
        denylist entry can safely expire too.
        """
        remaining = exp - int(datetime.now(timezone.utc).timestamp())
        if remaining > 0:
            await redis.setex(f"auth:denylist:{jti}", remaining, "1")

    async def refresh(self, redis: Redis, refresh_token: str) -> tuple[str, str]:
        """
        Rotate a refresh token (REQ-1.6 session renewal).

        The old refresh token's jti is denylisted immediately so it
        cannot be replayed after rotation.
        """
        payload = verify_refresh_token(refresh_token)
        user_id = payload["sub"]

        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise InvalidCredentials("User no longer exists")

        if await redis.exists(f"auth:denylist:{payload['jti']}"):
            raise InvalidCredentials("Refresh token has been revoked")

        remaining = payload["exp"] - int(datetime.now(timezone.utc).timestamp())
        if remaining > 0:
            await redis.setex(f"auth:denylist:{payload['jti']}", remaining, "1")

        access_token, _ = create_access_token(user_id)
        new_refresh_token, _ = create_refresh_token(user_id)
        return access_token, new_refresh_token

    def request_judge_link(self, user_id: str, judge_type: JudgeType, handle: str) -> tuple[JudgeAccount, str]:
        """
        Request judge account linking (REQ-1.3, REQ-1.4).

        Generates a one-time verification token the user must place in
        their Codeforces profile "First Name" field to prove ownership.
        """
        existing = self.judge_repo.get_by_user_and_judge(user_id, judge_type)
        if existing and existing.verified_flag:
            raise AlreadyLinked(f"Already linked to {judge_type.value}")

        verification_token = f"codeforge-{secrets.token_urlsafe(12)}"

        if existing:
            self.judge_repo.delete(existing.id)

        account = self.judge_repo.create(
            user_id=user_id,
            judge_type=judge_type,
            handle=handle,
            verification_token=verification_token,
        )
        return account, verification_token

    async def verify_judge_account(self, judge_account_id: str) -> JudgeAccount:
        """
        Verify a judge account by checking the token against the judge's
        public profile (REQ-1.4, NFR-3.1).

        No credentials are ever transmitted or stored (NFR-3.2) — only
        the public handle and a comparison against a public profile field.
        """
        account = self.judge_repo.get_by_id(judge_account_id)
        if not account:
            raise VerificationTokenNotFound("Judge account not found")

        if not self.sync_service.has_adapter(account.judge_type):
            raise VerificationFailed(f"{account.judge_type.value} is not yet supported")

        user_info = await self.sync_service.fetch_user_info(account.judge_type, account.handle)
        if user_info is None or user_info.display_name != account.verification_token:
            raise VerificationFailed(
                "Verification token not found on profile. "
                f"Set your Codeforces First Name to '{account.verification_token}' and try again."
            )

        return self.judge_repo.mark_verified(account.id)

    def unlink_judge(self, user_id: str, judge_type: JudgeType) -> bool:
        """Unlink a judge account (REQ-1.5)."""
        account = self.judge_repo.get_by_user_and_judge(user_id, judge_type)
        if not account:
            raise VerificationTokenNotFound(f"No linked account for {judge_type.value}")
        return self.judge_repo.delete(account.id)

    def get_user_judge_accounts(self, user_id: str) -> list[JudgeAccount]:
        return self.judge_repo.get_by_user(user_id)
