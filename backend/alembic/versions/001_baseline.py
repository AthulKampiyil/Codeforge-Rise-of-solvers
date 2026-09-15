"""Baseline schema — squashed replacement for Sprint 1's 001-004.

Realigns the schema to the SADD v1.1 ER diagram (Fig 6.1) plus the two
Sprint-2 additions recorded in plan.md: village_profiles (a
materialized projection needed for SADD 7.3.1.1 matchmaking, in the
spirit of SADD 6.6's existing exception for trophy_count/
aggregated_score) and guild_join_requests (implied by REQ-5.2's
approve/reject flow). No production data exists yet, so this replaces
Sprint 1's four incremental migrations rather than layering on top of
them.

Revision ID: 001
Revises:
Create Date: 2026-09-08
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Enum types (created explicitly so their names are stable and
    # match the `name=` given on each model's sa.Enum(), per SADD 6.4)
    # ------------------------------------------------------------------
    # create_type=False: these are created explicitly by the .create()
    # loop below; without this flag op.create_table would emit a second
    # CREATE TYPE for every column that references one (DuplicateObject).
    judge_type = postgresql.ENUM(
        "codeforces", "leetcode", "codechef", name="judge_type", create_type=False
    )
    sync_status = postgresql.ENUM(
        "up_to_date", "in_progress", "failed", "degraded", name="sync_status", create_type=False
    )
    dlq_failure_reason = postgresql.ENUM(
        "rate_limited", "circuit_open", "parse_error", "auth_expired", "unknown",
        name="dlq_failure_reason", create_type=False,
    )
    attack_status = postgresql.ENUM(
        "created", "in_progress", "completed", "abandoned", "resolved",
        name="attack_status", create_type=False,
    )
    guild_role = postgresql.ENUM(
        "leader", "officer", "member", name="guild_role", create_type=False
    )
    join_request_status = postgresql.ENUM(
        "pending", "approved", "rejected", name="join_request_status", create_type=False
    )
    league_tier = postgresql.ENUM(
        "bronze", "silver", "gold", "platinum", "diamond", "legend",
        name="league_tier", create_type=False,
    )
    trophy_event_type = postgresql.ENUM(
        "attack_win", "attack_loss", "successful_defense", "failed_defense",
        "attack_abandoned", "practice_milestone", name="trophy_event_type", create_type=False,
    )

    bind = op.get_bind()
    for enum_type in (
        judge_type, sync_status, dlq_failure_reason, attack_status,
        guild_role, join_request_status, league_tier, trophy_event_type,
    ):
        enum_type.create(bind, checkfirst=True)

    # ------------------------------------------------------------------
    # M1 — Authentication & Account Linking
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("attack_cooldown_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "judge_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("judge_type", judge_type, nullable=False),
        sa.Column("handle", sa.String(255), nullable=False),
        sa.Column("verified_flag", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("verification_token", sa.String(255), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("judge_type", "handle", name="uq_judge_accounts_type_handle"),
        sa.UniqueConstraint("user_id", "judge_type", name="uq_judge_accounts_user_type"),
    )
    op.create_index("ix_judge_accounts_user_id", "judge_accounts", ["user_id"])

    # ------------------------------------------------------------------
    # M2 — Coding Platform Sync
    # ------------------------------------------------------------------
    op.create_table(
        "solved_problems",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("judge_account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("problem_ext_id", sa.String(100), nullable=False),
        sa.Column("topic_tags", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("solved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["judge_account_id"], ["judge_accounts.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("judge_account_id", "problem_ext_id", name="uq_solved_problems_account_problem"),
    )
    op.create_index("ix_solved_problems_judge_account_id", "solved_problems", ["judge_account_id"])

    op.create_table(
        "sync_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("judge_account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("judge_name", sa.String(50), nullable=False),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sync_status, nullable=False, server_default="up_to_date"),
        sa.Column("last_error", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["judge_account_id"], ["judge_accounts.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sync_logs_user_id", "sync_logs", ["user_id"])
    op.create_index("ix_sync_logs_judge_account_id", "sync_logs", ["judge_account_id"])

    op.create_table(
        "sync_dead_letter",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("judge_account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("failure_reason", dlq_failure_reason, nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_attempted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload_snapshot", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["judge_account_id"], ["judge_accounts.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("judge_account_id", name="uq_sync_dead_letter_account"),
    )
    op.create_index("ix_sync_dead_letter_judge_account_id", "sync_dead_letter", ["judge_account_id"])

    # ------------------------------------------------------------------
    # M3 — Personal Code Village Management
    # ------------------------------------------------------------------
    op.create_table(
        "topics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("structure_key", sa.String(50), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("base_threshold", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_topics_name", "topics", ["name"])

    op.create_table(
        "village_topic_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("progress_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "topic_id", name="uq_user_topic"),
    )
    op.create_index("ix_village_topic_progress_user_topic", "village_topic_progress", ["user_id", "topic_id"])

    op.create_table(
        "village_profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("defense_rating", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("average_level", sa.Float(), nullable=False, server_default="0"),
        sa.Column("last_recomputed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index("ix_village_profiles_defense_rating", "village_profiles", ["defense_rating"])

    # ------------------------------------------------------------------
    # M4 — Async Village Attacks
    # ------------------------------------------------------------------
    op.create_table(
        "attacks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attacker_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", attack_status, nullable=False, server_default="created"),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("solved_fraction", sa.Float(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("window_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["attacker_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attacks_attacker_user_id", "attacks", ["attacker_user_id"])
    op.create_index("ix_attacks_target_user_id", "attacks", ["target_user_id", "started_at"])

    op.create_table(
        "attack_problem_sets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attack_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("problem_ext_id", sa.String(100), nullable=False),
        sa.Column("problem_name", sa.String(255), nullable=True),
        sa.Column("problem_url", sa.String(500), nullable=True),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("solved_flag", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("solved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["attack_id"], ["attacks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_attack_problem_sets_attack_id", "attack_problem_sets", ["attack_id"])

    # ------------------------------------------------------------------
    # M5 — Guild Management & Territory Control
    # ------------------------------------------------------------------
    op.create_table(
        "guilds",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_guilds_name"),
    )
    op.create_index("ix_guilds_name", "guilds", ["name"])

    op.create_table(
        "guild_memberships",
        sa.Column("guild_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", guild_role, nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["guild_id"], ["guilds.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("guild_id", "user_id"),
        # SADD 6.5.3 business rule, enforced at the schema level: a
        # solver belongs to at most one guild at a time.
        sa.UniqueConstraint("user_id", name="uq_guild_memberships_one_guild_per_user"),
    )
    op.create_index("ix_guild_memberships_guild_id", "guild_memberships", ["guild_id"])

    op.create_table(
        "guild_join_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("guild_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", join_request_status, nullable=False, server_default="pending"),
        sa.Column("decided_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["guild_id"], ["guilds.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["decided_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_guild_join_requests_guild_id", "guild_join_requests", ["guild_id"])
    op.create_index("ix_guild_join_requests_user_id", "guild_join_requests", ["user_id"])

    op.create_table(
        "territory_zones",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("topic_affinity", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("owning_guild_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("map_polygon", postgresql.JSONB(), nullable=True),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["owning_guild_id"], ["guilds.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_territory_zones_name", "territory_zones", ["name"])
    op.create_index("ix_territory_zones_owning_guild_id", "territory_zones", ["owning_guild_id"])

    op.create_table(
        "zone_contributions",
        sa.Column("zone_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("guild_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("aggregated_score", sa.Numeric(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["zone_id"], ["territory_zones.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["guild_id"], ["guilds.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("zone_id", "guild_id"),
    )

    # ------------------------------------------------------------------
    # M7 — League & Trophy Progression
    # ------------------------------------------------------------------
    op.create_table(
        "league_profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trophy_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("league_tier", league_tier, nullable=False, server_default="bronze"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index("ix_league_profiles_trophy_count", "league_profiles", [sa.text("trophy_count DESC")])

    op.create_table(
        "trophy_ledger",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", trophy_event_type, nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("source_ref_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_trophy_ledger_user_id", "trophy_ledger", ["user_id"])

    # ------------------------------------------------------------------
    # M8 — Notification & Realtime Gateway
    # ------------------------------------------------------------------
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])

    # ------------------------------------------------------------------
    # M9 — Admin & Game-Balance Configuration
    # ------------------------------------------------------------------
    op.create_table(
        "game_balance_config",
        sa.Column("key", sa.String(100), nullable=False),
        sa.Column("value", postgresql.JSONB(), nullable=False),
        sa.Column("value_type", sa.String(20), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("key"),
    )

    op.create_table(
        "admin_audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("admin_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_id", sa.String(100), nullable=True),
        sa.Column("details", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_audit_log_admin_user_id", "admin_audit_log", ["admin_user_id"])
    op.create_index("ix_admin_audit_log_created_at", "admin_audit_log", ["created_at"])


def downgrade() -> None:
    op.drop_table("admin_audit_log")
    op.drop_table("game_balance_config")
    op.drop_table("notifications")
    op.drop_table("trophy_ledger")
    op.drop_table("league_profiles")
    op.drop_table("zone_contributions")
    op.drop_table("territory_zones")
    op.drop_table("guild_join_requests")
    op.drop_table("guild_memberships")
    op.drop_table("guilds")
    op.drop_table("attack_problem_sets")
    op.drop_table("attacks")
    op.drop_table("village_profiles")
    op.drop_table("village_topic_progress")
    op.drop_table("topics")
    op.drop_table("sync_dead_letter")
    op.drop_table("sync_logs")
    op.drop_table("solved_problems")
    op.drop_table("judge_accounts")
    op.drop_table("users")

    bind = op.get_bind()
    for name in (
        "trophy_event_type", "league_tier", "join_request_status", "guild_role",
        "attack_status", "dlq_failure_reason", "sync_status", "judge_type",
    ):
        postgresql.ENUM(name=name).drop(bind, checkfirst=True)
