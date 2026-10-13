import { BUILD_MIN, BUILD_MAX } from './grid';
import { BUILDINGS } from './data';
import type { Building } from './model';
import { overlapsObstacle, type Obstacle } from './obstacles';
import { overlapsDecoration, type Decoration } from './decorations';
import type { WallAxis } from './wall-selection';

export type WallSlot = { id: number; x: number; y: number };
export type WallMove = {
  anchorId: number;
  axis: WallAxis;
  source: WallSlot[];
  x: number;
  y: number;
  turns: number;
};

/** Quarter turns keep each wall's identity and integer tile relative to the selected anchor. */
export function wallDestinations(move: WallMove): WallSlot[] {
  const anchor = move.source.find((b) => b.id === move.anchorId);
  if (!anchor) return [];
  return move.source.map((b) => {
    let dx = b.x - anchor.x,
      dy = b.y - anchor.y;
    for (let turn = 0; turn < move.turns; turn++) [dx, dy] = [-dy, dx];
    return { id: b.id, x: move.x + dx, y: move.y + dy };
  });
}

export function wallMoveIssue(
  move: WallMove,
  buildings: readonly Building[],
  obstacles: readonly Obstacle[],
  decorations: readonly Decoration[] = [],
): string | null {
  const ids = new Set(move.source.map((b) => b.id));
  if (
    ids.size < 2 ||
    ids.size !== move.source.length ||
    !Number.isInteger(move.turns) ||
    move.turns < 0 ||
    move.turns > 3
  )
    return 'Select a connected wall row.';
  if (
    move.source.some(
      (s) =>
        !buildings.some((b) => b.id === s.id && b.kind === 'wall' && b.x === s.x && b.y === s.y),
    )
  )
    return 'The selected row changed. Cancel and select it again.';
  const target = wallDestinations(move);
  if (
    target.length !== move.source.length ||
    target.some(
      (b) =>
        !Number.isInteger(b.x) ||
        !Number.isInteger(b.y) ||
        b.x < BUILD_MIN ||
        b.y < BUILD_MIN ||
        b.x >= BUILD_MAX ||
        b.y >= BUILD_MAX,
    )
  )
    return 'Keep every wall inside the village.';
  if (new Set(target.map((b) => `${b.x},${b.y}`)).size !== target.length)
    return 'Each wall needs its own tile.';
  if (target.some((b) => overlapsObstacle(obstacles, b.x, b.y, 1)))
    return 'Clear the trees or rocks beneath this row.';
  if (
    target.some((s) =>
      buildings.some(
        (b) =>
          !ids.has(b.id) &&
          s.x < b.x + BUILDINGS[b.kind].size &&
          s.x + 1 > b.x &&
          s.y < b.y + BUILDINGS[b.kind].size &&
          s.y + 1 > b.y,
      ),
    ) ||
    target.some((s) => overlapsDecoration(decorations, s.x, s.y, 1))
  )
    return 'Move the row onto clear ground.';
  return null;
}
