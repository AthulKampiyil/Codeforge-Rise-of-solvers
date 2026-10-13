import native from '../../reference/skeleton-trap/native.json' with { type: 'json' };
import { skeletonTrapArt, skeletonTrapAsset, skeletonTrapTexture } from './skeleton-art';

/**
 * The Ghost Trap row names original Skeleton Trap coffin exports from sc/buildings.sc: armed
 * `troop_trap_land_lvl3_setup`, triggered `troop_trap_land_lvl1` and broken
 * `troop_trap_land_lvl1_unarmed`. All three are already captured losslessly by the Skeleton Trap
 * native import (tiers 3 and 1), so the Ghost Trap draws those original frames directly.
 */
export const GHOST_TRAP_EXPORTS = {
  armed: { tier: 3, clip: 'ground' },
  triggered: { tier: 1, clip: 'ground-trigger' },
  broken: { tier: 1, clip: 'spent' },
} as const;
const armed = skeletonTrapArt(GHOST_TRAP_EXPORTS.armed.tier);

/** Preview registration (fallback sprite, placement ghost, portrait): the armed tier-3 coffin. */
export const GHOST_TRAP_ART = {
  width: armed.width,
  height: (armed.width * armed.frameHeight) / armed.frameWidth,
  originX: armed.originX,
  originY: armed.originY,
};
export function ghostTrapTexture(level: number, variant?: string) {
  void level;
  void variant;
  return skeletonTrapTexture('ground', GHOST_TRAP_EXPORTS.armed.tier);
}
export function ghostTrapAsset(level: number, variant?: string) {
  void level;
  void variant;
  return skeletonTrapAsset('ground', GHOST_TRAP_EXPORTS.armed.tier);
}
/** The atlas frame and registration for a state: armed, the 24-fps trigger clip, or broken. */
export function ghostTrapFrame(activatedAt: number | undefined, elapsed: number, reduced: boolean) {
  const pick = (
    entry: { tier: 1 | 3; clip: 'ground' | 'ground-trigger' | 'spent' },
    frame: number,
  ) => {
    const clip = native.tiers[entry.tier].clips[entry.clip];
    return {
      art: skeletonTrapArt(entry.tier),
      frame: clip.frames[Math.min(clip.count - 1, frame)],
    };
  };
  if (activatedAt === undefined) return pick(GHOST_TRAP_EXPORTS.armed, 0);
  // Reduced motion shows the broken coffin once the trap has fired.
  if (reduced) return pick(GHOST_TRAP_EXPORTS.broken, 0);
  return pick(
    GHOST_TRAP_EXPORTS.triggered,
    Math.max(0, Math.floor((elapsed - activatedAt) * 24 + 1e-9)),
  );
}
