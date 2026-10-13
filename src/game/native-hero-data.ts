import {
  flag,
  list,
  nativeGlobalArray,
  nativeLevelCount,
  nativeLevels,
  nativeNames,
  nativeRow,
  num,
  numbers,
  text,
  type NativeRow,
} from './native-data';
import type { Resource } from './data';

/**
 * Heroes, hero equipment and pets from client 18.400.21 (heroes.csv, character_items.csv,
 * pets.csv, special_abilities.csv, buildings.csv Hero Hall / Pet House / Blacksmith, globals),
 * cross-checked with reference/official-wiki/heroes-pets. Upgrade prices follow the client
 * convention: the row of the current level stores the price of the next level.
 */
export const HERO_SOURCE = {
  king: 'Barbarian King',
  queen: 'Archer Queen',
  prince: 'Minion Prince',
  warden: 'Grand Warden',
  champion: 'Royal Champion',
  duke: 'Dragon Duke',
} as const;
export type HeroKind = keyof typeof HERO_SOURCE;
export const HERO_KINDS = Object.keys(HERO_SOURCE) as HeroKind[];
/** Matching custom portrait shared by hero cards, panels and battle fallbacks. */
export const heroPortraitImage = (kind: HeroKind) =>
  kind === 'king'
    ? '/assets/characters/king-v1/portrait.webp'
    : `/assets/characters/hero-redesign-v1/${kind}/portrait.webp`;
/** Battle unit kinds for heroes (their stats come from heroes.csv). */
export const HERO_UNIT = {
  king: 'barbarianking',
  queen: 'archerqueen',
  prince: 'minionprince',
  warden: 'grandwarden',
  champion: 'royalchampion',
  duke: 'dragonduke',
} as const satisfies Record<HeroKind, string>;
export type HeroUnitKind = (typeof HERO_UNIT)[HeroKind];

const RESOURCE: Record<string, Resource> = { Gold: 'gold', Elixir: 'elixir', DarkElixir: 'dark' };

export const heroMaxLevel = (kind: HeroKind) => nativeLevelCount('heroes', HERO_SOURCE[kind]);
export const heroRow = (kind: HeroKind, level: number): NativeRow =>
  nativeRow('heroes', HERO_SOURCE[kind], level);
/** Hero Hall level that unlocks the hero. */
export const heroUnlockHall = (kind: HeroKind) =>
  num(heroRow(kind, 1), 'RequiredHeroTavernLevel', 1);
export const heroUnlockTownHall = (kind: HeroKind) =>
  num(heroRow(kind, 1), 'RequiredTownHallLevel', 1);
/** Highest level allowed by the Town Hall and Hero Hall (every row carries both gates). */
export function heroLevelCap(kind: HeroKind, townhall: number, hall: number) {
  let cap = 0;
  for (const row of nativeLevels('heroes', HERO_SOURCE[kind])) {
    if (num(row, 'RequiredTownHallLevel') > townhall || num(row, 'RequiredHeroTavernLevel') > hall)
      break;
    cap++;
  }
  return cap;
}
/** Price of the next level, stored on the current level's row. */
export function heroUpgradeQuote(kind: HeroKind, level: number) {
  if (level >= heroMaxLevel(kind)) return null;
  const row = heroRow(kind, level);
  return {
    level: level + 1,
    cost: num(row, 'UpgradeCost'),
    seconds: num(row, 'UpgradeTimeH') * 3600,
    resource: RESOURCE[text(row, 'UpgradeResource')] ?? 'dark',
  };
}
/** Hero slots from globals TAVERN_LEVEL_TO_HERO_SLOT_COUNT (Hero Hall 1/3/5/7 → 1/2/3/4). */
export function heroSlots(hall: number) {
  const halls = nativeGlobalArray('TAVERN_LEVEL_TO_HERO_SLOT_COUNT');
  const counts = nativeGlobalArray('TAVERN_LEVEL_TO_HERO_SLOT_COUNT', 'AltNumberArray');
  let slots = 0;
  halls.forEach((level, i) => {
    if (hall >= level) slots = counts[i];
  });
  return slots;
}

/** Town Hall 4-6 King scaling (ScaleByTH with townhall_levels ScaleByTHPercent 50/75/100). */
export const heroTownHallScale = (kind: HeroKind, townhall: number) =>
  flag(heroRow(kind, 1), 'ScaleByTH') ? (townhall <= 4 ? 0.5 : townhall === 5 ? 0.75 : 1) : 1;

