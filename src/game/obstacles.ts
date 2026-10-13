import catalog from '../../reference/obstacles/catalog.json' with { type: 'json' };
import { MAP_SIZE, gridSize, footprintSize, SAVE_VERSION, type GridVersion } from './grid';
import { BUILDINGS } from './data';
import type { Building } from './model';

// Regular-obstacle reward cycle; provenance and tutorial differences: docs/OBSTACLES.md.
export const OBSTACLE_GEMS = [6, 0, 4, 5, 1, 3, 2, 0, 0, 5, 1, 0, 3, 4, 0, 0, 5, 0, 1, 0] as const;

export interface ObstacleDef {
  name: string;
  size: number;
  resource: 'gold' | 'elixir' | 'dark';
  cost: number;
  seconds: number;
  /** What clearing pays: gems from the reward cycle, or `lootCount` of a resource. */
  loot?: 'gold' | 'elixir' | 'dark' | 'gems';
  lootCount?: number;
  /** Share of regrowth (the client's RespawnWeight); zero never regrows. */
  regrowWeight: number;
  /** The Gem Box's schedule: one per period, and not sooner than this after clearing. */
  appearanceHours?: number;
  minRespawnHours?: number;
  art: { path: string; width: number; height: number; originX: number; originY: number };
  texture: string;
}
/**
 * The client's Home Village obstacles (reference/obstacles, logic/obstacles.csv): the eight
 * kinds that regrow, the stones a new village starts with and the Gem Box. `trees` and `rocks`
 * are the Pine Tree and Small Stone that older saves name by their earlier keys.
 */
const IMPORTED = Object.fromEntries(
  catalog.obstacles.map((o) => [o.id, { ...o, texture: `obstacle-${o.id}` } as ObstacleDef]),
);
export const OBSTACLES: Record<string, ObstacleDef> = {
  ...IMPORTED,
  trees: IMPORTED['pine-tree'],
  rocks: IMPORTED['small-stone-1'],
};
export type ObstacleKind = string;
export const GEM_BOX = 'bonus-gembox';
/** Kinds that regrow, with the client's weights. */
export const REGROWTH = catalog.obstacles
  .filter((o) => o.regrowWeight > 0)
  .map((o) => ({ kind: o.id, weight: o.regrowWeight, size: o.size }));
export const GEM_BOX_PERIOD = OBSTACLES[GEM_BOX].appearanceHours! * 3600000;
export const GEM_BOX_MIN_RESPAWN = OBSTACLES[GEM_BOX].minRespawnHours! * 3600000;
export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number;
  removeStart?: number;
  removeEnd?: number;
  /** A Shovel of Obstacles made it movable, for good. */
  movable?: true;
}
export function overlapsObstacle(
  obstacles: readonly Obstacle[],
  x: number,
  y: number,
  size: number,
) {
  return obstacles.some(
    (o) =>
      x < o.x + OBSTACLES[o.kind].size &&
      x + size > o.x &&
      y < o.y + OBSTACLES[o.kind].size &&
      y + size > o.y,
  );
}
export function initialObstacles(buildings: readonly Building[]): Obstacle[] {
  return (
    [
      // A mix of the client's 2×2 vegetation and stones, where the first village had trees
      // and rocks.
      ['pine-tree', 2, 2],
      ['square-bush', 0, 12],
      ['fallen-tree', 22, 3],
      ['pine-tree', 24, 23],
      ['mushrooms', 2, 24],
      ['small-stone-1', 1, 17],
      ['small-stone-2', 22, 1],
      ['small-stone-3', 23, 19],
    ] as const
  )
    .map(([kind, x, y], i) => ({ id: i + 1, kind, x, y }))
    .filter((o) => !buildings.some((b) => overlapsObstacle([o], b.x, b.y, BUILDINGS[b.kind].size)));
}
export function validObstacles(
  value: unknown,
  buildings: readonly Building[],
  version: GridVersion = SAVE_VERSION,
): value is Obstacle[] {
  if (!Array.isArray(value) || value.length > OBSTACLE_LIMIT) return false;
  const ids = new Set<number>();
  for (const o of value) {
    if (
      !o ||
      !Object.hasOwn(OBSTACLES, o.kind) ||
      !Number.isSafeInteger(o.id) ||
      o.id < 1 ||
      o.id >= Number.MAX_SAFE_INTEGER ||
      ids.has(o.id) ||
      !Number.isInteger(o.x) ||
      !Number.isInteger(o.y) ||
      o.x < 0 ||
      o.y < 0 ||
      o.x + OBSTACLES[o.kind].size > gridSize(version) ||
      o.y + OBSTACLES[o.kind].size > gridSize(version) ||
      (o.movable !== undefined && o.movable !== true)
    )
      return false;
    if (o.removeEnd !== undefined || o.removeStart !== undefined) {
      if (
        !Number.isFinite(o.removeStart) ||
        !Number.isFinite(o.removeEnd) ||
        o.removeStart < 0 ||
        o.removeEnd <= o.removeStart ||
        o.removeEnd - o.removeStart > OBSTACLES[o.kind].seconds * 1000
      )
        return false;
    }
    if (
      buildings.some((b) =>
        overlapsObstacle([o], b.x, b.y, footprintSize(b.kind, BUILDINGS[b.kind].size, version)),
      )
    )
      return false;
    if (
      overlapsObstacle(
        value.filter((other) => other !== o && ids.has(other?.id)),
        o.x,
        o.y,
        OBSTACLES[o.kind].size,
      )
    )
      return false;
    ids.add(o.id);
  }
  return true;
}

