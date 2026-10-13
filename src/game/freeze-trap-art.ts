/**
 * Original armed-body preview with shared source bounds [-58,-84,63,88] at 2 px per native unit.
 * Registration is a local calibration shared with the Shrink Trap compartment: 1.2 screen pixels
 * per native unit and ground contact (0,50) on the 2×2 footprint.
 */
export const FREEZE_TRAP_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 50,
  bounds: [-58, -84, 63, 88] as const,
  width: 121 * 1.2,
  height: 172 * 1.2,
  originX: 58 / 121,
  originY: (50 + 84) / 172,
};
/** Screen-blended ice tint for frozen attackers (local; the source has no per-troop freeze art). */
export const FROZEN_TINT = 0x5fa8e8;
export function freezeTrapTexture(level: number, variant?: string) {
  void level;
  void variant;
  return 'freeze-trap-preview';
}
export function freezeTrapAsset(level: number, variant?: string) {
  void level;
  void variant;
  return '/assets/buildings/freeze-trap-native/armed.png';
}
