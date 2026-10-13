import type { BuildingKind } from './data';
import { superchargeBonus } from './native-supercharge';
import {
  flag,
  list,
  nativeGlobal,
  nativeLevelCount,
  nativeRow,
  num,
  numbers,
  seconds,
  text,
  tiles,
  type NativeRow,
} from './native-data';

/**
 * Client 18.400.21 weapon rows for the Town Hall 11-18 defenses. Every value is read from
 * reference/full-client/combat.json; interpretations that the columns do not spell out are
 * documented beside the reader and in docs/NATIVE-DEFENSES.md with the official wiki reference.
 */
export const NATIVE_DEFENSE_SOURCE = {
  eagleartillery: 'Eagle Artillery',
  scattershot: 'Scattershot',
  spelltower: 'Spell Tower',
  monolith: 'Monolith',
  multiarchertower: 'Multi Archer Tower',
  ricochetcannon: 'Ricochet Cannon',
  multigeartower: 'Multi Gear Tower',
  firespitter: 'Firespitter',
  revengetower: 'Revenge Tower',
  superwizardtower: 'Super Wizard Tower',
  builder: 'Builders Hut',
  townhall: 'Town Hall',
} as const satisfies Partial<Record<BuildingKind, string>>;
export type NativeDefenseKind = keyof typeof NATIVE_DEFENSE_SOURCE;
export const isNativeDefenseKind = (kind: BuildingKind): kind is NativeDefenseKind =>
  Object.hasOwn(NATIVE_DEFENSE_SOURCE, kind);

export type SpellTowerMode = 'rage' | 'poison' | 'invisibility' | 'earthquake';
export const SPELL_TOWER_MODES: readonly SpellTowerMode[] = [
  'rage',
  'poison',
  'invisibility',
  'earthquake',
];
const SPELL_TOWER_WEAPON: Record<SpellTowerMode, string> = {
  rage: 'SpellTowerRage',
  poison: 'SpellTowerPoison',
  invisibility: 'SpellTowerInvisibility',
  earthquake: 'SpellTowerEarthquake',
};
export type GearMode = 'long' | 'fast';

/**
 * Burst weapons start a new burst only on whole 64 ms combat steps. The official wiki's frame
 * counts and in-game per-hit values match this exactly: Firespitter 1.024 + 19 x 0.064 = 2.24 s
 * (46.03 per ball at level 1) and Multi-Gear Fast Attack 0.384 + 3 x 0.192 = 0.96 s (156 per ball).
 */
export const BURST_STEP = 0.064;
const burstGap = (attackSpeed: number) => Math.ceil(attackSpeed / BURST_STEP - 1e-9) * BURST_STEP;

export interface NativeWeapon {
  /** Client row that supplied the numbers (building or weapon). */
  source: string;
  level: number;
  range: number;
  minRange: number;
  air: boolean;
  ground: boolean;
  /** Seconds from one attack (or burst start) to the next. */
  interval: number;
  /** Delay from acquiring a target to the first release (AttackSpeed - CoolDownOverride). */
  windup: number;
  /** Delay before firing at a replacement target. */
  retarget: number;
  /** Damage per release, or per ball for bursts. */
  damage: number;
  burst: number;
  burstDelay: number;
  projectile: string;
  splash: number;
  targets: number;
  /** Several releases may choose the same unit when fewer units are in range. */
  sharedTargets: boolean;
  bounces: number;
  chain?: { targets: number; distance: number; factor: number; delay: number };
  /** Percent of the target's maximum hitpoints added per hit (Monolith). */
  hpPermil: number;
  pushback: number;
  pushbackHousing: number;
  /** Eagle Artillery and Builder's Hut: deployed housing needed to wake. */
  wakeSpace: number;
  wakeDelay: number;
  groupRadius: number;
  ammo: number;
  cone: number;
  randomTarget: boolean;
  pierce?: { radius: number; extra: number; hits: number; spread: number };
  death?: { damage: number; radius: number; delay: number; spell: string };
  /** Hero Hunter: new targets are heroes when any are in range, and heroes take extra damage. */
  preferHeroes?: boolean;
  heroMultiplier?: number;
  /** Hero Hunter: each hit poisons its target like a Poison Spell of this level. */
  poison?: { level: number; seconds: number };
  /** Cake-A-Pult: splash on the target's layer, then a bomb that hits both layers. */
  layerSplash?: number;
  bomb?: { damage: number; radius: number; delay: number };
}

