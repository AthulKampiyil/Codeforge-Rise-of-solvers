import { seekingMineStats } from './seeking-mine-stats';

export const SEEKING_MINE_ART_FAMILIES = [1, 3, 5, 7] as const;
export const seekingMineFamily = (level: number) => {
  if (!seekingMineStats(level)) throw Error(`Unsupported native Seeking Air Mine level: ${level}`);
  return 1 + Math.floor((level - 1) / 2) * 2;
};
export const seekingMineTexture = (level = 1) => `seeking-mine-setup-${seekingMineFamily(level)}`;
export const seekingMinePreview = (level = 1) =>
  `/assets/buildings/seeking-mine-native/preview-${seekingMineFamily(level)}.png`;
// All eight original trap rows reference the same separate UI picture.
export const seekingMineAsset = () => '/assets/buildings/seeking-mine-native/info.png';
/** Local registration of original source coordinates to one isometric village tile. */
export const SEEKING_MINE_ART = {
  scale: 0.8,
  anchorX: 0,
  anchorY: 32,
  width: 104 * 0.8,
  height: 130 * 0.8,
  originX: 0.5,
  originY: 102 / 130,
  // Local height handoff. The original projectile clip also contains its own emergence.
  riseSeconds: 0.5,
} as const;
