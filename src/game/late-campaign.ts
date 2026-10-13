import type { BuildingKind } from './data';
import {
  defendingBuilderDestroyed,
  defendingBuilderLightning,
  defendingBuilderLootHp,
  defendingBuilderPending,
  stepDefendingBuilder,
  type DefendingBuilderBattleState,
} from './defending-builder';
import type { GarrisonUnitState } from './garrison-status';
import type { Battle, Building, FX, Unit } from './model';
import type { NpcBuildingKind } from './npc-buildings';
import {
  BUILDER_HUT_READY,
  builderHutDefenseClass,
  builderHutDestroyed,
  builderHutPending,
  stepBuilderHut,
  type BuilderHutBattleState,
  type BuilderHutUnitState,
} from './builder-hut';
import {
  EAGLE_ARTILLERY_READY,
  eagleArtilleryDestroyed,
  eagleArtilleryHolds,
  eagleArtilleryPending,
  stepEagleArtillery,
  type EagleArtilleryBattleState,
  type EagleArtilleryUnitState,
} from './eagle-artillery';
import {
  FREEZE_TRAP_READY,
  freezeTimeLost,
  freezeTrapDestroyed,
  freezeTrapHolds,
  freezeTrapPending,
  isFrozen,
  stepFreezeTrap,
  type FreezeTrapBattleState,
  type FreezeTrapUnitState,
} from './freeze-trap';
import {
  GHOST_TRAP_READY,
  ghostTrapDestroyed,
  ghostTrapPending,
  stepGhostTrap,
  type GhostTrapBattleState,
  type GhostTrapUnitState,
} from './ghost-trap';
import {
  LATE_GOBLIN_BUILDINGS_READY,
  lateGoblinBuildingsDefenseClass,
  lateGoblinBuildingsDestroyed,
  lateGoblinBuildingsPending,
  stepLateGoblinBuildings,
  type LateGoblinBuildingsBattleState,
  type LateGoblinBuildingsUnitState,
} from './late-goblin-buildings';
import {
  MONOLITH_READY,
  monolithDestroyed,
  monolithPending,
  stepMonolith,
  type MonolithBattleState,
  type MonolithUnitState,
} from './monolith';
import {
  SCATTERSHOT_READY,
  scattershotDestroyed,
  scattershotPending,
  stepScattershot,
  type ScattershotBattleState,
  type ScattershotUnitState,
} from './scattershot';
import {
  SPELL_TOWER_READY,
  spellTowerDefenderBoost,
  spellTowerDefenderHidden,
  spellTowerDefenseBoost,
  spellTowerDestroyed,
  spellTowerHidden,
  spellTowerMoveScale,
  spellTowerPending,
  spellTowerTimeScale,
  stepSpellTower,
  type SpellTowerBattleState,
  type SpellTowerUnitState,
} from './spell-tower';
import {
  TORNADO_TRAP_READY,
  stepTornadoTrap,
  tornadoTrapDestroyed,
  tornadoTrapHolds,
  tornadoTrapPending,
  tornadoTrapRoots,
  type TornadoTrapBattleState,
  type TornadoTrapUnitState,
} from './tornado-trap';

/**
 * Late single-player campaign entities (client villages 62–90) join the fixed-step
 * simulation through these phases. Families run in one explicit order in every phase,
 * so replays and seeks reproduce identical state.
 *
 * - `auras`: after spell auras, before attackers act (spell towers, tornado, freeze).
 * - `projectiles`: after ordinary projectiles resolve.
 * - `traps`: after ordinary traps trigger.
 * - `defenses`: after ordinary defenses fire.
 */
