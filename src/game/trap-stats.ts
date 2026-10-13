import type { BuildingKind } from './data';
import { namedLevels } from './townhall-catalog';
import { SEEKING_MINE_LEVELS } from './seeking-mine-stats';

export interface TrapLevel {
  damage: number;
  cost: number;
  seconds: number;
  /** Blast radius in tiles, where the trap has one. */
  radius?: number;
  /** Ejected housing space, for the Spring Trap. */
  capacity?: number;
}
const trap = (name: string): TrapLevel[] =>
  namedLevels(name).map((row) => ({
    damage: row.damage!,
    cost: row.cost,
    seconds: row.seconds,
    ...(row.radius ? { radius: row.radius } : {}),
    ...(row.eject ? { capacity: row.eject } : {}),
  }));

/** Original Home Village rows; pinned in reference/townhall. Notes: docs/TRAP-PROGRESSION.md. */
export const TRAP_LEVELS = {
  // Only the four reconstructed coffin tiers spawn defenders; see docs/SKELETON-TRAP.md.
  skeletontrap: trap('Skeleton Trap'),
  seekingairmine: SEEKING_MINE_LEVELS,
  bomb: trap('Bomb'),
  giantbomb: trap('Giant Bomb'),
  airbomb: trap('Air Bomb'),
  springtrap: trap('Spring Trap'),
};

export function trapProgression(kind: BuildingKind, level: number) {
  return kind === 'skeletontrap' ||
    kind === 'seekingairmine' ||
    kind === 'bomb' ||
    kind === 'giantbomb' ||
    kind === 'airbomb' ||
    kind === 'springtrap'
    ? TRAP_LEVELS[kind][level - 1]
    : undefined;
}

/** Local animation duration; the survivor remains on its original ground tile. */
export const SPRING_AIRTIME = 0.6;
