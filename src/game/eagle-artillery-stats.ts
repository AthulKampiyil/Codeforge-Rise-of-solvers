import source from '../../reference/eagle-artillery/combat.json' with { type: 'json' };
import { TROOPS, SPELLS, SPELL_KEYS, TROOP_KEYS, type SpellKind, type UnitKind } from './data';
import type { Battle } from './model';

export const EAGLE_ARTILLERY_LEVELS = source.levels;
export const MAX_EAGLE_ARTILLERY_LEVEL = source.levels.length;
/** Native logic positions use 512 units per tile; CSV ranges become `(value << 9) / 100`. */
export const NATIVE_TILE = 512;
const units = (value: number) => Math.trunc((value * NATIVE_TILE) / 100);

/**
 * Pinned 18.400.21 values in engine units. The retained 9.256 engine reconstruction subtracts
 * `CoolDownOverride` from `AttackSpeed`: 3,008 ms of charge plus a 6,992 ms post-burst cooldown.
 */
export const EAGLE_ARTILLERY = {
  size: source.size,
  range: units(source.attackRange),
  minRange: units(source.minAttackRange),
  chargeMs: source.attackSpeedMs - source.cooldownOverrideMs,
  cooldownMs: source.cooldownOverrideMs,
  burstCount: source.burstCount,
  burstDelayMs: source.burstDelayMs,
  ammunition: source.ammunition,
  wakeUpMs: source.wakeUpSpeedMs,
  wakeUpSpace: source.wakeUpSpace,
  groupRadius: units(source.targetGroupsRadius),
  damageRadius: units(source.damageRadius),
  spellRadius: units(source.hitSpell.radius),
  pushback: source.pushback,
  pushbackHousingLimit: source.pushbackHousingLimit,
  travelMs: Number(source.projectile.FixedTravelTime),
  damageDelayMs: Number(source.projectile.DamageDelay),
  startHeight: Number(source.projectile.StartHeight),
  ballisticHeight: Number(source.projectile.BallisticHeight),
  spellHitTimeMs: source.hitSpell.hitTimeMs,
} as const;
export const EAGLE_ARTILLERY_EFFECTS = source.effects;
export const EAGLE_ARTILLERY_EXPORTS = source.exports;
export const EAGLE_ARTILLERY_TURRET = source.turret as Record<
  string,
  { export: string; upgrade: string; labels: Record<string, number> }
>;
export const EAGLE_ARTILLERY_BEAMS = source.beams;
export function eagleArtilleryStats(level: number) {
  const row = EAGLE_ARTILLERY_LEVELS[level - 1];
  if (!row) throw Error(`Unsupported Eagle Artillery level: ${level}`);
  return row;
}

const housing = source.housing;
/**
 * Source HousingSpace and EnemyGroupWeight for the game's attackers. The pinned table covers
 * the ten original troops and the original spells; every family the native roster added falls
 * back to its own housing, which is what the source weighs a troop by.
 */
const troopRow = (kind: UnitKind) =>
  housing.troops[kind as keyof typeof housing.troops] as
    { housingSpace: number; enemyGroupWeight: number } | undefined;
export const eagleArtilleryTroopHousing = (kind: UnitKind) =>
  troopRow(kind)?.housingSpace ?? TROOPS[kind].space;
export const eagleArtilleryGroupWeight = (kind: UnitKind, hero: boolean) =>
  hero ? housing.hero.enemyGroupWeight : (troopRow(kind)?.enemyGroupWeight ?? TROOPS[kind].space);
export const eagleArtillerySpellHousing = (kind: SpellKind) =>
  (housing.spells[kind as keyof typeof housing.spells] as { housingSpace: number } | undefined)
    ?.housingSpace ?? SPELLS[kind].space;
export const EAGLE_ARTILLERY_HOUSING = housing;

/**
 * Deployed housing as the retained battle log counts it: troops and heroes use their housing
 * multipliers, each spell housing space is weighted by SPELL_HOUSING_COST_MULTIPLIER (500%).
 * Hero-summoned units are not deployments. The game has no attacking Clan Castle troops or pets.
 */
export function eagleArtilleryDeployedHousing(battle: Battle) {
  const g = housing.globals;
  let total = 0;
  for (const kind of TROOP_KEYS)
    total += Math.trunc(
      (g.UNIT_HOUSING_COST_MULTIPLIER *
        eagleArtilleryTroopHousing(kind) *
        (battle.carriedArmy[kind] - battle.remaining[kind])) /
        100,
    );
  if (battle.hero && battle.hero.unitId !== null)
    total += Math.trunc((g.HERO_HOUSING_COST_MULTIPLIER * housing.hero.housingSpace) / 100);
  for (const kind of SPELL_KEYS)
    total += Math.trunc(
      (g.SPELL_HOUSING_COST_MULTIPLIER *
        eagleArtillerySpellHousing(kind) *
        (battle.carried[kind] - battle.spells[kind])) /
        100,
    );
  return total;
}
