import native from '../../reference/full-client/progression.json' with { type: 'json' };
import type { BuildingKind } from './data';
import { namedLevels, sourceCount, TOWNHALL_TIERS } from './townhall-catalog';

/** Undiscounted Home Village values; the original rows are pinned in reference/townhall. */
export const CAMP_LEVELS = namedLevels('Army Camp').map((row) => ({
  capacity: row.housing!,
  hp: row.hp!,
  cost: row.cost,
  seconds: row.seconds,
}));
/** Maximum camps at TH1 through the catalog ceiling; this game matches the original counts. */
export const CAMP_COUNTS = TOWNHALL_TIERS.map((_, index) => sourceCount('Army Camp', index + 1));
export const campCapacity = (level: number) =>
  level > 8
    ? (native.buildings.camp.levels[level - 1]?.capacity ?? 0)
    : CAMP_LEVELS[Math.min(CAMP_LEVELS.length, Math.max(1, level)) - 1].capacity;
export const campProgression = (kind: BuildingKind, level: number) =>
  kind === 'camp' ? CAMP_LEVELS[Math.min(CAMP_LEVELS.length, Math.max(1, level)) - 1] : undefined;
