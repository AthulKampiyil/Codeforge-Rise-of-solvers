import source from '../../reference/scattershot/combat.json' with { type: 'json' };

export const SCATTERSHOT_LEVELS = source.levels;
export const MAX_SCATTERSHOT_LEVEL = source.levels.length;
export const SCATTERSHOT_NATIVE_TILE = 512;
const units = (value: number) => Math.trunc((value * SCATTERSHOT_NATIVE_TILE) / 100);

/**
 * Pinned 18.400.21 values in retained engine units. `CoolDownOverride` is subtracted from
 * `AttackSpeed` (1,728 ms charge after a 1,500 ms cooldown); `NewTargetAttackDelay` presets the
 * charge to AttackSpeed − 2,200 ms when a target is acquired from idle.
 */
export const SCATTERSHOT = {
  size: source.size,
  range: units(source.attackRange),
  minRange: units(source.minAttackRange),
  attackSpeedMs: source.attackSpeedMs,
  chargeMs: source.attackSpeedMs - source.cooldownOverrideMs,
  cooldownMs: source.cooldownOverrideMs,
  newTargetChargeMs: Math.min(
    source.attackSpeedMs,
    Math.max(0, source.attackSpeedMs - source.newTargetAttackDelayMs),
  ),
  ammunition: source.ammunition,
  damageRadius: units(source.damageRadius),
  /** Native projectile movement per 16 ms logic step: 16 × ((Speed << 9) / 100) / 1000. */
  stepUnits: Math.trunc((16 * units(Number(source.projectile.Speed))) / 1000),
  startHeight: Number(source.projectile.StartHeight),
  coneRadius: units(source.hitSpell.radius),
  coneMinRadius: units(source.hitSpell.minRadius),
  coneAngle: source.hitSpell.coneAngle,
  spellHitTimeMs: source.hitSpell.hitTimeMs,
} as const;
export const SCATTERSHOT_EFFECTS = source.effects;
export const SCATTERSHOT_EXPORTS = source.exports;
export function scattershotStats(level: number) {
  const row = SCATTERSHOT_LEVELS[level - 1];
  if (!row) throw Error(`Unsupported Scattershot level: ${level}`);
  return row;
}
/** DPS × AttackSpeed, the retained `DPSToSingleHit` conversion. */
export const scattershotDamage = (level: number) =>
  (scattershotStats(level).dps * SCATTERSHOT.attackSpeedMs) / 1000;
