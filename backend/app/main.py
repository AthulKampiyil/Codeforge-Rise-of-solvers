from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.modules.m1_auth import auth_router
from app.modules.m2_platform_sync import sync_router
from app.modules.m3_village import village_router
from app.modules.m4_attacks import attacks_router
from app.modules.m5_guild_territory.router import router as guild_router
from app.modules.m6_war_room import war_room_router
from app.modules.m7_league_trophy import league_router
from app.modules.m8_notifications.router import router as notifications_router
from app.modules.m9_admin_config import admin_router
from app.middleware.csrf import CSRFMiddleware
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CSRFMiddleware)

app.include_router(auth_router)
app.include_router(sync_router)
app.include_router(village_router)
app.include_router(attacks_router)
app.include_router(guild_router, prefix="/guilds", tags=["m5_guild_territory"])
app.include_router(war_room_router)
app.include_router(league_router)
app.include_router(notifications_router, prefix="/notifications", tags=["m8_notifications"])
app.include_router(admin_router)


