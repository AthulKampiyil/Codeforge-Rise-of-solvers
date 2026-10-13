import projectileArt from '../../reference/full-client/projectile-art.json' with { type: 'json' };
import { nativeScenePoses, type NativeMatrix, type NativeScenePose } from './native-mesh';
import { nativeSceneId, type NativeArtPack } from './native-art-pack';
import { NATIVE_ALTITUDE, NATIVE_ART_SCALE, nativeClipDuration } from './native-effects';

type Point = { x: number; y: number };
/** logic/projectiles.csv presentation columns retained by scripts/import-native-projectile-art.py. */
export interface NativeProjectileRow {
  SWF: string;
  ExportName: string;
  exports: string[];
  ShadowSWF?: string;
  ShadowExportName?: string;
  ScaleTimeline?: string;
  DirectionCount?: string;
  ParticleEmitter?: string;
  RotateEmitter?: string;
  Effect?: string;
  RotateEffect?: string;
  SpawnEffect?: string;
  StartHeight?: string;
  StartOffset?: string;
  IsBallistic?: string;
  UseRotate?: string;
  PlayOnce?: string;
  UseTopLayer?: string;
  Scale?: string;
  BallisticHeight?: string;
  FixedTravelTime?: string;
  DestroyedEffect?: string;
  BounceEffect?: string;
  HitSpell?: string;
}
export interface NativeProjectilePack extends NativeArtPack {
  projectiles: Record<string, NativeProjectileRow>;
}
const index = projectileArt as unknown as {
  projectiles: Record<string, string>;
  packs: Record<string, { path: string }>;
};
/** Flight pack of a client projectile row, when the row has retained original art. */
export const nativeProjectilePack = (name: string | undefined) =>
  name && Object.hasOwn(index.projectiles, name)
    ? index.packs[index.projectiles[name]].path
    : undefined;

const num = (value: string | undefined, fallback = 0) => {
  const parsed = Number(value);
  return value === undefined || value === '' || !Number.isFinite(parsed) ? fallback : parsed;
};

/**
 * Direction roots for DirectionCount rows: numbered exports cover the right half-turn and mirror
 * for leftward travel, sharing the troop direction-bucket convention (screen-space slope).
 */
export function nativeDirectionRoot(exports: readonly string[], dx: number, dy: number) {
  const sx = dx - dy,
    sy = (dx + dy) / 2;
  if (exports.length <= 1) return { name: exports[0], flip: false };
  const bucket =
    exports.length === 3
      ? sy / Math.max(1e-9, Math.abs(sx)) < -0.414
        ? 0
        : sy / Math.max(1e-9, Math.abs(sx)) > 0.414
          ? 2
          : 1
      : Math.min(
          exports.length - 1,
          Math.floor(((Math.atan2(sy, Math.abs(sx)) + Math.PI / 2) / Math.PI) * exports.length),
        );
  return { name: exports[bucket], flip: sx < 0 };
}

export interface NativeFlightShot {
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  launched: number;
  impact: number;
  fromAir?: boolean;
  toAir?: boolean;
}
export interface NativeFlightOptions {
  iso: (x: number, y: number) => Point;
  airLift: number;
  /** Screen height of a ground target's hit point. */
  targetHeight?: number;
}

/** Projected flight point, tangent and presentation clock of one native projectile. */
export function nativeProjectileFlight(
  row: NativeProjectileRow,
  shot: NativeFlightShot,
  elapsed: number,
  options: NativeFlightOptions,
) {
  const { iso, airLift, targetHeight = 16 } = options;
  const dx = shot.x - shot.fromX,
    dy = shot.y - shot.fromY,
    length = Math.hypot(dx, dy);
  const ux = length > 1e-9 ? dx / length : 1,
    uy = length > 1e-9 ? dy / length : 0;
  const fixed = num(row.FixedTravelTime) / 1000;
  const end = fixed > 0 ? shot.launched + fixed : shot.impact;
  const t = Math.max(
    0,
    Math.min(1, (elapsed - shot.launched) / Math.max(1e-3, end - shot.launched)),
  );
  // StartOffset (1/100 tile) moves the launch point toward the target, never past it.
  const offset = Math.min(num(row.StartOffset) / 100, length * 0.9);
  const start = iso(shot.fromX + ux * offset, shot.fromY + uy * offset);
  const finish = iso(shot.x, shot.y);
  const h0 = num(row.StartHeight) * NATIVE_ALTITUDE + (shot.fromAir ? airLift : 0);
  const h1 = shot.toAir ? airLift : targetHeight;
  const peak = row.IsBallistic === 'TRUE' ? num(row.BallisticHeight) * NATIVE_ALTITUDE : 0;
  const height = h0 + (h1 - h0) * t + 4 * peak * t * (1 - t);
  const ground = { x: start.x + (finish.x - start.x) * t, y: start.y + (finish.y - start.y) * t };
  const slope = h1 - h0 + 4 * peak * (1 - 2 * t);
  const rotation =
    row.UseRotate === 'TRUE'
      ? Math.atan2(finish.y - start.y - slope, finish.x - start.x) - Math.PI / 2
      : 0;
  return {
    t,
    end,
    ground,
    x: ground.x,
    y: ground.y - height,
    height,
    rotation,
    direction: { x: ux, y: uy },
  };
}

