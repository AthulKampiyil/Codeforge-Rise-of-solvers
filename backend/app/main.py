"""FastAPI application entrypoint — mounts each module's router."""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.redis import get_async_redis
from app.middleware.request_context import RequestContextMiddleware
from app.modules.m1_auth import auth_router
from app.modules.m2_platform_sync import sync_router
from app.modules.m3_village import village_router
from app.modules.m4_attacks import attacks_router
from app.modules.m5_guild_territory.router import router as guild_router
from app.modules.m6_war_room import war_room_router
from app.modules.m7_league_trophy import league_router
from app.modules.m8_notifications import notifications_router, ws_router
from app.modules.m8_notifications.service import run_subscriber_loop
from app.modules.m9_admin_config import admin_router

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Starts one realtime-subscriber task per process (SADD 4.4 — see
    app/modules/m8_notifications/service.py for why this replaces
    Sprint 1's in-process connection dict).
    """
    redis_client = get_async_redis()
    subscriber_task = asyncio.create_task(run_subscriber_loop(redis_client))
    logger.info("app_startup", project=settings.PROJECT_NAME)

    yield

    subscriber_task.cancel()
    try:
        await subscriber_task
    except asyncio.CancelledError:
        pass
    await redis_client.aclose()
    logger.info("app_shutdown")


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)

register_exception_handlers(app)

app.include_router(auth_router)
app.include_router(sync_router)
app.include_router(village_router)
app.include_router(attacks_router)
app.include_router(guild_router)
app.include_router(war_room_router)
app.include_router(league_router)
app.include_router(notifications_router)
app.include_router(ws_router)
app.include_router(admin_router)


@app.get("/health", tags=["health"])
def health_check():
    """Liveness probe for the docker-compose healthcheck / CI."""
    return {"status": "ok", "project": settings.PROJECT_NAME}
