import catalog from '../../reference/army-recipes/catalog.json' with { type: 'json' };
import { emptyArmy, emptySpells, type ArmyPreset, type PresetHero } from './army';
import { TROOP_KEYS, SPELL_KEYS, type SpellKind, type TroopKind } from './data';
import {
  HERO_SOURCE,
  PET_SOURCE,
  itemSlug,
  validItem,
  type HeroKind,
  type PetKind,
} from './native-hero-data';
import { TROOP_SOURCE } from './native-units';
import { SPELL_NAMES } from './troop-progression';

/**
 * The Cookbook: the Featured and Creator Army Recipes the client ships in cookbook_armies.csv,
 * decoded by scripts/import-native-army-recipes.py. Each one is a Quick army with heroes, items
 * and pets, plus a Clan Castle part this game has no clan to fill. See docs/ARMY-RECIPES.md.
 */
export interface ArmyRecipe extends ArmyPreset {
  id: string;
  creator: string | null;
  /** The Town Halls it is offered at, lowest and highest. */
  townHall: readonly [number, number];
  /** The creator's video guide, if the row has one. */
  guide: string | null;
  heroes: PresetHero[];
  castle: { troops: [TroopKind, number][]; spells: [SpellKind, number][] };
}
/** The client's Cookbook strings: tab names, tooltip and messages. */
export const ARMY_RECIPE_TEXTS = catalog.texts;

/** A catalog row: client names, decoded from the row's ArmyCode. */
type Units = (string | number)[][];
interface CatalogRecipe {
  id: string;
  name: string;
  creator: string | null;
  townHall: number[];
  guide: string | null;
  heroes: { hero: string; items: string[]; pet?: string; mode?: number }[];
  troops: Units;
  spells: Units;
  castle: { troops: Units; spells: Units };
}
const ROWS: CatalogRecipe[] = catalog.recipes;

const inverse = <K extends string>(source: Record<K, string>) =>
  new Map(Object.entries(source).map(([kind, name]) => [name as string, kind as K]));
const TROOP_BY_NAME = inverse<TroopKind>(TROOP_SOURCE as Record<TroopKind, string>);
const SPELL_BY_NAME = inverse<SpellKind>(SPELL_NAMES);
const HERO_BY_NAME = inverse<HeroKind>(HERO_SOURCE);
const PET_BY_NAME = inverse<PetKind>(PET_SOURCE);

function kind<K extends string>(names: Map<string, K>, keys: readonly K[], name: string) {
  const found = names.get(name);
  if (!found || !keys.includes(found)) throw Error(`Army recipe names an unknown unit: ${name}`);
  return found;
}
const troops = (list: Units) =>
  list.map(([name, count]) => [
    kind(TROOP_BY_NAME, TROOP_KEYS, name as string),
    count as number,
  ]) as [TroopKind, number][];
const spells = (list: Units) =>
  list.map(([name, count]) => [
    kind(SPELL_BY_NAME, SPELL_KEYS, name as string),
    count as number,
  ]) as [SpellKind, number][];

export const ARMY_RECIPES: readonly ArmyRecipe[] = ROWS.map((row) => {
  const army = emptyArmy(),
    book = emptySpells();
  for (const [k, count] of troops(row.troops)) army[k] += count;
  for (const [k, count] of spells(row.spells)) book[k] += count;
  return {
    id: row.id,
    name: row.name,
    creator: row.creator,
    townHall: [row.townHall[0], row.townHall[1]] as const,
    guide: row.guide,
    army,
    spells: book,
    heroes: row.heroes.map((hero) => {
      const pet = hero.pet ? PET_BY_NAME.get(hero.pet) : undefined;
      return {
        kind: kind(HERO_BY_NAME, Object.keys(HERO_SOURCE) as HeroKind[], hero.hero),
        items: hero.items.map(itemSlug).filter(validItem),
        ...(pet ? { pet } : {}),
      };
    }),
    castle: { troops: troops(row.castle.troops), spells: spells(row.castle.spells) },
  };
});
/** The recipes the Cookbook offers at a Town Hall level, in the client's order. */
export const armyRecipesFor = (townhall: number) =>
  ARMY_RECIPES.filter((r) => r.townHall[0] <= townhall && townhall <= r.townHall[1]);
export const armyRecipe = (id: string) => ARMY_RECIPES.find((r) => r.id === id);
/** The Town Hall where the Cookbook's Featured and Creator recipes begin (Town Hall 10). */
export const FIRST_RECIPE_TOWN_HALL = Math.min(...ARMY_RECIPES.map((r) => r.townHall[0]));
