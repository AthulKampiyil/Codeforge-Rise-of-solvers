import { unitHidden } from './native-status';
import { distance2D } from './distance';
import { BUILDINGS, TROOPS } from './data';
import { MAP_SIZE } from './grid';
import { SWEEPER, sweeperStats } from './air-control-stats';
import type { Battle, Building, FX, Unit } from './model';

export interface AirPush {
  x: number;
  y: number;
  remaining: number;
}
export interface AirGust {
  sourceId: number;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  radius: number;
  push: number;
  hit: number[];
  launched: number;
}
export interface SweeperState {
  targetId: number;
  prepare: number;
  directionX: number;
  directionY: number;
  firedAt?: number;
}
export interface SweeperShot {
  index: number;
  at: number;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
}
export interface SweeperHistory {
  fired: number;
  shots: SweeperShot[];
  destroyedAt?: number;
}
const historyFor = (battle: Battle, id: number) =>
  ((battle.airSweepers ??= {})[id] ??= { fired: 0, shots: [] });

export function recordSweeperDestroyed(battle: Battle, tower: Building, at: number) {
  historyFor(battle, tower.id).destroyedAt ??= at;
}

// Exact cardinal axes and one shared diagonal value avoid platform-specific trig
// rounding in replay state. Angles are derived only when drawing the nozzle/gust.
const DIRECTIONS = [
  [1, 0],
  [Math.SQRT1_2, Math.SQRT1_2],
  [0, 1],
  [-Math.SQRT1_2, Math.SQRT1_2],
  [-1, 0],
  [-Math.SQRT1_2, -Math.SQRT1_2],
  [0, -1],
  [Math.SQRT1_2, -Math.SQRT1_2],
] as const;
// cos(105 degrees / 2 + 1e-9), retaining the original cone's angular tolerance.
const CONE_COS = 0.6087614282153673;
const WAVE_COS = Math.sqrt(3) / 2; // cos(60 degrees / 2)

export function inSweeperRange(tower: Building, u: Pick<Unit, 'x' | 'y'>) {
  const x = u.x - tower.x - 1,
    y = u.y - tower.y - 1;
  const distance = distance2D(x, y);
  const [directionX, directionY] = DIRECTIONS[tower.direction ?? 0];
  return (
    distance >= SWEEPER.minRange &&
    distance <= SWEEPER.range &&
    x * directionX + y * directionY >= distance * CONE_COS
  );
}

