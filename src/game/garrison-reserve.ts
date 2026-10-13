import {
  garrisonStats,
  isGarrisonKind,
  isSpawnedGarrisonKind,
  type GarrisonKind,
} from './garrison-kinds';

export { garrisonStats, type GarrisonKind } from './garrison-kinds';
export interface GarrisonTroop {
  kind: GarrisonKind;
  level: number;
  count: number;
}
export interface GarrisonReserve {
  castleId: number;
  mode: 'guard' | 'sleep';
  troops: GarrisonTroop[];
  released: number;
}
export interface GarrisonTarget {
  id: number;
  x: number;
  y: number;
  hp: number;
  flying: boolean;
  spawnedAt?: number;
  ejected?: boolean;
}

/** Explicit replay/input bound, unrelated to a Castle's normal housing capacity. */
export const MAX_GARRISON_TROOPS = 700;
export const GARRISON_TRIGGER_RADIUS = 13;

/** Stable FNV-1a rank; a local deterministic stand-in for the documented random tie order. */
function tieRank(seed: number, castleId: number, kind: GarrisonKind) {
  let hash = 2166136261;
  for (const c of `${seed}:${castleId}:${kind}`) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/**
 * Fail atomically: an unsupported member must not silently disappear from a campaign.
 * Release order follows Supercell's documented rule: increasing housing space, a random
 * order between different troops of equal housing (seeded from the battle, so replays and
 * seeks agree), and the lowest level first within one troop type.
 */
export function createGarrisonReserve(
  castleId: number,
  troops: readonly GarrisonTroop[],
  mode: 'guard' | 'sleep' = 'guard',
  seed = 0,
): GarrisonReserve {
  if (!Number.isSafeInteger(castleId) || castleId <= 0 || !['guard', 'sleep'].includes(mode))
    throw new Error('Invalid garrison Castle or mode');
  let total = 0;
  const normalized: GarrisonTroop[] = [];
  for (const troop of troops) {
    // Secondary, summoned and trap-spawned units never occupy a bunker.
    if (!troop || !isGarrisonKind(troop.kind) || isSpawnedGarrisonKind(troop.kind))
      throw new Error('Unsupported garrison troop');
    garrisonStats(troop.kind, troop.level);
    if (!Number.isSafeInteger(troop.count) || troop.count <= 0)
      throw new Error('Invalid garrison troop count');
    total += troop.count;
    if (total > MAX_GARRISON_TROOPS) throw new Error('Garrison exceeds replay troop limit');
    const existing = normalized.find((t) => t.kind === troop.kind && t.level === troop.level);
    if (existing) existing.count += troop.count;
    else normalized.push({ ...troop });
  }
  normalized.sort(
    (a, b) =>
      garrisonStats(a.kind, a.level).housing - garrisonStats(b.kind, b.level).housing ||
      (a.kind === b.kind
        ? a.level - b.level
        : tieRank(seed, castleId, a.kind) - tieRank(seed, castleId, b.kind) ||
          (a.kind < b.kind ? -1 : 1)),
  );
  return { castleId, mode, troops: normalized, released: 0 };
}

export function garrisonCanTarget(target: GarrisonTarget, troop: GarrisonTroop, at: number) {
  const stats = garrisonStats(troop.kind, troop.level);
  return (
    target.hp > 0 &&
    !target.ejected &&
    (target.spawnedAt ?? 0) <= at &&
    (target.flying ? stats.airTargets : stats.groundTargets)
  );
}

/** One search event, not a frame clock. Timing belongs to the versioned battle scheduler. */
export function releaseGarrisonTroop(
  reserve: GarrisonReserve,
  castle: { id: number; hp: number; centerX: number; centerY: number },
  targets: readonly GarrisonTarget[],
  at: number,
): { kind: GarrisonKind; level: number; ordinal: number; targetId: number } | null {
  if (
    reserve.mode !== 'guard' ||
    castle.id !== reserve.castleId ||
    castle.hp <= 0 ||
    !Number.isFinite(at) ||
    at < 0
  )
    return null;
  for (const troop of reserve.troops) {
    if (!troop.count) continue;
    let nearest: GarrisonTarget | undefined;
    let nearestDistance = GARRISON_TRIGGER_RADIUS ** 2;
    for (const target of targets) {
      if (!garrisonCanTarget(target, troop, at)) continue;
      const distance = (target.x - castle.centerX) ** 2 + (target.y - castle.centerY) ** 2;
      if (
        distance < nearestDistance ||
        (nearest && distance === nearestDistance && target.id < nearest.id)
      ) {
        nearest = target;
        nearestDistance = distance;
      }
    }
    if (!nearest) continue;
    troop.count--;
    return {
      kind: troop.kind,
      level: troop.level,
      ordinal: reserve.released++,
      targetId: nearest.id,
    };
  }
  return null;
}
