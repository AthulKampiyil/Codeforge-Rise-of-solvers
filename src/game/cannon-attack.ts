import type { Battle, Building } from './model';
import type { CombatProjectile } from './projectiles';
import { cannonTrail } from './cannon-stats';
import { distance2D } from './distance';

export interface CannonTrailPoint {
  index: number;
  at: number;
  x: number;
  y: number;
  progress: number;
}
export interface CannonShot {
  index: number;
  id: string;
  level: number;
  sourceId: number;
  targetId: number;
  fromX: number;
  fromY: number;
  aimX: number;
  aimY: number;
  x: number;
  y: number;
  launched: number;
  impact: number;
  flight: {
    at: number;
    x: number;
    y: number;
    progress: number;
    headingX: number;
    headingY: number;
  };
  emitted: number;
  trail: CannonTrailPoint[];
}
export interface CannonHit {
  index: number;
  level: number;
  at: number;
  x: number;
  y: number;
}
export interface CannonAttackState {
  fired: number;
  shots: CannonShot[];
  hits: CannonHit[];
  destroyedAt?: number;
}
const stateFor = (battle: Battle, id: number) =>
  ((battle.cannons ??= {})[id] ??= { fired: 0, shots: [], hits: [] });
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Presentation history follows actual projectiles; historical physical objects stay untouched. */
export function recordCannonShot(battle: Battle, tower: Building, projectile: CombatProjectile) {
  const state = stateFor(battle, tower.id);
  state.shots.push({
    index: ++state.fired,
    id: projectile.id,
    level: tower.level,
    sourceId: tower.id,
    targetId: projectile.targetId,
    fromX: projectile.fromX,
    fromY: projectile.fromY,
    aimX: projectile.x,
    aimY: projectile.y,
    x: projectile.x,
    y: projectile.y,
    launched: projectile.launched,
    impact: projectile.impact,
    emitted: 0,
    trail: [],
    flight: {
      at: projectile.launched,
      x: projectile.fromX,
      y: projectile.fromY,
      progress: 0,
      headingX: projectile.x - projectile.fromX,
      headingY: projectile.y - projectile.fromY,
    },
  });
  if (state.shots.length > 16) state.shots.shift();
}

/** Keep only live source trail births. Even tiny simulation steps cannot grow an unbounded path. */
export function recordCannonFlight(battle: Battle, p: CombatProjectile) {
  const shot = battle.cannons?.[p.sourceId]?.shots.find((v) => v.id === p.id);
  if (!shot) return;
  const at = Math.min(battle.elapsed, p.impact),
    previous = shot.flight;
  const fraction = clamp((at - p.launched) / Math.max(0.01, p.impact - p.launched));
  const x = p.flight?.x ?? mix(p.fromX, p.x, fraction),
    y = p.flight?.y ?? mix(p.fromY, p.y, fraction);
  const travelled = distance2D(x - p.fromX, y - p.fromY),
    remaining = distance2D(p.x - x, p.y - y);
  const progress = p.flight
    ? travelled + remaining
      ? travelled / (travelled + remaining)
      : 1
    : fraction;
  const trail = cannonTrail(shot.level);
  if (trail) {
    const end = Math.max(
      0,
      Math.ceil((Math.min(battle.elapsed + 1e-9, p.impact) - shot.launched) / trail.interval),
    );
    const start = Math.max(
      shot.emitted,
      0,
      Math.ceil((battle.elapsed - trail.life - shot.launched) / trail.interval),
    );
    shot.trail = shot.trail.filter((v) => battle.elapsed - v.at < trail.life);
    for (let i = start; i < end; i++) {
      const born = shot.launched + i * trail.interval;
      if (born >= p.impact) break;
      const t = at > previous.at ? clamp((born - previous.at) / (at - previous.at)) : 0;
      shot.trail.push({
        index: i,
        at: born,
        x: mix(previous.x, x, t),
        y: mix(previous.y, y, t),
        progress: mix(previous.progress, progress, t),
      });
    }
    shot.emitted = end;
  }
  shot.x = p.x;
  shot.y = p.y;
  shot.impact = p.impact;
  shot.flight = {
    at,
    x,
    y,
    progress,
    headingX: x !== previous.x || y !== previous.y ? x - previous.x : previous.headingX,
    headingY: x !== previous.x || y !== previous.y ? y - previous.y : previous.headingY,
  };
}
export function recordCannonHit(battle: Battle, p: CombatProjectile) {
  const state = battle.cannons?.[p.sourceId],
    shot = state?.shots.find((v) => v.id === p.id);
  if (!state || !shot) return;
  state.hits.push({ index: shot.index, level: shot.level, at: p.impact, x: p.x, y: p.y });
  if (state.hits.length > 16) state.hits.shift();
}
export function recordCannonDestroyed(battle: Battle, tower: Building, at: number) {
  stateFor(battle, tower.id).destroyedAt ??= at;
}
