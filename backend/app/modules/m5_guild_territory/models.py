"""Guild & Territory Models (REQ-5.x)

ORM models for guild management and territory control.
Owns: M5 data schema. Used by repository layer.
"""
from uuid import uuid4
from enum import Enum
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.guid import GUID
from app.db.base_class import Base


class GuildRole(str, Enum):
    """Guild membership roles."""
    leader = "leader"
    officer = "officer"
    member = "member"


class Guild(Base):
    """Guild entity representing player organization."""
    __tablename__ = "guilds"

    id = Column(GUID, primary_key=True, default=uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    memberships = relationship("GuildMembership", back_populates="guild", cascade="all, delete-orphan")
    zones = relationship("TerritoryZone", back_populates="owning_guild")

    __table_args__ = (
        Index("idx_guilds_owner", "owner_id"),
    )


class GuildMembership(Base):
    """Guild membership record (user + role)."""
    __tablename__ = "guild_memberships"

    id = Column(GUID, primary_key=True, default=uuid4)
    guild_id = Column(GUID, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False, default=GuildRole.member)  # leader, officer, member
    joined_at = Column(DateTime(), nullable=False, default=datetime.utcnow)

    # Relationships
    guild = relationship("Guild", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("guild_id", "user_id", name="uq_guild_memberships_guild_user"),
        Index("idx_guild_memberships_user", "user_id"),
        Index("idx_guild_memberships_guild", "guild_id"),
    )


class GuildJoinRequest(Base):
    """Pending guild join request."""
    __tablename__ = "guild_join_requests"

    id = Column(GUID, primary_key=True, default=uuid4)
    guild_id = Column(GUID, ForeignKey("guilds.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime(), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_guild_join_req_guild", "guild_id"),
    )


class TerritoryZone(Base):
    """Territory zone that can be owned by guilds."""
    __tablename__ = "territory_zones"

    id = Column(GUID, primary_key=True, default=uuid4)
    zone_name = Column(String(50), unique=True, nullable=False, index=True)
    owning_guild_id = Column(GUID, ForeignKey("guilds.id", ondelete="SET NULL"), nullable=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owning_guild = relationship("Guild", back_populates="zones")

    __table_args__ = (
        Index("idx_territory_zones_owner", "owning_guild_id"),
    )
