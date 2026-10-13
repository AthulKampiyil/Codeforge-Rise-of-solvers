import type { BuildingKind } from './data';
import { CRAFTING_STATION } from './crafted-defenses';
import { SOURCE_NAME, sourceCeiling, sourceCount, TOWNHALL_TIERS } from './townhall-catalog';
import { EXTRA_BUILDING_KINDS } from './extra-buildings';
import nativeProgressionSource from '../../reference/full-client/progression.json' with { type: 'json' };
const nativeProgression = nativeProgressionSource as unknown as {
  buildings: Record<string, (typeof nativeProgressionSource.buildings)['townhall']>;
};

/** Highest Town Hall this game's home village offers. */
export const MAX_TOWNHALL = TOWNHALL_TIERS.length;
const TIERS = Array.from({ length: MAX_TOWNHALL }, (_, index) => index + 1);

/**
 * Counts this game permits where they differ from the original tier column, for Town Hall 1
 * through 9. Every one has converged on the original by Town Hall 9, so the later tiers come
 * straight from the source.
 */
const LOCAL_COUNTS: Partial<Record<BuildingKind, readonly number[]>> = {
  // A starter village opens with two Cannons, one ahead of the original first tier.
  cannon: [2, 2, 2, 2, 3, 3, 5, 5, 5],
  goldmine: [2, 3, 4, 5, 6, 7, 7, 7, 7],
  collector: [2, 3, 4, 5, 6, 7, 7, 7, 7],
  goldstorage: [1, 2, 2, 3, 3, 4, 4, 4, 4],
  elixirstorage: [1, 2, 2, 3, 3, 4, 4, 4, 4],
};

/**
 * Ceilings this game stops below, with the reason each is short of the original. A level of
 * zero withholds the building outright. Every gap is asserted in tests/townhall-tiers.test.ts
 * so it can neither close nor widen unnoticed.
 */
export const WITHHELD: Partial<Record<BuildingKind, { level: number; why: string }>> = {
  builder: { level: 4, why: 'only four hut tiers have reconstructed artwork and a turret' },
};

const HOME_KINDS = Object.keys(SOURCE_NAME) as BuildingKind[];

function tierColumns(kind: BuildingKind) {
  const name = SOURCE_NAME[kind]!;
  const withheld = WITHHELD[kind];
  // The Town Hall is never a counted column: a village always has exactly one.
  if (name === 'Town Hall')
    return { counts: TIERS.map(() => 1), levels: TIERS.map(() => MAX_TOWNHALL) };
  if (withheld?.level === 0) return { counts: TIERS.map(() => 0), levels: TIERS.map(() => 0) };
  const local = LOCAL_COUNTS[kind];
  const counts = TIERS.map((townhall) =>
    local && townhall <= local.length ? local[townhall - 1] : sourceCount(name, townhall),
  );
  // A tier that permits none of a building has nothing to upgrade, so its ceiling is zero.
  const levels = TIERS.map((townhall, index) =>
    counts[index] === 0
      ? 0
      : Math.min(withheld?.level ?? Number.MAX_SAFE_INTEGER, sourceCeiling(name, townhall)),
  );
  // And the reverse: a tier that permits no level of a building permits none of it. The
  // Clan Castle is counted from Town Hall 1 but has no level until Town Hall 3.
  return { counts: counts.map((count, index) => (levels[index] === 0 ? 0 : count)), levels };
}

/** Maximum count of each building at Town Hall 1..MAX_TOWNHALL, indexed from zero. */
export const BUILDING_COUNTS = {} as Record<BuildingKind, readonly number[]>;
/** Upgrade ceiling of each building at Town Hall 1..MAX_TOWNHALL, indexed from zero. */
export const BUILDING_LEVELS = {} as Record<BuildingKind, readonly number[]>;
for (const kind of HOME_KINDS) {
  const { counts, levels } = tierColumns(kind);
  BUILDING_COUNTS[kind] = counts;
  BUILDING_LEVELS[kind] = levels;
}
// The Crafting Station has no progression row: client townhall_levels counts one only at
// Town Hall 18 (the live game's Town Hall 11 access came after the pinned client).
{
  const station = Array.from({ length: MAX_TOWNHALL }, (_, i) =>
    i + 1 >= CRAFTING_STATION.townHall ? 1 : 0,
  );
  BUILDING_COUNTS.craftingstation = station;
  BUILDING_LEVELS.craftingstation = station;
}
// The Helper Hut has no progression row either; client townhall_levels counts one from Town
// Hall 9, and it has a single building level.
{
  const hut = Array.from({ length: MAX_TOWNHALL }, (_, i) => (i + 1 >= 9 ? 1 : 0));
  BUILDING_COUNTS.helperhut = hut;
  BUILDING_LEVELS.helperhut = hut;
}
// The families the native roster added carry their own tier columns from the client, which
// already state a count and a ceiling for each of the eighteen Town Halls.
for (const kind of EXTRA_BUILDING_KINDS) {
  const family = nativeProgression.buildings[kind];
  BUILDING_COUNTS[kind] = family.counts.slice(0, MAX_TOWNHALL);
  BUILDING_LEVELS[kind] = family.counts
    .slice(0, MAX_TOWNHALL)
    .map((count, index) =>
      count === 0 ? 0 : family.levels.filter((row) => row.townhall <= index + 1).length,
    );
}