// ------------------------------------------------------------------ equipment
export type ItemRarity = 'COMMON' | 'EPIC';
const DEPRECATED = new Set(
  nativeNames('items').filter((name) => flag(nativeRow('items', name, 1), 'Deprecated')),
);
/** The 42 playable items (deprecated prototype rows excluded), in client order. */
export const ITEM_NAMES = nativeNames('items').filter((name) => !DEPRECATED.has(name));
export const itemSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const ITEM_BY_SLUG = new Map(ITEM_NAMES.map((name) => [itemSlug(name), name]));
/** Official display names for the client records that were renamed (wiki dossier README). */
export const ITEM_DISPLAY: Record<string, string> = {
  'Piercing Arrow': 'Giant Arrow',
  'Frost Charm': 'Frost Flake',
  ElectroAttack: 'Electro Fangs',
  'Draconic Counter': 'Revenge Deck',
};
export const itemName = (slug: string) => {
  const client = ITEM_BY_SLUG.get(slug) ?? slug;
  return ITEM_DISPLAY[client] ?? client;
};
export const validItem = (slug: unknown): slug is string =>
  typeof slug === 'string' && ITEM_BY_SLUG.has(slug);
export const itemRow = (slug: string, level: number): NativeRow =>
  nativeRow('items', ITEM_BY_SLUG.get(slug)!, level);
export const itemMaxLevel = (slug: string) => nativeLevelCount('items', ITEM_BY_SLUG.get(slug)!);
export const itemRarity = (slug: string) => text(itemRow(slug, 1), 'Rarity') as ItemRarity;
export function itemHero(slug: string): HeroKind {
  const owner = list(itemRow(slug, 1), 'AllowedCharacters')[0];
  return HERO_KINDS.find((kind) => HERO_SOURCE[kind] === owner)!;
}
export const heroItems = (hero: HeroKind) =>
  ITEM_NAMES.map(itemSlug).filter((s) => itemHero(s) === hero);
/** Starting pair from heroes.csv DefaultItems. */
export const heroDefaultItems = (hero: HeroKind) =>
  list(heroRow(hero, 1), 'DefaultItems').map(itemSlug).filter(validItem);
/** Blacksmith level that unlocks a Common item (Epics are acquired, not unlocked). */
export const itemUnlockBlacksmith = (slug: string) =>
  num(itemRow(slug, 1), 'RequiredBlacksmithLevel', 1);
/** Highest item level a Blacksmith level allows (RequiredBlacksmithLevel of each row). */
export function itemLevelCap(slug: string, blacksmith: number) {
  let cap = 0;
  for (let level = 1; level <= itemMaxLevel(slug); level++) {
    if (num(itemRow(slug, level), 'RequiredBlacksmithLevel', 1) > blacksmith) break;
    cap = level;
  }
  return cap;
}
export type OreKind = 'shiny' | 'glowy' | 'starry';
const ORE_RESOURCE: Record<string, OreKind> = {
  CommonOre: 'shiny',
  RareOre: 'glowy',
  EpicOre: 'starry',
};
/** Ore to go from `level` to `level + 1` (stored on the current row). */
export function itemUpgradeCost(slug: string, level: number) {
  if (level >= itemMaxLevel(slug)) return null;
  const row = itemRow(slug, level);
  const kinds = list(row, 'UpgradeResources');
  const costs = numbers(row, 'UpgradeCosts');
  const cost = { shiny: 0, glowy: 0, starry: 0 };
  kinds.forEach((kind, i) => {
    const ore = ORE_RESOURCE[kind];
    if (ore) cost[ore] += costs[i] ?? 0;
  });
  return cost;
}
export interface ItemStats {
  slug: string;
  level: number;
  hp: number;
  dps: number;
  heal: number;
  attackSpeed: number;
  abilities: { name: string; level: number }[];
  passive: boolean;
}
/** Items whose abilities are not triggered by the hero ability (official wiki passive list). */
const TRIGGERED = (row: NativeRow) =>
  list(row, 'MainAbilities').some((name) =>
    flag(nativeRow('abilities', name, 1), 'ActiveAfterPlayerInput'),
  );
