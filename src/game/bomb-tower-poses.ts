import combat from '../../reference/bombtower/combat.json' with { type: 'json' };
import {
  nativeScenePoses,
  nativeVertices,
  type NativeMeshGraph,
  type NativeMatrix,
} from './native-mesh';
import { BOMB_TOWER_ART } from './bomb-tower-art';
import type { Battle, Building } from './model';
import type { CombatProjectile } from './projectiles';
import { TROOPS } from './data';
import { battleDefenseTarget } from './battle-index';
import { LazyGraph, artBoxBounds } from './lazy-graph';

type BodySource = typeof import('../../reference/bombtower/body.json');
type DefenderSource = typeof import('../../reference/bombtower/defender.json');
/** The tower body and the roof Bomber load with the Bomb Tower art family, not at startup. */
const BODY = new LazyGraph<BodySource>(
  'Bomb Tower',
  () => import('../../reference/bombtower/body.json'),
);
const DEFENDER = new LazyGraph<DefenderSource>(
  'Bomber',
  () => import('../../reference/bombtower/defender.json'),
);
export const loadBombTowerArt = () => Promise.all([BODY.load(), DEFENDER.load()]);
export const bombTowerArtLoaded = () => BODY.loaded && DEFENDER.loaded;
export const bombTowerGraph = () => BODY.get() as unknown as NativeMeshGraph;
export const bomberGraph = () => DEFENDER.get() as unknown as NativeMeshGraph;
export type BombTowerVisualState = 'setup' | 'constructing' | 'upgrading' | 'ruin';
export type BomberPose = {
  action: 'idle' | 'attack';
  direction: number;
  flip: boolean;
  time: number;
};
const levelRow = (level: number) => {
  const row = combat.levels[level - 1];
  if (!row) throw Error(`Unsupported native Bomb Tower level: ${level}`);
  return row;
};
const animation = (level: number) =>
  DEFENDER.get().animations[levelRow(level).defender as keyof DefenderSource['animations']];

export function bombTowerPoses(level: number, state: BombTowerVisualState) {
  levelRow(level);
  const row = BODY.get().levels[level - 1];
  const { scale, anchorX, anchorY } = BOMB_TOWER_ART;
  const root: NativeMatrix = [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale];
  const sample = (name: string) => nativeScenePoses(bombTowerGraph(), name, 0, {}, root);
  if (state === 'ruin') return sample(row.ExportNameDamaged);
  if (state === 'constructing')
    return [...sample(row.ExportNameBase), ...sample(row.ExportNameConstruction)];
  return [
    ...sample(row.ExportNameBase),
    ...sample(row.ExportName),
    ...(state === 'upgrading' ? sample(row.ExportNameBuildAnim) : []),
  ];
}

/** Original Bomber views face right; mirror them for targets to the left. */
export function bomberFacing(dx: number, dy: number) {
  const x = dx - dy,
    y = (dx + dy) / 2;
  return { direction: y < -Math.abs(x) / 2 ? 1 : y > Math.abs(x) / 2 ? 3 : 2, flip: x < 0 };
}

/** Align the source action frame to the existing shot timestamp, without changing combat. */
export function bomberPose(
  tower: Building,
  battle: Battle | null,
  elapsed: number,
  reduced: boolean,
): BomberPose {
  const rows = animation(tower.level);
  const actionFrame = Number(rows[1].ActionFrame);
  const clip = bomberGraph().clips[bomberGraph().exports[rows[1].ExportName + '_3']];
  const shot = battle?.bombTowers?.[tower.id]?.shots.at(-1);
  const current = [battle ? battleDefenseTarget(battle, tower.id) : undefined].find(
    (u) =>
      !!u &&
      u.hp > 0 &&
      !TROOPS[u.kind].flying &&
      Math.hypot(u.x - tower.x - 1.5, u.y - tower.y - 1.5) <= 6,
  );
  const facing = current ?? shot;
  const pose: BomberPose = {
    action: 'idle',
    direction: 3,
    flip: false,
    time: reduced ? 0 : elapsed,
  };
  if (facing) Object.assign(pose, bomberFacing(facing.x - tower.x - 1.5, facing.y - tower.y - 1.5));
  if (
    !battle ||
    battle.finished ||
    reduced ||
    tower.constructing ||
    tower.upgradeEnd ||
    (battle.defenseStuns[tower.id] ?? 0) > elapsed
  )
    return pose;
  const age = shot ? elapsed - shot.at : Infinity;
  if (shot && age >= 0 && age < (clip.timeline.length - actionFrame) / clip.fps) {
    return {
      ...pose,
      ...bomberFacing(shot.x - tower.x - 1.5, shot.y - tower.y - 1.5),
      action: 'attack',
      time: Math.min(clip.timeline.length - 1, actionFrame + age * clip.fps) / clip.fps,
    };
  }
  if (current && tower.cooldown > 0 && tower.cooldown < actionFrame / clip.fps)
    return { ...pose, action: 'attack', time: actionFrame / clip.fps - tower.cooldown };
  return pose;
}

