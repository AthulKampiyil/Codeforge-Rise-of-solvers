import {
  BUILDING_KEYS,
  BUILDINGS,
  maxCountFor,
  maxLevelFor,
  MAX_TOWNHALL,
  type BuildingKind,
} from '../game/data';
import { BUILD_MAX, BUILD_MIN } from '../game/grid';

/** One entry of a Town Hall's complete roster: how many of a kind, at which level. */
export interface PlannedKind {
  kind: BuildingKind;
  count: number;
  level: number;
}
export interface Placement {
  kind: BuildingKind;
  level: number;
  x: number;
  y: number;
}
/** Side of the buildable square; both packing and the wall rings stay inside it. */
const AREA = BUILD_MAX - BUILD_MIN;

/**
 * Every building a fully maxed village of this Town Hall owns, each at that tier's ceiling.
 * The Town Hall itself is listed at the requested level rather than at its catalog ceiling.
 */
export function maxVillagePlan(townhall: number): PlannedKind[] {
  const tier = Math.min(MAX_TOWNHALL, Math.max(1, Math.floor(townhall) || 1));
  const plan: PlannedKind[] = [];
  for (const kind of BUILDING_KEYS) {
    if (kind === 'townhall') {
      plan.push({ kind, count: 1, level: tier });
      continue;
    }
    const count = maxCountFor(kind, tier);
    const level = maxLevelFor(kind, tier);
    // A tier that permits none of a building, or no level of it, owns none of it.
    if (count > 0 && level > 0) plan.push({ kind, count, level });
  }
  return plan;
}
/** Total pieces a plan places, which must stay inside the save format's ceiling. */
export const plannedTotal = (plan: readonly PlannedKind[]) =>
  plan.reduce((n, entry) => n + entry.count, 0);

interface Piece {
  kind: BuildingKind;
  level: number;
  size: number;
}
const expand = (plan: readonly PlannedKind[]): Piece[] =>
  plan.flatMap(({ kind, count, level }) =>
    Array.from({ length: count }, () => ({ kind, level, size: BUILDINGS[kind].size })),
  );
/** Centre first, then largest first; the one-tile traps land last and fill what is left over. */
const layoutOrder = (a: Piece, b: Piece) =>
  Number(b.kind === 'townhall') - Number(a.kind === 'townhall') ||
  b.size - a.size ||
  (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0);

/** Occupancy of the buildable square, addressed in area-local coordinates. */
class Ground {
  private readonly taken = new Uint8Array(AREA * AREA);
  free(x: number, y: number, size: number, pad: number) {
    const x0 = Math.max(0, x - pad);
    const y0 = Math.max(0, y - pad);
    const x1 = Math.min(AREA, x + size + pad);
    const y1 = Math.min(AREA, y + size + pad);
    if (x < 0 || y < 0 || x + size > AREA || y + size > AREA) return false;
    for (let ty = y0; ty < y1; ty++)
      for (let tx = x0; tx < x1; tx++) if (this.taken[ty * AREA + tx]) return false;
    return true;
  }
  occupy(x: number, y: number, size: number) {
    for (let ty = y; ty < y + size; ty++)
      for (let tx = x; tx < x + size; tx++) this.taken[ty * AREA + tx] = 1;
  }
}
/**
 * Every tile of the buildable square, nearest the middle first. A building takes the first
 * position in this order that it fits, so the base grows outward from the Town Hall.
 */
const SPIRAL = (() => {
  const middle = (AREA - 1) / 2;
  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < AREA; y++) for (let x = 0; x < AREA; x++) tiles.push({ x, y });
  return tiles.sort(
    (a, b) =>
      Math.hypot(a.x - middle, a.y - middle) - Math.hypot(b.x - middle, b.y - middle) ||
      a.y - b.y ||
      a.x - b.x,
  );
})();

/** Place one building at the free position closest to the middle, keeping `pad` tiles clear. */
function placeNearMiddle(ground: Ground, piece: Piece, pad: number) {
  for (const tile of SPIRAL) {
    // A footprint is anchored so that its own centre, not its corner, sits near the middle.
    const x = Math.min(AREA - piece.size, Math.max(0, tile.x - Math.floor(piece.size / 2)));
    const y = Math.min(AREA - piece.size, Math.max(0, tile.y - Math.floor(piece.size / 2)));
    if (ground.free(x, y, piece.size, pad)) {
      ground.occupy(x, y, piece.size);
      return { x, y };
    }
  }
  return null;
}

/**
 * A complete arrangement for a plan: buildings grown outward from a central Town Hall, with the
 * walls ringing the result. Spacing of one tile is kept when the tier can afford it, so troops
 * can walk between buildings; a late tier that needs every tile packs its buildings together.
 * Returns null only when the plan cannot fit the buildable area at all.
 */
export function packVillage(plan: readonly PlannedKind[]): Placement[] | null {
  const walls = plan.find((entry) => entry.kind === 'wall')?.count ?? 0;
  const level = plan.find((entry) => entry.kind === 'wall')?.level ?? 1;
  const pieces = expand(plan.filter((entry) => entry.kind !== 'wall')).sort(layoutOrder);
  for (const pad of [1, 0]) {
    const ground = new Ground();
    const placements: Placement[] = [];
    let fitted = true;
    for (const piece of pieces) {
      const at = placeNearMiddle(ground, piece, pad);
      if (!at) {
        fitted = false;
        break;
      }
      placements.push({
        kind: piece.kind,
        level: piece.level,
        x: BUILD_MIN + at.x,
        y: BUILD_MIN + at.y,
      });
    }
    if (!fitted) continue;
    const rings = wallRings(placements, ground, walls, level);
    if (rings === null) continue;
    return [...placements, ...rings];
  }
  return null;
}

/** Walls in rectangular rings just outside the buildings, innermost first. */
function wallRings(placements: readonly Placement[], ground: Ground, walls: number, level: number) {
  if (!walls) return [];
  const left = Math.min(...placements.map((p) => p.x)) - BUILD_MIN;
  const top = Math.min(...placements.map((p) => p.y)) - BUILD_MIN;
  const right = Math.max(...placements.map((p) => p.x + BUILDINGS[p.kind].size)) - BUILD_MIN;
  const bottom = Math.max(...placements.map((p) => p.y + BUILDINGS[p.kind].size)) - BUILD_MIN;
  const ring: Placement[] = [];
  for (let d = 1; ring.length < walls; d++) {
    const x0 = left - d;
    const y0 = top - d;
    const x1 = right + d - 1;
    const y1 = bottom + d - 1;
    if (x0 < 0 && y0 < 0 && x1 >= AREA && y1 >= AREA) return null;
    for (const tile of border(x0, y0, x1, y1)) {
      if (ring.length >= walls) break;
      if (!ground.free(tile.x, tile.y, 1, 0)) continue;
      ground.occupy(tile.x, tile.y, 1);
      ring.push({ kind: 'wall', level, x: BUILD_MIN + tile.x, y: BUILD_MIN + tile.y });
    }
  }
  return ring;
}
/** The tiles of one rectangle outline, clockwise, skipping anything outside the buildable area. */
function border(x0: number, y0: number, x1: number, y1: number) {
  const tiles: { x: number; y: number }[] = [];
  const push = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < AREA && y < AREA) tiles.push({ x, y });
  };
  for (let x = x0; x <= x1; x++) push(x, y0);
  for (let y = y0 + 1; y <= y1; y++) push(x1, y);
  for (let x = x1 - 1; x >= x0; x--) push(x, y1);
  for (let y = y1 - 1; y > y0; y--) push(x0, y);
  return tiles;
}
