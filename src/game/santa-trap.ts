import { hurtUnit } from './native-status';
import { distance2D } from './distance';
import native from '../../reference/santa-trap/runtime.json' with { type: 'json' };
import type { Battle } from './model';
import type { TrapState } from './traps';

const spell = native.spell;
/** Pinned client facts plus explicitly documented engine interpretations. */
export const SANTA_TRAP = {
  damage: 0,
  radius: 0,
  trigger: native.trap.trigger,
  targets: 'ground' as const,
  minHousing: 0,
  // Inference, as for Pumpkin: the trap's action counter advances at clip fps.
  delay: native.trap.actionFrame / native.groups.trap.clips.trigger.fps,
};
export const SANTA_SPELL = {
  // The level-one trap calls the level-one spell; native level selection is unverified.
  damage: spell.Damage,
  radius: spell.Radius / 100,
  scatter: spell.RandomRadius / 100,
  hits: spell.NumberOfHits,
  drop: spell.ChargingTimeMS / 1000,
  impact: spell.HitTimeMS / 1000,
  interval: spell.TimeBetweenHitsMS / 1000,
  call: spell.DeployEffect2Delay / 1000,
};
export interface SantaStrike {
  x: number;
  y: number;
  dropAt: number;
  hitAt: number;
}
export interface SantaState {
  castAt: number;
  strikes: SantaStrike[];
  hits: number;
}
/** Local deterministic sampling, not a claim to reproduce the native RNG. */
export function santaRandom(seed: number, index: number) {
  let x = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return ((x ^ (x >>> 15)) >>> 0) / 0x100000000;
}
export function makeSantaState(state: TrapState, trapId: number, battleSeed: number): SantaState {
  const castAt = state.activatedAt + SANTA_TRAP.delay,
    seed = battleSeed ^ Math.imul(trapId, 2654435761);
  return {
    castAt,
    hits: 0,
    // Uniform disk interpretation. Fixed points never follow the triggering troop.
    strikes: Array.from({ length: SANTA_SPELL.hits }, (_, i) => {
      const angle = santaRandom(seed, i * 2) * Math.PI * 2,
        radius = Math.sqrt(santaRandom(seed, i * 2 + 1)) * SANTA_SPELL.scatter;
      return {
        x: state.x + Math.cos(angle) * radius,
        y: state.y + Math.sin(angle) * radius,
        dropAt: castAt + SANTA_SPELL.drop + i * SANTA_SPELL.interval,
        hitAt: castAt + SANTA_SPELL.impact + i * SANTA_SPELL.interval,
      };
    }),
  };
}
export function stepSanta(battle: Battle, state: TrapState) {
  const santa = state.santa!;
  let changed = false;
  while (santa.hits < santa.strikes.length) {
    const strike = santa.strikes[santa.hits];
    if (strike.hitAt > battle.elapsed + 1e-9) break;
    // Spell allegiance belongs to the defending trap; both attacking layers are hit.
    for (const unit of battle.units)
      if (
        unit.hp > 0 &&
        !unit.ejected &&
        (unit.spawnedAt ?? 0) <= strike.hitAt + 1e-9 &&
        distance2D(unit.x - strike.x, unit.y - strike.y) <= SANTA_SPELL.radius
      )
        hurtUnit(battle, unit, SANTA_SPELL.damage, battle.elapsed, undefined, true);
    santa.hits++;
    changed = true;
  }
  state.resolved = santa.hits === santa.strikes.length;
  return changed;
}
