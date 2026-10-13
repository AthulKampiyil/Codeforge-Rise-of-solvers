import type { SkeletonMode } from './skeleton-stats';
import type { TrapState } from './traps';
import native from '../../reference/skeleton-trap/native.json' with { type: 'json' };

export const SKELETON_ART_TIERS = [1, 3, 5] as const;
const tier = (level: number) => (level >= 5 ? 5 : level >= 3 ? 3 : 1);
export const skeletonTrapAsset = (mode: SkeletonMode | 'spent' = 'ground', level = 1) =>
  `/assets/buildings/skeleton-trap-native/${tier(level)}-${mode}.png`;
export const skeletonTrapTexture = (mode: SkeletonMode | 'spent' = 'ground', level = 1) =>
  `skeletontrap-native-${tier(level)}-${mode}`;
export const skeletonTrapArt = (level: number) => {
  const { atlas } = native.tiers[tier(level)];
  const width = atlas.width / atlas.pixelsPerNativeUnit,
    height = atlas.height / atlas.pixelsPerNativeUnit;
  return {
    texture: `skeletontrap-native-${tier(level)}`,
    asset: `/${atlas.path}`,
    frameWidth: atlas.width,
    frameHeight: atlas.height,
    frames: atlas.frames,
    // Measured ground/shadow center; visual calibration, not a recovered native camera transform.
    width: width * 1.5,
    originX: (-2 - atlas.bounds[0]) / width,
    originY: (24 - atlas.bounds[1]) / height,
  };
};
export const skeletonTrapFrame = (
  level: number,
  mode: SkeletonMode,
  state: TrapState | undefined,
  elapsed: number,
  reduced = false,
) => {
  const clips = native.tiers[tier(level)].clips;
  if (!state) return clips[mode].frames[0];
  if (reduced) return (state.spawned ?? 0) ? clips.spent.frames[0] : clips[mode].frames[0];
  const clip = clips[mode === 'air' ? 'air-trigger' : 'ground-trigger'];
  const frame = Math.min(
    clip.count - 1,
    Math.max(0, Math.floor((elapsed - state.activatedAt) * clip.fps + 1e-9)),
  );
  return clip.frames[frame];
};
export const skeletonAsset = (mode: SkeletonMode) => `/assets/characters/skeleton-v1/${mode}.webp`;
