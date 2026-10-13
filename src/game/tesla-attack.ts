import type { Battle, Building, Unit } from './model';
import { TROOPS, type UnitKind } from './data';

export interface TeslaShot {
  index: number;
  at: number;
  targetId: number;
  targetKind: UnitKind;
  targetHero: boolean;
  x: number;
  y: number;
  toAir: boolean;
}
export interface TeslaAttackState {
  fired: number;
  destroyedAt?: number;
  shots: TeslaShot[];
}

/** Derived presentation history; damage, targeting and cadence remain in the simulation. */
export function recordTeslaShot(battle: Battle, tower: Building, target: Unit) {
  const state = ((battle.teslas ??= {})[tower.id] ??= { fired: 0, shots: [] });
  state.shots.push({
    index: ++state.fired,
    at: battle.elapsed,
    targetId: target.id,
    targetKind: target.kind,
    targetHero: !!target.hero,
    x: target.x,
    y: target.y,
    toAir: !!TROOPS[target.kind].flying,
  });
  // More than nine seconds of normal fire. Every imported effect and sound ends
  // well before this; an idle tower retains its last event without growing memory.
  if (state.shots.length > 16) state.shots.shift();
}

export { visualRandom as teslaVariation } from './visual-random';
