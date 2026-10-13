import source from '../../reference/shrink-trap/combat.json' with { type: 'json' };
import { distance2D } from './distance';
import type { Battle, Unit } from './model';
import type { TrapState } from './traps';

/** Pinned data plus the clock interpretation documented in docs/SHRINK-TRAP.md. */
export const SHRINK_TRAP = {
  damage: 0,
  trigger: +source.trap.TriggerRadius / 100,
  radius: +source.trap.DamageRadius / 100,
  targets: 'both' as const,
  minHousing: +source.trap.MinTriggerHousingLimit,
  delay: +source.trap.ActionFrame / source.triggerFps,
};
export const SHRINK_SPELL = {
  radius: +source.spell.Radius / 100,
  charge: +source.spell.ChargingTimeMS / 1000,
  hit: +source.spell.HitTimeMS / 1000,
  interval: +source.spell.TimeBetweenHitsMS / 1000,
  hits: +source.spell.NumberOfHits,
  duration: +source.trap.DurationMS / 1000,
  linger: source.statusDurationSeconds,
  speed: 1 + +source.spell.ShrinkReduceSpeedRatio / 100,
};
export interface ShrinkState {
  castAt: number;
  deployAt: number;
  endAt: number;
  pulses: number;
}
export interface ShrinkStatus {
  since: number;
  until: number;
  /** Lost movement/attack clock time, also keeping the walk animation continuous. */
  timeLost: number;
}
export function makeShrinkState(state: Pick<TrapState, 'activatedAt'>): ShrinkState {
  const castAt = state.activatedAt + SHRINK_TRAP.delay,
    deployAt = castAt + SHRINK_SPELL.charge;
  return { castAt, deployAt, endAt: deployAt + SHRINK_SPELL.duration, pulses: 0 };
}
export function applyShrink(unit: Unit, at: number) {
  const old = unit.shrink;
  unit.shrink = {
    since: old && old.until >= at ? Math.min(old.since, at) : at,
    until: Math.max(old?.until ?? 0, at + SHRINK_SPELL.linger),
    timeLost: old?.timeLost ?? 0,
  };
  // Supercell removed HP reduction in February 2022. Never rescale health on
  // entry, refresh or expiry; ShrinkHitpointsRatio is a retained legacy field.
}
export const isShrunk = (unit: Unit, at: number) =>
  !!unit.shrink && unit.shrink.since <= at && at < unit.shrink.until;

/** Partial expiry affects only the overlapping portion of a simulation step. */
export function shrinkStepTime(unit: Unit, end: number, dt: number) {
  const s = unit.shrink;
  if (!s) return dt;
  const overlap = Math.max(0, Math.min(end, s.until) - Math.max(end - dt, s.since));
  return dt - overlap * (1 - SHRINK_SPELL.speed);
}
export function stepShrink(battle: Battle, state: TrapState) {
  if (battle.finished || !state.shrink || state.resolved) return false;
  const shrink = state.shrink;
  let changed = false;
  while (shrink.pulses < SHRINK_SPELL.hits) {
    const at = shrink.deployAt + SHRINK_SPELL.hit + shrink.pulses * SHRINK_SPELL.interval;
    if (at > battle.elapsed + 1e-9) break;
    for (const unit of battle.units)
      if (
        unit.hp > 0 &&
        !unit.ejected &&
        (unit.spawnedAt ?? 0) <= at + 1e-9 &&
        distance2D(unit.x - state.x, unit.y - state.y) <= SHRINK_SPELL.radius
      )
        applyShrink(unit, at);
    shrink.pulses++;
    changed = true;
  }
  if (battle.elapsed + 1e-9 >= shrink.endAt) {
    state.resolved = true;
    changed = true;
  }
  return changed;
}
