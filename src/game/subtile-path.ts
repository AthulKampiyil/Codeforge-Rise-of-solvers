import { BUILDINGS, isTrap } from './data';
import { distance2D } from './distance';
import { MAP_SIZE } from './grid';
import type { Building } from './model';

/**
 * Client sub-tile collision for version-44 native campaign battles.
 *
 * The pathfinder in the public client reconstruction (bns34/Supercell.Magic-my-turn @52c5953,
 * `LogicTileMap.IsPassablePathFinder`, `LogicTile.RefreshSubTiles`,
 * `LogicBuilding.PassableSubtilesAtEdge`) splits every tile into 2×2 sub-tiles. A building
 * blocks its footprint except `max(1, Width − BuildingW)` sub-tiles along each edge, so adjacent
 * buildings leave a walkable lane between them. Width-1 objects block their whole tile; in this
 * engine walls stay passable at a breaking cost, exactly as on the legacy tile grid.
 */
export const SUBTILES = 2;
const SIZE = MAP_SIZE * SUBTILES;
const CELLS = SIZE * SIZE;

/** `LogicBuilding.PassableSubtilesAtEdge`; every native campaign building except the cave uses 1. */
export function passableSubtilesAtEdge(b: Pick<Building, 'kind' | 'npc'>) {
  if (b.kind === 'wall') return 0;
  // max(1, Width − BuildingW) from the client's own tables: the Army Camp and the Foreboding
  // Cave (a Camp in the source) are the only families whose collision core is two sub-tiles
  // narrower than their footprint on each side.
  return b.kind === 'camp' ? 2 : 1;
}

/**
 * Exact snapshot of what collision reads from a building list: each entry's identity,
 * footprint (kind, npc, position) and whether it stands. Two lists match only when every
 * entry matches, so a cached grid can never serve another battle's (or stage's) layout.
 * The previous 32-bit hash of ids and alive flags collided across campaign stages of the
 * same size (ids are 1000 + index), routing a new battle through the last one's buildings.
 */
export class BuildingListSnapshot {
  private refs: Building[];
  private kinds: string[];
  private npcs: (string | undefined)[];
  private coords: Float64Array;
  private alive: Uint8Array;
  constructor(buildings: readonly Building[]) {
    const n = buildings.length;
    this.refs = buildings.slice();
    this.kinds = new Array(n);
    this.npcs = new Array(n);
    this.coords = new Float64Array(n * 2);
    this.alive = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const b = buildings[i];
      this.kinds[i] = b.kind;
      this.npcs[i] = b.npc;
      this.coords[i * 2] = b.x;
      this.coords[i * 2 + 1] = b.y;
      this.alive[i] = b.hp > 0 ? 1 : 0;
    }
  }
  /** The last array object fully verified against this snapshot. */
  private verified: readonly Building[] | null = null;
  matches(buildings: readonly Building[]) {
    const n = buildings.length;
    if (n !== this.refs.length) return false;
    const { refs, kinds, npcs, coords, alive } = this;
    if (buildings === this.verified) {
      // Same array, same length: the simulation never reassigns list slots or moves a
      // footprint, so only standing/fallen can have changed since it was verified.
      for (let i = 0; i < n; i++) if (alive[i] !== (buildings[i].hp > 0 ? 1 : 0)) return false;
      return true;
    }
    for (let i = 0; i < n; i++) {
      const b = buildings[i];
      if (
        refs[i] !== b ||
        alive[i] !== (b.hp > 0 ? 1 : 0) ||
        kinds[i] !== b.kind ||
        coords[i * 2] !== b.x ||
        coords[i * 2 + 1] !== b.y ||
        npcs[i] !== b.npc
      )
        return false;
    }
    this.verified = buildings;
    return true;
  }
}

/** Result memo bound: a grid rarely lives long, but a quiet battle must not grow without end. */
export const PATH_MEMO_LIMIT = 8192;

/** One collision grid built for an exact building list, with the routes searched on it. */
interface SubtileGrid {
  key: BuildingListSnapshot;
  blocked: Uint8Array;
  wall: Uint8Array;
  /** Exact search results by (start cell, goal, range): A* is a pure function of these. */
  paths: Map<string, readonly { x: number; y: number }[]>;
}
/**
 * Routes, crowd separation and movement effects alternate between a few lists every tick
 * (known, solid, jump-filtered, defender structures); each keeps its own grid instead of
 * rebuilding one shared grid whenever the caller changes. A rebuilt grid gets fresh arrays,
 * so a collision test captured earlier keeps reading the snapshot it was made from.
 */