const cache = new Map<string, NativeWeapon | null>();
const weaponBase = (row: NativeRow, source: string, level: number, alt = false, bonusDps = 0) => {
  const p = alt ? 'Alt' : '';
  const attackSpeed = seconds(row, `${p}AttackSpeed`) || seconds(row, 'AttackSpeed');
  const override = seconds(row, `${p}CoolDownOverride`);
  const burst = Math.max(1, num(row, `${p}BurstCount`, 1));
  const burstDelay = seconds(row, `${p}BurstDelay`);
  const interval = burst > 1 ? burstGap(attackSpeed) + (burst - 1) * burstDelay : attackSpeed;
  // Supercharge DPS is added to both the normal and the Alt attack (client mini levels).
  const dps = num(row, `${p}DPS`) + (num(row, `${p}DPS`) ? bonusDps : 0);
  const declared = num(row, 'Damage');
  return {
    source,
    level,
    range: tiles(row, `${p}AttackRange`) || tiles(row, 'AttackRange'),
    minRange: tiles(row, 'MinAttackRange'),
    air: flag(row, `${p}AirTargets`) || (alt ? false : flag(row, 'AirTargets')),
    ground: flag(row, `${p}GroundTargets`) || (alt ? false : flag(row, 'GroundTargets')),
    interval,
    windup: override > 0 && override < attackSpeed ? attackSpeed - override : 0,
    retarget: seconds(row, 'NewTargetAttackDelay'),
    damage: dps ? (dps * interval) / burst : declared,
    burst,
    burstDelay,
    projectile: alt ? text(row, 'AltProjectile') : (list(row, 'Projectile')[0] ?? ''),
    splash: tiles(row, 'DamageRadius'),
    targets: flag(row, 'MultiTargets') ? Math.max(1, num(row, 'NumMultiTargets', 1)) : 1,
    sharedTargets: flag(row, 'MultiHitsTarget'),
    bounces: num(row, 'ProjectileBounces'),
    hpPermil: num(row, 'DamagePermilHp'),
    pushback: tiles(row, 'Pushback'),
    pushbackHousing: num(row, 'PushbackHousingLimit'),
    wakeSpace: num(row, 'WakeUpSpace'),
    wakeDelay: seconds(row, 'WakeUpSpeed'),
    groupRadius: flag(row, 'TargetGroups') ? tiles(row, 'TargetGroupsRadius') : 0,
    ammo: num(row, 'AmmoCount'),
    cone: num(row, 'TargetingConeAngle'),
    randomTarget: flag(row, 'RandomizeTarget'),
  } satisfies Omit<NativeWeapon, 'chain' | 'pierce' | 'death'>;
};

/** Weapon for a building level; `null` when the level has no attack (Town Hall 1-11 and 18, huts). */
export function nativeWeapon(
  kind: NativeDefenseKind,
  level: number,
  options: { mode?: SpellTowerMode | GearMode; weaponLevel?: number; supercharge?: number } = {},
): NativeWeapon | null {
  const key = `${kind}/${level}/${options.mode ?? ''}/${options.weaponLevel ?? ''}/${options.supercharge ?? 0}`;
  if (cache.has(key)) return cache.get(key)!;
  const result = buildWeapon(kind, level, options);
  cache.set(key, result);
  return result;
}

