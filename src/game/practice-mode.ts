import catalog from '../../reference/practice/catalog.json' with { type: 'json' };
import { emptyArmy, emptySpells } from './army';
import { SPELL_KEYS, TROOP_KEYS, type SpellKind, type TroopKind } from './data';
import { HERO_SOURCE, heroDefaultItems, type HeroKind } from './native-hero-data';
import type { HeroSetup } from './native-heroes';
import { TROOP_SOURCE } from './native-units';
import { SPELL_NAMES } from './troop-progression';
import { BUILD_MIN } from './grid';
import type { Army, SpellBook } from './model';

/**
 * Practice Mode: the client's single-player Practice levels, each fought with the army it
 * provides instead of the player's own (logic/npcs.csv, imported by
 * scripts/import-native-practice.py). The villages are campaign stages 91 to 103. See
 * docs/PRACTICE-MODE.md.
 */
export interface PracticeLevel {
  id: string;
  name: string;
  /** The Town Hall that opens the level. */
  townHall: number;
  /** Its campaign stage, or null for the six Challenges this game withholds. */
  stage: number | null;
  gold: number;
  elixir: number;
  /** Troops and siege machines, the Clan Castle's units among them. */
  army: Army;
  spells: SpellBook;
  troopLevels: Army;
  spellLevels: SpellBook;
  heroes: HeroSetup[];
  /** The units the client sends in the Clan Castle (they join `army` here). */
  castle: [TroopKind, number][];
  /** The first attempt's step-by-step guide (csv/deploy_steps.csv). */
  steps: PracticeStep[];
  /** Where each defending hero stands guard: the centre of its 2×2 hero flag. */
  heroFlags: { kind: HeroKind; x: number; y: number }[];
}
export type PracticeUnit = { troop: TroopKind } | { spell: SpellKind } | { hero: HeroKind };
/**
 * One step of a level's guide, on this game's grid (the client's tile plus `BUILD_MIN`). A
 * step asks for `count` of a `unit` (around `at`, within `radius` tiles), for a hero's
 * `ability`, or waits: for `duration` seconds or until the building at `waitFor` falls.
 */
export interface PracticeStep {
  name: string;
  /** The client's words, with its <cRRGGBB>…</c> colour markup. */
  text?: string;
  unit?: PracticeUnit;
  count: number;
  at?: { x: number; y: number };
  radius: number;
  /** The battle waits for the step: frozen, or at `slowdown` percent of its speed. */
  pause: boolean;
  slowdown?: number;
  /** Only the step's unit (nothing, while it waits) may be deployed. */
  forceType: boolean;
  /** Deploys must land within `radius` of `at`; with `exact`, they land on it. */
  forceLocation: boolean;
  exact: boolean;
  ability: boolean;
  duration?: number;
  /** A building's top-left tile: the one to wait for, or the one to point out. */
  waitFor?: { x: number; y: number };
  show?: { x: number; y: number };
}
/** Practice Mode's strings: its title, description and the lock below Town Hall 4. */
export const PRACTICE_TEXTS = catalog.texts;

interface CatalogUnit {
  unit: string;
  kind: string;
  level: number;
  count: number;
  castle?: boolean;
}
const inverse = <K extends string>(source: Record<K, string>) =>
  new Map(Object.entries(source).map(([kind, name]) => [name as string, kind as K]));
const TROOPS = inverse<TroopKind>(TROOP_SOURCE as Record<TroopKind, string>);
const SPELLS = inverse<SpellKind>(SPELL_NAMES);
const HEROES = inverse<HeroKind>(HERO_SOURCE);

interface CatalogStep {
  name: string;
  text?: string;
  unit?: string;
  count?: number;
  at?: number[];
  radius?: number;
  pause?: boolean;
  slowdown?: number;
  forceType?: boolean;
  forceLocation?: boolean;
  exact?: boolean;
  ability?: boolean;
  duration?: number;
  waitFor?: { x: number; y: number };
  show?: { x: number; y: number };
}
const unitOf = (name: string): PracticeUnit => {
  const troop = TROOPS.get(name),
    spell = SPELLS.get(name),
    hero = HEROES.get(name);
  if (troop) return { troop };
  if (spell) return { spell };
  if (hero) return { hero };
  throw Error(`Practice guide names an unknown unit: ${name}`);
};
const tile = (p: { x: number; y: number } | number[]) =>
  Array.isArray(p)
    ? { x: p[0] + BUILD_MIN, y: p[1] + BUILD_MIN }
    : { x: p.x + BUILD_MIN, y: p.y + BUILD_MIN };
