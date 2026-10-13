import raw from '../../reference/scattershot/runtime.json' with { type: 'json' };
import {
  nativeMatrix,
  nativeScenePoses,
  nativeVertices,
  type NativeMatrix,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';
import { SCATTERSHOT_ART, SCATTERSHOT_PREVIEW_TURRET } from './scattershot-art';
import { SCATTERSHOT, SCATTERSHOT_EXPORTS, scattershotStats } from './scattershot-stats';
import type { ScattershotProjectile, ScattershotTowerState } from './scattershot';

export const SCATTERSHOT_GRAPH = raw as unknown as NativeMeshGraph;
export type ScattershotVisualState = 'active' | 'upgrading' | 'ruin';
const FPS = 30;
const VIEWS = 24;
const FRAMES_PER_VIEW = 15;
const { scale, anchorX, anchorY } = SCATTERSHOT_ART;
export const SCATTERSHOT_ROOT: NativeMatrix = [
  scale,
  0,
  -anchorX * scale,
  0,
  scale,
  -anchorY * scale,
];

/** Calibrated like the X-Bow and Mortar turrets: frame 0 throws along +map X, 90 along +map Y. */
export function scattershotView(dx: number, dy: number) {
  const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
  return ((Math.round(degrees / (360 / VIEWS)) % VIEWS) + VIEWS) % VIEWS;
}
/**
 * Throw clip phase: AnimationActionFrame (5 at 30 fps) is aligned with the recorded release, so
 * the arm starts 5/30 s early. The pre-roll is predicted from the retained charge state.
 */
export function scattershotThrowPhase(
  level: number,
  tower: ScattershotTowerState | undefined,
  t: number,
) {
  if (!tower) return 0;
  const action = scattershotStats(level).animationActionFrame / FPS;
  for (let i = tower.shots.length - 1; i >= 0; i--) {
    const start = tower.shots[i].at - action;
    if (t + 1e-9 < start) continue;
    const phase = Math.floor((t - start) * FPS + 1e-9);
    if (phase < FRAMES_PER_VIEW) return phase;
    break;
  }
  if (tower.targetId !== null && tower.cooldownMs === 0 && tower.ammunition > 0) {
    const ticks = Math.max(1, Math.ceil((SCATTERSHOT.chargeMs - tower.hitMs) / 64));
    const lastTick = Math.floor(t / 0.064 + 1e-9) * 0.064;
    const start = lastTick + ticks * 0.064 - action;
    if (t + 1e-9 >= start)
      return Math.min(FRAMES_PER_VIEW - 1, Math.floor((t - start) * FPS + 1e-9));
  }
  return 0;
}
export function scattershotTurret(
  tower: ScattershotTowerState | undefined,
  level: number,
  t: number,
  reduced = false,
) {
  const view = tower
    ? scattershotView(tower.aimX, tower.aimY)
    : SCATTERSHOT_PREVIEW_TURRET / FRAMES_PER_VIEW;
  return view * FRAMES_PER_VIEW + (reduced ? 0 : scattershotThrowPhase(level, tower, t));
}

export function scattershotPoses(level: number, state: ScattershotVisualState, turret: number) {
  const row = scattershotStats(level);
  const sample = (name: string, controls: Record<string, number> = {}) =>
    nativeScenePoses(SCATTERSHOT_GRAPH, name, 0, controls, SCATTERSHOT_ROOT);
  if (state === 'ruin') return sample(SCATTERSHOT_EXPORTS.ruin);
  return [
    ...sample(SCATTERSHOT_EXPORTS.base),
    ...sample(state === 'upgrading' ? row.upgrade : row.body, {
      turret: state === 'upgrading' ? turret - (turret % FRAMES_PER_VIEW) : turret,
    }),
  ];
}
/** Transformed vertex bounds of composed poses (renderer-free, so combat tests can import it). */
export function scattershotPoseBounds(
  poses: readonly NativeScenePose[],
): [number, number, number, number] | undefined {
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  const visit = (list: readonly NativeScenePose[]) => {
    for (const pose of list) {
      if ('group' in pose) visit(pose.group);
      else {
        const v = nativeVertices(pose);
        for (let i = 0; i < v.length; i += 4) {
          left = Math.min(left, v[i]);
          top = Math.min(top, v[i + 1]);
          right = Math.max(right, v[i]);
          bottom = Math.max(bottom, v[i + 1]);
        }
      }
    }
  };
  visit(poses);
  return left === Infinity ? undefined : [left, top, right, bottom];
}

const bounds = new Map<number, [number, number, number, number]>();
export function scattershotBounds(level: number) {
  let result = bounds.get(level);
  if (!result) {
    result = scattershotPoseBounds(scattershotPoses(level, 'active', SCATTERSHOT_PREVIEW_TURRET))!;
    bounds.set(level, result);
  }
  return result;
}

type Point = { x: number; y: number };
/**
 * Flight presentation: source StartHeight (×0.8 screen altitude) descending to the target layer,
 * plus a local ballistic arc of one quarter of the screen distance (BallisticHeight is zero in
 * the source; the native default arc is unverified). Rotation follows the screen velocity.
 */
export function scattershotProjectilePoint(
  p: Pick<ScattershotProjectile, 'fromX' | 'fromY' | 'x' | 'y' | 'targetX' | 'targetY' | 'air'>,
  iso: (x: number, y: number) => Point,
  airLift: number,
) {
  const flown = Math.hypot(p.x - p.fromX, p.y - p.fromY),
    left = Math.hypot(p.targetX - p.x, p.targetY - p.y),
    u = flown + left > 1e-9 ? flown / (flown + left) : 1;
  const from = iso(p.fromX, p.fromY),
    to = iso(p.targetX, p.targetY),
    ground = iso(p.x, p.y);
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const height =
    (1 - u) * SCATTERSHOT.startHeight * SCATTERSHOT_ART.altitudeScale + u * (p.air ? airLift : 0);
  const arc = Math.sin(u * Math.PI) * distance * 0.25;
  return { u, x: ground.x, y: ground.y - height - arc, ground, from, to, distance };
}
let shadowPoses: NativeScenePose[] | undefined;
/** The rock art and its static ground shadow at the `scattershotProjectilePoint`. */
export function scattershotProjectilePose(
  p: ScattershotProjectile,
  iso: (x: number, y: number) => Point,
  airLift: number,
  t: number,
) {
  const { u, x, y, ground, from, to, distance } = scattershotProjectilePoint(p, iso, airLift);
  const slope =
    -(p.air ? airLift : 0) +
    SCATTERSHOT.startHeight * SCATTERSHOT_ART.altitudeScale -
    Math.cos(u * Math.PI) * Math.PI * distance * 0.25;
  const angle = Math.atan2(to.y - from.y + slope, to.x - from.x || 1e-6);
  const c = Math.cos(angle) * scale,
    s = Math.sin(angle) * scale;
  const row = scattershotStats(p.level);
  const age = Math.max(0, t - p.launchedAt);
  return {
    u,
    x,
    y,
    ground,
    poses: nativeScenePoses(SCATTERSHOT_GRAPH, row.projectileExport, age, {}, [c, -s, 0, s, c, 0]),
    shadow: (shadowPoses ??= nativeScenePoses(
      SCATTERSHOT_GRAPH,
      SCATTERSHOT_EXPORTS.shadow,
      0,
      {},
      [scale, 0, 0, 0, scale, 0],
    )),
  };
}

/** The shard cone rotation is selected by map angle; its `ib_effect` child keeps its own clock. */
const coneRoot = SCATTERSHOT_GRAPH.clips[SCATTERSHOT_GRAPH.exports[SCATTERSHOT_EXPORTS.cone]];
const coneSlot = coneRoot.names.indexOf('turret');
const coneRotation = SCATTERSHOT_GRAPH.clips[coneRoot.children[coneSlot]];
const CONE_KEY = 'scattershot:ib_effect';
const CONE_GRAPH: NativeMeshGraph = {
  ...SCATTERSHOT_GRAPH,
  exports: { ...SCATTERSHOT_GRAPH.exports, [CONE_KEY]: coneRotation.children[0] },
};
export function scattershotConePoses(dirX: number, dirY: number, age: number) {
  const degrees = ((Math.round((Math.atan2(dirY, dirX) * 180) / Math.PI) % 360) + 360) % 360;
  const rootPlacement = coneRoot.frames[coneRoot.timeline[0]].find((p) => p[0] === coneSlot)!;
  const rotation =
    coneRotation.frames[coneRotation.timeline[degrees % coneRotation.timeline.length]][0];
  const matrix = nativeMatrix(
    nativeMatrix([scale, 0, 0, 0, scale, 0], SCATTERSHOT_GRAPH.matrices[rootPlacement[1]]),
    SCATTERSHOT_GRAPH.matrices[rotation[1]],
  );
  const clip = SCATTERSHOT_GRAPH.clips[coneRotation.children[0]];
  if (age < 0 || age * 24 >= clip.timeline.length) return [];
  return nativeScenePoses(CONE_GRAPH, CONE_KEY, age, {}, matrix);
}
