import { SWEEPER_LEVELS } from './air-control-stats';

export const SWEEPER_ART_LEVELS = SWEEPER_LEVELS.map((row) => row.level);
export const sweeperTexture = (level = 1, direction = 0) => `airsweeper-${level}-${direction}`;
export const sweeperAsset = (level = 1, direction = 0) =>
  `/assets/buildings/air-sweeper-native/level-${level}-${direction}.png`;

/** Shared source bounds [-71,-52,71,113], locally registered to a 2×2 footprint. */
export const SWEEPER_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 50,
  width: 142 * 1.2,
  height: 165 * 1.2,
  originX: 0.5,
  originY: 102 / 165,
};
