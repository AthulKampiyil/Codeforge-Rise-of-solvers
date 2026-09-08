from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from app.modules.m1_auth import auth_router
from app.modules.m2_platform_sync import sync_router
from app.modules.m3_village import village_router
from app.modules.m4_attacks import attacks_router
from app.modules.m5_guild_territory.router import router as guild_router
from app.modules.m6_war_room import war_room_router
from app.modules.m7_league_trophy import league_router
from app.modules.m8_notifications.router import router as notifications_router, handle_ws_session
from app.modules.m9_admin_config import admin_router
from app.middleware.csrf import CSRFMiddleware
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CSRFMiddleware)

app.include_router(auth_router)
app.include_router(sync_router)
app.include_router(village_router)
app.include_router(attacks_router)
app.include_router(guild_router)
app.include_router(war_room_router)
app.include_router(league_router)
app.include_router(notifications_router)
app.include_router(admin_router)


@app.websocket("/ws/events")
async def events_websocket(websocket: WebSocket, token: str = Query(None)):
    """SADD Appendix B.1 WebSocket event stream endpoint."""
    await handle_ws_session(websocket, token)
