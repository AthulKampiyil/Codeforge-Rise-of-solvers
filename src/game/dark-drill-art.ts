import type { Building } from './model';
import { nativeVertices } from './native-mesh';
import { darkDrillStats } from './dark-drill-stats';
import { LazyGraph } from './lazy-graph';
import {
  NATIVE_IDENTITY,
  nativeScenePoses,
  type NativeMatrix,
  type NativeMeshGraph,
} from './native-mesh';

/** The Drill graph (about 3 MB of JSON) loads with the Drill art family, not at startup. */
const DARK_DRILL_SOURCE = new LazyGraph<NativeMeshGraph>(
  'Dark Elixir Drill',
  () => import('../../reference/dark-drill/art-runtime.json'),
);
export const loadDarkDrillArt = () => DARK_DRILL_SOURCE.load();
export const darkDrillArtLoaded = () => DARK_DRILL_SOURCE.loaded;
export const darkDrillGraph = () => DARK_DRILL_SOURCE.get();
export type DarkDrillArtState = 'working' | 'idle' | 'constructing' | 'upgrading' | 'ruin';

/** Original source layers with an explicit reservoir frame, independent of the body clock.
 * Working loops the complete source timeline; idle/upgrading hold its frame-zero idle pose.
 * Those state choices are local interpretations, not verified native executable behavior.
 */
export function darkDrillPoses(
  level: number,
  state: DarkDrillArtState,
  seconds: number,
  resourceFrame = 0,
  root: NativeMatrix = NATIVE_IDENTITY,
) {
  const { art } = darkDrillStats(level);
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid Drill art time');
  if (!Number.isInteger(resourceFrame) || resourceFrame < 0 || resourceFrame >= 100)
    throw new Error('Invalid Drill reservoir frame');
  const sample = (name: string, time = 0) =>
    nativeScenePoses(darkDrillGraph(), name, time, { resource: resourceFrame }, root);
  if (state === 'ruin') return sample(art.ExportNameDamaged);
  const base = sample(art.ExportNameBase);
  if (state === 'constructing') return [...base, ...sample(art.ExportNameConstruction)];
  return [
    ...base,
    ...sample(art.ExportName, state === 'working' ? seconds : 0),
    ...(state === 'upgrading' ? sample(art.ExportNameBuildAnim) : []),
  ];
}

/** Local world registration shared by the other three-tile native buildings. */
export const DARK_DRILL_ROOT: NativeMatrix = [1.2, 0, 0, 0, 1.2, -96];

export function darkDrillBuildingPoses(building: Building, seconds: number) {
  const capacity = darkDrillStats(building.level).production.capacity;
  const state: DarkDrillArtState =
    building.hp <= 0
      ? 'ruin'
      : building.constructing
        ? 'constructing'
        : building.upgradeEnd
          ? 'upgrading'
          : building.stored >= capacity
            ? 'idle'
            : 'working';
  // Local linear storage-to-source-frame interpretation, clamped below timeline wrap.
  const frame = Math.min(99, Math.floor((Math.max(0, building.stored) / capacity) * 100));
  return darkDrillPoses(building.level, state, seconds, frame, DARK_DRILL_ROOT);
}
/** Screen box of the fallback Drill sprite, used until the native graph has loaded. */
const FALLBACK_BOUNDS = [-58, -128, 58, 8];
export function darkDrillBounds(building: Building, seconds: number) {
  if (!DARK_DRILL_SOURCE.loaded) return [...FALLBACK_BOUNDS];
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const pose of darkDrillBuildingPoses(building, seconds)) {
    if ('group' in pose) throw new Error('Unexpected Drill blend group');
    const v = nativeVertices(pose);
    for (let i = 0; i < v.length; i += 4) {
      bounds[0] = Math.min(bounds[0], v[i]);
      bounds[1] = Math.min(bounds[1], v[i + 1]);
      bounds[2] = Math.max(bounds[2], v[i]);
      bounds[3] = Math.max(bounds[3], v[i + 1]);
    }
  }
  if (!bounds.every(Number.isFinite)) throw new Error('Empty Drill bounds');
  return bounds;
}
