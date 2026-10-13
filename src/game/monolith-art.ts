import source from '../../reference/monolith/combat.json' with { type: 'json' };

export const MONOLITH_ART_LEVELS = source.levels.map((row) => row.level);
/** Source preview bounds [-90,-100,90,130] at scale 1.2, registered to the local 3×3 center.
 * Local registration convention (shared with other native 3×3 defenses), not native projection. */
export const MONOLITH_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  width: 216,
  height: 276,
  originX: 0.5,
  originY: (100 + 80) / 230,
};
export function monolithTexture(level: number, variant?: string) {
  void variant;
  return `monolith-native-${level}`;
}
export function monolithAsset(level: number, variant?: string) {
  void variant;
  if (!MONOLITH_ART_LEVELS.includes(level)) throw Error(`Unsupported native Monolith level: ${level}`);
  return `/assets/buildings/monolith-native/preview-${level}.png`;
}
