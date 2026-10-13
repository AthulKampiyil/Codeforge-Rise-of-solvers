import runtime from '../../reference/monolith/runtime.json' with { type: 'json' };
import type { Battle, Building } from './model';
import {
  nativeScenePoses,
  type NativeMatrix,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';
import { sourcePoseBounds } from './spell-tower-effect-player';
import { MONOLITH_ART } from './monolith-art';
import { MONOLITH, monolithStats, monolithVariant, type MonolithVariant } from './monolith-stats';
import type { MonolithProjectile, MonolithTowerState } from './monolith';
import { battleUnit } from './battle-index';

export const MONOLITH_GRAPH = runtime as unknown as NativeMeshGraph;
export const MONOLITH_EFFECTS = runtime.effects as Record<string, Record<string, string>[]>;
export const MONOLITH_EMITTERS = runtime.particles as Record<string, Record<string, string>[]>;
export const MONOLITH_SOUNDS = runtime.sounds as Record<string, { path: string; sha256: string }>;
export const MONOLITH_VIEWS = Object.keys(runtime.turretViews);
export type MonolithVisualState = 'setup' | 'constructing' | 'upgrading' | 'ruin';
const { scale, anchorX, anchorY } = MONOLITH_ART;
/** Local registration: source root `anchorY` units above the 3×3 ground center. */
export const MONOLITH_ROOT: NativeMatrix = [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale];
/** The same projection as the other native turrets: frame 0 aims along +map X, 90 along +map Y. */
export function monolithDirection(dx: number, dy: number) {
  return (Math.floor((Math.atan2(dy, dx) * 180) / Math.PI) + 360) % 360;
}
const clip = (name: string) => MONOLITH_GRAPH.clips[MONOLITH_GRAPH.exports[name]];
const ATTACK_FRAMES = MONOLITH_GRAPH.clips[Object.values(runtime.turretViews)[0]].timeline.length;
const ATTACK_FPS = MONOLITH_GRAPH.clips[Object.values(runtime.turretViews)[0]].fps;
const ORB =
  MONOLITH_GRAPH.clips[
    MONOLITH_GRAPH.clips[Object.values(runtime.turretViews)[0]].children[
      MONOLITH_GRAPH.clips[Object.values(runtime.turretViews)[0]].names.indexOf('projectile_0')
    ]
  ];

export interface MonolithPose {
  direction: number;
  /** Frame of the directional attack clip; `AnimationActionFrame` coincides with a release. */
  attack: number;
  variant: MonolithVariant;
  seconds: number;
}
/** State-driven turret pose from recorded releases and the current hit timer. */
export function monolithPose(
  tower: Building,
  state: MonolithTowerState | undefined,
  battle: Battle | null,
  elapsed: number,
  reduced: boolean,
): MonolithPose {
  const direction = state ? monolithDirection(state.aimX, state.aimY) : monolithDirection(1, 1);
  const target =
    state && battle ? [battleUnit(battle, state.targetId)].find((u) => !!u && u.hp > 0) : undefined;
  const pose: MonolithPose = {
    direction,
    attack: 0,
    variant: monolithVariant(tower.level, target?.maxHp),
    seconds: reduced ? 0 : elapsed,
  };
  if (!state || !battle || battle.finished || reduced) return pose;
  const shot = state.shots.at(-1);
  const age = shot ? elapsed - shot.at : Infinity;
  if (shot && age >= 0 && age < (ATTACK_FRAMES - MONOLITH.actionFrame) / ATTACK_FPS) {
    pose.attack = Math.min(
      ATTACK_FRAMES - 1,
      MONOLITH.actionFrame + Math.floor(age * ATTACK_FPS + 1e-9),
    );
    pose.variant = shot.variant;
    return pose;
  }
  if (target && state.readyAt <= elapsed + 1e-9) {
    const remaining = MONOLITH.windup - state.windup;
    if (remaining < MONOLITH.actionFrame / ATTACK_FPS)
      pose.attack = Math.max(0, Math.floor(MONOLITH.actionFrame - remaining * ATTACK_FPS + 1e-9));
  }
  return pose;
}

export function monolithPoses(
  level: number,
  state: MonolithVisualState,
  pose: Pick<MonolithPose, 'direction' | 'attack' | 'variant' | 'seconds'>,
  ruinAge = Infinity,
): NativeScenePose[] {
  const row = monolithStats(level);
  const sample = (name: string, seconds: number, controls: Record<string, number | false> = {}) =>
    nativeScenePoses(MONOLITH_GRAPH, name, seconds, controls, MONOLITH_ROOT);
  if (state === 'ruin') {
    const ruin = clip(row.ruin);
    return sample(row.ruin, Math.min(Math.max(0, ruinAge), (ruin.timeline.length - 1) / ruin.fps));
  }
  const base = sample(row.base, 0);
  if (state === 'constructing') return [...base, ...sample(row.construction, pose.seconds)];
  const controls: Record<string, number | false> = { turret: pose.direction };
  for (const view of MONOLITH_VIEWS) controls[view] = pose.attack;
  for (let v = 0; v < 3; v++)
    controls[`projectile_${v}`] =
      v === pose.variant - 1
        ? Math.floor(pose.seconds * ORB.fps + 1e-9) % ORB.timeline.length
        : false;
  return [
    ...base,
    ...sample(row.body, pose.seconds, controls),
    ...(state === 'upgrading'
      ? [...sample(row.upgrade, pose.seconds), ...sample(row.buildAnim, pose.seconds)]
      : []),
  ];
}
/**
 * What `monolithPoses` output depends on over time: the settled ruin's source frame, else the
 * 30 fps display frame (the orb and construction clips animate continuously).
 */
export function monolithTimeKey(
  level: number,
  state: MonolithVisualState,
  seconds: number,
  ruinAge = Infinity,
) {
  if (state !== 'ruin') return Math.floor(seconds * 30 + 1e-9);
  const ruin = clip(monolithStats(level).ruin);
  const age = Math.min(Math.max(0, ruinAge), (ruin.timeline.length - 1) / ruin.fps);
  return Math.floor(age * ruin.fps + 1e-9);
}
const boundsCache = new Map<string, [number, number, number, number]>();
/** Registered source bounds relative to the ground center, for health and upgrade bars. */
export function monolithBounds(level: number, state: MonolithVisualState = 'setup') {
  const key = `${level}:${state}`;
  let bounds = boundsCache.get(key);
  if (!bounds) {
    bounds = sourcePoseBounds(
      monolithPoses(level, state, { direction: 45, attack: 0, variant: 3, seconds: 0 }),
    ) ?? [-80, -200, 80, 40];
    boundsCache.set(key, bounds);
  }
  return bounds;
}

const projectileRow = (variant: MonolithVariant) => runtime.projectiles[variant - 1];
type MonolithFlight = Pick<
  MonolithProjectile,
  'fromX' | 'fromY' | 'x' | 'y' | 'launched' | 'impact' | 'toAir' | 'variant' | 'flight'
>;
/** Source StartHeight/StartOffset with the local altitude projection used by other native towers. */
export function monolithFlightPoint(
  p: MonolithFlight,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
  airLift: number,
) {
  const row = projectileRow(p.variant);
  const age = Math.max(0, elapsed - p.launched);
  const t = Math.max(0, Math.min(1, age / Math.max(0.01, p.impact - p.launched)));
  const distance = Math.hypot(p.x - p.flight.x, p.y - p.flight.y);
  const f = distance
    ? Math.min(1, (Math.max(0, elapsed - p.flight.at) * MONOLITH.projectileSpeed) / distance)
    : 1;
  const dx = p.x - p.fromX,
    dy = p.y - p.fromY,
    length = Math.hypot(dx, dy) || 1;
  const offset = (row.startOffset / 100) * (1 - t);
  const ground = iso(
    p.flight.x + (p.x - p.flight.x) * f + (dx / length) * offset,
    p.flight.y + (p.y - p.flight.y) * f + (dy / length) * offset,
  );
  const lift = row.startHeight * 0.8 * (1 - t) + (16 + (p.toAir ? airLift : 0)) * t;
  return { t, age, x: ground.x, y: ground.y - lift };
}
/** The orb art at its `monolithFlightPoint`, pointed at the target. */
export function monolithProjectilePose(
  p: MonolithFlight,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
  airLift: number,
) {
  const row = projectileRow(p.variant);
  const { t, age, x, y } = monolithFlightPoint(p, elapsed, iso, airLift);
  const to = iso(p.x, p.y);
  const angle = Math.atan2(to.y - 16 - (p.toAir ? airLift : 0) - y, to.x - x) - Math.PI / 2;
  const s = (row.scale / 100) * MONOLITH_ART.scale;
  const c = Math.cos(angle) * s,
    sn = Math.sin(angle) * s;
  const graphClip = clip(row.export);
  const time = row.scaleTimeline ? (t * (graphClip.timeline.length - 1)) / graphClip.fps : age;
  return {
    t,
    x,
    y,
    export: row.export,
    poses: nativeScenePoses(MONOLITH_GRAPH, row.export, time, {}, [c, -sn, 0, sn, c, 0]),
  };
}
