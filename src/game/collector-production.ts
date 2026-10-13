import nativeProgressionSource from '../../reference/full-client/progression.json' with { type: 'json' };
import { produceDarkElixir, darkDrillProduction } from './dark-drill-production';
import { superchargeBonus } from './native-supercharge';

const nativeProgression = nativeProgressionSource as unknown as {
  buildings: Record<string, { levels: { production: number; productionCapacity: number }[] }>;
};

export type CollectorKind = 'goldmine' | 'collector' | 'darkdrill';
export const isCollector = (kind: string): kind is CollectorKind =>
  kind === 'goldmine' || kind === 'collector' || kind === 'darkdrill';

/**
 * Hourly production and capacity of a resource building, supercharges included. Every level
 * reads the pinned native row: the simulation, the Info panel and the fill artwork share it.
 */
export function collectorProduction(kind: CollectorKind, level: number, supercharge = 0) {
  const charged = superchargeBonus(kind, supercharge);
  if (kind === 'darkdrill') {
    const base = darkDrillProduction(level);
    return {
      perHour: base.perHour + charged.production,
      capacity: base.capacity + charged.capacity,
    };
  }
  const levels = nativeProgression.buildings[kind].levels;
  const row = levels[Math.min(levels.length, Math.max(1, Math.floor(level) || 1)) - 1];
  return {
    perHour: row.production + charged.production,
    capacity: row.productionCapacity + charged.capacity,
  };
}

/**
 * Produce for `seconds`. Stored produce above the current capacity (saves made under the old
 * prototype curve held up to 10,000 per level) is kept until collected, never clipped away;
 * production resumes once collection makes room.
 */
export function produceCollector(
  kind: CollectorKind,
  level: number,
  stored: number,
  seconds: number,
  supercharge = 0,
) {
  if (kind === 'darkdrill')
    return produceDarkElixir(level, stored, seconds, superchargeBonus(kind, supercharge));
  const { perHour, capacity } = collectorProduction(kind, level, supercharge);
  const safeStored = !Number.isFinite(stored) || stored < 0 ? 0 : stored;
  const safeSeconds = !Number.isFinite(seconds) || seconds < 0 ? 0 : seconds;
  return Math.max(safeStored, Math.min(capacity, safeStored + (safeSeconds * perHour) / 3600));
}
