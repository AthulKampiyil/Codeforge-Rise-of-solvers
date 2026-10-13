import raw from '../../reference/eagle-artillery/runtime.json' with { type: 'json' };
import baseRaw from '../../reference/eagle-artillery/base.json' with { type: 'json' };
import {
  nativeMatrix,
  nativeScenePoses,
  nativeVertices,
  type NativeMatrix,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';
import { EAGLE_ARTILLERY_ART } from './eagle-artillery-art';
import {
  EAGLE_ARTILLERY,
  EAGLE_ARTILLERY_BEAMS,
  EAGLE_ARTILLERY_EXPORTS,
  EAGLE_ARTILLERY_TURRET,
  eagleArtilleryStats,
} from './eagle-artillery-stats';
import type {
  EagleArtilleryShell,
  EagleArtilleryTowerState,
  EagleArtilleryVolley,
} from './eagle-artillery';

export const EAGLE_ARTILLERY_GRAPH = raw as unknown as NativeMeshGraph;
export const EAGLE_ARTILLERY_BASE_GRAPH = baseRaw as unknown as NativeMeshGraph;
export type EagleArtilleryVisualState = 'active' | 'upgrading' | 'ruin';
const FPS = 24;
const { scale, anchorX, anchorY } = EAGLE_ARTILLERY_ART;
export const EAGLE_ARTILLERY_ROOT: NativeMatrix = [
  scale,
  0,
  -anchorX * scale,
  0,
  scale,
  -anchorY * scale,
];

export const eagleArtilleryLabels = (level: number) => {
  const turret = EAGLE_ARTILLERY_TURRET[String(level)];
  if (!turret) throw Error(`Unsupported Eagle Artillery level: ${level}`);
  return turret.labels;
};

/**
 * Local presentation schedule over the named `turret_load` states. Activation stages follow the
 * recorded deployed-housing thresholds (25/50/75/100% of WakeUpSpace, 25 frames each); every
 * launch shows `attack_start`/`attack_end`, a completed burst plays `load`, emptiness plays
 * `deactivate` and holds `empty`. Native listener timing is unverified. Reduced motion holds each
 * state's settled frame (dormant stage end, first battle-idle frame, empty) without transitions.
 */
export function eagleArtilleryTurretFrame(
  level: number,
  tower: EagleArtilleryTowerState | undefined,
  t: number,
  reduced = false,
) {
  const labels = eagleArtilleryLabels(level);
  if (!tower) return labels.idle;
  if (reduced) {
    if (tower.emptyAt !== undefined && t + 1e-9 >= tower.emptyAt) return labels.empty;
    if (tower.awakeAt !== undefined && t + 1e-9 >= tower.awakeAt) return labels.battleidle_start;
    const reached = tower.stages.filter((at) => at <= t + 1e-9).length;
    return reached ? 25 * reached : labels.idle;
  }
  if (tower.emptyAt !== undefined && t + 1e-9 >= tower.emptyAt) {
    const age = (t - tower.emptyAt) * FPS;
    if (age < 2) return labels.attack_start + Math.floor(age);
    const frame = labels.deactivate_start + Math.floor(age - 2);
    return frame <= labels.deactivating_end ? frame : labels.empty;
  }
  let lastLaunch: number | undefined, completed: number | undefined;
  for (const volley of tower.volleys)
    for (const [i, at] of volley.launches.entries())
      if (at <= t + 1e-9) {
        lastLaunch = at;
        if (i === EAGLE_ARTILLERY.burstCount - 1) completed = at;
      }
  if (lastLaunch !== undefined && (t - lastLaunch) * FPS < 2)
    return labels.attack_start + Math.floor((t - lastLaunch) * FPS);
  if (completed !== undefined) {
    const age = (t - completed) * FPS - 2;
    if (age >= 0 && age <= labels.load_end - labels.load_start)
      return labels.load_start + Math.floor(age);
  }
  if (tower.awakeAt !== undefined && t + 1e-9 >= tower.awakeAt) {
    const loop = labels.battleidle_end - labels.battleidle_start + 1;
    return labels.battleidle_start + (Math.floor((t - tower.awakeAt) * FPS + 1e-9) % loop);
  }
  let frame: number = labels.idle,
    end = -Infinity;
  for (const [stage, at] of tower.stages.entries()) {
    if (at > t + 1e-9) break;
    const start = Math.max(at, end);
    if (start > t + 1e-9) break;
    frame = 25 * stage + Math.min(25, 1 + Math.floor((t - start) * FPS + 1e-9));
    end = start + 25 / FPS;
  }
  return frame;
}

export function eagleArtilleryPoses(
  level: number,
  state: EagleArtilleryVisualState,
  frame: number,
) {
  const row = eagleArtilleryStats(level);
  if (state === 'ruin')
    return nativeScenePoses(
      EAGLE_ARTILLERY_GRAPH,
      EAGLE_ARTILLERY_EXPORTS.ruin,
      0,
      {},
      EAGLE_ARTILLERY_ROOT,
    );
  return nativeScenePoses(
    EAGLE_ARTILLERY_GRAPH,
    state === 'upgrading' ? row.upgrade : row.body,
    0,
    { turret_load: frame },
    EAGLE_ARTILLERY_ROOT,
  );
}
export const eagleArtilleryBasePoses = () =>
  nativeScenePoses(
    EAGLE_ARTILLERY_BASE_GRAPH,
    EAGLE_ARTILLERY_EXPORTS.base,
    0,
    {},
    EAGLE_ARTILLERY_ROOT,
  );

/** Screen offset of the named `targeting_pivot` (the barrel light) from the ground center. */
export function eagleArtilleryPivot(level: number, frame: number) {
  const row = eagleArtilleryStats(level);
  const root = EAGLE_ARTILLERY_GRAPH.clips[EAGLE_ARTILLERY_GRAPH.exports[row.body]];
  const slot = root.names.indexOf('turret_load');
  const placement = root.frames[root.timeline[0]].find((p) => p[0] === slot)!;
  const turret = EAGLE_ARTILLERY_GRAPH.clips[root.children[slot]];
  const pivotSlot = turret.names.indexOf('targeting_pivot');
  const pivot =
    turret.frames[turret.timeline[Math.min(frame, turret.timeline.length - 1)]].find(
      (p) => p[0] === pivotSlot,
    ) ??
    turret.frames[
      turret.timeline[EAGLE_ARTILLERY_TURRET[String(level)].labels.battleidle_start]
    ].find((p) => p[0] === pivotSlot)!;
  const matrix = nativeMatrix(
    nativeMatrix(EAGLE_ARTILLERY_ROOT, EAGLE_ARTILLERY_GRAPH.matrices[placement[1]]),
    EAGLE_ARTILLERY_GRAPH.matrices[pivot[1]],
  );
  return { x: matrix[2], y: matrix[5] };
}

/** Transformed vertex bounds of composed poses (renderer-free, so combat tests can import it). */
export function eagleArtilleryPoseBounds(
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
/** Dormant body registration over the ground center (health and upgrade bars). */
export function eagleArtilleryBounds(level: number) {
  let result = bounds.get(level);
  if (!result) {
    result = eagleArtilleryPoseBounds([
      ...eagleArtilleryBasePoses(),
      ...eagleArtilleryPoses(level, 'active', eagleArtilleryLabels(level).idle),
    ])!;
    bounds.set(level, result);
  }
  return result;
}

type BeamKind = 'ExportNameBeamStart' | 'ExportNameBeamEnd';
/** WarmUp from the volley start, Loop while active, then Fade once `endAt` passes. */
export function eagleArtilleryBeamFrame(
  kind: BeamKind,
  startedAt: number,
  endAt: number | undefined,
  t: number,
) {
  const { labels } = EAGLE_ARTILLERY_BEAMS[kind];
  if (t + 1e-9 < startedAt) return undefined;
  if (endAt !== undefined && t + 1e-9 >= endAt) {
    const fade = Math.floor((t - endAt) * FPS + 1e-9);
    return fade > labels.fadeend - labels.fadestart ? undefined : labels.fadestart + fade;
  }
  const age = Math.floor((t - startedAt) * FPS + 1e-9);
  if (age < labels.loop) return age;
  return labels.loop + ((age - labels.loop) % (labels.loopend - labels.loop + 1));
}
export function eagleArtilleryBeamPoses(kind: BeamKind, frame: number) {
  return nativeScenePoses(
    EAGLE_ARTILLERY_GRAPH,
    EAGLE_ARTILLERY_BEAMS[kind].export,
    frame / FPS,
    {},
    [scale, 0, 0, 0, scale, 0],
  );
}
/** Volley shells share the volley's launch index range. */
export const volleyShellIndex = (volley: EagleArtilleryVolley, i: number) => volley.index + i + 1;

type Point = { x: number; y: number };
/**
 * Ballistic presentation: launch from the barrel pivot, source BallisticHeight as a parabola peak
 * (×0.8 screen altitude), landing on the tracked destination at the simulated arrival time.
 * TrajectoryStyle 1 and the native height conversion are unverified local interpretations.
 */
export function eagleArtilleryShellPoint(
  shell: EagleArtilleryShell,
  t: number,
  iso: (x: number, y: number) => Point,
  pivot: Point,
  airLift: number,
) {
  const duration = Math.max(0.001, EAGLE_ARTILLERY.travelMs / 1000);
  const u = Math.max(0, Math.min(1, (t - shell.launchedAt) / duration));
  const start = iso(shell.fromX, shell.fromY),
    end = iso(shell.x, shell.y);
  const from = { x: start.x + pivot.x, y: start.y + pivot.y },
    to = { x: end.x, y: end.y - (shell.air ? airLift : 0) };
  const peak = EAGLE_ARTILLERY.ballisticHeight * EAGLE_ARTILLERY_ART.altitudeScale;
  const x = from.x + (to.x - from.x) * u,
    y = from.y + (to.y - from.y) * u - 4 * peak * u * (1 - u);
  return { u, x, y, from, to, peak };
}
/** The shell art at its `eagleArtilleryShellPoint`, rotated along the arc. */
export function eagleArtilleryShellPose(
  shell: EagleArtilleryShell,
  t: number,
  iso: (x: number, y: number) => Point,
  pivot: Point,
  airLift: number,
) {
  const { u, x, y, from, to, peak } = eagleArtilleryShellPoint(shell, t, iso, pivot, airLift);
  const angle = Math.atan2(to.y - from.y - 4 * peak * (1 - 2 * u), to.x - from.x || 1e-6);
  const c = Math.cos(angle) * scale,
    n = Math.sin(angle) * scale;
  const level = eagleArtilleryStats(shell.level);
  return {
    u,
    x,
    y,
    ground: { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u },
    poses: nativeScenePoses(
      EAGLE_ARTILLERY_GRAPH,
      level.projectileExport,
      Math.max(0, t - shell.launchedAt),
      {},
      [c, -n, 0, n, c, 0],
    ) as NativeScenePose[],
  };
}
