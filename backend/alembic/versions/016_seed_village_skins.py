"""Seed the original village-skin cosmetic catalog."""
from alembic import op


revision = "016_seed_village_skins"
down_revision = "015_attack_finalize"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO economy_cosmetic_catalog
            (id, sku, display_name, slot, asset_ref, coin_price, gem_price, is_available)
        VALUES
            ('01600000-0000-4000-8000-000000000001', 'village-skin-pine-dusk',
             'Pine Dusk', 'village-skin', 'original:pine-dusk', 500, 0, TRUE),
            ('01600000-0000-4000-8000-000000000002', 'village-skin-amber-paths',
             'Amber Paths', 'village-skin', 'original:amber-paths', 0, 100, TRUE)
        ON CONFLICT (sku) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM economy_cosmetic_catalog
        WHERE sku IN ('village-skin-pine-dusk', 'village-skin-amber-paths')
        """
    )
