import { TROOPS } from './data';
import { distance2D } from './distance';
import type { LateCombatContext } from './late-campaign';
import type { Battle, Building, Unit } from './model';
import {
  MONOLITH,
  monolithBaseDamage,
  monolithBonusDamage,
  monolithVariant,
  type MonolithVariant,
} from './monolith-stats';
import { spellTowerDefenseBoost } from './spell-tower';
import { nativeOwned } from './native-ownership';

/** Monolith: base damage plus a share of the target's hitpoints.
 * The campaign gate keeps affected villages unavailable until this is true. */
export const MONOLITH_READY = true;

export interface MonolithShot {
  index: number;
  at: number;
  variant: MonolithVariant;
  targetId: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  toAir: boolean;
}
export interface MonolithHit {
  index: number;
  at: number;
  variant: MonolithVariant;
  x: number;
  y: number;
  toAir: boolean;
  /** False when the target was already defeated and the orb resolved without damage. */
  struck: boolean;
}
export interface MonolithProjectile {
  id: string;
  sourceId: number;
  index: number;
  variant: MonolithVariant;
  targetId: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  toAir: boolean;
  launched: number;
  impact: number;
  /** `DPS` × `AttackSpeed`, including any defensive Rage active at release. */
  base: number;
  /** `DamagePermilHp` of the target's maximum hitpoints at release. */
  bonus: number;
  flight: { x: number; y: number; at: number };
}
export interface MonolithTowerState {
  targetId: number | null;
  /** Start of the current uninterrupted engagement (targeting loop audio). */
  engagedAt?: number;
  /** Accumulated source hit timer toward `AttackSpeed - CoolDownOverride`. */
  windup: number;
  /** Battle time when the post-hit `CoolDownOverride` lockout ends. */
  readyAt: number;
  fired: number;
  aimX: number;
  aimY: number;
  /** Bounded recent presentation history; older records have finished playing. */
  shots: MonolithShot[];
  hits: MonolithHit[];
  destroyedAt?: number;
}
/** Battle-only state, reconstructed from the replay snapshot and simulation clock. */
export interface MonolithBattleState {
  towers: Record<number, MonolithTowerState>;
  projectiles: MonolithProjectile[];
}
/** Per-attacker status owned by this family. */
export type MonolithUnitState = Record<string, never>;

const HISTORY = 16;
const center = (tower: Building) => ({ x: tower.x + 1.5, y: tower.y + 1.5 });
const familyState = (battle: Battle) =>
  ((battle.late ??= {}).monolith ??= { towers: {}, projectiles: [] });
export function monolithTowerState(battle: Battle, tower: Building): MonolithTowerState {
  return (familyState(battle).towers[tower.id] ??= {
    targetId: null,
    windup: 0,
    readyAt: 0,
    fired: 0,
    // Rest direction matches the registered preview (turret frame 45) until a target is seen.
    aimX: 1,
    aimY: 1,
    shots: [],
    hits: [],
  });
}
const active = (unit: Unit, at: number) =>
  unit.hp > 0 && !unit.ejected && (unit.spawnedAt ?? 0) <= at;

function release(
  battle: Battle,
  tower: Building,
  state: MonolithTowerState,
  target: Unit,
  at: number,
) {
  const from = center(tower);
  const boost = spellTowerDefenseBoost(battle, tower, at).damage;
  const base = monolithBaseDamage(tower.level);
  const variant = monolithVariant(tower.level, target.maxHp);
  const index = ++state.fired;
  const toAir = !!TROOPS[target.kind].flying;
  const distance = distance2D(target.x - from.x, target.y - from.y);
  familyState(battle).projectiles.push({
    id: `monolith:${tower.id}:${index}`,
    sourceId: tower.id,
    index,
    variant,
    targetId: target.id,
    fromX: from.x,
    fromY: from.y,
    x: target.x,
    y: target.y,
    toAir,
    launched: at,
    impact: at + Math.max(0.01, distance / MONOLITH.projectileSpeed),
    base: boost === 1 ? base : base * boost,
    bonus: monolithBonusDamage(tower.level, target.maxHp),
    flight: { x: from.x, y: from.y, at },
  });
  state.shots.push({
    index,
    at,
    variant,
    targetId: target.id,
    fromX: from.x,
    fromY: from.y,
    x: target.x,
    y: target.y,
    toAir,
  });
  if (state.shots.length > HISTORY) state.shots.shift();
}

/**
 * Source cycle, sampled by the fixed simulation step: the hit timer accumulates only while
 * a target remains engaged and the `CoolDownOverride` lockout has ended; a hit restarts the
 * lockout. Losing every target clears the hit timer. Exact release times retain fractions.
 */
