import { nativeMeshPoses, type NativeMatrix, type NativeMeshGraph } from './native-mesh';
import { XBOW_ART, xbowExport } from './xbow-art';
import type { XbowMode } from './xbow-stats';
import { LazyGraph } from './lazy-graph';

type XbowSource = NativeMeshGraph & { sounds: Record<string, { path: string }> };
/** The X-Bow graph (about 1 MB) loads with the X-Bow art family, not at startup. */
const XBOW_SOURCE = new LazyGraph<XbowSource>(
  'X-Bow',
  () => import('../../reference/xbow/runtime.json'),
);
export const loadXbowArt = () => XBOW_SOURCE.load();
export const xbowArtLoaded = () => XBOW_SOURCE.loaded;
export const xbowGraph = (): NativeMeshGraph => XBOW_SOURCE.get();
/** Native samples; none until the graph that lists them has loaded. */
export const xbowSounds = () => (XBOW_SOURCE.loaded ? XBOW_SOURCE.get().sounds : {});
export function xbowPoses(
  level: number,
  mode: XbowMode,
  direction: number,
  seconds: number,
  ammunition: number,
  upgrading = false,
) {
  const { scale, anchorX, anchorY } = XBOW_ART;
  const matrix: NativeMatrix = [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale];
  return nativeMeshPoses(
    xbowGraph(),
    xbowExport(level, mode, upgrading),
    seconds,
    { turret: direction, ammo: ammunition > 0 ? direction : false },
    matrix,
  );
}
