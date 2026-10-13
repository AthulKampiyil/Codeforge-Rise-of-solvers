import {
  flag,
  hasNative,
  nativeLevelCount,
  nativeRow,
  num,
  seconds,
  text,
  tiles,
  type NativeRow,
  type NativeTable,
} from './native-data';
import type { TroopDef } from './data';

/** Client character names for every trainable troop key. The Barbarian keeps its saved key. */
export const TROOP_SOURCE = {
  wallwrecker: 'Wall Wrecker',
  battleblimp: 'Battle Blimp',
  stoneslammer: 'Stone Slammer',
  siegebarracks: 'Siege Barracks',
  loglauncher: 'Log Launcher',
  flameflinger: 'Flame Flinger',
  battledrill: 'Battle Drill',
  trooplauncher: 'Troop Launcher',
  superbarbarian: 'Super Barbarian',
  superarcher: 'Super Archer',
  supergiant: 'Super Giant',
  sneakygoblin: 'Sneaky Goblin',
  superwallbreaker: 'Super Wall Breaker',
  rocketballoon: 'Rocket Balloon',
  superwizard: 'Super Wizard',
  superdragon: 'Super Dragon',
  infernodragon: 'Inferno Dragon',
  superminer: 'Super Miner',
  superyeti: 'Super Yeti',
  superminion: 'Super Minion',
  superhogrider: 'Super Hog Rider',
  supervalkyrie: 'Super Valkyrie',
  superwitch: 'Super Witch',
  icehound: 'Ice Hound',
  superbowler: 'Super Bowler',

  swordsman: 'Barbarian',
  archer: 'Archer',
  giant: 'Giant',
  wizard: 'Wizard',
  balloon: 'Balloon',
  goblin: 'Goblin',
  wallbreaker: 'Wall Breaker',
  healer: 'Healer',
  dragon: 'Dragon',
  pekka: 'PEKKA',
  babydragon: 'Baby Dragon',
  miner: 'Miner',
  electrodragon: 'Electro Dragon',
  yeti: 'Yeti',
  dragonrider: 'Dragon Rider',
  electrotitan: 'Electro Titan',
  rootrider: 'Root Rider',
  thrower: 'Thrower',
  meteorgolem: 'Meteor Golem',
  minion: 'Minion',
  hogrider: 'Hog Rider',
  valkyrie: 'Valkyrie',
  golem: 'Golem',
  witch: 'Witch',
  lavahound: 'Lava Hound',
  bowler: 'Bowler',
  icegolem: 'Ice Golem',
  headhunter: 'Headhunter',
  apprenticewarden: 'Apprentice Warden',
  druid: 'Druid',
  furnace: 'Furnace',
  ruinwitch: 'Ruin Witch',
} as const;
/** Units that never occupy army housing: created by other units, spells or equipment. */
export const SPAWN_SOURCE = {
  golemite: 'Golemite',
  lavapup: 'Lava Pup',
  skeleton: 'Skeleton',
  bear: 'Bear',
  yetimite: 'Yetimite',
  meteormite: 'Meteormite',
  ruinknight: 'Ruin Knight',
  firemite: 'Firemite Spawn',
  electromite: 'Electromite',
  icehoundpup: 'Ice Hound Pup',
  superhog: 'Super Hog',
  superrider: 'Super Rider',
  bigboy: 'Big Boy',
  spellbat: 'Spell Bat',
  spellskeleton: 'Spell Unshielded Skeleton',
  spellskeletonshielded: 'Spell Shielded Skeleton',
  totem: 'Totem',
  snake: 'BK Equipment Snake',
  henchman: 'MP Equipment Henchman',
  gwlavaloon: 'GW Equipment Lavaloon',
  gwlavaloonpup: 'GW Equipment Lavaloon Pup',
} as const;
/** Heroes and pets are battle units too; their rows live in the heroes and pets tables. */
export const HERO_UNIT_SOURCE = {
  barbarianking: 'Barbarian King',
  archerqueen: 'Archer Queen',
  minionprince: 'Minion Prince',
  grandwarden: 'Grand Warden',
  royalchampion: 'Royal Champion',
  dragonduke: 'Dragon Duke',
} as const;
export const PET_UNIT_SOURCE = {
  lassi: 'LASSI',
  mightyyak: 'Mighty Yak',
  electroowl: 'Electro Owl',
  unicorn: 'Unicorn',
  frostypet: 'Frosty',
  diggy: 'Diggy',
  poisonlizard: 'Poison Lizard',
  phoenix: 'Phoenix',
  phoenixegg: 'Phoenix Egg',
  spiritfox: 'Spirit Fox',
  angryjelly: 'Angry Jelly',
  sneezy: 'Sneezy',
  greedyraven: 'Crow',
} as const;
export type HeroUnitKey = keyof typeof HERO_UNIT_SOURCE;
export type PetUnitKey = keyof typeof PET_UNIT_SOURCE;
export const HERO_UNIT_KINDS = Object.keys(HERO_UNIT_SOURCE) as HeroUnitKey[];
export const PET_UNIT_KINDS = Object.keys(PET_UNIT_SOURCE) as PetUnitKey[];
export const isHeroUnitKind = (kind: string): kind is HeroUnitKey =>
  Object.hasOwn(HERO_UNIT_SOURCE, kind);