function buildWeapon(
  kind: NativeDefenseKind,
  level: number,
  options: { mode?: SpellTowerMode | GearMode; weaponLevel?: number; supercharge?: number },
): NativeWeapon | null {
  const name = NATIVE_DEFENSE_SOURCE[kind];
  const bonus = superchargeBonus(kind, options.supercharge).dps;
  const row = nativeRow('buildings', name, level);
  if (kind === 'townhall') {
    const weapon = text(row, 'Weapon');
    if (!weapon) return null;
    const w = nativeRow('weapons', weapon, options.weaponLevel ?? 1);
    const base = weaponBase(w, weapon, options.weaponLevel ?? 1);
    return {
      ...base,
      ...(num(w, 'DieDamage')
        ? {
            death: {
              damage: num(w, 'DieDamage'),
              radius: tiles(w, 'DieDamageRadius'),
              delay: seconds(w, 'DieDamageDelay'),
              spell: text(w, 'DieDamageSpell'),
            },
          }
        : {}),
    };
  }
  if (kind === 'spelltower') {
    const mode = (options.mode as SpellTowerMode | undefined) ?? 'rage';
    const weapon = SPELL_TOWER_WEAPON[mode];
    if (!spellTowerModes(level).includes(mode)) return null;
    // Wind-up = AttackSpeed - CoolDownOverride = the wiki's 1.2 s trigger dwell.
    return weaponBase(nativeRow('weapons', weapon, level), weapon, level);
  }
  if (kind === 'builder' && !num(row, 'DPS')) return null;
  const alt = kind === 'multigeartower' && options.mode === 'fast';
  const base = weaponBase(row, name, level, alt, bonus);
  const weapon: NativeWeapon = {
    ...base,
    ...(num(row, 'ChainAttackFactor')
      ? {
          chain: {
            targets: num(row, 'ChainAttackFactor'),
            distance: tiles(row, 'ChainAttackDistance'),
            factor: 1 - num(row, 'ChainAttackDamageReductionPercent') / 100,
            delay: seconds(row, 'ChainAttackDelay'),
          },
        }
      : {}),
    ...(flag(row, 'PenetratingProjectile')
      ? {
          pierce: {
            radius: tiles(row, 'PenetratingRadius'),
            extra: tiles(row, 'PenetratingExtraRange'),
            hits: Math.max(1, num(nativeRow('projectiles', base.projectile), 'MaxHitObjects', 1)),
            // TargetPosRandomRadius 768 is a logic-unit value (512 per tile): a 1.5-tile spread.
            spread: num(nativeRow('projectiles', base.projectile), 'TargetPosRandomRadius') / 512,
          },
        }
      : {}),
  };
  // Monolith projectiles are chosen by the target's maximum hitpoints; the first is the default.
  return weapon;
}

/** Geared-up Cannon (burst), Archer Tower (fast attack) and Mortar (burst) use the Alt* columns. */
const GEARED_SOURCE = { cannon: 'Cannon', archertower: 'Archer Tower', mortar: 'Mortar' } as const;
export function nativeGearedWeapon(
  kind: keyof typeof GEARED_SOURCE,
  level: number,
  supercharge = 0,
): NativeWeapon {
  const key = `geared:${kind}/${level}/${supercharge}`;
  if (cache.has(key)) return cache.get(key)!;
  const name = GEARED_SOURCE[kind];
  const weapon: NativeWeapon = weaponBase(
    nativeRow('buildings', name, level),
    name,
    level,
    true,
    superchargeBonus(kind, supercharge).dps,
  );
  cache.set(key, weapon);
  return weapon;
}

/** Spell Tower levels unlock one additional spell each (Rage, Poison, Invisibility, Earthquake). */
export function spellTowerModes(level: number): SpellTowerMode[] {
  const modes: SpellTowerMode[] = [];
  for (let l = 1; l <= Math.min(level, nativeLevelCount('buildings', 'Spell Tower')); l++) {
    const unlocked = text(nativeRow('buildings', 'Spell Tower', l), 'UnlockWeaponMode');
    const mode = SPELL_TOWER_MODES.find((m) => SPELL_TOWER_WEAPON[m] === unlocked);
    if (mode && !modes.includes(mode)) modes.push(mode);
  }
  return modes;
}
export const spellTowerSpell = (mode: SpellTowerMode) =>
  text(nativeRow('projectiles', nativeWeapon('spelltower', 4, { mode })!.projectile), 'HitSpell');

/** Monolith projectile variant (Min/Med/Max) by the target's maximum hitpoints. */
export function monolithProjectile(level: number, maxHp: number) {
  const row = nativeRow('buildings', 'Monolith', level);
  const variants = list(row, 'Projectile');
  const limits = numbers(row, 'ProjectileVariantByTargetMaxHP');
  const index = limits.findIndex((limit) => maxHp < limit);
  return variants[index < 0 ? variants.length - 1 : index] ?? variants[0];
}

/** Revenge Tower tiers are special abilities gated by the number of destroyed buildings. */
export interface RevengeTier {
  name: string;
  disabled: boolean;
  after: number;
  until: number;
  damage: number;
  interval: number;
  projectile: string;
  bounces: number;
}
export function revengeTiers(level: number, supercharge = 0): RevengeTier[] {
  const row = nativeRow('buildings', 'Revenge Tower', level);
  const levels = numbers(row, 'SpecialAbilitiesLevel');
  // Supercharge SpecialAbilityLevelBuff raises every stage ability by one level.
  const buff = superchargeBonus('revengetower', supercharge).abilityLevels;
  return list(row, 'SpecialAbilities').map((name, index) => {
    const ability = nativeRow('abilities', name, (levels[index] || 1) + (buff[index] ?? 0));
    return {
      name,
      disabled: flag(ability, 'DisableAttacking'),
      after: num(ability, 'ActiveAfterNumBuildingsDestroyed'),
      until: num(ability, 'DeactivateAfterNumBuildingsDestroyed', Infinity),
      damage: num(ability, 'Damage'),
      interval: seconds(ability, 'AttackSpeed') || seconds(row, 'AttackSpeed'),
      projectile: text(ability, 'Projectile') || text(row, 'Projectile'),
      bounces: num(ability, 'ProjectileBounces'),
    };
  });
}
export const revengeTier = (level: number, destroyed: number, supercharge = 0) =>
  revengeTiers(level, supercharge).find(
    (tier) => destroyed >= tier.after && destroyed < tier.until,
  ) ?? revengeTiers(level, supercharge).at(-1)!;

