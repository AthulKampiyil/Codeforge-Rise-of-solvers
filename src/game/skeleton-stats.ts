import native from '../../reference/skeleton-trap/native.json' with { type: 'json' };

/** Immutable public client 18.400.21 values; see docs/SKELETON-TRAP.md. */
export const SKELETON_TRAP = {
  trigger: 5,
  firstSpawn: 0.6,
  spawnInterval: 0.15,
  spawnIdle: 0.5,
  alertRadius: 7,
} as const;
export type SkeletonMode = 'ground' | 'air';
export const validSkeletonMode = (value: unknown): value is SkeletonMode | undefined =>
  value === undefined || value === 'ground' || value === 'air';
/** Coffin tiers this game reconstructs; the source's own ceiling. */
export const SKELETON_TRAP_LEVELS = native.supportedLevels.length;
const SUPPORTED = SKELETON_TRAP_LEVELS;
const row = (level: number) => native.rows[Math.min(SUPPORTED, Math.max(1, level)) - 1];
/** Which skeleton a coffin tier releases. Only its last tier releases the level 2. */
export const skeletonSpawnLevel = (trapLevel: number) => +row(trapLevel).SpawnLvl;
export const skeletonStats = (mode: SkeletonMode, spawnLevel = 1) => {
  const table = native.spawned[mode];
  const stats = table[Math.min(table.length, Math.max(1, spawnLevel)) - 1];
  return {
    hp: stats.hp,
    damage: stats.dps * stats.rate,
    dps: stats.dps,
    rate: stats.rate,
    speed: stats.speed,
    range: stats.range,
    flying: mode === 'air',
  };
};
export const skeletonCount = (level: number) =>
  level >= 1 && level <= SUPPORTED && Number.isInteger(level) ? +row(level).NumSpawns : 0;
/** Finish the full native trigger clip; spawn timing uses the separate explicit delays. */
export const SKELETON_COFFIN_SECONDS = native.tiers[1].clips['ground-trigger'].count / 24;