export const isPetUnitKind = (kind: string): kind is PetUnitKey =>
  Object.hasOwn(PET_UNIT_SOURCE, kind);

export type NativeTroopKey = keyof typeof TROOP_SOURCE;
export type SpawnKind = keyof typeof SPAWN_SOURCE;
export const SPAWN_KINDS = Object.keys(SPAWN_SOURCE) as SpawnKind[];
const SOURCE: Record<string, string> = {
  ...TROOP_SOURCE,
  ...SPAWN_SOURCE,
  ...HERO_UNIT_SOURCE,
  ...PET_UNIT_SOURCE,
};
/** Table each unit kind reads; only heroes and pets leave the characters table. */
const UNIT_TABLE = (kind: string): NativeTable =>
  isHeroUnitKind(kind) ? 'heroes' : isPetUnitKind(kind) ? 'pets' : 'characters';
const KIND_BY_NAME = new Map(Object.entries(SOURCE).map(([kind, name]) => [name, kind]));
export const nativeUnitName = (kind: string) => SOURCE[kind];
export const unitKindForName = (name: string) => KIND_BY_NAME.get(name);
export const isSpawnKind = (kind: string): kind is SpawnKind => Object.hasOwn(SPAWN_SOURCE, kind);
export const nativeUnitLevels = (kind: string) =>
  SOURCE[kind] && hasNative(UNIT_TABLE(kind), SOURCE[kind])
    ? nativeLevelCount(UNIT_TABLE(kind), SOURCE[kind])
    : 0;
export const nativeUnitRow = (kind: string, level = 1): NativeRow =>
  nativeRow(UNIT_TABLE(kind), SOURCE[kind], level);

