import runtime from '../../reference/builder-hut/runtime.json' with { type: 'json' };
import {
  nativeScenePoses,
  type NativeMatrix,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';
import { lateSceneBounds } from './late-goblin-buildings-poses';
import type { Battle, Building } from './model';
import type { LateProjectile } from './late-goblin-weapon';
import {
  BUILDER_HUT_SLEEP,
  BUILDER_HUT_SOURCE,
  BUILDER_HUT_TURRET,
  builderHutLevel,
  builderHutWeapon,
} from './builder-hut-stats';

export const BUILDER_HUT_GRAPH = runtime as unknown as NativeMeshGraph;
const SCALE = BUILDER_HUT_SOURCE.worldScale;
const ALTITUDE = 0.6;
type Point = { x: number; y: number };
export type BuilderHutVisualState = 'dormant' | 'waking' | 'active' | 'ruin';
export interface BuilderHutPose {
  level: number;
  state: BuilderHutVisualState;
  /** Root frame: the sleeping Z timeline while dormant, the awake frame afterwards. */
  root: number;
  /** turret_load label frame: idle, activating 1-37, battleidle. */
  load: number;
  /** Turret frame, 0-359 in ten-frame source direction bands. */
  turret: number;
  /** Ruin collapse frame. */
  ruin: number;
}
const root: NativeMatrix = [
  SCALE,
  0,
  -BUILDER_HUT_SOURCE.anchor[0] * SCALE,
  0,
  SCALE,
  -BUILDER_HUT_SOURCE.anchor[1] * SCALE,
];
/** Local map-angle registration centered on the ten-frame bands; frame 0 aims along +map X. */
export const builderHutFacing = (dx: number, dy: number) =>
  (Math.floor((Math.atan2(dy, dx) * 180) / Math.PI + 5) + 360) % 360;
const clipOf = (name: string) => BUILDER_HUT_GRAPH.clips[BUILDER_HUT_GRAPH.exports[name]];

export function builderHutPose(
  b: Building,
  battle: Battle | null,
  elapsed: number,
  reduced: boolean,
): BuilderHutPose {
  const row = builderHutLevel(b.level);
  const { load } = BUILDER_HUT_TURRET;
  const late = battle?.late?.builderHut;
  if (b.hp <= 0) {
    const clip = clipOf(row.ruin),
      last = clip.timeline.length - 1,
      destroyedAt = late?.destroyed[b.id];
    return {
      level: b.level,
      state: 'ruin',
      root: 0,
      load: load.idle,
      turret: 0,
      ruin:
        reduced || destroyedAt === undefined
          ? last
          : Math.max(0, Math.min(last, Math.floor((elapsed - destroyedAt) * clip.fps + 1e-9))),
    };
  }
  const hut = late?.huts[b.id];
  const sleeping = reduced
    ? BUILDER_HUT_SLEEP.awakeFrame
    : Math.floor(Math.max(0, elapsed) * BUILDER_HUT_SLEEP.fps + 1e-9) %
      BUILDER_HUT_SLEEP.rootFrames;
  if (!builderHutWeapon(b.level) || hut?.wakeAt === undefined || elapsed < hut.wakeAt)
    return {
      level: b.level,
      state: 'dormant',
      root: sleeping,
      load: load.idle,
      turret: 0,
      ruin: 0,
    };
  const turret = builderHutFacing(hut.aimX, hut.aimY);
  if (hut.readyAt !== undefined && elapsed + 1e-9 >= hut.readyAt)
    return {
      level: b.level,
      state: 'active',
      root: BUILDER_HUT_SLEEP.awakeFrame,
      load: load.battleIdle,
      turret,
      ruin: 0,
    };
  return {
    level: b.level,
    state: 'waking',
    root: BUILDER_HUT_SLEEP.awakeFrame,
    load: reduced
      ? load.activatingEnd
      : Math.min(
          load.activatingEnd,
          load.activatingStart + Math.floor((elapsed - hut.wakeAt) * BUILDER_HUT_SLEEP.fps + 1e-9),
        ),
    turret,
    ruin: 0,
  };
}

export function builderHutBasePoses(pose: BuilderHutPose): NativeScenePose[] {
  if (pose.state === 'ruin') return [];
  return nativeScenePoses(BUILDER_HUT_GRAPH, builderHutLevel(pose.level).base, 0, {}, root);
}
export function builderHutBodyPoses(pose: BuilderHutPose): NativeScenePose[] {
  const row = builderHutLevel(pose.level);
  if (pose.state === 'ruin')
    return nativeScenePoses(
      BUILDER_HUT_GRAPH,
      row.ruin,
      pose.ruin / clipOf(row.ruin).fps,
      {},
      root,
    );
  const armed = !!builderHutWeapon(pose.level);
  // The sign marks an absent builder; campaign builders start at home.
  const controls: Record<string, number | false> = { builder_out: false };
  if (armed) {
    // turret_load's battleidle frame repeats the root body and spring and holds the rest-direction
    // turret. Once combat starts, the aimed turret child replaces it instead of doubling the roof.
    const active = pose.state === 'active';
    controls.turret_load = active ? false : pose.load;
    controls.turret = active ? pose.turret : false;
  }
  return nativeScenePoses(
    BUILDER_HUT_GRAPH,
    row.body,
    pose.root / BUILDER_HUT_SLEEP.fps,
    controls,
    root,
  );
}

const boundsCache = new Map<string, [number, number, number, number]>();
/** Displayed bounds relative to the ground center: dormant hut, or the held ruin. */
export function builderHutBounds(b: Pick<Building, 'level' | 'hp'>) {
  const key = `${b.level}:${b.hp <= 0}`;
  const cached = boundsCache.get(key);
  if (cached) return cached;
  const row = builderHutLevel(b.level);
  const pose: BuilderHutPose =
    b.hp <= 0
      ? {
          level: b.level,
          state: 'ruin',
          root: 0,
          load: 0,
          turret: 0,
          ruin: clipOf(row.ruin).timeline.length - 1,
        }
      : {
          level: b.level,
          state: 'dormant',
          root: BUILDER_HUT_SLEEP.awakeFrame,
          load: 0,
          turret: 0,
          ruin: 0,
        };
  const bounds = lateSceneBounds(builderHutBodyPoses(pose));
  if (!bounds) throw Error(`Empty Builder's Hut pose: ${b.level}`);
  boundsCache.set(key, bounds);
  return bounds;
}

/** Original nail mesh along its tracked flight with the source ballistic height (local scale). */
export function builderHutNailPose(
  p: LateProjectile,
  level: number,
  elapsed: number,
  iso: (x: number, y: number) => Point,
  targetHeight: number,
) {
  const weapon = builderHutWeapon(level);
  if (!weapon) throw Error(`Unarmed Builder's Hut level: ${level}`);
  const row = weapon.projectile;
  const travelled = Math.hypot(p.flightX - p.fromX, p.flightY - p.fromY);
  const dx = p.x - p.flightX,
    dy = p.y - p.flightY;
  const remaining = Math.hypot(dx, dy);
  const progress = travelled + remaining ? travelled / (travelled + remaining) : 1;
  const offset = (row.startOffset / 100) * (1 - progress);
  const ground = iso(
    p.flightX + (dx / (remaining || 1)) * offset,
    p.flightY + (dy / (remaining || 1)) * offset,
  );
  const target = iso(p.x, p.y);
  const x = ground.x;
  const y =
    ground.y -
    row.startHeight * ALTITUDE * (1 - progress) -
    targetHeight * progress -
    row.ballisticHeight * ALTITUDE * Math.sin(progress * Math.PI);
  const rotation = Math.atan2(target.y - targetHeight - y, target.x - x) - Math.PI / 2;
  const c = Math.cos(rotation) * SCALE,
    s = Math.sin(rotation) * SCALE;
  return {
    x,
    y,
    progress,
    export: row.export,
    poses:
      elapsed < p.launched
        ? []
        : nativeScenePoses(BUILDER_HUT_GRAPH, row.export, Math.max(0, elapsed - p.launched), {}, [
            c,
            -s,
            0,
            s,
            c,
            0,
          ]),
  };
}
/** Turret pivot height above the ground center, from the source projectile StartHeight. */
export const builderHutMuzzleHeight = (level: number) =>
  (builderHutWeapon(level)?.projectile.startHeight ?? 0) * ALTITUDE;
