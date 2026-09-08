"""SQLAlchemy declarative Base + import hook for all module models."""
from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models so they're registered with Base.metadata
# (needed for Alembic autogenerate). Order follows SADD 4.5's acyclic
# module dependency flow: M1 -> M2 -> M3 -> M4/M5 -> M6/M7 -> M8/M9.
from app.modules.m1_auth.models import User, JudgeAccount  # noqa: E402,F401
from app.modules.m2_platform_sync.models import SolvedProblem, SyncLog, SyncDeadLetter  # noqa: E402,F401
from app.modules.m3_village.models import Topic, VillageTopicProgress, VillageProfile  # noqa: E402,F401
from app.modules.m4_attacks.models import Attack, AttackProblemSet  # noqa: E402,F401
from app.modules.m5_guild_territory.models import (  # noqa: E402,F401
    Guild,
    GuildMembership,
    GuildJoinRequest,
    TerritoryZone,
    ZoneContribution,
)
from app.modules.m7_league_trophy.models import LeagueProfile, TrophyLedger  # noqa: E402,F401
from app.modules.m8_notifications.models import Notification  # noqa: E402,F401
from app.modules.m9_admin_config.models import GameBalanceConfig, AdminAuditLog  # noqa: E402,F401
