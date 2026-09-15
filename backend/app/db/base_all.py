"""Import hook for all module models — used by Alembic autogenerate only.

Import this module in alembic/env.py so that Base.metadata includes every
table. Do NOT import this from model files (that would recreate the circular
import).
"""
from app.db.base import Base  # noqa — re-export Base

from app.modules.m1_auth.models import User, LinkedJudgeProfile  # noqa
from app.modules.m2_platform_sync.models import SyncLog  # noqa
from app.modules.m3_village.models import Topic, VillageTopicProgress  # noqa
from app.modules.m4_attacks.models import Attack, AttackCooldown  # noqa
from app.modules.m5_guild_territory.models import Guild, GuildMembership, TerritoryZone  # noqa
from app.modules.m7_league_trophy.models import Trophy  # noqa
from app.modules.m8_notifications.models import WebSocketConnection, Notification  # noqa
