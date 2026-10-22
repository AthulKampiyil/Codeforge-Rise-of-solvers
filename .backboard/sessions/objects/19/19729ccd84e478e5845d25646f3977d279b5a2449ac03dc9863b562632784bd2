"""Seed polygons for territory zones

Revision ID: 003_zone_polygons
Revises: 002_seed
Create Date: 2026-09-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import json

revision = '003_zone_polygons'
down_revision = '002'
branch_labels = None
depends_on = None

# Coordinates mapped to an 800x600 canvas based on the UI wireframe
POLYGONS = {
    "Frozen Archives": [[60, 170], [170, 140], [240, 260], [70, 270]],
    "Northmere Capital": [[170, 140], [290, 130], [290, 230], [240, 260]],
    "Iron Peaks": [[290, 130], [440, 150], [430, 245], [290, 230]],
    "Codewall": [[440, 150], [540, 180], [550, 450], [420, 360], [430, 245]],
    "Thornvale": [[70, 270], [240, 260], [160, 420], [60, 370]],
    "The Nexus": [[240, 260], [290, 230], [430, 245], [420, 360], [270, 370], [160, 420]],
    "Rivergate": [[160, 420], [270, 370], [400, 500], [165, 520]],
    "Sunken Library": [[270, 370], [420, 360], [550, 450], [400, 500]]
}

def upgrade() -> None:
    conn = op.get_bind()
    for zone_name, polygon in POLYGONS.items():
        conn.execute(
            sa.text("UPDATE territory_zones SET map_polygon = :poly WHERE name = :name"),
            {"poly": json.dumps(polygon), "name": zone_name}
        )

def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE territory_zones SET map_polygon = NULL"))
