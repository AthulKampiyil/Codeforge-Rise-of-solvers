export const DARK_STORAGE_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  width: 240,
  height: 204,
  originX: 0.5,
  originY: 120 / 170,
};
export const darkStorageAsset = (level: number) =>
  `/assets/buildings/dark-storage-native/preview-${level}.png`;
export const darkStorageTexture = (level: number) => `dark-storage-${level}`;
/** Linear control interpretation, clamped below the source timeline's wrap point. */
export function darkStorageFrame(fraction: number) {
  if (!(fraction > 0)) return 0;
  return Math.max(1, Math.floor(Math.min(1, fraction) * 159));
}
