import {
  SPELLS,
  SPELL_KEYS,
  TROOPS,
  TROOP_KEYS,
  type SpellKind,
  type TroopKind,
} from '../game/data';
import { emptyArmy, emptySpells } from '../game/army';
import type { Army, SpellBook } from '../game/model';

/** A named troop/spell composition kept by the developer tools, outside the three in-game slots. */
export interface ArmyConfig {
  name: string;
  army: Army;
  spells: SpellBook;
}

/**
 * Fill `capacity` housing from `kinds`, giving every kind an equal share and spending the
 * remainder on the cheapest troop. An empty roster (or no housing) returns an empty army.
 */
export function distributeArmy(capacity: number, kinds: readonly TroopKind[]): Army {
  const army = emptyArmy();
  const roster = kinds.filter((kind) => TROOPS[kind].space > 0);
  if (!roster.length || capacity <= 0) return army;
  const share = capacity / roster.length;
  for (const kind of roster) army[kind] = Math.floor(share / TROOPS[kind].space);
  const cheapest = roster.reduce((a, b) => (TROOPS[b].space < TROOPS[a].space ? b : a));
  let used = roster.reduce((n, kind) => n + army[kind] * TROOPS[kind].space, 0);
  const unit = TROOPS[cheapest].space;
  while (used + unit <= capacity) {
    army[cheapest]++;
    used += unit;
  }
  return army;
}
/** Every unit of `capacity` spent on one troop. */
export function singleArmy(capacity: number, kind: TroopKind): Army {
  const army = emptyArmy();
  army[kind] = Math.max(0, Math.floor(capacity / TROOPS[kind].space));
  return army;
}
/** The spell equivalent of `distributeArmy`, over spell housing. */
export function distributeSpells(capacity: number, kinds: readonly SpellKind[]): SpellBook {
  const spells = emptySpells();
  const roster = kinds.filter((kind) => SPELLS[kind].space > 0);
  if (!roster.length || capacity <= 0) return spells;
  const share = capacity / roster.length;
  for (const kind of roster) spells[kind] = Math.floor(share / SPELLS[kind].space);
  const cheapest = roster.reduce((a, b) => (SPELLS[b].space < SPELLS[a].space ? b : a));
  let used = roster.reduce((n, kind) => n + spells[kind] * SPELLS[kind].space, 0);
  const unit = SPELLS[cheapest].space;
  while (used + unit <= capacity) {
    spells[cheapest]++;
    used += unit;
  }
  return spells;
}

const KEY = 'crown-clan-developer-armies';
const CONFIG_LIMIT = 12;
const NAME_LIMIT = 32;
const countRecord = (value: unknown, keys: readonly string[], ceiling: number) =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  keys.every((key) => {
    const count = (value as Record<string, unknown>)[key];
    return (
      count === undefined ||
      (Number.isInteger(count) && (count as number) >= 0 && (count as number) <= ceiling)
    );
  });
const validConfig = (value: unknown): value is ArmyConfig =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as ArmyConfig).name === 'string' &&
  countRecord((value as ArmyConfig).army, TROOP_KEYS, 9999) &&
  countRecord((value as ArmyConfig).spells, SPELL_KEYS, 999);
/** Absent troops (an older stored config) read as zero rather than invalidating the config. */
const complete = (config: ArmyConfig): ArmyConfig => ({
  name: config.name.slice(0, NAME_LIMIT),
  army: { ...emptyArmy(), ...config.army },
  spells: { ...emptySpells(), ...config.spells },
});

/** Stored configurations, newest last. Unreadable or malformed storage reads as empty. */
export function readArmyConfigs(storage: Storage | undefined = safeStorage()): ArmyConfig[] {
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? 'null');
    return Array.isArray(raw) ? raw.filter(validConfig).slice(0, CONFIG_LIMIT).map(complete) : [];
  } catch {
    return [];
  }
}
/** Add or replace a configuration by name; the oldest is dropped past the limit. */
export function writeArmyConfig(
  config: ArmyConfig,
  storage: Storage | undefined = safeStorage(),
): ArmyConfig[] {
  const name = config.name.trim().slice(0, NAME_LIMIT);
  if (!name) throw Error('Name this army configuration first.');
  const kept = readArmyConfigs(storage).filter((entry) => entry.name !== name);
  const configs = [...kept, complete({ ...config, name })].slice(-CONFIG_LIMIT);
  persist(configs, storage);
  return configs;
}
export function deleteArmyConfig(
  name: string,
  storage: Storage | undefined = safeStorage(),
): ArmyConfig[] {
  const configs = readArmyConfigs(storage).filter((entry) => entry.name !== name);
  persist(configs, storage);
  return configs;
}
function persist(configs: ArmyConfig[], storage: Storage | undefined) {
  try {
    storage?.setItem(KEY, JSON.stringify(configs));
  } catch {
    /* Configurations are a convenience; a full or blocked store is not an error. */
  }
}
function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
