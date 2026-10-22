"""Shared FastAPI dependencies (current_user, db session, role checks)."""
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy.orm import Session

from app.core.errors import AccountSuspended, ForbiddenError, NotGuildMember
from app.core.redis import get_redis
from app.core.security import verify_access_token
from app.db.session import get_db
from app.modules.m1_auth.models import User
from app.modules.m1_auth.repository import UserRepository

security = HTTPBearer(auto_error=False)


async def _is_denylisted(redis: Redis, jti: str) -> bool:
    return bool(await redis.exists(f"auth:denylist:{jti}"))


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[Session, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> User:
    """
    Dependency to extract and validate current user from JWT access token.

    Used by every protected endpoint in the app. This is the contract
    that all other modules (M2–M9) depend on — don't change the
    signature or return type without notifying the team.

    Raises:
        HTTPException: 401 if token is missing, invalid, expired,
        denylisted (REQ-1.6 logout), or the user no longer exists.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_access_token(credentials.credentials)

    if await _is_denylisted(redis, payload["jti"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been logged out",
            headers={"WWW-Authenticate": "Bearer"},
        )

    repo = UserRepository(db)
    user = repo.get_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


async def get_optional_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[Session, Depends(get_db)],
    redis: Annotated[Redis, Depends(get_redis)],
) -> Optional[User]:
    """
    Like get_current_user, but returns None instead of raising when
    unauthenticated — for endpoints a Guest/Visitor may also use, e.g.
    public leaderboards (SADD 9.3).
    """
    if credentials is None:
        return None
    try:
        payload = verify_access_token(credentials.credentials)
    except HTTPException:
        return None
    if await _is_denylisted(redis, payload["jti"]):
        return None
    repo = UserRepository(db)
    return repo.get_by_id(payload["sub"])


def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Rejects a suspended user (UC-11) — suspension must actually bite."""
    if current_user.is_suspended:
        raise AccountSuspended("Your account has been suspended.")
    return current_user


def require_admin(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """Only an Admin/Moderator may access account/guild management (NFR-3.3)."""
    if not current_user.is_admin:
        raise ForbiddenError("Admin privileges required.")
    return current_user


def require_guild_role(*roles: str):
    """
    Dependency factory: only a member of the path's {guild_id} holding
    one of `roles` may proceed (NFR-3.3 — e.g. War Room is Leader/Officer
    only). Deferred import of M5 avoids a module import cycle at load time.
    """

    def dependency(
        guild_id: str,
        current_user: Annotated[User, Depends(get_current_active_user)],
        db: Annotated[Session, Depends(get_db)],
    ) -> User:
        from app.modules.m5_guild_territory.repository import GuildMembershipRepository

        membership = GuildMembershipRepository(db).get_membership(guild_id, current_user.id)
        if not membership or (roles and membership.role not in roles):
            raise NotGuildMember("You do not have the required guild role for this action.")
        return current_user

    return dependency
