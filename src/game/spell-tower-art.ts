import source from '../../reference/spell-tower/combat.json' with { type: 'json' };

export const SPELL_TOWER_ART_LEVELS = source.levels.map((row) => row.level);
export const SPELL_TOWER_ART_WEAPONS = ['rage', 'poison', 'invisibility'] as const;
type ArtWeapon = (typeof SPELL_TOWER_ART_WEAPONS)[number];
const weaponOf = (variant?: string): ArtWeapon =>
  SPELL_TOWER_ART_WEAPONS.includes(variant as ArtWeapon) ? (variant as ArtWeapon) : 'rage';
/** Source preview bounds [-70,-70,70,90] at scale 1.2; the source root sits 64 px above the
 * two-tile center, the local Inferno registration of the same `dark_tower_base`. */
export const SPELL_TOWER_ART = {
  scale: 1.2,
  anchorX: 0,
  anchorY: 64 / 1.2,
  width: 168,
  height: 192,
  originX: 0.5,
  originY: (70 + 64 / 1.2) / 160,
};
/** `variant` is the explicit campaign weapon; an unselected home preview shows Rage. */
export function spellTowerTexture(level: number, variant?: string) {
  return `spell-tower-native-${level}-${weaponOf(variant)}`;
}
export function spellTowerAsset(level: number, variant?: string) {
  if (!SPELL_TOWER_ART_LEVELS.includes(level))
    throw Error(`Unsupported native Spell Tower level: ${level}`);
  return `/assets/buildings/spell-tower-native/preview-${level}-${weaponOf(variant)}.png`;
}
