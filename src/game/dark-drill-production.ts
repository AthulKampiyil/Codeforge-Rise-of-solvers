import { darkDrillStats } from './dark-drill-stats';

export function darkDrillProduction(level: number) {
  const row = darkDrillStats(level);
  return {
    perHour: row.production.per100Hours / 100,
    capacity: row.production.capacity,
  };
}

/** Preserve already-earned legacy overflow; resume production after collection creates space. */
export function produceDarkElixir(
  level: number,
  stored: number,
  seconds: number,
  supercharge: { production: number; capacity: number } = { production: 0, capacity: 0 },
) {
  const base = darkDrillProduction(level);
  const perHour = base.perHour + supercharge.production;
  const capacity = base.capacity + supercharge.capacity;
  const safeStored = !Number.isFinite(stored) || stored < 0 ? 0 : stored;
  const safeSeconds = !Number.isFinite(seconds) || seconds < 0 ? 0 : seconds;
  return Math.max(safeStored, Math.min(capacity, safeStored + (safeSeconds * perHour) / 3600));
}
