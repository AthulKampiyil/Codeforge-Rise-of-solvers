import catalog from '../../reference/equipment/catalog.json' with { type: 'json' };

/** Pinned client 18.400.21 Blacksmith and King equipment. See reference/equipment/README.md. */
export const EQUIPMENT_KEYS = ['puppet', 'vial', 'boots'] as const;
export type EquipmentKind = (typeof EQUIPMENT_KEYS)[number];
export interface KingEquipment {
  levels: Record<EquipmentKind, number>;
  loadout: [EquipmentKind, EquipmentKind];
}
export const ORE_KEYS = ['shiny', 'glowy', 'starry'] as const;
export type OreKind = (typeof ORE_KEYS)[number];
export type Ores = Record<OreKind, number>;
export const BLACKSMITH_LEVELS = catalog.blacksmith;
export const BLACKSMITH_MAX_LEVEL = BLACKSMITH_LEVELS.length;
/** What a forge of each level stores. A village keeps ore it already holds regardless. */
export const oreCapacity = (blacksmith: number): Ores => {
  const row = BLACKSMITH_LEVELS[Math.min(BLACKSMITH_MAX_LEVEL, Math.max(1, blacksmith)) - 1];
  return { shiny: row.shiny, glowy: row.glowy, starry: row.starry };
};
/** The largest balance any forge can hold, for bounds that name no particular forge. */
export const ORE_CAP = oreCapacity(BLACKSMITH_MAX_LEVEL);
export const ORES = {
  shiny: { name: 'Shiny Ore', gems: 1 },
  glowy: { name: 'Glowy Ore', gems: 5 },
  starry: { name: 'Starry Ore', gems: 35 },
} as const;
export const emptyOres = (): Ores => ({ shiny: 0, glowy: 0, starry: 0 });
export const defaultEquipment = (): KingEquipment => ({
  levels: { puppet: 1, vial: 1, boots: 1 },
  loadout: ['puppet', 'vial'],
});
export const EQUIPMENT = {
  puppet: { name: 'Barbarian Puppet', icon: 'Users' },
  vial: { name: 'Rage Vial', icon: 'Zap' },
  boots: { name: 'Earthquake Boots', icon: 'Waves' },
} as const;
export interface EquipmentLevel {
  level: number;
  /** Blacksmith level this item level needs. */
  blacksmith: number;
  /** Tier of the ability the item carries. */
  ability: number;
  hp: number;
  dps: number;
  recovery: number;
  cost: { shiny: number; glowy: number; starry: number };
}
export interface EquipmentRecord {
  /** Heroes the source allows to carry it. */
  heroes: readonly string[];
  rarity: string;
  /** A one-row placeholder the client ships but never offers. */
  unused: boolean;
  levels: readonly EquipmentLevel[];
}
/** Every hero equipment record the source defines, by its original name. */
export const EQUIPMENT_ROSTER = catalog.roster as unknown as Readonly<
  Record<string, EquipmentRecord>
>;
/** The original record behind each local item key. */
export const EQUIPMENT_NAMES = catalog.items as Readonly<Record<EquipmentKind, string>>;
const ITEMS = Object.fromEntries(
  Object.entries(EQUIPMENT_NAMES).map(([kind, name]) => [kind, EQUIPMENT_ROSTER[name].levels]),
) as Readonly<Record<EquipmentKind, readonly EquipmentLevel[]>>;
/** Every item shares the Blacksmith gate column, so one item's rows describe them all. */
export const EQUIPMENT_LEVELS = ITEMS.puppet;
const TIERS = catalog.abilities;
export const EQUIPMENT_MAX_LEVEL = ITEMS.puppet.length;
/** Every item shared a nine-level ceiling before version 47 carried them to eighteen. */
export const EQUIPMENT_LEVEL_BEFORE_47 = 9;
const itemRow = (kind: EquipmentKind, level: number) =>
  ITEMS[kind][Math.min(EQUIPMENT_MAX_LEVEL, Math.max(1, Math.floor(level) || 1)) - 1];
