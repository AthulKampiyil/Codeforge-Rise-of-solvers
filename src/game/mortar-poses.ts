import {
  nativeScenePoses,
  nativeVertices,
  type NativeMeshGraph,
  type NativeMatrix,
} from './native-mesh';
import { MORTAR_ART } from './mortar-art';
import { MORTAR, MORTAR_BUILDING, mortarStats, mortarProjectileRow } from './mortar-stats';
import type { Battle, Building, MortarShell } from './model';
import { TROOPS } from './data';
import { battleDefenseTarget } from './battle-index';
import { LazyGraph, artBoxBounds } from './lazy-graph';

/** The Mortar graph loads with the Mortar art family, not at startup. */
const MORTAR_SOURCE = new LazyGraph<NativeMeshGraph>(
  'Mortar',
  () => import('../../reference/mortar/runtime.json'),
);
export const loadMortarArt = () => MORTAR_SOURCE.load();
export const mortarArtLoaded = () => MORTAR_SOURCE.loaded;
export const mortarGraph = () => MORTAR_SOURCE.get();
export type MortarVisualState = 'setup' | 'constructing' | 'upgrading' | 'ruin';
export interface MortarPose {
  state: MortarVisualState;
  turret: number;
}
/** Center each of the source's eight 45-frame bands on the matching local map direction. */
export const mortarFacing = (dx: number, dy: number) =>
  ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8) * 45;

export function mortarPose(tower: Building, battle: Battle | null): MortarPose {
  const state: MortarVisualState =
    tower.hp <= 0
      ? 'ruin'
      : tower.constructing
        ? 'constructing'
        : tower.upgradeEnd
          ? 'upgrading'
          : 'setup';
  const shot = battle?.mortars?.[tower.id]?.shots.at(-1);
  const current =
    state === 'setup' &&
    battle &&
    !battle.finished &&
    (battle.defenseStuns[tower.id] ?? 0) <= battle.elapsed
      ? [battleDefenseTarget(battle, tower.id)].find(
          (unit) =>
            !!unit &&
            unit.hp > 0 &&
            !TROOPS[unit.kind].flying &&
            Math.hypot(unit.x - tower.x - 1.5, unit.y - tower.y - 1.5) >= MORTAR.minRange &&
            Math.hypot(unit.x - tower.x - 1.5, unit.y - tower.y - 1.5) <= MORTAR.range,
        )
      : undefined;
  const facing = current ?? shot;
  return {
    state,
    turret: facing ? mortarFacing(facing.x - tower.x - 1.5, facing.y - tower.y - 1.5) : 0,
  };
}
export function mortarPoses(level: number, pose: MortarPose) {
  const row = mortarStats(level);
  if (!row) throw Error(`Unsupported native Mortar level: ${level}`);
  const { scale: s, anchorX: x, anchorY: y } = MORTAR_ART;
  const root: NativeMatrix = [s, 0, -x * s, 0, s, -y * s];
  const sample = (name: string) =>
    nativeScenePoses(mortarGraph(), name, 0, { turret: pose.turret, gearup: false }, root);
  if (pose.state === 'ruin') return sample(MORTAR_BUILDING.ExportNameDamaged);
  if (pose.state === 'constructing')
    return [
      ...sample(MORTAR_BUILDING.ExportNameBase),
      ...sample(MORTAR_BUILDING.ExportNameConstruction),
    ];
  return [
    ...sample(MORTAR_BUILDING.ExportNameBase),
    ...sample(row.body),
    ...(pose.state === 'upgrading' ? sample(MORTAR_BUILDING.ExportNameBuildAnim) : []),
  ];
}
const bounds = new Map<string, [number, number, number, number]>();
export function mortarBounds(level: number, state: MortarVisualState = 'setup') {
  if (!MORTAR_SOURCE.loaded) return artBoxBounds(MORTAR_ART);
  const key = `${level}:${state}`;
  if (bounds.has(key)) return bounds.get(key)!;
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (
    let direction = 0;
    direction < (state === 'setup' || state === 'upgrading' ? 8 : 1);
    direction++
  )
    for (const pose of mortarPoses(level, { state, turret: direction * 45 })) {
      if ('group' in pose) throw Error('Unexpected Mortar body blend group');
      const v = nativeVertices(pose);
      for (let i = 0; i < v.length; i += 4) {
        left = Math.min(left, v[i]);
        right = Math.max(right, v[i]);
        top = Math.min(top, v[i + 1]);
        bottom = Math.max(bottom, v[i + 1]);
      }
    }
  const result: [number, number, number, number] = [left, top, right, bottom];
  bounds.set(key, result);
  return result;
}

/** Original projectile origin/height and artwork. The 115-pixel arc remains a local
 * projection until the native ballistic equation is corroborated; impact time is simulation-owned. */
/** The shell's screen point alone (trail births need no projectile art). */
export function mortarFlightPoint(
  level: number,
  shot: MortarShell,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
) {
  const row = mortarProjectileRow(level),
    age = Math.max(0, elapsed - shot.launched);
  const t = Math.max(0, Math.min(1, age / Math.max(0.01, shot.impact - shot.launched)));
  const dx = shot.x - shot.fromX,
    dy = shot.y - shot.fromY,
    length = Math.hypot(dx, dy) || 1;
  const offset = Number(row.StartOffset) / 100;
  const origin = iso(shot.fromX + (dx / length) * offset, shot.fromY + (dy / length) * offset);
  const from = { x: origin.x, y: origin.y - Number(row.StartHeight) * MORTAR_ART.altitudeScale };
  const to = iso(shot.x, shot.y);
  return {
    t,
    from,
    to,
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 115,
  };
}
export function mortarProjectilePose(
  level: number,
  shot: MortarShell,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
) {
  const row = mortarProjectileRow(level),
    age = Math.max(0, elapsed - shot.launched);
  const { t, from, to, x, y } = mortarFlightPoint(level, shot, elapsed, iso);
  const ground = iso(
    shot.fromX + (shot.x - shot.fromX) * t,
    shot.fromY + (shot.y - shot.fromY) * t,
  );
  const s = (MORTAR_ART.scale * Number(row.Scale)) / 100;
  const clip = mortarGraph().clips[mortarGraph().exports[row.ExportName]];
  const time = row.ScaleTimeline === 'TRUE' ? (t * clip.timeline.length) / clip.fps : age;
  const root: NativeMatrix = [s, 0, 0, 0, s, 0];
  return {
    t,
    age,
    from,
    to,
    ground,
    x,
    y,
    export: row.ExportName,
    time,
    poses: nativeScenePoses(mortarGraph(), row.ExportName, time, {}, root),
    shadow: nativeScenePoses(mortarGraph(), row.ShadowExportName, age, {}, root),
  };
}
