import {
  infernoDamageStage,
  infernoStats,
  type InfernoDamageStage,
  type InfernoMode,
} from './inferno-weapon';

export const INFERNO_TICK_MS = 64;
export interface InfernoSlot {
  targetId: number | null;
  lockedMs: number;
  chargeMs: number;
  replacementMs: number;
}
export interface InfernoScheduler {
  level: number;
  mode: InfernoMode;
  slots: InfernoSlot[];
}
export interface InfernoPulse {
  slot: number;
  targetId: number;
  stage: InfernoDamageStage;
  dps: number;
  intervalMs: number;
}
const emptySlot = (): InfernoSlot => ({
  targetId: null,
  lockedMs: 0,
  chargeMs: 0,
  replacementMs: 0,
});

export function createInfernoScheduler(level: number, mode: InfernoMode): InfernoScheduler {
  const stats = infernoStats(level);
  return {
    level,
    mode,
    slots: Array.from({ length: mode === 'single' ? 1 : stats.weapon.alternateTargets }, emptySlot),
  };
}

/** Report a kill by this slot, not a target that merely left range or disappeared. */
export function infernoTargetKilled(state: InfernoScheduler, slotIndex: number) {
  const slot = state.slots[slotIndex];
  if (!slot || slot.targetId === null) throw new Error('Inferno kill requires an occupied slot');
  slot.targetId = null;
  slot.lockedMs = 0;
  slot.chargeMs = 0;
  slot.replacementMs =
    state.mode === 'multi' ? infernoStats(state.level).weapon.alternatePickNewTargetDelay : 0;
}

/**
 * One 64-ms source-order tick. Candidates are already eligible and prioritized.
 * Target refresh precedes replacement-delay decrement; damage follows charging.
 * Pulses retain DPS and interval separately so the battle adapter owns HP rounding.
 * The caller invokes ticks on simulation time, never on animation/render frames.
 */
export function tickInfernoScheduler(
  state: InfernoScheduler,
  candidates: readonly number[],
  enabled = true,
): InfernoPulse[] {
  const { weapon } = infernoStats(state.level);
  if (candidates.some((id) => !Number.isSafeInteger(id)))
    throw new Error('Invalid Inferno target ID');
  if (!enabled) {
    state.slots = state.slots.map((slot) => ({
      ...emptySlot(),
      replacementMs: slot.replacementMs,
    }));
    return [];
  }
  const eligible = new Set(candidates);
  const used = new Set<number>();
  for (const slot of state.slots) {
    if (slot.targetId !== null && eligible.has(slot.targetId) && !used.has(slot.targetId))
      used.add(slot.targetId);
    else {
      slot.targetId = null;
      slot.lockedMs = 0;
      slot.chargeMs = 0;
    }
  }
  // Fill stable slots without moving surviving beams or their charge clocks.
  for (const slot of state.slots) {
    if (slot.targetId === null && slot.replacementMs === 0) {
      const targetId = candidates.find((id) => !used.has(id));
      if (targetId !== undefined) {
        slot.targetId = targetId;
        used.add(targetId);
      }
    }
  }
  const pulses: InfernoPulse[] = [];
  state.slots.forEach((slot, index) => {
    slot.replacementMs = Math.max(0, slot.replacementMs - INFERNO_TICK_MS);
    if (slot.targetId === null) return;
    slot.lockedMs += INFERNO_TICK_MS;
    slot.chargeMs += INFERNO_TICK_MS;
    if (slot.chargeMs < weapon.intervalMs) return;
    slot.chargeMs -= weapon.intervalMs;
    const stage = infernoDamageStage(state.mode, slot.lockedMs, state.level);
    pulses.push({
      slot: index,
      targetId: slot.targetId,
      stage,
      dps: weapon.dps[stage],
      intervalMs: weapon.intervalMs,
    });
  });
  return pulses;
}
