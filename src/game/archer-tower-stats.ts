import catalog from '../../reference/archer-tower/catalog.json' with { type: 'json' };
import source from '../../reference/archer-tower/native.json' with { type: 'json' };

export const MAX_ARCHER_TOWER_LEVEL = catalog.levels.length;
export const ARCHER_TOWER_LEVELS = catalog.levels.map((row) => ({
  hp: row.hp,
  dps: row.weapon.dps,
  cost: row.cost,
  seconds: row.seconds,
}));
export function archerTowerStats(level: number) {
  const row = catalog.levels.find((row) => row.level === level);
  if (!row) throw new Error(`Unsupported Archer Tower level: ${level}`);
  return row;
}
/** Explicit source mode fields; this does not grant gearing eligibility. */
export function archerTowerWeapon(level: number, alternate = false) {
  const row = archerTowerStats(level);
  return alternate ? row.alternateWeapon : row.weapon;
}
export function archerTowerProjectileRow(level: number, alternate = false): Record<string, string> {
  const name = archerTowerWeapon(level, alternate).projectile;
  const row = source.projectiles[name as keyof typeof source.projectiles]?.[0];
  if (!row) throw new Error(`Missing original Archer Tower projectile: ${name}`);
  return row;
}
export const ARCHER_TOWER = {
  range: archerTowerWeapon(1).range / 100,
  interval: archerTowerWeapon(1).intervalMs / 1000,
};
