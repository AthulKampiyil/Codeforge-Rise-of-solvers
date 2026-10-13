import {
  MAX_SPELL_LEVEL,
  maxSpellLevelFor,
  SPELL_LEVELS,
  SPELL_NAMES,
  SPELL_ROSTER,
  spellProgression,
} from './troop-progression';
import type { SpellKind } from './data';

export type { SpellLevel } from './troop-progression';
export { MAX_SPELL_LEVEL, maxSpellLevelFor, SPELL_LEVELS, spellProgression };
/** Spell timing is this game's own sequencing, not a per-level source value. */
export const SPELL_PULSE_INTERVAL = 0.3;
export const HEAL_PULSES = 41;
export const RAGE_PULSES = 60;
export const RAGE_LINGER = 1;
export const HEAL_HERO_MULTIPLIER = 0.55;
export const RAGE_HERO_MULTIPLIER = 0.5;
/**
 * The Lightning Spell's stun, which the source carries as its own `FreezeTimeMS`. It is
 * asserted against that column in tests/spell-progression.test.ts.
 */
export const LIGHTNING_STUN = 0.1;
/** Seconds the Freeze Spell holds a defence or defender, straight from its own source row. */
export const freezeSeconds = (level = 1) =>
  spellProgression('freeze', level)?.mechanics?.freeze ??
  spellProgression('freeze', 1).mechanics!.freeze!;
/** The Freeze Spell's radius, which the source states per level and never varies. */
export const FREEZE_RADIUS = spellProgression('freeze', 1).mechanics!.radius!;
/**
 * How long the Invisibility Spell's ring lasts, which the source states as a pulse count and
 * an interval rather than a duration, and how long a unit stays hidden after leaving it.
 */
export const invisibilitySeconds = (level = 1) => {
  const m = (spellProgression('invisibility', level) ?? spellProgression('invisibility', 1))
    .mechanics!;
  return m.pulses! * m.interval!;
};
export const INVISIBILITY_LINGER = spellProgression('invisibility', 1).mechanics!.invisibility!;
export const INVISIBILITY_INTERVAL = spellProgression('invisibility', 1).mechanics!.interval!;
export const INVISIBILITY_RADIUS = spellProgression('invisibility', 1).mechanics!.radius!;
const mechanics = (kind: 'jump' | 'clone' | 'recall' | 'revive', level: number) =>
  (spellProgression(kind, level) ?? spellProgression(kind, 1)).mechanics!;
/** How long the Jump Spell's ring holds a breach open, stated as pulses and an interval. */
export const jumpSeconds = (level = 1) => {
  const m = mechanics('jump', level);
  return m.pulses! * m.interval!;
};
/** How long a troop keeps vaulting after stepping out of the ring. */
export const JUMP_LINGER = mechanics('jump', 1).jump!;
export const JUMP_RADIUS = mechanics('jump', 1).radius!;
/** Housing space of copies the Clone Spell may make, and how long a copy lives. */
export const cloneHousing = (level = 1) => mechanics('clone', level).duplicateHousing!;
export const CLONE_LIFETIME = mechanics('clone', 1).duplicateLifetime!;
export const CLONE_RADIUS = mechanics('clone', 1).radius!;
/** Housing space of troops the Recall Spell may take back into the hand. */
export const recallHousing = (level = 1) => mechanics('recall', level).recallHousing!;
export const RECALL_RADIUS = mechanics('recall', 1).radius!;
/** Fraction of its maximum a revived hero returns with, and how far the spell reaches. */
export const reviveFraction = (level = 1) => mechanics('revive', level).resurrect!;
export const REVIVE_RADIUS = mechanics('revive', 1).targeting!;
/** Native movement-speed points convert to tiles/second at eight points per tile. */
export const SPELL_SPEED_SCALE = 8;

/**
 * Client row names of every Home Village spell, for the native engine's own lookups. The
 * released nine keep the values their own tables state; the rest arrived with version 51.
 */
export const SPELL_SOURCE: Record<SpellKind, string> = SPELL_NAMES;
export const maxSpellLevel = maxSpellLevelFor;
/** Which factory prepares the spell; dark spells are researched with dark elixir. */
export const spellFactory = (kind: SpellKind) =>
  SPELL_ROSTER[SPELL_NAMES[kind]].building === 'Dark Spell Factory'
    ? ('darkspellfactory' as const)
    : ('spellfactory' as const);
export const spellFactoryLevel = (kind: SpellKind) => SPELL_ROSTER[SPELL_NAMES[kind]].forge;
