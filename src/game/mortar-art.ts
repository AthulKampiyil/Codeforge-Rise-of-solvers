import { MORTAR_LEVELS } from './mortar-stats';

export const MORTAR_ART_LEVELS = MORTAR_LEVELS.map((row) => row.level);
export const mortarTexture = (level = 1) => (level === 1 ? 'mortar' : `mortar-level-${level}`);
export const mortarAsset = (level = 1) => `/assets/buildings/mortar-native/level-${level}.png`;
/** Common source bounds [-84,-22,89,146], registered to the local 3×3 footprint. */
export const MORTAR_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  altitudeScale: 0.8,
  width: 173 * 1.2,
  height: 168 * 1.2,
  originX: 84 / 173,
  originY: 102 / 168,
};
