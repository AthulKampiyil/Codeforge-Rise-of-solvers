import { CANNON_LEVELS } from './cannon-stats';
export const CANNON_ART_LEVELS = CANNON_LEVELS.map((row) => row.level);
export const cannonTexture = (level = 1) => `cannon-level-${level}`;
export const cannonAsset = (level = 1) => `/assets/buildings/cannon-native/level-${level}.png`;
/** Source bounds [-101,-25,104,148], sharing the local native-defense ground anchor. */
export const CANNON_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  altitudeScale: 0.8,
  width: 205 * 1.2,
  height: 173 * 1.2,
  originX: 101 / 205,
  originY: 105 / 173,
};

export const cannonIconAsset = (level = 1) => `/assets/buildings/cannon-native/icon-${level}.png`;