export const OBSTACLE_GROWTH_INTERVAL = 8 * 3600000;
export const OBSTACLE_LIMIT = 45;
export interface ObstacleGrowth {
  nextAt: number;
  seed: number;
  nextId: number;
  /** When the next Gem Box may appear; absent in saves from before the Gem Box. */
  gemBoxAt?: number;
}

export function initialObstacleGrowth(obstacles: readonly Obstacle[], now: number): ObstacleGrowth {
  return {
    nextAt: Math.floor(now) + OBSTACLE_GROWTH_INTERVAL,
    seed: Math.floor(Math.random() * 0x100000000),
    nextId: Math.max(0, ...obstacles.map((o) => o.id)) + 1,
    gemBoxAt: Math.floor(now) + GEM_BOX_PERIOD,
  };
}

export function validObstacleGrowth(
  value: unknown,
  obstacles: readonly Obstacle[],
): value is ObstacleGrowth {
  if (!value || typeof value !== 'object') return false;
  const g = value as ObstacleGrowth;
  return (
    Number.isSafeInteger(g.nextAt) &&
    g.nextAt > 0 &&
    g.nextAt <= Number.MAX_SAFE_INTEGER - OBSTACLE_GROWTH_INTERVAL &&
    Number.isInteger(g.seed) &&
    g.seed >= 0 &&
    g.seed <= 0xffffffff &&
    Number.isSafeInteger(g.nextId) &&
    g.nextId > 0 &&
    obstacles.every((o) => o.id < g.nextId) &&
    (g.gemBoxAt === undefined ||
      (Number.isSafeInteger(g.gemBoxAt) &&
        g.gemBoxAt > 0 &&
        g.gemBoxAt <= Number.MAX_SAFE_INTEGER - GEM_BOX_PERIOD))
  );
}

/**
 * Free positions for a new obstacle of `size` tiles, a full tile from every building and
 * obstacle. The buffer is for natural growth only; players may build beside existing trees.
 */
export function treeGrowthSites(
  buildings: readonly Building[],
  obstacles: readonly Obstacle[],
  size = 2,
  /** Other footprints growth keeps its buffer from: the village's decorations. */
  blockers: readonly { x: number; y: number; size: number }[] = [],
) {
  const occupied = [
    ...buildings.map((b) => ({ x: b.x, y: b.y, size: BUILDINGS[b.kind].size })),
    ...obstacles.map((o) => ({ x: o.x, y: o.y, size: OBSTACLES[o.kind].size })),
    ...blockers,
  ];
  const sites: { x: number; y: number }[] = [];
  for (let y = 0; y <= MAP_SIZE - size; y++) {
    for (let x = 0; x <= MAP_SIZE - size; x++) {
      if (
        !occupied.some(
          (o) =>
            x < o.x + o.size + 1 &&
            x + size + 1 > o.x &&
            y < o.y + o.size + 1 &&
            y + size + 1 > o.y,
        )
      )
        sites.push({ x, y });
    }
  }
  return sites;
}
/** The persisted local PRNG; not a claim to reproduce Supercell's private spawn algorithm. */
const draw = (growth: ObstacleGrowth) => {
  growth.seed = (Math.imul(growth.seed, 1664525) + 1013904223) >>> 0;
  return growth.seed / 0x100000000;
};

