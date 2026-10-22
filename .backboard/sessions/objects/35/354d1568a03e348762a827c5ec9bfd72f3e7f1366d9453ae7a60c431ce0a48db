"""Personal Code Village Management (REQ-3.x) — data access layer.

Owns: all direct DB queries for this module's tables.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.m3_village.models import VillageProfile, VillageTopicProgress, Topic


class VillageRepository:
    """Data access layer for village topic progress."""

    def __init__(self, db: Session):
        self.db = db

    def get_all_by_user(self, user_id: str) -> List[VillageTopicProgress]:
        """Fetch all topic progress records for a user."""
        return self.db.query(VillageTopicProgress).filter(
            VillageTopicProgress.user_id == user_id
        ).all()

    def get_profile(self, user_id: str) -> Optional[VillageProfile]:
        return self.db.query(VillageProfile).filter(VillageProfile.user_id == user_id).first()

    def save_profile(self, user_id: str, **values) -> VillageProfile:
        profile = self.get_profile(user_id)
        if profile is None:
            profile = VillageProfile(user_id=user_id)
            self.db.add(profile)
        for key, value in values.items():
            setattr(profile, key, value)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_topics_with_progress(self, user_id: str):
        return self.db.query(Topic, VillageTopicProgress).outerjoin(
            VillageTopicProgress,
            (VillageTopicProgress.topic_id == Topic.id) & (VillageTopicProgress.user_id == user_id),
        ).order_by(Topic.name).all()

    def get_by_user_and_topic(self, user_id: str, topic_id: str) -> Optional[VillageTopicProgress]:
        """Fetch progress record for a specific user+topic."""
        return self.db.query(VillageTopicProgress).filter(
            VillageTopicProgress.user_id == user_id,
            VillageTopicProgress.topic_id == topic_id,
        ).first()

    def get_topic_by_name(self, name: str) -> Optional[Topic]:
        """Fetch topic by name."""
        return self.db.query(Topic).filter(Topic.name == name).first()

    def create_topic(self, name: str, description: Optional[str] = None) -> Topic:
        """Create a new topic."""
        topic = Topic(name=name, description=description)
        self.db.add(topic)
        self.db.commit()
        return topic

    def get_all_topics(self) -> List[Topic]:
        """Fetch all topics."""
        return self.db.query(Topic).all()
