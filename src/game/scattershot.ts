import type { LateCombatContext } from './late-campaign';
import type { Battle, Building, Unit } from './model';
import { TROOPS } from './data';
import { spellTowerDefenseBoost } from './spell-tower';
import { nativeOwned } from './native-ownership';
import {
  SCATTERSHOT,
  SCATTERSHOT_NATIVE_TILE,
  scattershotDamage,
  scattershotStats,
} from './scattershot-stats';

/** Scattershot: nearest-target throws, one-tile impact splash and a shard cone behind the target.
 * The campaign gate keeps affected villages unavailable until this is true. */
export const SCATTERSHOT_READY = true;

const SUBTICK_MS = 16;
const TICK_SUBTICKS = 4;
/** Same local frame as the Eagle Artillery: one tile keeps native positions positive. */
const NATIVE_OFFSET = 1;
const HISTORY_SECONDS = 4;

export interface ScattershotShot {
  index: number;
  at: number;
  dirX: number;
  dirY: number;
}
export interface ScattershotTowerState {
  level: number;
  ammunition: number;
  hitMs: number;
  cooldownMs: number;
  searchMs: number;
  targetId: number | null;
  /** The previous tick's `m_readyForAttack`, which gates the new-target delay. */
  ready: boolean;
  /** Last aim, in tiles relative to the tower center; presentation facing. */
  aimX: number;
  aimY: number;
  fired: number;
  shots: ScattershotShot[];
  emptyAt?: number;
  destroyedAt?: number;
}
export interface ScattershotProjectile {
  id: string;
  towerId: number;
  level: number;
  index: number;
  launchedAt: number;
  fromX: number;
  fromY: number;
  /** Current flight position and destination in tiles. */
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetId: number | null;
  air: boolean;
  damage: number;
  spellDamage: number;
  spellMinDamage: number;
  arrivedAt?: number;
  spellAt?: number;
}
export interface ScattershotImpact {
  id: string;
  towerId: number;
  level: number;
  index: number;
  at: number;
  /** Shard cone apex (the projectile's last position) and its unit direction. */
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  /** Primary splash center (the tracked target, or the last destination). */
  hitX: number;
  hitY: number;
  air: boolean;
  spellAt: number;
  primaryHits: number;
  shardHits: number;
}
/** Battle-only state, reconstructed from the replay snapshot and simulation clock. */
export interface ScattershotBattleState {
  nextSubtick: number;
  towers: Record<number, ScattershotTowerState>;
  projectiles: ScattershotProjectile[];
  impacts: ScattershotImpact[];
}
/** Per-attacker status owned by this family. */
export type ScattershotUnitState = Record<string, never>;

const isScattershot = (b: Building) => b.kind === 'scattershot';
const native = (tiles: number) => Math.floor((tiles + NATIVE_OFFSET) * SCATTERSHOT_NATIVE_TILE);
const flying = (u: Unit) => !u.hero && !!TROOPS[u.kind].flying;
const available = (u: Unit, at: number) =>
  u.hp > 0 && !u.ejected && (u.spawnedAt ?? 0) <= at + 1e-9;
const centerTiles = (b: Building) => ({
  x: b.x + SCATTERSHOT.size / 2,
  y: b.y + SCATTERSHOT.size / 2,
});

/** Squared native distance from the tower center; retained strict minimum and +½-tile maximum. */
function distance(tower: Building, u: Unit) {
  const c = centerTiles(tower),
    dx = native(u.x) - native(c.x),
    dy = native(u.y) - native(c.y);
  return dx * dx + dy * dy;
}
function inRange(tower: Building, u: Unit) {
  const d = distance(tower, u),
    max = SCATTERSHOT.range + 256;
  return d >= SCATTERSHOT.minRange * SCATTERSHOT.minRange && d <= max * max;
}

export function scattershotState(battle: Battle) {
  return (battle.late!.scattershot ??= {
    nextSubtick: 0,
    towers: {},
    projectiles: [],
    impacts: [],
  });
}
function towerState(state: ScattershotBattleState, tower: Building) {
  return (state.towers[tower.id] ??= {
    level: tower.level,
    ammunition: SCATTERSHOT.ammunition,
    hitMs: 0,
    cooldownMs: 0,
    searchMs: 0,
    targetId: null,
    ready: false,
    aimX: 1,
    aimY: 0,
    fired: 0,
    shots: [],
  });
}