export function itemStats(slug: string, level: number): ItemStats {
  const row = itemRow(slug, level);
  const main = list(row, 'MainAbilities');
  const mainLevels = numbers(row, 'MainAbilityLevels');
  const extra = list(row, 'ExtraAbilities');
  const extraLevels = numbers(row, 'ExtraAbilityLevels');
  return {
    slug,
    level,
    hp: num(row, 'HitPoints'),
    dps: num(row, 'DPS'),
    heal: num(row, 'HealOnActivation'),
    attackSpeed: num(row, 'AttackSpeedPercentage') / 100,
    abilities: [
      ...main.map((name, i) => ({ name, level: mainLevels[i] || mainLevels[0] || 1 })),
      ...extra.map((name, i) => ({ name, level: extraLevels[i] || extraLevels[0] || 1 })),
    ],
    passive: !TRIGGERED(row),
  };
}
/** Ore caps from the Blacksmith building row. */
export function oreCaps(blacksmith: number) {
  if (blacksmith < 1) return { shiny: 0, glowy: 0, starry: 0 };
  const row = nativeRow('buildings', 'Blacksmith', blacksmith);
  return {
    shiny: num(row, 'MaxStoredCommonOre'),
    glowy: num(row, 'MaxStoredRareOre'),
    starry: num(row, 'MaxStoredEpicOre'),
  };
}

// ------------------------------------------------------------------ pets
export const PET_SOURCE = {
  lassi: 'LASSI',
  yak: 'Mighty Yak',
  owl: 'Electro Owl',
  unicorn: 'Unicorn',
  frosty: 'Frosty',
  diggy: 'Diggy',
  lizard: 'Poison Lizard',
  phoenix: 'Phoenix',
  fox: 'Spirit Fox',
  jelly: 'Angry Jelly',
  sneezy: 'Sneezy',
  crow: 'Crow',
} as const;
export type PetKind = keyof typeof PET_SOURCE;
export const PET_KINDS = (Object.keys(PET_SOURCE) as PetKind[]).sort(
  (a, b) => petUnlockHouse(a) - petUnlockHouse(b),
);
export const PET_DISPLAY: Record<PetKind, string> = {
  lassi: 'L.A.S.S.I',
  yak: 'Mighty Yak',
  owl: 'Electro Owl',
  unicorn: 'Unicorn',
  frosty: 'Frosty',
  diggy: 'Diggy',
  lizard: 'Poison Lizard',
  phoenix: 'Phoenix',
  fox: 'Spirit Fox',
  jelly: 'Angry Jelly',
  sneezy: 'Sneezy',
  crow: 'Greedy Raven',
};
export const PET_UNIT = {
  lassi: 'lassi',
  yak: 'mightyyak',
  owl: 'electroowl',
  unicorn: 'unicorn',
  frosty: 'frostypet',
  diggy: 'diggy',
  lizard: 'poisonlizard',
  phoenix: 'phoenix',
  fox: 'spiritfox',
  jelly: 'angryjelly',
  sneezy: 'sneezy',
  crow: 'greedyraven',
} as const satisfies Record<PetKind, string>;
export type PetUnitKind = (typeof PET_UNIT)[PetKind] | 'phoenixegg';
export const petRow = (kind: PetKind, level: number): NativeRow =>
  nativeRow('pets', PET_SOURCE[kind], level);
export const petMaxLevel = (kind: PetKind) => nativeLevelCount('pets', PET_SOURCE[kind]);
/** Pet House level that unlocks the pet (pets.csv LaboratoryLevel on level 1). */
export function petUnlockHouse(kind: PetKind) {
  return num(nativeRow('pets', PET_SOURCE[kind], 1), 'LaboratoryLevel', 1);
}
/** Pet levels allowed by the Pet House level (LaboratoryLevel gates each row). */
export function petLevelCap(kind: PetKind, house: number) {
  let cap = 0;
  for (let level = 1; level <= petMaxLevel(kind); level++) {
    if (num(petRow(kind, level), 'LaboratoryLevel', 1) > house) break;
    cap = level;
  }
  return cap;
}
export function petUpgradeQuote(kind: PetKind, level: number) {
  if (level >= petMaxLevel(kind)) return null;
  const row = petRow(kind, level);
  return {
    level: level + 1,
    cost: num(row, 'UpgradeCost'),
    seconds: num(row, 'UpgradeTimeH') * 3600,
    resource: RESOURCE[text(row, 'UpgradeResource')] ?? 'dark',
  };
}
export const validHero = (value: unknown): value is HeroKind =>
  typeof value === 'string' && (HERO_KINDS as string[]).includes(value);
export const validPet = (value: unknown): value is PetKind =>
  typeof value === 'string' && Object.hasOwn(PET_SOURCE, value);
