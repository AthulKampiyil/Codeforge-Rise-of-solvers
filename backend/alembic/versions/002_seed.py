"""Seed data — topics, territory zones, game-balance defaults.

Revision ID: 002
Revises: 001
Create Date: 2026-09-08
"""
import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def _now():
    return datetime.now(timezone.utc)


# Topics matching the mockup sidebar (Graph, DP, Trees, Greedy, Math,
# Strings) and the village wireframe (Arrays Hut, Graph Tower, DP
# Fortress, Greedy Mill) — plan.md Phase 1 seed data.
TOPICS = [
    ("arrays", "Arrays", "hut", 10),
    ("strings", "Strings", "library", 10),
    ("math", "Math", "observatory", 10),
    ("greedy", "Greedy", "mill", 10),
    ("graphs", "Graphs", "tower", 12),
    ("trees", "Trees", "grove", 12),
    ("dynamic-programming", "DP", "fortress", 14),
    ("data-structures", "Data Structures", "vault", 12),
]

# Territory zones named after the mockup War Map (Figure 3.1), each
# with a topic_affinity map summing to 1.0.
ZONES = [
    ("Northmere Capital", {"graphs": 0.5, "trees": 0.3, "data-structures": 0.2}),
    ("Frozen Archives", {"dynamic-programming": 0.6, "math": 0.4}),
    ("Iron Peaks", {"greedy": 0.5, "arrays": 0.5}),
    ("Thornvale", {"strings": 0.6, "data-structures": 0.4}),
    ("The Nexus", {"graphs": 0.25, "trees": 0.25, "dynamic-programming": 0.25, "arrays": 0.25}),
    ("Rivergate", {"arrays": 0.4, "greedy": 0.3, "math": 0.3}),
    ("Sunken Library", {"strings": 0.5, "math": 0.5}),
    ("Codewall", {"data-structures": 0.5, "trees": 0.5}),
]

# Every tunable constant from SADD 7.3.1, seeded so M9 (Phase 10) can
# change them at runtime without a redeploy (UC-12).
GAME_BALANCE_DEFAULTS = [
    ("attack.cooldown_minutes", 60, "int", "Minutes between a solver's consecutive attacks (REQ-4.4)."),
    ("attack.window_hours", 24, "int", "Hours an attack target has to solve the curated set."),
    ("attack.problem_set_size", 3, "int", "Number of curated problems per attack (REQ-4.2)."),
    ("attack.defense_grace_minutes", 15, "int", "Minutes a just-attacked village is excluded from matchmaking."),
    ("matchmaking.base_tolerance", 0.12, "float", "Base +/- band around attacker's defense rating (SADD 7.3.1.1)."),
    (
        "matchmaking.tier_adjustment",
        {"bronze": 0.08, "silver": 0.05, "gold": 0.02, "platinum": 0.0, "diamond": -0.02, "legend": -0.08},
        "dict",
        "Per-tier adjustment to the matchmaking tolerance band.",
    ),
    ("matchmaking.min_candidates", 3, "int", "Minimum candidates before widening the tolerance band."),
    ("matchmaking.widen_step", 0.05, "float", "Tolerance widening step when below min_candidates."),
    ("matchmaking.max_tolerance", 0.30, "float", "Cap on total widened tolerance."),
    ("matchmaking.recent_attack_window_h", 24, "int", "Hours before a solver may re-attack the same target."),
    (
        "trophy.k_factor",
        {"bronze": 32, "silver": 32, "gold": 32, "platinum": 24, "diamond": 24, "legend": 16},
        "dict",
        "Elo K-factor per league tier (SADD 7.3.1.3).",
    ),
    ("trophy.defense_threshold", 0.34, "float", "Solved-fraction below which an attack counts as a successful defense."),
    ("trophy.abandon_penalty", 5, "int", "Flat trophy penalty for an attack abandoned with zero submissions."),
    ("trophy.elo_divisor", 400, "int", "Elo expected-score divisor (SADD 7.3.1.3)."),
    (
        "league.thresholds",
        {"bronze": 0, "silver": 400, "gold": 800, "platinum": 1300, "diamond": 1900, "legend": 2600},
        "dict",
        "Trophy-count thresholds separating the six league tiers (REQ-7.2).",
    ),
    ("league.starting_trophies", 300, "int", "Trophy count a new solver's league profile starts with."),
    ("territory.hysteresis_margin", 0.05, "float", "Required lead before zone ownership flips (SADD 7.3.1.2)."),
    ("territory.decay_per_day", 0.02, "float", "Daily activity-decay rate applied to inactive members' contribution."),
    ("territory.decay_floor", 0.50, "float", "Minimum activity-decay multiplier."),
    ("village.defense_base", 100, "int", "Base defense rating before topic/solve contributions (SADD 7.3.1)."),
    ("village.defense_level_weight", 10, "int", "Defense rating points per topic level."),
    ("village.defense_solved_weight", 0.25, "float", "Defense rating points per total problem solved."),
    ("sync.circuit_failure_threshold", 5, "int", "Consecutive failures before a judge's circuit breaker opens (SADD 4.4)."),
    ("sync.circuit_window_seconds", 120, "int", "Window over which consecutive failures are counted."),
    ("sync.circuit_cooldown_seconds", 600, "int", "Initial OPEN-state cooldown before a HALF_OPEN trial."),
    ("sync.circuit_cooldown_max_seconds", 7200, "int", "Cap on exponential circuit cooldown growth."),
    ("sync.max_inline_retries", 2, "int", "Inline retries before a failed sync job goes to the Dead-Letter Queue."),
    ("sync.dlq_backoff_cap_hours", 6, "int", "Cap on Dead-Letter Queue exponential backoff."),
]


def upgrade() -> None:
    bind = op.get_bind()

    topics_table = sa.table(
        "topics",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("display_name", sa.String),
        sa.column("structure_key", sa.String),
        sa.column("base_threshold", sa.Integer),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    topic_ids: dict[str, uuid.UUID] = {name: uuid.uuid4() for name, *_ in TOPICS}
    bind.execute(
        topics_table.insert(),
        [
            {
                "id": topic_ids[name],
                "name": name,
                "display_name": display_name,
                "structure_key": structure_key,
                "base_threshold": base_threshold,
                "created_at": _now(),
            }
            for name, display_name, structure_key, base_threshold in TOPICS
        ],
    )

    zones_table = sa.table(
        "territory_zones",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("topic_affinity", postgresql.JSONB),
        sa.column("owning_guild_id", postgresql.UUID(as_uuid=True)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    bind.execute(
        zones_table.insert(),
        [
            {
                "id": uuid.uuid4(),
                "name": name,
                "topic_affinity": affinity,
                "owning_guild_id": None,
                "created_at": _now(),
                "updated_at": _now(),
            }
            for name, affinity in ZONES
        ],
    )

    config_table = sa.table(
        "game_balance_config",
        sa.column("key", sa.String),
        sa.column("value", postgresql.JSONB),
        sa.column("value_type", sa.String),
        sa.column("description", sa.String),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    bind.execute(
        config_table.insert(),
        [
            {
                "key": key,
                "value": value,
                "value_type": value_type,
                "description": description,
                "updated_at": _now(),
            }
            for key, value, value_type, description in GAME_BALANCE_DEFAULTS
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM game_balance_config")
    op.execute("DELETE FROM territory_zones")
    op.execute("DELETE FROM topics")
