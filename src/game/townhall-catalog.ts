import catalog from '../../reference/townhall/catalog.json' with { type: 'json' };
import type { BuildingKind } from './data';

/**
 * The pinned client's own Home Village tier tables. See reference/townhall/README.md.
 *
 * Prices, durations and the per-level rows below are original values. Hitpoints are original
 * for every entity whose table this reference owns outright; the eight buildings that never
 * had a source table in this game keep their local hitpoint curve so that recorded battles,
 * campaign results and destruction percentages are unaffected. See docs/TOWNHALL-TIERS.md.
 */
export interface SourceLevel {
  level: number;
  townhall: number;
  cost: number;
  resource: 'gold' | 'elixir' | 'dark' | 'gems';
  seconds: number;
  hp?: number;
  dps?: number;
  housing?: number;
  production?: number;
  storedGold?: number;
  storedElixir?: number;
  storedDark?: number;
  damage?: number;
  radius?: number;
  trigger?: number;
  eject?: number;
}

export const TOWNHALL_TIERS = catalog.townHalls;
export const TOWNHALL_GATES = catalog.gates as Readonly<Record<string, readonly number[]>>;
const LEVELS = catalog.levels as unknown as Readonly<Record<string, readonly SourceLevel[]>>;
export const KING_SOURCE = catalog.heroes.barbarianKing;
/** Gem price of the 2nd through 5th Builder's Hut; the first ships with the village. */
export const WORKER_GEMS = catalog.workers as readonly number[];
/** What the original grants a new village. Its gems were already this game's allowance. */
export const STARTING_GRANT = catalog.starting;

/** Original record name for every home kind the tier tables name. */
export const SOURCE_NAME: Partial<Record<BuildingKind, string>> = {
  townhall: 'Town Hall',
  camp: 'Army Camp',
  elixirstorage: 'Elixir Storage',
  goldstorage: 'Gold Storage',
  collector: 'Elixir Collector',
  goldmine: 'Gold Mine',
  barracks: 'Barracks',
  builder: 'Builders Hut',
  laboratory: 'Laboratory',
  spellfactory: 'Spell Factory',
  wall: 'Wall',
  herohall: 'Hero Hall',
  blacksmith: 'Blacksmith',
  clancastle: 'Clan Castle',
  cannon: 'Cannon',
  archertower: 'Archer Tower',
  mortar: 'Mortar',
  airdefense: 'Air Defense',
  wizardtower: 'Wizard Tower',
  tesla: 'Hidden Tesla',
  bombtower: 'Bomb Tower',
  xbow: 'X-Bow',
  airsweeper: 'Air Sweeper',
  darkdrill: 'Dark Elixir Drill',
  darkstorage: 'Dark Elixir Storage',
  inferno: 'Inferno Tower',
  eagleartillery: 'Eagle Artillery',
  scattershot: 'Scattershot',
  monolith: 'Monolith',
  spelltower: 'Spell Tower',
  tornadotrap: 'Tornado Trap',
  bomb: 'Bomb',
  springtrap: 'Spring Trap',
  airbomb: 'Air Bomb',
  giantbomb: 'Giant Bomb',
  seekingairmine: 'Seeking Air Mine',
  skeletontrap: 'Skeleton Trap',
};
/**
 * Original record names of the buildings the tier tables count but give no progression row:
 * one level each, tiered in tiers.ts.
 */
export const UNTIERED_SOURCE_NAME: Partial<Record<BuildingKind, string>> = {
  craftingstation: 'Crafting Station',
  helperhut: 'Helper Hut',
};

/** Complete original rows for an entity this reference tables, or undefined for the rest. */
export function sourceLevels(kind: BuildingKind): readonly SourceLevel[] | undefined {
  const name = SOURCE_NAME[kind];
  return name ? LEVELS[name] : undefined;
}
export const sourceLevel = (kind: BuildingKind, level: number) => sourceLevels(kind)?.[level - 1];

/** Rows of one tabled entity by its original name, for modules that own a shaped table. */
export const namedLevels = (name: string) => {
  const rows = LEVELS[name];
  if (!rows) throw new Error(`Untabled Town Hall entity: ${name}`);
  return rows;
};

/** Highest level an entity reaches at a Town Hall, straight from the original gate column. */
export function sourceCeiling(name: string, townhall: number) {
  const gates = TOWNHALL_GATES[name];
  if (!gates) throw new Error(`Ungated Town Hall entity: ${name}`);
  return gates.filter((required) => required <= townhall).length;
}
/** Permitted count of an entity at a Town Hall. The Town Hall is never a counted column. */
export function sourceCount(name: string, townhall: number) {
  const counts = TOWNHALL_TIERS[Math.min(TOWNHALL_TIERS.length, Math.max(1, townhall)) - 1]
    .counts as Record<string, number>;
  const value = counts[name];
  if (value === undefined) throw new Error(`Uncounted Town Hall entity: ${name}`);
  return value;
}
