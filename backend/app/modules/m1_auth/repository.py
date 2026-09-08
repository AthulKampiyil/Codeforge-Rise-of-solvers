"""Authentication & Account Linking (REQ-1.x) — data access layer."""
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.m1_auth.models import JudgeAccount, JudgeType, User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, username: str, email: str, password_hash: str) -> User:
        user = User(username=username, email=email, password_hash=password_hash)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def set_suspended(self, user_id: str, suspended: bool) -> Optional[User]:
        user = self.get_by_id(user_id)
        if user:
            user.is_suspended = suspended
            self.db.commit()
            self.db.refresh(user)
        return user


class JudgeAccountRepository:
    """Judge account linking repository (REQ-1.3–1.5)."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_judge(self, user_id: str, judge_type: JudgeType) -> Optional[JudgeAccount]:
        return self.db.query(JudgeAccount).filter(
            JudgeAccount.user_id == user_id,
            JudgeAccount.judge_type == judge_type,
        ).first()

    def get_by_id(self, judge_account_id: str) -> Optional[JudgeAccount]:
        return self.db.query(JudgeAccount).filter(JudgeAccount.id == judge_account_id).first()

    def get_by_user(self, user_id: str) -> list[JudgeAccount]:
        return self.db.query(JudgeAccount).filter(JudgeAccount.user_id == user_id).all()

    def get_by_handle(self, judge_type: JudgeType, handle: str) -> Optional[JudgeAccount]:
        return self.db.query(JudgeAccount).filter(
            JudgeAccount.judge_type == judge_type,
            JudgeAccount.handle == handle,
        ).first()

    def create(self, user_id: str, judge_type: JudgeType, handle: str, verification_token: str) -> JudgeAccount:
        account = JudgeAccount(
            user_id=user_id,
            judge_type=judge_type,
            handle=handle,
            verification_token=verification_token,
            verified_flag=False,
        )
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account

    def mark_verified(self, judge_account_id: str) -> Optional[JudgeAccount]:
        account = self.get_by_id(judge_account_id)
        if account:
            account.verified_flag = True
            account.verification_token = None
            self.db.commit()
            self.db.refresh(account)
        return account

    def delete(self, judge_account_id: str) -> bool:
        account = self.get_by_id(judge_account_id)
        if account:
            self.db.delete(account)
            self.db.commit()
            return True
        return False
