import catalog from '../../reference/troops/catalog.json' with { type: 'json' };
import type { SpellKind, TroopKind } from './data';

/**
 * Every original level of the troops and spells this game trains. See
 * reference/troops/README.md; a row describes its destination level, and its price and
 * duration are what reaching that level costs.
 */
export interface TroopLevel {
  level: number;
  hp: number;
  dps: number;
  housing: number;
  laboratory: number;
  cost: number;
  seconds: number;
  resource: 'gold' | 'elixir' | 'dark';
  /** The Healer alone heals, which the source carries as a negative damage rate. */
  heal?: number;
  /** Wall Breakers and Balloons alone damage what they die on. */
  deathDamage?: number;
}
export interface RosterEntry {
  /** Barracks, Dark Barracks or Siege Workshop. */
  building: string;
  /** A paid, temporary upgrade of an ordinary troop rather than a troop of its own. */
  superTroop: boolean;
  /** Production building level that unlocks it. */
  barracks: number;
  /** Town Hall the source says first offers it. */
  townhall: number;
  levels: readonly TroopLevel[];
}
/** Every producible troop the source defines, by its original name. */
export const TROOP_ROSTER = catalog.roster as unknown as Readonly<Record<string, RosterEntry>>;
/** The original record behind each local troop key. */
/**
 * The ten original troops come from the catalog map; the native roster added the rest, whose
 * rows the same pinned source already carries under their client names.
 */
const NATIVE_TROOP_NAMES = {
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
export const TROOP_NAMES = { ...catalog.troops, ...NATIVE_TROOP_NAMES } as Readonly<
  Record<TroopKind, string>
>;
export const TROOP_LEVELS = Object.fromEntries(
  Object.entries(TROOP_NAMES).map(([kind, name]) => [kind, TROOP_ROSTER[name].levels]),
) as Readonly<Record<TroopKind, readonly TroopLevel[]>>;
export const troopProgression = (kind: TroopKind, level: number) => TROOP_LEVELS[kind][level - 1];
/** Highest level the Laboratory can research, per troop. */
export const maxTroopLevelFor = (kind: TroopKind) => TROOP_LEVELS[kind].length;
export const MAX_TROOP_LEVEL = Math.max(...Object.values(TROOP_LEVELS).map((r) => r.length));

/** Mechanical columns a spell carries, in tiles and seconds. Absent means the source has
 * no such column for that spell, which is different from a column that is zero. */
export interface SpellMechanics {
  radius?: number;
  pulses?: number;
  interval?: number;
  deploy?: number;
  buildingDamage?: number;
  troopDamage?: number;
  preferredDamage?: number;
  freeze?: number;
  freezeOuter?: number;
  boost?: number;
  speedBoost?: number;
  speedBoost2?: number;
  attackSpeedBoost?: number;
  damageBoost?: number;
  poisonDps?: number;
  invisibility?: number;
  jump?: number;
  /** Housing space of copies the Clone Spell makes, and how long a copy lives. */
  duplicateHousing?: number;
  duplicateLifetime?: number;
  /** Housing space the Recall Spell may take back into the hand. */
  recallHousing?: number;
  /** Fraction of its maximum a revived hero returns with, and how far the spell reaches. */
  resurrect?: number;
  targeting?: number;
  stun?: number;
}
export interface SpellLevel {
  level: number;
  housing: number;
  laboratory: number;
  damage: number;
  heal: number;
  damageBoost: number;
  speedBoost: number;
  cost: number;
  seconds: number;
  resource: 'gold' | 'elixir' | 'dark';
  mechanics?: SpellMechanics;
}
export interface SpellRosterEntry {
  /** Spell Factory or Dark Spell Factory. */
  building: string;
  /** The Earthquake alone names one: it hits Walls five times as hard. */
  preferredTarget: string;
  /** What this spell cannot touch, read from the source rather than assumed. */
  immune: readonly string[];
  /** Factory level that unlocks it. */
  forge: number;
  levels: readonly SpellLevel[];
}
/** Every producible spell the source defines, by its original name. */
export const SPELL_ROSTER = catalog.spellRoster as unknown as Readonly<
  Record<string, SpellRosterEntry>
>;
/** The original record behind each local spell key. */
/**
 * The nine released spells come from the catalog map; the native roster added the rest, whose
 * rows the same pinned source already carries under their client names.
 */
const NATIVE_SPELL_NAMES = {
  totem: 'Totem Spell',
  poison: 'Poison',
  earthquake: 'Earthquake',
  haste: 'Haste',
  skeleton: 'Skeleton Spell',
  bat: 'Bat Spell',
  overgrowth: 'Overgrowth',
  iceblock: 'Ice Block',
  angry: 'AngrySpell',
} as const;
export const SPELL_NAMES = { ...catalog.spells, ...NATIVE_SPELL_NAMES } as Readonly<
  Record<SpellKind, string>
>;
export const SPELL_LEVELS = Object.fromEntries(
  Object.entries(SPELL_NAMES).map(([kind, name]) => [kind, SPELL_ROSTER[name].levels]),
) as Readonly<Record<SpellKind, readonly SpellLevel[]>>;
export const spellProgression = (kind: SpellKind, level: number) => SPELL_LEVELS[kind][level - 1];
export const maxSpellLevelFor = (kind: SpellKind) => SPELL_LEVELS[kind].length;
export const MAX_SPELL_LEVEL = Math.max(...Object.values(SPELL_LEVELS).map((r) => r.length));
