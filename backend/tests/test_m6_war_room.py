import pytest
from app.modules.m6_war_room.service import WarRoomService
from app.modules.m5_guild_territory.models import GuildRole

def test_war_room_access(client, db, make_user):
    user_2, token_2 = make_user("leaderuser")
    user_1, token_1 = make_user("normaluser")
    
    from app.modules.m5_guild_territory.service import GuildService
    guild_svc = GuildService(db)
    guild = guild_svc.create_guild("War Room Test", user_2.id, "Testing")
    
    headers = {"Authorization": f"Bearer {token_2}"}
    response = client.get(f"/api/war_room/{guild.id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "contested_zones" in data
    assert "members" in data
    assert len(data["members"]) == 1
    assert data["members"][0]["username"] == user_2.username
    assert data["members"][0]["role"] == GuildRole.leader.value
    
    headers2 = {"Authorization": f"Bearer {token_1}"}
    response2 = client.get(f"/api/war_room/{guild.id}", headers=headers2)
    assert response2.status_code == 403
