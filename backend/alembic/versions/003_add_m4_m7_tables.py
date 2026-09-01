"""Add M4 Attacks and M7 League tables.

Revision ID: 003
Revises: 002
Create Date: 2026-09-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create M4 and M7 tables."""
    # Create AttackStatus enum type
    attack_status_enum = postgresql.ENUM(
        'pending', 'executing', 'success', 'failed',
        name='attack_status',
        create_type=True
    )
    attack_status_enum.create(op.get_bind(), checkfirst=True)

    # Create LeagueTier enum type
    league_tier_enum = postgresql.ENUM(
        'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend',
        name='league_tier',
        create_type=True
    )
    league_tier_enum.create(op.get_bind(), checkfirst=True)

    # Create attacks table (M4)
    op.create_table(
        'attacks',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('attacker_user_id', sa.UUID(), nullable=False),
        sa.Column('defender_user_id', sa.UUID(), nullable=False),
        sa.Column('status', attack_status_enum, nullable=False, server_default='pending'),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('challenge_topic', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['attacker_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['defender_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_attacks_attacker', 'attacker_user_id'),
        sa.Index('idx_attacks_defender', 'defender_user_id'),
    )

    # Create attack_cooldowns table (M4)
    op.create_table(
        'attack_cooldowns',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('last_attack_at', sa.DateTime(), nullable=True),
        sa.Column('cooldown_minutes', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_attack_cooldowns_user_id'),
        sa.Index('idx_attack_cooldowns_user', 'user_id'),
    )

    # Create trophies table (M7)
    op.create_table(
        'trophies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('tier', league_tier_enum, nullable=False, server_default='bronze'),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('trophy_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_trophies_user_id'),
        sa.Index('idx_trophies_user', 'user_id'),
        sa.Index('idx_trophies_tier', 'tier'),
    )


def downgrade() -> None:
    """Rollback M4 and M7 tables."""
    op.drop_table('trophies')
    op.drop_table('attack_cooldowns')
    op.drop_table('attacks')

    # Drop enum types
    sa.Enum('pending', 'executing', 'success', 'failed', name='attack_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum('bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend', name='league_tier').drop(op.get_bind(), checkfirst=True)
