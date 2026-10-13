import { infernoDamageStage, infernoStats } from './inferno-weapon';
import { lateDefenseBoost } from './late-campaign';
import type { Battle } from './model';
import {
  createInfernoScheduler,
  tickInfernoScheduler,
  type InfernoScheduler,
} from './inferno-scheduler';
import { tickInfernoCombat, type InfernoHit } from './inferno-combat';

export interface InfernoBattleState {
  scheduler: InfernoScheduler;
  nextTick: number;
  /** Recent pulse records for presentation; old records are deterministically retired. */
  hits: InfernoHit[];
  ammunition?: number;
  ammoChargeMs?: number;
  emptyAt?: number;
  transitions?: { at: number; stage: 1 | 2; x: number; y: number; slot: number }[];
}

export function stepInfernos(battle: Battle, dt: number) {
  for (const tower of battle.buildings) {
    if (tower.kind !== 'inferno') continue;
    const states = (battle.infernos ??= {});
    const state = (states[tower.id] ??= {
      scheduler: createInfernoScheduler(tower.level, tower.infernoMode ?? 'single'),
      nextTick: Math.floor((Math.max(0, battle.elapsed - dt) * 1000) / 64 + 1e-9) + 1,
      hits: [],
      ...(battle.nativeInfernoAmmo
        ? {
            ammunition: tower.infernoAmmo ?? infernoStats(tower.level).weapon.ammoCount,
            ammoChargeMs: 0,
          }
        : {}),
    });
    if (
      state.scheduler.mode !== (tower.infernoMode ?? 'single') ||
      state.scheduler.level !== tower.level
    ) {
      state.scheduler = createInfernoScheduler(tower.level, tower.infernoMode ?? 'single');
      state.hits = [];
    }
    while (state.nextTick * 0.064 <= battle.elapsed + 1e-9) {
      const at = state.nextTick * 0.064;
      const enabled =
        (state.ammunition === undefined || state.ammunition > 0) &&
        tower.hp > 0 &&
        !tower.constructing &&
        !tower.upgradeEnd &&
        at > (battle.defenseStuns[tower.id] ?? 0);
      const previous = state.scheduler.slots.map((slot) =>
        infernoDamageStage(state.scheduler.mode, slot.lockedMs, tower.level),
      );
      const hits = tickInfernoCombat(
        state.scheduler,
        tower,
        battle.units,
        at,
        enabled,
        battle.nativeRoster && battle.catalog !== 'goblin-v1' ? battle : undefined,
        // Defensive Rage exists only in version 44 late campaign battles.
        battle.late && battle.catalog === 'goblin-v1' ? lateDefenseBoost(battle, tower, at).damage : 1,
      );
      state.hits.push(...hits);
      state.scheduler.slots.forEach((slot, index) => {
        const stage =
          hits.find((hit) => hit.slot === index)?.stage ??
          infernoDamageStage(state.scheduler.mode, slot.lockedMs, tower.level);
        if (stage > previous[index] && stage !== 0)
          (state.transitions ??= []).push({
            at,
            stage,
            x: tower.x + 1,
            y: tower.y + 1,
            slot: index,
          });
      });
      // One shared 128-ms active-time budget, independent of occupied beam count.
      // This consumption policy is local; source data specifies capacity and interval only.
      if (
        state.ammunition !== undefined &&
        enabled &&
        (hits.length > 0 || state.scheduler.slots.some((slot) => slot.targetId !== null))
      ) {
        state.ammoChargeMs = (state.ammoChargeMs ?? 0) + 64;
        const interval = infernoStats(tower.level).weapon.intervalMs;
        if (state.ammoChargeMs >= interval) {
          state.ammoChargeMs -= interval;
          state.ammunition--;
          if (state.ammunition === 0) {
            state.emptyAt = at;
            tickInfernoScheduler(state.scheduler, [], false);
          }
        }
      }
      state.nextTick++;
    }
    if (state.transitions)
      state.transitions = state.transitions.filter((event) => event.at >= battle.elapsed - 2);
    state.hits = state.hits.filter((hit) => hit.at >= battle.elapsed - 2);
  }
}
