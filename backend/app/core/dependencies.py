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
from app.modules.m1_auth.repository import AuthSessionRepository, UserRepository

security = HTTPBearer(auto_error=False)


async def _is_denylisted(redis: Redis, jti: str) -> bool:
    return bool(await redis.exists(f"auth:denylist:{jti}"))


async def _session_revoked(
    redis: Redis,
    payload: dict,
    db: Session | None = None,
    *,
    release_db: bool = False,
) -> bool:
    owned_db = db is None
    if db is None:
        from app.db.session import SessionLocal
        db = SessionLocal()
    try:
        if not AuthSessionRepository(db).is_active(payload["sid"], payload["sub"]):
            return True
    finally:
        if owned_db:
            db.close()
        elif release_db:
            # WebSocket dependencies can outlive a request. End the read
            # transaction after each poll so the session holds no connection
            # while the socket is idle.
            db.rollback()
    token_revoked = await redis.exists(f"auth:denylist:{payload['jti']}")
    session_revoked = await redis.exists(f"auth:session-revoked:{payload['sid']}")
    return bool(token_revoked or session_revoked)


async def _require_session(
    redis: Redis,
    payload: dict,
    db: Session | None = None,
    *,
    release_db: bool = False,
) -> None:
    try:
        revoked = await _session_revoked(redis, payload, db, release_db=release_db)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Authentication service unavailable") from exc
    if revoked:
        raise HTTPException(status_code=401, detail="Session has been logged out", headers={"WWW-Authenticate": "Bearer"})


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

    await _require_session(redis, payload, db)

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
    try:
        if await _session_revoked(redis, payload, db):
            return None
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Authentication service unavailable") from exc
    repo = UserRepository(db)
    user = repo.get_by_id(payload["sub"])
    return user if user and user.is_active and not user.is_suspended else None


def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Rejects a suspended user (UC-11) — suspension must actually bite."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive")
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
