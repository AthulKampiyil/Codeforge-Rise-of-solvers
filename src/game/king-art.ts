import type { Unit, Building } from './model';
import type { Defender } from './defenders';
import { BUILDINGS } from './data';

export const KING_DIRECTIONS = ['front-left', 'front-right', 'back-left', 'back-right'] as const;
export type KingDirection = (typeof KING_DIRECTIONS)[number];
export const KING_ART = {
  cell: 256,
  baseline: 216,
  width: 88,
  healthHeight: 64,
  walkFrameMs: 160,
} as const;
export const kingAtlas = (direction: KingDirection) =>
  `/assets/characters/king-v1/${direction}.webp`;
export const kingTexture = (direction: KingDirection) => `king-${direction}`;

/** Four authored views preserve the weapon hand and armored side without mirroring. */
export function kingPose(
  unit: Unit,
  target: Building | Unit | Defender | undefined,
  elapsed: number,
  rate: number,
  reduced: boolean,
  previous: KingDirection = 'front-left',
) {
  const center =
    target && target.hp > 0
      ? {
          x: target.x + ('stored' in target ? BUILDINGS[target.kind].size / 2 : 0),
          y: target.y + ('stored' in target ? BUILDINGS[target.kind].size / 2 : 0),
        }
      : undefined;
  const waypoint = unit.path.find((p) => Math.hypot(p.x - unit.x, p.y - unit.y) > 0.03);
  const heading = unit.attacking ? center : (waypoint ?? center);
  const dx = heading ? heading.x - unit.x - (heading.y - unit.y) : 0;
  const dy = heading ? heading.x - unit.x + heading.y - unit.y : 0;
  const side = Math.abs(dx) > 0.03 ? (dx < 0 ? 'left' : 'right') : previous.split('-')[1];
  const view = Math.abs(dy) > 0.03 ? (dy > 0 ? 'front' : 'back') : previous.split('-')[0];
  const direction = `${view}-${side}` as KingDirection;
  let frame = 0;
  if (!reduced && unit.attacking) {
    // Damage lands when cooldown resets. The windup anticipates the next hit;
    // the first hit is immediate under the current simulation's combat rules.
    const phase = 1 - Math.max(0, Math.min(rate, unit.cooldown)) / rate;
    frame = phase < 0.12 ? 6 : phase < 0.24 ? 7 : phase < 0.4 ? 8 : phase >= 0.78 ? 5 : 0;
  } else if (!reduced && waypoint) {
    frame = 1 + (Math.floor((elapsed * 1000) / KING_ART.walkFrameMs + unit.id) % 4);
  }
  return { direction, frame, facing: side === 'left' ? -1 : 1 };
}
