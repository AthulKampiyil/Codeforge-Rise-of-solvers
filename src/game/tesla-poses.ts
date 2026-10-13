import {
  nativeScenePoses,
  nativeVertices,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';
import { TESLA_ART } from './tesla-art';
import { LazyGraph, artBoxBounds } from './lazy-graph';

type TeslaSource = NativeMeshGraph & {
  sounds: Record<string, { path: string }>;
  levels: Record<string, string>[];
};
/** The Tesla graph (with its sounds and level rows) loads with the Tesla art family. */
const TESLA_SOURCE = new LazyGraph<TeslaSource>(
  'Hidden Tesla',
  () => import('../../reference/tesla/runtime.json'),
);
export const loadTeslaArt = () => TESLA_SOURCE.load();
export const teslaArtLoaded = () => TESLA_SOURCE.loaded;
export const teslaGraph = (): NativeMeshGraph => TESLA_SOURCE.get();
export const teslaSounds = () => TESLA_SOURCE.get().sounds;
const source = {
  get levels() {
    return TESLA_SOURCE.get().levels;
  },
};
export type TeslaVisualState = 'setup' | 'reveal' | 'constructing' | 'upgrading' | 'ruin';

export function teslaPoses(
  level: number,
  state: TeslaVisualState,
  seconds: number,
  reduced = false,
): NativeScenePose[] {
  const row = source.levels[level - 1];
  if (!row) throw Error(`Unsupported native Tesla level: ${level}`);
  const { scale, anchorX, anchorY } = TESLA_ART;
  const root: [number, number, number, number, number, number] = [
    scale,
    0,
    -anchorX * scale,
    0,
    scale,
    -anchorY * scale,
  ];
  const sample = (name: string, time: number, controls: Record<string, number | false> = {}) =>
    nativeScenePoses(teslaGraph(), name, time, controls, root);
  if (state === 'ruin') return sample(row.ExportNameDamaged, 0);
  if (state === 'constructing') return sample(row.ExportNameConstruction, 0);
  if (state === 'upgrading')
    return [
      ...sample(row.ExportName, 0, { idle_electricity: false }),
      ...sample(row.ExportNameBuildAnim, 0),
    ];
  if (state === 'setup')
    return sample(row.ExportName, seconds, reduced ? { idle_electricity: false } : {});
  const clip = teslaGraph().clips[teslaGraph().exports[row.ExportNameTriggered]];
  const last = clip.timeline.length - 1;
  const frame = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) * clip.fps + 1e-9);
  // Hold the last reveal composition, while the separately placed electricity
  // keeps its own clock. Replaying the root would hide the tower every 0.75 s.
  return sample(row.ExportNameTriggered, (reduced ? last : Math.min(last, frame)) / clip.fps, {
    idle_electricity: reduced ? false : Math.max(0, frame - last),
  });
}

const bounds = new Map<string, [number, number, number, number]>();
/** Native foreground extent for picking and bars. */
export function teslaBodyBounds(
  level: number,
  state: Exclude<TeslaVisualState, 'reveal'> = 'setup',
) {
  if (!TESLA_SOURCE.loaded) return artBoxBounds(TESLA_ART);
  const key = `${level}:${state}`;
  let cached = bounds.get(key);
  if (!cached) {
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    for (const pose of teslaPoses(level, state, 0, true)) {
      if ('group' in pose) continue;
      const vertices = nativeVertices(pose);
      for (let i = 0; i < vertices.length; i += 4) {
        left = Math.min(left, vertices[i]);
        right = Math.max(right, vertices[i]);
        top = Math.min(top, vertices[i + 1]);
        bottom = Math.max(bottom, vertices[i + 1]);
      }
    }
    cached = [left, top, right, bottom];
    bounds.set(key, cached);
  }
  return cached;
}

const muzzleCache = new Map<string, number>();
/** Follow the actual reveal geometry instead of an unrelated easing curve. */
export function teslaMuzzleY(level: number, revealAge = Infinity, reduced = false) {
  const frame = reduced ? 17 : Math.min(17, Math.max(0, Math.floor(revealAge * 24 + 1e-9)));
  const key = `${level}:${frame}`;
  let y = muzzleCache.get(key);
  if (y !== undefined) return y;
  const poses = nativeScenePoses(
    teslaGraph(),
    source.levels[level - 1].ExportNameTriggered,
    frame / 24,
    { idle_electricity: false },
    [1.2, 0, 0, 0, 1.2, -48],
  );
  let top = Infinity;
  for (const pose of poses) {
    if ('group' in pose) continue;
    const vertices = nativeVertices(pose);
    for (let i = 1; i < vertices.length; i += 4) top = Math.min(top, vertices[i]);
  }
  y = Number.isFinite(top) ? Math.min(0, top + 8) : 0;
  muzzleCache.set(key, y);
  return y;
}
