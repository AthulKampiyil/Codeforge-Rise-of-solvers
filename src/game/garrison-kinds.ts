import {
  characterRows,
  defendingCharacterLevel,
  projectileRow,
  sourceFlag,
  sourceNumber,
  specialAbility,
  spellLevel,
  type SourceRow,
} from './character-catalog';

/**
 * Campaign garrison families. Each kind names its roster character; combat values come from
 * the pinned client row at the roster's VisualLevel (after any DefensiveTroop substitution).
 * A kind is playable only at levels listed here, because each level needs its captured
 * animation graph and its source behavior fields to be implemented and verified.
 */
export const GARRISON_KINDS = {
  dragon: { character: 'Dragon', levels: { 5: 44, 7: 38 } },
  balloon: { character: 'Balloon', levels: { 8: 38 } },
  goblin: { character: 'Goblin', levels: { 7: 44 } },
  archer: { character: 'Archer', levels: { 9: 44 } },
  pekka: { character: 'PEKKA', levels: { 8: 44 } },
  valkyrie: { character: 'Valkyrie', levels: { 7: 44 } },
  headhunter: { character: 'Headhunter', levels: { 3: 44 } },
  superminion: { character: 'Super Minion', levels: { 9: 44 } },
  babydragon: { character: 'Baby Dragon', levels: { 6: 44 } },
  // Later roster families use the older engine's split attack timer (see `splitTiming`).
  electrodragon: { character: 'Electro Dragon', levels: { 3: 44 }, timing: 'split' },
  golem: { character: 'Golem', levels: { 8: 44 }, timing: 'split' },
  witch: { character: 'Witch', levels: { 4: 44 }, timing: 'split' },
  bowler: { character: 'Bowler', levels: { 4: 44 }, timing: 'split' },
  lavahound: { character: 'Lava Hound', levels: { 6: 44 }, timing: 'split' },
  electrotitan: { character: 'Electro Titan', levels: { 2: 44 }, timing: 'split' },
  goldendragon: { character: 'Golden Dragon', levels: { 1: 44 }, timing: 'split' },
  momma: { character: 'MOMMA', levels: { 1: 44 }, timing: 'split' },
  // Units that only spawn from another defender (secondary troops, summons) or a trap.
  // They are never roster members and never valid in replay garrisons.
  golemite: { character: 'Golemite', levels: { 8: 44 }, timing: 'split', spawned: true },
  lavapup: { character: 'Lava Pup', levels: { 1: 44 }, timing: 'split', spawned: true },
  summonedskeleton: { character: 'Skeleton', levels: { 1: 44 }, timing: 'split', spawned: true },
  royalghost: { character: 'Royal Ghost', levels: { 7: 44 }, timing: 'split', spawned: true },
} as const satisfies Record<
  string,
  { character: string; levels: Record<number, number>; timing?: 'split'; spawned?: true }
>;
export type GarrisonKind = keyof typeof GARRISON_KINDS;
export const isGarrisonKind = (value: unknown): value is GarrisonKind =>
  typeof value === 'string' && Object.hasOwn(GARRISON_KINDS, value);
/** Secondary, summoned and trap-spawned kinds: never loaded into a bunker. */
export const isSpawnedGarrisonKind = (kind: GarrisonKind) =>
  (GARRISON_KINDS[kind] as { spawned?: true }).spawned === true;
/** Every source roster family now has implemented behavior; none keeps a village gated. */
export const PENDING_GARRISON_CHARACTERS = [] as const;
export function garrisonKindForCharacter(character: string): GarrisonKind | undefined {
  return (Object.keys(GARRISON_KINDS) as GarrisonKind[]).find(
    (kind) => GARRISON_KINDS[kind].character === character && !isSpawnedGarrisonKind(kind),
  );
}
/** The spawned-only kind for a secondary, summoned or trap-spawned character. */
export function spawnedGarrisonKind(character: string): GarrisonKind | undefined {
  return (Object.keys(GARRISON_KINDS) as GarrisonKind[]).find(
    (kind) => GARRISON_KINDS[kind].character === character && isSpawnedGarrisonKind(kind),
  );
}
/** First replay version that may contain this troop level, or undefined when unsupported. */
export function garrisonTroopVersion(kind: unknown, level: unknown): number | undefined {
  if (!isGarrisonKind(kind) || typeof level !== 'number') return undefined;
  return (GARRISON_KINDS[kind].levels as Record<number, number>)[level];
}

function specialAbilityFor(row: SourceRow) {
  const name = typeof row.SpecialAbilities === 'string' ? row.SpecialAbilities : '';
  if (!name) return undefined;
  return { name, level: sourceNumber(row, 'SpecialAbilitiesLevel') || 1 };
}

