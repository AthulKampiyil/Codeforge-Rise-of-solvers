/** Registered original Scattershot previews: turret frame 225 (loaded rest pose, throwing away from
 * the viewer) over the rapidfire base, rendered by the importer at 2× over common native bounds
 * [-78,-13,70,117]. The world adapter uses the shared 1.2 scale and 80-unit anchor. */
export const SCATTERSHOT_PREVIEW_BOUNDS = [-78, -13, 70, 117] as const;
export const SCATTERSHOT_PREVIEW_TURRET = 225;
const [left, top, right, bottom] = SCATTERSHOT_PREVIEW_BOUNDS;
export const SCATTERSHOT_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  altitudeScale: 0.8,
  width: (right - left) * 1.2,
  height: (bottom - top) * 1.2,
  originX: -left / (right - left),
  originY: (80 - top) / (bottom - top),
};
export const SCATTERSHOT_ART_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;
function supported(level: number) {
  if (!SCATTERSHOT_ART_LEVELS.includes(level as 1)) throw Error(`Unsupported Scattershot level: ${level}`);
  return level;
}
export function scattershotTexture(level: number, variant?: string) {
  void variant;
  return `scattershot-level-${supported(level)}`;
}
export function scattershotAsset(level: number, variant?: string) {
  void variant;
  return `/assets/buildings/scattershot-native/preview-${supported(level)}.png`;
}
