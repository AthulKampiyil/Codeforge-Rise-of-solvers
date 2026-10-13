/**
 * World coordinates are bounded by the village grid, so squared distances cannot
 * overflow. Keep the arithmetic order explicit: browser Math.hypot implementations
 * otherwise disagree by a few bits in movement and projectile arrival times.
 */
export const distance2D = (x: number, y: number) => Math.sqrt(x * x + y * y);
/** Ordering/range checks only: same order as distance2D without the sqrt. */
export const distanceSquared2D = (x: number, y: number) => x * x + y * y;