function hit(
  battle: Battle,
  tower: Building,
  s: ScattershotTowerState,
  state: ScattershotBattleState,
  target: Unit,
  at: number,
) {
  if (s.ammunition <= 0) return;
  // Spell Tower Rage scales defense damage (the source boosts the hit spell with its parent).
  const boost = spellTowerDefenseBoost(battle, tower);
  const stats = scattershotStats(tower.level),
    c = centerTiles(tower),
    index = ++s.fired;
  state.projectiles.push({
    id: `${tower.id}:${index}`,
    towerId: tower.id,
    level: tower.level,
    index,
    launchedAt: at,
    fromX: c.x,
    fromY: c.y,
    x: c.x,
    y: c.y,
    targetX: target.x,
    targetY: target.y,
    targetId: target.id,
    air: flying(target),
    damage: scattershotDamage(tower.level) * boost.damage,
    spellDamage: stats.spellDamage * boost.damage,
    spellMinDamage: stats.spellMinDamage * boost.damage,
  });
  const length = Math.sqrt(s.aimX * s.aimX + s.aimY * s.aimY) || 1;
  s.shots = [...s.shots.slice(-5), { index, at, dirX: s.aimX / length, dirY: s.aimY / length }];
  s.ammunition--;
  if (!s.ammunition) s.emptyAt = at;
}

function tick(
  battle: Battle,
  tower: Building,
  s: ScattershotTowerState,
  state: ScattershotBattleState,
  at: number,
) {
  const frozen = (battle.defenseStuns[tower.id] ?? 0) > at + 1e-9;
  if (tower.hp <= 0 || s.ammunition <= 0 || frozen || tower.constructing || tower.upgradeEnd) {
    s.targetId = null;
    s.hitMs = 0;
    return;
  }
  // RefreshTarget: keep a valid target; otherwise search the nearest at most every 500 ms.
  let target = s.targetId === null ? undefined : battle.units.find((u) => u.id === s.targetId);
  if (target && !(available(target, at) && inRange(tower, target))) target = undefined;
  if (!target) {
    s.targetId = null;
    if (s.searchMs === 0) {
      let best = Infinity;
      for (const u of battle.units)
        if (available(u, at) && inRange(tower, u)) {
          const d = distance(tower, u);
          if (d < best) {
            best = d;
            target = u;
          }
        }
      s.targetId = target?.id ?? null;
      if (!target) s.hitMs = 0;
      s.searchMs = 500;
    }
  }
  const boost = spellTowerDefenseBoost(battle, tower);
  const step = Math.trunc((Math.round((boost.rate - 1) * 100) * 64 + 6400) / 100);
  s.searchMs = Math.max(s.searchMs - 64, 0);
  s.cooldownMs = Math.max(s.cooldownMs - step, 0);
  const attackFinished = s.ready;
  s.ready = false;
  if (!target) {
    s.hitMs = 0;
    return;
  }
  const c = centerTiles(tower);
  s.aimX = target.x - c.x;
  s.aimY = target.y - c.y;
  if (!attackFinished) s.hitMs = SCATTERSHOT.newTargetChargeMs;
  s.ready = true;
  if (s.cooldownMs !== 0) return;
  s.hitMs += step;
  if (s.hitMs < SCATTERSHOT.chargeMs) return;
  hit(battle, tower, s, state, target, at);
  s.cooldownMs = SCATTERSHOT.cooldownMs;
  s.hitMs = Math.min(s.hitMs - SCATTERSHOT.chargeMs, SCATTERSHOT.chargeMs);
}

function damageUnit(u: Unit, damage: number, at: number) {
  u.hp = Math.max(0, u.hp - damage);
  if (u.hp <= 0) u.defeatedAt ??= at;
}

