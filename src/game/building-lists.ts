import type { Battle, Building } from './model';

/**
 * Building sub-lists that depend only on the layout (kinds never change during a battle), cached
 * by the battle's list identity and length so every caller in a tick shares one array. Sharing
 * matters beyond the allocation: the collision grids recognize a list they have already
 * verified by identity, so a fresh `filter` per search forced a full rescan of the snapshot.
 */
interface Entry {
  buildings: Building[];
  length: number;
  nonWall: Building[];
}
const entries = new WeakMap<Battle, Entry>();

/** Every building except walls, in layout order (standing or not). */
export function nonWallBuildings(battle: Battle): Building[] {
  const known = entries.get(battle);
  if (known && known.buildings === battle.buildings && known.length === battle.buildings.length)
    return known.nonWall;
  const nonWall = battle.buildings.filter((b) => b.kind !== 'wall');
  entries.set(battle, { buildings: battle.buildings, length: battle.buildings.length, nonWall });
  return nonWall;
}
