import { XBOW_LEVELS, type XbowMode } from './xbow-stats';

export const XBOW_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  width: 240,
  height: 204,
  originX: 0.5,
  originY: 110 / 170,
};
export const xbowAsset = (level: number, mode: XbowMode = 'ground') =>
  `/assets/buildings/xbow-native/preview-${level}-${mode}.png`;
export const xbowTexture = (level: number, mode: XbowMode = 'ground') => `xbow-${level}-${mode}`;
export function xbowExport(level: number, mode: XbowMode, upgrading = false) {
  if (!XBOW_LEVELS[level - 1]) throw Error(`Unsupported native X-Bow level: ${level}`);
  return `rapidfire_turret_lvl${level}${upgrading ? '_upgrade' : ''}${mode === 'both' ? '_air' : ''}`;
}
/** Calibrated from the source views: frame 0 aims along +map X; 90 along +map Y. */
export function xbowDirection(dx: number, dy: number) {
  return (Math.floor((Math.atan2(dy, dx) * 180) / Math.PI) + 360) % 360;
}
