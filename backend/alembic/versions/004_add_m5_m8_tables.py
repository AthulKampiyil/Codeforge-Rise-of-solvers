"""Add M5 Guilds and M8 Notifications tables.

Revision ID: 004
Revises: 003
Create Date: 2026-09-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create M5 and M8 tables."""
    # Create guilds table (M5)
    op.create_table(
        'guilds',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', name='uq_guilds_name'),
        sa.Index('idx_guilds_name', 'name'),
        sa.Index('idx_guilds_owner', 'owner_id'),
    )

    # Create guild_memberships table (M5)
    op.create_table(
        'guild_memberships',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('guild_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='member'),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['guild_id'], ['guilds.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('guild_id', 'user_id', name='uq_guild_memberships_guild_user'),
        sa.Index('idx_guild_memberships_user', 'user_id'),
        sa.Index('idx_guild_memberships_guild', 'guild_id'),
    )

    # Create territory_zones table (M5)
    op.create_table(
        'territory_zones',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('zone_name', sa.String(50), nullable=False),
        sa.Column('owning_guild_id', sa.UUID(), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['owning_guild_id'], ['guilds.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('zone_name', name='uq_territory_zones_name'),
        sa.Index('idx_territory_zones_name', 'zone_name'),
        sa.Index('idx_territory_zones_owner', 'owning_guild_id'),
    )

    # Create websocket_connections table (M8)
    op.create_table(
        'websocket_connections',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('session_id', sa.String(100), nullable=False),
        sa.Column('connected_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('disconnected_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_websocket_connections_user', 'user_id'),
        sa.Index('idx_websocket_connections_active', 'is_active'),
        sa.Index('idx_websocket_connections_session', 'session_id'),
    )

    # Create notifications table (M8)
    op.create_table(
        'notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('payload', sa.String(1000), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_notifications_user', 'user_id'),
        sa.Index('idx_notifications_created', 'created_at'),
    )


def downgrade() -> None:
    """Rollback M5 and M8 tables."""
    op.drop_table('notifications')
    op.drop_table('websocket_connections')
    op.drop_table('territory_zones')
    op.drop_table('guild_memberships')
    op.drop_table('guilds')
