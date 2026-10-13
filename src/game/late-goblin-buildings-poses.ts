import runtime from '../../reference/late-goblin-buildings/runtime.json' with { type: 'json' };
import characters from '../../reference/late-goblin-buildings/characters-runtime.json' with { type: 'json' };
import {
  nativeScenePoses,
  nativeVertices,
  type NativeMatrix,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';
import type { Battle, Building } from './model';
import type { LateProjectile } from './late-goblin-weapon';
import {
  GOBLIN_CAVE_TIMELINE,
  GOBLIN_TIMELINE,
  GOBLIN_WEAPONS,
  LATE_GOBLIN_SOURCE,
  goblinBuildingArt,
  goblinWeaponFor,
  type LateGoblinIdentity,
} from './late-goblin-buildings-stats';

/** Phaser-free bounds of displayed poses, including isolated blend groups. */
export function lateSceneBounds(
  poses: readonly NativeScenePose[],
): [number, number, number, number] | undefined {
  const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (list: readonly NativeScenePose[]) => {
    for (const pose of list) {
      if ('group' in pose) {
        visit(pose.group);
        continue;
      }
      const v = nativeVertices(pose);
      for (let i = 0; i < v.length; i += 4) {
        bounds[0] = Math.min(bounds[0], v[i]);
        bounds[1] = Math.min(bounds[1], v[i + 1]);
        bounds[2] = Math.max(bounds[2], v[i]);
        bounds[3] = Math.max(bounds[3], v[i + 1]);
      }
    }
  };
  visit(poses);
  return bounds.every(Number.isFinite) ? bounds : undefined;
}

export const LATE_GOBLIN_GRAPH = runtime as unknown as NativeMeshGraph;
export const LATE_GOBLIN_ARROW_GRAPH = characters as unknown as NativeMeshGraph;
const SCALE = LATE_GOBLIN_SOURCE.worldScale;
/** Village altitude projection shared with the Archer Tower projectile presentation. */
export const LATE_GOBLIN_ALTITUDE = 0.6;
type Point = { x: number; y: number };

export type LateGoblinVisualState = 'intact' | 'ruin';
export interface LateGoblinPose {
  npc: LateGoblinIdentity;
  level: number;
  state: LateGoblinVisualState;
  /** Root timeline frame of the displayed body, or ruin collapse frame. */
  frame: number;
  /** Absolute nested flag frame for Goblin Halls; zero elsewhere. */
  flag: number;
}

const bodyRoot = (anchor: readonly number[]): NativeMatrix => [
  SCALE,
  0,
  -anchor[0] * SCALE,
  0,
  SCALE,
  -anchor[1] * SCALE,
];
/** goblin_townhall_base keeps the Goblin Town Hall's local four-tile diamond registration. */
function hallBaseRoot(size: number): NativeMatrix {
  const [left, top, right, bottom] = LATE_GOBLIN_SOURCE.goblinHallBaseBounds;
  const sx = (size * 64) / (right - left),
    sy = (size * 32) / (bottom - top);
  return [sx, 0, (-sx * (left + right)) / 2, 0, sy, (-sy * (top + bottom)) / 2];
}

/** Label-driven goblin_th02 frame: deactive idle, then active start and looping active idle. */
export function goblinHallFrame(
  activatedAt: number | undefined,
  elapsed: number,
  reduced: boolean,
) {
  const { labels, frames, fps } = GOBLIN_TIMELINE;
  if (activatedAt === undefined || elapsed < activatedAt) return labels.deactive_idle;
  if (reduced) return labels.active_idle;
  const frame = labels.active_start + Math.floor((elapsed - activatedAt) * fps + 1e-9);
  return frame < labels.active_idle
    ? frame
    : labels.active_idle + ((frame - labels.active_idle) % (frames - labels.active_idle));
}

const ruinClip = (name: string) => LATE_GOBLIN_GRAPH.clips[LATE_GOBLIN_GRAPH.exports[name]];
/** Ruins play their short collapse once from the recorded destruction, then hold. */
function ruinFrame(
  name: string,
  destroyedAt: number | undefined,
  elapsed: number,
  reduced: boolean,
) {
  const clip = ruinClip(name),
    last = clip.timeline.length - 1;
  if (reduced || destroyedAt === undefined) return last;
  return Math.max(0, Math.min(last, Math.floor((elapsed - destroyedAt) * clip.fps + 1e-9)));
}

export function lateGoblinPose(
  b: Building,
  battle: Battle | null,
  elapsed: number,
  reduced: boolean,
): LateGoblinPose {
  const npc = b.npc as LateGoblinIdentity;
  const art = goblinBuildingArt(npc, b.level);
  if (b.hp <= 0)
    return {
      npc,
      level: b.level,
      state: 'ruin',
      frame: ruinFrame(art.ruin, battle?.late?.goblinBuildings?.destroyed[b.id], elapsed, reduced),
      flag: 0,
    };
  const time = reduced ? 0 : Math.max(0, elapsed);
  if (art.body === GOBLIN_TIMELINE.export) {
    const weapon = battle?.late?.goblinBuildings?.weapons[b.id];
    return {
      npc,
      level: b.level,
      state: 'intact',
      frame: goblinHallFrame(weapon?.activatedAt, elapsed, reduced),
      flag: Math.floor(time * GOBLIN_TIMELINE.fps + 1e-9) % GOBLIN_TIMELINE.flagFrames,
    };
  }
  // Absolute frames keep continuously placed nested clips (flag, cave glow) on the battle clock.
  const fps = LATE_GOBLIN_GRAPH.clips[LATE_GOBLIN_GRAPH.exports[art.body]].fps;
  const animated = art.body === GOBLIN_CAVE_TIMELINE.export || npc === 'goblin-hall';
  return {
    npc,
    level: b.level,
    state: 'intact',
    frame: animated ? Math.floor(time * fps + 1e-9) : 0,
    flag: 0,
  };
}

/** Ground foundation/shadow layer, drawn beneath every world object. */
export function lateGoblinBasePoses(pose: LateGoblinPose): NativeScenePose[] {
  if (pose.state === 'ruin') return [];
  const art = goblinBuildingArt(pose.npc, pose.level);
  const root = art.base === 'goblin_townhall_base' ? hallBaseRoot(art.size) : bodyRoot(art.anchor);
  // Castle-family bases hide the edit-mode shadow exactly like the Clan Castle presentation.
  return nativeScenePoses(LATE_GOBLIN_GRAPH, art.base, 0, { shadow_edit: false }, root);
}

export function lateGoblinBodyPoses(pose: LateGoblinPose): NativeScenePose[] {
  const art = goblinBuildingArt(pose.npc, pose.level);
  const root = bodyRoot(art.anchor);
  if (pose.state === 'ruin') {
    const clip = ruinClip(art.ruin);
    return nativeScenePoses(LATE_GOBLIN_GRAPH, art.ruin, pose.frame / clip.fps, {}, root);
  }
  const fps = LATE_GOBLIN_GRAPH.clips[LATE_GOBLIN_GRAPH.exports[art.body]].fps;
  // goblin_th02's only unnamed nested clip is its 24-frame flag. Holding a label frame on the
  // root would otherwise also hold the flag, so its absolute phase is supplied separately.
  const controls: Record<string, number> =
    art.body === GOBLIN_TIMELINE.export ? { '': pose.flag } : {};
  return nativeScenePoses(LATE_GOBLIN_GRAPH, art.body, pose.frame / fps, controls, root);
}

const boundsCache = new Map<string, [number, number, number, number]>();
/** Exact displayed source bounds relative to the ground center (intact frame zero or held ruin). */
export function lateGoblinBounds(b: Pick<Building, 'npc' | 'level' | 'hp'>) {
  const npc = b.npc as LateGoblinIdentity;
  const key = `${npc}:${b.level}:${b.hp <= 0}`;
  const cached = boundsCache.get(key);
  if (cached) return cached;
  const pose: LateGoblinPose =
    b.hp <= 0
      ? {
          npc,
          level: b.level,
          state: 'ruin',
          frame: ruinClip(goblinBuildingArt(npc, b.level).ruin).timeline.length - 1,
          flag: 0,
        }
      : { npc, level: b.level, state: 'intact', frame: 0, flag: 0 };
  const bounds = lateSceneBounds(lateGoblinBodyPoses(pose));
  if (!bounds) throw Error(`Empty late Goblin building pose: ${npc}`);
  boundsCache.set(key, bounds);
  return bounds;
}

/** Height of the launch point above the ground center; StartHeight uses the village altitude scale. */
export function lateGoblinMuzzle(b: Building) {
  const weapon = goblinWeaponFor(b);
  return weapon ? weapon.source.startHeight * LATE_GOBLIN_ALTITUDE : 0;
}

/** Original arrow mesh on its tracked flight, rotated toward the projected destination. */
export function goblinArrowPose(
  p: LateProjectile,
  elapsed: number,
  iso: (x: number, y: number) => Point,
  targetHeight: number,
) {
  const row = GOBLIN_WEAPONS['goblin-hall'].source;
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
    ground.y - row.startHeight * LATE_GOBLIN_ALTITUDE * (1 - progress) - targetHeight * progress;
  // The original arrow tip points along +Y.
  const rotation = Math.atan2(target.y - targetHeight - y, target.x - x) - Math.PI / 2;
  const scale = (row.scale / 100) * SCALE;
  const c = Math.cos(rotation) * scale,
    s = Math.sin(rotation) * scale;
  return {
    x,
    y,
    progress,
    poses:
      elapsed < p.launched
        ? []
        : nativeScenePoses(
            LATE_GOBLIN_ARROW_GRAPH,
            row.projectileExport,
            Math.max(0, elapsed - p.launched),
            {},
            [c, -s, 0, s, c, 0],
          ),
  };
}

/**
 * A tracking projectile as presented after the battle finished: the simulation no longer
 * advances it, so its flight point keeps moving toward the destination at its source speed
 * (like `late-goblin-weapon` advance). Undefined once it would have landed.
 */
export function presentedLateFlight(
  p: LateProjectile,
  elapsed: number,
): LateProjectile | undefined {
  if (elapsed >= p.impact) return undefined;
  const distance = Math.hypot(p.x - p.flightX, p.y - p.flightY);
  const fraction = distance
    ? Math.min(1, (Math.max(0, elapsed - p.flightAt) * p.speed) / distance)
    : 1;
  return {
    ...p,
    flightX: p.flightX + (p.x - p.flightX) * fraction,
    flightY: p.flightY + (p.y - p.flightY) * fraction,
    flightAt: Math.max(p.flightAt, elapsed),
  };
}
type BombFlight = Pick<LateProjectile, 'fromX' | 'fromY' | 'x' | 'y' | 'launched' | 'impact'>;
/** The bomb's fixed-point flight; arc height is local presentation. */
export function goblinBombFlightPoint(
  p: BombFlight,
  elapsed: number,
  iso: (x: number, y: number) => Point,
) {
  const row = GOBLIN_WEAPONS['goblin-boss-th'].source;
  const age = Math.max(0, elapsed - p.launched);
  const t = Math.max(0, Math.min(1, age / Math.max(0.01, p.impact - p.launched)));
  const length = Math.hypot(p.x - p.fromX, p.y - p.fromY) || 1;
  const startX = p.fromX + ((p.x - p.fromX) / length) * (row.startOffset / 100),
    startY = p.fromY + ((p.y - p.fromY) / length) * (row.startOffset / 100);
  const ground = iso(startX + (p.x - startX) * t, startY + (p.y - startY) * t);
  const lift = row.startHeight * LATE_GOBLIN_ALTITUDE * (1 - t);
  return { t, age, ground, x: ground.x, y: ground.y - lift - Math.sin(t * Math.PI) * 42 };
}
/** Original bomb art with its shadow at the `goblinBombFlightPoint`; the spin is local. */
export function goblinBombPose(
  p: BombFlight,
  elapsed: number,
  iso: (x: number, y: number) => Point,
) {
  const row = GOBLIN_WEAPONS['goblin-boss-th'].source;
  const { t, age, ground, x, y } = goblinBombFlightPoint(p, elapsed, iso);
  const angle = t * Math.PI * 2;
  return {
    t,
    ground,
    x,
    y,
    poses: nativeScenePoses(LATE_GOBLIN_GRAPH, row.projectileExport, age, {}, [
      Math.cos(angle) * SCALE,
      -Math.sin(angle) * SCALE,
      0,
      Math.sin(angle) * SCALE,
      Math.cos(angle) * SCALE,
      0,
    ]),
    shadow: nativeScenePoses(LATE_GOBLIN_GRAPH, row.shadow!, age, {}, [SCALE, 0, 0, 0, SCALE, 0]),
  };
}
