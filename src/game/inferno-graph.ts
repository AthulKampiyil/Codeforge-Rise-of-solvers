import { INFERNO_ROOT, infernoPortrait, type InfernoArtState } from './inferno-art';
import { infernoStats, type InfernoMode } from './inferno-weapon';
import {
  NATIVE_IDENTITY,
  nativeVertices,
  type NativeScenePose,
  nativeScenePoses,
  type NativeMatrix,
  type NativeMeshGraph,
} from './native-mesh';
import { LazyGraph } from './lazy-graph';

/**
 * The Inferno Tower's original scene graph. Kept out of `inferno-art.ts` so that naming a
 * portrait or texture — which the simulation does — never parses the artwork, and loaded with
 * the Inferno art family rather than at startup.
 */
const INFERNO_SOURCE = new LazyGraph<NativeMeshGraph>(
  'Inferno Tower',
  () => import('../../reference/inferno/art-runtime.json'),
);
export const loadInfernoArt = () => INFERNO_SOURCE.load();
export const infernoArtLoaded = () => INFERNO_SOURCE.loaded;
export const infernoGraph = () => INFERNO_SOURCE.get();

/** Original source layers. The world adapter supplies registration explicitly. */
export function infernoPoses(
  level: number,
  mode: InfernoMode,
  state: InfernoArtState,
  seconds: number,
  root: NativeMatrix = NATIVE_IDENTITY,
) {
  const { art } = infernoStats(level);
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid Inferno art time');
  const sample = (name: string, empty = false) =>
    nativeScenePoses(infernoGraph(), name, seconds, empty ? { ammo: false } : {}, root);
  if (state === 'ruin') return sample(art.ExportNameDamaged);
  const base = sample(art.ExportNameBase);
  if (state === 'constructing') return [...base, ...sample(art.ExportNameConstruction)];
  if (state === 'upgrading')
    return [
      ...base,
      ...sample(mode === 'multi' ? art.AlternateUpgradeExportName : art.ExportNameUpgradeAnim),
      ...sample(art.ExportNameBuildAnim),
    ];
  return [
    ...base,
    ...sample(mode === 'multi' ? art.AlternateExportName : art.ExportName, state === 'empty'),
  ];
}

export function infernoBounds(
  level: number,
  state: 'setup' | 'constructing' | 'upgrading' | 'ruin' = 'setup',
  seconds = 0,
  mode: InfernoMode = 'single',
) {
  if (!INFERNO_SOURCE.loaded) {
    // Until the graph arrives, the portrait's box through the same registration.
    const [a, , , d, x, y] = INFERNO_ROOT,
      [left, top, right, bottom] = infernoPortrait(level, mode).bounds;
    return [left * a + x, top * d + y, right * a + x, bottom * d + y] as [
      number,
      number,
      number,
      number,
    ];
  }
  const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (poses: NativeScenePose[]) => {
    for (const pose of poses) {
      if ('group' in pose) visit(pose.group);
      else {
        const vertices = nativeVertices(pose);
        for (let i = 0; i < vertices.length; i += 4) {
          bounds[0] = Math.min(bounds[0], vertices[i]);
          bounds[1] = Math.min(bounds[1], vertices[i + 1]);
          bounds[2] = Math.max(bounds[2], vertices[i]);
          bounds[3] = Math.max(bounds[3], vertices[i + 1]);
        }
      }
    }
  };
  visit(infernoPoses(level, mode, state === 'setup' ? 'active' : state, seconds, INFERNO_ROOT));
  if (!bounds.every(Number.isFinite)) throw new Error('Empty original Inferno pose');
  return bounds;
}
