import { buildingHp, type BuildingKind } from './data';
import { craftedStats, type CraftedKind, type ModuleLevels } from './crafted-defenses';
import {
  durationSeconds,
  list,
  nativeSupercharges,
  num,
  text,
  type NativeRow,
} from './native-data';

/**
 * Supercharges (client mini_levels.csv linked through buildings.csv MiniLevels). Charges are only
 * available at a building's maximum level; their bonuses are cumulative because each charge row
 * inherits the previous one: DPS (also added to Alt DPS), Inferno ramp DPS, hitpoints, collector
 * production and capacity, and Revenge Tower ability levels. Scattershot's
 * ProjectileSpellDamageBoost has no effect on the official wiki's splash values and is not applied.
 * The Monolith and Builder's Hut charges the wiki lists from August 31, 2026 are newer than
 * client 18.400.21 (their mini rows are unlinked) and are not offered.
 */
export const SUPERCHARGE_SOURCE: Partial<Record<BuildingKind, string>> = {
  goldmine: 'Gold Mine',
  collector: 'Elixir Collector',
  darkdrill: 'Dark Elixir Drill',
  mortar: 'Mortar',
  airdefense: 'Air Defense',
  tesla: 'Hidden Tesla',
  bombtower: 'Bomb Tower',
  xbow: 'X-Bow',
  inferno: 'Inferno Tower',
  scattershot: 'Scattershot',
  multiarchertower: 'Multi Archer Tower',
  ricochetcannon: 'Ricochet Cannon',
  multigeartower: 'Multi Gear Tower',
  firespitter: 'Firespitter',
  revengetower: 'Revenge Tower',
  superwizardtower: 'Super Wizard Tower',
};
const rows = (kind: BuildingKind): readonly NativeRow[] =>
  SUPERCHARGE_SOURCE[kind] ? nativeSupercharges(SUPERCHARGE_SOURCE[kind]!) : [];
export const superchargeCount = (kind: BuildingKind) => rows(kind).length;

export interface SuperchargeBonus {
  dps: number;
  dpsLv2: number;
  dpsLv3: number;
  hp: number;
  /** Extra production per hour and storage for collectors. */
  production: number;
  capacity: number;
  /** Level offsets for each special ability in declaration order. */
  abilityLevels: number[];
}
const NONE: SuperchargeBonus = Object.freeze({
  dps: 0,
  dpsLv2: 0,
  dpsLv3: 0,
  hp: 0,
  production: 0,
  capacity: 0,
  abilityLevels: [],
}) as SuperchargeBonus;
export function superchargeBonus(kind: BuildingKind, charges = 0): SuperchargeBonus {
  if (!charges) return NONE;
  const row = rows(kind)[Math.min(charges, superchargeCount(kind)) - 1];
  if (!row) return NONE;
  return {
    dps: num(row, 'DPS'),
    dpsLv2: num(row, 'DPSLv2'),
    dpsLv3: num(row, 'DPSLv3'),
    hp: num(row, 'Hitpoints'),
    production: num(row, 'ResourcePer100Hours') / 100,
    capacity: num(row, 'ResourceMax'),
    abilityLevels: list(row, 'SpecialAbilityLevelBuff').map(Number),
  };
}
/** Price, time and Town Hall requirement of the next charge, or null when fully charged. */
export function superchargeQuote(kind: BuildingKind, charges = 0) {
  const row = rows(kind)[charges];
  if (!row) return null;
  return {
    charge: charges + 1,
    cost: num(row, 'BuildCost'),
    seconds: durationSeconds(row, 'BuildTime'),
    resource: ({ Gold: 'gold', Elixir: 'elixir', DarkElixir: 'dark' } as const)[
      text(row, 'BuildResource') as 'Gold'
    ],
    townhall: num(row, 'RequiredTownHallLevel'),
  };
}

/** Stored maximum hitpoints: the level's value plus supercharge hitpoints. */
export const buildingMaxHp = (b: {
  kind: BuildingKind;
  level: number;
  supercharge?: number;
  crafted?: CraftedKind;
  craftedModules?: Partial<Record<CraftedKind, ModuleLevels>>;
}) =>
  // A Crafting Station takes its chosen defense's hitpoints module.
  b.kind === 'craftingstation' && b.crafted
    ? craftedStats(b.crafted, b.craftedModules?.[b.crafted] ?? [1, 1, 1]).hp
    : buildingHp(b.kind, b.level) + superchargeBonus(b.kind, b.supercharge).hp;
