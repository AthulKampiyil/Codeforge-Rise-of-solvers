import source from '../../reference/builder-hut/combat.json' with { type: 'json' };

type PreviewKey = keyof typeof source.previews;
/** Original campaign Builder's Hut previews (2 px per native unit, dormant turret) at world scale 1.2. */
export function builderHutArt(level: number) {
  const preview = source.previews[String(level) as PreviewKey];
  if (!preview) throw Error(`Unsupported campaign Builder's Hut preview: ${level}`);
  const [left, top, right, bottom] = preview.bounds;
  return {
    width: (right - left) * source.worldScale,
    height: (bottom - top) * source.worldScale,
    originX: (source.anchor[0] - left) / (right - left),
    originY: (source.anchor[1] - top) / (bottom - top),
  };
}
/** Level-two armed registration, retained for callers that need one representative portrait. */
export const BUILDER_HUT_ART = builderHutArt(2);
export const BUILDER_HUT_ART_LEVELS = Object.keys(source.previews).map(Number);
export function builderHutTexture(level: number, variant?: string) {
  void variant;
  return `builder-hut-native-${level}`;
}
export function builderHutAsset(level: number, variant?: string) {
  void variant;
  const preview = source.previews[String(level) as PreviewKey];
  if (!preview) throw Error(`Unsupported campaign Builder's Hut preview: ${level}`);
  return '/' + preview.path;
}
