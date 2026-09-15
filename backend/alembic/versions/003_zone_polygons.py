"""Seed polygons for territory zones

Revision ID: 003_zone_polygons
Revises: 002_seed
Create Date: 2026-09-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import json

# revision identifiers, used by Alembic.
revision = '003_zone_polygons'
down_revision = '002'
branch_labels = None
depends_on = None

POLYGONS = {
    "Northmere Capital": [[100, 100], [200, 100], [200, 200], [100, 200]],
    "Frozen Archives": [[200, 100], [300, 100], [300, 200], [200, 200]],
    "Iron Peaks": [[300, 100], [400, 100], [400, 200], [300, 200]],
    "Thornvale": [[100, 200], [200, 200], [200, 300], [100, 300]],
    "The Nexus": [[200, 200], [300, 200], [300, 300], [200, 300]],
    "Rivergate": [[300, 200], [400, 200], [400, 300], [300, 300]],
    "Sunken Library": [[100, 300], [200, 300], [200, 400], [100, 400]],
    "Codewall": [[200, 300], [400, 300], [400, 400], [200, 400]],
}

def upgrade() -> None:
    # Get db connection
    conn = op.get_bind()
    
    for zone_name, polygon in POLYGONS.items():
        conn.execute(
            sa.text("UPDATE territory_zones SET map_polygon = :poly WHERE name = :name"),
            {"poly": json.dumps(polygon), "name": zone_name}
        )

def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE territory_zones SET map_polygon = NULL"))
