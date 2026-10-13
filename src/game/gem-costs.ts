import catalog from '../../reference/gem-costs/catalog.json' with { type: 'json' };

/**
 * The client's gem prices (reference/gem-costs, logic/globals.csv): a few points each for time,
 * for Gold or Elixir and for Dark Elixir, joined by straight lines and rounded to the nearest
 * gem. Below the first point an amount costs that point's price; past the last the final line
 * continues. See docs/GEM-PURCHASES.md.
 */
type Points = readonly (readonly [number, number])[];
const TIME = catalog.time as unknown as Points;
const RESOURCE = catalog.resource as unknown as Points;
const DARK = catalog.dark as unknown as Points;
/** The prompt's strings and resource names, as the client words them. */
export const GEM_TEXTS = catalog.texts;
export type GemResource = 'gold' | 'elixir' | 'dark';
export const isGemResource = (resource: string): resource is GemResource =>
  resource === 'gold' || resource === 'elixir' || resource === 'dark';

function price(points: Points, amount: number) {
  if (amount <= points[0][0]) return points[0][1];
  let i = 1;
  while (i < points.length - 1 && amount > points[i][0]) i++;
  const [x0, y0] = points[i - 1],
    [x1, y1] = points[i];
  return Math.round(y0 + ((amount - x0) * (y1 - y0)) / (x1 - x0));
}

/** Gems to finish `seconds` of building, research or clearing now; a minute or less costs 1. */
export const timeGems = (seconds: number) => price(TIME, Math.max(0, seconds));
/** Gems for `amount` of a resource: nothing for none, else at least the first point's price. */
export const resourceGems = (resource: GemResource, amount: number) =>
  amount > 0 ? price(resource === 'dark' ? DARK : RESOURCE, amount) : 0;

export interface TreasurePack {
  resource: GemResource;
  /** Share of the storages it adds, in percent; 100 fills whatever room is left. */
  share: 10 | 50 | 100;
  /** The client's name for it: "Fill Storages by 10%", "Fill Gold Storages", … */
  name: string;
  art: { path: string; width: number; height: number };
}
/** The Shop's Treasure: three packs of each resource, in the client's order. */
export const TREASURE_PACKS = catalog.packs as TreasurePack[];
/**
 * What a pack adds: a share of the storages' capacity, or for the full pack whatever fills them.
 * It cannot be bought when that would overflow the storages (or, for the full pack, when they
 * are already full).
 */
export function packAmount(share: TreasurePack['share'], stored: number, capacity: number) {
  const amount = share === 100 ? capacity - stored : Math.floor((capacity * share) / 100);
  return amount > 0 && stored + amount <= capacity ? amount : 0;
}