/** One traveling front can affect a flyer only once, including after replay seeking. */
export function stepSweepers(b: Battle, dt: number, effect: (fx: FX) => void) {
  const gusts = (b.gusts ??= []);
  for (const gust of gusts) {
    const previous = gust.radius;
    gust.radius = Math.min(SWEEPER.range, previous + SWEEPER.speed * dt);
    for (const u of b.units) {
      if (u.hp <= 0 || !TROOPS[u.kind].flying || gust.hit.includes(u.id)) continue;
      const x = u.x - gust.x,
        y = u.y - gust.y,
        distance = distance2D(x, y);
      if (
        distance < Math.max(SWEEPER.minRange, previous - 0.3) ||
        distance > gust.radius + 0.3 ||
        x * gust.directionX + y * gust.directionY < distance * WAVE_COS ||
        Math.abs(x * gust.directionY - y * gust.directionX) > SWEEPER.halfWidth
      )
        continue;
      gust.hit.push(u.id);
      const old = u.airPush;
      const remainingX = old ? old.x * old.remaining : 0;
      const remainingY = old ? old.y * old.remaining : 0;
      u.airPush = {
        x: (remainingX + (x / distance) * gust.push) / SWEEPER.pushSeconds,
        y: (remainingY + (y / distance) * gust.push) / SWEEPER.pushSeconds,
        remaining: SWEEPER.pushSeconds,
      };
      u.attacking = false;
      u.path = [];
      u.pathAt = 0;
    }
  }
  b.gusts = gusts.filter((g) => g.radius < SWEEPER.range);
  for (const tower of b.buildings) {
    if (tower.kind !== 'airsweeper') continue;
    const states = (b.sweepers ??= {});
    if (tower.hp <= 0 || tower.constructing || tower.upgradeEnd) {
      delete states[tower.id];
      continue;
    }
    const activeDt = Math.min(dt, Math.max(0, b.elapsed - (b.defenseStuns[tower.id] ?? 0)));
    if (activeDt < dt) {
      delete states[tower.id];
      delete b.defenseTargets[tower.id];
    }
    if (activeDt <= 0) continue;
    const preparationDt = Math.max(0, activeDt - tower.cooldown);
    tower.cooldown = Math.max(0, tower.cooldown - activeDt);
    let state: SweeperState | undefined = states[tower.id];
    const eligible = (u: Unit) =>
      u.hp > 0 && !!TROOPS[u.kind].flying && !unitHidden(u, b.elapsed) && inSweeperRange(tower, u);
    let target = b.units.find((u) => u.id === state?.targetId && eligible(u));
    if (!target) {
      delete states[tower.id];
      delete b.defenseTargets[tower.id];
      state = undefined;
    }
    if (tower.cooldown > 0) continue;
    if (!state) {
      target = b.units
        .filter(eligible)
        .sort(
          (a, c) =>
            distance2D(a.x - tower.x - 1, a.y - tower.y - 1) -
              distance2D(c.x - tower.x - 1, c.y - tower.y - 1) || a.id - c.id,
        )[0];
      if (!target) continue;
      const [directionX, directionY] = DIRECTIONS[tower.direction ?? 0];
      state = states[tower.id] = {
        targetId: target.id,
        prepare: SWEEPER.prepare,
        directionX,
        directionY,
      };
      b.defenseTargets[tower.id] = target.id;
      continue;
    }
    const dx = target!.x - tower.x - 1,
      dy = target!.y - tower.y - 1,
      distance = distance2D(dx, dy);
    state.directionX = dx / distance;
    state.directionY = dy / distance;
    state.prepare -= preparationDt;
    if (state.prepare > 1e-9) continue;
    const x = tower.x + BUILDINGS[tower.kind].size / 2,
      y = tower.y + BUILDINGS[tower.kind].size / 2;
    (b.gusts ??= []).push({
      sourceId: tower.id,
      x,
      y,
      directionX: state.directionX,
      directionY: state.directionY,
      radius: SWEEPER.minRange,
      push: sweeperStats(tower.level).push,
      hit: [],
      launched: b.elapsed,
    });
    state.firedAt = b.elapsed;
    // Presentation history survives loss of the target, stun and destruction.
    // It records actual launches without affecting targeting, clocks or RNG.
    const history = historyFor(b, tower.id);
    history.shots.push({
      index: ++history.fired,
      at: b.elapsed,
      x,
      y,
      directionX: state.directionX,
      directionY: state.directionY,
    });
    if (history.shots.length > 16) history.shots.shift();
    const overshoot = Math.min(0, state.prepare);
    state.prepare = SWEEPER.prepare;
    // Preparation is part of the five-second cycle.
    tower.cooldown = SWEEPER.rate - SWEEPER.prepare + overshoot;
    effect({
      type: 'gust',
      sourceId: tower.id,
      x,
      y,
      toX: x + state.directionX,
      toY: y + state.directionY,
    });
  }
}

/** Displacement is independent of Rage and cancels attacks until the push ends. */
export function stepAirPush(u: Unit, dt: number) {
  const push = u.airPush;
  if (!push) return false;
  const travel = Math.min(dt, push.remaining);
  u.x = Math.max(0, Math.min(MAP_SIZE, u.x + push.x * travel));
  u.y = Math.max(0, Math.min(MAP_SIZE, u.y + push.y * travel));
  u.attacking = false;
  u.cooldown = Math.max(0, u.cooldown - travel);
  push.remaining -= travel;
  if (push.remaining <= 1e-9) delete u.airPush;
  return true;
}
