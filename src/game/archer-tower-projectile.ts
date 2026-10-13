import graph from '../../reference/archer-tower/characters-runtime.json' with { type: 'json' };
import { nativeScenePoses, type NativeMeshGraph } from './native-mesh';
import { archerTowerProjectileRow } from './archer-tower-stats';
import type { CombatProjectile } from './projectiles';
export const ARCHER_TOWER_PROJECTILE_GRAPH = graph as unknown as NativeMeshGraph;

/** Original meshes and launch settings with the village's local 1.2 scale / 0.6 altitude projection. */
export function archerTowerProjectilePose(
  p: CombatProjectile,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
  targetHeight = 16,
) {
  if (p.weapon !== 'arrow' || p.variant === undefined || !p.flight)
    throw new Error('Missing native Archer Tower flight');
  if (!Number.isFinite(elapsed) || !Number.isFinite(targetHeight))
    throw new Error('Invalid arrow presentation time or height');
  const row = archerTowerProjectileRow(p.variant);
  const travelled = Math.hypot(p.flight.x - p.fromX, p.flight.y - p.fromY);
  const dx = p.x - p.flight.x,
    dy = p.y - p.flight.y;
  const remaining = Math.hypot(dx, dy);
  const progress = travelled + remaining ? travelled / (travelled + remaining) : 1;
  const offset = (Number(row.StartOffset) / 100) * (1 - progress);
  const ground = iso(
    p.flight.x + (dx / (remaining || 1)) * offset,
    p.flight.y + (dy / (remaining || 1)) * offset,
  );
  const target = iso(p.x, p.y);
  const x = ground.x;
  const y = ground.y - Number(row.StartHeight) * 0.6 * (1 - progress) - targetHeight * progress;
  // Original arrow tip points along +Y. Face the current projected destination.
  const rotation =
    row.UseRotate === 'TRUE'
      ? Math.atan2(target.y - targetHeight - y, target.x - x) - Math.PI / 2
      : 0;
  const scale = (Number(row.Scale) / 100) * 1.2;
  const c = Math.cos(rotation) * scale,
    s = Math.sin(rotation) * scale;
  const time = Math.max(0, elapsed - p.launched);
  return {
    x,
    y,
    rotation,
    progress,
    export: row.ExportName,
    poses:
      elapsed < p.launched
        ? []
        : nativeScenePoses(ARCHER_TOWER_PROJECTILE_GRAPH, row.ExportName, time, {}, [
            c,
            -s,
            0,
            s,
            c,
            0,
          ]),
  };
}
