import { BUILDINGS } from './data';
import type { Battle, Building, Unit } from './model';
import type { NativeMeshGraph } from './native-mesh';
import { unitIndex } from './battle-index';
import { destroyedBuildings, weaponFor, type NativeDefenseState } from './native-defenses';
import {
  isNativeDefenseKind,
  revengeTier,
  townHallActivation,
  type NativeDefenseKind,
} from './native-defense-stats';

type Point = { x: number; y: number };
/** Body reference inside a village pack (or one of its per-level variant packs). */
export interface NativeDefenseBody {
  /** Village pack field to draw instead of ExportName. */
  field?: string;
  /** Variant pack key holding that field, when it is not in the main pack. */
  variant?: string;
  /** Seconds the selected body clip plays at (undefined keeps the caller's clock). */
  clock?: number;
  controls: Record<string, number | false>;
  /** Map-space aim used by the body, its defenders and its effects. */
  aim?: Point;
}

export const hasNativeDefenseBody = (kind: string): kind is NativeDefenseKind =>
  isNativeDefenseKind(kind as NativeDefenseKind);

const center = (b: Building) => ({
  x: b.x + BUILDINGS[b.kind].size / 2,
  y: b.y + BUILDINGS[b.kind].size / 2,
});
const EPS = 1e-9;

const bandCache = new WeakMap<NativeMeshGraph, Map<number, number[]>>();
/** Frames where a 360-frame direction clip changes pose: each band starts at the angle it draws. */
export function nativeTurretBands(graph: NativeMeshGraph, id: number): number[] {
  let cache = bandCache.get(graph);
  if (!cache) bandCache.set(graph, (cache = new Map()));
  const known = cache.get(id);
  if (known) return known;
  const clip = graph.clips[id];
  const bands: number[] = [];
  if (clip)
    for (const [frame, pattern] of clip.timeline.entries())
      if (frame === 0 || pattern !== clip.timeline[frame - 1]) bands.push(frame);
  cache.set(id, bands);
  return bands;
}

/** Map angle in degrees, matching the local Cannon registration (0 = +x, 90 = +y). */
export const nativeMapAngle = (dx: number, dy: number) =>
  ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

/** Source frame of the direction band nearest the requested map angle. */
export function nativeTurretFrame(bands: readonly number[], angle: number, frames = 360) {
  if (!bands.length) return 0;
  let best = bands[0],
    distance = Infinity;
  for (const band of bands) {
    // Shortest turn between the requested angle and the angle this band draws.
    const gap = Math.abs(((((angle - band) % frames) + frames * 1.5) % frames) - frames / 2);
    if (gap < distance - 1e-9) {
      distance = gap;
      best = band;
    }
  }
  return best;
}

