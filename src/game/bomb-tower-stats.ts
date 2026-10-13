import source from '../../reference/bombtower/combat.json' with { type: 'json' };

/** Pinned source levels; home purchase/upgrade ceilings remain Town Hall-specific. */
export const BOMB_TOWER_LEVELS = source.levels;
export const BOMB_TOWER = {
  speed: 8,
  interval: source.intervalMs / 1000,
  range: source.attackRange / 100,
  splash: source.damageRadius / 100,
  deathRadius: source.deathRadius / 100,
  deathDelay: source.deathDelayMs / 1000,
  deathDamage: source.levels.map((level) => level.deathDamage),
} as const;
export const bombTowerStats = (level: number) => BOMB_TOWER_LEVELS[level - 1];