function stepTowers({ battle, dt }: LateCombatContext) {
  const start = battle.elapsed - dt;
  for (const tower of battle.buildings) {
    if (tower.kind !== 'monolith' || nativeOwned(battle, tower)) continue;
    const state = monolithTowerState(battle, tower);
    if (tower.hp <= 0 || tower.constructing || tower.upgradeEnd) {
      state.targetId = null;
      state.windup = 0;
      delete state.engagedAt;
      continue;
    }
    const stunEnd = battle.defenseStuns[tower.id] ?? 0;
    const stunned = Math.max(0, Math.min(battle.elapsed, stunEnd) - start);
    if (stunned > 0) {
      // A stunned defense drops its target and hit timer; its lockout does not count down.
      if (state.readyAt > start) state.readyAt += stunned;
      state.windup = 0;
      state.targetId = null;
      delete state.engagedAt;
      if (stunEnd >= battle.elapsed) continue;
    }
    const c = center(tower);
    const inRange = (unit: Unit) =>
      active(unit, battle.elapsed) &&
      distance2D(unit.x - c.x, unit.y - c.y) <= MONOLITH.range + 1e-9;
    const retained = battle.units.find((u) => u.id === state.targetId && inRange(u));
    const target =
      retained ??
      battle.units
        .filter(inRange)
        .sort(
          (a, b) =>
            distance2D(a.x - c.x, a.y - c.y) - distance2D(b.x - c.x, b.y - c.y) || a.id - b.id,
        )[0];
    if (!target) {
      state.targetId = null;
      state.windup = 0;
      delete state.engagedAt;
      continue;
    }
    // Switching targets without an idle sample keeps the hit timer; a new engagement starts now.
    const continuing = state.targetId !== null;
    if (!continuing) state.engagedAt = battle.elapsed;
    state.targetId = target.id;
    state.aimX = target.x - c.x;
    state.aimY = target.y - c.y;
    if (!continuing) continue;
    let from = Math.max(start, state.readyAt, stunEnd);
    while (from <= battle.elapsed + 1e-9) {
      const at = from + MONOLITH.windup - state.windup;
      if (at > battle.elapsed + 1e-9) {
        state.windup += Math.max(0, battle.elapsed - from);
        break;
      }
      release(battle, tower, state, target, at);
      state.windup = 0;
      state.readyAt = at + MONOLITH.cooldown;
      from = state.readyAt;
    }
  }
}

/** Tracking orbs travel at the source speed toward the target's current position. */
function stepProjectiles({ battle }: LateCombatContext) {
  const family = battle.late?.monolith;
  if (!family?.projectiles.length) return;
  const pending: MonolithProjectile[] = [];
  for (const p of family.projectiles) {
    const target = battle.units.find((u) => u.id === p.targetId && u.hp > 0);
    if (target) {
      p.x = target.x;
      p.y = target.y;
    }
    const distance = distance2D(p.x - p.flight.x, p.y - p.flight.y);
    p.impact = Math.max(p.launched + 0.01, p.flight.at + distance / MONOLITH.projectileSpeed);
    const fraction = distance
      ? Math.min(
          1,
          (Math.max(0, battle.elapsed - p.flight.at) * MONOLITH.projectileSpeed) / distance,
        )
      : 1;
    p.flight.x += (p.x - p.flight.x) * fraction;
    p.flight.y += (p.y - p.flight.y) * fraction;
    p.flight.at = Math.min(battle.elapsed, p.impact);
  }
  for (const p of [...family.projectiles].sort(
    (a, b) => a.impact - b.impact || a.index - b.index,
  )) {
    if (p.impact > battle.elapsed + 1e-9) {
      pending.push(p);
      continue;
    }
    const target = battle.units.find((u) => u.id === p.targetId);
    const struck = !!target && active(target, p.impact);
    if (struck) target.hp -= p.base + p.bonus;
    const tower = family.towers[p.sourceId];
    if (tower) {
      tower.hits.push({
        index: p.index,
        at: p.impact,
        variant: p.variant,
        x: p.x,
        y: p.y,
        toAir: p.toAir,
        struck,
      });
      if (tower.hits.length > HISTORY) tower.hits.shift();
    }
  }
  family.projectiles = pending;
}

export function stepMonolith(context: LateCombatContext) {
  if (context.phase === 'projectiles') stepProjectiles(context);
  else if (context.phase === 'defenses') stepTowers(context);
}
/** True while this family still has an unresolved effect that must finish before results. */
export function monolithPending(battle: Battle) {
  return (battle.late?.monolith?.projectiles.length ?? 0) > 0;
}
export function monolithDestroyed(context: LateCombatContext, building: Building, at: number) {
  if (building.kind !== 'monolith') return;
  const state = monolithTowerState(context.battle, building);
  state.destroyedAt ??= at;
  state.targetId = null;
  state.windup = 0;
  delete state.engagedAt;
}