function stepProjectiles(battle: Battle, state: ScattershotBattleState, at: number) {
  const step = SCATTERSHOT.stepUnits / SCATTERSHOT_NATIVE_TILE;
  for (const p of state.projectiles) {
    if (p.arrivedAt === undefined) {
      if (at <= p.launchedAt + 1e-9) continue;
      const target =
        p.targetId === null ? undefined : battle.units.find((u) => u.id === p.targetId);
      // Non-group projectiles keep tracking until the target is removed from battle.
      if (target && target.hp > 0) {
        p.targetX = target.x;
        p.targetY = target.y;
      } else p.targetId = null;
      const dx = p.targetX - p.x,
        dy = p.targetY - p.y,
        remaining = Math.sqrt(dx * dx + dy * dy);
      if (step < remaining) {
        p.x += (dx / remaining) * step;
        p.y += (dy / remaining) * step;
        continue;
      }
      // TargetReached: immediate primary splash (DamageDelay 0), hit spell on its first logic step.
      p.arrivedAt = at;
      p.spellAt = at + (SUBTICK_MS + SCATTERSHOT.spellHitTimeMs) / 1000;
      const alive = target && target.hp > 0 ? target : undefined;
      const hitX = alive ? alive.x : p.targetX,
        hitY = alive ? alive.y : p.targetY;
      let dirX = remaining > 1e-9 ? dx / remaining : p.x - p.fromX,
        dirY = remaining > 1e-9 ? dy / remaining : p.y - p.fromY;
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      if (length > 1e-9) {
        dirX /= length;
        dirY /= length;
      } else {
        dirX = 1;
        dirY = 0;
      }
      let primaryHits = 0;
      const cx = native(hitX),
        cy = native(hitY);
      for (const u of battle.units) {
        if (!available(u, at) || flying(u) !== p.air) continue;
        const ux = cx - native(u.x),
          uy = cy - native(u.y);
        if (ux * ux + uy * uy >= SCATTERSHOT.damageRadius * SCATTERSHOT.damageRadius) continue;
        damageUnit(u, p.damage, at);
        primaryHits++;
      }
      state.impacts.push({
        id: p.id,
        towerId: p.towerId,
        level: p.level,
        index: p.index,
        at,
        x: p.x,
        y: p.y,
        dirX,
        dirY,
        hitX,
        hitY,
        air: p.air,
        spellAt: p.spellAt,
        primaryHits,
        shardHits: 0,
      });
      continue;
    }
    if (at + 1e-9 < p.spellAt!) continue;
    // Shard cone: target layer only, between MinRadius and Radius behind the impact, linear falloff.
    const impact = state.impacts.find((row) => row.id === p.id)!;
    const ax = native(p.x),
      ay = native(p.y),
      half = (SCATTERSHOT.coneAngle / 2) * (Math.PI / 180),
      span = SCATTERSHOT.coneRadius - SCATTERSHOT.coneMinRadius;
    for (const u of battle.units) {
      if (!available(u, at) || flying(u) !== p.air) continue;
      const ux = native(u.x) - ax,
        uy = native(u.y) - ay,
        d2 = ux * ux + uy * uy;
      if (d2 >= SCATTERSHOT.coneRadius * SCATTERSHOT.coneRadius) continue;
      if (d2 < SCATTERSHOT.coneMinRadius * SCATTERSHOT.coneMinRadius) continue;
      const d = Math.sqrt(d2);
      const cos = (ux * impact.dirX + uy * impact.dirY) / d;
      if (cos < Math.cos(half) - 1e-12) continue;
      const falloff = Math.min(1, Math.max(0, (d - SCATTERSHOT.coneMinRadius) / Math.max(1e-9, span)));
      damageUnit(u, p.spellDamage + (p.spellMinDamage - p.spellDamage) * falloff, at);
      impact.shardHits++;
    }
    p.arrivedAt = -1;
  }
  state.projectiles = state.projectiles.filter((p) => p.arrivedAt !== -1);
}

export function stepScattershot(context: LateCombatContext) {
  const { battle, phase } = context;
  if (phase !== 'defenses' || !battle.late) return;
  const towers = battle.buildings.filter((b) => isScattershot(b) && !nativeOwned(battle, b));
  if (!towers.length && !battle.late.scattershot) return;
  const state = scattershotState(battle);
  for (const tower of towers) towerState(state, tower);
  while ((state.nextSubtick * SUBTICK_MS) / 1000 <= battle.elapsed + 1e-9) {
    const at = (state.nextSubtick * SUBTICK_MS) / 1000;
    stepProjectiles(battle, state, at);
    if (state.nextSubtick % TICK_SUBTICKS === 0)
      for (const tower of towers) tick(battle, tower, state.towers[tower.id], state, at);
    state.nextSubtick++;
  }
  state.impacts = state.impacts.filter((row) => row.at >= battle.elapsed - HISTORY_SECONDS);
}
/** True while this family still has an unresolved effect that must finish before results. */
export function scattershotPending(battle: Battle) {
  return !!battle.late?.scattershot?.projectiles.length;
}
export function scattershotDestroyed(context: LateCombatContext, building: Building, at: number) {
  const state = context.battle.late?.scattershot;
  if (!state || !isScattershot(building)) return;
  const tower = state.towers[building.id];
  if (tower) tower.destroyedAt ??= at;
}
