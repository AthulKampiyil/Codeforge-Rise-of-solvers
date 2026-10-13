import { TESLA_LEVELS } from './tesla-stats';

export const TESLA_ART_LEVELS = TESLA_LEVELS.map((row) => row.level);
/** Original source units registered to the local 2×2 footprint. */
export const TESLA_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 40,
  width: 192,
  height: 228,
  originX: 0.5,
  originY: 125 / 190,
};
export const teslaTexture = (level = 1) => (level === 1 ? 'tesla' : `tesla-${level}`);
export const teslaAsset = (level = 1) => `/assets/buildings/tesla-native/preview-${level}.png`;