export type LatePhase = 'auras' | 'projectiles' | 'traps' | 'defenses';
export interface LateCombatContext {
  battle: Battle;
  dt: number;
  phase: LatePhase;
  effect: (fx: FX) => void;
  damageBuilding: (target: Building, power: number, at?: number) => void;
}
export interface LateBattleState {
  spellTower?: SpellTowerBattleState;
  tornadoTrap?: TornadoTrapBattleState;
  freezeTrap?: FreezeTrapBattleState;
  ghostTrap?: GhostTrapBattleState;
  eagleArtillery?: EagleArtilleryBattleState;
  scattershot?: ScattershotBattleState;
  monolith?: MonolithBattleState;
  goblinBuildings?: LateGoblinBuildingsBattleState;
  builderHut?: BuilderHutBattleState;
  /** Repairing Defending Builders sent out by armed Builder's Huts (defending-builder.ts). */
  defendingBuilder?: DefendingBuilderBattleState;
}
export interface LateUnitState {
  spellTower?: SpellTowerUnitState;
  tornadoTrap?: TornadoTrapUnitState;
  freezeTrap?: FreezeTrapUnitState;
  ghostTrap?: GhostTrapUnitState;
  eagleArtillery?: EagleArtilleryUnitState;
  scattershot?: ScattershotUnitState;
  monolith?: MonolithUnitState;
  goblinBuildings?: LateGoblinBuildingsUnitState;
  builderHut?: BuilderHutUnitState;
  /** Campaign garrison defenders (Headhunter poison); see garrison-status.ts. */
  garrison?: GarrisonUnitState;
}

const FAMILIES = [
  { step: stepSpellTower, pending: spellTowerPending, destroyed: spellTowerDestroyed },
  { step: stepTornadoTrap, pending: tornadoTrapPending, destroyed: tornadoTrapDestroyed },
  { step: stepFreezeTrap, pending: freezeTrapPending, destroyed: freezeTrapDestroyed },
  { step: stepGhostTrap, pending: ghostTrapPending, destroyed: ghostTrapDestroyed },
  { step: stepEagleArtillery, pending: eagleArtilleryPending, destroyed: eagleArtilleryDestroyed },
  { step: stepScattershot, pending: scattershotPending, destroyed: scattershotDestroyed },
  { step: stepMonolith, pending: monolithPending, destroyed: monolithDestroyed },
  {
    step: stepLateGoblinBuildings,
    pending: lateGoblinBuildingsPending,
    destroyed: lateGoblinBuildingsDestroyed,
  },
  { step: stepBuilderHut, pending: builderHutPending, destroyed: builderHutDestroyed },
  {
    step: stepDefendingBuilder,
    pending: defendingBuilderPending,
    destroyed: defendingBuilderDestroyed,
  },
] as const;

export const LATE_DEFENSE_KINDS: ReadonlySet<BuildingKind> = new Set([
  'eagleartillery',
  'scattershot',
  'monolith',
  'spelltower',
]);
export const LATE_TRAP_KINDS: ReadonlySet<BuildingKind> = new Set(['tornadotrap']);
export const LATE_NPC_BUILDINGS: ReadonlySet<NpcBuildingKind> = new Set([
  'comm-mast',
  'goblin-hall',
  'goblin-castle',
  'foreboding-cave',
  'goblin-boss-th',
  'freeze-trap',
  'ghost-trap',
]);
export const isLateKind = (kind: BuildingKind) =>
  LATE_DEFENSE_KINDS.has(kind) || LATE_TRAP_KINDS.has(kind);
export const isLateBuilding = (b: Pick<Building, 'kind' | 'npc'>) =>
  isLateKind(b.kind) || (b.npc !== undefined && LATE_NPC_BUILDINGS.has(b.npc));
/** A late family building, or a campaign Builder's Hut whose level carries the nail turret. */
export const isLateCampaignBuilding = (b: Pick<Building, 'kind' | 'npc' | 'level'>) =>
  isLateBuilding(b) || (b.kind === 'builder' && !b.npc && b.level > 1);

export function stepLateCampaign(context: LateCombatContext) {
  for (const family of FAMILIES) family.step(context);
}
export const lateCampaignPending = (battle: Battle) =>
  FAMILIES.some((family) => family.pending(battle));
export function lateBuildingDestroyed(context: LateCombatContext, building: Building, at: number) {
  for (const family of FAMILIES) family.destroyed(context, building, at);
}
/** Frozen, vortex-held or Eagle Artillery-pushed attackers skip their own movement and attacks. */
export const lateUnitHeld = (battle: Battle, unit: Unit) =>
  freezeTrapHolds(battle, unit) ||
  tornadoTrapHolds(battle, unit) ||
  eagleArtilleryHolds(battle, unit);
