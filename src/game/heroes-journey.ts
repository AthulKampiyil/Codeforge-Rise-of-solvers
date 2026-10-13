import catalog from '../../reference/heroes-journey/catalog.json' with { type: 'json' };
import { ITEM_NAMES, itemHero, itemName, itemSlug, type HeroKind } from './native-hero-data';
import { validMagicItem, type MagicItemKind, magicItemKind } from './magic-items';

/**
 * Hero's Journey (reference/heroes-journey, from the wiki; the client has no table for it).
 * From Town Hall 7 the sum of every hero's level walks a fixed track of rewards: resources,
 * ore, magic items, Epic equipment, cosmetic skins and Hero Quests. A quest asks for 15 stars
 * within 14 days using the named hero or item and pays three Ore Chests.
 */
export type JourneyReward =
  | { type: 'elixir' | 'dark'; amount: number }
  | { type: 'ore'; ore: 'shiny' | 'glowy' | 'starry'; amount: number }
  | { type: 'item'; item: string; count: number }
  | { type: 'quest'; hero?: HeroKind; equipment?: string }
  | { type: 'equipment'; hero: HeroKind; level: number }
  | { type: 'skin'; hero: HeroKind };
export interface JourneyTier {
  level: number;
  reward: JourneyReward;
}
type Range = [number, number];
type Chests = Record<string, { shiny: Range; glowy: Range; starry: Range }>;

export const JOURNEY_TOWN_HALL = catalog.townHall;
export const JOURNEY_QUEST_STARS = catalog.questStars;
export const JOURNEY_QUEST_MS = catalog.questDays * 86_400_000;
export const JOURNEY_ALL_OWNED_STARRY = catalog.allOwnedStarry;
export const JOURNEY_TIERS = catalog.tiers as JourneyTier[];
const CHESTS = catalog.oreChests as unknown as Chests;

/** The item slug for a wiki display name (Frost Flake is the client's Frost Charm). */
const SLUG_BY_DISPLAY = new Map(ITEM_NAMES.map(itemSlug).map((slug) => [itemName(slug), slug]));
export const journeyItemSlug = (display: string) => SLUG_BY_DISPLAY.get(display);
/** Each hero's Epic items in the order the track hands them out. */
export const JOURNEY_EPICS = Object.fromEntries(
  Object.entries(catalog.epics).map(([hero, names]) => [
    hero,
    names.map((name) => journeyItemSlug(name)!),
  ]),
) as Record<HeroKind, string[]>;

export interface JourneyQuest {
  /** Index of the quest tier in JOURNEY_TIERS. */
  tier: number;
  hero: HeroKind;
  /** Present for an item quest: the item must be equipped on the deployed hero. */
  item?: string;
  stars: number;
  ends: number;
}
export interface JourneyState {
  /** Tier indices whose reward was taken (a quest tier counts once its quest starts). */
  claimed: number[];
  quest?: JourneyQuest;
  /** Quest tiers finished with their Ore Chests paid. */
  completed?: number[];
}

/** What a quest tier asks for: a hero, or an item on its hero. */
export function questTarget(tier: number): { hero: HeroKind; item?: string } | null {
  const reward = JOURNEY_TIERS[tier]?.reward;
  if (reward?.type !== 'quest') return null;
  if (reward.hero) return { hero: reward.hero };
  const item = journeyItemSlug(reward.equipment!);
  return item ? { hero: itemHero(item), item } : null;
}

/** The first Epic of `hero` not yet owned, or null when the track pays Starry Ore instead. */
export const nextJourneyEpic = (hero: HeroKind, owned: (slug: string) => boolean) =>
  JOURNEY_EPICS[hero].find((slug) => !owned(slug)) ?? null;

/** A small integer hash, so a quest always opens the same chests. */
function mix(seed: number) {
  let h = (seed ^ 0x2545f491) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
}
/** The three Ore Chests a finished quest opens, by Town Hall (below 8 uses the Town Hall 8 row). */
export function questChests(townHall: number, seed: number) {
  const th = String(Math.min(18, Math.max(8, townHall)));
  const row = CHESTS[th];
  const roll = ([low, high]: Range, salt: number) =>
    low + (mix(seed * 31 + salt) % (high - low + 1));
  return { shiny: roll(row.shiny, 1), glowy: roll(row.glowy, 2), starry: roll(row.starry, 3) };
}

const integer = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const tierIndex = (v: unknown) => integer(v, 0, JOURNEY_TIERS.length - 1);
const uniqueTiers = (v: unknown) =>
  Array.isArray(v) && v.every(tierIndex) && new Set(v).size === v.length;

export function validJourney(value: unknown): value is JourneyState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const j = value as Record<string, unknown>;
  if (!uniqueTiers(j.claimed) || (j.completed !== undefined && !uniqueTiers(j.completed)))
    return false;
  if (j.quest === undefined) return true;
  const q = j.quest as Record<string, unknown>;
  if (!q || typeof q !== 'object' || !tierIndex(q.tier)) return false;
  const target = questTarget(q.tier as number);
  return (
    !!target &&
    q.hero === target.hero &&
    q.item === target.item &&
    (j.claimed as number[]).includes(q.tier as number) &&
    integer(q.stars, 0, JOURNEY_QUEST_STARS) &&
    typeof q.ends === 'number' &&
    Number.isFinite(q.ends)
  );
}

/** Journey item names, as the track writes them, to the magic item they are. */
export const journeyMagicItem = (name: string): MagicItemKind | undefined => {
  const kind = magicItemKind(name);
  return validMagicItem(kind) ? kind : undefined;
};
