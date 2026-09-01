from sqlalchemy.orm import Session
from app.modules.m1_auth.models import User, LinkedJudgeProfile, JudgeName


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, username: str, email: str, hashed_password: str) -> User:
        user = User(username=username, email=email, hashed_password=hashed_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user


class LinkedJudgeProfileRepository:
    """Judge profile linking repository (REQ-1.3–1.5)."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_judge(self, user_id: str, judge_name: JudgeName) -> LinkedJudgeProfile | None:
        """Get a user's linked profile for a specific judge."""
        return self.db.query(LinkedJudgeProfile).filter(
            LinkedJudgeProfile.user_id == user_id,
            LinkedJudgeProfile.judge_name == judge_name
        ).first()

    def get_by_user(self, user_id: str) -> list[LinkedJudgeProfile]:
        """Get all linked judge profiles for a user."""
        return self.db.query(LinkedJudgeProfile).filter(
            LinkedJudgeProfile.user_id == user_id
        ).all()

    def get_by_verification_token(self, token: str) -> LinkedJudgeProfile | None:
        """Get a profile by verification token (REQ-1.4)."""
        return self.db.query(LinkedJudgeProfile).filter(
            LinkedJudgeProfile.verification_token == token
        ).first()

    def create(
        self,
        user_id: str,
        judge_name: JudgeName,
        handle: str,
        verification_token: str
    ) -> LinkedJudgeProfile:
        """Create a new unverified judge profile."""
        profile = LinkedJudgeProfile(
            user_id=user_id,
            judge_name=judge_name,
            handle=handle,
            verification_token=verification_token,
            verified=False
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def verify(self, profile_id: str) -> LinkedJudgeProfile:
        """Mark a judge profile as verified (REQ-1.4)."""
        profile = self.db.query(LinkedJudgeProfile).filter(
            LinkedJudgeProfile.id == profile_id
        ).first()
        if profile:
            profile.verified = True
            profile.verification_token = None
            self.db.commit()
            self.db.refresh(profile)
        return profile

    def delete(self, profile_id: str) -> bool:
        """Delete a linked judge profile (REQ-1.5)."""
        profile = self.db.query(LinkedJudgeProfile).filter(
            LinkedJudgeProfile.id == profile_id
        ).first()
        if profile:
            self.db.delete(profile)
            self.db.commit()
            return True
        return False
