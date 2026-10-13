import { groundCollision, type GroundCollision } from './subtile-path';
import { BUILDINGS, TROOPS } from './data';
import { distance2D } from './distance';
import { MAP_SIZE } from './grid';
import { concealedTesla } from './hidden-tesla';
import { lateBuildingHidden, type LateCombatContext } from './late-campaign';
import type { Battle, Building, Unit } from './model';
import { tornadoDrag, tornadoTrapStats, type TornadoTrapLevel } from './tornado-trap-stats';
import { nativeOwned } from './native-ownership';
import { hurtUnit } from './native-status';

/** Tornado Trap: vortex that draws attackers in (reference/tornado-trap/README.md).
 * The campaign gate keeps affected villages unavailable until this is true. */
export const TORNADO_TRAP_READY = true;

/** One triggered trap. Times are battle seconds; the pulse schedule is fixed at trigger. */
export interface TornadoVortex {
  trapId: number;
  level: number;
  x: number;
  y: number;
  activatedAt: number;
  /** Spell deployment: trigger + ActionFrame / 24 fps. */
  castAt: number;
  /** First spell hit: deployment + HitTimeMS. */
  firstHitAt: number;
  /** One interval after the last hit; the vortex releases every unit here. */
  endAt: number;
  /** Hits resolved so far (each deals the spell damage and refreshes membership). */
  hits: number;
  /** Units inside the spell radius at the latest resolved hit, in battle unit order. */
  caught: number[];
}
/** Battle-only state, reconstructed from the replay snapshot and simulation clock. */
export interface TornadoTrapBattleState {
  vortices: Record<number, TornadoVortex>;
}
/** Per-attacker status owned by this family. */
export interface TornadoTrapUnitState {
  /** The attacker is carried (its own movement is suppressed) until this time. */
  until: number;
}

const EPSILON = 1e-9;
const eligible = (u: Unit, at: number) => u.hp > 0 && !u.ejected && (u.spawnedAt ?? 0) <= at;
const center = (trap: Building) => ({
  x: trap.x + BUILDINGS[trap.kind].size / 2,
  y: trap.y + BUILDINGS[trap.kind].size / 2,
});

export function stepTornadoTrap(context: LateCombatContext) {
  const { battle, phase } = context;
  if (battle.finished) return;
  if (phase === 'traps') triggerTornadoTraps(battle);
  else if (phase === 'auras') stepVortices(battle, context.dt);
}

