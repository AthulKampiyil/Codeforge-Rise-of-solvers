import { startEquipmentDash, stepEquipmentEffects } from './native-equipment-effects';
import { distance2D } from './distance';
import { TROOPS, type UnitKind } from './data';
import { flag, nativeRow, num, seconds, text, tiles, type NativeRow } from './native-data';
import { castNativeSpell } from './native-spells';
import { healUnit, unitEffects } from './native-status';
import { unitKindForName } from './native-units';
import {
  activeAbilities,
  heroAbilities,
  heroAbilityHeal,
  heroStatsFor,
  type NativeBattleHero,
  type HeroAbility,
} from './native-heroes';
import type { NativeTroopContext } from './native-troops';
import type { Battle, Unit } from './model';

/**
 * Hero ability effects (version 46). One activation per battle triggers the hero's heal and both
 * equipped items' active abilities; passive abilities run for the whole battle. Every value comes
 * from special_abilities.csv: boosts and speeds in hundredths of a tile, times in milliseconds.
 */
const EPS = 1e-9;

/** Player (or automatic) activation: heal, then every active ability of the loadout. */
export function activateHero(
  ctx: NativeTroopContext,
  hero: NativeBattleHero,
  unit: Unit,
  townhall: number,
  at = ctx.battle.elapsed,
) {
  hero.abilityUsed = true;
  hero.abilityAt = at;
  hero.spawned = {};
  // The ability rescues a hero that has just been knocked out, so healing ignores the zero floor.
  const heal = heroAbilityHeal(hero, townhall);
  if (heal > 0) unit.hp = Math.min(unit.maxHp, unit.hp + heal);
  for (const ability of activeAbilities(hero)) applyAbility(ctx, hero, unit, ability, at);
  ctx.effect({ type: 'trap', x: unit.x, y: unit.y, text: abilityLabel(hero), color: 0xffcc4d });
}
const abilityLabel = (hero: NativeBattleHero) =>
  hero.items.map((item) => item.slug.replace(/-/g, ' ').toUpperCase()).join(' + ') || 'ABILITY';

function applyAbility(
  ctx: NativeTroopContext,
  hero: NativeBattleHero,
  unit: Unit,
  ability: HeroAbility,
  at: number,
) {
  startEquipmentDash(ctx, unit, ability);
  const row = ability.row;
  const battle = ctx.battle;
  const duration = seconds(row, 'DeactivateAfterTime');
  const effects = unitEffects(unit);
  const speed = num(row, 'SpeedBoost') / 100;
  const damage = num(row, 'BoostDamagePercentage') / 100;
  const rate = seconds(row, 'AttackSpeed');
  if ((speed || damage || rate) && duration > 0) {
    effects.boost = {
      until: Math.max(effects.boost?.until ?? 0, at + duration),
      speed: Math.max(effects.boost?.speed ?? 0, speed),
      damage: Math.max(effects.boost?.damage ?? 0, damage),
      attackSpeed: effects.boost?.attackSpeed ?? 0,
    };
    if (rate > 0) effects.attackInterval = { until: at + duration, seconds: rate };
  }
  const shield = num(row, 'ShieldProtectionPercent') / 100;
  if (shield > 0 && duration > 0)
    effects.shield = {
      until: Math.max(effects.shield?.until ?? 0, at + duration),
      percent: Math.max(effects.shield?.percent ?? 0, shield),
    };
  if (flag(row, 'IsInvisible') && duration > 0)
    effects.invisibleUntil = Math.max(effects.invisibleUntil ?? 0, at + duration);
  const flat = num(row, 'ExtraDamageFlat');
  if (flat > 0) {
    const hits = num(row, 'DeactivateAfterNumberOfHits');
    effects.extraDamage = {
      until: hits > 0 ? Infinity : at + duration,
      amount: flat,
      hits: hits > 0 ? hits : undefined,
      range: tiles(row, 'AttackRange') || undefined,
      projectile: text(row, 'Projectile') || undefined,
    };
  }
  const splash = tiles(row, 'DamageRadius');
  if (splash > 0 && duration > 0 && num(row, 'GrowthScale'))
    effects.splash = { until: at + duration, radius: splash, jumper: true };
  const self = text(row, 'SelfSpell');
  if (self)
    castNativeSpell(battle, self, num(row, 'SelfSpellLevel', 1) || 1, 'attack', unit.x, unit.y, {
      at: at + seconds(row, 'PreActivationDelayTime'),
      owner: unit.id,
    });
  const aura = text(row, 'AuraSpell');
  if (aura)
    castNativeSpell(battle, aura, num(row, 'AuraSpellLevel', 1) || 1, 'attack', unit.x, unit.y, {
      at,
      follow: unit.id,
      owner: unit.id,
      immediate: true,
    });
  if (flag(row, 'IsJumper')) effects.jumpUntil = Math.max(effects.jumpUntil ?? 0, at + duration);
  if (text(row, 'SpawnedTroop')) releaseSpawns(ctx, hero, unit, ability, at);
}

