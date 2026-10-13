import effects from '../../reference/wizard-tower/effects.json' with { type: 'json' };
import {
  nativeScenePoses,
  nativeVertices,
  type NativeMeshGraph,
  type NativeMatrix,
  type NativeScenePose,
} from './native-mesh';
import { WIZARD_TOWER_ART } from './wizard-tower-art';
import { WIZARD_TOWER, wizardTowerStats } from './wizard-tower-stats';
import type { Battle, Building } from './model';
import type { CombatProjectile } from './projectiles';
import { battleDefenseTarget } from './battle-index';
import { LazyGraph, artBoxBounds } from './lazy-graph';

type BodySource = typeof import('../../reference/wizard-tower/body.json');
type DefenderSource = typeof import('../../reference/wizard-tower/defender.json');
/** The tower body, its Wizard and the Wizard's effects load with the Wizard Tower art family. */
const BODY = new LazyGraph<BodySource>(
  'Wizard Tower',
  () => import('../../reference/wizard-tower/body.json'),
);
const DEFENDER = new LazyGraph<DefenderSource>(
  'Tower Wizard',
  () => import('../../reference/wizard-tower/defender.json'),
);
const EFFECT_ART = new LazyGraph<NativeMeshGraph>(
  'Wizard Tower effects',
  () => import('../../reference/wizard-tower/effect_art.json'),
);
export const loadWizardTowerArt = () =>
  Promise.all([BODY.load(), DEFENDER.load(), EFFECT_ART.load()]);
export const wizardTowerArtLoaded = () => BODY.loaded && DEFENDER.loaded && EFFECT_ART.loaded;
export const wizardTowerGraph = () => BODY.get() as unknown as NativeMeshGraph;
export const towerWizardGraph = () => DEFENDER.get() as unknown as NativeMeshGraph;
export const wizardEffectGraph = () => EFFECT_ART.get();
export type WizardTowerVisualState = 'setup' | 'constructing' | 'upgrading' | 'ruin';
export type TowerWizardPose = {
  action: 'idle' | 'attack';
  direction: number;
  flip: boolean;
  time: number;
};
const levelRow = (level: number) => {
  const row = wizardTowerStats(level);
  if (!row) throw Error(`Unsupported native Wizard Tower level: ${level}`);
  return row;
};
const animation = (level: number) =>
  DEFENDER.get().animations[levelRow(level).defender as keyof DefenderSource['animations']];
export const wizardProjectileRow = (level: number) =>
  effects.projectiles[levelRow(level).projectile as keyof typeof effects.projectiles][0];