const GRID_SLOTS = 6;
const grids: SubtileGrid[] = [];
/** Drop every cached grid and route (new battle or replay runner). Never needed for results. */
export function resetSubtileGrids() {
  grids.length = 0;
}
/** Collision for the living, non-trap buildings the caller knows about. */
function gridFor(buildings: readonly Building[]): SubtileGrid {
  for (let i = 0; i < grids.length; i++) {
    const grid = grids[i];
    if (!grid.key.matches(buildings)) continue;
    if (i) {
      grids.splice(i, 1);
      grids.unshift(grid);
    }
    return grid;
  }
  const blocked = new Uint8Array(CELLS),
    wall = new Uint8Array(CELLS);
  for (const b of buildings) {
    if (b.hp <= 0 || isTrap(b.kind)) continue;
    const size = BUILDINGS[b.kind].size * SUBTILES;
    const edge = size === SUBTILES ? 0 : passableSubtilesAtEdge(b);
    const target = b.kind === 'wall' ? wall : blocked;
    for (let y = b.y * SUBTILES + edge; y < b.y * SUBTILES + size - edge; y++)
      for (let x = b.x * SUBTILES + edge; x < b.x * SUBTILES + size - edge; x++)
        target[y * SIZE + x] = 1;
  }
  const grid: SubtileGrid = {
    key: new BuildingListSnapshot(buildings),
    blocked,
    wall,
    paths: new Map(),
  };
  grids.unshift(grid);
  if (grids.length > GRID_SLOTS) grids.pop();
  return grid;
}
/** The grid the current search reads (set at the start of every search). */
let blocked: Uint8Array = new Uint8Array(CELLS),
  wall: Uint8Array = new Uint8Array(CELLS);

/**
 * Point collision for ground movement (crowd separation, pushback, vortex pulls): any
 * standing non-trap footprint sub-tile, walls included. Shares the route grid for the list.
 */
export function subtileSolid(buildings: readonly Building[]) {
  const grid = gridFor(buildings);
  const solidBlocked = grid.blocked,
    solidWall = grid.wall;
  return (x: number, y: number) => {
    const n = Math.floor(y * SUBTILES) * SIZE + Math.floor(x * SUBTILES);
    // Out-of-grid indices read undefined: not solid, exactly like the old Set lookup.
    return solidBlocked[n] === 1 || solidWall[n] === 1;
  };
}

// Reused search buffers: pathfinding is synchronous and each call resets what it reads.
// Search state uses a generation stamp: one counter bump replaces five full-array fills.
const cost = new Float64Array(CELLS),
  prev = new Int32Array(CELLS),
  closed = new Uint8Array(CELLS),
  priority = new Float64Array(CELLS),
  heuristic = new Float64Array(CELLS),
  order = new Uint32Array(CELLS),
  position = new Int32Array(CELLS),
  stamp = new Uint32Array(CELLS);
let epoch = 0;

/** Heap storage reused across searches (synchronous, no reentrancy). */
const openHeap = new Int32Array(CELLS);

const distanceTo = (u: { x: number; y: number }, b: Building | { x: number; y: number }) => {
  const s = 'kind' in b && b.kind in BUILDINGS ? BUILDINGS[(b as Building).kind].size : 0;
  return distance2D(Math.max(b.x - u.x, 0, u.x - b.x - s), Math.max(b.y - u.y, 0, u.y - b.y - s));
};

/** `LogicPathFinderNew.IsLineOfSightClearImpl`: a 4-connected sub-tile walk; walls collide. */
function sightLine(xA: number, yA: number, xB: number, yB: number) {
  const directionX = xB > xA ? 1 : -1,
    directionY = yB > yA ? 1 : -1,
    distanceX = Math.abs(xB - xA),
    distanceY = Math.abs(yB - yA);
  let direction = distanceX - distanceY;
  for (let i = distanceX + distanceY, x = xA, y = yA; i >= 0; i--) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || blocked[y * SIZE + x] || wall[y * SIZE + x])
      return false;
    if (direction > 0) {
      direction -= distanceY * 2;
      x += directionX;
    } else {
      direction += distanceX * 2;
      y += directionY;
    }
  }
  return true;
}

/** `LogicPathFinderNew.IsLineOfSightClear`: the sight line and both lines one sub-tile over. */
function lineOfSight(xA: number, yA: number, xB: number, yB: number) {
  const directionX = Math.sign(xB - xA),
    directionY = Math.sign(yB - yA);
  return (
    sightLine(xA, yA, xB, yB) &&
    sightLine(xA + directionX, yA, xB, yB - directionY) &&
    sightLine(xA, yA + directionY, xB - directionX, yB)
  );
}

