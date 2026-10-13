/** Forty-four buildable tiles, with a two-tile simulation border on each side. */
export const MAP_SIZE = 48;
export const BUILD_MIN = 2;
export const BUILD_MAX = MAP_SIZE - 2;
export const LEGACY_MAP_SIZE = 28;
export const SAVE_VERSION = 4;
export type GridVersion = 2 | 3 | 4;
const EXPANDED_DEFENSES = new Set(['cannon', 'archertower', 'mortar']);
const EXPANDED_ARMY = new Set(['camp', 'herohall']);
export const gridSize = (version: GridVersion = SAVE_VERSION) =>
  version === 2 ? LEGACY_MAP_SIZE : MAP_SIZE;
export const footprintSize = (
  kind: string,
  currentSize: number,
  version: GridVersion = SAVE_VERSION,
) =>
  version === 2 && EXPANDED_DEFENSES.has(kind)
    ? 2
    : version < 4 && EXPANDED_ARMY.has(kind)
      ? 3
      : currentSize;
