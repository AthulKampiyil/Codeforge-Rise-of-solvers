import source from '../../reference/spell-tower/combat.json' with { type: 'json' };
import type { SpellTowerWeapon } from './late-campaign';

export const SPELL_TOWER_LEVELS = source.levels;
/** Client HERO_RAGE_MULTIPLIER and HERO_RAGE_SPEED_MULTIPLIER, as fractions. */
export const SPELL_TOWER_HERO = { rage: source.hero.rage / 100, speed: source.hero.speed / 100 };
/** Native movement-speed points convert at eight per tile/second (docs/SPELL-PROGRESSION.md). */
const SPEED_POINTS_PER_TILE = 8;
export type SpellTowerSpellStats = ReturnType<typeof spellTowerWeapon>['spell'];

/** Source weapon, bottle and spell values converted to tiles and seconds. */
export function spellTowerWeapon(weapon: SpellTowerWeapon) {
  const row = source.weapons[weapon];
  const spell = row.spell;
  return {
    name: row.name,
    globalId: row.globalId,
    range: row.range / 100,
    /** Hit timer while a target stays engaged: `AttackSpeed - CoolDownOverride`. */
    windup: (row.attackSpeedMs - row.coolDownOverrideMs) / 1000,
    /** Reload lockout after each cast: `CoolDownOverride`. */
    cooldown: row.coolDownOverrideMs / 1000,
    selfCentered: row.selfAsAoeCenter,
    hitBuildingTrigger: row.customTargetHitBuildingInRange,
    castOnDeath: row.attackCenterOnDeath,
    airTargets: row.airTargets,
    groundTargets: row.groundTargets,
    stateLabels: row.stateLabels,
    exports: row.exports,
    projectile: {
      ...row.projectile,
      travel: row.projectile.fixedTravelTimeMs / 1000,
    },
    spell: {
      name: spell.name,
      radius: spell.radius / 100,
      hits: spell.numberOfHits,
      interval: spell.timeBetweenHitsMs / 1000,
      firstHit: spell.hitTimeMs / 1000,
      boostTime: spell.boostTimeMs / 1000,
      speedBoost: spell.speedBoost,
      speedBoost2: spell.speedBoost2,
      damageBoost: spell.damageBoostPercent / 100,
      buildingDamageBoost: spell.buildingDamageBoostPercent / 100,
      attackSpeedBoost: spell.attackSpeedBoost / 100,
      poisonDps: spell.poisonDps,
      poisonIncreaseSlowly: spell.poisonIncreaseSlowly,
      poisonAffectAir: spell.poisonAffectAir,
      boostLinkedToPoison: spell.boostLinkedToPoison,
      boostDefenders: spell.boostDefenders,
      heroDamageMultiplier: spell.heroDamageMultiplier / 100,
      invisibilityTime: spell.invisibilityTimeMs / 1000,
      immuneWalls: spell.immunities.includes('ImmunityWalls'),
      deployEffect: spell.deployEffect,
      deployEffect2: spell.deployEffect2,
    },
  };
}
export const SPELL_TOWER_WEAPON_KEYS = ['rage', 'poison', 'invisibility'] as const;
export const SPELL_TOWER = Object.fromEntries(
  SPELL_TOWER_WEAPON_KEYS.map((key) => [key, spellTowerWeapon(key)]),
) as Record<SpellTowerWeapon, ReturnType<typeof spellTowerWeapon>>;
export const speedPoints = (points: number) => points / SPEED_POINTS_PER_TILE;
/** Activation range of a placed tower's weapon (Invisibility 4.5 tiles, the others 9). */
export const spellTowerRange = (tower: { spellTowerWeapon?: SpellTowerWeapon }) =>
  SPELL_TOWER[tower.spellTowerWeapon ?? 'rage'].range;
export function spellTowerStats(level: number) {
  const row = SPELL_TOWER_LEVELS[level - 1];
  if (!row) throw Error(`Unsupported native Spell Tower level: ${level}`);
  return row;
}
/** Absolute battle time of pulse `index` for a spell deployed at `deployAt`. */
export const spellPulseAt = (weapon: SpellTowerWeapon, deployAt: number, index: number) =>
  deployAt + SPELL_TOWER[weapon].spell.firstHit + index * SPELL_TOWER[weapon].spell.interval;
