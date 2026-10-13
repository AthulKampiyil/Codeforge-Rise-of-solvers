import type { KingEquipment } from './equipment';
import {
  HERO_KINDS,
  PET_KINDS,
  heroDefaultItems,
  heroItems,
  heroMaxLevel,
  itemHero,
  itemMaxLevel,
  itemRarity,
  itemUnlockBlacksmith,
  petMaxLevel,
  validHero,
  validItem,
  validPet,
  type HeroKind,
  type PetKind,
} from './native-hero-data';

/**
 * Village state for the complete hero roster. The Barbarian King keeps its original `king`
 * progress record; the other five heroes live in `heroes`. `gear` replaces the three-item
 * `equipment` record (migrated on first use) and holds every owned item and each hero's loadout.
 */
export interface HeroGear {
  /** Owned items by slug. Common items become owned when the Blacksmith unlocks them. */
  levels: Record<string, number>;
  loadouts: Partial<Record<HeroKind, string[]>>;
}
export interface PetProgress {
  levels: Partial<Record<PetKind, number>>;
  assigned: Partial<Record<HeroKind, PetKind>>;
  research?: { kind: PetKind; start: number; end: number };
}
export interface HeroRosterProgress {
  level: number;
  upgradeEnd?: number;
  upgradeStart?: number;
}

export const LEGACY_ITEM = {
  puppet: 'barbarian-puppet',
  vial: 'rage-vial',
  boots: 'earthquake-boots',
} as const;

/** Gear derived from the original three-item King record (or the King's defaults). */
export function gearFromLegacy(equipment?: KingEquipment): HeroGear {
  const levels: Record<string, number> = {};
  for (const hero of HERO_KINDS) for (const slug of heroDefaultItems(hero)) levels[slug] = 1;
  const loadouts: HeroGear['loadouts'] = Object.fromEntries(
    HERO_KINDS.map((hero) => [hero, heroDefaultItems(hero)]),
  );
  if (equipment) {
    for (const [key, slug] of Object.entries(LEGACY_ITEM))
      levels[slug] = Math.max(levels[slug] ?? 0, equipment.levels[key as keyof typeof LEGACY_ITEM]);
    loadouts.king = equipment.loadout.map((key) => LEGACY_ITEM[key]);
  }
  return { levels, loadouts };
}
/**
 * Folds an original King record into gear that already exists. Levels keep the higher of the two
 * (ore spent through either panel stays spent); the loadout stays the one battles already used.
 */
export function mergeLegacyEquipment(gear: HeroGear, equipment: KingEquipment) {
  for (const [key, slug] of Object.entries(LEGACY_ITEM))
    gear.levels[slug] = Math.max(
      gear.levels[slug] ?? 0,
      equipment.levels[key as keyof typeof LEGACY_ITEM],
    );
  return gear;
}
/** Every Common item the Blacksmith level unlocks, plus the heroes' starting pairs. */
export function unlockCommonItems(gear: HeroGear, blacksmith: number) {
  let changed = false;
  for (const hero of HERO_KINDS)
    for (const slug of heroItems(hero))
      if (
        itemRarity(slug) === 'COMMON' &&
        itemUnlockBlacksmith(slug) <= blacksmith &&
        gear.levels[slug] === undefined
      ) {
        gear.levels[slug] = 1;
        changed = true;
      }
  return changed;
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const level = (value: unknown, max: number) =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= max;

export function validGear(value: unknown): value is HeroGear {
  if (!record(value) || !record(value.levels) || !record(value.loadouts)) return false;
  for (const [slug, lvl] of Object.entries(value.levels))
    if (!validItem(slug) || !level(lvl, itemMaxLevel(slug))) return false;
  for (const [hero, items] of Object.entries(value.loadouts)) {
    if (!validHero(hero) || !Array.isArray(items) || items.length > 2) return false;
    if (new Set(items).size !== items.length) return false;
    for (const slug of items)
      if (!validItem(slug) || itemHero(slug) !== hero || value.levels[slug] === undefined)
        return false;
  }
  return true;
}
export function validHeroRoster(value: unknown) {
  if (!record(value)) return false;
  for (const [hero, progress] of Object.entries(value)) {
    if (!validHero(hero) || hero === 'king' || !record(progress)) return false;
    if (!level(progress.level, heroMaxLevel(hero))) return false;
    const end = progress.upgradeEnd,
      start = progress.upgradeStart;
    if (end === undefined && start !== undefined) return false;
    if (
      end !== undefined &&
      (typeof end !== 'number' ||
        typeof start !== 'number' ||
        !Number.isFinite(end) ||
        !Number.isFinite(start) ||
        end <= start ||
        (progress.level as number) >= heroMaxLevel(hero))
    )
      return false;
  }
  return true;
}
export function validPetProgress(value: unknown): value is PetProgress {
  if (!record(value) || !record(value.levels) || !record(value.assigned)) return false;
  for (const [pet, lvl] of Object.entries(value.levels))
    if (!validPet(pet) || !level(lvl, petMaxLevel(pet))) return false;
  const used = new Set<string>();
  for (const [hero, pet] of Object.entries(value.assigned)) {
    if (!validHero(hero) || !validPet(pet) || value.levels[pet] === undefined || used.has(pet))
      return false;
    used.add(pet);
  }
  const research = value.research;
  if (research !== undefined) {
    if (
      !record(research) ||
      !validPet(research.kind) ||
      typeof research.start !== 'number' ||
      typeof research.end !== 'number' ||
      !Number.isFinite(research.start) ||
      !Number.isFinite(research.end) ||
      research.end <= research.start
    )
      return false;
    const current = value.levels[research.kind];
    if (current !== undefined && (current as number) >= petMaxLevel(research.kind)) return false;
  }
  return true;
}
export const PET_ORDER = PET_KINDS;
