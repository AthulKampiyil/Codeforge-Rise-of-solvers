import native from '../../reference/full-client/progression.json' with { type: 'json' };
import type { BuildingKind } from './data';
import { namedLevels, sourceCount, TOWNHALL_TIERS } from './townhall-catalog';

const rows = (name: string) =>
  namedLevels(name).map((row) => ({ hp: row.hp!, cost: row.cost, seconds: row.seconds }));
const housed = (name: string) =>
  namedLevels(name).map((row) => ({
    hp: row.hp!,
    cost: row.cost,
    seconds: row.seconds,
    capacity: row.production!,
  }));

/** Undiscounted Home Village army facilities. Sources: docs/FACILITY-PROGRESSION.md. */
export const FACILITY_LEVELS = {
  barracks: rows('Barracks'),
  laboratory: rows('Laboratory'),
  spellfactory: housed('Spell Factory'),
};

export const FACILITY_COUNTS = {
  barracks: TOWNHALL_TIERS.map((_, i) => sourceCount('Barracks', i + 1)),
  laboratory: TOWNHALL_TIERS.map((_, i) => sourceCount('Laboratory', i + 1)),
  spellfactory: TOWNHALL_TIERS.map((_, i) => sourceCount('Spell Factory', i + 1)),
};

export function facilityProgression(kind: BuildingKind, level: number) {
  return kind === 'barracks' || kind === 'laboratory' || kind === 'spellfactory'
    ? FACILITY_LEVELS[kind][level - 1]
    : undefined;
}

/** No completed factory means no housing; imported extra factories do not stack. */
export const spellFactoryCapacity = (level: number) =>
  native.buildings.spellfactory.levels[level - 1]?.capacity ?? 0;