/** Original flight art (and ground shadow) at a flight point. */
export function nativeProjectilePoses(
  pack: NativeProjectilePack,
  row: NativeProjectileRow,
  flight: ReturnType<typeof nativeProjectileFlight>,
  elapsed: number,
  launched: number,
): {
  scene: string;
  poses: NativeScenePose[];
  shadow?: { scene: string; poses: NativeScenePose[] };
} {
  const scene = nativeSceneId(row.SWF);
  const graph = pack.scenes[scene];
  const root = nativeDirectionRoot(row.exports, flight.direction.x, flight.direction.y);
  if (!graph || !root.name || graph.exports[root.name] === undefined) return { scene, poses: [] };
  const duration = nativeClipDuration(graph, root.name);
  const age = Math.max(0, elapsed - launched);
  let seconds = row.ScaleTimeline === 'TRUE' ? flight.t * duration : age;
  if (row.PlayOnce === 'TRUE') seconds = Math.min(seconds, Math.max(0, duration - 1e-3));
  const s = (NATIVE_ART_SCALE * num(row.Scale, 100)) / 100;
  const c = Math.cos(flight.rotation) * s,
    sn = Math.sin(flight.rotation) * s,
    f = root.flip ? -1 : 1;
  const matrix: NativeMatrix = [c * f, -sn, 0, sn * f, c, 0];
  const poses = nativeScenePoses(graph, root.name, seconds, {}, matrix);
  const shadowScene = nativeSceneId(row.ShadowSWF || row.SWF);
  const shadowGraph = pack.scenes[shadowScene];
  const shadow =
    row.ShadowExportName && shadowGraph?.exports[row.ShadowExportName] !== undefined
      ? {
          scene: shadowScene,
          poses: nativeScenePoses(shadowGraph, row.ShadowExportName, age, {}, [s, 0, 0, 0, s, 0]),
        }
      : undefined;
  return { scene, poses, shadow };
}

/** Firespitter balls: straight flight at the launch height, from the muzzle offset along the line. */
export function nativePiercingFlight(
  row: NativeProjectileRow,
  shot: {
    fromX: number;
    fromY: number;
    dirX: number;
    dirY: number;
    length: number;
    speed: number;
    launched: number;
  },
  elapsed: number,
  iso: (x: number, y: number) => Point,
) {
  const travelled = Math.min(shot.length, Math.max(0, elapsed - shot.launched) * shot.speed);
  const along = Math.max(travelled, Math.min(num(row.StartOffset) / 100, shot.length));
  const ground = iso(shot.fromX + shot.dirX * along, shot.fromY + shot.dirY * along);
  const ahead = iso(shot.fromX + shot.dirX * (along + 1), shot.fromY + shot.dirY * (along + 1));
  const height = num(row.StartHeight) * NATIVE_ALTITUDE;
  return {
    t: shot.length > 0 ? travelled / shot.length : 1,
    end: shot.launched + shot.length / Math.max(1e-6, shot.speed),
    ground,
    x: ground.x,
    y: ground.y - height,
    height,
    rotation:
      row.UseRotate === 'TRUE'
        ? Math.atan2(ahead.y - ground.y, ahead.x - ground.x) - Math.PI / 2
        : 0,
    direction: { x: shot.dirX, y: shot.dirY },
  };
}
