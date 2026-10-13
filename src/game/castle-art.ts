import catalog from '../../reference/garrison/catalog.json' with { type: 'json' };

export const CASTLE_LEVELS = catalog.castles['Clan Castle'];
export const castleStats = (level: number) => CASTLE_LEVELS.find((r) => r.level === level);
export const castleTexture = (level = 1) => `clancastle-level-${level}`;
export const castleAsset = (level = 1) => `/assets/garrison-native/castle/castle-${level}.png`;
/** Original portrait bounds; local world registration shares the native building anchor. */
export const CASTLE_ART = {
  width: 199 * 1.2,
  height: 242 * 1.2,
  originX: 105 / 199,
  originY: 180 / 242,
};