/** Puppet-style spawns: `SpawnnedTroopsPerHit` every `SpawnDelayBetweenHitsMS` up to `TroopCount`. */
export function releaseSpawns(
  ctx: NativeTroopContext,
  hero: NativeBattleHero,
  unit: Unit,
  ability: HeroAbility,
  at: number,
) {
  const row = ability.row;
  const total = num(row, 'TroopCount');
  const name = text(row, 'SpawnedTroop');
  const kind = unitKindForName(name) as UnitKind | undefined;
  if (!kind || !total || hero.abilityAt === undefined) return;
  const perHit = Math.max(1, num(row, 'SpawnnedTroopsPerHit', total));
  const gap = seconds(row, 'SpawnDelayBetweenHitsMS');
  const spawned = (hero.spawned ??= {});
  const done = spawned[ability.name] ?? 0;
  const waves = gap > 0 ? Math.floor((at - hero.abilityAt + EPS) / gap) + 1 : 1;
  const due = Math.min(total, waves * perHit);
  const level = flag(row, 'CopySpawnnedTroopLevelFromAvatar')
    ? (ctx.battle.troopLevels?.[kind as keyof NonNullable<Battle['troopLevels']>] ?? 1)
    : num(row, 'TroopLevel', 1) || 1;
  for (let index = done; index < due; index++) {
    const when = hero.abilityAt + (gap > 0 ? Math.floor(index / perHit) * gap : 0);
    const offset = spawnOffset(row, index, perHit);
    const spawn = ctx.spawn?.(kind, level, unit.x + offset.x, unit.y + offset.y, when, unit.id);
    if (!spawn) break;
    spawn.summoned = true;
    if (flag(row, 'GiveAbilityToSpawnedTroop')) {
      const given = nativeRow(
        'abilities',
        text(row, 'GivenAbility'),
        num(row, 'GivenAbilityLevel', 1) || 1,
      );
      applyGiven(spawn, given, when);
    }
    spawned[ability.name] = index + 1;
  }
}
/** SpawnPattern places a semicircle in front of the hero; others land on its tile. */
function spawnOffset(row: NativeRow, index: number, perHit: number) {
  if (text(row, 'SpawnPattern') !== 'SemiCircleInFront') return { x: 0, y: 0 };
  const angle = Math.PI * ((index % perHit) / Math.max(1, perHit - 1) - 0.5);
  return { x: Math.cos(angle) * 0.8, y: Math.sin(angle) * 0.8 };
}
/** Boosts a summoned troop carries (Barbarian Puppet rage, Archer Puppet invisibility). */
export function applyGiven(unit: Unit, row: NativeRow, at: number) {
  const effects = unitEffects(unit);
  const duration = seconds(row, 'DeactivateAfterTime');
  if (duration <= 0) return;
  const speed = num(row, 'SpeedBoost') / 100;
  const damage = num(row, 'BoostDamagePercentage') / 100;
  if (speed || damage) effects.boost = { until: at + duration, speed, damage, attackSpeed: 0 };
  if (flag(row, 'IsInvisible'))
    effects.invisibleUntil = Math.max(effects.invisibleUntil ?? 0, at + duration);
}