/**
 * The pinned older [LogicAttackerItemData](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicAttackerItemData.cs)
 * splits `AttackSpeed` into a post-hit recovery (`CoolDownOverride`, or `AttackSpeed - 1500`
 * above 1500 ms, `AttackSpeed - 200` for healing rows) and a hit-timer windup. Its
 * `NewTargetAttackDelay` becomes an initial hit-timer charge `clamp(AttackSpeed - delay)`.
 * A newly engaged target is struck after `recovery left + windup - charge`; the period stays
 * `AttackSpeed`. Times are seconds. Earlier families keep their frozen interpretation.
 */
export function splitTiming(row: SourceRow) {
  const dps = sourceNumber(row, 'DPS');
  const interval = sourceNumber(row, 'AttackSpeed');
  let recovery = sourceNumber(row, 'CoolDownOverride');
  if (!recovery) {
    const threshold = dps < 0 ? 200 : 1500;
    if (interval > threshold) recovery = interval - threshold;
  }
  const delay = sourceNumber(row, 'NewTargetAttackDelay');
  const charge = delay > 0 ? Math.min(interval, Math.max(0, interval - delay)) : 0;
  const windup = interval - recovery;
  return {
    period: interval / 1000,
    recovery: recovery / 1000,
    windup: windup / 1000,
    charge: charge / 1000,
    /** Wait from a fresh engagement with no recovery left. */
    firstHit: Math.max(0, windup - charge) / 1000,
  };
}
const textField = (row: SourceRow, key: string) =>
  typeof row[key] === 'string' && row[key] ? (row[key] as string) : undefined;

