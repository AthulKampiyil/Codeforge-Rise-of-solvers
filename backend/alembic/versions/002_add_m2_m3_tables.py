"""Add M2 Platform Sync and M3 Village tables.

Revision ID: 002
Revises: 001_initial_schema
Create Date: 2026-09-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    # Create topics table (M3)
    op.create_table(
        'topics',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_topics_name'), 'topics', ['name'], unique=False)

    # Create village_topic_progress table (M3)
    op.create_table(
        'village_topic_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('solved_count', sa.Integer(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'topic_id', name='uq_user_topic')
    )
    op.create_index(op.f('ix_village_topic_progress_user_id'), 'village_topic_progress', ['user_id'], unique=False)

    # Create SyncStatus enum type
    sync_status = postgresql.ENUM('up_to_date', 'in_progress', 'failed', name='syncstatus')
    sync_status.create(op.get_bind())

    # Create sync_logs table (M2)
    op.create_table(
        'sync_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('judge_name', sa.String(length=50), nullable=False),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
        sa.Column('status', sync_status, nullable=False),
        sa.Column('last_error', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sync_logs_user_id'), 'sync_logs', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_sync_logs_user_id'), table_name='sync_logs')
    op.drop_table('sync_logs')
    
    sync_status = postgresql.ENUM('up_to_date', 'in_progress', 'failed', name='syncstatus')
    sync_status.drop(op.get_bind())

    op.drop_index(op.f('ix_village_topic_progress_user_id'), table_name='village_topic_progress')
    op.drop_table('village_topic_progress')

    op.drop_index(op.f('ix_topics_name'), table_name='topics')
    op.drop_table('topics')
