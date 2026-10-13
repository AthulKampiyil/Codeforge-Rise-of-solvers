import source from '../../reference/wizard-tower/combat.json' with { type: 'json' };

export const WIZARD_TOWER_ART_LEVELS = source.levels.map((v) => v.level);
export const wizardTowerTexture = (level = 1) =>
  level === 1 ? 'wizardtower' : `wizardtower-${level}`;
export const wizardTowerAsset = (level = 1) =>
  `/assets/buildings/wizard-tower-native/preview-${level}.png`;
/** Original preview bounds [-90,-60,90,130], registered to the local 3×3 footprint. */
export const WIZARD_TOWER_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 80,
  roofX: 0,
  roofY: 0,
  width: 216,
  height: 228,
  originX: 0.5,
  originY: 140 / 190,
  altitudeScale: 0.8,
};