export interface NativeUnitStats {
  kind: string;
  name: string;
  level: number;
  hp: number;
  /** Damage each attack resolves; negative DPS rows (healers) keep their positive heal here. */
  damage: number;
  dps: number;
  heal: number;
  rate: number;
  range: number;
  speed: number;
  housing: number;
  splash: number;
  flying: boolean;
  airTargets: boolean;
  groundTargets: boolean;
  jumper: boolean;
  underground: boolean;
  preferredClass: string;
  preferredBuilding: string;
  preferredMultiplier: number;
  damageMultiplierTarget: string;
  damageMultiplier: number;
  heroMultiplier: number;
  projectile: string;
  selfAreaCenter: boolean;
  multipleBuildings: boolean;
  newTargetDelay: number;
  attackCount: number;
  deathDamage: number;
  deathRadius: number;
  deathDelay: number;
  deathHitsAir: boolean;
  secondary: string;
  secondaryCount: number;
  secondaryDistance: number;
  secondaryRandom: boolean;
  secondaryOnAttack: boolean;
  noSecondaryWhenEjected: boolean;
  spawnWhenDamaged: number;
  summon: string;
  summonCount: number;
  summonTime: number;
  summonCooldown: number;
  summonLimit: number;
  summonLevel: number;
  summonDelay: number;
  summonLifetimeLimit: number;
  diesWhenSpawnLimitReached: boolean;
  consumeDebris: boolean;
  bunker: string;
  bunkerCount: number;
  bunkerDecay: number;
  bunkerDistance: number;
  aura: string;
  auraLevel: number;
  chainDistance: number;
  chainDepth: number;
  chainDelay: number;
  chainReduction: number;
  bounces: number;
  bounceDistance: number;
  frostTime: number;
  frostPercent: number;
  preferHeroes: boolean;
  groups: boolean;
  groupRadius: number;
  groupRange: number;
  /** `EnabledBySuperLicence`: the troop is a Super Troop with a deployment ability. */
  superLicence: boolean;
  evolveTo: string;
  evolveTime: number;
  mergeTo: string;
  mergeRadius: number;
  inheritHealth: boolean;
  loseHp: number;
  loseHpInterval: number;
  storageReduction: number;
  triggersTraps: boolean;
  cantBeEjected: boolean;
  immuneToHealing: boolean;
  ability: string;
  abilityLevel: number;
  /** Every declared special ability with its level (heroes and pets carry several). */
  abilities: { name: string; level: number }[];
  cooldownOverride: number;
  /** Pets: how far they may wander from their hero before returning. */
  leash: number;
  /** Alternate mode (Grand Warden ground/air). */
  altMode: boolean;
  altFlying: boolean;
  altRange: number;
  /** Group targeting minimum weight (Grand Warden). */
  groupMinWeight: number;
  /** Heat-map weight an enemy group-targeting defense (Eagle Artillery) assigns to this unit. */
  enemyGroupWeight: number;
}
const statsCache = new Map<string, NativeUnitStats>();
/** Parsed once per character level; values keep client units converted to tiles and seconds. */
/** Per (kind, requested level) front of statsCache: no key string or table lookup per call. */
const statsByKind = new Map<string, Map<number, NativeUnitStats>>();
export function nativeUnitStats(kind: string, level = 1): NativeUnitStats {
  let byLevel = statsByKind.get(kind);
  if (!byLevel) statsByKind.set(kind, (byLevel = new Map()));
  let stats = byLevel.get(level);
  if (!stats) byLevel.set(level, (stats = computeUnitStats(kind, level)));
  return stats;
}
function computeUnitStats(kind: string, level: number): NativeUnitStats {
  const name = SOURCE[kind];
  if (!name) throw Error(`Unsupported native unit: ${kind}`);
  const table = UNIT_TABLE(kind);
  const count = nativeLevelCount(table, name);
  const safe = Math.max(1, Math.min(count, Math.floor(level) || 1));
  const key = `${kind}:${safe}`;
  const cached = statsCache.get(key);
  if (cached) return cached;
  const row = nativeRow(table, name, safe);
  const rate = seconds(row, 'AttackSpeed') || 1;
  const dps = num(row, 'DPS');
  const stats: NativeUnitStats = {
    kind,
    name,
    level: safe,
    hp: num(row, 'Hitpoints'),
    damage: Math.abs(dps) * rate,
    dps: Math.max(0, dps),
    heal: Math.max(0, -dps) * rate,
    rate,
    range: tiles(row, 'AttackRange'),
    speed: num(row, 'Speed') / 100,
    housing: num(row, 'HousingSpace'),
    splash: tiles(row, 'DamageRadius'),
    flying: flag(row, 'IsFlying'),
    airTargets: flag(row, 'AirTargets'),
    groundTargets: flag(row, 'GroundTargets'),
    jumper: flag(row, 'IsJumper'),
    underground: flag(row, 'IsUnderground'),
    preferredClass: text(row, 'PreferedTargetBuildingClass'),
    preferredBuilding: text(row, 'PreferedTargetBuilding'),
    preferredMultiplier: num(row, 'PreferedTargetDamageMod', 1) || 1,
    damageMultiplierTarget: text(row, 'DamageMultiplierTarget'),
    damageMultiplier: num(row, 'DamageMultiplierPercent', 100) / 100,
    heroMultiplier: num(row, 'HeroDamageMultiplier', 100) / 100,
    projectile: text(row, 'Projectile'),
    selfAreaCenter: flag(row, 'SelfAsAoeCenter'),
    multipleBuildings: flag(row, 'AttackMultipleBuildings'),
    newTargetDelay: seconds(row, 'NewTargetAttackDelay'),
    attackCount: num(row, 'AttackCount'),
    deathDamage: num(row, 'DieDamage'),
    deathRadius: tiles(row, 'DieDamageRadius'),
    deathDelay: seconds(row, 'DieDamageDelay'),
    deathHitsAir: flag(row, 'DieDamageAffectsAir'),
    secondary: text(row, 'SecondaryTroop'),
    secondaryCount: num(row, 'SecondaryTroopCnt'),
    secondaryDistance: tiles(row, 'SecondarySpawnDist'),
    secondaryRandom: flag(row, 'RandomizeSecSpawnDist'),
    secondaryOnAttack: flag(row, 'SpawnOnAttack'),
    noSecondaryWhenEjected: flag(row, 'DontSpawnSecondaryWhenEjected'),
    spawnWhenDamaged: num(row, 'SpawnWhenDamaged'),
    summon: text(row, 'SummonTroop'),
    summonCount: num(row, 'SummonTroopCount'),
    summonTime: seconds(row, 'SummonTime'),
    summonCooldown: seconds(row, 'SummonCooldown'),
    summonLimit: num(row, 'SummonLimit'),
    summonLevel: num(row, 'SummonLevel', 1) || 1,
    summonDelay: seconds(row, 'SummonDelay'),
    summonLifetimeLimit: num(row, 'SummonLifetimeLimit'),
    diesWhenSpawnLimitReached: flag(row, 'DiesWhenSpawnLimitReached'),
    consumeDebris: flag(row, 'ConsumeDebrisOnSummon'),
    bunker: text(row, 'BunkerTroops'),
    bunkerCount: num(row, 'BunkerTroopCount1'),
    bunkerDecay: seconds(row, 'BunkerDegenerationTime'),
    bunkerDistance: tiles(row, 'BunkerSpawnDist'),
    aura: text(row, 'AuraSpell'),
    auraLevel: num(row, 'AuraSpellLevel', 1) || 1,
    chainDistance: tiles(row, 'ChainAttackDistance'),
    chainDepth: num(row, 'ChainAttackDepth'),
    chainDelay: seconds(row, 'ChainAttackDelay'),
    chainReduction: num(row, 'ChainAttackDamageReductionPercent') / 100,
    bounces: num(row, 'ProjectileBounces'),
    bounceDistance: tiles(row, 'ChainShootingDistance'),
    frostTime: seconds(row, 'FrostOnHitTime'),
    frostPercent: num(row, 'FrostOnHitPercent') / 100,
    preferHeroes: flag(row, 'PreferHeroes'),
    groups: flag(row, 'FightWithGroups'),
    groupRadius: tiles(row, 'TargetGroupsRadius'),
    groupRange: tiles(row, 'TargetGroupsRange'),
    superLicence: text(row, 'EnabledBySuperLicence') === 'TRUE',
    evolveTo: text(row, 'EvolveToCharacter'),
    evolveTime: seconds(row, 'EvolveTime'),
    mergeTo: text(row, 'MergeToCharacter'),
    mergeRadius: tiles(row, 'MergeSearchRadius'),
    inheritHealth: flag(row, 'InheritHealthPercentage'),
    loseHp: num(row, 'LoseHpPerTick'),
    loseHpInterval: seconds(row, 'LoseHpInterval'),
    storageReduction: num(row, 'DamageReductionToStorages') / 100,
    triggersTraps: flag(row, 'TriggersTraps'),
    cantBeEjected: flag(row, 'CantBeEjected'),
    immuneToHealing: flag(row, 'ImmuneToHealing'),
    ability: text(row, 'SpecialAbilities').split(';')[0] ?? '',
    abilityLevel: num(row, 'SpecialAbilitiesLevel', 1) || 1,
    abilities: text(row, 'SpecialAbilities')
      .split(';')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name, index) => ({
        name,
        level:
          Number(text(row, 'SpecialAbilitiesLevel').split(';')[index]) ||
          num(row, 'SpecialAbilitiesLevel', 1) ||
          1,
      })),
    cooldownOverride: seconds(row, 'CoolDownOverride'),
    leash: tiles(row, 'LeashLength'),
    altMode: flag(row, 'HasAltMode'),
    altFlying: flag(row, 'AltModeFlying'),
    altRange: tiles(row, 'AltAttackRange'),
    groupMinWeight: num(row, 'TargetGroupsMinWeight'),
    enemyGroupWeight: num(row, 'EnemyGroupWeight', 100),
  };
  statsCache.set(key, stats);
  return stats;
}