/** Per-frame hero upkeep: staged spawns, regeneration and other passive abilities. */
export function stepHeroAbilities(
  ctx: NativeTroopContext,
  hero: NativeBattleHero,
  unit: Unit,
  townhall: number,
) {
  const at = ctx.battle.elapsed;
  refreshHeroPassives(ctx, hero, unit);
  stepEquipmentEffects(ctx, hero, unit);
  for (const ability of heroAbilities(hero)) {
    if (!ability.passive && hero.abilityUsed && text(ability.row, 'SpawnedTroop'))
      releaseSpawns(ctx, hero, unit, ability, at);
    if (!ability.passive) continue;
    stepPassive(ctx, hero, unit, ability, at, townhall);
  }
}
/** Recompute continuous effects before combat so new air deployments count immediately. */
export function refreshHeroPassives(ctx: NativeTroopContext, hero: NativeBattleHero, unit: Unit) {
  if (!ctx.battle.nativeHeroPassives || unit.hp <= 0 || unit.ejected || unit.native?.recalled)
    return;
  const at = ctx.battle.elapsed;
  for (const ability of heroAbilities(hero)) {
    if (!ability.passive) continue;
    const row = ability.row;
    // Passive equipment auras start without spending the player's ability. Track
    // the unit id so Recall starts a fresh aura on the newly deployed unit.
    const aura = text(row, 'AuraSpell');
    if (aura) {
      const state = (hero.charges ??= {});
      const key = `aura:${ability.name}`;
      if (state[key] !== unit.id) {
        state[key] = unit.id;
        castNativeSpell(
          ctx.battle,
          aura,
          num(row, 'AuraSpellLevel', 1) || 1,
          'attack',
          unit.x,
          unit.y,
          { at, follow: unit.id, owner: unit.id, immediate: true },
        );
      }
    }
    const radius = tiles(row, 'ActiveWhileAloneRadius');
    if (radius > 0) {
      const crowded = ctx.battle.units.some(
        (other) =>
          other.id !== unit.id &&
          other.id !== hero.petId &&
          other.hp > 0 &&
          !other.ejected &&
          !other.native?.recalled &&
          (other.spawnedAt ?? 0) <= at + EPS &&
          isFlyingUnit(other) &&
          heroDistance(unit, other) <= radius + EPS,
      );
      const effects = unitEffects(unit);
      if (crowded) delete effects.rampage;
      else
        effects.rampage = {
          damage: num(row, 'BoostDamagePercentage') / 100,
          attackSpeed: num(row, 'BoostAttackSpeedPercentage') / 100,
          trapProtection: num(row, 'TrapShieldProtectionPercent') / 100,
        };
    }
  }
}

function stepPassive(
  ctx: NativeTroopContext,
  hero: NativeBattleHero,
  unit: Unit,
  ability: HeroAbility,
  at: number,
  townhall: number,
) {
  const row = ability.row;
  const regeneration = num(row, 'Regeneration');
  if (regeneration > 0) {
    const interval = seconds(row, 'RegenerationTimeBetweenHitsMS') || 1;
    const state = (hero.charges ??= {});
    const key = `regen:${ability.name}`;
    const next = state[key] ?? (unit.spawnedAt ?? 0) + interval;
    if (at + EPS >= next) {
      healUnit(ctx.battle, unit, regeneration);
      state[key] = next + interval;
    }
  }
  // Items that boost on deployment (Stick Horse) apply once, for their own duration.
  const duration = seconds(row, 'DeactivateAfterTime');
  if (duration > 0 && (num(row, 'SpeedBoost') || flag(row, 'IsJumper'))) {
    const state = (hero.charges ??= {});
    const key = `deploy:${ability.name}`;
    if (!state[key]) {
      state[key] = 1;
      applyAbility(ctx, hero, unit, ability, unit.spawnedAt ?? at);
    }
  }
  void townhall;
}

/** Damage a hero adds to each hit from its items (Invisibility Vial, Noble Iron, Rocket Spears). */
export function heroExtraDamage(unit: Unit, at: number) {
  const extra = unit.native?.effects?.extraDamage;
  if (!extra || extra.until <= at + EPS) return 0;
  return extra.amount;
}
/** Consumes one charge of a limited-hit item effect. */
export function spendHeroCharge(unit: Unit, at: number) {
  const extra = unit.native?.effects?.extraDamage;
  if (!extra || extra.hits === undefined || extra.until <= at + EPS) return;
  extra.hits -= 1;
  if (extra.hits <= 0) delete unit.native!.effects!.extraDamage;
}
/** Vampstache-style life steal: SelfDamagePerHit is negative for healing. */
export function heroLifeSteal(battle: Battle, hero: NativeBattleHero, unit: Unit) {
  let heal = 0;
  for (const ability of heroAbilities(hero)) {
    const value = num(ability.row, 'SelfDamagePerHit');
    if (value < 0) heal -= value;
  }
  if (heal > 0) healUnit(battle, unit, heal);
}
/** Hero attack range and splash can be raised while an ability is active. */
export function heroCombatOverrides(unit: Unit, at: number) {
  const effects = unit.native?.effects;
  const extra = effects?.extraDamage;
  const splash = effects?.splash;
  return {
    range: extra && extra.until > at + EPS ? extra.range : undefined,
    projectile: extra && extra.until > at + EPS ? extra.projectile : undefined,
    splash: splash && splash.until > at + EPS ? splash.radius : undefined,
    jumper: splash && splash.until > at + EPS ? splash.jumper : undefined,
  };
}
/** Attack interval override (Haste Vial, Stick Horse). */
export function heroAttackInterval(unit: Unit, at: number, base: number) {
  const override = unit.native?.effects?.attackInterval;
  return override && override.until > at + EPS ? override.seconds : base;
}
export const heroStats = heroStatsFor;
export const heroDistance = (a: Unit, b: Unit) => distance2D(a.x - b.x, a.y - b.y);
export const isFlyingUnit = (u: Unit) => !!TROOPS[u.kind].flying;
