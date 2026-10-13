import { namedLevels, sourceCount, TOWNHALL_TIERS } from './townhall-catalog';

/** Undiscounted Home Village values; the original rows are pinned in reference/townhall.
 * Source and compatibility notes: docs/WALL-PROGRESSION.md. */
export const WALL_LEVELS = namedLevels('Wall').map((row) => ({ hp: row.hp!, cost: row.cost }));

/** Maximum wall pieces at TH1 through the catalog ceiling. Existing extras are never removed. */
export const WALL_COUNTS = TOWNHALL_TIERS.map((_, index) => sourceCount('Wall', index + 1));
