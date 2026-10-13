import catalog from '../../reference/inferno/catalog.json' with { type: 'json' };

export type InfernoMode = 'single' | 'multi';
export const validInfernoMode = (value: unknown): value is InfernoMode | undefined =>
  value === undefined || value === 'single' || value === 'multi';
export type InfernoDamageStage = 0 | 1 | 2;

/** Source base tiers only. Mini-level arithmetic is not inferred or clamped. */
export function infernoStats(level: number) {
  if (!Number.isInteger(level) || level < 1 || level > catalog.levels.length)
    throw new Error(`Unsupported Inferno Tower level: ${level}`);
  return catalog.levels[level - 1];
}

/** Both switch fields are measured from acquisition, not from the previous stage. */
export function infernoDamageStage(
  mode: InfernoMode,
  lockedMs: number,
  level: number,
): InfernoDamageStage {
  const { weapon } = infernoStats(level);
  if (!Number.isFinite(lockedMs) || lockedMs < 0)
    throw new Error(`Invalid Inferno lock duration: ${lockedMs}`);
  if (mode === 'multi') return 0;
  if (lockedMs >= weapon.switchTimesMs[1]) return 2;
  if (lockedMs >= weapon.switchTimesMs[0]) return 1;
  return 0;
}

export function infernoDps(mode: InfernoMode, lockedMs: number, level: number) {
  return infernoStats(level).weapon.dps[infernoDamageStage(mode, lockedMs, level)];
}

export interface InfernoLock {
  targetId: number;
  /** Simulation seconds. */
  acquiredAt: number;
}

/**
 * Retain valid locks before filling empty slots. The caller supplies eligible IDs
 * in acquisition priority order after range, visibility and flight-layer checks.
 * `at` uses simulation seconds. Mode changes must clear the previous locks.
 * Timing uses the caller's simulation clock; this function does not impose a tick,
 * reacquisition delay, ammo rule or damage scheduling policy.
 */
export function reconcileInfernoLocks(
  previous: readonly InfernoLock[],
  candidates: readonly number[],
  mode: InfernoMode,
  level: number,
  at: number,
): InfernoLock[] {
  const stats = infernoStats(level);
  const capacity = mode === 'multi' ? stats.weapon.alternateTargets : 1;
  if (!Number.isFinite(at) || at < 0) throw new Error(`Invalid Inferno lock time: ${at}`);
  const eligible = new Set(candidates);
  if (candidates.some((id) => !Number.isSafeInteger(id)))
    throw new Error('Invalid Inferno target ID');
  const used = new Set<number>();
  const locks: InfernoLock[] = [];
  for (const lock of previous) {
    if (!Number.isFinite(lock.acquiredAt) || lock.acquiredAt < 0 || lock.acquiredAt > at)
      throw new Error('Invalid Inferno acquisition time');
    if (locks.length < capacity && eligible.has(lock.targetId) && !used.has(lock.targetId)) {
      locks.push({ ...lock });
      used.add(lock.targetId);
    }
  }
  for (const targetId of candidates) {
    if (locks.length === capacity) break;
    if (!used.has(targetId)) {
      locks.push({ targetId, acquiredAt: at });
      used.add(targetId);
    }
  }
  return locks;
}

/** Strict optional battle setup value; malformed tiers never throw during import validation. */
export function validInfernoAmmo(value: unknown, level: unknown): value is number | undefined {
  if (value === undefined) return true;
  return (
    typeof level === 'number' &&
    Number.isInteger(level) &&
    level >= 1 &&
    level <= catalog.levels.length &&
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= catalog.levels[level - 1].weapon.ammoCount
  );
}
