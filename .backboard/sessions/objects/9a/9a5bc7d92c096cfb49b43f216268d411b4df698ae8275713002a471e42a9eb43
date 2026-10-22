"""Password hashing, JWT token handling for M1 (NFR-3.2, REQ-1.6)."""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context (bcrypt per NFR-3.2)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt (NFR-3.2)."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: UUID | str, expires_delta: timedelta | None = None) -> tuple[str, str]:
    """
    Create a JWT access token (REQ-1.6: valid 7 days idle).

    Every access token carries a `jti` (JWT ID) claim so that logout
    can denylist this specific token in Redis (REQ-1.6: "can explicitly
    log out at any time to invalidate that session") without needing a
    stateful session store for every request.

    Returns:
        (encoded_jwt, jti) — the caller needs the jti to know the
        denylist key if it wants to revoke immediately (not used today,
        but keeps the door open for "log out all other sessions").
    """
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"sub": str(user_id), "jti": jti, "type": "access", "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt, jti


def create_refresh_token(user_id: UUID | str) -> tuple[str, str]:
    """Create a long-lived refresh token for session renewal. Returns (token, jti)."""
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": str(user_id), "jti": jti, "type": "refresh", "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt, jti


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT's signature/expiry only (no type check,
    no denylist check — callers that need those do them explicitly).

    Raises:
        HTTPException: 401 if the token is malformed, unsigned, or expired.
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_access_token(token: str) -> dict[str, Any]:
    """
    Decode an access token and enforce type == "access".

    Sprint 1's verify_token() accepted a refresh token as a valid bearer
    credential (it only checked the signature, never the `type` claim),
    which let a long-lived refresh token be used as a permanent access
    token. This is the fix: refresh tokens are rejected here.
    """
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not an access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not payload.get("sub") or not payload.get("jti"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def verify_refresh_token(token: str) -> dict[str, Any]:
    """Decode a refresh token and enforce type == "refresh"."""
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not a refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
