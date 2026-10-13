import type { BuildingKind } from './data';
import {
  durationSeconds,
  nativeLevelCount,
  nativeRow,
  nativeTownHall,
  num,
  text,
} from './native-data';

/**
 * Merged defenses and gear-ups from client 18.400.21 (buildings.csv MergeRequirement and GearUp*
 * columns, townhall_levels.csv `<Name>_gearup`). Rules follow the official wiki: merges consume
 * their inputs permanently, all merges available at a Town Hall must be finished before the next
 * Town Hall upgrade, and the Town Hall 17 upgrade itself merges the level 7 Eagle Artillery.
 */
const CLIENT_KIND: Record<string, BuildingKind> = {
  Cannon: 'cannon',
  'Archer Tower': 'archertower',
  Mortar: 'mortar',
  'Wizard Tower': 'wizardtower',
  'Eagle Artillery': 'eagleartillery',
};
const CLIENT_NAME: Partial<Record<BuildingKind, string>> = {
  cannon: 'Cannon',
  archertower: 'Archer Tower',
  mortar: 'Mortar',
  wizardtower: 'Wizard Tower',
  eagleartillery: 'Eagle Artillery',
  ricochetcannon: 'Ricochet Cannon',
  multiarchertower: 'Multi Archer Tower',
  multigeartower: 'Multi Gear Tower',
  superwizardtower: 'Super Wizard Tower',
};
export interface MergeInput {
  kind: BuildingKind;
  level: number;
  geared: boolean;
}
export const MERGED_KINDS = [
  'ricochetcannon',
  'multiarchertower',
  'multigeartower',
  'superwizardtower',
] as const;
export type MergedKind = (typeof MERGED_KINDS)[number];
export const isMergedKind = (kind: BuildingKind): kind is MergedKind =>
  (MERGED_KINDS as readonly string[]).includes(kind);

const parse = (value: string): MergeInput[] =>
  value
    .split(';')
    .filter(Boolean)
    .map((part) => {
      const [name, level, geared] = part.split(':');
      return { kind: CLIENT_KIND[name], level: Number(level), geared: geared === '1' };
    });
export const mergeInputs = (result: MergedKind) =>
  parse(text(nativeRow('buildings', CLIENT_NAME[result]!, 1), 'MergeRequirement'));
/** Buildings consumed by upgrading the Town Hall to `level` (Eagle Artillery at Town Hall 17). */
export const townHallMergeInputs = (level: number) =>
  level > 1 && level <= nativeLevelCount('buildings', 'Town Hall')
    ? parse(text(nativeRow('buildings', 'Town Hall', level), 'MergeRequirement'))
    : [];

/** Inputs no longer available as standalone buildings because merges consumed them. */
export function consumedByMerges(
  kind: BuildingKind,
  buildings: readonly { kind: BuildingKind }[],
  townhallLevel: number,
) {
  let consumed = 0;
  for (const result of MERGED_KINDS) {
    const merged = buildings.filter((b) => b.kind === result).length;
    if (merged) consumed += merged * mergeInputs(result).filter((i) => i.kind === kind).length;
  }
  for (let level = 2; level <= townhallLevel; level++)
    consumed += townHallMergeInputs(level).filter((i) => i.kind === kind).length;
  return consumed;
}

export const GEARABLE = ['cannon', 'archertower', 'mortar'] as const;
export type GearableKind = (typeof GEARABLE)[number];
export const isGearable = (kind: BuildingKind): kind is GearableKind =>
  (GEARABLE as readonly string[]).includes(kind);

/** Gear-up price and the first level that allows it; the limit comes from townhall_levels. */
export function gearUpQuote(kind: GearableKind) {
  const name = CLIENT_NAME[kind]!;
  for (let level = 1; level <= nativeLevelCount('buildings', name); level++) {
    const row = nativeRow('buildings', name, level);
    const cost = num(row, 'GearUpCost');
    if (!cost) continue;
    return {
      level,
      cost,
      seconds: num(row, 'GearUpTime') * 60,
      resource: ({ Gold: 'gold', Elixir: 'elixir', DarkElixir: 'dark' } as const)[
        text(row, 'GearUpResource') as 'Gold'
      ],
      limit: num(nativeTownHall(1), `${name}_gearup`, 1),
      builderBase: text(row, 'GearUpBuilding'),
    };
  }
  return null;
}
/** Seconds and price to build the merged defense (its level 1 row). */
export function mergeQuote(result: MergedKind) {
  const row = nativeRow('buildings', CLIENT_NAME[result]!, 1);
  return {
    cost: num(row, 'BuildCost'),
    seconds: durationSeconds(row, 'BuildTime'),
    resource: ({ Gold: 'gold', Elixir: 'elixir', DarkElixir: 'dark' } as const)[
      text(row, 'BuildResource') as 'Gold'
    ],
    townhall: num(row, 'TownHallLevel'),
  };
}
