import source from '../../reference/air-sweeper/combat.json' with { type: 'json' };
import {
  nativeScenePoses,
  nativeVertices,
  type NativeMeshGraph,
  type NativeMatrix,
} from './native-mesh';
import { SWEEPER_ART } from './air-control-art';
import { SWEEPER, sweeperStats } from './air-control-stats';
import type { Battle, Building } from './model';
import { LazyGraph, artBoxBounds } from './lazy-graph';

type SweeperSource = NativeMeshGraph & {
  clips: Record<string, { fps: number; labels: [number | string, string][] }>;
};
/** The Air Sweeper graph loads with its art family, not at startup. */
const SWEEPER_SOURCE = new LazyGraph<SweeperSource>(
  'Air Sweeper',
  () => import('../../reference/air-sweeper/runtime.json'),
);
export const loadSweeperArt = () => SWEEPER_SOURCE.load();
export const sweeperArtLoaded = () => SWEEPER_SOURCE.loaded;
export const sweeperGraph = (): NativeMeshGraph => SWEEPER_SOURCE.get();
export type SweeperVisualState = 'setup' | 'constructing' | 'upgrading' | 'ruin';
export interface SweeperPose {
  state: SweeperVisualState;
  turret: number;
  sector: number;
  loading: number;
  action: 'idle' | 'load' | 'attack';
}
let animation:
  | Record<
      'fps' | 'idleStart' | 'idleEnd' | 'loadStart' | 'loadEnd' | 'attackStart' | 'attackEnd',
      number
    >
  | undefined;
/** The loading clip's labelled frame ranges, read once the graph has arrived. */
export function sweeperAnimation() {
  if (animation) return animation;
  const loading = SWEEPER_SOURCE.get().clips['981'];
  const label = (name: string) => Number(loading.labels.find((v) => v[1] === name)![0]);
  return (animation = {
    fps: loading.fps,
    idleStart: label('idle_start'),
    idleEnd: label('idle_end'),
    loadStart: label('load_start'),
    loadEnd: label('load_end'),
    attackStart: label('attack_start'),
    attackEnd: label('attack_end'),
  });
}
/** Original frame zero faces along local +x; round to one of all 360 source frames. */
export const sweeperFacing = (dx: number, dy: number) =>
  (Math.round((Math.atan2(dy, dx) * 180) / Math.PI) + 360) % 360;

/** Source labels fitted to the existing simulation preparation and actual launch.
 * Native time scaling is unverified; no scene-local tweens or combat changes. */
export function sweeperPose(
  tower: Building,
  battle: Battle | null,
  elapsed: number,
  reduced: boolean,
): SweeperPose {
  const state: SweeperVisualState =
    tower.hp <= 0
      ? 'ruin'
      : tower.constructing
        ? 'constructing'
        : tower.upgradeEnd
          ? 'upgrading'
          : 'setup';
  const sector = (tower.direction ?? 0) * 45;
  const pose: SweeperPose = { state, turret: sector, sector, loading: 0, action: 'idle' };
  if (state !== 'setup') return pose;
  const a = sweeperAnimation();
  const active = battle && !battle.finished && (battle.defenseStuns[tower.id] ?? 0) <= elapsed;
  const target = active ? battle.sweepers?.[tower.id] : undefined;
  if (target) pose.turret = sweeperFacing(target.directionX, target.directionY);
  if (reduced) return pose;
  pose.loading =
    (Math.floor(Math.max(0, elapsed) * a.fps) % (a.idleEnd - a.idleStart + 1)) + a.idleStart;
  if (!active) return pose;
  const shot = battle.airSweepers?.[tower.id]?.shots.at(-1);
  const age = shot ? elapsed - shot.at : Infinity;
  if (shot && age >= 0 && age < (a.attackEnd - a.attackStart + 1) / a.fps)
    return {
      ...pose,
      turret: sweeperFacing(shot.directionX, shot.directionY),
      action: 'attack',
      loading: Math.min(a.attackEnd, a.attackStart + Math.floor(age * a.fps + 1e-9)),
    };
  if (target && tower.cooldown <= 0 && target.prepare > 0) {
    const phase = Math.max(0, Math.min(1, 1 - target.prepare / SWEEPER.prepare));
    return {
      ...pose,
      action: 'load',
      loading: Math.min(a.loadEnd, a.loadStart + Math.floor(phase * (a.loadEnd - a.loadStart + 1))),
    };
  }
  return pose;
}

export function sweeperPoses(level: number, pose: SweeperPose) {
  const row = sweeperStats(level),
    { scale, anchorX, anchorY } = SWEEPER_ART;
  const root: NativeMatrix = [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale];
  const controls = { turret: pose.turret, turret_sector: pose.sector, turret_load: pose.loading };
  const sample = (name: string) => nativeScenePoses(sweeperGraph(), name, 0, controls, root);
  if (pose.state === 'ruin') return sample(row.ruin);
  if (pose.state === 'constructing')
    return [
      ...sample(source.building.ExportNameBase),
      ...sample(source.building.ExportNameConstruction),
    ];
  return [
    ...sample(source.building.ExportNameBase),
    ...sample(pose.state === 'upgrading' ? row.upgrade : row.export),
    ...(pose.state === 'upgrading' ? sample(source.building.ExportNameBuildAnim) : []),
  ];
}
const bounds = new Map<string, [number, number, number, number]>();
/** Enclose all directions and loading phases, independent of the current aiming pose. */
export function sweeperBounds(level: number, state: SweeperVisualState = 'setup') {
  if (!SWEEPER_SOURCE.loaded) return artBoxBounds(SWEEPER_ART);
  const key = `${level}:${state}`;
  if (bounds.has(key)) return bounds.get(key)!;
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (let frame = 0; frame < (state === 'setup' || state === 'upgrading' ? 360 : 1); frame++)
    for (const pose of sweeperPoses(level, {
      state,
      turret: frame,
      sector: frame,
      loading: frame % 325,
      action: 'idle',
    })) {
      if ('group' in pose) throw Error('Unexpected Air Sweeper blend group');
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
