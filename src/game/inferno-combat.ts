import { buildingDamageScale, hurtUnit, unitHidden } from './native-status';
import { superchargeBonus } from './native-supercharge';
import { TROOPS } from './data';
import { distance2D } from './distance';
import type { Battle, Building, Unit } from './model';
import { infernoStats } from './inferno-weapon';
import {
  infernoTargetKilled,
  tickInfernoScheduler,
  type InfernoScheduler,
  type InfernoPulse,
} from './inferno-scheduler';

export interface InfernoHit extends InfernoPulse {
  at: number;
  fromX: number;
  fromY: number;
  targetX: number;
  targetY: number;
  toAir: boolean;
  damage: number;
  killed: boolean;
}

/**
 * Resolve one scheduler tick against battle units. `at` is simulation seconds;
 * the battle driver must dispatch at 64-ms boundaries. Coordinates are tile units.
 * This adapter uses the game's floating HP arithmetic, not native HP quantization.
 */
export function tickInfernoCombat(
  state: InfernoScheduler,
  tower: { x: number; y: number },
  units: readonly Unit[],
  at: number,
  enabled = true,
  /** Version 51+: shields and immunities apply, and a Rage Spell Tower boosts the beam. */
  native?: Battle,
  /** Late campaign defensive Rage multiplier at this tick; exactly one elsewhere. */
  damageScale = 1,
): InfernoHit[] {
  if (!Number.isFinite(at) || at < 0) throw new Error('Invalid Inferno combat time');
  const stats = infernoStats(state.level);
  const fromX = tower.x + stats.size[0] / 2;
  const fromY = tower.y + stats.size[1] / 2;
  const range =
    (state.mode === 'multi' ? stats.weapon.alternateRangeSource : stats.weapon.rangeSource) / 100;
  const scored: { unit: Unit; dist: number }[] = [];
  for (const unit of units) {
    if (
      unit.hp <= 0 ||
      unit.ejected ||
      unitHidden(unit, at) ||
      (unit.spawnedAt ?? 0) > at ||
      !(TROOPS[unit.kind].flying ? stats.weapon.airTargets : stats.weapon.groundTargets)
    )
      continue;
    const dist = distance2D(unit.x - fromX, unit.y - fromY);
    if (dist <= range) scored.push({ unit, dist });
  }
  // The scheduler reads candidates as a set (surviving beams) plus first-unused picks in
  // order. At most one id per slot is ever used, so ordering only the nearest two per slot
  // (distance, then id, like the old full sort) yields the same picks; the rest stay in.
  const ordered = Math.min(scored.length, state.slots.length * 2);
  for (let i = 0; i < ordered; i++) {
    let best = i;
    for (let j = i + 1; j < scored.length; j++) {
      const a = scored[j],
        b = scored[best];
      if (a.dist < b.dist || (a.dist === b.dist && a.unit.id < b.unit.id)) best = j;
    }
    if (best !== i) {
      const swap = scored[i];
      scored[i] = scored[best];
      scored[best] = swap;
    }
  }
  const targets = scored.map((s) => s.unit);
  const byId = new Map(targets.map((unit) => [unit.id, unit]));
  const hits: InfernoHit[] = [];
  for (const pulse of tickInfernoScheduler(
    state,
    targets.map((unit) => unit.id),
    enabled,
  )) {
    const target = byId.get(pulse.targetId)!;
    const unscaled = (pulse.dps * pulse.intervalMs) / 1000;
    let damage = damageScale === 1 ? unscaled : unscaled * damageScale;
    let killed: boolean;
    if (native) {
      // Supercharged ramp DPS per stage (client mini levels DPS / DPSLv2 / DPSLv3).
      const charged = superchargeBonus('inferno', (tower as Building).supercharge);
      damage +=
        ([charged.dps, charged.dpsLv2, charged.dpsLv3][pulse.stage] * pulse.intervalMs) / 1000;
      damage *= buildingDamageScale(native, tower as Building, at);
      hurtUnit(native, target, damage, at);
      killed = target.hp <= 0;
      if (killed) target.hp = 0;
    } else {
      killed = target.hp <= damage;
      target.hp = Math.max(0, target.hp - damage);
    }
    if (killed) {
      target.defeatedAt ??= at;
      infernoTargetKilled(state, pulse.slot);
    }
    hits.push({
      ...pulse,
      at,
      fromX,
      fromY,
      targetX: target.x,
      targetY: target.y,
      toAir: !!TROOPS[target.kind].flying,
      damage,
      killed,
    });
  }
  return hits;
}
