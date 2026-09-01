"""Password hashing, session/token handling for M1 (NFR-3.2)."""
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status
from app.core.config import settings

# Password hashing context (bcrypt per NFR-3.2)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt (NFR-3.2)."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: UUID | str, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token (REQ-1.6: valid 7 days idle).
    
    Args:
        user_id: The user's UUID
        expires_delta: Optional custom expiration; defaults to config value
        
    Returns:
        Signed JWT string
    """
    to_encode = {"sub": str(user_id)}
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(user_id: UUID | str) -> str:
    """
    Create a long-lived refresh token for session renewal.
    
    Args:
        user_id: The user's UUID
        
    Returns:
        Signed JWT string
    """
    to_encode = {"sub": str(user_id), "type": "refresh"}
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> str:
    """
    Verify and decode a JWT access token.
    
    Args:
        token: The JWT string
        
    Returns:
        The user_id (sub claim) if valid
        
    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

