import { BUILDINGS } from './data';
import {
  BUILD_MIN,
  BUILD_MAX,
  MAP_SIZE,
  gridSize,
  footprintSize,
  SAVE_VERSION,
  type GridVersion,
} from './grid';
import type { Building, Save } from './model';
import type { Obstacle } from './obstacles';

/** Reject overlapping input before any migration attempts to rearrange it. */
export function validArrangement(
  buildings: readonly Building[],
  obstacles: readonly Obstacle[] = [],
  version: GridVersion = SAVE_VERSION,
) {
  const side = gridSize(version);
  const occupied = new Uint8Array(side * side);
  const objects = [
    ...buildings.map((b) => ({
      ...b,
      size: footprintSize(b.kind, BUILDINGS[b.kind].size, version),
    })),
    ...obstacles.map((o) => ({ ...o, size: 2 })),
  ];
  for (const o of objects) {
    if (o.x < 0 || o.y < 0 || o.x + o.size > side || o.y + o.size > side) return false;
    for (let y = o.y; y < o.y + o.size; y++)
      for (let x = o.x; x < o.x + o.size; x++) {
        if (occupied[y * side + x]) return false;
        occupied[y * side + x] = 1;
      }
  }
  return true;
}

const spread = <T extends { x: number; y: number }>(o: T): T => ({
  ...o,
  x: Math.floor(o.x * 1.5) + BUILD_MIN,
  y: Math.floor(o.y * 1.5) + BUILD_MIN,
});

function occupancy() {
  const cells = new Uint8Array(MAP_SIZE * MAP_SIZE);
  return {
    occupy(x: number, y: number, size: number) {
      for (let yy = y; yy < y + size; yy++)
        for (let xx = x; xx < x + size; xx++) cells[yy * MAP_SIZE + xx] = 1;
    },
    free(x: number, y: number, size: number) {
      if (x < 0 || y < 0 || x + size > MAP_SIZE || y + size > MAP_SIZE) return false;
      for (let yy = y; yy < y + size; yy++)
        for (let xx = x; xx < x + size; xx++) if (cells[yy * MAP_SIZE + xx]) return false;
      return true;
    },
  };
}

/** Last resort for fragmented version-3 layouts. No object or purchased state is discarded. */
function pack(buildings: Building[], obstacles: Obstacle[]) {
  const placed = buildings.map((b) => ({ ...b }));
  const trees = obstacles.map((o) => ({ ...o }));
  const objects = [
    ...placed.map((b) => ({ object: b, size: BUILDINGS[b.kind].size, type: 0 })),
    ...trees.map((o) => ({ object: o, size: 2, type: 1 })),
  ].sort((a, b) => b.size - a.size || a.type - b.type || a.object.id - b.object.id);
  const grid = occupancy();
  for (const { object, size } of objects) {
    let found = false;
    for (let y = BUILD_MIN; y + size <= BUILD_MAX && !found; y++)
      for (let x = BUILD_MIN; x + size <= BUILD_MAX; x++) {
        if (!grid.free(x, y, size)) continue;
        object.x = x;
        object.y = y;
        grid.occupy(x, y, size);
        found = true;
        break;
      }
    if (!found) return undefined;
  }
  return { buildings: placed, obstacles: trees, spread: false };
}

/** Keep unchanged structures and obstacles fixed, then relocate conflicting expanded buildings. */
function arrange(buildings: Building[], obstacles: Obstacle[], version: GridVersion) {
  const placed = buildings.map((b) => ({ ...b }));
  const grid = occupancy();
  const expands = (b: Building) =>
    footprintSize(b.kind, BUILDINGS[b.kind].size, version) < BUILDINGS[b.kind].size;
  for (const b of placed) if (!expands(b)) grid.occupy(b.x, b.y, BUILDINGS[b.kind].size);
  for (const o of obstacles) grid.occupy(o.x, o.y, 2);
  const pending: Building[] = [];
  for (const b of placed.filter(expands).sort((a, b) => a.id - b.id)) {
    const size = BUILDINGS[b.kind].size;
    if (grid.free(b.x, b.y, size)) grid.occupy(b.x, b.y, size);
    else pending.push(b);
  }
  for (const b of pending) {
    const size = BUILDINGS[b.kind].size;
    const sites: { x: number; y: number; distance: number }[] = [];
    for (let y = BUILD_MIN; y + size <= BUILD_MAX; y++)
      for (let x = BUILD_MIN; x + size <= BUILD_MAX; x++)
        sites.push({ x, y, distance: Math.abs(x - b.x) + Math.abs(y - b.y) });
    sites.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
    const site = sites.find((s) => grid.free(s.x, s.y, size));
    if (!site) {
      // Every valid 28×28 arrangement fits at 1.5×, including 2→3 defenses and 3→4 camps/halls.
      if (version === 2)
        return { buildings: buildings.map(spread), obstacles: obstacles.map(spread), spread: true };
      return pack(buildings, obstacles);
    }
    b.x = site.x;
    b.y = site.y;
    grid.occupy(b.x, b.y, size);
  }
  return { buildings: placed, obstacles, spread: false };
}

/** Called after old fields and geometry are validated. Undefined leaves an unplaceable save untouched. */
export function migrateFootprints(save: Save, version: GridVersion) {
  const pickSlotModes = (slot?: {
    direction?: number;
    skeletonMode?: Building['skeletonMode'];
    xbowMode?: Building['xbowMode'];
    spellTowerWeapon?: Building['spellTowerWeapon'];
    infernoMode?: Building['infernoMode'];
  }) => ({
    ...(slot?.direction === undefined ? {} : { direction: slot.direction }),
    ...(slot?.skeletonMode === undefined ? {} : { skeletonMode: slot.skeletonMode }),
    ...(slot?.xbowMode === undefined ? {} : { xbowMode: slot.xbowMode }),
    ...(slot?.spellTowerWeapon === undefined ? {} : { spellTowerWeapon: slot.spellTowerWeapon }),
    ...(slot?.infernoMode === undefined ? {} : { infernoMode: slot.infernoMode }),
  });
  const original = save.buildings;
  const result = arrange(original, save.obstacles ?? [], version);
  if (!result || !validArrangement(result.buildings, result.obstacles)) return undefined;
  save.buildings = result.buildings;
  if (save.obstacles) save.obstacles = result.obstacles;
  for (const layout of save.layouts ?? []) {
    const slots = new Map(layout.slots.map((s) => [s.id, s]));
    const buildings = original.map((b) => ({ ...b, ...slots.get(b.id) }));
    if (buildings.every((b, i) => b.x === original[i].x && b.y === original[i].y)) {
      layout.slots = result.buildings.map(({ id, x, y }) => ({
        id,
        x,
        y,
        ...pickSlotModes(slots.get(id)),
      }));
      continue;
    }
    // Already blocked layouts retain their slots; the normal restore check explains the conflict.
    if (!validArrangement(buildings, [], version)) continue;
    if (!result.spread && !validArrangement(buildings, result.obstacles, version)) continue;
    const migrated = result.spread
      ? buildings.map(spread)
      : arrange(buildings, result.obstacles, version)?.buildings;
    if (migrated && validArrangement(migrated, result.obstacles))
      layout.slots = migrated.map(({ id, x, y, direction, skeletonMode, xbowMode, spellTowerWeapon, infernoMode }) => ({
        id,
        x,
        y,
        ...pickSlotModes({ direction, skeletonMode, xbowMode, spellTowerWeapon, infernoMode }),
      }));
  }
  return result.buildings.filter((b, i) => b.x !== original[i].x || b.y !== original[i].y).length;
}
