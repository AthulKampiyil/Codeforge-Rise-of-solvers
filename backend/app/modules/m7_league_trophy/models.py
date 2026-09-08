"""League & Trophy Progression (REQ-7.x) — SQLAlchemy ORM models owned by this module."""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Float
from app.db.guid import GUID
from app.db.base_class import Base


class LeagueTier(str, enum.Enum):
    """User's current league tier (REQ-7.x)."""
    bronze = "bronze"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"
    diamond = "diamond"
    legend = "legend"


class Trophy(Base):
    """Trophy earned by user (REQ-7.x)."""
    __tablename__ = "trophies"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    tier = Column(Enum(LeagueTier), nullable=False)
    points = Column(Integer, default=0, nullable=False)  # Points in current tier
    trophy_count = Column(Integer, default=0, nullable=False)  # Trophies earned
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


TROPHY_THRESHOLDS = {
    LeagueTier.bronze: {"min_points": 0, "max_points": 100},
    LeagueTier.silver: {"min_points": 100, "max_points": 250},
    LeagueTier.gold: {"min_points": 250, "max_points": 500},
    LeagueTier.platinum: {"min_points": 500, "max_points": 1000},
    LeagueTier.diamond: {"min_points": 1000, "max_points": 2000},
    LeagueTier.legend: {"min_points": 2000, "max_points": 99999},
}
