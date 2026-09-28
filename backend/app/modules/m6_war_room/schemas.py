from pydantic import BaseModel
from typing import List, Dict, Optional
from uuid import UUID

class WarRoomZone(BaseModel):
    id: UUID
    name: str
    owner_guild_id: Optional[UUID]
    scores: Dict[str, float]

class WarRoomMemberTopic(BaseModel):
    name: str
    level: int

class WarRoomMember(BaseModel):
    user_id: UUID
    username: str
    role: str
    defense_rating: float
    total_solved: int
    average_level: float
    topics: List[WarRoomMemberTopic]

class WarRoomResponse(BaseModel):
    guild_id: UUID
    contested_zones: List[WarRoomZone]
    members: List[WarRoomMember]