/** Vortex-carried attackers still attack in range, but their own movement speed is zero. */
export const lateUnitRooted = (battle: Battle, unit: Unit) => tornadoTrapRoots(battle, unit);
/** Presentation only: frozen attackers are tinted and their animation clocks stop. */
export const lateUnitFrozen = (unit: Unit, at: number) => isFrozen(unit, at);
export const lateUnitTimeLost = (unit: Unit, at: number) => freezeTimeLost(unit, at);
/** Attack-timer progress (Poison `AttackSpeedBoost`). */
export const lateUnitTimeScale = (battle: Battle, unit: Unit) => spellTowerTimeScale(battle, unit);
/** Movement progress (Poison `SpeedBoost`), separate from attack timers. */
export const lateUnitMoveScale = (battle: Battle, unit: Unit) => spellTowerMoveScale(battle, unit);
export const lateBuildingHidden = (battle: Battle, building: Building) =>
  spellTowerHidden(battle, building);
/** Defensive Rage for buildings; `at` defaults to the current battle time. */
export const lateDefenseBoost = (battle: Battle, building: Building, at?: number) =>
  spellTowerDefenseBoost(battle, building, at);
/** Defensive Rage for defending units: damage multiplier and added tiles per second. */
export const lateDefenderBoost = (battle: Battle, defender: { id: number; kind: string }) =>
  spellTowerDefenderBoost(battle, defender);
/** A defending unit's stats with defensive Rage applied to primary damage and movement.
 * Returns `stats` itself without version 44 late state or an active boost. */
export function lateDefenderStats<T extends { damage: number; speed: number }>(
  battle: Battle,
  defender: { id: number; kind: string },
  stats: T,
): T {
  if (!battle.late) return stats;
  const rage = spellTowerDefenderBoost(battle, defender);
  return rage.damage === 1 && rage.speed === 0
    ? stats
    : { ...stats, damage: stats.damage * rage.damage, speed: stats.speed + rage.speed };
}
/** Defending units concealed by a defensive Invisibility pulse. */
export const lateDefenderHidden = (battle: Battle, defender: { id: number }) =>
  spellTowerDefenderHidden(battle, defender);
/** An attacker's Lightning strike: Defending Builders inside it reset their repair target. */
export const lateLightningStrike = (battle: Battle, x: number, y: number, radius: number) =>
  defendingBuilderLightning(battle, x, y, radius);
/** Hit points that count toward loot; repairs never return stolen resources. */
export const lateLootHitpoints = (battle: Battle, building: Building) =>
  defendingBuilderLootHp(battle, building);
/** ActivatedCombatAddBuildingClass=Defense: active hall weapons and woken Builder's Hut turrets
 * attract defense-targeting troops. Always false without `battle.late`. */
export const lateActivatedDefense = (battle: Battle, building: Building) =>
  !!battle.late &&
  (lateGoblinBuildingsDefenseClass(battle, building) || builderHutDefenseClass(battle, building));

export type SpellTowerWeapon = 'rage' | 'poison' | 'invisibility';
/** Client weapon GlobalIDs selected by `attack_mode_weapon` on each campaign Spell Tower. */
export const SPELL_TOWER_WEAPONS: Readonly<Record<number, SpellTowerWeapon>> = {
  49000007: 'invisibility',
  49000008: 'poison',
  49000009: 'rage',
};
export const validSpellTowerWeapon = (value: unknown): value is SpellTowerWeapon | undefined =>
  value === undefined || value === 'rage' || value === 'poison' || value === 'invisibility';