/** Trigger after attacker movement, exactly like ordinary traps sample their radius. */
function triggerTornadoTraps(battle: Battle) {
  for (const trap of battle.buildings) {
    if (trap.kind !== 'tornadotrap' || trap.constructing || trap.upgradeEnd) continue;
    if (nativeOwned(battle, trap)) continue;
    if (battle.traps[trap.id]) continue;
    const stats = tornadoTrapStats(trap.level),
      c = center(trap);
    const nearby = battle.units.filter(
      (u) =>
        eligible(u, battle.elapsed) &&
        (u.hero ? 25 : TROOPS[u.kind].space) >= stats.minHousing &&
        (TROOPS[u.kind].flying ? stats.air : stats.ground) &&
        distance2D(u.x - c.x, u.y - c.y) <= stats.trigger,
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
    const castAt = battle.elapsed + stats.delay,
      firstHitAt = castAt + stats.hitTime;
    const state = (battle.late!.tornadoTrap ??= { vortices: {} });
    state.vortices[trap.id] = {
      trapId: trap.id,
      level: trap.level,
      ...c,
      activatedAt: battle.elapsed,
      castAt,
      firstHitAt,
      endAt: firstHitAt + stats.hits * stats.interval,
      hits: 0,
      caught: [],
    };
  }
}

/** Ground collision for carried troops: live, known, non-trap buildings (crowd-separation rule). */
function solidTiles(battle: Battle) {
  return groundCollision(
    battle,
    battle.buildings.filter((b) => !concealedTesla(battle, b) && !lateBuildingHidden(battle, b)),
  );
}

function stepVortices(battle: Battle, dt: number) {
  const vortices = battle.late?.tornadoTrap?.vortices;
  if (!vortices) return;
  let solid: GroundCollision | undefined, units: Map<number, Unit> | undefined;
  for (const vortex of Object.values(vortices)) {
    const stats = tornadoTrapStats(vortex.level);
    // Each hit damages every live attacker inside the spell radius on both layers and
    // refreshes who the vortex carries until the next hit. Wide steps catch up once each.
    while (vortex.hits < stats.hits) {
      const at = vortex.firstHitAt + vortex.hits * stats.interval;
      if (at > battle.elapsed + EPSILON) break;
      vortex.caught = [];
      for (const u of battle.units) {
        if (!eligible(u, at) || distance2D(u.x - vortex.x, u.y - vortex.y) > stats.radius) continue;
        hurtUnit(battle, u, stats.damage, at, undefined, true);
        // A Spring Trap survivor is airborne for its local toss; it is hit but not carried.
        if (u.hp <= 0 || (u.springUntil ?? 0) > at) continue;
        vortex.caught.push(u.id);
        const status = ((u.late ??= {}).tornadoTrap ??= { until: 0 });
        status.until = Math.max(status.until, at + stats.interval);
      }
      vortex.hits++;
    }
    const state = battle.traps[vortex.trapId];
    if (state && !state.resolved && battle.elapsed + EPSILON >= vortex.endAt) state.resolved = true;
    const time =
      Math.min(battle.elapsed, vortex.endAt) - Math.max(battle.elapsed - dt, vortex.firstHitAt);
    if (time <= 0 || !vortex.caught.length) continue;
    solid ??= solidTiles(battle);
    units ??= new Map(battle.units.map((unit) => [unit.id, unit]));
    for (const id of vortex.caught) {
      const u = units.get(id);
      if (!u || u.hp <= 0 || u.ejected || (u.springUntil ?? 0) > battle.elapsed) continue;
      carry(vortex, u, time, solid);
    }
  }
  // Released attackers plan a fresh route from wherever the vortex left them.
  for (const u of battle.units) {
    const status = u.late?.tornadoTrap;
    if (!status || status.until > battle.elapsed + EPSILON) continue;
    delete u.late!.tornadoTrap;
    u.path = [];
    u.pathAt = 0;
  }
}

/**
 * One vortex step for a carried unit, as a turn about the center plus the inward pull.
 * The turn is a rational (Cayley) rotation by tan(half angle) ≈ half the turned arc, so only
 * correctly rounded arithmetic and square roots run: replays agree bit for bit across browser
 * engines, whose sin/cos/atan2 may differ. Ground units are never carried onto a different
 * solid tile; such a step is cancelled, leaving them stuck until release.
 */
export function tornadoCarryPoint(
  stats: TornadoTrapLevel,
  center: { x: number; y: number },
  u: Pick<Unit, 'x' | 'y' | 'kind' | 'hero'>,
  time: number,
) {
  const dx = u.x - center.x,
    dy = u.y - center.y,
    r = distance2D(dx, dy);
  if (r <= EPSILON) return { x: u.x, y: u.y };
  const drag = tornadoDrag(stats, u.kind, !!u.hero, r);
  // The inflow settles on the inner radius; units already inside it only turn.
  const radius = r > stats.innerRadius ? Math.max(stats.innerRadius, r - drag.inward * time) : r;
  // Negative source rotation is the clockwise swirl of the original art: +x toward +y on screen.
  const half = (-Math.sign(stats.rotation) * drag.tangential * time) / r / 2,
    denominator = 1 + half * half;
  const cos = (1 - half * half) / denominator,
    sin = (2 * half) / denominator,
    scale = radius / r;
  return {
    x: Math.max(0, Math.min(MAP_SIZE, center.x + (dx * cos - dy * sin) * scale)),
    y: Math.max(0, Math.min(MAP_SIZE, center.y + (dx * sin + dy * cos) * scale)),
  };
}
function carry(vortex: TornadoVortex, u: Unit, time: number, solid: GroundCollision) {
  const { x, y } = tornadoCarryPoint(tornadoTrapStats(vortex.level), vortex, u, time);
  if (!TROOPS[u.kind].flying && solid.cell(x, y) !== solid.cell(u.x, u.y) && solid.solid(x, y))
    return;
  u.x = x;
  u.y = y;
}

/** The vortex never blocks a result: it damages and moves attackers only. */
export function tornadoTrapPending(battle: Battle) {
  void battle;
  return false;
}
/** Traps have no destructible body. */
export function tornadoTrapDestroyed(context: LateCombatContext, building: Building, at: number) {
  void context;
  void building;
  void at;
}

/** Carried attackers keep attacking targets that stay in range (see tornadoTrapRoots). */
export function tornadoTrapHolds(battle: Battle, unit: Unit) {
  void battle;
  void unit;
  return false;
}
/** A carried attacker does not walk or fly on its own; the vortex moves it instead. */
export function tornadoTrapRoots(battle: Battle, unit: Unit) {
  const status = unit.late?.tornadoTrap;
  return !!status && status.until > battle.elapsed + EPSILON;
}
