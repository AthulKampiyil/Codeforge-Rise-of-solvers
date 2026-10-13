import type { Battle, Building, Unit } from './model';
import type { Defender } from './defenders';

/**
 * Id lookups shared by presentation layers within one rendered frame. Each index is rebuilt at
 * most once per simulation step (keyed by the array, its length and the battle clock), so a
 * render pass never pays a linear `find` per lookup and never reads a stale entry after a step.
 * Read-only: nothing here mutates the battle or feeds back into the simulation.
 */
interface Entry<T> {
  length: number;
  elapsed: number;
  map: Map<number, T>;
}
const caches = new WeakMap<object, Entry<unknown>>();
const EMPTY: Defender[] = [];

function index<T extends { id: number }>(list: readonly T[], elapsed: number): Map<number, T> {
  const hit = caches.get(list) as Entry<T> | undefined;
  if (hit && hit.length === list.length && hit.elapsed === elapsed) return hit.map;
  const map = hit?.map ?? new Map<number, T>();
  map.clear();
  // First occurrence wins, as with Array.prototype.find.
  for (const item of list) if (!map.has(item.id)) map.set(item.id, item);
  caches.set(list, { length: list.length, elapsed, map });
  return map;
}

export const buildingIndex = (battle: Pick<Battle, 'buildings' | 'elapsed'>) =>
  index<Building>(battle.buildings, battle.elapsed);
export const unitIndex = (battle: Pick<Battle, 'units' | 'elapsed'>) =>
  index<Unit>(battle.units, battle.elapsed);
export const defenderIndex = (battle: Pick<Battle, 'defenders' | 'elapsed'>) =>
  index<Defender>(battle.defenders ?? EMPTY, battle.elapsed);

/** The battle unit with this id (any state), or undefined. */
export function battleUnit(
  battle: Pick<Battle, 'units' | 'elapsed'>,
  id: number | null | undefined,
): Unit | undefined {
  return id === null || id === undefined ? undefined : unitIndex(battle).get(id);
}
/** The battle building with this id, or undefined. */
export function battleBuilding(
  battle: Pick<Battle, 'buildings' | 'elapsed'>,
  id: number | null | undefined,
): Building | undefined {
  return id === null || id === undefined ? undefined : buildingIndex(battle).get(id);
}
/** The unit a defense currently targets, as `battle.defenseTargets` records it. */
export const battleDefenseTarget = (
  battle: Pick<Battle, 'units' | 'elapsed' | 'defenseTargets'>,
  towerId: number,
) => battleUnit(battle, battle.defenseTargets[towerId]);
