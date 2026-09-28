import pytest
from app.modules.m6_war_room.service import WarRoomService
from app.modules.m5_guild_territory.models import GuildRole

def test_war_room_access(client, db, make_user):
    user_2, headers_2, _ = make_user("leaderuser")
    user_1, headers_1, _ = make_user("normaluser")
    
    from app.modules.m5_guild_territory.service import GuildService
    guild_svc = GuildService(db)
    guild = guild_svc.create_guild("War Room Test", user_2["id"], "Testing")
    
    response = client.get(f"/war_room/{guild.id}", headers=headers_2)
    assert response.status_code == 200
    data = response.json()
    assert "contested_zones" in data
    assert "members" in data
    assert len(data["members"]) == 1
    assert data["members"][0]["username"] == user_2["username"]
    assert data["members"][0]["role"] == GuildRole.leader.value
    
    response2 = client.get(f"/war_room/{guild.id}", headers=headers_1)
    assert response2.status_code == 403
