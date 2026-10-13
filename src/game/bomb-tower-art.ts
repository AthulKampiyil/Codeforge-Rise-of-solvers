import source from '../../reference/bombtower/combat.json' with { type: 'json' };

export const BOMB_TOWER_ART_LEVELS = source.levels.map((v) => v.level);
export const bombTowerTexture = (level = 1) => (level === 1 ? 'bombtower' : `bombtower-${level}`);
export const bombTowerAsset = (level = 1) =>
  `/assets/buildings/bombtower-native/preview-${level}.png`;
/** Source body coordinates registered to the local 3×3 footprint and drawn roof. */
export const BOMB_TOWER_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  roofX: 0,
  roofY: 0,
  width: 216,
  height: 252,
  originX: 0.5,
  originY: 145 / 210,
};
