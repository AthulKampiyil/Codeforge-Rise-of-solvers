"""Guild & Territory Models (REQ-5.x) — SADD ER: GUILD, GUILD_MEMBERSHIP,
TERRITORY_ZONE, ZONE_CONTRIBUTION, plus GUILD_JOIN_REQUEST (implied by
REQ-5.2's approve/reject flow, SADD 5.2 approveJoin()).

Full territory scoring/hysteresis (SADD 7.3.1.2) lands in plan.md
Phase 8; this module defines the Phase 1 schema baseline.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.db.types import GUID


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GuildRole(str, enum.Enum):
    leader = "leader"
    officer = "officer"
    member = "member"


class Guild(Base):
    """SADD 6.4 GUILD entity (REQ-5.1)."""
    __tablename__ = "guilds"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    memberships = relationship("GuildMembership", back_populates="guild", cascade="all, delete-orphan")
    zones = relationship("TerritoryZone", back_populates="owning_guild")


class GuildMembership(Base):
    """SADD 6.4 GUILD_MEMBERSHIP (business rule: one active guild per user)."""
    __tablename__ = "guild_memberships"

    guild_id = Column(GUID(), ForeignKey("guilds.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True)
    role = Column(Enum(GuildRole, name="guild_role"), nullable=False, default=GuildRole.member)
    joined_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    guild = relationship("Guild", back_populates="memberships")

    __table_args__ = (
        # Enforces "at most one active guild per solver" (SADD 6.5.3)
        # at the schema level via a unique index on user_id alone.
        UniqueConstraint("user_id", name="uq_guild_memberships_one_guild_per_user"),
    )


class JoinRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class GuildJoinRequest(Base):
    """Implied by REQ-5.2 ('request to join... approve or reject') and
    SADD 5.2 `approveJoin(request_id)` — not itself a Fig 6.1 entity,
    but required to realize the requirement as specified.
    """
    __tablename__ = "guild_join_requests"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    guild_id = Column(GUID(), ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(Enum(JoinRequestStatus, name="join_request_status"), default=JoinRequestStatus.pending, nullable=False)
    decided_by = Column(GUID(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class TerritoryZone(Base):
    """SADD 6.4 TERRITORY_ZONE, with topic_affinity for SADD 7.3.1.2 scoring."""
    __tablename__ = "territory_zones"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    topic_affinity = Column(JSONB, nullable=False, default=dict)  # {topic_name: weight}, weights sum to 1.0
    owning_guild_id = Column(GUID(), ForeignKey("guilds.id", ondelete="SET NULL"), nullable=True, index=True)
    map_polygon = Column(JSONB, nullable=True)  # Phaser WarMapScene geometry
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    owning_guild = relationship("Guild", back_populates="zones")


class ZoneContribution(Base):
    """SADD 6.4 ZONE_CONTRIBUTION — atomic upsert target (SADD 6.5.1)."""
    __tablename__ = "zone_contributions"

    zone_id = Column(GUID(), ForeignKey("territory_zones.id", ondelete="CASCADE"), primary_key=True)
    guild_id = Column(GUID(), ForeignKey("guilds.id", ondelete="CASCADE"), primary_key=True)
    aggregated_score = Column(Numeric, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