/** Forge an item level needs. All three items share a gate, a price and a tier column. */
export const equipmentBlacksmith = (destination: number) =>
  itemRow('puppet', destination).blacksmith;

export const validEquipmentKind = (value: unknown): value is EquipmentKind =>
  typeof value === 'string' && EQUIPMENT_KEYS.includes(value as EquipmentKind);
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
export function validEquipment(
  value: unknown,
  maxLevel = EQUIPMENT_MAX_LEVEL,
): value is KingEquipment {
  if (!record(value) || !record(value.levels) || !Array.isArray(value.loadout)) return false;
  const levels = value.levels;
  return (
    EQUIPMENT_KEYS.every(
      (k) => Number.isInteger(levels[k]) && Number(levels[k]) >= 1 && Number(levels[k]) <= maxLevel,
    ) &&
    value.loadout.length === 2 &&
    value.loadout.every(validEquipmentKind) &&
    value.loadout[0] !== value.loadout[1]
  );
}
export function validOres(value: unknown): value is Ores {
  if (!record(value)) return false;
  return ORE_KEYS.every(
    (k) => Number.isInteger(value[k]) && Number(value[k]) >= 0 && Number(value[k]) <= ORE_CAP[k],
  );
}
export function equipmentCost(destination: number): Ores | null {
  if (!Number.isInteger(destination) || destination < 2 || destination > EQUIPMENT_MAX_LEVEL)
    return null;
  return { ...itemRow('puppet', destination).cost };
}
export function equipmentQuote(destination: number, ores: Ores) {
  const cost = equipmentCost(destination);
  if (!cost) return null;
  const missing = emptyOres();
  for (const k of ORE_KEYS) missing[k] = Math.max(0, cost[k] - ores[k]);
  return { cost, missing, gems: ORE_KEYS.reduce((sum, k) => sum + missing[k] * ORES[k].gems, 0) };
}
export function equipmentStats(kind: EquipmentKind, level: number) {
  const row = itemRow(kind, level),
    tier = row.ability - 1;
  const summon = TIERS.summon[tier],
    rage = TIERS.rage[tier],
    quake = TIERS.quake[tier];
  return {
    hp: row.hp,
    dps: row.dps,
    recovery: row.recovery,
    summons: kind === 'puppet' ? summon.count : 0,
    summonDamage: kind === 'puppet' ? summon.boostDamage : 1,
    summonSpeedBoost: kind === 'puppet' ? summon.boostSpeed : 0,
    damage: kind === 'vial' ? rage.damage : 1,
    speedBoost: kind === 'vial' ? rage.speed : 0,
    duration: kind === 'vial' ? rage.seconds : 0,
    quakeBuilding: kind === 'boots' ? quake.building : 0,
    quakeTroop: kind === 'boots' ? quake.troop : 0,
  };
}
export function equipmentBonuses(equipment = defaultEquipment()) {
  const result = {
    hp: 0,
    dps: 0,
    recovery: 0,
    summons: 0,
    summonDamage: 1,
    summonSpeedBoost: 0,
    damage: 1,
    speedBoost: 0,
    duration: 0,
    quakeBuilding: 0,
    quakeTroop: 0,
  };
  for (const kind of equipment.loadout) {
    const stats = equipmentStats(kind, equipment.levels[kind]);
    result.hp += stats.hp;
    result.dps += stats.dps;
    result.recovery += stats.recovery;
    for (const key of [
      'summons',
      'summonDamage',
      'summonSpeedBoost',
      'damage',
      'speedBoost',
      'duration',
      'quakeBuilding',
      'quakeTroop',
    ] as const)
      result[key] = Math.max(result[key], stats[key]);
  }
  return result;
}
/** Radius, pulses and interval are the same at every tier; the delay is charge plus hit. */
export const EARTHQUAKE_BOOTS = {
  radius: TIERS.quake[0].radius,
  pulses: TIERS.quake[0].pulses,
  interval: TIERS.quake[0].interval,
  delay: 0.7,
} as const;