const namedCache = new WeakMap<NativeMeshGraph, Map<string, number>>();
/** Named child clip of an export, e.g. the turret or the activation timeline (cached per graph). */
export function nativeNamedChild(graph: NativeMeshGraph, exportName: string, name: string) {
  let cache = namedCache.get(graph);
  if (!cache) namedCache.set(graph, (cache = new Map()));
  const key = `${exportName}\n${name}`;
  let found = cache.get(key);
  if (found === undefined) {
    found = findNamedChild(graph, exportName, name) ?? -1;
    cache.set(key, found);
  }
  return found < 0 ? undefined : found;
}
function findNamedChild(graph: NativeMeshGraph, exportName: string, name: string) {
  const root = graph.exports[exportName];
  if (root === undefined) return undefined;
  const seen = new Set<number>();
  const walk = (id: number): number | undefined => {
    if (seen.has(id)) return undefined;
    seen.add(id);
    const clip = graph.clips[id];
    if (!clip) return undefined;
    for (const [slot, child] of clip.children.entries())
      if (clip.names[slot] === name) return child;
    for (const child of clip.children) {
      const found = walk(child);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return walk(root);
}

const labelCache = new WeakMap<NativeMeshGraph, Map<number, Readonly<Record<string, number>>>>();
const NO_LABELS: Readonly<Record<string, number>> = Object.freeze({});
/** Frame index of each label of a clip (`nativeNamedChild` id or an export root); cached, read-only. */
export function nativeLabels(
  graph: NativeMeshGraph,
  id: number | undefined,
): Readonly<Record<string, number>> {
  const clip = id === undefined ? undefined : graph.clips[id];
  if (!clip) return NO_LABELS;
  let cache = labelCache.get(graph);
  if (!cache) labelCache.set(graph, (cache = new Map()));
  let result = cache.get(id!);
  if (!result) {
    const labels: Record<string, number> = {};
    for (const [frame, label] of clip.labels ?? []) labels[label] = frame;
    cache.set(id!, (result = Object.freeze(labels)));
  }
  return result;
}

const clipInfo = (graph: NativeMeshGraph, id: number | undefined) => {
  const clip = id === undefined ? undefined : graph.clips[id];
  return { frames: clip?.timeline.length ?? 1, fps: clip?.fps ?? 24 };
};

/**
 * Release-aligned attack frame: the source action frame sits on the recorded release, so the
 * wind-up plays before it and the follow-through after it.
 */
export function nativeAttackFrame(
  state: NativeDefenseState,
  elapsed: number,
  frames: number,
  fps: number,
  actionFrame: number,
) {
  const fired = state.firedAt;
  if (fired !== undefined && elapsed + EPS >= fired) {
    const frame = actionFrame + (elapsed - fired) * fps;
    if (frame < frames) return frame;
  }
  if (state.releaseAt !== undefined) {
    const remaining = state.releaseAt - state.clock;
    if (remaining >= 0 && remaining < actionFrame / fps) return actionFrame - remaining * fps;
  }
  return 0;
}

const liveUnit = (battle: Battle, id: number | undefined) => {
  if (id === undefined) return undefined;
  const unit = unitIndex(battle).get(id);
  return unit && unit.hp > 0 ? unit : undefined;
};

/** Unit the weapon currently points at, preferring its own state over the shared target map. */
export function nativeDefenseTarget(battle: Battle, tower: Building): Unit | undefined {
  const state = battle.nativeDefenses?.[tower.id];
  return (
    liveUnit(battle, state?.target) ??
    liveUnit(battle, state?.targets?.[0]) ??
    liveUnit(battle, state?.beams?.[0]) ??
    liveUnit(battle, battle.defenseTargets[tower.id])
  );
}

/** Firespitter facing: its saved direction in 90-degree steps around the map axes. */
export const nativeFacingAngle = (direction: number | undefined) =>
  (Math.floor(((direction ?? 0) % 8) / 2) * 90) % 360;

const segment = (
  labels: Readonly<Record<string, number>>,
  from: string,
  to: string,
  frames: number,
) => {
  const start = labels[from] ?? 0;
  const end = labels[to] ?? frames - 1;
  return { start, end: Math.max(start, end) };
};
const loop = (span: { start: number; end: number }, seconds: number, fps: number) =>
  span.start + ((Math.max(0, seconds) * fps) % Math.max(1, span.end - span.start + 1));

/** How the caller resolves a village pack field to the graph and export it would draw. */
export type NativeBodyResolver = (
  field: string,
  variant?: string,
) => { graph: NativeMeshGraph; export: string } | undefined;

/**
 * Body state of one Town Hall 11-18 defense: which declared export it draws, at which frame, and
 * the named turret / activation controls. Every frame reference comes from the source labels.
 */
export function nativeDefenseBody(
  tower: Building,
  battle: Battle | null,
  elapsed: number,
  resolve: NativeBodyResolver,
  options: {
    /** Source AnimationActionFrame (one-based) of this level, retained by the village pack. */
    actionFrame?: number;
    /** Aim kept from the previous frame while the weapon has no live target. */
    lastAim?: Point;
  } = {},
): NativeDefenseBody | undefined {
  if (!hasNativeDefenseBody(tower.kind)) return undefined;
  const kind = tower.kind as NativeDefenseKind;
  const state = battle?.nativeDefenses?.[tower.id];
  const weapon = weaponFor(tower);
  const c = center(tower);
  const target = battle && !battle.finished ? nativeDefenseTarget(battle, tower) : undefined;
  const aim = target ? { x: target.x - c.x, y: target.y - c.y } : options.lastAim;
  const controls: Record<string, number | false> = {};
  const body: NativeDefenseBody = { controls, aim };
  const angle =
    kind === 'firespitter' && !target
      ? nativeFacingAngle(tower.direction)
      : aim
        ? nativeMapAngle(aim.x, aim.y)
        : nativeFacingAngle(tower.direction);
  // Battle-mode bodies: gear mode, spell mode, Town Hall weapon level and Revenge Tower tier.
  const wanted: [string, string | undefined][] = [];
  if (kind === 'multigeartower' && (tower.gearMode ?? 'long') === 'fast')
    wanted.push(['AlternateExportName', `alternate-${tower.level}`]);
  if (kind === 'spelltower') wanted.push([`Mode:${tower.spellMode ?? 'rage'}`, undefined]);
  if (kind === 'townhall' && weapon) wanted.push([`Weapon${tower.weaponLevel ?? 1}`, undefined]);
  if (kind === 'revengetower' && battle && !battle.finished)
    wanted.push([
      `Tier${revengeTierIndex(tower, destroyedBuildings(battle))}`,
      `tiers-${tower.level}`,
    ]);
  let drawn: { graph: NativeMeshGraph; export: string } | undefined;
  for (const [field, variant] of wanted) {
    drawn = resolve(field, variant);
    if (drawn) {
      body.field = field;
      body.variant = variant;
      break;
    }
  }
  if (!drawn) {
    drawn = resolve('ExportName');
    body.field = undefined;
    body.variant = undefined;
  }
  if (!drawn) return body;
  const { graph, export: exportName } = drawn;
  const find = (clipName: string) => nativeNamedChild(graph, exportName, clipName);
  const turret = find('turret');
  if (turret !== undefined)
    controls.turret = nativeTurretFrame(nativeTurretBands(graph, turret), angle);
  for (const sector of ['base_sector', 'turret_sector'] as const) {
    const id = find(sector);
    if (id !== undefined)
      controls[sector] = nativeTurretFrame(
        nativeTurretBands(graph, id),
        nativeFacingAngle(tower.direction),
      );
  }
  if (!battle || battle.finished || !state || !weapon) return body;
  const action = options.actionFrame ?? 0;
  if (turret !== undefined && action > 0) {
    const attack = clipInfo(graph, firstDirectionClip(graph, turret));
    const frame = nativeAttackFrame(state, elapsed, attack.frames, attack.fps, action - 1);
    for (const child of directionNames(graph, turret)) controls[child] = frame;
  }
  const load = find('turret_load');
  if (load !== undefined) {
    const info = clipInfo(graph, load);
    controls.turret_load = loadFrame(
      kind,
      state,
      weapon,
      nativeLabels(graph, load),
      info,
      elapsed,
      tower,
    );
  }
  if (kind === 'townhall') {
    const info = clipInfo(graph, graph.exports[exportName]);
    body.clock = townHallFrame(state, labels(graph, exportName), info, elapsed, tower) / info.fps;
  }
  if (kind === 'revengetower') {
    // Tier bodies are one firing animation; it plays from the recorded release and then rests.
    const info = clipInfo(graph, graph.exports[exportName]);
    const frame = state.firedAt === undefined ? 0 : Math.max(0, elapsed - state.firedAt) * info.fps;
    body.clock = Math.min(frame, info.frames - 1) / info.fps;
  }
  return body;
}

const labels = (graph: NativeMeshGraph, exportName: string) =>
  nativeLabels(graph, graph.exports[exportName]);

/** Direction children of a turret clip (`d1`..`dN`), which hold the per-direction attack frames. */
const directionCache = new WeakMap<NativeMeshGraph, Map<number, readonly string[]>>();
export function directionNames(graph: NativeMeshGraph, turret: number): readonly string[] {
  let cache = directionCache.get(graph);
  if (!cache) directionCache.set(graph, (cache = new Map()));
  let names = cache.get(turret);
  if (!names) {
    const clip = graph.clips[turret];
    cache.set(turret, (names = (clip?.names ?? []).filter((n) => /^d\d+$/.test(n))));
  }
  return names;
}
function firstDirectionClip(graph: NativeMeshGraph, turret: number) {
  const clip = graph.clips[turret];
  if (!clip) return undefined;
  for (const [slot, child] of clip.children.entries())
    if (/^d\d+$/.test(clip.names[slot])) return child;
  return undefined;
}

/** Revenge Tower special-ability tier (1-4) for the destroyed-building count. */
export function revengeTierIndex(tower: Building, destroyed: number) {
  const tier = revengeTier(tower.level, destroyed);
  const names = ['DebrisTowerTier1', 'DebrisTowerTier2', 'DebrisTowerTier3', 'DebrisTowerTier4'];
  return Math.max(1, names.indexOf(tier.name) + 1);
}

function loadFrame(
  kind: NativeDefenseKind,
  state: NativeDefenseState,
  weapon: NonNullable<ReturnType<typeof weaponFor>>,
  labels: Readonly<Record<string, number>>,
  info: { frames: number; fps: number },
  elapsed: number,
  tower: Building,
) {
  const idle = labels.idle ?? 0;
  const awake = state.awakeAt !== undefined && elapsed + EPS >= state.awakeAt;
  if (kind === 'spelltower') {
    const attack = segment(labels, 'attack_start', 'attack_end', info.frames);
    const load = segment(labels, 'load_start', 'load_end', info.frames);
    const fired = state.firedAt;
    if (fired !== undefined && elapsed >= fired) {
      const frame = attack.start + (elapsed - fired) * info.fps;
      if (frame <= attack.end) return frame;
      const total = Math.max(0.001, weapon.interval - weapon.windup);
      const remaining = Math.max(0, (state.loadedAt ?? state.clock) - state.clock);
      const progress = Math.max(0, Math.min(1, 1 - remaining / total));
      return load.start + (load.end - load.start) * progress;
    }
    return idle;
  }
  // Activation timelines run through the declared wake delay and then hold the battle idle.
  const activating = segment(labels, 'activating_start', 'activating_end', info.frames);
  const delay = kind === 'townhall' ? townHallActivation(tower.level).delay : weapon.wakeDelay;
  if (state.awakeAt === undefined) return idle;
  if (!awake || (delay > 0 && elapsed < state.awakeAt)) {
    const progress =
      delay > 0 ? Math.max(0, Math.min(1, 1 - (state.awakeAt - elapsed) / delay)) : 1;
    return activating.start + (activating.end - activating.start) * progress;
  }
  const battleIdle = segment(
    labels,
    labels.battleidle_start !== undefined ? 'battleidle_start' : 'battleidle',
    labels.battleidle_end !== undefined ? 'battleidle_end' : 'battleidle',
    info.frames,
  );
  if (kind === 'eagleartillery') {
    const attack = segment(labels, 'attack_start', 'attack_end', info.frames);
    const load = segment(labels, 'load_start', 'load_end', info.frames);
    const empty = labels.empty;
    if ((state.ammo ?? 1) <= 0 && empty !== undefined) {
      const deactivate = segment(labels, 'deactivate_start', 'deactivating_end', info.frames);
      const fired = state.firedAt ?? elapsed;
      const age = elapsed - fired - (attack.end - attack.start + 1) / info.fps;
      const span = (deactivate.end - deactivate.start + 1) / info.fps;
      return age < span ? deactivate.start + Math.max(0, age) * info.fps : empty;
    }
    const fired = state.firedAt;
    if (fired !== undefined && elapsed >= fired) {
      const age = elapsed - fired;
      const attackSpan = (attack.end - attack.start + 1) / info.fps;
      if (age < attackSpan) return attack.start + age * info.fps;
      const total = Math.max(0.001, weapon.interval - attackSpan);
      const progress = Math.max(0, Math.min(1, (age - attackSpan) / total));
      if (progress < 1) return load.start + (load.end - load.start) * progress;
    }
    return loop(battleIdle, elapsed, info.fps);
  }
  return loop(battleIdle, elapsed, info.fps);
}

/** Town Hall weapon bodies: deactivated idle, activation, combat idle and the TH17 attack. */
export function townHallFrame(
  state: NativeDefenseState,
  labels: Readonly<Record<string, number>>,
  info: { frames: number; fps: number },
  elapsed: number,
  tower: Building,
) {
  const deactive = segment(labels, 'deactive_idle', 'deactive_end', info.frames);
  if (state.awakeAt === undefined) return loop(deactive, elapsed, info.fps);
  const delay = townHallActivation(tower.level).delay;
  const activation = segment(
    labels,
    'active_start',
    labels.attack_start !== undefined ? 'attack_start' : 'active_idle',
    info.frames,
  );
  if (elapsed < state.awakeAt) {
    const progress =
      delay > 0 ? Math.max(0, Math.min(1, 1 - (state.awakeAt - elapsed) / delay)) : 1;
    return activation.start + (activation.end - activation.start) * progress;
  }
  if (labels.attack !== undefined && labels.attack_end !== undefined) {
    const fired = state.firedAt;
    if (fired !== undefined && elapsed >= fired) {
      const frame = labels.attack + (elapsed - fired) * info.fps;
      if (frame <= labels.attack_end) return frame;
    }
    return labels.attack_idle ?? labels.attack;
  }
  const idle = segment(labels, 'active_idle', 'active_end', info.frames);
  return loop(idle, elapsed, info.fps);
}
