import source from '../../reference/wizard-tower/combat.json' with { type: 'json' };

export const WIZARD_TOWER_LEVELS = source.levels;
export const WIZARD_TOWER_PROJECTILES = source.projectiles;
export const WIZARD_TOWER = {
  range: source.range / 100,
  interval: source.intervalMs / 1000,
  splash: source.radius / 100,
} as const;
export const wizardTowerStats = (level: number) => WIZARD_TOWER_LEVELS[level - 1];
export function wizardTowerProjectileTier(level: number) {
  const row = wizardTowerStats(level);
  const index = WIZARD_TOWER_PROJECTILES.findIndex((p) => p.name === row?.projectile);
  if (index < 0) throw Error(`Unsupported native Wizard Tower level: ${level}`);
  return index + 1;
}
