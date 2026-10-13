import source from '../../reference/tesla/combat.json' with { type: 'json' };

export const TESLA_LEVELS = source.levels;
export const TESLA = {
  interval: source.intervalMs / 1000,
  range: source.attackRange / 100,
  trigger: source.triggerRange / 100,
} as const;
export const teslaStats = (level: number) => TESLA_LEVELS[level - 1];
