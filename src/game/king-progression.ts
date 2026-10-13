import { KING_SOURCE } from './townhall-catalog';

/**
 * Native base stats and destination-level upgrade prices. See docs/KING-COMBAT.md.
 *
 * The original table stores each upgrade's price and duration on the row below its
 * destination, and joins activation recovery through the ability table; both are resolved
 * in reference/townhall before they reach here.
 */
export const KING_LEVELS = KING_SOURCE.map(
  ({ hp, dps, recovery, cost, seconds, townhall, hall }) => ({
    hp,
    dps,
    recovery,
    cost,
    seconds,
    townhall,
    hall,
  }),
);
