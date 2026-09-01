"""Shared FastAPI dependencies (current_user, db session, role checks)."""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_token
from app.modules.m1_auth.repository import UserRepository
from app.modules.m1_auth.models import User

security = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)]
) -> User:
    """
    Dependency to extract and validate current user from JWT token.
    
    Used by every protected endpoint in the app. This is the contract
    that all other modules (M2–M9) depend on — don't change the
    signature or return type without notifying the team.
    
    Raises:
        HTTPException: 401 if token is missing, invalid, or user not found
    """
    token = credentials.credentials
    user_id = verify_token(token)
    
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user



