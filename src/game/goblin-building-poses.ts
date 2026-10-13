import source from '../../reference/goblin-buildings/runtime.json' with { type: 'json' };
import { nativeMeshPoses, type NativeMeshGraph } from './native-mesh';
import { GOBLIN_BUILDING_ART, type GoblinBuildingKind } from './goblin-building-art';

export const GOBLIN_BUILDING_GRAPH = source as unknown as NativeMeshGraph;
export function goblinBuildingPoses(kind: GoblinBuildingKind, seconds: number) {
  const { scale, anchorX, anchorY, export: name } = GOBLIN_BUILDING_ART[kind];
  return nativeMeshPoses(GOBLIN_BUILDING_GRAPH, name, seconds, {}, [
    scale,
    0,
    -scale * anchorX,
    0,
    scale,
    -scale * anchorY,
  ]);
}
/** Local ground registration is separate from the native foreground clip geometry. */
export function goblinBasePoses(kind: GoblinBuildingKind) {
  const {
    base,
    size,
    baseBounds: [left, top, right, bottom],
  } = GOBLIN_BUILDING_ART[kind];
  const sx = (size * 64) / (right - left),
    sy = (size * 32) / (bottom - top);
  return nativeMeshPoses(GOBLIN_BUILDING_GRAPH, base, 0, {}, [
    sx,
    0,
    (-sx * (left + right)) / 2,
    0,
    sy,
    (-sy * (top + bottom)) / 2,
  ]);
}
