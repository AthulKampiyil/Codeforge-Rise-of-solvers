import { distance2D } from './distance';
import { TROOPS, type UnitKind } from './data';
import {
  HERO_SOURCE,
  HERO_UNIT,
  PET_UNIT,
  heroTownHallScale,
  itemStats,
  type HeroKind,
  type PetKind,
} from './native-hero-data';
import { flag, nativeRow, num, seconds, text, tiles } from './native-data';
import { nativeUnitStats, spawnStatsAt, type NativeUnitStats } from './native-units';
import { unitEffects } from './native-status';
import type { Battle, Unit } from './model';

/**
 * Version 46 hero battles. Every hero deploys with its own level, two equipment items and an
 * optional pet, all read from client 18.400.21 (heroes.csv, character_items.csv, pets.csv,
 * special_abilities.csv). Passive item stats apply all battle; the single ability activation
 * triggers the hero's heal plus both items' active abilities (official wiki: Heroes).
 */
export interface HeroItemSetup {
  slug: string;
  level: number;
}
export interface HeroSetup {
  kind: HeroKind;
  level: number;
  items: HeroItemSetup[];
  pet?: { kind: PetKind; level: number };
}
export interface NativeBattleHero extends HeroSetup {
  /** Deployed unit, or null while the hero is still in the bar. */
  unitId: number | null;
  petId?: number | null;
  /** Set once the hero has been deployed at least once. */
  deployed?: boolean;
  abilityUsed?: boolean;
  abilityAt?: number;
  /** Ability spawns already released, by ability name. */
  spawned?: Record<string, number>;
  /** Hitpoints kept by a Recall Spell. */
  recalledHp?: number;
  recalledPetHp?: number;
  /** Extra attacks the ability granted (Rocket Spears, Noble Iron). */
  charges?: Record<string, number>;
}

export const heroUnitKind = (kind: HeroKind) => HERO_UNIT[kind] as UnitKind;
export const petUnitKind = (kind: PetKind) => PET_UNIT[kind] as UnitKind;
export const heroOf = (battle: Battle, unit: Pick<Unit, 'id'>) =>
  battle.nativeHeroes?.find((hero) => hero.unitId === unit.id);
export const petOwner = (battle: Battle, unit: Pick<Unit, 'id'>) =>
  battle.nativeHeroes?.find((hero) => hero.petId === unit.id);

/** Sum of the passive stats of the equipped items. */
export function itemBonuses(hero: HeroSetup) {
  let hp = 0,
    dps = 0,
    heal = 0,
    attackSpeed = 0;
  for (const item of hero.items) {
    const stats = itemStats(item.slug, item.level);
    hp += stats.hp;
    dps += stats.dps;
    heal += stats.heal;
    attackSpeed += stats.attackSpeed;
  }
  return { hp, dps, heal, attackSpeed };
}
/** Client stats with equipment: hitpoints and DPS add, attack-speed percentages divide the interval. */
export function heroStatsFor(hero: HeroSetup, townhall: number): NativeUnitStats {
  const base = nativeUnitStats(heroUnitKind(hero.kind), hero.level);
  const bonus = itemBonuses(hero);
  const scale = heroTownHallScale(hero.kind, townhall);
  const rate = base.rate / (1 + bonus.attackSpeed);
  const dps = (base.dps + bonus.dps) * scale;
  return {
    ...base,
    hp: (base.hp + bonus.hp) * scale,
    dps,
    damage: dps * rate,
    rate,
    ...heroItemTraits(hero),
  };
}
/** Passive item columns that change how the hero fights (frost, %-hitpoint bonus, jumping). */
function heroItemTraits(hero: HeroSetup): Partial<NativeUnitStats> {
  const traits: Partial<NativeUnitStats> = {};
  for (const item of hero.items)
    for (const ability of itemStats(item.slug, item.level).abilities) {
      const row = nativeRow('abilities', ability.name, ability.level);
      if (num(row, 'FrostOnHitTime') && !flag(row, 'ActiveAfterPlayerInput')) {
        traits.frostTime = seconds(row, 'FrostOnHitTime');
        traits.frostPercent = num(row, 'FrostOnHitPercent') / 100;
      }
      if (num(row, 'ChainAttackFactor')) {
        traits.chainDistance = tiles(row, 'ChainAttackDistance');
        traits.chainDepth = num(row, 'ChainAttackDepth', 1) || 1;
        traits.chainDelay = seconds(row, 'ChainAttackDelay');
        traits.chainReduction = num(row, 'ChainAttackDamageReductionPercent') / 100;
      }
    }
  return traits;
}
/** Health restored by the ability: the hero's own heal plus both items' HealOnActivation. */
export function heroAbilityHeal(hero: HeroSetup, townhall: number) {
  const base = nativeUnitStats(heroUnitKind(hero.kind), hero.level);
  const ability = base.abilities.find((a) =>
    num(nativeRow('abilities', a.name, a.level), 'HealOnActivation'),
  );
  const own = ability
    ? num(nativeRow('abilities', ability.name, ability.level), 'HealOnActivation')
    : 0;
  return (own + itemBonuses(hero).heal) * heroTownHallScale(hero.kind, townhall);
}
/** Seconds the ability effects last (the longest DeactivateAfterTime of the triggered rows). */
export function heroAbilityDuration(hero: HeroSetup) {
  let duration = 0;
  for (const ability of heroAbilities(hero))
    duration = Math.max(duration, seconds(ability.row, 'DeactivateAfterTime'));
  return duration;
}
export interface HeroAbility {
  name: string;
  level: number;
  row: ReturnType<typeof nativeRow>;
  /** Item that provides it, or undefined for the hero's own ability. */
  item?: string;
  passive: boolean;
}
/** The hero's own ability plus every item ability, with its client row. */
export function heroAbilities(hero: HeroSetup): HeroAbility[] {
  const base = nativeUnitStats(heroUnitKind(hero.kind), hero.level);
  const own = base.abilities.map((a) => ({
    name: a.name,
    level: a.level,
    row: nativeRow('abilities', a.name, a.level),
    passive: !flag(nativeRow('abilities', a.name, a.level), 'ActiveAfterPlayerInput'),
  }));
  const items = hero.items.flatMap((item) =>
    itemStats(item.slug, item.level).abilities.map((a) => ({
      name: a.name,
      level: a.level,
      row: nativeRow('abilities', a.name, a.level),
      item: item.slug,
      passive: !flag(nativeRow('abilities', a.name, a.level), 'ActiveAfterPlayerInput'),
    })),
  );
  return [...own, ...items];
}
/** Abilities the player's single activation triggers. */
export const activeAbilities = (hero: HeroSetup) => heroAbilities(hero).filter((a) => !a.passive);

