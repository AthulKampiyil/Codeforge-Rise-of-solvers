"""Authentication & Account Linking (REQ-1.x) — data access layer."""
from typing import Optional

from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.m1_auth.models import AuthSession, JudgeAccount, JudgeType, User


class AuthSessionRepository:
    """Durable session state operations. Every security decision is DB-backed."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, sid: str, user_id: str, refresh_jti: str, expires_at: datetime) -> None:
        self.db.add(AuthSession(
            sid=sid, user_id=user_id, refresh_jti=refresh_jti, expires_at=expires_at,
        ))
        self.db.commit()

    def is_active(self, sid: str, user_id: str | None = None) -> bool:
        query = self.db.query(AuthSession).filter(
            AuthSession.sid == sid,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > datetime.now(timezone.utc),
        )
        if user_id is not None:
            query = query.filter(AuthSession.user_id == user_id)
        return query.first() is not None

    def rotate(
        self, sid: str, user_id: str, old_jti: str, new_jti: str, expires_at: datetime,
    ) -> bool:
        now = datetime.now(timezone.utc)
        try:
            changed = self.db.execute(
                update(AuthSession)
                .where(
                    AuthSession.sid == sid,
                    AuthSession.user_id == user_id,
                    AuthSession.refresh_jti == old_jti,
                    AuthSession.revoked_at.is_(None),
                    AuthSession.expires_at > now,
                )
                .values(refresh_jti=new_jti, expires_at=expires_at)
            ).rowcount
            self.db.commit()
            return changed == 1
        except Exception:
            self.db.rollback()
            raise

    def revoke(self, sid: str, user_id: str | None = None) -> bool:
        try:
            criteria = [AuthSession.sid == sid, AuthSession.revoked_at.is_(None)]
            if user_id is not None:
                criteria.append(AuthSession.user_id == user_id)
            changed = self.db.execute(
                update(AuthSession)
                .where(*criteria)
                .values(revoked_at=datetime.now(timezone.utc))
            ).rowcount
            self.db.commit()
            return changed == 1
        except Exception:
            self.db.rollback()
            raise


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

    def set_suspended(
        self, user_id: str, suspended: bool, *, commit: bool = True
    ) -> Optional[User]:
        # Serialize moderation changes and refresh any stale identity-map row
        # before applying the requested status.
        user = (
            self.db.query(User)
            .populate_existing()
            .filter(User.id == user_id)
            .with_for_update()
            .first()
        )
        if user:
            user.is_suspended = suspended
            if commit:
                self.db.commit()
            else:
                self.db.flush()
            self.db.refresh(user)
        return user

    def search(self, search: Optional[str], suspended: Optional[bool], limit: int, offset: int) -> list[User]:
        """List/search users for admin moderation (UC-11). `search` matches
        username or email (case-insensitive substring); `suspended` filters
        by suspension state when given."""
        query = self.db.query(User)
        if search:
            like = f"%{search}%"
            query = query.filter(
                (User.username.ilike(like)) | (User.email.ilike(like))
            )
        if suspended is not None:
            query = query.filter(User.is_suspended == suspended)
        return query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()


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

    def get_by_id_and_user(self, judge_account_id: str, user_id: str) -> Optional[JudgeAccount]:
        return self.db.query(JudgeAccount).filter(
            JudgeAccount.id == judge_account_id,
            JudgeAccount.user_id == user_id,
        ).first()

    def get_by_user(self, user_id: str) -> list[JudgeAccount]:
        return self.db.query(JudgeAccount).filter(JudgeAccount.user_id == user_id).all()

    def get_by_handle(self, judge_type: JudgeType, handle: str) -> Optional[JudgeAccount]:
        return self.db.query(JudgeAccount).filter(
            JudgeAccount.judge_type == judge_type,
            JudgeAccount.handle.ilike(handle),
            JudgeAccount.verified_flag.is_(True),
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

    def mark_verified(self, judge_account_id: str, user_id: str, canonical_handle: str) -> Optional[JudgeAccount]:
        account = self.get_by_id_and_user(judge_account_id, user_id)
        if account:
            account.handle = canonical_handle
            account.verified_flag = True
            account.verification_token = None
            try:
                # Commit is the serialization point. The partial unique index
                # arbitrates simultaneous case-alias verification attempts.
                self.db.commit()
            except IntegrityError:
                self.db.rollback()
                raise
            self.db.refresh(account)
        return account

    def has_solve_or_reward_history(self, judge_account_id: str) -> bool:
        from sqlalchemy import text

        result = self.db.execute(
            text(
                "SELECT EXISTS (SELECT 1 FROM solved_problems WHERE judge_account_id = :account_id) "
                "OR EXISTS (SELECT 1 FROM economy_ledger el "
                "JOIN solved_problems sp ON sp.id = el.solved_problem_id "
                "WHERE sp.judge_account_id = :account_id)"
            ),
            {"account_id": str(judge_account_id)},
        )
        return bool(result.scalar())

    def delete(self, judge_account_id: str) -> bool:
        account = self.get_by_id(judge_account_id)
        if account:
            self.db.delete(account)
            self.db.commit()
            return True
        return False