function step(row: CatalogStep): PracticeStep {
  return {
    name: row.name,
    ...(row.text ? { text: row.text } : {}),
    ...(row.unit ? { unit: unitOf(row.unit) } : {}),
    count: row.count ?? 1,
    ...(row.at ? { at: tile(row.at) } : {}),
    radius: row.radius ?? 0,
    pause: !!row.pause,
    ...(row.slowdown ? { slowdown: row.slowdown } : {}),
    forceType: !!row.forceType,
    forceLocation: !!row.forceLocation,
    exact: !!row.exact,
    ability: !!row.ability,
    ...(row.duration ? { duration: row.duration / 1000 } : {}),
    ...(row.waitFor ? { waitFor: tile(row.waitFor) } : {}),
    ...(row.show ? { show: tile(row.show) } : {}),
  };
}

function level(row: (typeof catalog.levels)[number]): PracticeLevel {
  const army = emptyArmy(),
    spells = emptySpells();
  const troopLevels: Partial<Record<TroopKind, number>> = {},
    spellLevels: Partial<Record<SpellKind, number>> = {};
  const heroes: HeroSetup[] = [],
    castle: [TroopKind, number][] = [];
  // The army's own units set a kind's level before the Clan Castle's (Bowling with Bats sends
  // P.E.K.K.A 6 in the army and P.E.K.K.A 8 in the castle).
  const units = [...(row.army as CatalogUnit[])].sort((a, b) => +!!a.castle - +!!b.castle);
  for (const unit of units) {
    if (unit.kind === 'hero') {
      const kind = HEROES.get(unit.unit)!;
      const items = heroDefaultItems(kind).map((slug) => ({ slug, level: 1 }));
      heroes.push({ kind, level: unit.level, items });
    } else if (unit.kind === 'spell') {
      const kind = SPELLS.get(unit.unit)!;
      spells[kind] += unit.count;
      spellLevels[kind] ??= unit.level;
    } else {
      const kind = TROOPS.get(unit.unit)!;
      army[kind] += unit.count;
      troopLevels[kind] ??= unit.level;
      if (unit.castle) castle.push([kind, unit.count]);
    }
  }
  return {
    id: row.id,
    name: row.name,
    townHall: row.townHall,
    stage: row.stage,
    gold: row.gold,
    elixir: row.elixir,
    army,
    spells,
    troopLevels: Object.fromEntries(TROOP_KEYS.map((k) => [k, troopLevels[k] ?? 1])) as Army,
    spellLevels: Object.fromEntries(SPELL_KEYS.map((k) => [k, spellLevels[k] ?? 1])) as SpellBook,
    heroes,
    castle,
    steps: (row.steps as CatalogStep[]).map(step),
    heroFlags: (row.heroFlags as { hero: string; x: number; y: number }[]).map((flag) => ({
      kind: HEROES.get(flag.hero)!,
      x: flag.x + BUILD_MIN + 1,
      y: flag.y + BUILD_MIN + 1,
    })),
  };
}
/** All 19 Practice levels, by Town Hall, the six withheld ones included (stage null). */
export const PRACTICE_LEVELS: readonly PracticeLevel[] = catalog.levels.map(level);
/** The Practice level a campaign village is, by its index on the Goblin map, if any. */
export const practiceLevelAt = (index: number) =>
  PRACTICE_LEVELS.find((level) => level.stage === index + 1);
/** The Town Hall that opens Practice Mode (Town Hall 4). */
export const PRACTICE_TOWN_HALL = Math.min(...PRACTICE_LEVELS.map((level) => level.townHall));
/** Whether two guide units are the same troop, spell or hero. */
export const sameUnit = (a: PracticeUnit, b: PracticeUnit) =>
  ('troop' in a && 'troop' in b && a.troop === b.troop) ||
  ('spell' in a && 'spell' in b && a.spell === b.spell) ||
  ('hero' in a && 'hero' in b && a.hero === b.hero);
/** A guide unit's name, as the client's tables give it. */
export const practiceUnitName = (unit: PracticeUnit) =>
  'troop' in unit
    ? TROOP_SOURCE[unit.troop as keyof typeof TROOP_SOURCE]
    : 'spell' in unit
      ? `${SPELL_NAMES[unit.spell]}${SPELL_NAMES[unit.spell].endsWith('Spell') ? '' : ' Spell'}`
      : HERO_SOURCE[unit.hero];
