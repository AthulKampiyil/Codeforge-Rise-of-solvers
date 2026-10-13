import type { Building } from './model';
export type WallAxis = 'x' | 'y';
export type WallResource = 'gold' | 'elixir';

/** A row is straight, contiguous, and never follows corners or jumps gaps. */
export function wallRow(
  buildings: readonly Building[],
  anchorId: number,
  axis: WallAxis,
): Building[] {
  const anchor = buildings.find((b) => b.id === anchorId && b.kind === 'wall');
  if (!anchor) return [];
  const grid = new Map(buildings.filter((b) => b.kind === 'wall').map((b) => [`${b.x},${b.y}`, b]));
  const row = [anchor];
  for (const direction of [-1, 1]) {
    let x = anchor.x,
      y = anchor.y;
    for (let i = 0; i < grid.size; i++) {
      if (axis === 'x') x += direction;
      else y += direction;
      const next = grid.get(`${x},${y}`);
      if (!next) break;
      if (direction < 0) row.unshift(next);
      else row.push(next);
    }
  }
  return row;
}

/** Prefer nearby matching walls; ID resolves equal distances independent of save-array order. */
export function matchingWalls(buildings: readonly Building[], anchorId: number): Building[] {
  const anchor = buildings.find((b) => b.id === anchorId && b.kind === 'wall');
  if (!anchor || anchor.constructing || anchor.upgradeEnd) return [];
  return buildings
    .filter(
      (b) => b.kind === 'wall' && b.level === anchor.level && !b.constructing && !b.upgradeEnd,
    )
    .sort(
      (a, b) =>
        Number(b.id === anchor.id) - Number(a.id === anchor.id) ||
        Math.abs(a.x - anchor.x) +
          Math.abs(a.y - anchor.y) -
          Math.abs(b.x - anchor.x) -
          Math.abs(b.y - anchor.y) ||
        a.id - b.id,
    );
}
