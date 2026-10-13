import { ARCHER_TOWER_LEVELS, ARCHER_TOWER } from './archer-tower-stats';
import infernoCatalog from '../../reference/inferno/catalog.json' with { type: 'json' };
import { CANNON_LEVELS, CANNON } from './cannon-stats';
import { MORTAR_LEVELS, MORTAR } from './mortar-stats';
import type { BuildingKind } from './data';
import { XBOW_LEVELS, XBOW } from './xbow-stats';
import { TESLA_LEVELS, TESLA } from './tesla-stats';
import { BOMB_TOWER_LEVELS, BOMB_TOWER } from './bomb-tower-stats';
import { WIZARD_TOWER_LEVELS, WIZARD_TOWER } from './wizard-tower-stats';
import { namedLevels } from './townhall-catalog';

/** Undiscounted original Air Defense rows; pinned in reference/townhall. */
export const AIR_DEFENSE_LEVELS = namedLevels('Air Defense').map((row) => ({
  dps: row.dps!,
  hp: row.hp!,
  cost: row.cost,
  seconds: row.seconds,
}));

/** Undiscounted destination-level values. See the defense progression audits in docs/. */
export const DEFENSE_PROGRESSION = {
  inferno: infernoCatalog.levels.map((row) => ({ ...row, dps: row.weapon.dps[0] })),
  bombtower: BOMB_TOWER_LEVELS,
  tesla: TESLA_LEVELS,
  airdefense: AIR_DEFENSE_LEVELS,
  wizardtower: WIZARD_TOWER_LEVELS,
  cannon: CANNON_LEVELS,
  mortar: MORTAR_LEVELS,
  archertower: ARCHER_TOWER_LEVELS,
} as const;

/** Normal mode; geared-up variants are not yet supported. */
export const DEFENSE_WEAPONS = {
  inferno: { range: 9, rate: 0.128 },
  xbow: { range: XBOW.groundRange, rate: XBOW.interval },
  bombtower: { range: BOMB_TOWER.range, rate: BOMB_TOWER.interval, splash: BOMB_TOWER.splash },
  tesla: { range: TESLA.range, rate: TESLA.interval },
  airdefense: { range: 10, rate: 1 },
  wizardtower: {
    range: WIZARD_TOWER.range,
    rate: WIZARD_TOWER.interval,
    splash: WIZARD_TOWER.splash,
  },
  cannon: { range: CANNON.range, rate: CANNON.interval },
  mortar: {
    range: MORTAR.range,
    minRange: MORTAR.minRange,
    rate: MORTAR.interval,
    splash: MORTAR.splash,
  },
  archertower: { range: ARCHER_TOWER.range, rate: ARCHER_TOWER.interval },
} as const;

/** Returns a destination's stats when this defense has been audited. */
export function defenseProgression(kind: BuildingKind, level: number) {
  if (kind === 'xbow') return XBOW_LEVELS[level - 1];
  return kind === 'inferno' ||
    kind === 'bombtower' ||
    kind === 'tesla' ||
    kind === 'cannon' ||
    kind === 'archertower' ||
    kind === 'mortar' ||
    kind === 'airdefense' ||
    kind === 'wizardtower'
    ? DEFENSE_PROGRESSION[kind][level - 1]
    : undefined;
}
