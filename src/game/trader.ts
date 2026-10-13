import type { OreKind } from './equipment';
import type { MagicItemKind } from './magic-items';

/**
 * The Trader's weekly deals. The client draws them from the server (its texts name the "Weekly
 * Deals", "New deals in <time>!" and "It's Trader Tuesday!"), so the pool, prices and weekly
 * quantities come from the wiki's Trader table (revision 624483, read through the MediaWiki API
 * on October 6, 2026), limited to what this game has: Gem offers of Home Village magic items and
 * ores, and the free Glowy Ore. Which paid deals a week shows is this game's own choice: a
 * shuffle seeded by the week. See docs/TRADER.md.
 */
export type TraderGood = { item: MagicItemKind } | { ore: OreKind };
export interface TraderOffer {
  id: string;
  good: TraderGood;
  /** How many the deal gives. */
  amount: number;
  /** Gems per purchase; 0 is free. */
  gems: number;
  /** Purchases allowed each week. */
  quantity: number;
}
const offer = (
  id: string,
  good: TraderGood,
  amount: number,
  gems: number,
  quantity: number,
): TraderOffer => ({ id, good, amount, gems, quantity });
export const TRADER_OFFERS: readonly TraderOffer[] = [
  offer('research-potion', { item: 'research-potion' }, 1, 120, 3),
  offer('resource-potion', { item: 'resource-potion' }, 1, 60, 3),
  offer('builder-potion', { item: 'builder-potion' }, 1, 285, 3),
  offer('power-potion', { item: 'power-potion' }, 1, 150, 3),
  offer('hero-potion', { item: 'hero-potion' }, 1, 150, 3),
  offer('super-potion', { item: 'super-potion' }, 1, 300, 3),
  offer('pet-potion', { item: 'pet-potion' }, 1, 120, 3),
  offer('wall-rings', { item: 'wall-ring' }, 5, 175, 3),
  offer('shovel-of-obstacles', { item: 'shovel-of-obstacles' }, 1, 500, 1),
  offer('book-of-heroes', { item: 'book-of-heroes' }, 1, 500, 1),
  offer('book-of-fighting', { item: 'book-of-fighting' }, 1, 925, 1),
  offer('book-of-spells', { item: 'book-of-spells' }, 1, 925, 1),
  offer('book-of-building', { item: 'book-of-building' }, 1, 925, 1),
  offer('rune-of-gold', { item: 'rune-of-gold' }, 1, 1000, 1),
  offer('rune-of-elixir', { item: 'rune-of-elixir' }, 1, 1000, 1),
  offer('rune-of-dark-elixir', { item: 'rune-of-dark-elixir' }, 1, 1000, 1),
  offer('shiny-ore', { ore: 'shiny' }, 300, 150, 5),
  offer('glowy-ore', { ore: 'glowy' }, 60, 150, 2),
  offer('starry-ore', { ore: 'starry' }, 15, 275, 1),
];
/** Every week's free deal since the Hero Equipment update. */
export const FREE_OFFER = offer('free-glowy-ore', { ore: 'glowy' }, 10, 0, 1);
/** Paid deals a week shows, besides the free one. */
export const WEEKLY_DEALS = 6;
/** The Trader sets up at Town Hall 6; his Gem offers open at Town Hall 8. */
export const TRADER_TOWN_HALL = 6;
export const TRADER_GEM_TOWN_HALL = 8;
const WEEK = 7 * 24 * 3600_000;
/** Deals change every Tuesday at 08:00 UTC (1970-01-06 was a Tuesday). */
const FIRST_TUESDAY = Date.UTC(1970, 0, 6, 8);
export const traderWeek = (now: number) => Math.floor((now - FIRST_TUESDAY) / WEEK);
export const traderWeekEnds = (now: number) => FIRST_TUESDAY + (traderWeek(now) + 1) * WEEK;

/** The week's deals: the free one, then WEEKLY_DEALS paid ones in a week-seeded order. */
export function weeklyDeals(week: number): TraderOffer[] {
  let seed = Math.imul(week + 1, 0x9e3779b1) >>> 0 || 1;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const pool = [...TRADER_OFFERS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [FREE_OFFER, ...pool.slice(0, WEEKLY_DEALS)];
}
export interface TraderState {
  /** The week the purchases below belong to. */
  week: number;
  bought: Record<string, number>;
}
export const validTrader = (value: unknown): value is TraderState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Partial<TraderState>;
  const offers = new Map([FREE_OFFER, ...TRADER_OFFERS].map((o) => [o.id, o]));
  return (
    Number.isSafeInteger(v.week) &&
    !!v.bought &&
    typeof v.bought === 'object' &&
    !Array.isArray(v.bought) &&
    Object.entries(v.bought).every(
      ([id, n]) => offers.has(id) && Number.isInteger(n) && n >= 1 && n <= offers.get(id)!.quantity,
    )
  );
};