/**
 * The legacy A* (stable heap, first-in ties, wall break-through cost, in-range goal and short
 * melee approach) on sub-tiles. Costs stay in tile units: a step is half a tile and crossing a
 * wall tile costs the same seven tiles as before. When the client's sight-line test between the
 * start and goal sub-tiles is clear, the route is the goal point alone.
 */
export function findSubtilePath(
  start: { x: number; y: number },
  target: Building | { x: number; y: number },
  buildings: readonly Building[],
  range: number,
): { x: number; y: number }[] {
  const grid = gridFor(buildings);
  blocked = grid.blocked;
  wall = grid.wall;
  const sx = Math.max(0, Math.min(SIZE - 1, Math.floor(start.x * SUBTILES))),
    sy = Math.max(0, Math.min(SIZE - 1, Math.floor(start.y * SUBTILES))),
    first = sy * SIZE + sx;
  const goalSize = 'kind' in target && target.kind in BUILDINGS ? BUILDINGS[target.kind].size : 0;
  // The start point matters only through its cell and whether it is already in range.
  const far = distanceTo(start, target) > range;
  const key = `${first},${target.x},${target.y},${goalSize},${range},${far ? 1 : 0}`;
  const known = grid.paths.get(key);
  if (known) return copyPath(known);
  const path = searchSubtilePath(first, sx, sy, target, goalSize, range, far);
  if (grid.paths.size >= PATH_MEMO_LIMIT) grid.paths.clear();
  grid.paths.set(key, copyPath(path));
  return path;
}
/** Waypoints are fresh objects per caller: units shift and compare them by identity. */
function copyPath(path: readonly { x: number; y: number }[]) {
  const copy = new Array<{ x: number; y: number }>(path.length);
  for (let i = 0; i < path.length; i++) copy[i] = { x: path[i].x, y: path[i].y };
  return copy;
}
function searchSubtilePath(
  first: number,
  sx: number,
  sy: number,
  target: Building | { x: number; y: number },
  goalSize: number,
  range: number,
  far: boolean,
): { x: number; y: number }[] {
  if (epoch === 0xffffffff) {
    stamp.fill(0);
    epoch = 0;
  }
  const generation = ++epoch;
  // The search below is the original closure-based A* with its helpers inlined: the same
  // arithmetic in the same order, the same stable heap (priority, then insertion order).
  const heap = openHeap;
  let size = 0;
  let sequence = 0;
  const targetX = target.x,
    targetY = target.y;
  const step = 1 / SUBTILES;
  stamp[first] = generation;
  closed[first] = 0;
  prev[first] = -1;
  cost[first] = 0;
  {
    const hx = ((first % SIZE) + 0.5) / SUBTILES,
      hy = (Math.floor(first / SIZE) + 0.5) / SUBTILES;
    heuristic[first] = distance2D(
      Math.max(targetX - hx, 0, hx - targetX - goalSize),
      Math.max(targetY - hy, 0, hy - targetY - goalSize),
    );
  }
  priority[first] = cost[first] + heuristic[first];
  order[first] = sequence++;
  heap[size++] = first;
  position[first] = 0;
  let goal = -1;
  let approach: { x: number; y: number } | undefined;
  while (size) {
    // take(): pop the root, sift the last entry down.
    const current = heap[0];
    const last = heap[--size];
    position[current] = -1;
    if (size) {
      const lastPriority = priority[last],
        lastOrder = order[last];
      let at = 0;
      while (at * 2 + 1 < size) {
        let child = at * 2 + 1;
        if (child + 1 < size) {
          const right = heap[child + 1],
            left = heap[child];
          if (
            priority[right] < priority[left] ||
            (priority[right] === priority[left] && order[right] < order[left])
          )
            child++;
        }
        const node = heap[child];
        if (!(
          priority[node] < lastPriority ||
          (priority[node] === lastPriority && order[node] < lastOrder)
        ))
          break;
        heap[at] = node;
        position[node] = at;
        at = child;
      }
      heap[at] = last;
      position[last] = at;
    }
    closed[current] = 1;
    const x = current % SIZE,
      y = Math.floor(current / SIZE),
      hx = (x + 0.5) / SUBTILES,
      hy = (y + 0.5) / SUBTILES;
    // heuristic[current] is distGoal(hx, hy), computed when the node was queued.
    if (heuristic[current] <= range) {
      if (current === first && far) approach = { x: hx, y: hy };
      goal = current;
      break;
    }
    if (range < 0.5 && !blocked[current]) {
      const s = goalSize;
      const tx = Math.max(targetX, Math.min(hx, targetX + s));
      const ty = Math.max(targetY, Math.min(hy, targetY + s));
      const dx = hx - tx,
        dy = hy - ty,
        distance = distance2D(dx, dy);
      if (distance <= 1e-9) {
        goal = current;
        break;
      }
      const reach = Math.max(0, range - 1e-6);
      const point = { x: tx + (dx * reach) / distance, y: ty + (dy * reach) / distance };
      if (Math.floor(point.x * SUBTILES) === x && Math.floor(point.y * SUBTILES) === y) {
        approach = point;
        goal = current;
        break;
      }
    }
    const base = cost[current];
    // Neighbours in the original DIRS order: +x, -x, +y, -y.
    for (let d = 0; d < 4; d++) {
      let nx = x,
        ny = y;
      if (d === 0) nx++;
      else if (d === 1) nx--;
      else if (d === 2) ny++;
      else ny--;
      if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
      const n = ny * SIZE + nx;
      if (blocked[n]) continue;
      if (stamp[n] !== generation) {
        stamp[n] = generation;
        cost[n] = Infinity;
        prev[n] = -1;
        closed[n] = 0;
        heuristic[n] = NaN;
        position[n] = -1;
      } else if (closed[n]) continue;
      const next = base + step + (wall[n] ? 6 * step : 0);
      if (next < cost[n]) {
        cost[n] = next;
        prev[n] = current;
        // queue(n): score, then insert or decrease-key with a sift up.
        if (Number.isNaN(heuristic[n])) {
          const cx = (nx + 0.5) / SUBTILES,
            cy = (ny + 0.5) / SUBTILES;
          heuristic[n] = distance2D(
            Math.max(targetX - cx, 0, cx - targetX - goalSize),
            Math.max(targetY - cy, 0, cy - targetY - goalSize),
          );
        }
        const score = next + heuristic[n];
        priority[n] = score;
        let at = position[n];
        if (at < 0) {
          at = size++;
          order[n] = sequence++;
        }
        const nodeOrder = order[n];
        while (at > 0) {
          const parent = (at - 1) >> 1;
          const above = heap[parent];
          if (!(score < priority[above] || (score === priority[above] && nodeOrder < order[above])))
            break;
          heap[at] = above;
          position[above] = at;
          at = parent;
        }
        heap[at] = n;
        position[n] = at;
      }
    }
  }
  const centerX = (node: number) => ((node % SIZE) + 0.5) / SUBTILES;
  const centerY = (node: number) => (Math.floor(node / SIZE) + 0.5) / SUBTILES;
  if (goal < 0) return [];
  // `LogicPathFinderNew.FindPath`: a clear sight line replaces the searched route with a single
  // straight walk to its end point, so open ground is crossed directly rather than in steps.
  const goalPoint = { x: centerX(goal), y: centerY(goal) };
  if (goal !== first && lineOfSight(sx, sy, goal % SIZE, Math.floor(goal / SIZE)))
    return [approach ?? goalPoint];
  const path = [];
  while (goal !== first && goal >= 0) {
    path.push({ x: centerX(goal), y: centerY(goal) });
    goal = prev[goal];
  }
  path.reverse();
  if (approach) path.push(approach);
  return path;
}

/**
 * Ground collision cells for movement effects (vortex carry, pushback). Version-44 native
 * campaign battles use sub-tile building collision; every other battle keeps whole-tile
 * footprints. `cell` identifies the collision cell so a unit already inside one may leave it.
 */
export function groundCollision(battle: { nativeSubtiles?: true }, buildings: readonly Building[]) {
  if (battle.nativeSubtiles) {
    const solid = subtileSolid(buildings);
    return {
      cell: (x: number, y: number) => Math.floor(y * SUBTILES) * SIZE + Math.floor(x * SUBTILES),
      solid,
    };
  }
  const tiles = new Set<number>();
  for (const b of buildings)
    if (b.hp > 0 && !isTrap(b.kind)) {
      const size = BUILDINGS[b.kind].size;
      for (let x = b.x; x < b.x + size; x++)
        for (let y = b.y; y < b.y + size; y++) tiles.add(y * MAP_SIZE + x);
    }
  const cell = (x: number, y: number) => Math.floor(y) * MAP_SIZE + Math.floor(x);
  return { cell, solid: (x: number, y: number) => tiles.has(cell(x, y)) };
}
export type GroundCollision = ReturnType<typeof groundCollision>;