/** Pet stats at its own level. */
export const petStatsFor = (pet: { kind: PetKind; level: number }) =>
  nativeUnitStats(petUnitKind(pet.kind), pet.level);
/** TroopDef-shaped stats the shared battle loop reads (hero equipment included). */
export function heroTroopStats(hero: HeroSetup, townhall: number) {
  const stats = heroStatsFor(hero, townhall);
  return {
    ...spawnStatsAt(heroUnitKind(hero.kind) as never, hero.level),
    hp: stats.hp,
    damage: stats.damage,
    rate: stats.rate,
    speed: stats.speed,
    range: stats.range,
  };
}
export const petTroopStats = (pet: { kind: PetKind; level: number }) =>
  spawnStatsAt(petUnitKind(pet.kind) as never, pet.level);

/** A hero unit deployed in this battle (version 46+). */
export const isHeroUnit = (battle: Battle, unit: Pick<Unit, 'id' | 'kind'>) =>
  !!battle.nativeHeroes?.some((hero) => hero.unitId === unit.id);
export const isPetUnit = (battle: Battle, unit: Pick<Unit, 'id'>) =>
  !!battle.nativeHeroes?.some((hero) => hero.petId === unit.id);

/** Pets stay within LeashLength + AttackRange of their hero (official wiki). */
export function petLeash(pet: NativeUnitStats) {
  return pet.leash + pet.range;
}
export function petAnchor(battle: Battle, unit: Unit) {
  const owner = petOwner(battle, unit);
  if (!owner || owner.unitId === null) return undefined;
  const hero = battle.units.find((u) => u.id === owner.unitId && u.hp > 0);
  return hero ? { hero, owner } : { hero: undefined, owner };
}
/** Hero name for notices and the battle bar. */
export const heroDisplayName = (kind: HeroKind) => HERO_SOURCE[kind];
/** Invisible heroes and pets cannot be chosen by defenses (shared with troop rules). */
export const makeInvisible = (unit: Unit, until: number) => {
  const effects = unitEffects(unit);
  effects.invisibleUntil = Math.max(effects.invisibleUntil ?? 0, until);
};
/** Distance helper shared by hero systems. */
export const gap = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  distance2D(a.x - b.x, a.y - b.y);
export const unitIsFlying = (unit: Pick<Unit, 'kind'>) => !!TROOPS[unit.kind].flying;
export const abilityText = (row: ReturnType<typeof nativeRow>, key: string) => text(row, key);
