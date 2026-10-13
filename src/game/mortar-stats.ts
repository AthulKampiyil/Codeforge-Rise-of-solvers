import source from '../../reference/mortar/combat.json' with { type: 'json' };
import projectiles from '../../reference/mortar/projectiles.json' with { type: 'json' };

export const MORTAR_LEVELS = source.levels;
export const MORTAR = {
  range: source.attackRange / 100,
  minRange: source.minAttackRange / 100,
  interval: source.intervalMs / 1000,
  splash: source.damageRadius / 100,
} as const;
export const MORTAR_BUILDING = source.building;
export const mortarStats = (level: number) => MORTAR_LEVELS[level - 1];
// The compact projectile table keeps the original fields used by simulation and rendering.
export const MORTAR_PROJECTILES = projectiles;
export function mortarProjectileRow(level: number) {
  const row = mortarStats(level);
  if (!row) throw Error(`Unsupported native Mortar level: ${level}`);
  return MORTAR_PROJECTILES[row.projectile as keyof typeof MORTAR_PROJECTILES][0];
}
