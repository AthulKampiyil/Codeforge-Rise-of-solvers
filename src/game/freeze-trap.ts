import { BUILDINGS, TROOPS } from './data';
import { distance2D } from './distance';
import { FREEZE_SPELL, FREEZE_TRAP, freezeDuration } from './freeze-trap-stats';
import type { LateCombatContext } from './late-campaign';
import type { Battle, Building, Unit } from './model';

/** Goblin Freeze Trap: stops attackers in place (reference/freeze-trap/README.md).
 * The campaign gate keeps affected villages unavailable until this is true. */
export const FREEZE_TRAP_READY = true;

/** One triggered trap's single FreezeTrap spell hit. */
export interface FreezeCast {
  trapId: number;
  x: number;
  y: number;
  activatedAt: number;
  /** Spell deployment: trigger + ActionFrame / 24 fps. */
  castAt: number;
  /** The only hit: deployment + HitTimeMS. */
  hitAt: number;
  hit: boolean;
  /** Attackers frozen by the hit, in battle unit order. */
  frozen: number[];
}
/** Battle-only state, reconstructed from the replay snapshot and simulation clock. */
export interface FreezeTrapBattleState {
  casts: Record<number, FreezeCast>;
}
/** Per-attacker status owned by this family. */
export interface FreezeTrapUnitState {
  since: number;
  until: number;
  /** Completed earlier freeze time, keeping animation clocks continuous across refreezes. */
  lost: number;
}

const EPSILON = 1e-9;
const eligible = (u: Unit, at: number) => u.hp > 0 && !u.ejected && (u.spawnedAt ?? 0) <= at;

export function stepFreezeTrap(context: LateCombatContext) {
  const { battle, phase } = context;
  if (battle.finished) return;
  if (phase === 'traps') triggerFreezeTraps(battle);
  else if (phase === 'auras') resolveFreezes(battle);
}

function triggerFreezeTraps(battle: Battle) {
  for (const trap of battle.buildings) {
    if (trap.npc !== 'freeze-trap' || trap.constructing || trap.upgradeEnd) continue;
    if (battle.traps[trap.id]) continue;
    const c = {
      x: trap.x + BUILDINGS[trap.kind].size / 2,
      y: trap.y + BUILDINGS[trap.kind].size / 2,
    };
    const nearby = battle.units.filter(
      (u) =>
        eligible(u, battle.elapsed) &&
        (u.hero ? 25 : TROOPS[u.kind].space) >= FREEZE_TRAP.minHousing &&
        (TROOPS[u.kind].flying ? FREEZE_TRAP.air : FREEZE_TRAP.ground) &&
        distance2D(u.x - c.x, u.y - c.y) <= FREEZE_TRAP.trigger,
    );
    if (!nearby.length) continue;
    nearby.sort(
      (a, b) => distance2D(a.x - c.x, a.y - c.y) - distance2D(b.x - c.x, b.y - c.y) || a.id - b.id,
    );
    battle.traps[trap.id] = {
      activatedAt: battle.elapsed,
      resolved: false,
      targetId: nearby[0].id,
      ...c,
    };
    const castAt = battle.elapsed + FREEZE_TRAP.delay;
    (battle.late!.freezeTrap ??= { casts: {} }).casts[trap.id] = {
      trapId: trap.id,
      ...c,
      activatedAt: battle.elapsed,
      castAt,
      hitAt: castAt + FREEZE_SPELL.hitTime,
      hit: false,
      frozen: [],
    };
  }
}

/** Freeze every live attacker in the spell radius once, before attackers act this step. */
function resolveFreezes(battle: Battle) {
  const casts = battle.late?.freezeTrap?.casts;
  if (!casts) return;
  for (const cast of Object.values(casts)) {
    if (cast.hit || cast.hitAt > battle.elapsed + EPSILON) continue;
    cast.hit = true;
    for (const u of battle.units) {
      const distance = distance2D(u.x - cast.x, u.y - cast.y);
      if (!eligible(u, cast.hitAt) || distance > FREEZE_SPELL.radius) continue;
      freezeUnit(u, cast.hitAt, cast.hitAt + freezeDuration(distance));
      cast.frozen.push(u.id);
    }
    const state = battle.traps[cast.trapId];
    if (state) state.resolved = true;
  }
}

/** Overlapping freezes keep the later expiry; a frozen attacker forgets its target and route. */
export function freezeUnit(u: Unit, at: number, until: number) {
  const old = u.late?.freezeTrap;
  if (old && at <= old.until + EPSILON) old.until = Math.max(old.until, until);
  else
    (u.late ??= {}).freezeTrap = {
      since: at,
      until,
      lost: old ? old.lost + (old.until - old.since) : 0,
    };
  u.target = null;
  delete u.defenderTarget;
  u.path = [];
  u.pathAt = 0;
  u.attacking = false;
}

/** A freeze never blocks a result: it affects attackers only. */
export function freezeTrapPending(battle: Battle) {
  void battle;
  return false;
}
/** Traps have no destructible body. */
export function freezeTrapDestroyed(context: LateCombatContext, building: Building, at: number) {
  void context;
  void building;
  void at;
}

export const isFrozen = (unit: Unit, at: number) => {
  const status = unit.late?.freezeTrap;
  return !!status && status.since <= at + EPSILON && at + EPSILON < status.until;
};
/** A frozen attacker neither moves nor attacks. */
export function freezeTrapHolds(battle: Battle, unit: Unit) {
  return isFrozen(unit, battle.elapsed);
}
/** Frozen battle time up to `at`, for presentation clocks only. */
export function freezeTimeLost(unit: Unit, at: number) {
  const status = unit.late?.freezeTrap;
  if (!status) return 0;
  return status.lost + Math.max(0, Math.min(at, status.until) - status.since);
}