export function bomberPoses(level: number, pose: BomberPose, reduced = false) {
  const rows = animation(level),
    row = rows[pose.action === 'idle' ? 0 : 1];
  const s = (BOMB_TOWER_ART.scale * Number(rows[0].Scale)) / 100;
  const root: NativeMatrix = [
    pose.flip ? -s : s,
    0,
    BOMB_TOWER_ART.roofX,
    0,
    s,
    (BOMB_TOWER_ART.roofY - BOMB_TOWER_ART.anchorY) * BOMB_TOWER_ART.scale,
  ];
  const poses = nativeScenePoses(
    bomberGraph(),
    row.ExportName + '_' + pose.direction,
    pose.time,
    { ability_on: false },
    root,
  );
  return reduced ? poses.filter((p) => p.blend !== 8) : poses;
}

const bounds = new Map<string, [number, number, number, number]>();
export function bombTowerBounds(level: number, state: BombTowerVisualState = 'setup') {
  if (!bombTowerArtLoaded()) return artBoxBounds(BOMB_TOWER_ART);
  const key = `${level}:${state}`;
  if (bounds.has(key)) return bounds.get(key)!;
  const poses = [
    ...bombTowerPoses(level, state),
    ...(state === 'setup' || state === 'upgrading'
      ? bomberPoses(level, { action: 'idle', direction: 3, flip: false, time: 0 }, true)
      : []),
  ];
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const pose of poses) {
    if ('group' in pose) continue;
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

/** Stable launch registration survives source destruction and target movement. */
export function bombTowerMuzzle(from: { x: number; y: number }, to: { x: number; y: number }) {
  return {
    x: from.x + (Math.sign(to.x - from.x) || -1) * 8,
    y: from.y + (BOMB_TOWER_ART.roofY - BOMB_TOWER_ART.anchorY) * BOMB_TOWER_ART.scale - 20,
  };
}

/** The bomb's screen point alone (trail births need no projectile art). */
export function bombFlightPoint(
  shot: Pick<CombatProjectile, 'fromX' | 'fromY' | 'x' | 'y' | 'launched' | 'impact'>,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
) {
  const age = Math.max(0, elapsed - shot.launched);
  const t = Math.max(0, Math.min(1, age / Math.max(0.01, shot.impact - shot.launched)));
  const target = iso(shot.x, shot.y),
    from = bombTowerMuzzle(iso(shot.fromX, shot.fromY), target);
  return {
    t,
    x: from.x + (target.x - from.x) * t,
    y: from.y + (target.y - from.y) * t - Math.sin(t * Math.PI) * 42,
  };
}
export function bombProjectilePose(
  level: number,
  shot: Pick<CombatProjectile, 'fromX' | 'fromY' | 'x' | 'y' | 'launched' | 'impact'>,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
) {
  const row =
    BODY.get().projectiles[levelRow(level).projectile as keyof BodySource['projectiles']][0];
  const age = Math.max(0, elapsed - shot.launched);
  const { t, x, y } = bombFlightPoint(shot, elapsed, iso);
  const ground = iso(
    shot.fromX + (shot.x - shot.fromX) * t,
    shot.fromY + (shot.y - shot.fromY) * t,
  );
  const angle = t * Math.PI * 2,
    s = BOMB_TOWER_ART.scale;
  const root: NativeMatrix = [
    Math.cos(angle) * s,
    -Math.sin(angle) * s,
    0,
    Math.sin(angle) * s,
    Math.cos(angle) * s,
    0,
  ];
  return {
    t,
    ground,
    x,
    y,
    poses: nativeScenePoses(bombTowerGraph(), row.ExportName, age, {}, root),
    shadow: nativeScenePoses(bombTowerGraph(), row.ShadowExportName, age, {}, [s, 0, 0, 0, s, 0]),
  };
}

export function bombTowerDeathPoses(level: number, age: number, reduced: boolean) {
  const tier = Number(levelRow(level).destroyedEffect.replace('Bomb Tower Destroyed', ''));
  const row =
    BODY.get().deathBombs[`Bomb Tower Bomb Appear${tier}` as keyof BodySource['deathBombs']];
  const s = (BOMB_TOWER_ART.scale * Number(row.StartScale)) / 100;
  return nativeScenePoses(bombTowerGraph(), row.ParticleExportName, reduced ? 0 : age, {}, [
    s,
    0,
    0,
    0,
    s,
    -40 * s,
  ]);
}
