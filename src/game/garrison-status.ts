import type { Battle, Unit } from './model';
import type { garrisonPoisonOnHit } from './garrison-kinds';

type PoisonOnHit = NonNullable<ReturnType<typeof garrisonPoisonOnHit>>;
/** Attacker status applied by campaign garrison defenders (`unit.late.garrison`). */
export interface GarrisonUnitState {
  poison?: {
    /** Start of the continuous poisoned interval; each hit extends `until`. */
    from: number;
    until: number;
    /** Poison damage has been applied through this battle time. */
    ticked: number;
    /** Damage per second, already scaled for Heroes by the spell's HeroDamageMultiplier. */
    dps: number;
    moveScale: number;
    attackScale: number;
    sourceId: number;
  };
  /** Royal Ghost `FrostOnHit`: movement and attack timers slowed until `until`. */
  frost?: {
    from: number;
    until: number;
    scale: number;
    sourceId: number;
  };
}

/**
 * Royal Ghost hits slow the struck attacker by `FrostOnHitPercent` for `FrostOnHitTime`; each hit
 * refreshes the duration. Local interpretation: movement and attack timers share the scale, and
 * a simultaneous poison and frost do not stack (the stronger slow applies).
 */
export function applyGarrisonFrost(
  battle: Battle,
  unit: Unit,
  frost: { duration: number; scale: number },
  sourceId: number,
  at: number,
) {
  void battle;
  const state = ((unit.late ??= {}).garrison ??= {});
  const current = state.frost && state.frost.until >= at ? state.frost : undefined;
  state.frost = {
    from: current ? current.from : at,
    until: Math.max(current ? current.until : at, at + frost.duration),
    scale: frost.scale,
    sourceId,
  };
}

/**
 * Headhunter hits apply the source PoisonOnHitSpell level for PoisonOnHitDuration. Local
 * interpretation: constant PoisonDPS for the duration, refreshed by each hit, with the spell's
 * SpeedBoost/AttackSpeedBoost percentages. The Poison spell's area ramp (PoisonIncreaseSlowly)
 * belongs to its repeated cloud pulses and is not applied to on-hit poison.
 */
export function applyGarrisonPoison(
  _battle: Battle,
  unit: Unit,
  poison: PoisonOnHit,
  sourceId: number,
  at: number,
) {
  const state = ((unit.late ??= {}).garrison ??= {});
  const current = state.poison && state.poison.until >= at ? state.poison : undefined;
  state.poison = {
    from: current ? current.from : at,
    until: Math.max(current ? current.until : at, at + poison.duration),
    ticked: current ? current.ticked : at,
    dps: unit.hero ? poison.dps * poison.heroDamageScale : poison.dps,
    moveScale: poison.moveScale,
    attackScale: poison.attackScale,
    sourceId,
  };
}

/** Apply poison damage through the current battle time, once per interval. */
export function stepGarrisonStatus(battle: Battle) {
  for (const unit of battle.units) {
    const frost = unit.late?.garrison?.frost;
    if (frost && battle.elapsed >= frost.until) delete unit.late!.garrison!.frost;
    const poison = unit.late?.garrison?.poison;
    if (!poison) continue;
    const end = Math.min(battle.elapsed, poison.until);
    if (unit.hp > 0 && end > poison.ticked)
      unit.hp = Math.max(0, unit.hp - poison.dps * (end - poison.ticked));
    poison.ticked = Math.max(poison.ticked, end);
    if (battle.elapsed >= poison.until) delete unit.late!.garrison!.poison;
  }
}

const NEUTRAL = Object.freeze({ move: 1, attack: 1 });
/** Movement and attack-timer scales for an attacker; neutral without an active poison. */
export function garrisonUnitScales(battle: Battle, unit: Unit): { move: number; attack: number } {
  const poison = unit.late?.garrison?.poison;
  const frost = unit.late?.garrison?.frost;
  const frozen = !!frost && battle.elapsed < frost.until;
  if (!poison || battle.elapsed >= poison.until) {
    if (!frozen) return NEUTRAL;
    return { move: frost!.scale, attack: frost!.scale };
  }
  if (!frozen) return { move: poison.moveScale, attack: poison.attackScale };
  return {
    move: Math.min(poison.moveScale, frost!.scale),
    attack: Math.min(poison.attackScale, frost!.scale),
  };
}