export function wizardTowerPoses(level: number, state: WizardTowerVisualState) {
  levelRow(level);
  const row = BODY.get().levels[level - 1];
  const { scale, anchorX, anchorY } = WIZARD_TOWER_ART;
  const root: NativeMatrix = [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale];
  const sample = (name: string) => nativeScenePoses(wizardTowerGraph(), name, 0, {}, root);
  if (state === 'ruin') return sample(row.ExportNameDamaged);
  if (state === 'constructing')
    return [...sample(row.ExportNameBase), ...sample(row.ExportNameConstruction)];
  return [
    ...sample(row.ExportNameBase),
    ...sample(row.ExportName),
    ...(state === 'upgrading' ? sample(row.ExportNameBuildAnim) : []),
  ];
}
/** Original views face right; mirror them for targets to the left of the tower. */
export function towerWizardFacing(dx: number, dy: number) {
  const x = dx - dy,
    y = (dx + dy) / 2;
  return { direction: y < -Math.abs(x) / 2 ? 1 : y > Math.abs(x) / 2 ? 3 : 2, flip: x < 0 };
}
/** The original action frame coincides with the recorded shot, leaving combat unchanged. */
export function towerWizardPose(
  tower: Building,
  battle: Battle | null,
  elapsed: number,
  reduced: boolean,
): TowerWizardPose {
  const rows = animation(tower.level),
    actionFrame = Number(rows[1].ActionFrame);
  const clip = towerWizardGraph().clips[towerWizardGraph().exports[rows[1].ExportName + '_3']];
  const shot = battle?.wizardTowers?.[tower.id]?.shots.at(-1);
  const current = [battle ? battleDefenseTarget(battle, tower.id) : undefined].find(
    (u) =>
      !!u && u.hp > 0 && Math.hypot(u.x - tower.x - 1.5, u.y - tower.y - 1.5) <= WIZARD_TOWER.range,
  );
  const facing = current ?? shot;
  const pose: TowerWizardPose = {
    action: 'idle',
    direction: 3,
    flip: false,
    time: reduced ? 0 : elapsed,
  };
  if (facing)
    Object.assign(pose, towerWizardFacing(facing.x - tower.x - 1.5, facing.y - tower.y - 1.5));
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
  if (shot && age >= 0 && age < (clip.timeline.length - actionFrame) / clip.fps)
    return {
      ...pose,
      ...towerWizardFacing(shot.x - tower.x - 1.5, shot.y - tower.y - 1.5),
      action: 'attack',
      time: Math.min(clip.timeline.length - 1, actionFrame + age * clip.fps) / clip.fps,
    };
  if (current && tower.cooldown > 0 && tower.cooldown < actionFrame / clip.fps)
    return { ...pose, action: 'attack', time: actionFrame / clip.fps - tower.cooldown };
  return pose;
}
export function towerWizardPoses(level: number, pose: TowerWizardPose, reduced = false) {
  const rows = animation(level),
    row = rows[pose.action === 'idle' ? 0 : 1];
  const s = WIZARD_TOWER_ART.scale; // Original Wizard animation rows have no extra scale.
  const root: NativeMatrix = [
    pose.flip ? -s : s,
    0,
    WIZARD_TOWER_ART.roofX,
    0,
    s,
    (WIZARD_TOWER_ART.roofY - WIZARD_TOWER_ART.anchorY) * s,
  ];
  const poses = nativeScenePoses(
    towerWizardGraph(),
    row.ExportName + '_' + pose.direction,
    pose.time,
    {},
    root,
  );
  return reduced ? poses.filter((p) => p.blend !== 8) : poses;
}
const bounds = new Map<string, [number, number, number, number]>();
export function wizardTowerBounds(level: number, state: WizardTowerVisualState = 'setup') {
  if (!wizardTowerArtLoaded()) return artBoxBounds(WIZARD_TOWER_ART);
  const key = `${level}:${state}`;
  if (bounds.has(key)) return bounds.get(key)!;
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  const visit = (poses: NativeScenePose[]) => {
    for (const pose of poses) {
      if ('group' in pose) {
        visit(pose.group);
        continue;
      }
      const v = nativeVertices(pose);
      for (let i = 0; i < v.length; i += 4) {
        left = Math.min(left, v[i]);
        right = Math.max(right, v[i]);
        top = Math.min(top, v[i + 1]);
        bottom = Math.max(bottom, v[i + 1]);
      }
    }
  };
  visit(wizardTowerPoses(level, state));
  if (state === 'setup' || state === 'upgrading')
    visit(towerWizardPoses(level, { action: 'idle', direction: 3, flip: false, time: 0 }));
  const result: [number, number, number, number] = [left, top, right, bottom];
  bounds.set(key, result);
  return result;
}

/** The projectile's screen point alone (trail births need no projectile art). */
export function wizardFlightPoint(
  level: number,
  shot: Pick<CombatProjectile, 'fromX' | 'fromY' | 'x' | 'y' | 'launched' | 'impact' | 'toAir'>,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
  airLift: number,
) {
  const row = wizardProjectileRow(level),
    age = Math.max(0, elapsed - shot.launched);
  const t = Math.max(0, Math.min(1, age / Math.max(0.01, shot.impact - shot.launched)));
  const dx = shot.x - shot.fromX,
    dy = shot.y - shot.fromY,
    length = Math.hypot(dx, dy) || 1;
  const offset = Number(row.StartOffset) / 100;
  const origin = iso(shot.fromX + (dx / length) * offset, shot.fromY + (dy / length) * offset);
  const from = {
    x: origin.x,
    y: origin.y - Number(row.StartHeight) * WIZARD_TOWER_ART.altitudeScale,
  };
  const ground = iso(shot.x, shot.y),
    to = { x: ground.x, y: ground.y - (shot.toAir ? airLift : 0) - 16 };
  return { t, from, to, x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
/** Fixed source/target registration survives target movement and source destruction. */
export function wizardProjectilePose(
  level: number,
  shot: Pick<CombatProjectile, 'fromX' | 'fromY' | 'x' | 'y' | 'launched' | 'impact' | 'toAir'>,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
  airLift: number,
) {
  const row = wizardProjectileRow(level),
    age = Math.max(0, elapsed - shot.launched);
  const { t, from, to, x, y } = wizardFlightPoint(level, shot, elapsed, iso, airLift);
  // Original projectile artwork points along +Y; its trailing flame extends upward.
  const angle =
    row.UseRotate === 'TRUE' ? Math.atan2(to.y - from.y, to.x - from.x) - Math.PI / 2 : 0;
  const scale = (Number(row.Scale) / 100) * WIZARD_TOWER_ART.scale;
  const c = Math.cos(angle) * scale,
    sn = Math.sin(angle) * scale;
  const clip = wizardEffectGraph().clips[wizardEffectGraph().exports[row.ExportName]];
  const time = row.ScaleTimeline === 'TRUE' ? (t * clip.timeline.length) / clip.fps : age;
  return {
    t,
    from,
    to,
    x,
    y,
    export: row.ExportName,
    rotation: angle,
    time,
    poses: nativeScenePoses(wizardEffectGraph(), row.ExportName, time, {}, [c, -sn, 0, sn, c, 0]),
  };
}
