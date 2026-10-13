import type { NativeMeshGraph } from './native-mesh';

/**
 * The integer root frame `nativeScenePoses`/`nativeMeshPoses` sample for `seconds`. Nested
 * clips derive their frames from it, so two times with the same root frame (and the same
 * controls and root matrix) produce identical poses: presentations key their redraw
 * signatures on it instead of re-sampling a 24 fps clip on every 60 fps frame.
 */
export function nativeFrameIndex(graph: NativeMeshGraph, name: string, seconds: number) {
  const fps = graph.clips[graph.exports[name]]?.fps ?? 1;
  return Math.floor((Number.isFinite(seconds) ? Math.max(0, seconds) : 0) * fps + 1e-9);
}
