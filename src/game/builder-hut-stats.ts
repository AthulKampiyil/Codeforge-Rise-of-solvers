import source from '../../reference/builder-hut/combat.json' with { type: 'json' };
import type { WeaponProfile } from './late-goblin-weapon';

/** Pinned client 18.400.21 Builder's Hut rows 1-4, from scripts/import-native-late-goblin-buildings.py. */
export const BUILDER_HUT_SOURCE = source;
export const BUILDER_HUT_LEVELS = source.levels;
export const builderHutLevel = (level: number) => {
  const row = source.levels[level - 1];
  if (!row) throw Error(`Unsupported campaign Builder's Hut level: ${level}`);
  return row;
};
export interface BuilderHutWeapon extends WeaponProfile {
  level: number;
  damage: number;
  projectile: (typeof source.weapon.projectiles)['Nail Ammo'];
  projectileSpeed: number;
  /** Deployed housing space that wakes the turret (WakeUpSpace). */
  wakeUpSpace: number;
  /** Wake-up countdown; combat starts on the tick it reaches zero (WakeUpSpeed). */
  wakeUpMs: number;
}
/** Source levels 2+ carry DPS; level 1 is the passive hut. */
export function builderHutWeapon(level: number): BuilderHutWeapon | undefined {
  const row = source.levels[level - 1];
  if (!row?.dps || !row.projectile) return undefined;
  const projectile =
    source.weapon.projectiles[row.projectile as keyof typeof source.weapon.projectiles];
  return {
    level,
    range: source.weapon.rangeSource / 100,
    intervalMs: source.weapon.intervalMs,
    air: source.weapon.airTargets,
    ground: source.weapon.groundTargets,
    damage: (row.dps * source.weapon.intervalMs) / 1000,
    projectile,
    projectileSpeed: projectile.speed / 100,
    wakeUpSpace: source.weapon.wakeUpSpace,
    wakeUpMs: source.weapon.wakeUpSpeedMs,
  };
}
export const BUILDER_HUT_TURRET = source.turret;
export const BUILDER_HUT_SLEEP = source.sleep;
export const BUILDER_HUT_HOUSING = source.housing;
