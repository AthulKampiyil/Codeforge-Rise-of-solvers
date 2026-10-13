import raw from '../../reference/cannon/runtime.json' with { type: 'json' };
import { nativeScenePoses, type NativeMeshGraph, type NativeMatrix } from './native-mesh';
import { CANNON_ART } from './cannon-art';
import { CANNON, CANNON_BUILDING, cannonStats, cannonProjectileRow } from './cannon-stats';
import type { Battle, Building } from './model';
import type { CannonShot, CannonTrailPoint } from './cannon-attack';
import { TROOPS } from './data';
import { battleDefenseTarget } from './battle-index';

export const CANNON_GRAPH = raw as unknown as NativeMeshGraph;
export type CannonVisualState = 'setup' | 'constructing' | 'upgrading' | 'ruin';
export interface CannonPose {
  state: CannonVisualState;
  turret: number;
  time: number;
}
/** Local map-angle registration centers the usual ten-frame bands, while retaining every source frame. */
export const cannonFacing = (dx: number, dy: number) =>
  (Math.floor((Math.atan2(dy, dx) * 180) / Math.PI + 5) + 360) % 360;
export function cannonPose(
  tower: Building,
  battle: Battle | null,
  elapsed: number,
  reduced = false,
): CannonPose {
  const state: CannonVisualState =
    tower.hp <= 0
      ? 'ruin'
      : tower.constructing
        ? 'constructing'
        : tower.upgradeEnd
          ? 'upgrading'
          : 'setup';
  const shot = battle?.cannons?.[tower.id]?.shots.at(-1);
  const target =
    state === 'setup' &&
    battle &&
    !battle.finished &&
    (battle.defenseStuns[tower.id] ?? 0) <= battle.elapsed
      ? [battleDefenseTarget(battle, tower.id)].find(
          (u) =>
            !!u &&
            u.hp > 0 &&
            !TROOPS[u.kind].flying &&
            Math.hypot(u.x - tower.x - 1.5, u.y - tower.y - 1.5) <= CANNON.range,
        )
      : undefined;
  const facing = target ?? (shot ? { x: shot.aimX, y: shot.aimY } : undefined);
  return {
    state,
    turret: facing ? cannonFacing(facing.x - tower.x - 1.5, facing.y - tower.y - 1.5) : 0,
    time: reduced ? 0 : Math.max(0, elapsed),
  };
}
export function cannonPoses(level: number, pose: CannonPose) {
  const row = cannonStats(level);
  if (!row) throw Error(`Unsupported native Cannon level: ${level}`);
  const { scale: s, anchorX: x, anchorY: y } = CANNON_ART;
  const root: NativeMatrix = [s, 0, -x * s, 0, s, -y * s];
  const sample = (name: string) =>
    nativeScenePoses(CANNON_GRAPH, name, pose.time, { turret: pose.turret, gearup: false }, root);
  if (pose.state === 'ruin') return sample(row.rubble);
  if (pose.state === 'constructing')
    return [...sample(row.base), ...sample(CANNON_BUILDING.ExportNameConstruction)];
  return [
    ...sample(row.base),
    ...sample(row.body),
    ...(pose.state === 'upgrading' ? sample(row.scaffold) : []),
  ];
}

