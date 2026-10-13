import type { Battle } from './model';
import type { CombatProjectile } from './projectiles';

/**
 * Presentation clock for battle effects.
 *
 * Reaching 100% (or the timer) calls `finishBattle` on the same tick that produced the final
 * destruction, and the simulation clock stops there. Effect presentations sample their
 * particles, trails and sounds from this clock instead: it follows `battle.elapsed` while the
 * battle runs and keeps advancing on the wall clock for `PRESENTATION_GRACE` seconds after the
 * finish, so explosions, debris and shells already in the air play out instead of vanishing.
 * Nothing here feeds back into the simulation.
 */
export const PRESENTATION_GRACE = 2;

interface ClockState {
  /** `performance.now()` when this battle object was first seen finished. */
  finishedAt?: number;
  /** True once the battle object was seen running (seeks straight to a finished replay skip grace). */
  seenRunning: boolean;
  /** The last in-flight projectile lists: `finishBattle` replaces them with empty arrays. */
  projectiles?: CombatProjectile[];
}
const clocks = new WeakMap<Battle, ClockState>();

function observe(battle: Battle, now: number) {
  let state = clocks.get(battle);
  if (!state) clocks.set(battle, (state = { seenRunning: false }));
  if (!battle.finished) {
    state.seenRunning = true;
    state.finishedAt = undefined;
    state.projectiles = battle.projectiles;
  } else if (state.finishedAt === undefined)
    state.finishedAt = state.seenRunning ? now : now - PRESENTATION_GRACE * 1000;
  return state;
}

/** Seconds of presentation time since the finish, clamped to the grace window. */
export function presentationOverrun(battle: Battle, now = performance.now()) {
  const state = observe(battle, now);
  if (!battle.finished || state.finishedAt === undefined) return 0;
  return Math.max(0, Math.min(PRESENTATION_GRACE, (now - state.finishedAt) / 1000));
}
/** Battle time for sampling transient effects: `elapsed`, then up to two seconds more. */
export function presentationTime(battle: Battle, now = performance.now()) {
  return battle.elapsed + presentationOverrun(battle, now);
}
/** True while the battle runs, and during the grace window after it finished. */
export function presentationLive(battle: Battle | null | undefined, now = performance.now()) {
  if (!battle) return false;
  if (!battle.finished) {
    observe(battle, now);
    return true;
  }
  return presentationOverrun(battle, now) < PRESENTATION_GRACE;
}
/** Projectiles to draw: the live list, or the ones that were in flight when the battle ended. */
export function presentationProjectiles(
  battle: Battle,
  now = performance.now(),
): readonly CombatProjectile[] {
  const state = observe(battle, now);
  if (!battle.finished) return battle.projectiles ?? [];
  if (!presentationLive(battle, now)) return [];
  // The simulation no longer removes landed shots: drop them at their impact time.
  const at = presentationTime(battle, now);
  return (state.projectiles ?? []).filter((shot) => shot.impact > at);
}
/** Ends the grace window at once (tests, and callers that tear the battle view down). */
export function settlePresentation(battle: Battle) {
  const state = observe(battle, performance.now());
  if (battle.finished) state.finishedAt = -Infinity;
}