/**
 * Settle home events in time order: removals, regrowth opportunities and Gem Box appearances.
 * Blocked intervals skip in O(1), even after years offline.
 */
export function advanceObstacles(
  obstacles: Obstacle[],
  buildings: readonly Building[],
  growth: ObstacleGrowth,
  now: number,
  blockers: readonly { x: number; y: number; size: number }[] = [],
) {
  const removed: Obstacle[] = [];
  const grown: Obstacle[] = [];
  const room = () => obstacles.length < OBSTACLE_LIMIT && growth.nextId < Number.MAX_SAFE_INTEGER;
  /** Moves a blocked schedule past `until` without banking the missed opportunities. */
  const skip = (at: number, period: number, until: number, inclusive: boolean) => {
    const periods = (until - at) / period;
    return at + (inclusive ? Math.floor(periods) + 1 : Math.ceil(periods)) * period;
  };
  const growUntil = (until: number, inclusive: boolean) => {
    const due = (at: number | undefined) =>
      at !== undefined && (inclusive ? at <= until : at < until);
    for (;;) {
      const box = due(growth.gemBoxAt),
        grow = due(growth.nextAt);
      if (!box && !grow) return;
      if (box && (!grow || growth.gemBoxAt! <= growth.nextAt)) {
        // One Gem Box at a time, once per period.
        const at = growth.gemBoxAt!;
        const sites =
          room() && !obstacles.some((o) => o.kind === GEM_BOX)
            ? treeGrowthSites(buildings, obstacles, OBSTACLES[GEM_BOX].size, blockers)
            : [];
        if (!sites.length) {
          growth.gemBoxAt = obstacles.some((o) => o.kind === GEM_BOX)
            ? at + GEM_BOX_PERIOD
            : skip(at, GEM_BOX_PERIOD, until, inclusive);
          continue;
        }
        const box: Obstacle = {
          id: growth.nextId++,
          kind: GEM_BOX,
          ...sites[Math.floor(draw(growth) * sites.length)],
        };
        obstacles.push(box);
        grown.push(box);
        growth.gemBoxAt = at + GEM_BOX_PERIOD;
        continue;
      }
      // A kind by the client's weights among those with room, then a free site for it.
      const options = room()
        ? REGROWTH.map((r) => ({
            ...r,
            sites: treeGrowthSites(buildings, obstacles, r.size, blockers),
          })).filter((r) => r.sites.length)
        : [];
      if (!options.length) {
        growth.nextAt = skip(growth.nextAt, OBSTACLE_GROWTH_INTERVAL, until, inclusive);
        continue;
      }
      let pick = draw(growth) * options.reduce((n, r) => n + r.weight, 0);
      const chosen = options.find((r) => (pick -= r.weight) < 0) ?? options.at(-1)!;
      const site = chosen.sites[Math.floor(draw(growth) * chosen.sites.length)];
      const plant: Obstacle = { id: growth.nextId++, kind: chosen.kind, ...site };
      obstacles.push(plant);
      grown.push(plant);
      growth.nextAt += OBSTACLE_GROWTH_INTERVAL;
    }
  };
  const completions = obstacles
    .filter((o) => o.removeEnd !== undefined && o.removeEnd <= now)
    .sort((a, b) => a.removeEnd! - b.removeEnd! || a.id - b.id);
  for (const o of completions) {
    growUntil(o.removeEnd!, false);
    obstacles.splice(obstacles.indexOf(o), 1);
    removed.push(o);
    // The next Gem Box waits at least a day after this one is cleared.
    if (o.kind === GEM_BOX && growth.gemBoxAt !== undefined)
      growth.gemBoxAt = Math.max(growth.gemBoxAt, o.removeEnd! + GEM_BOX_MIN_RESPAWN);
  }
  // Removals win ties, freeing their footprint for an opportunity at the same instant.
  growUntil(now, true);
  return { removed, grown };
}
