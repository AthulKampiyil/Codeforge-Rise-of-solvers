/**
 * Original setup-body previews with shared source bounds [-51,-24,57,62] at 2 px per native unit.
 * Registration is a local calibration: 1.2 screen pixels per native unit and ground contact
 * (0,20) on the 1×1 tile, which centers the spent box and the triggered whirl's hole on the tile
 * where the spell's vfx machine (origin at the spell point) also appears.
 */
export const TORNADO_TRAP_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 20,
  bounds: [-51, -24, 57, 62] as const,
  width: 108 * 1.2,
  height: 86 * 1.2,
  originX: 51 / 108,
  originY: (20 + 24) / 86,
};
/** Level 3 reuses the level-2 exports (source ExportName). */
export const tornadoTrapTier = (level: number) => (level <= 1 ? 1 : 2);
export function tornadoTrapTexture(level: number, variant?: string) {
  void variant;
  return `tornado-trap-preview-${tornadoTrapTier(level)}`;
}
export function tornadoTrapAsset(level: number, variant?: string) {
  void variant;
  return `/assets/buildings/tornado-trap-native/preview-${tornadoTrapTier(level)}.png`;
}
