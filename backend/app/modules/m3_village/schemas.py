"""Personal Code Village Management (REQ-3.x) — Pydantic schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr
from typing import Literal


class TopicOut(BaseModel):
    id: UUID
    name: str
    display_name: str
    structure_key: str
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class VillageTopicProgressOut(BaseModel):
    """Individual topic progress in a user's village (REQ-3.1, REQ-3.2)."""
    id: UUID
    name: str
    display_name: str
    structure_key: str
    progress_points: int
    level: int
    points_to_next_level: int = 0
    progress_pct: float = 0.0

    class Config:
        from_attributes = True


class VillageProfileOut(BaseModel):
    """User's complete village profile (REQ-3.3, REQ-3.4)."""
    user_id: UUID
    total_solved: int
    average_level: float
    topics: list[VillageTopicProgressOut]
    defense_rating: float
    username: str | None = None


class OutpostItemOut(BaseModel):
    topic_id: UUID
    tier: int
    next_gold_cost: int | None
    next_elixir_cost: int | None


class OutpostWalletOut(BaseModel):
    coins: int
    gems: int
    gold: int
    elixir: int
    rewarded_solves: int
    builder_capacity: int


class OutpostSnapshotOut(BaseModel):
    items: list[OutpostItemOut]
    wallet: OutpostWalletOut


class OutpostUpgradeRequest(BaseModel):
    idempotency_key: str = Field(min_length=1, max_length=128)
    expected_tier: int = Field(ge=0, le=5)


class OutpostUpgradeOut(OutpostSnapshotOut):
    upgraded_topic_id: UUID


class OutpostLayoutRulesOut(BaseModel):
    coordinate_space: Literal["village-grid"] = "village-grid"
    min_x: int = 8
    min_y: int = 8
    max_x_exclusive: int = 40
    max_y_exclusive: int = 40
    footprint_width: int = 3
    footprint_height: int = 3
    allowed_facings: list[Literal["default", "mirrored"]] = ["default", "mirrored"]


class OutpostLayoutItemOut(BaseModel):
    topic_id: UUID
    topic_key: str
    x: int
    y: int
    facing: Literal["default", "mirrored"]


class OutpostLayoutSnapshotOut(BaseModel):
    revision: int
    rules_version: Literal[1] = 1
    rules: OutpostLayoutRulesOut
    items: list[OutpostLayoutItemOut]


class OutpostLayoutItemRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic_id: UUID
    x: StrictInt
    y: StrictInt
    facing: StrictStr


class OutpostLayoutPutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_revision: StrictInt = Field(ge=0)
    rules_version: StrictInt = Field(ge=1, le=1)
    idempotency_key: StrictStr = Field(min_length=1, max_length=128)
    items: list[OutpostLayoutItemRequest] = Field(min_length=8, max_length=8)


class OutpostLayoutPutOut(BaseModel):
    operation_id: UUID
    applied_revision: int
    replayed: bool
    layout: OutpostLayoutSnapshotOut
