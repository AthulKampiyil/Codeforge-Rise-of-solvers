import source from '../../reference/monolith/combat.json' with { type: 'json' };

export const MONOLITH_LEVELS = source.levels;
export const MONOLITH_PROJECTILES = source.projectiles;
/** Pinned client values converted from hundredths of a tile and milliseconds. */
export const MONOLITH = {
  range: source.range / 100,
  /** Full source cycle: `AttackSpeed`. */
  interval: source.attackSpeedMs / 1000,
  /** Post-hit lockout: `CoolDownOverride`. The remainder of the cycle is the hit timer. */
  cooldown: source.coolDownOverrideMs / 1000,
  windup: (source.attackSpeedMs - source.coolDownOverrideMs) / 1000,
  actionFrame: source.animationActionFrame,
  projectileSpeed: source.projectiles[0].speed / 100,
} as const;
export type MonolithVariant = 1 | 2 | 3;

export function monolithStats(level: number) {
  const row = MONOLITH_LEVELS[level - 1];
  if (!row) throw Error(`Unsupported native Monolith level: ${level}`);
  return row;
}
/** `DPS` over the complete `AttackSpeed` cycle, before any defensive Rage. */
export const monolithBaseDamage = (level: number) =>
  (monolithStats(level).dps * source.attackSpeedMs) / 1000;
/** `DamagePermilHp` of the target's maximum hitpoints; Rage never scales this share. */
export const monolithBonusDamage = (level: number, targetMaxHp: number) =>
  (targetMaxHp * monolithStats(level).damagePermilHp) / 1000;
/** `ProjectileVariantByTargetMaxHP`: tier two from the first threshold, tier three from the second. */
export function monolithVariant(level: number, targetMaxHp?: number): MonolithVariant {
  const row = monolithStats(level);
  if (targetMaxHp === undefined) return row.defaultVariant as MonolithVariant;
  const [low, high] = row.variantThresholds;
  return targetMaxHp >= high ? 3 : targetMaxHp >= low ? 2 : 1;
}
