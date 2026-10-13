import source from '../../reference/dark-storage/runtime.json' with { type: 'json' };
import { nativeMeshPoses, type NativeMeshGraph } from './native-mesh';
import { DARK_STORAGE_ART, darkStorageFrame } from './dark-storage-art';
import { darkStorageStats } from './dark-storage-stats';

export const DARK_STORAGE_GRAPH = source as unknown as NativeMeshGraph;
export function darkStoragePoses(level: number, fraction: number) {
  const row = darkStorageStats(level);
  if (!row) throw Error(`Unsupported native Dark Elixir Storage level: ${level}`);
  const { scale, anchorX, anchorY } = DARK_STORAGE_ART;
  return nativeMeshPoses(
    DARK_STORAGE_GRAPH,
    row.export,
    0,
    { resource: darkStorageFrame(fraction) },
    [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale],
  );
}
