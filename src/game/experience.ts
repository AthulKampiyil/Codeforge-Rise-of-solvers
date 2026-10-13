import catalog from '../../reference/experience/catalog.json' with { type: 'json' };

/**
 * Pinned client 18.400.21 chief experience curve (logic/experience_levels.csv). Each entry is the
 * XP a level needs to reach the next one; the last level is the cap. See
 * reference/experience/README.md.
 */
const POINTS = catalog.levels.map((l) => l.points);
export const MAX_CHIEF_LEVEL = POINTS.length;

/** Total XP at which each level begins: `STARTS[0]` is level 1 at zero. */
const STARTS = [0];
for (const points of POINTS.slice(0, -1)) STARTS.push(STARTS[STARTS.length - 1] + points);

export interface ChiefProgress {
  level: number;
  /** XP earned since this level began. */
  into: number;
  /** XP this level needs to reach the next; zero at the cap. */
  needed: number;
}

/** The chief level a lifetime XP total reaches, and how far it is into that level. */
export function chiefProgress(xp: number): ChiefProgress {
  const total = Math.max(0, Math.floor(xp) || 0);
  let low = 0,
    high = STARTS.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (STARTS[mid] <= total) low = mid;
    else high = mid - 1;
  }
  const level = low + 1;
  if (level === MAX_CHIEF_LEVEL) return { level, into: 0, needed: 0 };
  return { level, into: total - STARTS[low], needed: POINTS[low] };
}

/**
 * XP for finishing a build, upgrade or hero upgrade: the whole square root of its scheduled
 * seconds, so an instant build earns nothing and the original's 20-day upgrade earns 1,314.
 * Finishing early with gems or a book keeps the scheduled duration.
 */
export const completionXp = (start: number | undefined, end: number | undefined) =>
  start === undefined || end === undefined
    ? 0
    : Math.floor(Math.sqrt(Math.max(0, Math.round((end - start) / 1000))));

/** Finish a timer now, keeping its scheduled length for {@link completionXp}. */
export function finishTimerNow(timer: { upgradeStart?: number; upgradeEnd?: number }, now: number) {
  if (timer.upgradeEnd === undefined) return;
  if (timer.upgradeStart !== undefined) timer.upgradeStart -= timer.upgradeEnd - now;
  timer.upgradeEnd = now;
}