type Bounds = [number, number, number, number];
const sourceBounds = new Map<number, Bounds | undefined>();
/** Conservative animated bounds combine original placements, with normal-mode gear disabled. */
function sourceBound(id: number): Bounds | undefined {
  if (sourceBounds.has(id)) return sourceBounds.get(id);
  const points: number[][] = [];
  const shapes = CANNON_GRAPH.shapes[id];
  if (shapes)
    for (const [, v] of shapes) for (let i = 0; i < v.length; i += 4) points.push([v[i], v[i + 1]]);
  else {
    const clip = CANNON_GRAPH.clips[id],
      seen = new Set<string>();
    for (const frame of clip.frames)
      for (const [slot, transform] of frame) {
        if (clip.names[slot] === 'gearup') continue;
        const key = `${slot}:${transform}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const b = sourceBound(clip.children[slot]);
        if (!b) continue;
        const [a, c, x, d, e, y] = CANNON_GRAPH.matrices[transform];
        for (const [px, py] of [
          [b[0], b[1]],
          [b[2], b[1]],
          [b[0], b[3]],
          [b[2], b[3]],
        ])
          points.push([a * px + c * py + x, d * px + e * py + y]);
      }
  }
  const result: Bounds | undefined = points.length
    ? [
        Math.min(...points.map((p) => p[0])),
        Math.min(...points.map((p) => p[1])),
        Math.max(...points.map((p) => p[0])),
        Math.max(...points.map((p) => p[1])),
      ]
    : undefined;
  sourceBounds.set(id, result);
  return result;
}
const bounds = new Map<string, Bounds>();
export function cannonBounds(level: number, state: CannonVisualState = 'setup'): Bounds {
  const key = `${level}:${state}`;
  if (bounds.has(key)) return bounds.get(key)!;
  const row = cannonStats(level);
  if (!row) throw Error(`Unsupported native Cannon level: ${level}`);
  const names =
    state === 'ruin'
      ? [row.rubble]
      : state === 'constructing'
        ? [row.base, CANNON_BUILDING.ExportNameConstruction]
        : [row.base, row.body, ...(state === 'upgrading' ? [row.scaffold] : [])];
  const boxes = names.map((n) => sourceBound(CANNON_GRAPH.exports[n])!).filter(Boolean),
    s = CANNON_ART.scale;
  const result: Bounds = [
    (Math.min(...boxes.map((b) => b[0])) - CANNON_ART.anchorX) * s,
    (Math.min(...boxes.map((b) => b[1])) - CANNON_ART.anchorY) * s,
    (Math.max(...boxes.map((b) => b[2])) - CANNON_ART.anchorX) * s,
    (Math.max(...boxes.map((b) => b[3])) - CANNON_ART.anchorY) * s,
  ];
  bounds.set(key, result);
  return result;
}
/** Source launch height/offset with local altitude projection; actual ground flight is simulation-owned. */
export function cannonFlightPoint(
  shot: CannonShot,
  point: Pick<CannonTrailPoint, 'x' | 'y' | 'progress'>,
  iso: (x: number, y: number) => { x: number; y: number },
) {
  const row = cannonProjectileRow(shot.level),
    dx = shot.aimX - shot.fromX,
    dy = shot.aimY - shot.fromY,
    length = Math.hypot(dx, dy) || 1;
  const offset = (Number(row.StartOffset) / 100) * (1 - point.progress);
  const ground = iso(point.x + (dx / length) * offset, point.y + (dy / length) * offset);
  const height = Number(row.StartHeight) * CANNON_ART.altitudeScale;
  return { x: ground.x, y: ground.y - height * (1 - point.progress) - 16 * point.progress };
}
export function cannonProjectilePose(
  shot: CannonShot,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
) {
  const row = cannonProjectileRow(shot.level),
    point = cannonFlightPoint(shot, shot.flight, iso);
  const origin = iso(0, 0),
    heading = iso(shot.flight.headingX, shot.flight.headingY);
  const rotation =
    row.UseRotate === 'TRUE'
      ? Math.atan2(heading.y - origin.y, heading.x - origin.x) - Math.PI / 2
      : 0;
  const s = (CANNON_ART.scale * Number(row.Scale)) / 100,
    c = Math.cos(rotation) * s,
    sn = Math.sin(rotation) * s;
  const time = Math.max(0, elapsed - shot.launched);
  return {
    ...point,
    time,
    rotation,
    progress: shot.flight.progress,
    export: row.ExportName,
    poses: nativeScenePoses(CANNON_GRAPH, row.ExportName, time, {}, [c, -sn, 0, sn, c, 0]),
  };
}
