import source from '../../reference/full-client/progression.json' with { type: 'json' };
import type { Building } from './model';
import { SPELL_KEYS, TROOP_KEYS, type TroopKind, type SpellKind } from './data';
import { superOriginal } from './special-troops';
import { SPELL_NAMES, SPELL_ROSTER } from './troop-progression';

/** Supported Home Village unlocks. References: docs/ARMY-UNLOCKS.md. */
export const TROOP_UNLOCK: Record<TroopKind, number> = {
  ...(Object.fromEntries(
    Object.entries(source.troopDefs).map(([kind, row]) => [kind, Number(row.BarrackLevel)]),
  ) as Record<TroopKind, number>),
  swordsman: 1,
  archer: 2,
  giant: 3,
  goblin: 4,
  wallbreaker: 5,
  balloon: 6,
  wizard: 7,
  healer: 8,
  dragon: 9,
  pekka: 10,
};
/**
 * Spell Factory level that offers each spell, straight from the source's own `SpellForgeLevel`.
 * Every spell this game casts is a Spell Factory spell; the dark ones need a building the
 * village does not yet have.
 */
export const SPELL_UNLOCK = Object.fromEntries(
  SPELL_KEYS.map((kind) => [kind, SPELL_ROSTER[SPELL_NAMES[kind]].forge]),
) as Record<SpellKind, number>;

export function facilityLevel(
  buildings: Building[],
  kind: 'barracks' | 'darkbarracks' | 'spellfactory' | 'darkspellfactory' | 'workshop',
) {
  return buildings.reduce(
    (level, b) => (b.kind === kind && !b.constructing ? Math.max(level, b.level) : level),
    0,
  );
}

export const troopFacility = (kind: TroopKind) =>
  source.troopDefs[kind].ProductionBuilding === 'Siege Workshop'
    ? 'workshop'
    : source.troopDefs[kind].ProductionBuilding === 'Dark Barracks'
      ? 'darkbarracks'
      : 'barracks';
/** Re-exported for callers that ask a spell where it is prepared. */
export { spellFactory } from './spell-progression';
/**
 * Troops that a production building's `level` first unlocks: those it trains itself, never a
 * super troop (a super troop is opened by a boost on its original troop, not a building level).
 */
export const facilityUnlocks = (facility: string, level: number) =>
  TROOP_KEYS.filter(
    (kind) =>
      troopFacility(kind) === facility && TROOP_UNLOCK[kind] === level && !superOriginal(kind),
  );
