import type { NativeStage } from './native-campaign';
import { infernoStats } from './inferno-weapon';

export interface NativeInfernoState {
  id: number;
  x: number;
  y: number;
  level: number;
  /** Preserve the literal active layout bit; do not fall back to draft/war modes. */
  attackMode: boolean;
  ammunition: number;
}

/** Validate explicit source state before campaign conversion can consume it.
 * Coordinates remain in the original map grid; no defaults or level clamping.
 */
export function nativeInfernoStates(stage: NativeStage): NativeInfernoState[] {
  const placements = stage.buildings.filter(([data]) => data === 1000027);
  const records = stage.infernoStates ?? [];
  if (records.length !== placements.length) throw Error('Missing or extra Inferno campaign state');
  const ids = new Set<number>(),
    positions = new Set<string>();
  return records.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw Error('Invalid Inferno campaign state');
    const r = raw as Record<string, unknown>;
    if (
      r.data !== 1000027 ||
      !['id', 'x', 'y', 'lvl', 'ammo'].every((key) => Number.isSafeInteger(r[key])) ||
      typeof r.attack_mode !== 'boolean'
    )
      throw Error('Invalid Inferno campaign fields');
    const id = r.id as number,
      x = r.x as number,
      y = r.y as number,
      level = (r.lvl as number) + 1,
      ammunition = r.ammo as number;
    const key = `${x}:${y}:${level}`;
    if (
      id < 0 ||
      ids.has(id) ||
      positions.has(key) ||
      placements.filter(([, px, py, pl]) => px === x && py === y && pl === level).length !== 1
    )
      throw Error('Unmatched or duplicate Inferno campaign state');
    if (ammunition < 0 || ammunition > infernoStats(level).weapon.ammoCount)
      throw Error('Invalid Inferno campaign ammunition');
    ids.add(id);
    positions.add(key);
    return { id, x, y, level, attackMode: r.attack_mode, ammunition };
  });
}
