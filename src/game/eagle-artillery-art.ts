/** Registered original Eagle Artillery previews: dormant turret frame zero over the source base
 * shadow, rendered by the importer at 2× over common native bounds [-131,-42,121,185]. The world
 * adapter uses the shared 1.2 scale and an 80-unit anchor above the four-tile footprint center. */
export const EAGLE_ARTILLERY_PREVIEW_BOUNDS = [-131, -42, 121, 185] as const;
const [left, top, right, bottom] = EAGLE_ARTILLERY_PREVIEW_BOUNDS;
export const EAGLE_ARTILLERY_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  /** Screen pixels per native unit of height above the ground (shared native projection). */
  altitudeScale: 0.8,
  width: (right - left) * 1.2,
  height: (bottom - top) * 1.2,
  originX: -left / (right - left),
  originY: (80 - top) / (bottom - top),
};
export const EAGLE_ARTILLERY_ART_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;
function supported(level: number) {
  if (!EAGLE_ARTILLERY_ART_LEVELS.includes(level as 1)) throw Error(`Unsupported Eagle Artillery level: ${level}`);
  return level;
}
export function eagleArtilleryTexture(level: number, variant?: string) {
  void variant;
  return `eagle-artillery-level-${supported(level)}`;
}
export function eagleArtilleryAsset(level: number, variant?: string) {
  void variant;
  return `/assets/buildings/eagle-artillery-native/preview-${supported(level)}.png`;
}