/** Town Hall weapon wake rules from the Town Hall row and the hidden-building global. */
export function townHallActivation(level: number) {
  const row = nativeRow('buildings', 'Town Hall', level);
  return {
    onDamage: num(row, 'ActivateCombatOnDamageTaken') > 0,
    delay: seconds(row, 'CombatActivationDelay'),
    afterSeconds: text(row, 'ActivateAfterSeconds') === '' ? -1 : num(row, 'ActivateAfterSeconds'),
    destruction: nativeGlobal('HIDDEN_BUILDING_APPEAR_DESTRUCTION_PERCENTAGE', 50),
    guardians: flag(row, 'HousesGuardians'),
  };
}
export const townHallWeaponLevels = (level: number) => {
  const weapon = text(nativeRow('buildings', 'Town Hall', level), 'Weapon');
  return weapon ? nativeLevelCount('weapons', weapon) : 0;
};

/** Builder's Hut repair: the Defending Builder character one level below the hut. */
export function hutRepair(level: number) {
  const row = nativeRow('buildings', 'Builders Hut', level);
  const character = text(row, 'DefenceTroopCharacter');
  const troopLevel = num(row, 'DefenceTroopLevel');
  if (!character || !troopLevel) return null;
  const builder = nativeRow('characters', character, troopLevel);
  return {
    count: Math.max(1, num(row, 'DefenceTroopCount', 1)),
    heal: -num(builder, 'DPS') * seconds(builder, 'AttackSpeed'),
    interval: seconds(builder, 'AttackSpeed'),
    reach: tiles(builder, 'AttackRange'),
    speed: num(builder, 'Speed') / 100,
    area: tiles(row, 'AttackRange'),
  };
}

/** Eagle Artillery wake weights: housing, heroes x1, spells x5 (client globals). */
export const SPELL_WAKE_MULTIPLIER = nativeGlobal('SPELL_HOUSING_COST_MULTIPLIER', 500) / 100;
export const HERO_WAKE_MULTIPLIER = nativeGlobal('HERO_HOUSING_COST_MULTIPLIER', 100) / 100;

/** Saved owner choices on defenses; absent values use the client default. */
export const validSpellTowerMode = (value: unknown, kind: string, level: number) =>
  value === undefined ||
  (kind === 'spelltower' &&
    SPELL_TOWER_MODES.includes(value as SpellTowerMode) &&
    spellTowerModes(level).includes(value as SpellTowerMode));
export const validGearMode = (value: unknown, kind: string) =>
  value === undefined || (kind === 'multigeartower' && (value === 'long' || value === 'fast'));
export const validWeaponLevel = (value: unknown, kind: string, level: number) =>
  value === undefined ||
  (kind === 'townhall' &&
    Number.isInteger(value) &&
    (value as number) >= 1 &&
    (value as number) <= townHallWeaponLevels(level));

/** Next Town Hall weapon level (Inferno Artillery 2-5): client weapons.csv BuildCost/BuildTime. */
export function townHallWeaponUpgrade(level: number, weaponLevel = 1) {
  const weapon = text(nativeRow('buildings', 'Town Hall', level), 'Weapon');
  if (!weapon || weaponLevel >= nativeLevelCount('weapons', weapon)) return null;
  const row = nativeRow('weapons', weapon, weaponLevel + 1);
  return {
    level: weaponLevel + 1,
    cost: num(row, 'BuildCost'),
    seconds:
      num(row, 'BuildTimeD') * 86400 +
      num(row, 'BuildTimeH') * 3600 +
      num(row, 'BuildTimeM') * 60 +
      num(row, 'BuildTimeS'),
    resource:
      ({ Gold: 'gold', Elixir: 'elixir', DarkElixir: 'dark' } as const)[
        text(row, 'BuildResource') as 'Gold' | 'Elixir' | 'DarkElixir'
      ] ?? 'gold',
  };
}