const statsCache = new Map<string, ReturnType<typeof resolveStats>>();
function resolveStats(kind: GarrisonKind, level: number) {
  const resolved = defendingCharacterLevel(GARRISON_KINDS[kind].character, level);
  if (!resolved) throw new Error(`Unsupported garrison troop: ${kind} ${level}`);
  const { character, row } = resolved;
  const interval = sourceNumber(row, 'AttackSpeed');
  const newTarget = sourceNumber(row, 'NewTargetAttackDelay');
  const ability = specialAbilityFor(row);
  const projectile = typeof row.Projectile === 'string' && row.Projectile ? row.Projectile : undefined;
  const heroMultiplier = sourceNumber(row, 'HeroDamageMultiplier');
  const split = (GARRISON_KINDS[kind] as { timing?: 'split' }).timing === 'split';
  const timing = splitTiming(row);
  const secondary = textField(row, 'SecondaryTroop');
  const summon = textField(row, 'SummonTroop');
  const aura = textField(row, 'AuraSpell');
  return {
    character,
    row: sourceNumber(row, 'row'),
    visualLevel: sourceNumber(row, 'VisualLevel'),
    animation: String(row.Animation),
    hp: sourceNumber(row, 'Hitpoints'),
    housing: sourceNumber(row, 'HousingSpace'),
    dps: sourceNumber(row, 'DPS'),
    damage: (sourceNumber(row, 'DPS') * interval) / 1000,
    rate: interval / 1000,
    speed: sourceNumber(row, 'Speed') / 100,
    range: sourceNumber(row, 'AttackRange') / 100,
    splash: sourceNumber(row, 'DamageRadius') / 100,
    selfAsAoeCenter: sourceFlag(row, 'SelfAsAoeCenter'),
    groundTargets: sourceFlag(row, 'GroundTargets'),
    airTargets: sourceFlag(row, 'AirTargets'),
    flying: sourceFlag(row, 'IsFlying'),
    newTargetDelay: newTarget / 1000,
    /**
     * Earlier families: initial timer charge, wait is interval minus that charge. Later
     * families: the split timer's first-hit wait (`splitTiming`).
     */
    firstAttackDelay: split ? timing.firstHit : Math.max(0, (interval - newTarget) / 1000),
    /** Split timing only: post-hit recovery added before a newly engaged target's windup. */
    recovery: split ? timing.recovery : 0,
    split,
    deathDamage: sourceNumber(row, 'DieDamage'),
    deathRadius: sourceNumber(row, 'DieDamageRadius') / 100,
    deathDelay: sourceNumber(row, 'DieDamageDelay') / 1000,
    /** Source projectile row; troops without one resolve damage at the attack event. */
    projectile,
    projectileSpeed: projectile ? sourceNumber(projectileRow(projectile), 'Speed') / 100 : 0,
    /** `DontTrackTarget`: the landing point is fixed when the shot is launched (Witch). */
    projectileFixed: projectile ? sourceFlag(projectileRow(projectile), 'DontTrackTarget') : false,
    preferHeroes: sourceFlag(row, 'PreferHeroes'),
    /** HeroDamageMultiplier is a percentage of the attack's damage; absent means 100%. */
    heroDamageScale: heroMultiplier ? heroMultiplier / 100 : 1,
    ability,
    /** Chain lightning (Electro Dragon); undefined for troops without `ChainAttackDistance`. */
    chain: sourceNumber(row, 'ChainAttackDistance')
      ? {
          distance: sourceNumber(row, 'ChainAttackDistance') / 100,
          depth: sourceNumber(row, 'ChainAttackDepth'),
          factor: sourceNumber(row, 'ChainAttackFactor'),
          delay: sourceNumber(row, 'ChainAttackDelay') / 1000,
          reduction: sourceNumber(row, 'ChainAttackDamageReductionPercent') / 100,
        }
      : undefined,
    /** Death spawn (Golem, Lava Hound): `SecondaryTroop`, count and push-out distances. */
    secondary: secondary
      ? {
          character: secondary,
          count: sourceNumber(row, 'SecondaryTroopCnt'),
          distance: sourceNumber(row, 'SecondarySpawnDist') / 100,
          offset: sourceNumber(row, 'SecondarySpawnOffset') / 100,
          randomize: sourceFlag(row, 'RandomizeSecSpawnDist'),
        }
      : undefined,
    /** Summoning (Witch): troop, wave size, limit, level, window and cooldown. */
    summon: summon
      ? {
          character: summon,
          count: sourceNumber(row, 'SummonTroopCount'),
          limit: sourceNumber(row, 'SummonLimit'),
          level: sourceNumber(row, 'SummonLevel'),
          time: sourceNumber(row, 'SummonTime') / 1000,
          cooldown: sourceNumber(row, 'SummonCooldown') / 1000,
          /** Push-out distance of each summon (`SecondarySpawnDist`). */
          distance: sourceNumber(row, 'SecondarySpawnDist') / 100,
        }
      : undefined,
    /** `SpawnIdle` after a summon's push-out, and the unit's own push-back speed. */
    spawnIdle: sourceNumber(row, 'SpawnIdle') / 1000,
    pushbackSpeed: sourceNumber(row, 'PushbackSpeed'),
    /** Boulder bounces (Bowler): total impacts and the spacing along the throw. */
    bounce: sourceNumber(row, 'ChainShootingDistance')
      ? {
          impacts: sourceNumber(row, 'ProjectileBounces'),
          spacing: sourceNumber(row, 'ChainShootingDistance') / 100,
        }
      : undefined,
    aura: aura ? { spell: aura, level: sourceNumber(row, 'AuraSpellLevel') } : undefined,
    /** Royal Ghost hits slow their target: `FrostOnHitPercent` for `FrostOnHitTime`. */
    frost: sourceNumber(row, 'FrostOnHitTime')
      ? {
          duration: sourceNumber(row, 'FrostOnHitTime') / 1000,
          scale: (100 - sourceNumber(row, 'FrostOnHitPercent')) / 100,
        }
      : undefined,
  };
}
/** Only resolved, supported source levels. Never apply home troop caps or clamp a level. */
export function garrisonStats(kind: GarrisonKind, level: number) {
  if (garrisonTroopVersion(kind, level) === undefined)
    throw new Error(`Unsupported garrison troop: ${kind} ${level}`);
  const key = `${kind}:${level}`;
  let stats = statsCache.get(key);
  if (!stats) statsCache.set(key, (stats = resolveStats(kind, level)));
  return stats;
}
export type GarrisonStats = ReturnType<typeof garrisonStats>;

/** Poison applied by each hit (Headhunter). Spell rows are percentages and per-second values. */
export function garrisonPoisonOnHit(stats: GarrisonStats) {
  if (!stats.ability) return undefined;
  const ability = specialAbility(stats.ability.name, stats.ability.level);
  if (!ability.PoisonOnHitSpell) return undefined;
  const spell = spellLevel(ability.PoisonOnHitSpell, sourceNumber(ability, 'PoisonOnHitSpellLevel'));
  const heroMultiplier = sourceNumber(spell, 'HeroDamageMultiplier');
  return {
    spell: ability.PoisonOnHitSpell,
    spellLevel: sourceNumber(ability, 'PoisonOnHitSpellLevel'),
    duration: sourceNumber(ability, 'PoisonOnHitDuration') / 1000,
    dps: sourceNumber(spell, 'PoisonDPS'),
    heroDamageScale: heroMultiplier ? heroMultiplier / 100 : 1,
    /** Negative SpeedBoost is a percentage slow in the pinned older movement system. */
    moveScale: (100 + Math.min(0, sourceNumber(spell, 'SpeedBoost'))) / 100,
    attackScale: (100 + sourceNumber(spell, 'AttackSpeedBoost')) / 100,
    affectsAir: sourceFlag(spell, 'PoisonAffectAir'),
  };
}
/** Baby Dragon Tantrum: boosted while no other friendly flying unit is within the radius. */
export function garrisonTantrum(stats: GarrisonStats) {
  if (!stats.ability) return undefined;
  const ability = specialAbility(stats.ability.name, stats.ability.level);
  if (!ability.ActiveWhileAloneRadius) return undefined;
  return {
    radius: sourceNumber(ability, 'ActiveWhileAloneRadius') / 100,
    deactivateRadius: sourceNumber(ability, 'DeactivateWhileNotAloneRadius') / 100,
    damageScale: (100 + sourceNumber(ability, 'BoostDamagePercentage')) / 100,
    attackScale: (100 + sourceNumber(ability, 'BoostAttackSpeedPercentage')) / 100,
  };
}
/**
 * Source spell hits: the pinned older LogicSpell strikes at `DeployTimeMS + HitTimeMS`, then every
 * `TimeBetweenHitsMS`, `NumberOfHits` times. Distances are tiles; `heroDamageScale` applies to Heroes.
 */
