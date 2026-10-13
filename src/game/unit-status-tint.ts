import type { Battle, Unit } from './model';
import { lateUnitFrozen, lateUnitTimeLost } from './late-campaign';
import { FROZEN_TINT } from './freeze-trap-art';

/** Phaser.TintModes values (kept numeric so pure modules need no Phaser import). */
export const TINT_MULTIPLY = 0;
export const TINT_SCREEN = 4;

export interface UnitStatusTint {
  color: number;
  /** TINT_SCREEN brightens toward ice (late campaign freeze); TINT_MULTIPLY otherwise. */
  mode: number;
}
const tints = {
  lateFrozen: { color: FROZEN_TINT, mode: TINT_SCREEN },
  frozen: { color: 0xa8e6ff, mode: TINT_MULTIPLY },
  poison: { color: 0xa6e57a, mode: TINT_MULTIPLY },
  spellRage: { color: 0xf2b3ff, mode: TINT_MULTIPLY },
  rage: { color: 0xffbd76, mode: TINT_MULTIPLY },
} as const satisfies Record<string, UnitStatusTint>;

/**
 * Status tint of an attacking unit, in the fallback sprite's priority order (scene.ts): late
 * campaign freeze, native freeze, poison, Rage Spell, then hero/summon rage and native ability
 * boosts. `rampage` also reads as a boost (the Dragon Duke's innate boost on the hero layer).
 */
export function unitStatusTint(
  u: Unit,
  battle: Pick<Battle, 'elapsed' | 'hero'>,
  rampage = false,
): UnitStatusTint | undefined {
  const at = battle.elapsed;
  const e = u.native?.effects;
  if (lateUnitFrozen(u, at)) return tints.lateFrozen;
  if (e && (e.frozenUntil ?? 0) > at) return tints.frozen;
  if (e?.poison && e.poison.until > at) return tints.poison;
  if ((u.spellRageUntil ?? 0) > at) return tints.spellRage;
  if (
    (u.hero && (battle.hero?.rageUntil ?? 0) > at) ||
    (u.summoned && (u.rageUntil ?? 0) > at) ||
    (e?.boost?.until ?? 0) > at ||
    (rampage && !!e?.rampage)
  )
    return tints.rage;
  return undefined;
}

/**
 * Animation clock of a living unit: battle time minus the time a shrink or a late campaign
 * freeze held it, matching the fallback sprite's clock, so frozen units hold their frame.
 */
export const unitAnimationClock = (u: Unit, elapsed: number) =>
  elapsed - (u.shrink?.timeLost ?? 0) - lateUnitTimeLost(u, elapsed);

/** Multiply two 0xRRGGBB tints channel by channel. */
export function combineTint(base: number, over: number) {
  const r = Math.round((((base >> 16) & 255) * ((over >> 16) & 255)) / 255);
  const g = Math.round((((base >> 8) & 255) * ((over >> 8) & 255)) / 255);
  const b = Math.round(((base & 255) * (over & 255)) / 255);
  return (r << 16) | (g << 8) | b;
}