/** Housing-free units retain a TroopDef so shared pathing, traps and presentation can read them. */
export function nativeTroopDef(kind: string): TroopDef {
  const s = nativeUnitStats(kind, 1);
  return {
    name: s.name,
    role: s.heal > 0 ? 'SUPPORT' : s.flying ? 'AIR' : s.range >= 2 ? 'RANGED' : 'MELEE',
    description: `${s.name}.`,
    hp: s.hp,
    damage: s.damage,
    speed: s.speed,
    range: s.range,
    rate: s.rate,
    ...(s.splash ? { splash: s.splash } : {}),
    cost: 0,
    space: s.housing,
    time: 0,
    width: Math.min(65, 26 + Math.sqrt(Math.max(1, s.housing)) * 4),
    research: 0,
    ...(s.flying ? { flying: true as const } : {}),
    ...(s.preferredClass === 'Defense' ? { prefersDefenses: true as const } : {}),
    ...(s.preferredClass === 'Resource' ? { prefersResources: true as const } : {}),
    ...(s.preferredClass === 'Wall' ? { wallBreaker: true as const } : {}),
    ...(s.deathDamage ? { deathDamage: s.deathDamage, deathRadius: s.deathRadius } : {}),
    wallJumper: s.jumper,
    healer: s.heal > 0,
    ...(s.heal > 0 ? { heal: s.heal } : {}),
  };
}
export const SPAWN_TROOPS = Object.fromEntries(
  SPAWN_KINDS.map((kind) => [kind, nativeTroopDef(kind)]),
) as Record<SpawnKind, TroopDef>;
/** Heroes and pets fight as units; their definitions come from the hero and pet tables. */
export const HERO_TROOPS = Object.fromEntries(
  HERO_UNIT_KINDS.map((kind) => [kind, nativeTroopDef(kind)]),
) as Record<HeroUnitKey, TroopDef>;
export const PET_TROOPS = Object.fromEntries(
  PET_UNIT_KINDS.map((kind) => [kind, nativeTroopDef(kind)]),
) as Record<PetUnitKey, TroopDef>;

/** TroopDef-shaped stats at a spawned, hero or pet unit's own level. */
export function spawnStatsAt(kind: SpawnKind | HeroUnitKey | PetUnitKey, level: number) {
  const s = nativeUnitStats(kind, level);
  return {
    ...(SPAWN_TROOPS[kind as SpawnKind] ??
      HERO_TROOPS[kind as HeroUnitKey] ??
      PET_TROOPS[kind as PetUnitKey]),
    hp: s.hp,
    damage: s.damage,
    heal: s.heal > 0 ? s.heal : undefined,
    deathDamage: s.deathDamage || undefined,
  };
}
