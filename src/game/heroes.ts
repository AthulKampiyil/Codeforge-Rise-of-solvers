import { KING_LEVELS } from './king-progression';
import { equipmentBonuses, type KingEquipment } from './equipment';

/** Hero state is independent of army housing and survives defeat. */
export interface HeroProgress {
  level: number;
  upgradeEnd?: number;
  upgradeStart?: number;
}
export interface BattleHero {
  level: number;
  townhall: number;
  equipment?: KingEquipment;
  unitId: number | null;
  abilityUsed: boolean;
  rageUntil: number;
  abilityAt?: number;
  summonsSpawned?: number;
  /** Health kept by a Recall Spell until the hero is deployed again. */
  recalledHp?: number;
}
export const HERO_MAX_LEVEL = KING_LEVELS.length;
export const heroLevelCap = (townhall: number, hall: number) =>
  KING_LEVELS.filter((level) => level.townhall <= townhall && level.hall <= hall).length;
/** What the next King level needs, so a capped hero can name its own requirement. */
export const heroNextRequirement = (level: number) => {
  const next = KING_LEVELS[level];
  return next && { townhall: next.townhall, hall: next.hall };
};
export const heroUpgradeCost = (level: number) => KING_LEVELS[level]?.cost ?? 0;
export const heroUpgradeSeconds = (level: number) => KING_LEVELS[level]?.seconds ?? 0;
export const heroTownHallScale = (townhall: number) =>
  townhall <= 4 ? 0.5 : townhall === 5 ? 0.75 : 1;
export const kingLevel = (level: number) =>
  KING_LEVELS[Math.max(0, Math.min(HERO_MAX_LEVEL, level) - 1)];

// Default equipment is level 1. Equipment selection/upgrading is a separate system.
export const KING_EQUIPMENT = {
  puppet: { hp: 309, recovery: 110 },
  vial: { dps: 17, recovery: 150 },
} as const;
export function heroStats(level: number, townhall: number, equipment?: KingEquipment) {
  const native = kingLevel(level),
    scale = heroTownHallScale(townhall),
    gear = equipmentBonuses(equipment);
  const hp = (native.hp + gear.hp) * scale;
  const dps = (native.dps + gear.dps) * scale;
  return {
    hp,
    dps,
    damage: dps * 1.2,
    speed: 2,
    range: 1,
    rate: 1.2,
  };
}
export const heroRecovery = (level: number, townhall: number, equipment?: KingEquipment) =>
  (kingLevel(level).recovery + equipmentBonuses(equipment).recovery) * heroTownHallScale(townhall);
export const HERO_ABILITY = {
  duration: 10,
  damage: 2.2,
  speedBoost: 2.25,
  summons: 8,
  spawnBatch: 5,
  spawnInterval: 0.5,
  summonDuration: 20,
  summonDamage: 2,
  summonSpeedBoost: 1.2,
} as const;