/** Source ammunition and modes that the late families model as their full starting state. */
const FULL_AMMO: Readonly<Record<number, number>> = { 1000031: 30, 1000067: 90 };
const READINESS: Readonly<Record<number, readonly [ready: boolean, name: string]>> = {
  1000031: [EAGLE_ARTILLERY_READY, 'Eagle Artillery'],
  1000067: [SCATTERSHOT_READY, 'Scattershot'],
  1000077: [MONOLITH_READY, 'Monolith'],
  1000072: [SPELL_TOWER_READY, 'Spell Tower'],
  12000016: [TORNADO_TRAP_READY, 'Tornado Trap'],
  12000018: [FREEZE_TRAP_READY, 'Goblin Freeze Trap'],
  12000019: [GHOST_TRAP_READY, 'Ghost Trap'],
  1000016: [LATE_GOBLIN_BUILDINGS_READY, 'Communications Mast'],
  1000017: [LATE_GOBLIN_BUILDINGS_READY, 'Goblin Hall'],
  1000061: [LATE_GOBLIN_BUILDINGS_READY, 'Goblin Castle'],
  1000062: [LATE_GOBLIN_BUILDINGS_READY, 'Foreboding Cave'],
  1000069: [LATE_GOBLIN_BUILDINGS_READY, 'Goblin Boss Town Hall'],
};
export const lateKey = (data: number, x: number, y: number, level: number) =>
  `${data}:${x}:${y}:${level}`;

/** Never enable a village before every late family it contains is implemented. */
export function lateCampaignIssues(
  placements: readonly (readonly [data: number, x: number, y: number, level: number])[],
) {
  const issues = new Set<string>();
  for (const [data, , , level] of placements) {
    const readiness = READINESS[data];
    if (readiness && !readiness[0]) issues.add(readiness[1]);
    // Source Builder's Hut levels 2+ carry a nail turret and a repairing Defending Builder.
    if (data === 1000015 && level > 1 && !BUILDER_HUT_READY) issues.add("Armed Builder's Hut");
  }
  return [...issues];
}

/** Explicit per-placement fields from the captured single-player selections. */
export function lateNativeFields(
  placements: readonly (readonly [data: number, x: number, y: number, level: number])[],
  states: readonly unknown[],
) {
  const fields = new Map<string, Pick<Building, 'spellTowerWeapon'>>();
  const issues = new Set<string>();
  const counts = new Map<string, number>();
  for (const [data, x, y, level] of placements) {
    const key = lateKey(data, x, y, level);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const seen = new Set<string>();
  for (const raw of states) {
    const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    if (!['data', 'x', 'y', 'lvl'].every((k) => Number.isInteger(v[k]))) {
      issues.add('Invalid late campaign state');
      continue;
    }
    const data = v.data as number,
      key = lateKey(data, v.x as number, v.y as number, (v.lvl as number) + 1);
    if (counts.get(key) !== 1 || seen.has(key)) {
      issues.add('Unmatched or duplicate late campaign state');
      continue;
    }
    seen.add(key);
    if (FULL_AMMO[data] !== undefined && v.ammo !== FULL_AMMO[data])
      issues.add('Partial late defense ammunition');
    if (v.wp_lvl !== undefined && v.wp_lvl !== 0) issues.add('Unsupported late weapon level');
    if (v.mode !== undefined && v.mode !== 0) issues.add('Unsupported bunker mode');
    if (data === 1000072) {
      const weapon = SPELL_TOWER_WEAPONS[v.attack_mode_weapon as number];
      if (!weapon) issues.add('Unknown Spell Tower weapon');
      else fields.set(key, { spellTowerWeapon: weapon });
    }
  }
  for (const [data, x, y, level] of placements)
    if (data === 1000072 && !fields.has(lateKey(data, x, y, level)))
      issues.add('Missing Spell Tower weapon');
  return { fields, issues };
}

/** Late kinds exist in version 44+ campaign recordings, and at home from version 46. */
export function validLateBuilding(
  b: Pick<Building, 'kind' | 'npc' | 'spellTowerWeapon' | 'spellMode'>,
  version: number,
  practice: boolean,
) {
  if (!validSpellTowerWeapon(b.spellTowerWeapon)) return false;
  if (b.spellTowerWeapon !== undefined && b.kind !== 'spelltower') return false;
  // A campaign Spell Tower states the weapon its layout chose; a home one states the spell its
  // owner set instead, which the native engine reads (version 51+).
  if (b.kind === 'spelltower' && b.spellTowerWeapon === undefined && b.spellMode === undefined)
    return false;
  if (!isLateBuilding(b)) return true;
  // A campaign-only identity is still never a home building: only real kinds are buildable.
  if (b.npc !== undefined) return version >= 44 && !practice;
  return version >= 46 || (version >= 44 && !practice);
}
