import catalog from '../../reference/magic-items/catalog.json' with { type: 'json' };

/**
 * Magic items held in the village: the client's Home Village items from logic/boosters.csv
 * (reference/magic-items, scripts/import-native-magic-items.py), with each item's stack limit,
 * the gems it sells for and its effect. Hero's Journey also hands out the Mighty Morsel, a treat
 * the client tables do not describe; it is kept, not used. See docs/MAGIC-ITEMS.md.
 */
export type MagicTarget = 'troop' | 'building' | 'spell' | 'hero';
export type BoostKind = 'builders' | 'laboratory' | 'pets' | 'resources' | 'army' | 'heroes';
export type MagicEffect =
  /** Books: finish a running upgrade of these targets. */
  | { finish: MagicTarget[] }
  /** Hammers: perform the next upgrade of these targets, instantly and free. */
  | { upgrade: MagicTarget[] }
  /** Runes: fill this resource's storages. */
  | { fill: 'gold' | 'elixir' | 'dark' }
  /** Wall Ring: upgrades a wall; a level takes ceil(cost / divisor) rings. */
  | { ring: 'wall'; divisor: number }
  /** Potions: a timed boost, extended (never stacked) by another potion of its kind. */
  | { boost: BoostKind; seconds: number; multiplier?: number }
  /** Super Potion: boosts a troop into its Super Troop, as the Dark Elixir boost does. */
  | { super: true }
  | { shovel: true }
  | { kept: true };
export interface MagicItemDef {
  name: string;
  description: string;
  /** How many one village may hold. */
  max: number;
  /** Gems the item sells for, and what an item that does not fit is sold for. */
  gemValue: number;
  order: number;
  effect: MagicEffect;
  icon?: { path: string; width: number; height: number };
}
export const MAGIC_ITEMS: Record<string, MagicItemDef> = {
  ...Object.fromEntries(catalog.items.map((item) => [item.id, item as unknown as MagicItemDef])),
  'mighty-morsel': {
    name: 'Mighty Morsel',
    description: 'A Hero’s Journey treat. Kept until its effect arrives with the client data.',
    max: 99,
    gemValue: 0,
    order: 99,
    effect: { kept: true },
  },
};
export type MagicItemKind = string;
/** The inventory's order: by the client's DisplayOrder, then as the client lists them. */
export const MAGIC_ITEM_KINDS: readonly MagicItemKind[] = Object.keys(MAGIC_ITEMS)
  .map((kind, index) => ({ kind, index }))
  .sort((a, b) => MAGIC_ITEMS[a.kind].order - MAGIC_ITEMS[b.kind].order || a.index - b.index)
  .map(({ kind }) => kind);
/**
 * The ceiling a saved count may reach. Grants respect each item's own limit, but villages saved
 * before the limits were imported may hold more, as the client lets older surplus stay.
 */
export const MAX_MAGIC_ITEMS = 99;
export type MagicItems = Partial<Record<MagicItemKind, number>>;
/** A running potion: when it started, ends, and how far it has moved its timers. */
export interface Boost {
  start: number;
  end: number;
  applied: number;
}
export type Boosts = Partial<Record<BoostKind, Boost>>;

export const magicItemKind = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-') as MagicItemKind;
export const validMagicItem = (kind: unknown): kind is MagicItemKind =>
  typeof kind === 'string' && Object.hasOwn(MAGIC_ITEMS, kind);
export const validMagicItems = (value: unknown): value is MagicItems =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.entries(value).every(
    ([kind, count]) =>
      validMagicItem(kind) && Number.isInteger(count) && count >= 0 && count <= MAX_MAGIC_ITEMS,
  );
const BOOST_KINDS: readonly BoostKind[] = [
  'builders',
  'laboratory',
  'pets',
  'resources',
  'army',
  'heroes',
];
export const validBoosts = (value: unknown): value is Boosts =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.entries(value).every(([kind, b]) => {
    const boost = b as Partial<Boost> | undefined;
    return (
      (BOOST_KINDS as readonly string[]).includes(kind) &&
      !!boost &&
      [boost.start, boost.end, boost.applied].every(Number.isFinite) &&
      boost.start! <= boost.applied! &&
      boost.applied! <= boost.end! &&
      boost.start! < boost.end!
    );
  });
/** The potion that runs a boost. */
export const boostItem = (kind: BoostKind) =>
  MAGIC_ITEM_KINDS.find((item) => {
    const effect = MAGIC_ITEMS[item].effect;
    return 'boost' in effect && effect.boost === kind;
  })!;
/** Wall Rings a wall upgrade costing `cost` takes. */
export const wallRings = (cost: number) => {
  const effect = MAGIC_ITEMS['wall-ring'].effect as { divisor: number };
  return Math.max(1, Math.ceil(cost / effect.divisor));
};
/** A timer a potion speeds up: its end, and a way to bring it forward. */
export interface BoostTimer {
  readonly end: number;
  move(ms: number): void;
}
/**
 * Runs a boost's extra speed over its timers up to `now`: each runs `multiplier`× while the boost
 * lasts, finishing no sooner than the moment its remaining work is done at that speed. Later
 * boosts and helpers add to it, as the client's rates stack additively.
 */
export function advanceBoost(
  boost: Boost,
  multiplier: number,
  timers: readonly BoostTimer[],
  now: number,
) {
  const until = Math.min(now, boost.end);
  if (until <= boost.applied) return false;
  const extra = multiplier - 1;
  let moved = false;
  for (const timer of timers) {
    if (timer.end <= boost.applied) continue;
    // The timer finishes at x where end - extra·(x - applied) = x.
    const done = timer.end - extra * (until - boost.applied) <= until;
    const saved = done
      ? timer.end - Math.ceil((timer.end + extra * boost.applied) / multiplier)
      : extra * (until - boost.applied);
    if (saved > 0) {
      timer.move(saved);
      moved = true;
    }
  }
  boost.applied = until;
  return moved;
}
