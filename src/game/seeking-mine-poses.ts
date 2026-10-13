import combat from '../../reference/seeking-mine/combat.json' with { type: 'json' };
import {
  nativeScenePoses,
  nativeVertices,
  type NativeMeshGraph,
  type NativeMatrix,
  type NativeScenePose,
} from './native-mesh';
import { SEEKING_MINE_ART, seekingMineFamily } from './seeking-mine-art';
import type { TrapState } from './traps';
import { LazyGraph, artBoxBounds } from './lazy-graph';

/** The Seeking Air Mine graph loads with its art family, not at startup. */
const SEEKING_MINE_SOURCE = new LazyGraph<NativeMeshGraph>(
  'Seeking Air Mine',
  () => import('../../reference/seeking-mine/runtime.json'),
);
export const loadSeekingMineArt = () => SEEKING_MINE_SOURCE.load();
export const seekingMineArtLoaded = () => SEEKING_MINE_SOURCE.loaded;
export const seekingMineGraph = () => SEEKING_MINE_SOURCE.get();
export type SeekingMineVisualState =
  'setup' | 'constructing' | 'upgrading' | 'triggered' | 'spent' | 'ruin';
export const seekingMineClip = (name: string) =>
  seekingMineGraph().clips[seekingMineGraph().exports[name]];
export const seekingMineClipTime = (name: string, age: number) =>
  Math.max(
    0,
    Math.min(age, (seekingMineClip(name).timeline.length - 1) / seekingMineClip(name).fps),
  );

export function seekingMinePoses(level: number, state: SeekingMineVisualState, time = 0) {
  seekingMineFamily(level);
  const { scale, anchorX, anchorY } = SEEKING_MINE_ART;
  const root: NativeMatrix = [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale];
  const sample = (name: string, seconds = 0) =>
    nativeScenePoses(seekingMineGraph(), name, seconds, {}, root);
  if (state === 'spent' || state === 'ruin') return sample(combat.broken);
  if (state === 'triggered')
    return sample(combat.trigger, seekingMineClipTime(combat.trigger, time));
  if (state === 'constructing') return sample(combat.upgrade);
  return [
    ...sample(combat.levels[level - 1].setup, time),
    ...(state === 'upgrading' ? sample(combat.upgrade) : []),
  ];
}

/** Ground hatch has its own complete timeline, independent of flight/impact. */
export function seekingMineBodyState(
  state: TrapState | undefined,
  elapsed: number,
  reduced: boolean,
  finished: boolean,
): { state: 'setup' | 'triggered' | 'spent'; time: number } {
  if (!state) return { state: 'setup', time: reduced ? 0 : elapsed };
  const age = Math.max(0, elapsed - state.activatedAt);
  if (
    reduced ||
    finished ||
    age >= seekingMineClip(combat.trigger).timeline.length / seekingMineClip(combat.trigger).fps
  )
    return { state: 'spent', time: 0 };
  return { state: 'triggered', time: age };
}

export function seekingMineFlightPoint(
  x: number,
  y: number,
  age: number,
  iso: (x: number, y: number) => { x: number; y: number },
  airLift: number,
) {
  const ground = iso(x, y);
  return {
    ...ground,
    y: ground.y - airLift * Math.max(0, Math.min(1, age / SEEKING_MINE_ART.riseSeconds)),
  };
}

/** Source play-once clip shares the activation clock, preserving its empty introduction. */
export function seekingMineProjectilePose(
  level: number,
  state: TrapState,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
  airLift: number,
) {
  seekingMineFamily(level);
  const row =
    combat.projectiles[combat.levels[level - 1].projectile as keyof typeof combat.projectiles];
  const age = Math.max(0, elapsed - state.activatedAt),
    s = (SEEKING_MINE_ART.scale * row.scale) / 100;
  return {
    ...seekingMineFlightPoint(state.x, state.y, age, iso, airLift),
    ground: iso(state.x, state.y),
    time: seekingMineClipTime(row.export, age),
    export: row.export,
    poses: nativeScenePoses(
      seekingMineGraph(),
      row.export,
      row.playOnce ? seekingMineClipTime(row.export, age) : age,
      {},
      [s, 0, 0, 0, s, 0],
    ),
    shadow: nativeScenePoses(seekingMineGraph(), row.shadow, age, {}, [s, 0, 0, 0, s, 0]),
  };
}

const bounds = new Map<string, [number, number, number, number]>();
export function seekingMineBounds(level: number, state: SeekingMineVisualState = 'setup') {
  if (!SEEKING_MINE_SOURCE.loaded) return artBoxBounds(SEEKING_MINE_ART);
  const key = `${level}:${state}`;
  if (bounds.has(key)) return bounds.get(key)!;
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  const collect = (poses: NativeScenePose[]) => {
    for (const p of poses) {
      if ('group' in p) {
        collect(p.group);
        continue;
      }
      const v = nativeVertices(p);
      for (let i = 0; i < v.length; i += 4) {
        left = Math.min(left, v[i]);
        right = Math.max(right, v[i]);
        top = Math.min(top, v[i + 1]);
        bottom = Math.max(bottom, v[i + 1]);
      }
    }
  };
  const clip = seekingMineClip(
    state === 'triggered' ? combat.trigger : combat.levels[level - 1].setup,
  );
  const frames = ['setup', 'upgrading', 'triggered'].includes(state) ? clip.timeline.length : 1;
  for (let frame = 0; frame < frames; frame++)
    collect(seekingMinePoses(level, state, frame / clip.fps));
  const result: [number, number, number, number] = [left, top, right, bottom];
  bounds.set(key, result);
  return result;
}