function spellHits(name: string, level: number) {
  const spell = spellLevel(name, level);
  const heroMultiplier = sourceNumber(spell, 'HeroDamageMultiplier');
  return {
    spell: name,
    level,
    damage: sourceNumber(spell, 'Damage'),
    radius: sourceNumber(spell, 'Radius') / 100,
    hits: sourceNumber(spell, 'NumberOfHits'),
    firstHit: (sourceNumber(spell, 'DeployTimeMS') + sourceNumber(spell, 'HitTimeMS')) / 1000,
    interval: sourceNumber(spell, 'TimeBetweenHitsMS') / 1000,
    randomRadius: sourceNumber(spell, 'RandomRadius') / 100,
    randomOnlyGfx: sourceFlag(spell, 'RandomRadiusAffectsOnlyGfx'),
    heroDamageScale: heroMultiplier ? heroMultiplier / 100 : 1,
  };
}
/** Electro Dragon death: `ElectroDragonOnDeath` casts its `SelfSpell` at the source level on death. */
export function garrisonDeathSpell(stats: GarrisonStats) {
  if (!stats.ability) return undefined;
  const ability = specialAbility(stats.ability.name, stats.ability.level);
  if (!ability.SelfSpell || !sourceFlag(ability, 'ActiveOnDeath')) return undefined;
  return spellHits(ability.SelfSpell, sourceNumber(ability, 'SelfSpellLevel'));
}
/** Electro Titan: a constant `AuraSpell` at `AuraSpellLevel` around the living character. */
export function garrisonAura(stats: GarrisonStats) {
  return stats.aura ? spellHits(stats.aura.spell, stats.aura.level) : undefined;
}
/** Royal Ghost: `RoyalGhostAbility` conceals the unit and ignores obstacles for its duration. */
export function garrisonStealth(stats: GarrisonStats) {
  if (!stats.ability) return undefined;
  const ability = specialAbility(stats.ability.name, stats.ability.level);
  if (!sourceFlag(ability, 'IsInvisible')) return undefined;
  return {
    duration: sourceNumber(ability, 'DeactivateAfterTime') / 1000,
    ignoreObstacles: sourceFlag(ability, 'IgnoreObstacles'),
  };
}
/**
 * Secondary troops take the parent's upgrade level, clamped to their own table (older
 * LogicCharacter.CheckSpawning): Golem row 8 gives Golemite row 8, Lava Hound row 6 gives the
 * only Lava Pup row. The returned VisualLevel is that row's.
 */
export function garrisonSecondaryLevel(stats: GarrisonStats) {
  if (!stats.secondary) return undefined;
  const rows = characterRows(stats.secondary.character);
  return sourceNumber(rows[Math.min(stats.row, rows.length) - 1], 'VisualLevel');
}
/** Summons use the explicit 1-based `SummonLevel` (Witch 8 names level 2 of two Skeleton rows). */
export function garrisonSummonLevel(stats: GarrisonStats) {
  if (!stats.summon) return undefined;
  const rows = characterRows(stats.summon.character);
  return sourceNumber(rows[stats.summon.level - 1], 'VisualLevel');
}
/** Super Minion long shots: initial attacks use the ability range and projectile. */
export function garrisonLongShots(stats: GarrisonStats) {
  if (!stats.ability) return undefined;
  const ability = specialAbility(stats.ability.name, stats.ability.level);
  if (!ability.DeactivateAfterNumberOfHits || !ability.AttackRange) return undefined;
  const projectile = ability.Projectile || stats.projectile!;
  return {
    count: sourceNumber(ability, 'DeactivateAfterNumberOfHits'),
    range: sourceNumber(ability, 'AttackRange') / 100,
    projectile,
    projectileSpeed: sourceNumber(projectileRow(projectile), 'Speed') / 100,
  };
}
