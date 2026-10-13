import { stepDefendingHeroes } from './defending-heroes';
import { chiefProgress, completionXp, finishTimerNow } from './experience';
import {
  ACHIEVEMENTS,
  LOOT_RESOURCES,
  SLAIN_KINDS,
  achievementById,
  achievementValue,
  destroyCounts,
  emptyAchievements,
  type AchievementDef,
  type AchievementState,
} from './achievements';
import { ladderOpponent, ladderTrophies, type LadderMatch } from './ladder';
import {
  JOURNEY_ALL_OWNED_STARRY,
  JOURNEY_QUEST_MS,
  JOURNEY_QUEST_STARS,
  JOURNEY_TIERS,
  JOURNEY_TOWN_HALL,
  journeyMagicItem,
  nextJourneyEpic,
  questChests,
  questTarget,
  type JourneyState,
} from './heroes-journey';
import {
  TRADER_GEM_TOWN_HALL,
  TRADER_TOWN_HALL,
  traderWeek,
  weeklyDeals,
  type TraderOffer,
  type TraderState,
} from './trader';
import {
  MAGIC_ITEMS,
  MAGIC_ITEM_KINDS,
  advanceBoost,
  boostItem,
  wallRings,
  type BoostKind,
  type BoostTimer,
  type Boosts,
  type MagicItemKind,
  type MagicItems,
  type MagicTarget,
} from './magic-items';
import { decodeLayout, encodeLayout, fitLayout } from './layout-share';
import {
  challengeBuilding,
  challengeUnavailable,
  emptyStarter,
  eventProgress,
  STARTER_CHALLENGES,
  STARTER_END_TOWN_HALL,
  STARTER_TIERS,
  type StarterChallenge,
  type StarterEvent,
  type StarterState,
} from './starter-challenges';
import {
  HELPER_COOLDOWN_SECONDS,
  HELPER_KINDS,
  advanceHelper,
  alchemistCap,
  alchemistOutput,
  helperLevel,
  helperName,
  helperReady,
  helperWorking,
  startHelperJob,
  type ConvertResource,
  type HelperKind,
  type HelperTarget,
  type HelperTimer,
  type Helpers,
} from './helpers';
import {
  craftedModules,
  craftedName,
  moduleUpgrade,
  validCraftedKind,
  type CraftedKind,
  type ModuleLevels,
} from './crafted-defenses';
import {
  isSiege,
  superLicence,
  superOriginal,
  superMinimum,
  superLevelOffset,
} from './special-troops';
import { troopFacility } from './army-unlocks';
import nativeProgression from '../../reference/full-client/progression.json' with { type: 'json' };
import {
  stepArcherTower,
  recordArcherTowerShot,
  type ArcherTowerWindup,
} from './archer-tower-attack';
import {
  BuildingListSnapshot,
  PATH_MEMO_LIMIT,
  findSubtilePath,
  resetSubtileGrids,
  subtileSolid,
} from './subtile-path';
import {
  lateActivatedDefense,
  lateBuildingDestroyed,
  lateBuildingHidden,
  lateCampaignPending,
  lateDefenseBoost,
  lateLightningStrike,
  lateLootHitpoints,
  lateUnitHeld,
  lateUnitRooted,
  lateUnitMoveScale,
  lateUnitTimeScale,
  stepLateCampaign,
  type LateBattleState,
  type LatePhase,
  type LateUnitState,
  type SpellTowerWeapon,
} from './late-campaign';
import { validInfernoMode, type InfernoMode } from './inferno-weapon';
import { stepInfernos, type InfernoBattleState } from './inferno-battle';
import { recordCannonShot, recordCannonDestroyed, type CannonAttackState } from './cannon-attack';
import {
  launchMortarShell,
  stepMortarShells,
  recordMortarDestroyed,
  type MortarAttackState,
} from './mortar-attack';
import { distance2D } from './distance';
import { stepGarrisonReleases, type GarrisonState } from './garrison-release';
import { garrisonUnitScales } from './garrison-status';
import { campaignGarrisonSetup } from './garrison-campaign';
import {
  recordWizardTowerShot,
  recordWizardTowerDestroyed,
  type WizardTowerAttackState,
} from './wizard-tower-attack';
import {
  recordBombTowerShot,
  recordBombTowerDestroyed,
  type BombTowerAttackState,
} from './bomb-tower-attack';
import { recordTeslaShot, type TeslaAttackState } from './tesla-attack';
import { darkStorageCapacity } from './dark-storage-stats';
import {
  emptyStarBonus,
  emptyTreasury,
  leagueFor,
  STAR_BONUS_COOLDOWN,
  STAR_BONUS_STARS,
  starBonusReward,
  TOWN_HALL_BOOST_MULTIPLIER,
  townHallBoostHours,
  TREASURY_RESOURCES,
  treasuryCapacity,
  type StarBonus,
  type StarBonusReward,
  type Treasury,
} from './leagues';
import { SOURCE_NAME, STARTING_GRANT } from './townhall-catalog';
import {
  campaignStage,
  campaignStages,
  validCampaignCatalog,
  type CampaignCatalog,
} from './campaign-catalog';
import {
  NATIVE_CAMPAIGN,
  freshNativeCampaign,
  goblinMap,
  nativeBuildings,
  nativeCampaignIssues,
  nativeDefendingHeroes,
  nativeScenery,
  nativeUnlocked,
  type NativeCampaignProgress,
  type CampaignScenery,
} from './native-campaign';
import {
  NPC_BUILDINGS,
  TUTORIAL_CANNON_DAMAGE,
  validNpcBuilding,
  type NpcBuildingKind,
} from './npc-buildings';
import {
  freshCampaignLoot,
  campaignAmount,
  campaignResourceKeys,
  campaignResources,
  type CampaignLoot,
  type CampaignResources,
} from './campaign-loot';
import { concealedTesla, presentBuilding, targetableBuilding, revealTeslas } from './hidden-tesla';
import {
  emptyOres,
  oreCapacity,
  equipmentBonuses,
  validEquipmentKind,
  EQUIPMENT_LEVELS,
  EQUIPMENT_KEYS,
  ORE_KEYS,
  ORES,
  type KingEquipment,
  type Ores,
  type EquipmentKind,
} from './equipment';
import { startKingQuake, stepKingQuakes, type KingQuake } from './king-quake';
import { validDirection } from './air-control-stats';
import { validSkeletonMode, SKELETON_COFFIN_SECONDS, type SkeletonMode } from './skeleton-stats';
import { validXbowMode, type XbowMode, type XbowState } from './xbow-stats';
import { stepXbow } from './xbow';
import {
  stepDefenders,
  stepAttackerVsDefenders,
  damageDefenders,
  type Defender,
} from './defenders';
import { primeDeathBomb, stepDeathBombs, bombTowerDeathDamage, type DeathBomb } from './bomb-tower';
import { wizardTowerProjectileTier } from './wizard-tower-stats';
import {
  stepSweepers,
  stepAirPush,
  recordSweeperDestroyed,
  type SweeperHistory,
  type AirGust,
  type SweeperState,
  type AirPush,
} from './air-sweeper';
import { isDefense } from './data';
import { BUILDING_COUNTS } from './tiers';
/** Weapon order for the home Spell Tower selector. */
const SPELL_TOWER_CYCLE = ['rage', 'poison', 'invisibility'] as const;
import { campCapacity } from './camp-stats';
import { spellFactoryCapacity, facilityProgression } from './facility-progression';
import {
  maxSpellLevelFor,
  spellProgression,
  LIGHTNING_STUN,
  freezeSeconds,
  cloneHousing,
  CLONE_LIFETIME,
  recallHousing,
  reviveFraction,
  RAGE_HERO_MULTIPLIER,
  SPELL_SPEED_SCALE,
} from './spell-progression';
import {
  startSpellAura,
  stepSpellAuras,
  untargetable,
  openBreaches,
  type AuraSpell,
} from './spell-effects';
import { prepareHealerTargets, stepHealer } from './healing';
import { MAP_SIZE, BUILD_MIN, BUILD_MAX } from './grid';
import { wallDestinations, wallMoveIssue, type WallMove } from './wall-movement';
import { wallRow, matchingWalls, type WallAxis, type WallResource } from './wall-selection';
import {
  OBSTACLES,
  OBSTACLE_GEMS,
  GEM_BOX_PERIOD,
  initialObstacles,
  overlapsObstacle,
  initialObstacleGrowth,
  advanceObstacles,
  type ObstacleGrowth,
  type Obstacle,
} from './obstacles';
import { TROOP_UNLOCK, SPELL_UNLOCK, facilityLevel, spellFactory } from './army-unlocks';
import {
  DECORATIONS,
  DECORATION_TEXTS,
  decorationFootprints,
  insideMap,
  overlapsDecoration,
  ownedDecorations,
  type Decoration,
  type DecorationKind,
  type StashedDecorations,
} from './decorations';
import { villageObjectFootprints } from './village-objects';
import {
  GEM_TEXTS,
  isGemResource,
  packAmount,
  resourceGems,
  type GemResource,
  type TreasurePack,
} from './gem-costs';
import {
  REPLAY_VERSION,
  compatibleReplayVersion,
  REPLAY_LIMIT,
  MAX_REPLAY_STEPS,
  MAX_REPLAY_ACTIONS,
  MAX_REPLAY_STEPS_PER_UPDATE,
  MAX_REPLAY_UPDATE_MS,
  replayBattle,
  validateReplay,
  type ReplayData,
  type ReplayAction,
  type ReplayPlayback,
} from './replay';
import {
  HERO_ABILITY,
  heroStats,
  heroRecovery,
  heroLevelCap,
  heroUpgradeCost,
  heroUpgradeSeconds,
  type HeroProgress,
  type BattleHero,
} from './heroes';
import {
  launchProjectile,
  stepProjectiles,
  type CombatProjectile,
  type Weapon,
} from './projectiles';
import { campaignBlueprint, CAMPAIGN_LAYOUTS } from './campaign';
import {
  armySpace,
  spellSpace,
  emptyArmy,
  emptySpells,
  defaultSpellLevels,
  expandArmyRoster,
  type ArmyPreset,
  type PresetHero,
} from './army';
import { ARMY_RECIPE_TEXTS, armyRecipesFor } from './army-recipes';
import {
  PRACTICE_LEVELS,
  practiceLevelAt,
  practiceUnitName,
  sameUnit,
  type PracticeStep,
  type PracticeUnit,
} from './practice-mode';
import { stepTraps, type TrapState } from './traps';
import { shrinkStepTime, type ShrinkStatus } from './shrink-trap';
import {
  BUILDINGS,
  TROOPS,
  SPELLS,
  TROOP_KEYS,
  SPELL_KEYS,
  RELEASED_SPELL_KEYS,
  CAMPAIGN,
  isSpellKind,
  spellStatsAt,
  maxTroopLevel,
  researchLevelForLab,
  defenseDamage,
  isResourceBuilding,
  isTrap,
  needsBuilder,
  gemCost,
  maxCountFor,
  maxLevelFor,
  producedResource,
  researchCost,
  researchSeconds,
  researchLaboratory,
  troopStatsAt,
  buildPrice,
  storageCapacity,
  townHallCapacity,
  buildingHp,
  upgradeCost,
  upgradeSeconds,
  type BuildingKind,
  type TroopKind,
  type UnitKind,
  type SpellKind,
  type ResearchKind,
  type Resource,
} from './data';
import {
  initialNativeState,
  nativeBehavior,
  resolveNativeDeath,
  resolveNativeImpact,
  statsFor,
  stepNativeBattle,
  stepNativeUnit,
  type NativeUnitState,
  type NativeDeathBlast,
  type NativeChainHop,
  type NativeTroopContext,
  type NativePendingSpawn,
} from './native-troops';
import type { NativeSpellCast } from './native-spells';
import {
  buildingAttackIntervalScale,
  buildingDamageScale,
  buildingHidden,
  buildingImmune,
  hurtUnit,
  unitDamageScale,
  unitFrozen,
  unitSpeedBonus,
  unitSpeedScale,
  type BuildingEffects,
} from './native-status';
import { jumpWalls, castNativeSpell, nativeSpellCanStillFight } from './native-spells';
import {
  activeAsDefense,
  heroWakeSpace,
  nativeDefense,
  noteBuildingDamage,
  recordWakeSpace,
  resolveDefenseImpact,
  spellWakeSpace,
  stepNativeDefense,
  stepPiercingShots,
  troopWakeSpace,
  type NativeDefenseContext,
  type NativeDefenseState,
  type NativePiercingShot,
} from './native-defenses';
import { buildingMaxHp, superchargeBonus, superchargeQuote } from './native-supercharge';
import { isCollector, produceCollector } from './collector-production';
import {
  MERGED_KINDS,
  consumedByMerges,
  isMergedKind,
  gearUpQuote,
  isGearable,
  mergeInputs,
  mergeQuote,
  townHallMergeInputs,
  type MergedKind,
} from './native-merges';
import {
  spellTowerModes,
  townHallWeaponUpgrade,
  type GearMode,
  type SpellTowerMode,
} from './native-defense-stats';
import { alwaysVisibleTrap } from './native-traps';
import {
  HERO_KINDS,
  HERO_SOURCE,
  PET_DISPLAY,
  PET_KINDS,
  heroLevelCap as rosterLevelCap,
  heroSlots,
  heroUnlockHall,
  heroUnlockTownHall,
  heroUpgradeQuote,
  itemHero,
  itemLevelCap,
  itemName,
  itemMaxLevel,
  heroDefaultItems,
  itemRarity,
  itemUpgradeCost,
  petLevelCap,
  petMaxLevel,
  petUnlockHouse,
  petUpgradeQuote,
  validItem,
  type HeroKind,
  type PetKind,
} from './native-hero-data';
import {
  gearFromLegacy,
  mergeLegacyEquipment,
  LEGACY_ITEM,
  unlockCommonItems,
  type HeroGear,
  type HeroRosterProgress,
  type PetProgress,
} from './native-hero-village';

/** Official wiki: Epic equipment from the Trader costs 1,500 gems. */
export const EPIC_ITEM_GEMS = 1500;
import {
  GUARDIAN_KINDS,
  GUARDIAN_NAMES,
  guardianUpgrade,
  stepGuardians,
  type GuardianKind,
} from './native-guardians';
/** Spells that can still destroy buildings or create attackers keep a version 45 battle open. */
const FIGHTING_SPELLS: readonly SpellKind[] = ['earthquake', 'skeleton', 'bat'];
import { SPELL_SOURCE } from './spell-progression';
import { isHeroUnitKind, isPetUnitKind, isSpawnKind, spawnStatsAt } from './native-units';
import { spawnNativeUnit } from './native-troops';
import type { VillageOutpostsSnapshot, VillageProfile } from '../cp/types';
import {
  CP_VILLAGE_TOPIC_SLOTS,
  TOPIC_OUTPOST_DEFAULT_POSITIONS,
  TOPIC_OUTPOST_LAYOUT_RULES,
  isValidTopicOutpostLayout,
  mapVillageProfile,
  type TopicOutpostFacing,
  type TopicOutpostLayout,
  type TopicOutpostLayoutItem,
  type VillagePresentation,
} from '../cp/village-presentation';
import {
  heroOf,
  heroTroopStats,
  heroUnitKind,
  petOwner,
  petTroopStats,
  petUnitKind,
  type HeroSetup,
  type NativeBattleHero,
} from './native-heroes';
import { activateHero, refreshHeroPassives, stepHeroAbilities } from './native-hero-abilities';

/** What a Book finishes: a building's running upgrade, the research, a hero's or the pets'. */
export type BookTarget =
  { building: number } | { research: true } | { hero: HeroKind } | { pet: true };
/** What a Hammer upgrades. */
export type HammerTarget =
  { building: number } | { research: ResearchKind } | { hero: HeroKind } | { pet: PetKind };
export interface Building {
  /** Campaign-only identity; the kind remains a geometry/targeting archetype. */
  npc?: NpcBuildingKind;
  id: number;
  kind: BuildingKind;
  x: number;
  y: number;
  level: number;
  hp: number;
  maxHp: number;
  upgradeEnd?: number;
  /** Set alongside upgradeEnd so progress bars are exact for any timer length. */
  upgradeStart?: number;
  constructing?: boolean;
  stored: number;
  cooldown: number;
  /** Air Sweeper orientation in 45-degree map increments; absent means zero. */
  direction?: number;
  skeletonMode?: SkeletonMode;
  xbowMode?: XbowMode;
  infernoMode?: InfernoMode;
  /** Battle setup ammunition; omitted means full capacity. Not a home inventory. */
  infernoAmmo?: number;
  /** Campaign Spell Tower weapon selected by the source layout. */
  spellTowerWeapon?: SpellTowerWeapon;
  /** Spell Tower spell chosen by the owner; absent means the layout's weapon, then Rage. */
  spellMode?: SpellTowerMode;
  /** Multi-Gear Tower attack mode; absent means Long Range. */
  gearMode?: GearMode;
  /** Town Hall 17 Inferno Artillery weapon level; absent means 1. */
  weaponLevel?: number;
  /** A running builder job that improves the building without raising its level. */
  improving?: 'weapon' | 'gearup' | 'supercharge' | 'guardian' | 'module';
  /** Crafting Station: the Crafted Defense on the platform (absent while it stands empty). */
  crafted?: CraftedKind;
  /** Crafting Station: module levels of each Crafted Defense, kept when switching. */
  craftedModules?: Partial<Record<CraftedKind, ModuleLevels>>;
  /** Crafting Station: the module a running `improving: 'module'` job raises. */
  moduleUpgrade?: { kind: CraftedKind; module: number };
  /** Completed supercharges at the building's maximum level. */
  supercharge?: number;
  /** Town Hall 18 Guardian selection and its level. */
  guardian?: GuardianKind;
  guardianLevel?: number;
  /** Geared-up Cannon, Archer Tower or Mortar: permanently uses the client Alt* attack. */
  geared?: true;
}
export interface QueueItem {
  kind: TroopKind;
  end: number;
}
export interface SpellQueueItem {
  kind: SpellKind;
  end: number;
}
export interface Layout {
  name: string;
  slots: {
    id: number;
    x: number;
    y: number;
    direction?: number;
    skeletonMode?: SkeletonMode;
    xbowMode?: XbowMode;
    spellTowerWeapon?: SpellTowerWeapon;
    infernoMode?: InfernoMode;
    /** Active Spell Tower spell and Multi-Gear Tower mode (absent in older layouts). */
    spellMode?: SpellTowerMode;
    gearMode?: GearMode;
  }[];
}
export type Army = Record<TroopKind, number>;
export type SpellBook = Record<SpellKind, number>;
export interface BattleResult {
  /** Resources removed from the enemy that could not fit in home storages. */
  lostLoot?: CampaignResources;
  gold: number;
  elixir: number;
  dark?: number;
  trophies: number;
  stars: number;
  destruction: number;
}
export interface ServerEconomySnapshot {
  gold: number;
  elixir: number;
  gems: number;
  builderCapacity: number;
  username: string;
}
export interface RaidRecord {
  catalog?: CampaignCatalog;
  id: number;
  at: number;
  index: number;
  practice: boolean;
  /** A ladder match: the opponent's trophies and the stake (see ladder.ts). */
  ladder?: LadderMatch;
  duration: number;
  result: BattleResult;
  deployed: Army;
  spells: SpellBook;
  /** The King of a battle before the hero roster (older records of any hero read as the King). */
  hero?: { level: number; abilityUsed: boolean };
  /** Every hero deployed in a roster battle, in lineup order. */
  heroes?: RaidHero[];
  replay?: ReplayData;
  replayUnavailable?: 'limit';
}
export interface RaidHero {
  kind: HeroKind;
  level: number;
  abilityUsed: boolean;
}
export interface Save {
  superBoosts?: Partial<Record<TroopKind, number>>;
  nativeCampaign?: NativeCampaignProgress;
  version: 4;
  mapUpgrade?: { moved: number };
  dark: number;
  king?: HeroProgress;
  /** Archer Queen, Minion Prince, Grand Warden, Royal Champion and Dragon Duke progress. */
  heroes?: Partial<Record<Exclude<HeroKind, 'king'>, HeroRosterProgress>>;
  /** Every owned hero item and each hero's two-item loadout (replaces `equipment`). */
  gear?: HeroGear;
  /** Pet levels, hero assignments and the running Pet House upgrade. */
  pets?: PetProgress;
  /** Heroes chosen for attacks, in slot order (limited by Hero Hall slots). */
  heroLineup?: HeroKind[];
  equipment?: KingEquipment;
  ores?: Ores;
  /** Stars banked toward the daily Star Bonus, and when it may next be taken. */
  starBonus?: StarBonus;
  /** The Clan Castle's Treasury: Star Bonus loot waiting to be collected. */
  treasury?: Treasury;
  gold: number;
  elixir: number;
  gems: number;
  trophies: number;
  xp: number;
  buildings: Building[];
  obstacles?: Obstacle[];
  obstacleGemIndex?: number;
  obstacleGrowth?: ObstacleGrowth;
  /** Placed decorations, and the bought ones held in the Shop; see decorations.ts. */
  decorations?: Decoration[];
  stashedDecorations?: StashedDecorations;
  /** Ladder matches played; seeds the next opponent. */
  ladderSeed?: number;
  /** Hero's Journey: tiers taken and the running Hero Quest. */
  journey?: JourneyState;
  /** Magic items held, by kind. */
  magicItems?: MagicItems;
  /** Running potions; see magic-items.ts. */
  boosts?: Boosts;
  /** This week's Trader purchases; see trader.ts. */
  trader?: TraderState;
  /** Starter Challenge progress and claimed tiers (Town Halls 2 to 6). */
  starter?: StarterState;
  /** Helper Hut helpers bought with gems; see helpers.ts. */
  helpers?: Helpers;
  army: Army;
  queue: QueueItem[];
  spells: SpellBook;
  spellQueue: SpellQueueItem[];
  stars: number[];
  campaignLoot?: CampaignLoot;
  lastTick: number;
  /**
   * Storage commit counter, higher on every write. Loading prefers the store holding the higher
   * revision: `lastTick` follows the economy clock and can tie between an old and a new write.
   */
  saveRevision?: number;
  nextId: number;
  tutorial: boolean;
  /** The opening Goblin raid on this village has been watched (or skipped). */
  goblinRaidSeen?: boolean;
  /** Retired local quests; kept so older saves still load. */
  claimedQuests?: string[];
  achievements?: AchievementState;
  troopLevels?: Record<TroopKind, number>;
  spellLevels?: Record<SpellKind, number>;
  research?: { kind: ResearchKind; end: number };
  lastArmy?: Army;
  lastSpells?: SpellBook;
  layouts?: Layout[];
  armyPresets?: (ArmyPreset | null)[];
  raidLog?: RaidRecord[];
  settings: {
    sound: boolean;
    music: boolean;
    reducedMotion: boolean;
    /** Live attack speed (1×, 2× or 4×); absent means 1×. Replays keep their own speed. */
    battleSpeed?: BattleSpeed;
    /** Full motion although the operating system asks to reduce it (an explicit override). */
    fullMotion?: boolean;
    /** Battery saver: 30 FPS in play and at most 2× canvas density; absent means off. */
    batterySaver?: boolean;
    /** Vibration on phones that support it; absent means on. */
    haptics?: boolean;
  };
  stats: {
    /** Campaign raids completed, whatever their result. */
    raids: number;
    /** Campaign raids that earned at least one star. */
    wins?: number;
    destroyed: number;
    collected: number;
    built?: number;
    trained?: number;
  };
}
export interface Unit {
  id: number;
  kind: UnitKind;
  /** Explicit level for units without an army research entry (spawned units). */
  level?: number;
  /** Native roster state created only by version 45+ battles. */
  native?: NativeUnitState;
  /** Legacy battles mark the King; version 46 battles name the hero kind. */
  hero?: HeroKind;
  summoned?: boolean;
  spawnedAt?: number;
  rageUntil?: number;
  spellRageUntil?: number;
  /** Set only by the Invisibility Spell, so a battle without one is byte-identical. */
  invisibleUntil?: number;
  /** Set only on a Clone Spell copy: the moment it fades, whether or not it has fought. */
  fadesAt?: number;
  healTarget?: number;
  defenderTarget?: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  cooldown: number;
  target: number | null;
  path: { x: number; y: number }[];
  pathAt: number;
  attacking: boolean;
  /** Set once a destroyed troop has resolved its death effect. */
  spent?: boolean;
  /** Simulation time of defeat, retained when reconstructing a battle for display. */
  defeatedAt?: number;
  ejected?: boolean;
  springUntil?: number;
  airPush?: AirPush;
  shrink?: ShrinkStatus;
  /** Status applied by late single-player campaign families. */
  late?: LateUnitState;
}
export interface Aura {
  kind: SpellKind;
  x: number;
  y: number;
  end: number;
  start: number;
  pulses: number;
}
export interface MortarShell {
  sourceId: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  launched: number;
  impact: number;
  damage: number;
  radius: number;
}
export interface Battle {
  /** Version 45+: native troop abilities, spawned units, statuses and delayed death effects. */
  nativeRoster?: true;
  nativeContentExpansion?: true;
  /** Version 53: passive hero auras and Royal Rampage. */
  nativeHeroPassives?: true;
  /** Version 54: crowd separation moves a unit at most SEPARATION_TILES_PER_SECOND. */
  separationCap?: true;
  /**
   * Version 54: once nothing is left to deploy, summoned units alone cannot hold a battle
   * open after STALLED_BATTLE_SECONDS without damage to a building or defender.
   */
  stalledSupportEnds?: true;
  /**
   * Version 54: fallen units and skeletons drop their route waypoints. Nothing reads them, but
   * archived battle-state hashes include them, so older versions keep them.
   */
  dropFallenPaths?: true;
  /** Version 54: last time a structure or defender lost hit points, and their total then. */
  progressAt?: number;
  progressHp?: number;
  siegeDeployed?: boolean;
  nativeSpells?: NativeSpellCast[];
  nativeSpellSequence?: number;
  nativeDeaths?: NativeDeathBlast[];
  nativeChains?: NativeChainHop[];
  buildingEffects?: Record<number, BuildingEffects>;
  /** Scheduled unit arrivals (Ruin Knights, thrown Meteormites). */
  nativePendingSpawns?: NativePendingSpawn[];
  /** Destroyed buildings whose rubble a Ruin Witch has already vacuumed. */
  consumedRubble?: number[];
  /** Active Jump Spell wall set signature; a change forces ground troops to re-route. */
  jumpSignature?: string;
  jumpVersion?: number;
  /** Town Hall 11-18 defense weapon state, keyed by building id. */
  nativeDefenses?: Record<number, NativeDefenseState>;
  /** Cumulative activation housing after each deployment (Eagle Artillery, Builder's Huts). */
  nativeDeployments?: { at: number; space: number }[];
  /** Firespitter balls in flight. */
  nativePiercing?: NativePiercingShot[];
  nativeShotSequence?: number;
  /** Town Hall 18 Guardians have been placed for this battle. */
  guardiansPlaced?: true;
  /** Version 46+: the complete hero roster with equipment and pets. */
  nativeHeroRoster?: true;
  nativeHeroes?: NativeBattleHero[];
  /** Town Hall level of the attacker, for hero scaling. */
  townhall?: number;
  /** Health of recalled troops waiting in the deployment bar, first recalled first redeployed. */
  recalledHp?: Partial<Record<TroopKind, number[]>>;
  catalog?: CampaignCatalog;
  scenery?: CampaignScenery[];
  troopLevels?: Army;
  spellLevels?: SpellBook;
  index: number;
  practice: boolean;
  /** A ladder match against a native layout: timed, trophies at stake, no loot. */
  ladder?: LadderMatch;
  /** A Practice Mode level: fought with the army it provides, not the player's own. */
  fixedArmy?: boolean;
  carriedArmy: Army;
  buildings: Building[];
  units: Unit[];
  remaining: Army;
  spells: SpellBook;
  /** What the raid started with, so emptied slots stay in place. */
  carried: SpellBook;
  auras: Aura[];
  shells: MortarShell[];
  /** Only version-34 playback uses the original fixed Mortar flight. */
  legacyMortarFlight?: true;
  mortars?: Record<number, MortarAttackState>;
  /** Versions 34–35 retain fixed-deadline normal Cannon shots at the previous speed. */
  legacyCannonFlight?: true;
  cannons?: Record<number, CannonAttackState>;
  /** Version 41+ tower arrows travel at source speed while tracking the original target. */
  nativeArcherTowers?: true;
  archerTowerWindups?: Record<number, ArcherTowerWindup>;
  /** Latest actual release per tower; bounded presentation history for version 41+. */
  archerTowerShots?: Record<number, { at: number; x: number; y: number }>;
  archerTowerDestructions?: Record<number, { at: number; x: number; y: number; level: number }>;
  archerTowerReleases?: { id: number; level: number; at: number }[];
  archerTowerHits?: {
    id: string;
    sourceId: number;
    level: number;
    at: number;
    x: number;
    y: number;
    air: boolean;
  }[];
  projectiles?: CombatProjectile[];
  defenseTargets: Record<number, number>;
  defenseStuns: Record<number, number>;
  traps: Record<number, TrapState>;
  gusts?: AirGust[];
  sweepers?: Record<number, SweeperState>;
  airSweepers?: Record<number, SweeperHistory>;
  xbows?: Record<number, XbowState>;
  infernos?: Record<number, InfernoBattleState>;
  nativeInfernoAmmo?: true;
  /** Original Drill destruction presentation, enabled by replay version 40. */
  drillDestructions?: Record<number, { at: number; x: number; y: number; level: number }>;
  teslas?: Record<number, TeslaAttackState>;
  bombTowers?: Record<number, BombTowerAttackState>;
  wizardTowers?: Record<number, WizardTowerAttackState>;
  /** Reveal time in battle seconds. Never persisted in the home village. */
  revealedTeslas?: Record<number, number>;
  deathBombs?: Record<number, DeathBomb>;
  defenders?: Defender[];
  garrisons?: GarrisonState[];
  /** Late single-player campaign family state (version 44+). */
  late?: LateBattleState;
  /** Version 44+ native campaign battles use the client's sub-tile building collision. */
  nativeSubtiles?: true;
  hero?: BattleHero;
  kingQuakes?: KingQuake[];
  elapsed: number;
  /** Practice countdown. Campaign scouting has no deadline. */
  prep: number;
  started: boolean;
  finished: boolean;
  destruction: number;
  stars: number;
  loot: CampaignResources;
  /** Enemy inventory at entry, independent of the home village and future raids. */
  availableLoot?: CampaignResources;
  /** Removed from enemy inventory, including any overflow. */
  lootTaken?: CampaignResources;
  /** Raid-capped storage headroom, preserved in recorded attacks. */
  lootRoom?: CampaignResources;
  result?: BattleResult;
  seed: number;
}
export type FX = {
  type:
    | 'hit'
    | 'destroy'
    | 'projectile'
    | 'impact'
    | 'archertower-pickup'
    | 'archertower-place'
    | 'archertower-cancel'
    | 'darkdrill-pickup'
    | 'darkdrill-place'
    | 'darkdrill-cancel'
    | 'cannon-pickup'
    | 'cannon-place'
    | 'cannon-cancel'
    | 'mortar-fire'
    | 'mortar-pickup'
    | 'mortar-place'
    | 'mortar-cancel'
    | 'collect'
    | 'spawn'
    | 'upgrade'
    | 'spell'
    | 'blast'
    | 'breath'
    | 'trap'
    | 'spring'
    | 'gust'
    | 'airsweeper-pickup'
    | 'airsweeper-place'
    | 'airsweeper-cancel'
    | 'tesla-reveal'
    | 'tesla-zap'
    | 'tesla-pickup'
    | 'tesla-place'
    | 'tesla-cancel'
    | 'bombtower-pickup'
    | 'bombtower-place'
    | 'bombtower-cancel'
    | 'wizardtower-pickup'
    | 'wizardtower-place'
    | 'wizardtower-cancel'
    | 'seekingairmine-pickup'
    | 'seekingairmine-place'
    | 'seekingairmine-cancel'
    | 'spell-native'
    | 'defense-zap'
    | 'quake';
  x: number;
  y: number;
  toX?: number;
  toY?: number;
  color?: number;
  text?: string;
  spell?: SpellKind;
  radius?: number;
  /** An `upgrade` effect's finished building, or the gems a cleared obstacle paid. */
  building?: BuildingKind;
  gems?: number;
  /** An `upgrade` effect for a finished hero upgrade or research, at its hall or laboratory. */
  finished?: 'hero' | 'research';
  /** Presentation only: weapon identity and the source/target entities. */
  weapon?: Weapon;
  projectileId?: string;
  sourceId?: number;
  targetId?: number;
  targetBuilding?: boolean;
  targetDefender?: boolean;
  sourceDefender?: boolean;
  /** Marks either end of a projectile as airborne so the scene can lift it. */
  fromAir?: boolean;
  toAir?: boolean;
  /** A landmark loss — the Town Hall — worth shaking the screen for. */
  major?: boolean;
};
export const PREP_SECONDS = 30;
export const BATTLE_SECONDS = 180;
/** The opening Goblin raid: how many goblins, and the step its recording advances by. */
export const GOBLIN_RAID_SIZE = 10;
const GOBLIN_RAID_TICK = 0.05;
export const BATTLE_SPEEDS = [1, 2, 4] as const;
export type BattleSpeed = (typeof BATTLE_SPEEDS)[number];
export type TopicOutpostProjection = Omit<VillagePresentation, 'slots'> & {
  slots: (VillagePresentation['slots'][number] & {
    purchasedTier: number | null;
    outpostTierAvailable: boolean;
    x: number;
    y: number;
    facing: TopicOutpostFacing;
  })[];
};
/** Practice and ladder matches scout for 30 seconds and fight for three minutes. */
/** The longest a Practice guide waits for a building to fall, in battle seconds. */
export const GUIDE_WAIT_LIMIT = 60;
export const timedBattle = (b: { practice: boolean; ladder?: LadderMatch }) =>
  b.practice || !!b.ladder;
export class GameModel {
  state: Save;
  readonly serverReadOnly: boolean;
  serverEconomy: ServerEconomySnapshot | null = null;
  /** A detached, server-owned topic snapshot used only by the read-only village projection. */
  private serverVillage: VillageProfile | null = null;
  private serverOutposts: VillageOutpostsSnapshot | null = null;
  private serverTopicOutpostLayout: TopicOutpostLayout | null = null;
  private topicOutpostDraft: TopicOutpostLayoutItem[] | null = null;
  private topicOutpostEditing = false;
  private selectedTopic = '';
  get selectedTopicKey() {
    return this.selectedTopic || null;
  }
  get topicOutpostEditMode() {
    return this.topicOutpostEditing;
  }
  /** Server layout when present, otherwise the contract's canonical initial arrangement. */
  get topicOutpostLayout(): TopicOutpostLayout | null {
    if (this.serverTopicOutpostLayout) return this.copyTopicOutpostLayout(this.serverTopicOutpostLayout);
    if (!this.serverReadOnly || !this.serverVillage) return null;
    const mapped = mapVillageProfile(this.serverVillage).slots;
    if (mapped.some((slot) => !slot.topicId)) return null;
    return {
      revision: 0,
      rules_version: 1,
      rules: { ...TOPIC_OUTPOST_LAYOUT_RULES, allowed_facings: [...TOPIC_OUTPOST_LAYOUT_RULES.allowed_facings] },
      items: CP_VILLAGE_TOPIC_SLOTS.map((slot) => {
        const position = TOPIC_OUTPOST_DEFAULT_POSITIONS[slot.slug];
        return {
          topic_id: mapped.find((entry) => entry.slotId === slot.id)!.topicId!,
          topic_key: slot.slug,
          x: position.x,
          y: position.y,
          facing: 'default',
        };
      }),
    };
  }
  get topicOutpostDraftItems(): TopicOutpostLayoutItem[] | null {
    return this.topicOutpostDraft?.map((item) => ({ ...item })) ?? null;
  }
  get topicOutpostDraftChanged() {
    const base = this.topicOutpostLayout;
    return !!this.topicOutpostEditing && !!this.topicOutpostDraft && !!base &&
      JSON.stringify(this.canonicalTopicItems(this.topicOutpostDraft)) !== JSON.stringify(this.canonicalTopicItems(base.items));
  }
  get topicOutpostDraftValid() {
    const base = this.topicOutpostLayout;
    return !!this.topicOutpostEditing && !!this.topicOutpostDraft && !!base &&
      isValidTopicOutpostLayout({ ...base, items: this.topicOutpostDraft });
  }
  /** Exact versioned draft for the Save owner; this method never persists or sends it. */
  get topicOutpostDraftForSave(): TopicOutpostLayout | null {
    const base = this.topicOutpostLayout;
    return this.topicOutpostDraftChanged && this.topicOutpostDraftValid && base
      ? this.copyTopicOutpostLayout({ ...base, items: this.topicOutpostDraft! })
      : null;
  }
  get topicOutposts(): TopicOutpostProjection | null {
    if (!this.serverReadOnly || !this.serverVillage) return null;
    const presentation = mapVillageProfile(this.serverVillage);
    const layout = this.topicOutpostDraft
      ? { items: this.topicOutpostDraft }
      : this.topicOutpostLayout;
    return {
      ...presentation,
      slots: presentation.slots.map((slot) => {
        const matches = slot.topicId && Array.isArray(this.serverOutposts?.items)
          ? this.serverOutposts.items.filter((item) => item.topic_id === slot.topicId)
          : [];
        const candidate = matches?.length === 1 ? matches[0] : undefined;
        const available = !!candidate && Number.isSafeInteger(candidate.tier) && candidate.tier >= 0 && candidate.tier <= 5;
        const slotDef = CP_VILLAGE_TOPIC_SLOTS.find((entry) => entry.id === slot.slotId)!;
        const item = layout?.items.find((entry) => entry.topic_key === slotDef.slug);
        const fallback = TOPIC_OUTPOST_DEFAULT_POSITIONS[slotDef.slug];
        return {
          ...slot,
          purchasedTier: available ? candidate!.tier : null,
          outpostTierAvailable: available,
          x: item?.x ?? fallback.x,
          y: item?.y ?? fallback.y,
          facing: item?.facing ?? 'default',
        };
      }),
    };
  }
  setServerVillage(profile: VillageProfile | null) {
    if (!this.serverReadOnly) return;
    this.serverVillage = profile
      ? { ...profile, topics: Array.isArray(profile.topics) ? profile.topics.map((topic) => ({ ...topic })) : [] }
      : null;
    this.changed();
  }
  /** Applies the server-owned topic, purchased-tier and wallet view as one revision. */
  setServerVillageSnapshot(
    profile: VillageProfile | null,
    economy: ServerEconomySnapshot | null,
    outposts: VillageOutpostsSnapshot | null,
  ) {
    if (!this.serverReadOnly) return;
    const changedUser = this.serverVillage && profile && this.serverVillage.user_id !== profile.user_id;
    if (changedUser || !profile) {
      this.serverTopicOutpostLayout = null;
      this.topicOutpostDraft = null;
      this.topicOutpostEditing = false;
      this.selectedTopic = '';
    }
    this.serverEconomy = economy ? this.copyServerEconomy(economy) : null;
    this.serverVillage = profile
      ? { ...profile, topics: Array.isArray(profile.topics) ? profile.topics.map((topic) => ({ ...topic })) : [] }
      : null;
    this.serverOutposts = outposts && Array.isArray(outposts.items)
      ? { items: outposts.items.map((item) => ({ ...item })), wallet: { ...outposts.wallet } }
      : null;
    this.changed();
  }
  /** Keep the last authenticated projection while reporting server-owned economy data unavailable. */
  markServerSnapshotUnavailable() {
    if (!this.serverReadOnly || !this.serverVillage) return;
    this.serverEconomy = null;
    this.serverOutposts = null;
    this.changed();
  }
  /** Validate and copy the backend's authoritative layout without touching Save or the network. */
  applyTopicOutpostLayout(layout: unknown) {
    if (!this.serverReadOnly) return false;
    const expected = this.serverVillage
      ? Object.fromEntries(mapVillageProfile(this.serverVillage).slots
        .filter((slot) => slot.topicId)
        .map((slot) => [CP_VILLAGE_TOPIC_SLOTS.find((entry) => entry.id === slot.slotId)!.slug, slot.topicId!]))
      : undefined;
    if (!isValidTopicOutpostLayout(layout, expected)) return false;
    if (this.topicOutpostEditing && this.serverTopicOutpostLayout?.revision === layout.revision) {
      // Revalidation/refresh at the same revision is not a user edit boundary.
      this.serverTopicOutpostLayout = this.copyTopicOutpostLayout(layout);
      return true;
    }
    this.serverTopicOutpostLayout = this.copyTopicOutpostLayout(layout);
    if (!this.topicOutpostEditing) this.topicOutpostDraft = null;
    this.changed();
    return true;
  }
  beginTopicOutpostEdit(topicKey?: string) {
    const layout = this.topicOutpostLayout;
    if (!this.serverReadOnly || this.battle || !layout) return false;
    if (topicKey && !layout.items.some((item) => item.topic_key === topicKey)) return false;
    this.topicOutpostDraft = layout.items.map((item) => ({ ...item }));
    this.topicOutpostEditing = true;
    if (topicKey) this.selectedTopic = topicKey;
    this.changed();
    return true;
  }
  cancelTopicOutpostEdit() {
    if (!this.topicOutpostEditing) return false;
    this.topicOutpostDraft = null;
    this.topicOutpostEditing = false;
    this.changed();
    return true;
  }
  selectTopicOutpost(topicKey: string | null) {
    if (topicKey !== null && !CP_VILLAGE_TOPIC_SLOTS.some((slot) => slot.slug === topicKey)) return false;
    if (this.selectedTopic === (topicKey ?? '')) return true;
    this.selectedTopic = topicKey ?? '';
    this.changed();
    return true;
  }
  /** Strict snapped move: rejects out-of-bounds and occupied destinations. */
  moveSelectedTopicOutpost(x: number, y: number) {
    const item = this.selectedDraftOutpost();
    if (!item || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    const next = { x: Math.round(x), y: Math.round(y) };
    if (!this.validTopicOutpostPosition(item.topic_key, next.x, next.y)) return false;
    this.previewSelectedTopicOutpost(next.x, next.y);
    return true;
  }
  /** Drag preview intentionally retains invalid candidates so the map can paint them red. */
  previewSelectedTopicOutpost(x: number, y: number) {
    const item = this.selectedDraftOutpost();
    if (!item || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    const nextX = Math.round(x), nextY = Math.round(y);
    if (item.x === nextX && item.y === nextY) return this.validTopicOutpostPosition(item.topic_key, nextX, nextY);
    item.x = nextX;
    item.y = nextY;
    this.changed();
    return this.validTopicOutpostPosition(item.topic_key, nextX, nextY);
  }
  nudgeSelectedTopicOutpost(dx: number, dy: number) {
    const item = this.selectedDraftOutpost();
    return !!item && Number.isSafeInteger(dx) && Number.isSafeInteger(dy) &&
      this.moveSelectedTopicOutpost(item.x + dx, item.y + dy);
  }
  flipSelectedTopicOutpost() {
    const item = this.selectedDraftOutpost();
    if (!item) return false;
    item.facing = item.facing === 'default' ? 'mirrored' : 'default';
    this.changed();
    return true;
  }
  topicOutpostPositionValid(topicKey: string, x: number, y: number) {
    return this.validTopicOutpostPosition(topicKey, x, y);
  }
  private selectedDraftOutpost() {
    if (!this.topicOutpostEditing || !this.selectedTopic || !this.topicOutpostDraft) return undefined;
    return this.topicOutpostDraft.find((item) => item.topic_key === this.selectedTopic);
  }
  private validTopicOutpostPosition(topicKey: string, x: number, y: number) {
    const draft = this.topicOutpostDraft ?? this.topicOutpostLayout?.items;
    if (!draft || !Number.isSafeInteger(x) || !Number.isSafeInteger(y) || x < 8 || y < 8 || x + 3 > 40 || y + 3 > 40) return false;
    return !draft.some((item) => item.topic_key !== topicKey && x < item.x + 3 && x + 3 > item.x && y < item.y + 3 && y + 3 > item.y);
  }
  private canonicalTopicItems(items: readonly TopicOutpostLayoutItem[]) {
    return items.map(({ topic_id, topic_key, x, y, facing }) => ({ topic_id, topic_key, x, y, facing }))
      .sort((a, b) => a.topic_key.localeCompare(b.topic_key));
  }
  private copyTopicOutpostLayout(layout: TopicOutpostLayout): TopicOutpostLayout {
    return {
      revision: layout.revision,
      rules_version: 1,
      rules: { ...layout.rules, allowed_facings: [...layout.rules.allowed_facings] },
      items: layout.items.map((item) => ({ ...item })),
    };
  }
  battle: Battle | null = null;
  replay: ReplayPlayback | null = null;
  /** True while the replay on screen is the opening Goblin raid. */
  goblinRaid = false;
  private recording: ReplayData | null = null;
  private recordingLimitReached = false;
  private recordBattles = true;
  private replayRunner: GameModel | null = null;
  private replayData: ReplayData | null = null;
  private replayStep = 0;
  private replayAction = 0;
  private replayBudget = 0;
  private replaySeekPaused = true;
  private replayKeyframes: {
    time: number;
    step: number;
    action: number;
    battle: Battle;
    nextId: number;
  }[] = [];
  private selection: number | null = null;
  private wallGroup: number[] = [];
  wallMove: WallMove | null = null;
  wallAxis: WallAxis | null = null;
  get selected() {
    return this.selection;
  }
  set selected(value: number | null) {
    this.selection = value;
    this.decorationSelection = null;
    this.wallMove = null;
    this.wallGroup = [];
    this.wallAxis = null;
  }
  placement: BuildingKind | null = null;
  /**
   * A price the village could not pay that the client offers to complete with gems: the
   * resource, the whole price and the action to retry once bought. The HUD asks first.
   */
  shortfall: { resource: GemResource; cost: number; retry: () => unknown } | null = null;
  moving: number | null = null;
  /** The obstacle a Shovel made movable that is being moved, if any. */
  movingObstacle: number | null = null;
  /** The decoration being placed (bought, taken from the stash, or moved), if any. */
  decorationPlacement: DecorationKind | null = null;
  movingDecoration: number | null = null;
  private decorationSelection: number | null = null;
  activeHero = false;
  /** Version 46 battles select which hero the next deployment places. */
  activeHeroKind: HeroKind | null = null;
  activeTroop: TroopKind = 'swordsman';
  /** When set, tapping the battlefield casts this spell instead of deploying. */
  activeSpell: SpellKind | null = null;
  /**
   * Practice Mode's step-by-step guide for the open battle, on a level's first attempt (see
   * docs/PRACTICE-MODE.md). It lives beside the battle, not in it: a frozen moment is simply not
   * simulated, so the recording holds what was fought.
   */
  practiceGuide: {
    steps: readonly PracticeStep[];
    index: number;
    /** Units of the step's kind deployed during the step. */
    placed: number;
    /** Battle seconds spent in the step. */
    elapsed: number;
    /**
     * Where the step's unit goes: the client's spot, or the deployable tile nearest it (some
     * spots lie past this game's 48-tile board or inside its red boundary).
     */
    spot?: { x: number; y: number };
  } | null = null;
  editing = false;
  private undoStack: Layout['slots'][] = [];
  private redoStack: Layout['slots'][] = [];
  /** True once the current drag has recorded its single undo entry. */
  private dragOpen = false;
  private draggedBuilding: number | null = null;
  onChange = (_passive = false) => {};
  onEffect = (_fx: FX) => {};
  onToast = (_message: string) => {};
  revision = 0;
  clock = Date.now();
  constructor(saved?: Save, now = Date.now(), options: { serverReadOnly?: boolean } = {}) {
    this.serverReadOnly = options.serverReadOnly ?? false;
    this.state = saved ?? initialSave();
    if (!this.serverReadOnly) {
      expandArmyRoster(this.state);
      this.migrateLegacyEquipment();
      // Saves from before victories were counted apart from attempts: every village holding a
      // star was won at least once, the closest lower bound the save can support.
      this.state.stats.wins ??= [
        ...this.state.stars,
        ...(this.state.nativeCampaign?.stars ?? []),
      ].filter((stars) => stars > 0).length;
    }
    this.state.dark ??= 0;
    if (this.serverReadOnly) this.clock = now;
    else this.tick(now);
  }
  /** Apply a server-owned economy snapshot without retaining a mutable caller reference. */
  setServerEconomy(snapshot: ServerEconomySnapshot) {
    this.serverEconomy = this.copyServerEconomy(snapshot);
    this.changed();
  }
  private copyServerEconomy(snapshot: ServerEconomySnapshot): ServerEconomySnapshot {
    if (
      !snapshot ||
      !Number.isFinite(snapshot.gold) ||
      snapshot.gold < 0 ||
      !Number.isFinite(snapshot.elixir) ||
      snapshot.elixir < 0 ||
      !Number.isFinite(snapshot.gems) ||
      snapshot.gems < 0 ||
      !Number.isSafeInteger(snapshot.builderCapacity) ||
      snapshot.builderCapacity < 0 ||
      typeof snapshot.username !== 'string'
    )
      throw new TypeError('Invalid server economy snapshot');
    return {
      gold: snapshot.gold,
      elixir: snapshot.elixir,
      gems: snapshot.gems,
      builderCapacity: snapshot.builderCapacity,
      username: snapshot.username,
    };
  }
  /** The operating system asks for reduced motion. Set by the page; never saved. */
  systemReducedMotion = false;
  /**
   * Reduced motion as every presentation layer applies it: the player's own switch, or the
   * system preference unless the player has explicitly asked for full motion.
   */
  get reducedMotion() {
    const s = this.state.settings;
    return s.reducedMotion || (this.systemReducedMotion && !s.fullMotion);
  }
  /** The Vibration switch; on is stored as absent. */
  toggleHaptics() {
    const s = this.state.settings;
    if (s.haptics === false) delete s.haptics;
    else s.haptics = false;
    this.changed();
  }
  /** The Battery saver switch; off is stored as absent. */
  toggleBatterySaver() {
    const s = this.state.settings;
    if (s.batterySaver) delete s.batterySaver;
    else s.batterySaver = true;
    this.changed();
  }
  /** The Reduced motion switch: flips the effective value, overriding the system if needed. */
  toggleReducedMotion() {
    const s = this.state.settings;
    if (this.reducedMotion) {
      s.reducedMotion = false;
      if (this.systemReducedMotion) s.fullMotion = true;
    } else {
      s.reducedMotion = true;
      delete s.fullMotion;
    }
    this.changed();
  }
  changed(passive = false) {
    this.revision++;
    if (!passive) this.structuralRevision++;
    this.onChange(passive);
  }
  /**
   * Counts non-passive changes only. Collector ticks bump `revision` every second, which used
   * to drive a full save (stringify plus two storage writes) every five seconds at home; a save
   * made for passive drift buys nothing, since production is recomputed from `lastTick` on load.
   */
  structuralRevision = 0;
  notify(message: string) {
    this.onToast(message);
  }
  /**
   * Refuses a price the village lacks. While the price fits the storages the client offers the
   * missing amount for gems, then retries; otherwise (and for gem prices) it only says so.
   */
  private lacking(resource: string, cost: number, message: string, retry: () => unknown) {
    if (!this.battle && isGemResource(resource) && cost <= this.resourceCap(resource)) {
      this.shortfall = { resource, cost, retry };
      this.changed();
    } else this.notify(message);
  }
  /** The open offer, priced now: what is still missing and the gems it costs. */
  get shortfallOffer() {
    const s = this.shortfall;
    if (!s) return null;
    const missing = Math.max(0, s.cost - this.state[s.resource]);
    return { resource: s.resource, cost: s.cost, missing, gems: resourceGems(s.resource, missing) };
  }
  /** Buys the missing amount with gems and retries what was refused. */
  buyShortfall() {
    if (this.serverReadOnly) return false;
    const offer = this.shortfallOffer,
      retry = this.shortfall?.retry;
    this.shortfall = null;
    if (!offer || !retry || this.battle) return false;
    if (this.state.gems < offer.gems) {
      this.notify(`${GEM_TEXTS.notEnoughGems}.`);
      this.changed();
      return false;
    }
    this.state.gems -= offer.gems;
    this.state[offer.resource] += offer.missing;
    retry();
    this.changed();
    return true;
  }
  /** A Treasure pack priced now: what it adds, its gems and why it cannot be bought, if so. */
  resourcePack(resource: GemResource, share: TreasurePack['share']) {
    const capacity = this.resourceCap(resource),
      amount = packAmount(share, this.state[resource], capacity),
      gems = resourceGems(resource, amount);
    const issue = this.battle
      ? 'Return home to buy resources.'
      : !amount
        ? GEM_TEXTS.packLocked
        : this.state.gems < gems
          ? GEM_TEXTS.notEnoughGems
          : null;
    return { amount, gems, issue };
  }
  /** Buys a Treasure pack with gems. */
  buyResourcePack(resource: GemResource, share: TreasurePack['share']) {
    if (this.serverReadOnly) return false;
    const pack = this.resourcePack(resource, share);
    if (pack.issue) {
      this.notify(pack.issue);
      return false;
    }
    this.state.gems -= pack.gems;
    this.state[resource] += pack.amount;
    this.notify(`+${pack.amount.toLocaleString()} ${GEM_TEXTS[resource]}`);
    this.changed();
    return true;
  }
  dismissShortfall() {
    if (!this.shortfall) return;
    this.shortfall = null;
    this.changed();
  }
  get obstacles() {
    return this.state.obstacles ?? [];
  }
  get selectedObstacle() {
    return !this.battle && this.selected !== null && this.selected < 0
      ? this.obstacles.find((o) => o.id === -this.selected!)
      : undefined;
  }
  removeObstacle(id: number) {
    if (this.serverReadOnly) return false;
    if (this.battle) return false;
    const o = this.obstacles.find((o) => o.id === id);
    if (!o || o.removeEnd) return false;
    const d = OBSTACLES[o.kind];
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    if (this.state[d.resource] < d.cost) {
      this.lacking(d.resource, d.cost, `Not enough ${d.resource}.`, () => {
        this.removeObstacle(id);
      });
      return false;
    }
    this.state[d.resource] -= d.cost;
    o.removeStart = this.clock;
    o.removeEnd = this.clock + d.seconds * 1000;
    this.notify(`Clearing ${d.name.toLowerCase()} — ${formatTime(d.seconds)}.`);
    this.changed();
    return true;
  }
  cancelObstacleRemoval(id: number) {
    if (this.serverReadOnly) return false;
    if (this.battle) return false;
    const o = this.obstacles.find((o) => o.id === id);
    if (!o?.removeEnd) return false;
    const d = OBSTACLES[o.kind];
    this.state[d.resource] += d.cost;
    delete o.removeEnd;
    delete o.removeStart;
    this.notify(`Removal canceled. ${d.cost.toLocaleString()} ${d.resource} refunded.`);
    this.changed();
    return true;
  }
  finishObstacleRemoval(id: number) {
    if (this.serverReadOnly) return false;
    if (this.battle) return false;
    const o = this.obstacles.find((o) => o.id === id);
    if (!o?.removeEnd) return false;
    const cost = gemCost((o.removeEnd - this.clock) / 1000);
    if (this.state.gems < cost) {
      this.notify('Not enough gems.');
      return false;
    }
    this.state.gems -= cost;
    o.removeEnd = this.clock;
    this.tick(this.clock);
    return true;
  }
  // ------------------------------------------------------------------ decorations
  get decorations() {
    return this.state.decorations ?? [];
  }
  get stashedDecorations(): StashedDecorations {
    return this.state.stashedDecorations ?? {};
  }
  get selectedDecoration() {
    return this.battle || this.decorationSelection === null
      ? undefined
      : this.decorations.find((d) => d.id === this.decorationSelection);
  }
  selectDecoration(id: number | null) {
    this.selected = null;
    this.decorationSelection = id;
    this.changed();
  }
  /** Placed and stashed together, as the Shop counts them. */
  decorationCount(kind: DecorationKind) {
    return ownedDecorations(this.decorations, this.stashedDecorations, kind);
  }
  /** Whether a square of tiles reaches under the Trader's camp or the Super Troop building. */
  overlapsVillageObject(x: number, y: number, size: number) {
    return villageObjectFootprints(this.townhallLevel).some(
      (o) => x < o.x + o.size && x + size > o.x && y < o.y + o.size && y + size > o.y,
    );
  }
  canPlaceDecoration(kind: DecorationKind, x: number, y: number, ignore?: number) {
    const size = DECORATIONS[kind].size;
    return (
      insideMap(kind, x, y) &&
      !overlapsObstacle(this.obstacles, x, y, size) &&
      !overlapsDecoration(this.decorations, x, y, size, ignore) &&
      !this.overlapsVillageObject(x, y, size) &&
      !this.state.buildings.some(
        (b) =>
          x < b.x + BUILDINGS[b.kind].size &&
          x + size > b.x &&
          y < b.y + BUILDINGS[b.kind].size &&
          y + size > b.y,
      )
    );
  }
  /** Picks a decoration up from the Shop: a stashed one for free, else a new one to buy. */
  beginDecoration(kind: DecorationKind) {
    if (this.serverReadOnly) return;
    if (this.battle || !Object.hasOwn(DECORATIONS, kind)) return;
    const d = DECORATIONS[kind];
    if (!this.stashedDecorations[kind]) {
      if (this.chiefLevel < d.chiefLevel)
        return this.notify(`Reach experience level ${d.chiefLevel} to buy the ${d.name}.`);
      if (this.decorationCount(kind) >= d.max)
        return this.notify(`Your village already has its maximum number of ${d.name}.`);
      if (this.state[d.resource] < d.cost)
        return this.lacking(d.resource, d.cost, `Not enough ${d.resource}.`, () => {
          this.beginDecoration(kind);
        });
    }
    this.cancelNativeHandling();
    this.selected = null;
    this.placement = null;
    this.moving = null;
    this.movingDecoration = null;
    this.movingObstacle = null;
    this.decorationPlacement = kind;
    this.changed();
  }
  moveDecoration(id: number) {
    if (this.serverReadOnly) return;
    const d = this.decorations.find((v) => v.id === id);
    if (this.battle || !d) return;
    this.cancelNativeHandling();
    this.selected = null;
    this.placement = null;
    this.moving = null;
    this.decorationPlacement = d.kind;
    this.movingDecoration = id;
    this.movingObstacle = null;
    this.changed();
  }
  placeDecoration(x: number, y: number) {
    if (this.serverReadOnly) return false;
    const kind = this.decorationPlacement;
    if (this.battle || !kind) return false;
    const d = DECORATIONS[kind];
    if (!this.canPlaceDecoration(kind, x, y, this.movingDecoration ?? undefined)) {
      this.notify('Choose a clear space on the map.');
      return false;
    }
    let placed = this.decorations.find((v) => v.id === this.movingDecoration);
    if (placed) {
      placed.x = x;
      placed.y = y;
      this.notify('');
    } else {
      const stashed = this.stashedDecorations[kind] ?? 0;
      if (stashed) {
        if (stashed > 1) this.state.stashedDecorations![kind] = stashed - 1;
        else delete this.state.stashedDecorations![kind];
      } else {
        if (
          this.chiefLevel < d.chiefLevel ||
          this.decorationCount(kind) >= d.max ||
          this.state[d.resource] < d.cost
        ) {
          this.notify('Unable to buy. Check your resources and the Shop limit.');
          return false;
        }
        this.state[d.resource] -= d.cost;
      }
      placed = { id: this.state.nextId++, kind, x, y };
      (this.state.decorations ??= []).push(placed);
      this.notify(`${d.name} placed.`);
    }
    this.decorationPlacement = null;
    this.movingDecoration = null;
    this.selectDecoration(placed.id);
    return true;
  }
  /** The client's Stash: back into the Shop, to be placed again at no cost. */
  stashDecoration(id: number) {
    if (this.serverReadOnly) return false;
    const i = this.decorations.findIndex((v) => v.id === id);
    if (this.battle || i < 0) return false;
    const [d] = this.state.decorations!.splice(i, 1);
    const stash = (this.state.stashedDecorations ??= {});
    stash[d.kind] = (stash[d.kind] ?? 0) + 1;
    if (this.decorationSelection === id) this.decorationSelection = null;
    if (this.movingDecoration === id) {
      this.movingDecoration = null;
      this.decorationPlacement = null;
    }
    this.notify(
      DECORATION_TEXTS.stashText
        .replace('<item>', DECORATIONS[d.kind].name)
        .replace('will be', 'was'),
    );
    this.changed();
    return true;
  }
  /** Buildings a layout, undo or redo moved onto decorations send those to the Shop. */
  private stashCoveredDecorations() {
    const covered = this.decorations.filter((d) =>
      this.state.buildings.some(
        (b) =>
          d.x < b.x + BUILDINGS[b.kind].size &&
          d.x + DECORATIONS[d.kind].size > b.x &&
          d.y < b.y + BUILDINGS[b.kind].size &&
          d.y + DECORATIONS[d.kind].size > b.y,
      ),
    );
    for (const d of covered) this.stashDecoration(d.id);
    if (covered.length)
      this.notify(
        `${covered.length === 1 ? DECORATIONS[covered[0].kind].name : `${covered.length} decorations`} moved to the Shop to make room.`,
      );
    return covered.length;
  }
  /** Shovel of Obstacles: this obstacle becomes movable, like a decoration, for good. */
  shovelObstacle(id: number) {
    if (this.serverReadOnly) return false;
    const o = this.obstacles.find((v) => v.id === id);
    if (
      this.battle ||
      !o ||
      o.movable ||
      o.removeEnd ||
      !this.magicItemCount('shovel-of-obstacles')
    )
      return false;
    o.movable = true;
    this.spendItem('shovel-of-obstacles');
    this.notify(`${OBSTACLES[o.kind].name} can now be moved.`);
    this.changed();
    return true;
  }
  /** Picks up a movable obstacle to place it elsewhere. */
  moveObstacle(id: number) {
    if (this.serverReadOnly) return false;
    const o = this.obstacles.find((v) => v.id === id);
    if (this.battle || !o?.movable || o.removeEnd) return false;
    this.cancelNativeHandling();
    this.selected = null;
    this.placement = null;
    this.moving = null;
    this.decorationPlacement = null;
    this.movingDecoration = null;
    this.movingObstacle = id;
    this.changed();
    return true;
  }
  /** Anywhere on the map clear of buildings, decorations and other obstacles. */
  canPlaceObstacle(id: number, x: number, y: number) {
    const o = this.obstacles.find((v) => v.id === id);
    if (!o || !Number.isInteger(x) || !Number.isInteger(y)) return false;
    const size = OBSTACLES[o.kind].size;
    return (
      x >= 0 &&
      y >= 0 &&
      x + size <= MAP_SIZE &&
      y + size <= MAP_SIZE &&
      !overlapsObstacle(
        this.obstacles.filter((v) => v.id !== id),
        x,
        y,
        size,
      ) &&
      !overlapsDecoration(this.decorations, x, y, size) &&
      !this.overlapsVillageObject(x, y, size) &&
      !this.state.buildings.some(
        (b) =>
          x < b.x + BUILDINGS[b.kind].size &&
          x + size > b.x &&
          y < b.y + BUILDINGS[b.kind].size &&
          y + size > b.y,
      )
    );
  }
  placeObstacle(x: number, y: number) {
    if (this.serverReadOnly) return false;
    const o = this.obstacles.find((v) => v.id === this.movingObstacle);
    if (this.battle || !o) return false;
    if (!this.canPlaceObstacle(o.id, x, y)) {
      this.notify('Choose a clear space on the map.');
      return false;
    }
    o.x = x;
    o.y = y;
    this.movingObstacle = null;
    this.selected = -o.id;
    this.notify('');
    this.changed();
    return true;
  }
  get buildings() {
    return this.battle ? this.battle.buildings : this.state.buildings;
  }
  get townhall() {
    return this.state.buildings.find((b) => b.kind === 'townhall');
  }
  get townhallLevel() {
    return this.townhall?.level ?? 1;
  }
  maxLevel(kind: BuildingKind) {
    return maxLevelFor(kind, this.townhallLevel);
  }
  /** Client counts minus the inputs merged defenses and the Town Hall 17 merge consumed. */
  maxCount(kind: BuildingKind) {
    return Math.max(
      0,
      maxCountFor(kind, this.townhallLevel) -
        consumedByMerges(
          kind,
          this.state.buildings,
          // A running Town Hall upgrade has already merged its inputs.
          this.townhallLevel + (this.townhall?.upgradeEnd && !this.townhall.improving ? 1 : 0),
        ),
    );
  }
  /** Merge inputs available now for a merged defense, or the reason it cannot start. */
  mergeCandidates(result: MergedKind, anchor?: number) {
    const quote = mergeQuote(result);
    const inputs = mergeInputs(result);
    if (this.townhallLevel < quote.townhall)
      return { issue: `Requires Town Hall ${quote.townhall}` };
    if (this.countOf(result) >= this.maxCount(result)) return { issue: 'All merges built' };
    const chosen: Building[] = [];
    const pool = this.state.buildings
      .filter((b) => !b.upgradeEnd && !b.constructing)
      .sort((a, b) => Number(b.id === anchor) - Number(a.id === anchor) || a.id - b.id);
    for (const input of inputs) {
      const match = pool.find(
        (b) =>
          !chosen.includes(b) &&
          b.kind === input.kind &&
          b.level >= input.level &&
          !!b.geared === input.geared,
      );
      if (!match)
        return {
          issue: `Needs ${input.geared ? 'a geared-up ' : ''}${BUILDINGS[input.kind].name} level ${input.level}`,
        };
      chosen.push(match);
    }
    return { inputs: chosen, quote };
  }
  /** Merge two maxed defenses into one merged defense at the first input's position. */
  merge(result: MergedKind, anchor?: number) {
    if (this.serverReadOnly) return false;
    if (this.battle) return false;
    const candidates = this.mergeCandidates(result, anchor);
    if (!candidates.inputs) {
      this.notify(candidates.issue!);
      return false;
    }
    const { inputs, quote } = candidates;
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    if (this.state[quote.resource] < quote.cost) {
      this.lacking(
        quote.resource,
        quote.cost,
        `You need ${quote.cost.toLocaleString()} ${quote.resource}.`,
        () => {
          this.merge(result, anchor);
        },
      );
      return false;
    }
    const [first] = inputs;
    if (BUILDINGS[first.kind].size !== BUILDINGS[result].size) return false;
    this.cancelNativeHandling();
    this.state[quote.resource] -= quote.cost;
    const removed = new Set(inputs.map((b) => b.id));
    this.state.buildings = this.state.buildings.filter((b) => !removed.has(b.id));
    const merged = makeBuilding(this.state.nextId++, result, first.x, first.y, 1);
    merged.constructing = true;
    merged.upgradeStart = this.clock;
    merged.upgradeEnd = this.clock + quote.seconds * 1000;
    this.state.buildings.push(merged);
    this.state.stats.built = (this.state.stats.built ?? 0) + 1;
    this.selected = merged.id;
    this.notify(`Merging into ${BUILDINGS[result].name} — ${formatTime(quote.seconds)}.`);
    this.changed();
    return true;
  }
  /** Master Builder gear-up. This village has no Builder Base, so its prerequisite is waived. */
  gearUp(id: number) {
    if (this.serverReadOnly) return false;
    if (this.battle) return false;
    const b = this.state.buildings.find((v) => v.id === id);
    if (!b || !isGearable(b.kind) || b.geared || b.upgradeEnd || b.constructing) return false;
    const quote = gearUpQuote(b.kind);
    if (!quote || b.level < quote.level) return false;
    if (
      this.state.buildings.filter(
        (v) => v.kind === b.kind && (v.geared || v.improving === 'gearup'),
      ).length >= quote.limit
    ) {
      this.notify(`Only ${quote.limit} ${BUILDINGS[b.kind].name} can be geared up.`);
      return false;
    }
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    if (this.state[quote.resource] < quote.cost) {
      this.lacking(
        quote.resource,
        quote.cost,
        `You need ${quote.cost.toLocaleString()} ${quote.resource}.`,
        () => {
          this.gearUp(id);
        },
      );
      return false;
    }
    this.state[quote.resource] -= quote.cost;
    b.improving = 'gearup';
    b.upgradeStart = this.clock;
    b.upgradeEnd = this.clock + quote.seconds * 1000;
    this.notify(`Gearing up ${BUILDINGS[b.kind].name} — ${formatTime(quote.seconds)}.`);
    this.changed();
    return true;
  }
  /** Why the Town Hall cannot move to its next level yet (merges), or null. */
  townHallMergeIssue(level = this.townhallLevel) {
    for (const result of MERGED_KINDS) {
      const available = maxCountFor(result, level);
      if (available > 0 && this.countOf(result) < available)
        return `Build all ${available} ${BUILDINGS[result].name} merges first.`;
    }
    for (const input of townHallMergeInputs(level + 1)) {
      const ready = this.state.buildings.some(
        (b) => b.kind === input.kind && b.level >= input.level && !b.upgradeEnd && !b.constructing,
      );
      if (!ready) return `Needs ${BUILDINGS[input.kind].name} level ${input.level} to merge.`;
    }
    return null;
  }
  countOf(kind: BuildingKind) {
    return this.state.buildings.filter((b) => b.kind === kind).length;
  }
  get capacity() {
    return this.state.buildings
      .filter((b) => b.kind === 'camp' && !b.constructing)
      .reduce((n, b) => n + campCapacity(b.level), 0);
  }
  get spellCapacity() {
    return (
      spellFactoryCapacity(facilityLevel(this.state.buildings, 'spellfactory')) +
      (nativeProgression.buildings.darkspellfactory.levels[
        facilityLevel(this.state.buildings, 'darkspellfactory') - 1
      ]?.capacity ?? 0)
    );
  }
  get laboratory() {
    return this.state.buildings
      .filter((b) => b.kind === 'laboratory' && !b.constructing)
      .reduce<Building | undefined>(
        (best, b) => (!best || b.level > best.level ? b : best),
        undefined,
      );
  }
  get armySize() {
    return armySpace(this.state.army);
  }
  get siegeCount() {
    return TROOP_KEYS.filter(isSiege).reduce((n, kind) => n + (this.state.army[kind] ?? 0), 0);
  }
  get armyReady() {
    return this.armySize > 0 || this.siegeCount > 0 || this.heroReady;
  }
  get queuedSize() {
    return this.state.queue.reduce((n, q) => n + TROOPS[q.kind].space, 0);
  }
  get spellCount() {
    return SPELL_KEYS.reduce((n, k) => n + (this.state.spells[k] ?? 0), 0);
  }
  get spellHousing() {
    return spellSpace(this.state.spells);
  }
  get queuedSpellHousing() {
    return this.state.spellQueue.reduce((n, q) => n + SPELLS[q.kind].space, 0);
  }
  get queuedSpellCount() {
    return this.state.spellQueue.length;
  }
  troopLevel(kind: TroopKind): number {
    const original = superOriginal(kind);
    if (original && !this.battle?.troopLevels?.[kind])
      return Math.max(
        1,
        Math.min(
          maxTroopLevel(kind),
          (this.state.troopLevels?.[original] ?? 1) - superLevelOffset(kind),
        ),
      );
    return this.battle?.troopLevels?.[kind] ?? this.state.troopLevels?.[kind] ?? 1;
  }
  troopDisplayLevel(kind: TroopKind) {
    return this.troopLevel(kind) + (superOriginal(kind) ? superLevelOffset(kind) : 0);
  }
  troopStats(kind: TroopKind, level = this.troopLevel(kind)) {
    return troopStatsAt(kind, level);
  }
  /** Battle stats for any unit; spawned units, heroes and pets carry their own level. */
  unitStats(u: Pick<Unit, 'kind' | 'level' | 'id'>) {
    const battle = this.battle;
    if (battle?.nativeHeroes && u.id !== undefined) {
      const hero = heroOf(battle, { id: u.id });
      if (hero) return heroTroopStats(hero, battle.townhall ?? this.townhallLevel);
      const owner = petOwner(battle, { id: u.id });
      if (owner?.pet) return petTroopStats(owner.pet);
    }
    if (isHeroUnitKind(u.kind) || isPetUnitKind(u.kind) || isSpawnKind(u.kind))
      return spawnStatsAt(u.kind, u.level ?? 1);
    return this.troopStats(u.kind as TroopKind, u.level ?? this.troopLevel(u.kind as TroopKind));
  }
  spellLevel(kind: SpellKind) {
    return this.battle?.spellLevels?.[kind] ?? this.state.spellLevels?.[kind] ?? 1;
  }
  spellStats(kind: SpellKind, level = this.spellLevel(kind)) {
    return spellStatsAt(kind, level);
  }
  researchLevel(kind: ResearchKind) {
    return isSpellKind(kind) ? this.spellLevel(kind) : this.troopLevel(kind);
  }
  researchCost(kind: ResearchKind) {
    return isSpellKind(kind)
      ? (spellProgression(kind, this.spellLevel(kind) + 1)?.cost ?? 0)
      : researchCost(kind, this.troopLevel(kind));
  }
  researchSeconds(kind: ResearchKind) {
    return isSpellKind(kind)
      ? (spellProgression(kind, this.spellLevel(kind) + 1)?.seconds ?? 0)
      : researchSeconds(kind, this.troopLevel(kind));
  }
  researchLaboratory(kind: ResearchKind) {
    return isSpellKind(kind)
      ? (spellProgression(kind, this.spellLevel(kind) + 1)?.laboratory ?? Infinity)
      : researchLaboratory(kind, this.troopLevel(kind));
  }
  researchTroop(kind: TroopKind) {
    this.research(kind);
  }
  /** Why `kind` cannot be researched one level further, apart from the lab being busy. */
  private researchIssue(kind: ResearchKind): string | null {
    const lab = this.laboratory;
    if (!lab) return 'Complete a laboratory before starting research.';
    const spell = isSpellKind(kind);
    if (!spell && superOriginal(kind))
      return 'Research the original troop to upgrade its super variant.';
    const name = spell ? SPELLS[kind].name : TROOPS[kind].name;
    if (spell ? !this.spellUnlocked(kind) : !this.troopUnlocked(kind))
      return `Unlock ${name} at ${spell ? `Spell Factory level ${SPELL_UNLOCK[kind]}` : `Barracks level ${TROOP_UNLOCK[kind]}`} first.`;
    if (this.researchLevel(kind) >= (spell ? maxSpellLevelFor(kind) : maxTroopLevel(kind)))
      return `This ${spell ? 'spell' : 'troop'} is at its maximum level.`;
    const requiredLab = this.researchLaboratory(kind);
    if (lab.level < requiredLab) return `Upgrade your laboratory to level ${requiredLab}.`;
    return null;
  }
  /** One research level gained, by the lab or a Hammer. */
  private raiseResearch(kind: ResearchKind) {
    if (isSpellKind(kind)) {
      this.state.spellLevels ??= defaultSpellLevels();
      const level = (this.state.spellLevels[kind] = Math.min(
        maxSpellLevelFor(kind),
        this.state.spellLevels[kind] + 1,
      ));
      return { name: SPELLS[kind].name, level };
    }
    this.state.troopLevels ??= Object.fromEntries(TROOP_KEYS.map((k) => [k, 1])) as Record<
      TroopKind,
      number
    >;
    const level = (this.state.troopLevels[kind] = Math.min(
      maxTroopLevel(kind),
      this.state.troopLevels[kind] + 1,
    ));
    return { name: TROOPS[kind].name, level };
  }
  research(kind: ResearchKind) {
    if (this.serverReadOnly) return false;
    if (this.battle) return;
    const issue = this.researchIssue(kind);
    if (issue) return this.notify(issue);
    if (this.state.research) return this.notify('Research is already in progress.');
    const spell = isSpellKind(kind);
    const name = spell ? SPELLS[kind].name : TROOPS[kind].name;
    const cost = this.researchCost(kind);
    const researchResource = (
      spell ? spellFactory(kind) === 'darkspellfactory' : troopFacility(kind) === 'darkbarracks'
    )
      ? 'dark'
      : 'elixir';
    if (this.state[researchResource] < cost)
      return this.lacking(
        researchResource,
        cost,
        `Not enough ${researchResource === 'dark' ? 'dark elixir' : 'elixir'}.`,
        () => {
          this.research(kind);
        },
      );
    this.state[researchResource] -= cost;
    this.state.research = {
      kind,
      end: this.clock + this.researchSeconds(kind) * 1000,
    };
    this.starterEvent({ type: 'StartLabUpgradeHome', amount: 1 });
    this.notify(`Researching level ${this.researchLevel(kind) + 1} ${name}.`);
    this.changed();
  }
  finishResearch() {
    if (this.serverReadOnly) return false;
    if (this.battle) return;
    const r = this.state.research;
    if (!r) return;
    const cost = gemCost((r.end - this.clock) / 1000);
    if (this.state.gems < cost) return this.notify('Not enough gems.');
    this.state.gems -= cost;
    r.end = this.clock;
    this.tick(this.clock);
  }
  /** The client's Home Village achievements this village can count, with their progress. */
  get achievements() {
    const state = this.state.achievements ?? emptyAchievements();
    const village = {
      counts: state.counts,
      buildingLevel: (kind: BuildingKind) =>
        this.state.buildings
          .filter((b) => b.kind === kind && !b.constructing)
          .reduce((top, b) => Math.max(top, b.level), 0),
      troopUnlocked: (kind: TroopKind) => this.troopUnlocked(kind),
      goblinStars: this.goblinStars,
      trophies: this.state.trophies,
    };
    return ACHIEVEMENTS.map((def) => {
      const claimed = Math.min(state.claimed[def.id] ?? 0, def.tiers.length);
      const next = def.tiers[claimed];
      const value = achievementValue(def, claimed, village);
      return { def, claimed, next, value, ready: !!next && value >= next.count };
    });
  }
  /** Finished tiers waiting to be claimed. */
  get achievementsReady() {
    return this.achievements.filter((a) => a.ready).length;
  }
  /** The Starter Challenges run until the Town Hall reaches 7, when every tier is granted. */
  get starterActive() {
    return (this.townhall?.level ?? 1) < STARTER_END_TOWN_HALL && !this.state.starter?.ended;
  }
  /** A challenge's progress toward its quantity. */
  starterProgress(c: StarterChallenge) {
    if (challengeUnavailable(c)) return 0;
    switch (c.type) {
      case 'UpgradeBuilding': {
        const kind = challengeBuilding(c);
        return this.state.buildings.filter(
          (b) => b.kind === kind && !b.constructing && b.level >= (c.quantity2 ?? 1),
        ).length;
      }
      case 'RepairBuilding':
        return this.clanCastle ? 1 : 0;
      case 'ClaimTotalAchievements':
        return Object.values(this.state.achievements?.claimed ?? {}).reduce((n, v) => n + v, 0);
      case 'GetTotalSinglePlayerStars':
        return this.goblinStars;
      case 'GetTotalPracticeStars':
        return this.practiceStars;
      default:
        return this.state.starter?.counts[c.id] ?? 0;
    }
  }
  /** The challenges the Town Hall has revealed, with their progress. */
  get starterChallenges() {
    const th = this.townhall?.level ?? 1;
    return STARTER_CHALLENGES.filter((c) => c.townhall <= th).map((c) => {
      const progress = Math.min(c.quantity, this.starterProgress(c));
      return {
        def: c,
        progress,
        done: progress >= c.quantity,
        unavailable: challengeUnavailable(c),
      };
    });
  }
  get starterPoints() {
    return this.starterChallenges.reduce((n, c) => n + (c.done ? c.def.score : 0), 0);
  }
  /** Why a tier cannot be claimed now, or null. */
  starterTierIssue(index: number) {
    const tier = STARTER_TIERS[index];
    if (!tier || !this.starterActive) return 'Unavailable';
    if (this.state.starter?.claimed.includes(index)) return 'Claimed';
    if (this.starterPoints < tier.score) return `${tier.score.toLocaleString()} points`;
    const { kind, amount } = tier.reward;
    if (
      (kind === 'gold' || kind === 'elixir') &&
      this.resourceCap(kind) - this.state[kind] < amount
    )
      return 'Storage Full';
    return null;
  }
  get starterClaimable() {
    return STARTER_TIERS.filter((_, i) => this.starterTierIssue(i) === null).length;
  }
  /** Pays a tier's reward. Resources are clamped to storage and items beyond their limit sold. */
  private payStarterTier(index: number) {
    const { kind, amount, item } = STARTER_TIERS[index].reward;
    // Up to the storages' room; a balance already above it (an import) is never lowered.
    if (kind === 'gold' || kind === 'elixir')
      this.state[kind] = Math.max(
        this.state[kind],
        Math.min(this.resourceCap(kind), this.state[kind] + amount),
      );
    else if (kind === 'gems') this.state.gems += amount;
    else {
      const magic = MAGIC_ITEM_KINDS.find((k) => MAGIC_ITEMS[k].name === item);
      if (magic) this.addMagicItem(magic, amount);
    }
    (this.state.starter ??= emptyStarter()).claimed.push(index);
  }
  claimStarterTier(index: number) {
    if (this.battle || this.starterTierIssue(index) !== null) return false;
    this.payStarterTier(index);
    const { kind, amount, item } = STARTER_TIERS[index].reward;
    this.notify(
      `Starter reward claimed: ${kind === 'item' ? `${amount}× ${item}` : `${amount.toLocaleString()} ${kind}`}.`,
    );
    this.changed();
    return true;
  }
  /** Town Hall 7: the Starter Challenges end, and every unclaimed tier is granted. */
  private endStarter() {
    if (this.state.starter?.ended) return;
    const starter = (this.state.starter ??= emptyStarter());
    for (let i = 0; i < STARTER_TIERS.length; i++)
      if (!starter.claimed.includes(i)) this.payStarterTier(i);
    starter.ended = true;
    this.notify('The Starter Challenges are complete: every reward is yours!');
  }
  /** Advances the revealed counted challenges an event concerns. */
  private starterEvent(event: StarterEvent) {
    if (!this.starterActive || !(event.amount > 0)) return;
    const th = this.townhall?.level ?? 1;
    for (const c of STARTER_CHALLENGES) {
      if (c.townhall > th) continue;
      const add = eventProgress(c, event);
      if (!add) continue;
      const counts = (this.state.starter ??= emptyStarter()).counts;
      const before = counts[c.id] ?? 0;
      // A best challenge keeps its best single result; the others add up.
      counts[c.id] = Math.min(
        c.quantity,
        c.progress === 'best' ? Math.max(before, add) : before + add,
      );
    }
  }
  /**
   * A finished raid's Starter Challenge events. Loot counts from campaign raids, the only ones
   * that carry it; ladder matches stand in for the client's Multiplayer Battles.
   */
  private starterBattle(b: Battle, deployed: Army, spells: SpellBook) {
    for (const [subject, key] of [
      ['Gold', 'gold'],
      ['Elixir', 'elixir'],
    ] as const) {
      const looted = b.lootTaken?.[key] ?? 0;
      this.starterEvent({ type: 'LootResources', amount: looted, subject });
    }
    if (!b.ladder) return;
    const ruins = b.buildings.filter((v) => v.hp <= 0 && v.kind !== 'wall' && !isTrap(v.kind));
    this.starterEvent({ type: 'DestroyHomeBuildings', amount: ruins.length });
    for (const kind of new Set(ruins.map((v) => v.kind)))
      this.starterEvent({
        type: 'DestroyBuilding',
        amount: ruins.filter((v) => v.kind === kind).length,
        subject: SOURCE_NAME[kind],
      });
    this.starterEvent({ type: 'GetHomeBattleStars', amount: b.stars });
    this.starterEvent({ type: 'WinStarsUsingTroop', amount: b.stars, deployed });
    this.starterEvent({
      type: 'DeployTroopHousingSpace',
      amount: TROOP_KEYS.reduce((n, k) => n + deployed[k] * TROOPS[k].space, 0),
    });
    this.starterEvent({
      type: 'DeploySpellHousingSpace',
      amount: SPELL_KEYS.reduce((n, k) => n + spells[k] * SPELLS[k].space, 0),
    });
  }
  /** Stars across Practice Mode's levels, the best of each. */
  get practiceStars() {
    return PRACTICE_LEVELS.reduce(
      (n, level) =>
        n + (level.stage ? (this.state.nativeCampaign?.stars[level.stage - 1] ?? 0) : 0),
      0,
    );
  }
  /** Stars across the Goblin campaign map (the client's Single Player stars). */
  get goblinStars() {
    return NATIVE_CAMPAIGN.reduce(
      (n, stage, i) => n + (goblinMap(stage) ? (this.state.nativeCampaign?.stars[i] ?? 0) : 0),
      0,
    );
  }
  claimAchievement(id: string) {
    const entry = this.achievements.find((a) => a.def.id === id);
    if (!entry?.ready || !entry.next) return false;
    const state = (this.state.achievements ??= emptyAchievements());
    state.claimed[id] = entry.claimed + 1;
    this.state.gems += entry.next.gems;
    this.notify(
      `${entry.def.title} ${'★'.repeat(entry.claimed + 1)} · +${entry.next.gems} gems · +${entry.next.xp} XP`,
    );
    this.gainXp(entry.next.xp);
    this.changed();
    return true;
  }
  /** Add to every counted achievement of an action that `matches`. */
  private countAchievements(action: string, amount: number | ((a: AchievementDef) => number) = 1) {
    for (const def of ACHIEVEMENTS) {
      if (def.action !== action) continue;
      const add = typeof amount === 'number' ? amount : amount(def);
      if (!(add > 0)) continue;
      const counts = (this.state.achievements ??= emptyAchievements()).counts;
      counts[def.id] = Math.min(Number.MAX_SAFE_INTEGER, (counts[def.id] ?? 0) + add);
    }
  }
  get chiefLevel() {
    return chiefProgress(this.state.xp).level;
  }
  /** The chief level and how far its XP bar has filled, on the client's experience curve. */
  get chiefProgress() {
    return chiefProgress(this.state.xp);
  }
  /** Add experience, announcing each chief level it crosses. */
  private gainXp(amount: number) {
    if (!(amount > 0)) return;
    const before = this.chiefLevel;
    this.state.xp += amount;
    const after = this.chiefLevel;
    if (after > before) this.notify(`Chief level ${after}!`);
  }

  get builders() {
    if (this.serverReadOnly) return this.serverEconomy?.builderCapacity ?? 0;
    return this.state.buildings.filter((b) => b.kind === 'builder' && !b.constructing).length;
  }
  /**
   * Timed builder reservations. Walls require a free builder but finish immediately;
   * clearing an obstacle holds a builder until it is gone.
   */
  get busy() {
    if (this.serverReadOnly) return 0;
    return (
      this.state.buildings.filter((b) => b.upgradeEnd && b.kind !== 'wall').length +
      this.obstacles.filter((o) => o.removeEnd !== undefined).length +
      Number(!!this.state.king?.upgradeEnd) +
      Object.values(this.state.heroes ?? {}).filter((hero) => hero?.upgradeEnd).length
    );
  }
  resourceCap(kind: Resource) {
    // The original counts the Town Hall's own store toward every cap, stores on top of it.
    const hall = townHallCapacity(this.townhall?.level ?? 1, kind);
    if (kind === 'dark')
      return (
        hall +
        this.state.buildings
          .filter((b) => b.kind === 'darkstorage' && !b.constructing)
          .reduce((n, b) => n + darkStorageCapacity(b.level), 0)
      );
    return (
      hall +
      this.state.buildings
        .filter(
          (b) => b.kind === (kind === 'gold' ? 'goldstorage' : 'elixirstorage') && !b.constructing,
        )
        .reduce((n, b) => n + storageCapacity(b.level), 0)
    );
  }
  tick(now: number) {
    // A non-finite time would poison the clock and every timer derived from it, turning a
    // caller's missing timestamp into an upgrade that can never complete.
    if (!Number.isFinite(now)) throw new Error(`Invalid clock time: ${now}`);
    this.clock = now;
    if (this.serverReadOnly) {
      this.state.lastTick = now;
      return;
    }
    // Home production accrues during raids but stays silent: the battle HUD
    // shows raid state, and flagging it would resync the whole scene every
    // second mid-raid. Amounts flush on return.
    const inBattle = !!this.battle && !this.battle.finished;
    let changed = false;
    let structural = false;
    if (
      !this.state.obstacles ||
      !this.state.obstacleGrowth ||
      this.state.obstacleGemIndex === undefined
    ) {
      // Never under a decoration: a save holding both must stay valid.
      this.state.obstacles ??= initialObstacles(this.state.buildings).filter(
        (o) => !overlapsDecoration(this.decorations, o.x, o.y, OBSTACLES[o.kind].size),
      );
      this.state.obstacleGemIndex ??= 0;
      this.state.obstacleGrowth ??= initialObstacleGrowth(this.obstacles, now);
      structural = changed = true;
    }
    // Potions run their timers' extra speed before any timer completes this tick.
    for (const kind of ['builders', 'laboratory', 'pets'] as const) {
      const boost = this.state.boosts?.[kind];
      const effect = MAGIC_ITEMS[boostItem(kind)].effect as { multiplier: number };
      if (boost && advanceBoost(boost, effect.multiplier, this.boostTimers(kind), now))
        changed = true;
    }
    // Helpers run their jobs' timers before any timer completes this tick.
    for (const kind of HELPER_KINDS) {
      const h = this.state.helpers?.[kind];
      const result = h && advanceHelper(kind, h, now, (target) => this.helperTimer(target));
      if (result) changed = true;
      if (result === 'state' || result === 'ready') structural = true;
      if (result === 'ready' && !inBattle) this.notify(`${helperName(kind)} is ready to work!`);
    }
    const elapsedHomeSeconds = Math.max(0, now - this.state.lastTick) / 1000;
    const dt = Math.min(elapsedHomeSeconds, 8 * 3600);
    for (const b of this.state.buildings) {
      // Audited building health is derived from its level. Preserve the damage fraction
      // when loading prototype saves; recorded battle snapshots remain untouched.
      if (
        (facilityProgression(b.kind, b.level) ||
          [
            'wall',
            'cannon',
            'archertower',
            'mortar',
            'airdefense',
            'wizardtower',
            'airsweeper',
            'camp',
            'darkstorage',
            'darkdrill',
          ].includes(b.kind)) &&
        b.maxHp !== buildingMaxHp(b)
      ) {
        const hp = buildingMaxHp(b);
        b.hp = b.maxHp > 0 ? Math.min(1, b.hp / b.maxHp) * hp : hp;
        b.maxHp = hp;
        structural = changed = true;
      }
      const productionInterval = b.kind === 'darkdrill' ? elapsedHomeSeconds : dt;
      const productionSeconds = b.upgradeEnd
        ? Math.max(0, Math.min(productionInterval, (now - b.upgradeEnd) / 1000))
        : productionInterval;
      if (b.upgradeEnd && b.upgradeEnd <= now) {
        const xp = completionXp(b.upgradeStart, b.upgradeEnd);
        if (b.improving === 'weapon') b.weaponLevel = (b.weaponLevel ?? 1) + 1;
        else if (b.improving === 'gearup') b.geared = true;
        else if (b.improving === 'supercharge') {
          b.supercharge = (b.supercharge ?? 0) + 1;
          this.countAchievements('supercharge');
        } else if (b.improving === 'guardian') b.guardianLevel = (b.guardianLevel ?? 1) + 1;
        else if (b.improving === 'module' && b.moduleUpgrade) {
          const { kind, module } = b.moduleUpgrade;
          const levels = [...(b.craftedModules?.[kind] ?? [1, 1, 1])] as ModuleLevels;
          levels[module]++;
          b.craftedModules = { ...b.craftedModules, [kind]: levels };
          this.countAchievements('seasonal_defense');
        } else if (b.improving !== 'module' && !b.constructing) {
          b.level++;
          if (b.kind === 'townhall') {
            this.boostStarBonus(b.level, b.upgradeEnd);
            // Only the step from Town Hall 6 ends the Starter Challenges (with every reward).
            if (b.level === STARTER_END_TOWN_HALL) this.endStarter();
          }
        }
        delete b.improving;
        delete b.moduleUpgrade;
        b.constructing = false;
        b.upgradeEnd = undefined;
        b.upgradeStart = undefined;
        b.maxHp = buildingMaxHp(b);
        b.hp = b.maxHp;
        structural = true;
        this.notify(`${BUILDINGS[b.kind].name} is ready!${xp ? ` +${xp} XP` : ''}`);
        this.gainXp(xp);
        this.onEffect({
          type: 'upgrade',
          building: b.kind,
          x: b.x + BUILDINGS[b.kind].size / 2,
          y: b.y + BUILDINGS[b.kind].size / 2,
        });
        changed = true;
      }
      if (isCollector(b.kind) && !b.upgradeEnd) {
        const before = b.stored;
        // A Resource Potion doubles production for the part of this interval it covers.
        const potion = this.state.boosts?.resources;
        const boosted = potion
          ? Math.max(
              0,
              Math.min(now, potion.end) / 1000 -
                Math.max(now / 1000 - productionSeconds, potion.start / 1000),
            ) *
            ((MAGIC_ITEMS[boostItem('resources')].effect as { multiplier: number }).multiplier - 1)
          : 0;
        b.stored = produceCollector(
          b.kind,
          b.level,
          b.stored,
          productionSeconds + boosted,
          b.supercharge,
        );
        if (Math.floor(before) !== Math.floor(b.stored) && !inBattle) changed = true;
      }
    }
    for (const [kind, boost] of Object.entries(this.state.boosts ?? {}))
      if (boost.end <= now) {
        delete this.state.boosts![kind as BoostKind];
        structural = changed = true;
        if (!inBattle)
          this.notify(`Your ${MAGIC_ITEMS[boostItem(kind as BoostKind)].name} has worn off.`);
      }
    const growth = this.state.obstacleGrowth!;
    // Saves from before the Gem Box schedule their first one a period from now.
    if (growth.gemBoxAt === undefined) {
      growth.gemBoxAt = Math.floor(now) + GEM_BOX_PERIOD;
      changed = true;
    }
    const nextGrowth = growth.nextAt;
    const obstacleEvents = advanceObstacles(this.obstacles, this.state.buildings, growth, now, [
      ...decorationFootprints(this.decorations),
      ...villageObjectFootprints(this.townhallLevel),
    ]);
    if (growth.nextAt !== nextGrowth) changed = true;
    if (obstacleEvents.grown.length) structural = changed = true;
    for (const o of obstacleEvents.removed) {
      if (this.selected === -o.id) this.selected = null;
      // Gems from the reward cycle, or the Gem Box's own 25; Sharp Stones pay nothing.
      const d = OBSTACLES[o.kind];
      let gems = 0;
      if (d.loot === 'gems' && d.lootCount !== undefined) gems = d.lootCount;
      else if (d.loot === 'gems') {
        gems = OBSTACLE_GEMS[this.state.obstacleGemIndex ?? 0];
        this.state.obstacleGemIndex =
          ((this.state.obstacleGemIndex ?? 0) + 1) % OBSTACLE_GEMS.length;
      }
      this.state.gems += gems;
      structural = changed = true;
      this.notify(`${OBSTACLES[o.kind].name} cleared! ${gems ? `+${gems} gems · ` : ''}+3 XP`);
      this.gainXp(3);
      this.countAchievements('clear_obstacles');
      this.starterEvent({ type: 'ClearObstacles', amount: 1 });
      if (!this.battle)
        this.onEffect({ type: 'upgrade', x: o.x + d.size / 2, y: o.y + d.size / 2, gems });
    }
    if (this.heroHall && !this.state.king) {
      this.state.king = { level: 1 };
      structural = changed = true;
      this.notify('The Barbarian King has joined your village!');
    }
    if (this.state.king?.upgradeEnd && this.state.king.upgradeEnd <= now) {
      const xp = completionXp(this.state.king.upgradeStart, this.state.king.upgradeEnd);
      this.state.king.level++;
      delete this.state.king.upgradeEnd;
      delete this.state.king.upgradeStart;
      structural = changed = true;
      this.finishedAt(this.heroHall, 'hero');
      this.notify(
        `Barbarian King reached level ${this.state.king.level}!${xp ? ` +${xp} XP` : ''}`,
      );
      this.gainXp(xp);
    }
    if (this.advanceHeroRoster(now)) structural = changed = true;
    const quest = this.state.journey?.quest;
    if (quest && now >= quest.ends) {
      delete this.state.journey!.quest;
      structural = changed = true;
      this.notify('Your Hero Quest ran out of time.');
    }
    // Older saves may still contain paid training queues. Complete those once;
    // new armies are prepared immediately and never create queue entries.
    // Paid queues complete even over cap (tests rely on this); caps apply to new training only.
    while (this.state.queue.length) {
      const q = this.state.queue.shift()!;
      this.state.army[q.kind]++;
      structural = true;
      changed = true;
    }
    while (this.state.spellQueue.length) {
      const q = this.state.spellQueue.shift()!;
      this.state.spells[q.kind]++;
      structural = true;
      changed = true;
    }
    if (this.state.research && this.state.research.end <= now) {
      const { name, level } = this.raiseResearch(this.state.research.kind);
      delete this.state.research;
      this.notify(`${name} upgraded to level ${level}!`);
      this.finishedAt(this.laboratory, 'research');
      structural = true;
      changed = true;
    }
    // A super troop's boost ends on the clock alone: the army cards must lock it again and offer
    // a new boost, so the expiry is a structural change.
    for (const [kind, end] of Object.entries(this.state.superBoosts ?? {}) as [TroopKind, number][])
      if (end <= now) {
        delete this.state.superBoosts![kind];
        structural = changed = true;
        this.notify(`The ${TROOPS[kind].name} boost has ended.`);
      }
    this.state.lastTick = now;
    if (changed) this.changed(!structural);
  }
  /** Collects from one building (`id`), one resource (`only`), or every collector. */
  collect(id?: number, only?: Resource) {
    if (this.serverReadOnly) return;
    let gold = 0,
      elixir = 0,
      dark = 0;
    // Why nothing came out, so a full storage never reads as an idle collector.
    let full: Resource | null = null;
    let unfinished = false;
    for (const b of this.state.buildings) {
      if (id !== undefined && b.id !== id) continue;
      const k = producedResource(b.kind);
      if (!k || b.stored < 1 || (only && k !== only)) continue;
      // A building still being raised or upgraded keeps what it holds.
      if (b.upgradeEnd) {
        unfinished = true;
        continue;
      }
      const amount = Math.min(Math.floor(b.stored), this.resourceCap(k) - this.state[k]);
      if (amount <= 0) {
        full ??= k;
        continue;
      }
      this.state[k] += amount;
      b.stored -= amount;
      if (k === 'gold') gold += amount;
      else if (k === 'elixir') elixir += amount;
      else dark += amount;
      this.onEffect({
        type: 'collect',
        x: b.x + BUILDINGS[b.kind].size / 2,
        y: b.y + BUILDINGS[b.kind].size / 2,
        color: k === 'gold' ? 0xffd34b : k === 'dark' ? 0x514076 : 0xd567ff,
        text: `+${amount.toLocaleString()}`,
      });
    }
    if (gold + elixir + dark) {
      this.state.stats.collected += gold + elixir + dark;
      this.starterEvent({ type: 'CollectResources', amount: gold, subject: 'Gold' });
      this.starterEvent({ type: 'CollectResources', amount: elixir, subject: 'Elixir' });
      this.notify(
        `Collected ${gold.toLocaleString()} gold · ${elixir.toLocaleString()} elixir${dark ? ` · ${dark.toLocaleString()} dark elixir` : ''}`,
      );
      this.changed();
    } else if (full === 'dark' && this.resourceCap('dark') === 0)
      this.notify('Build a Dark Elixir Storage to hold what your drills bring up.');
    else if (full) this.notify(`Your ${full === 'dark' ? 'dark elixir' : full} storages are full.`);
    else if (unfinished) this.notify('That building keeps its resources until it is ready.');
    else this.notify('Your collectors are working. Come back in a moment.');
  }
  canPlace(kind: BuildingKind, x: number, y: number, ignore?: number) {
    const size = BUILDINGS[kind].size;
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < BUILD_MIN ||
      y < BUILD_MIN ||
      x + size > BUILD_MAX ||
      y + size > BUILD_MAX
    )
      return false;
    if (overlapsObstacle(this.obstacles, x, y, size)) return false;
    if (overlapsDecoration(this.decorations, x, y, size)) return false;
    return !this.state.buildings.some(
      (b) =>
        b.id !== ignore &&
        x < b.x + BUILDINGS[b.kind].size &&
        x + size > b.x &&
        y < b.y + BUILDINGS[b.kind].size &&
        y + size > b.y,
    );
  }
  beginBuild(kind: BuildingKind, offer = true) {
    if (this.serverReadOnly) return;
    if (this.battle) return;
    const d = BUILDINGS[kind];
    if (isMergedKind(kind))
      return this.notify(
        `${d.name} is created by merging defenses. Select a maxed input to merge.`,
      );
    const limit = this.maxCount(kind);
    if (limit === 0)
      return this.notify(`Upgrade your Town Hall to unlock the ${d.name.toLowerCase()}.`);
    if (this.countOf(kind) >= limit)
      return this.notify(
        BUILDING_COUNTS[kind].some((count) => count > limit)
          ? `Town Hall ${this.townhallLevel} allows ${limit} ${d.name.toLowerCase()}. Upgrade it for more.`
          : `Your village already has its maximum number of ${d.name.toLowerCase()}.`,
      );
    if (needsBuilder(kind) && this.busy >= this.builders)
      return this.notify('All builders are busy. Finish an upgrade first.');
    const price = buildPrice(kind, this.countOf(kind));
    if (this.state[price.resource] < price.cost) {
      const message = `Not enough ${price.resource}.`;
      // A drag out of the Shop only says so; a tap offers the missing amount.
      if (!offer) return this.notify(message);
      return this.lacking(price.resource, price.cost, message, () => {
        this.beginBuild(kind);
      });
    }
    this.cancelNativeHandling();
    this.selected = null;
    this.moving = null;
    this.decorationPlacement = null;
    this.movingObstacle = null;
    this.movingDecoration = null;
    this.placement = kind;
    this.changed();
  }
  place(x: number, y: number) {
    if (this.serverReadOnly) return false;
    if (this.battle || !this.placement) return false;
    const kind = this.placement,
      d = BUILDINGS[kind];
    if (!this.canPlace(kind, x, y, this.moving ?? undefined)) {
      this.notify('Choose a clear space inside the village.');
      return false;
    }
    if (this.moving !== null) {
      const b = this.state.buildings.find((b) => b.id === this.moving)!;
      if (this.editing) this.recordPositions();
      b.x = x;
      b.y = y;
      this.selected = b.id;
      this.moving = null;
      this.placement = null;
      this.notify('');
      this.nativeBuildingHandling(b, 'place');
      this.changed();
      return true;
    }
    const price = buildPrice(kind, this.countOf(kind));
    if (
      // A merged defense is built by merging its inputs, never bought from the shop.
      isMergedKind(kind) ||
      this.state[price.resource] < price.cost ||
      this.countOf(kind) >= this.maxCount(kind) ||
      (needsBuilder(kind) && this.busy >= this.builders)
    ) {
      this.notify('Unable to build. Check your resources and builders.');
      return false;
    }
    this.state[price.resource] -= price.cost;
    const b = makeBuilding(this.state.nextId++, kind, x, y, 1);
    // A home Spell Tower always carries a weapon; the original picks one on placement too.
    if (kind === 'spelltower') b.spellTowerWeapon = 'rage';
    if (d.build > 0) {
      b.constructing = true;
      b.upgradeStart = this.clock;
      b.upgradeEnd = this.clock + d.build * 1000;
    }
    this.state.buildings.push(b);
    if (kind !== 'wall') this.state.stats.built = (this.state.stats.built ?? 0) + 1;
    this.placement = null;
    this.selected = b.id;
    // Walls are laid in runs, so the tool stays in hand while another is affordable.
    if (
      kind === 'wall' &&
      this.state[d.resource] >= d.cost &&
      this.countOf(kind) < this.maxCount(kind)
    ) {
      this.placement = 'wall';
      this.selected = null;
    }
    this.changed();
    this.notify(
      d.build === 0 ? `${d.name} placed.` : `Construction started — ${formatTime(d.build)}.`,
    );
    this.nativeBuildingHandling(b, 'place');
    return true;
  }
  get selectedWalls(): Building[] {
    if (this.battle || this.placement || this.wallMove) return [];
    const anchor = this.state.buildings.find((b) => b.id === this.selected && b.kind === 'wall');
    if (!anchor) return [];
    const ids = new Set(this.wallGroup.length ? this.wallGroup : [anchor.id]);
    return this.state.buildings.filter((b) => b.kind === 'wall' && ids.has(b.id));
  }
  selectedWallRow(axis: WallAxis) {
    return this.selected === null ? [] : wallRow(this.state.buildings, this.selected, axis);
  }
  selectWallRow() {
    if (!this.selectedWalls.length) return false;
    const x = this.selectedWallRow('x'),
      y = this.selectedWallRow('y');
    const axis =
      this.wallAxis === 'x' ? 'y' : this.wallAxis === 'y' ? 'x' : x.length >= y.length ? 'x' : 'y';
    const row = axis === 'x' ? x : y;
    if (row.length < 2) return false;
    this.wallAxis = axis;
    this.wallGroup = row.map((b) => b.id);
    this.changed();
    return true;
  }
  selectSingleWall() {
    this.selected = this.selected;
    this.changed();
  }
  canAdjustWallSelection(delta: number) {
    if (this.editing || this.wallAxis || ![-10, -1, 1, 10].includes(delta)) return false;
    const walls = this.selectedWalls;
    const anchor = walls.find((b) => b.id === this.selected);
    if (!anchor) return false;
    const count = walls.length + delta;
    if (count < 1) return false;
    if (delta < 0) return true;
    if (anchor.level >= this.maxLevel('wall')) return false;
    const funds = Math.max(this.state.gold, anchor.level >= 4 ? this.state.elixir : 0);
    return (
      count <= matchingWalls(this.state.buildings, anchor.id).length &&
      count * this.upgradeCost(anchor) <= funds
    );
  }
  adjustWallSelection(delta: number) {
    if (!this.canAdjustWallSelection(delta)) return false;
    const count = this.selectedWalls.length + delta;
    this.wallGroup = matchingWalls(this.state.buildings, this.selected!)
      .slice(0, count)
      .map((b) => b.id);
    this.changed();
    return true;
  }
  wallUpgradeQuote(ids: readonly number[], resource: WallResource) {
    const selected = ids.map((id) => this.state.buildings.find((b) => b.id === id));
    const valid =
      ids.length > 0 &&
      new Set(ids).size === ids.length &&
      selected.every((b) => b?.kind === 'wall') &&
      (resource === 'gold' || resource === 'elixir');
    const walls = valid
      ? (selected as Building[]).filter(
          (b) => !b.constructing && !b.upgradeEnd && b.level < this.maxLevel('wall'),
        )
      : [];
    const cost = walls.reduce((total, b) => total + this.upgradeCost(b), 0);
    const issue = this.battle
      ? 'Return home to upgrade walls.'
      : !valid
        ? 'Select walls in your village.'
        : !walls.length
          ? 'These walls are at the maximum for your Town Hall.'
          : resource === 'elixir' && selected.some((b) => b!.level < 4)
            ? 'Elixir upgrades start at wall level 4 → 5. Upgrade lower-level walls with gold first.'
            : this.busy >= this.builders
              ? 'A free builder is needed for instant wall upgrades.'
              : this.state[resource] < cost
                ? `You need ${cost.toLocaleString()} ${resource}.`
                : null;
    // Only resources are missing, which gems can buy while the price fits the storages.
    const short = !!issue && this.state[resource] < cost && issue.startsWith('You need');
    return { walls, cost, skipped: ids.length - walls.length, issue, short };
  }
  upgradeWalls(ids: readonly number[], resource: WallResource) {
    if (this.serverReadOnly) return false;
    const quote = this.wallUpgradeQuote(ids, resource);
    if (quote.short) {
      this.lacking(resource, quote.cost, quote.issue!, () => {
        this.upgradeWalls(ids, resource);
      });
      return false;
    }
    if (quote.issue) {
      this.notify(quote.issue);
      return false;
    }
    // Validate the whole purchase before charging once; no transient timers or builder reservations.
    this.state[resource] -= quote.cost;
    this.starterEvent({ type: 'WallUpgradeHome', amount: quote.walls.length });
    for (const b of quote.walls) {
      b.level++;
      b.maxHp = buildingHp(b.kind, b.level);
      b.hp = b.maxHp;
    }
    const anchor = quote.walls.find((b) => b.id === this.selected) ?? quote.walls[0];
    this.onEffect({ type: 'upgrade', x: anchor.x + 0.5, y: anchor.y + 0.5 });
    this.notify(
      `${quote.walls.length === 1 ? 'Wall' : `${quote.walls.length} walls`} upgraded instantly.`,
    );
    this.changed();
    return true;
  }
  beginWallMove() {
    const walls = this.selectedWalls;
    const anchor = walls.find((b) => b.id === this.selected);
    if (!anchor || !this.wallAxis || walls.length < 2) return false;
    this.wallMove = {
      anchorId: anchor.id,
      axis: this.wallAxis,
      source: walls.map(({ id, x, y }) => ({ id, x, y })),
      x: anchor.x,
      y: anchor.y,
      turns: 0,
    };
    this.changed();
    return true;
  }
  get wallPreview() {
    return this.wallMove && !this.battle ? wallDestinations(this.wallMove) : [];
  }
  get wallPlacementIssue() {
    if (this.battle || !this.wallMove) return 'Select a wall row at home.';
    return wallMoveIssue(this.wallMove, this.state.buildings, this.obstacles, this.decorations);
  }
  previewWallMove(x: number, y: number) {
    if (this.battle || !this.wallMove || !Number.isInteger(x) || !Number.isInteger(y)) return false;
    if (this.wallMove.x === x && this.wallMove.y === y) return true;
    this.wallMove.x = x;
    this.wallMove.y = y;
    this.changed();
    return true;
  }
  rotateWallMove() {
    if (this.battle || !this.wallMove) return false;
    this.wallMove.turns = (this.wallMove.turns + 1) % 4;
    this.changed();
    return true;
  }
  confirmWallMove() {
    const issue = this.wallPlacementIssue;
    if (issue) {
      this.notify(issue);
      return false;
    }
    const move = this.wallMove!,
      target = this.wallPreview;
    const changed = target.some((s, i) => s.x !== move.source[i].x || s.y !== move.source[i].y);
    if (changed && this.editing) this.recordPositions();
    // Every destination was validated against the current village before any coordinate changes.
    for (const slot of target) {
      const b = this.state.buildings.find((b) => b.id === slot.id)!;
      b.x = slot.x;
      b.y = slot.y;
    }
    this.selected = move.anchorId;
    this.wallGroup = target.map((b) => b.id);
    this.wallAxis = move.turns % 2 ? (move.axis === 'x' ? 'y' : 'x') : move.axis;
    this.notify(changed ? `${target.length} walls moved.` : 'Wall row kept in place.');
    this.changed();
    return true;
  }
  upgradeCost(b: Building) {
    return upgradeCost(b.kind, b.level);
  }
  upgradeSeconds(b: Building) {
    return upgradeSeconds(b.kind, b.level);
  }
  /** Gems to skip whatever is left of this building's timer. */
  finishCost(b: Building) {
    return b.upgradeEnd ? gemCost((b.upgradeEnd - this.clock) / 1000) : 0;
  }
  /**
   * Why a building cannot start its next level now, in the order `upgrade` checks, or null when
   * it can. `merge` names the building a Town Hall merge needs, so the card can point at it.
   */
  upgradeIssue(b: Building): { reason: string; merge?: BuildingKind } | null {
    if (b.upgradeEnd) return { reason: 'Already upgrading.' };
    if (b.level >= BUILDINGS[b.kind].maxLevel)
      return { reason: 'This building is at its maximum level.' };
    if (b.level >= this.maxLevel(b.kind))
      return { reason: `Upgrade your Town Hall to raise this past level ${b.level}.` };
    if (b.kind !== 'wall' && this.busy >= this.builders)
      return { reason: `All ${this.builders} builders are busy.` };
    if (b.kind === 'townhall') {
      const issue = this.townHallMergeIssue(b.level);
      if (issue) {
        const merge =
          MERGED_KINDS.find((kind) => issue.includes(BUILDINGS[kind].name)) ??
          townHallMergeInputs(b.level + 1).find((input) =>
            issue.includes(BUILDINGS[input.kind].name),
          )?.kind;
        return { reason: issue, ...(merge ? { merge } : {}) };
      }
    }
    const resource = BUILDINGS[b.kind].resource,
      cost = this.upgradeCost(b);
    if (this.state[resource] < cost)
      return {
        reason: `Need ${(cost - this.state[resource]).toLocaleString()} more ${resource === 'dark' ? 'dark elixir' : resource}.`,
      };
    return null;
  }
  upgrade(id: number) {
    if (this.serverReadOnly) return false;
    if (this.battle) return;
    if (this.state.buildings.find((b) => b.id === id)?.kind === 'wall') {
      this.upgradeWalls([id], 'gold');
      return;
    }
    const b = this.state.buildings.find((b) => b.id === id);
    if (!b || b.upgradeEnd) return;
    if (b.level >= BUILDINGS[b.kind].maxLevel)
      return this.notify('This building is at its maximum level.');
    if (b.level >= this.maxLevel(b.kind))
      return this.notify(`Upgrade your Town Hall to raise this past level ${b.level}.`);
    if (b.kind !== 'wall' && this.busy >= this.builders)
      return this.notify('All builders are busy.');
    const d = BUILDINGS[b.kind],
      cost = this.upgradeCost(b);
    if (b.kind === 'townhall') {
      const issue = this.townHallMergeIssue(b.level);
      if (issue) return this.notify(issue);
    }
    if (this.state[d.resource] < cost)
      return this.lacking(
        d.resource,
        cost,
        `You need ${cost.toLocaleString()} ${d.resource}.`,
        () => {
          this.upgrade(id);
        },
      );
    this.state[d.resource] -= cost;
    if (b.kind === 'townhall') {
      // The Town Hall 17 upgrade merges the level 7 Eagle Artillery into the Inferno Artillery.
      for (const input of townHallMergeInputs(b.level + 1)) {
        const merged = this.state.buildings.find(
          (v) => v.kind === input.kind && v.level >= input.level && !v.upgradeEnd,
        );
        if (merged) this.state.buildings = this.state.buildings.filter((v) => v !== merged);
      }
    }
    b.upgradeStart = this.clock;
    b.upgradeEnd = this.clock + this.upgradeSeconds(b) * 1000;
    this.starterEvent({ type: 'StartUpgradeHome', amount: 1 });
    this.notify(`Upgrading ${d.name} to level ${b.level + 1}.`);
    this.changed();
  }
  /** Town Hall 18: choose the Guardian that defends this village. */
  selectGuardian(kind: GuardianKind) {
    if (this.battle) return false;
    const th = this.townhall;
    if (!th || th.level < 18 || !GUARDIAN_KINDS.includes(kind)) return false;
    if (th.improving === 'guardian') {
      this.notify('Finish the Guardian upgrade before switching Guardians.');
      return false;
    }
    th.guardian = kind;
    this.notify(`${GUARDIAN_NAMES[kind]} now guards your Town Hall.`);
    this.changed();
    return true;
  }
  /**
   * Crafting Station: put a Crafted Defense on the platform. Switching is free and instant, and
   * each defense keeps its own modules, as in the original.
   */
  chooseCrafted(id: number, kind: CraftedKind) {
    const b = this.state.buildings.find((v) => v.id === id);
    if (this.battle || !b || b.kind !== 'craftingstation' || !validCraftedKind(kind)) return false;
    if (b.crafted === kind) return true;
    b.crafted = kind;
    const hp = buildingMaxHp(b);
    b.hp = b.maxHp > 0 ? Math.min(1, b.hp / b.maxHp) * hp : hp;
    b.maxHp = hp;
    this.notify(`${craftedName(kind)} is on the Crafting Station.`);
    this.changed();
    return true;
  }
  /** Crafting Station: raise one module of one Crafted Defense with a builder. */
  upgradeCraftedModule(id: number, kind: CraftedKind, module: number) {
    if (this.serverReadOnly) return false;
    const b = this.state.buildings.find((v) => v.id === id);
    if (this.battle || !b || b.kind !== 'craftingstation' || b.upgradeEnd || b.constructing)
      return false;
    if (!validCraftedKind(kind) || !Number.isInteger(module) || module < 0 || module > 2)
      return false;
    const level = b.craftedModules?.[kind]?.[module] ?? 1;
    const next = moduleUpgrade(kind, module, level);
    if (!next) return false;
    if (next.townHall > this.townhallLevel) {
      this.notify(`Requires Town Hall ${next.townHall}.`);
      return false;
    }
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    if (this.state[next.resource] < next.cost) {
      this.lacking(
        next.resource,
        next.cost,
        `You need ${next.cost.toLocaleString()} ${next.resource}.`,
        () => {
          this.upgradeCraftedModule(id, kind, module);
        },
      );
      return false;
    }
    this.state[next.resource] -= next.cost;
    b.improving = 'module';
    b.moduleUpgrade = { kind, module };
    b.upgradeStart = this.clock;
    b.upgradeEnd = this.clock + next.seconds * 1000;
    this.notify(
      `Upgrading ${craftedName(kind)} ${craftedModules(kind)[module].name} to level ${next.level}.`,
    );
    this.changed();
    return true;
  }
  /** Town Hall 18: upgrade the selected Guardian with a builder (upgrade_data GuardianGeneral). */
  upgradeGuardian() {
    if (this.serverReadOnly) return false;
    if (this.battle) return false;
    const th = this.townhall;
    if (!th || th.level < 18 || th.upgradeEnd || th.constructing) return false;
    const next = guardianUpgrade(th.guardian ?? 'longshot', th.guardianLevel ?? 1);
    if (!next) return false;
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    if (this.state[next.resource] < next.cost) {
      this.lacking(
        next.resource,
        next.cost,
        `You need ${next.cost.toLocaleString()} ${next.resource}.`,
        () => {
          this.upgradeGuardian();
        },
      );
      return false;
    }
    this.state[next.resource] -= next.cost;
    th.improving = 'guardian';
    th.upgradeStart = this.clock;
    th.upgradeEnd = this.clock + next.seconds * 1000;
    this.notify(`Upgrading ${GUARDIAN_NAMES[th.guardian ?? 'longshot']} to level ${next.level}.`);
    this.changed();
    return true;
  }
  /** Supercharge a building at its maximum level with a builder (client mini levels). */
  supercharge(id: number) {
    if (this.battle) return false;
    const b = this.state.buildings.find((v) => v.id === id);
    if (!b || b.upgradeEnd || b.constructing || b.level < BUILDINGS[b.kind].maxLevel) return false;
    const quote = superchargeQuote(b.kind, b.supercharge ?? 0);
    if (!quote) return false;
    if (this.townhallLevel < quote.townhall) {
      this.notify(`Supercharges need Town Hall ${quote.townhall}.`);
      return false;
    }
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    if (this.state[quote.resource] < quote.cost) {
      this.lacking(
        quote.resource,
        quote.cost,
        `You need ${quote.cost.toLocaleString()} ${quote.resource}.`,
        () => {
          this.supercharge(id);
        },
      );
      return false;
    }
    this.state[quote.resource] -= quote.cost;
    b.improving = 'supercharge';
    b.upgradeStart = this.clock;
    b.upgradeEnd = this.clock + quote.seconds * 1000;
    this.notify(`Supercharging ${BUILDINGS[b.kind].name} — ${formatTime(quote.seconds)}.`);
    this.changed();
    return true;
  }
  /** Town Hall 17: upgrade the Inferno Artillery weapon with a builder. */
  upgradeTownHallWeapon(id: number) {
    if (this.serverReadOnly) return false;
    if (this.battle) return false;
    const b = this.state.buildings.find((v) => v.id === id);
    if (!b || b.kind !== 'townhall' || b.upgradeEnd || b.constructing) return false;
    const next = townHallWeaponUpgrade(b.level, b.weaponLevel ?? 1);
    if (!next) return false;
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    if (this.state[next.resource] < next.cost) {
      this.lacking(
        next.resource,
        next.cost,
        `You need ${next.cost.toLocaleString()} ${next.resource}.`,
        () => {
          this.upgradeTownHallWeapon(id);
        },
      );
      return false;
    }
    this.state[next.resource] -= next.cost;
    b.improving = 'weapon';
    b.upgradeStart = this.clock;
    b.upgradeEnd = this.clock + next.seconds * 1000;
    this.notify(`Upgrading the Inferno Artillery to level ${next.level}.`);
    this.changed();
    return true;
  }
  finish(id: number) {
    if (this.serverReadOnly) return false;
    if (this.battle) return;
    const b = this.state.buildings.find((b) => b.id === id);
    if (!b?.upgradeEnd) return;
    const cost = this.finishCost(b);
    if (this.state.gems < cost) return this.notify('Not enough gems.');
    this.state.gems -= cost;
    finishTimerNow(b, this.clock);
    this.tick(this.clock);
    this.changed();
  }
  move(id: number) {
    if (this.serverReadOnly) return false;
    if (this.battle || this.moving === id) return;
    const b = this.state.buildings.find((b) => b.id === id);
    if (!b) return;
    this.cancelNativeHandling();
    this.moving = id;
    this.placement = b.kind;
    this.decorationPlacement = null;
    this.movingObstacle = null;
    this.movingDecoration = null;
    this.selected = null;
    this.nativeBuildingHandling(b, 'pickup');
    this.changed();
  }
  private nativeBuildingHandling(b: Building, action: 'pickup' | 'place' | 'cancel') {
    if (
      !this.battle &&
      (b.kind === 'archertower' ||
        b.kind === 'darkdrill' ||
        b.kind === 'tesla' ||
        b.kind === 'bombtower' ||
        b.kind === 'seekingairmine' ||
        b.kind === 'airsweeper' ||
        b.kind === 'mortar' ||
        b.kind === 'cannon' ||
        b.kind === 'wizardtower')
    ) {
      const size = BUILDINGS[b.kind].size;
      this.onEffect({
        type: `${b.kind}-${action}`,
        sourceId: b.id,
        x: b.x + size / 2,
        y: b.y + size / 2,
      });
    }
  }
  private cancelNativeHandling() {
    const b = this.state.buildings.find((b) => b.id === this.moving);
    if (b) this.nativeBuildingHandling(b, 'cancel');
    this.endDrag(true);
  }
  cancel() {
    this.cancelNativeHandling();
    if (this.placement || this.decorationPlacement || this.movingObstacle !== null) this.notify('');
    this.selected = null;
    this.placement = null;
    this.moving = null;
    this.decorationPlacement = null;
    this.movingDecoration = null;
    this.movingObstacle = null;
    this.activeSpell = null;
    this.activeHero = false;
    this.activeHeroKind = null;
    this.changed();
  }

  // ---------------------------------------------------------------- edit mode
  private positions(): Layout['slots'] {
    return this.state.buildings.map((b) => ({
      id: b.id,
      x: b.x,
      y: b.y,
      ...(b.kind === 'airsweeper' || b.kind === 'firespitter'
        ? { direction: b.direction ?? 0 }
        : {}),
      ...(b.kind === 'skeletontrap' ? { skeletonMode: b.skeletonMode ?? 'ground' } : {}),
      ...(b.kind === 'inferno' ? { infernoMode: b.infernoMode ?? 'single' } : {}),
      ...(b.kind === 'xbow' ? { xbowMode: b.xbowMode ?? 'ground' } : {}),
      ...(b.kind === 'spelltower'
        ? { spellTowerWeapon: b.spellTowerWeapon ?? 'rage', spellMode: b.spellMode ?? 'rage' }
        : {}),
      ...(b.kind === 'multigeartower' ? { gearMode: b.gearMode ?? 'long' } : {}),
    }));
  }
  toggleSkeletonMode() {
    if (this.battle || this.placement || this.wallMove) return false;
    const b = this.state.buildings.find((v) => v.id === this.selected);
    if (!b || b.kind !== 'skeletontrap' || b.constructing || !validSkeletonMode(b.skeletonMode))
      return false;
    if (this.editing) this.recordPositions();
    b.skeletonMode = b.skeletonMode === 'air' ? 'ground' : 'air';
    this.changed();
    return true;
  }
  toggleInfernoMode() {
    if (this.battle || this.placement || this.wallMove) return false;
    const b = this.state.buildings.find((v) => v.id === this.selected);
    if (!b || b.kind !== 'inferno' || b.constructing || !validInfernoMode(b.infernoMode))
      return false;
    if (this.editing) this.recordPositions();
    b.infernoMode = b.infernoMode === 'multi' ? 'single' : 'multi';
    this.changed();
    return true;
  }
  toggleXbowMode() {
    if (this.battle || this.placement || this.wallMove) return false;
    const b = this.state.buildings.find((v) => v.id === this.selected);
    if (!b || b.kind !== 'xbow' || b.constructing || !validXbowMode(b.xbowMode)) return false;
    if (this.editing) this.recordPositions();
    b.xbowMode = b.xbowMode === 'both' ? 'ground' : 'both';
    this.changed();
    return true;
  }
  /** Spell Tower: cycle through the spells its level has unlocked. */
  cycleSpellTowerMode() {
    if (this.battle || this.placement || this.wallMove) return false;
    const b = this.state.buildings.find((v) => v.id === this.selected);
    if (!b || b.kind !== 'spelltower' || b.constructing) return false;
    const modes = spellTowerModes(b.level);
    if (modes.length < 2) return false;
    if (this.editing) this.recordPositions();
    b.spellMode = modes[(modes.indexOf(b.spellMode ?? 'rage') + 1) % modes.length];
    this.changed();
    return true;
  }
  /** Multi-Gear Tower: Long Range or Fast Attack. */
  toggleGearMode() {
    if (this.battle || this.placement || this.wallMove) return false;
    const b = this.state.buildings.find((v) => v.id === this.selected);
    if (!b || b.kind !== 'multigeartower' || b.constructing) return false;
    if (this.editing) this.recordPositions();
    b.gearMode = b.gearMode === 'fast' ? 'long' : 'fast';
    this.changed();
    return true;
  }
  /** Cycles the three original Spell Tower weapons, like the X-Bow's targeting mode. */
  cycleSpellTowerWeapon() {
    if (this.battle || this.placement || this.wallMove) return false;
    const b = this.state.buildings.find((v) => v.id === this.selected);
    if (!b || b.kind !== 'spelltower' || b.constructing) return false;
    if (this.editing) this.recordPositions();
    b.spellTowerWeapon =
      SPELL_TOWER_CYCLE[
        (SPELL_TOWER_CYCLE.indexOf(b.spellTowerWeapon ?? 'rage') + 1) % SPELL_TOWER_CYCLE.length
      ];
    this.changed();
    return true;
  }
  rotateSweeper() {
    if (this.battle || this.placement || this.wallMove) return false;
    const b = this.state.buildings.find((v) => v.id === this.selected);
    if (
      !b ||
      (b.kind !== 'airsweeper' && b.kind !== 'firespitter') ||
      b.constructing ||
      !validDirection(b.direction)
    )
      return false;
    if (this.editing) this.recordPositions();
    // The Firespitter turns in 90-degree steps along tile edges (client AimRotateStep 90).
    b.direction =
      b.kind === 'firespitter'
        ? (Math.floor((b.direction ?? 0) / 2) * 2 + 2) % 8
        : ((b.direction ?? 0) + 1) % 8;
    this.changed();
    return true;
  }
  private recordPositions() {
    this.undoStack.push(this.positions());
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.redoStack = [];
  }
  /**
   * Move buildings to `slots`, but only as a whole. A stored arrangement says nothing
   * about buildings raised since it was saved, so applying it blindly can stack two
   * structures on the same tiles — a corruption that survives saving and reloading.
   */
  private applyPositions(slots: Layout['slots']) {
    const moved = new Map(slots.map((s) => [s.id, s]));
    const placed = this.state.buildings.map((b) => {
      const slot = moved.get(b.id);
      return { kind: b.kind, x: slot?.x ?? b.x, y: slot?.y ?? b.y };
    });
    for (let i = 0; i < placed.length; i++) {
      const v = placed[i],
        size = BUILDINGS[v.kind].size;
      if (v.x < 0 || v.y < 0 || v.x + size > MAP_SIZE || v.y + size > MAP_SIZE) return false;
      for (let j = i + 1; j < placed.length; j++) {
        const o = placed[j];
        if (
          v.x < o.x + BUILDINGS[o.kind].size &&
          v.x + size > o.x &&
          v.y < o.y + BUILDINGS[o.kind].size &&
          v.y + size > o.y
        )
          return false;
      }
    }
    for (const [i, b] of this.state.buildings.entries()) {
      b.x = placed[i].x;
      b.y = placed[i].y;
      if (b.kind === 'airsweeper' || b.kind === 'firespitter')
        b.direction = moved.get(b.id)?.direction ?? b.direction ?? 0;
      if (b.kind === 'skeletontrap')
        b.skeletonMode = moved.get(b.id)?.skeletonMode ?? b.skeletonMode ?? 'ground';
      if (b.kind === 'inferno')
        b.infernoMode = moved.get(b.id)?.infernoMode ?? b.infernoMode ?? 'single';
      if (b.kind === 'xbow') b.xbowMode = moved.get(b.id)?.xbowMode ?? b.xbowMode ?? 'ground';
      if (b.kind === 'spelltower') {
        b.spellTowerWeapon = moved.get(b.id)?.spellTowerWeapon ?? b.spellTowerWeapon ?? 'rage';
        // Older layouts carry no spell; a spell the tower's level has not opened is ignored.
        const spell = moved.get(b.id)?.spellMode;
        if (spell && spellTowerModes(b.level).includes(spell)) b.spellMode = spell;
      }
      if (b.kind === 'multigeartower') {
        const gear = moved.get(b.id)?.gearMode;
        if (gear) b.gearMode = gear;
      }
    }
    return true;
  }
  get canUndo() {
    return this.undoStack.length > 0;
  }
  /**
   * Opens one history entry for a whole drag. Without it a single drag across ten
   * tiles would take ten presses of undo to reverse.
   */
  beginDrag() {
    this.endDrag(true);
    this.dragOpen = false;
  }
  endDrag(cancelled = false) {
    const b = this.state.buildings.find((b) => b.id === this.draggedBuilding);
    this.draggedBuilding = null;
    this.dragOpen = false;
    if (b) this.nativeBuildingHandling(b, cancelled ? 'cancel' : 'place');
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }
  beginEdit() {
    if (this.battle) return;
    this.cancelNativeHandling();
    this.editing = true;
    this.dragOpen = false;
    this.selected = null;
    this.placement = null;
    this.moving = null;
    this.decorationPlacement = null;
    this.movingDecoration = null;
    this.movingObstacle = null;
    this.undoStack = [];
    this.redoStack = [];
    this.notify('Edit mode — drag any building to rearrange your village.');
    this.changed();
  }
  endEdit() {
    this.endDrag(true);
    this.wallMove = null;
    this.editing = false;
    this.undoStack = [];
    this.redoStack = [];
    this.changed();
  }
  /** Relocates a building during edit mode. Returns false when the ground is taken. */
  dragTo(id: number, x: number, y: number) {
    const b = this.state.buildings.find((v) => v.id === id);
    if (!b || !this.editing || this.battle) return false;
    if (b.x === x && b.y === y) return true;
    if (!this.canPlace(b.kind, x, y, id)) return false;
    if (!this.dragOpen) {
      this.recordPositions();
      this.dragOpen = true;
      this.draggedBuilding = b.id;
      this.nativeBuildingHandling(b, 'pickup');
    }
    b.x = x;
    b.y = y;
    this.changed();
    return true;
  }
  private layoutOverlapsObstacles(slots: Layout['slots']) {
    return slots.some((v) => {
      const b = this.state.buildings.find((b) => b.id === v.id);
      return b && overlapsObstacle(this.obstacles, v.x, v.y, BUILDINGS[b.kind].size);
    });
  }
  undo() {
    if (this.layoutOverlapsObstacles(this.undoStack.at(-1) ?? []))
      return this.notify('Clear the obstacles beneath this layout before undoing.');
    const previous = this.undoStack.pop();
    if (!previous) return this.notify('Nothing left to undo.');
    const current = this.positions();
    if (!this.applyPositions(previous)) {
      this.undoStack.push(previous);
      return this.notify('That step cannot be undone around the buildings you have added.');
    }
    this.redoStack.push(current);
    this.selected = this.selected;
    this.stashCoveredDecorations();
    this.changed();
  }
  redo() {
    if (this.layoutOverlapsObstacles(this.redoStack.at(-1) ?? []))
      return this.notify('Clear the obstacles beneath this layout before redoing.');
    const next = this.redoStack.pop();
    if (!next) return this.notify('Nothing left to redo.');
    const current = this.positions();
    if (!this.applyPositions(next)) {
      this.redoStack.push(next);
      return this.notify('That step cannot be redone around the buildings you have added.');
    }
    this.undoStack.push(current);
    this.selected = this.selected;
    this.stashCoveredDecorations();
    this.changed();
  }
  get layouts() {
    return this.state.layouts ?? [];
  }
  saveLayout(slot: number) {
    if (!Number.isInteger(slot) || slot < 0 || slot > 2) return;
    this.state.layouts ??= [];
    while (this.state.layouts.length < 3)
      this.state.layouts.push({
        name: `Layout ${this.state.layouts.length + 1}`,
        slots: [],
      });
    if (this.state.layouts[slot].slots.length)
      this.overwritten.layouts.set(slot, structuredClone(this.state.layouts[slot]));
    this.state.layouts[slot] = {
      name: this.state.layouts[slot].name,
      slots: this.positions(),
    };
    this.notify(`Saved to ${this.state.layouts[slot].name}.`);
    this.changed();
  }
  /**
   * What a save replaced in each filled layout or Quick army slot this session, so the overwrite
   * can be undone from the same card.
   */
  private overwritten = {
    layouts: new Map<number, Layout>(),
    presets: new Map<number, ArmyPreset>(),
  };
  /** A different village (an import) has its own slots: nothing of this one to undo. */
  clearSlotHistory() {
    this.overwritten.layouts.clear();
    this.overwritten.presets.clear();
  }
  canUndoSlot(kind: 'layout' | 'preset', slot: number) {
    return (kind === 'layout' ? this.overwritten.layouts : this.overwritten.presets).has(slot);
  }
  undoSlot(kind: 'layout' | 'preset', slot: number) {
    if (this.battle) return false;
    if (kind === 'layout') {
      const layout = this.overwritten.layouts.get(slot);
      if (!layout || !this.state.layouts?.[slot]) return false;
      this.state.layouts[slot] = layout;
      this.overwritten.layouts.delete(slot);
      this.notify(`${layout.name} restored.`);
    } else {
      const preset = this.overwritten.presets.get(slot);
      if (!preset || !this.state.armyPresets) return false;
      this.state.armyPresets[slot] = preset;
      this.overwritten.presets.delete(slot);
      this.notify(`${preset.name} restored.`);
    }
    this.changed();
    return true;
  }
  /**
   * A shareable code for a saved layout slot, or for the village as it stands: every building's
   * place by kind (see layout-share.ts).
   */
  layoutShareCode(slot?: number) {
    const saved = slot === undefined ? undefined : this.state.layouts?.[slot];
    if (slot !== undefined && !saved?.slots.length) return null;
    const at = new Map((saved?.slots ?? this.positions()).map((s) => [s.id, s]));
    const placed = this.state.buildings.flatMap((b) => {
      const slotted = at.get(b.id);
      return b.npc || !slotted ? [] : [{ kind: b.kind, x: slotted.x, y: slotted.y }];
    });
    return encodeLayout(this.townhallLevel, placed);
  }
  /**
   * Copies a shared layout into a slot, mapped onto this village's buildings; it is applied with
   * Restore, which can be undone. Returns how many buildings it had no place for, or false.
   */
  importLayout(code: string, slot: number) {
    if (this.battle || !Number.isInteger(slot) || slot < 0 || slot > 2) return false;
    const shared = decodeLayout(code);
    if (!shared) {
      this.notify('This layout link is damaged.');
      return false;
    }
    const fitted = fitLayout(
      shared,
      this.state.buildings.filter((b) => !b.npc),
      (x, y, size) => overlapsObstacle(this.obstacles, x, y, size),
    );
    if (!fitted) {
      this.notify('This layout has no room for every building of your village.');
      return false;
    }
    this.state.layouts ??= [];
    while (this.state.layouts.length < 3)
      this.state.layouts.push({ name: `Layout ${this.state.layouts.length + 1}`, slots: [] });
    if (this.state.layouts[slot].slots.length)
      this.overwritten.layouts.set(slot, structuredClone(this.state.layouts[slot]));
    const kept = new Map(this.positions().map((p) => [p.id, p]));
    this.state.layouts[slot] = {
      name: this.state.layouts[slot].name,
      // Modes (an X-Bow's target, an Inferno's mode) stay as this village has them.
      slots: fitted.slots.map((s) => ({ ...kept.get(s.id)!, x: s.x, y: s.y })),
    };
    this.notify(
      `Shared layout copied to ${this.state.layouts[slot].name}${fitted.setAside ? `; ${fitted.setAside} building${fitted.setAside === 1 ? '' : 's'} it had no place for set aside` : ''}. Restore it to use it.`,
    );
    this.changed();
    return fitted.setAside;
  }
  loadLayout(slot: number) {
    const layout = this.state.layouts?.[slot];
    if (!layout?.slots.length) return this.notify('That layout slot is still empty.');
    if (this.layoutOverlapsObstacles(layout.slots))
      return this.notify('Clear the obstacles beneath this layout before restoring it.');
    const before = this.positions();
    if (!this.applyPositions(layout.slots))
      return this.notify(
        `${layout.name} does not fit your village any more. Save it again to update it.`,
      );
    this.undoStack.push(before);
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.redoStack = [];
    this.selected = this.selected;
    this.notify(`${layout.name} restored.`);
    this.stashCoveredDecorations();
    this.changed();
  }

  // ----------------------------------------------------------------- training
  trainingTime(_kind: TroopKind) {
    return 0;
  }
  boostSuperTroop(kind: TroopKind) {
    if (this.battle) return;
    const row = superLicence(kind);
    if (
      !row ||
      this.townhallLevel < 11 ||
      this.troopLevel(superOriginal(kind)!) < superMinimum(kind)
    )
      return this.notify('Requires Town Hall 11 and the original troop at its required level.');
    const now = this.clock;
    if ((this.state.superBoosts?.[kind] ?? 0) > now) return;
    if (Object.values(this.state.superBoosts ?? {}).filter((end) => end! > now).length >= 2)
      return this.notify('Two super troop boosts are already active.');
    const cost = Number(row.ResourceCost);
    if (this.state.dark < cost)
      return this.lacking('dark', cost, 'Not enough dark elixir.', () => {
        this.boostSuperTroop(kind);
      });
    this.state.dark -= cost;
    (this.state.superBoosts ??= {})[kind] = now + Number(row.DurationH) * 3600000;
    this.countAchievements('activate_super_licence');
    this.changed();
  }
  troopUnlocked(kind: TroopKind) {
    if (
      superOriginal(kind) &&
      (this.townhallLevel < 11 ||
        this.troopLevel(superOriginal(kind)!) < superMinimum(kind) ||
        (this.state.superBoosts?.[kind] ?? 0) <= this.clock)
    )
      return false;
    return facilityLevel(this.state.buildings, troopFacility(kind)) >= TROOP_UNLOCK[kind];
  }
  spellUnlocked(kind: SpellKind) {
    return facilityLevel(this.state.buildings, spellFactory(kind)) >= SPELL_UNLOCK[kind];
  }
  get barracksReady() {
    // Completed production facilities remain usable throughout an upgrade.
    return this.state.buildings.some((b) => b.kind === 'barracks' && !b.constructing);
  }
  get factoryReady() {
    return this.state.buildings.some((b) => b.kind === 'spellfactory' && !b.constructing);
  }
  train(kind: TroopKind, count = 1) {
    if (this.serverReadOnly) return false;
    if (
      this.battle ||
      !TROOP_KEYS.includes(kind) ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 5
    )
      return;
    if (!this.troopUnlocked(kind))
      return this.notify(
        `${TROOPS[kind].name} requires a completed level ${TROOP_UNLOCK[kind]} ${BUILDINGS[troopFacility(kind)].name}.`,
      );
    if (
      isSiege(kind) &&
      TROOP_KEYS.filter(isSiege).reduce((n, k) => n + (this.state.army[k] ?? 0), count) > 3
    )
      return this.notify('The siege reserve holds three machines.');
    if (
      !isSiege(kind) &&
      this.armySize + this.queuedSize + TROOPS[kind].space * count > this.capacity
    )
      return this.notify('Army camps are full. Remove troops or upgrade a camp.');
    this.state.army[kind] = (this.state.army[kind] ?? 0) + count;
    this.state.stats.trained = (this.state.stats.trained ?? 0) + count;
    this.changed();
  }
  brew(kind: SpellKind, count = 1) {
    if (
      this.battle ||
      !SPELL_KEYS.includes(kind) ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 5
    )
      return;
    if (!this.spellUnlocked(kind))
      return this.notify(
        `${SPELLS[kind].name} requires a completed level ${SPELL_UNLOCK[kind]} ${BUILDINGS[spellFactory(kind)].name}.`,
      );
    if (
      this.spellHousing + this.queuedSpellHousing + SPELLS[kind].space * count >
      this.spellCapacity
    )
      return this.notify('Not enough spell housing. Remove a spell or upgrade the factory.');
    this.state.spells[kind] += count;
    this.changed();
  }
  /** How many more of a troop fit: the camps' housing, or the three-machine siege reserve. */
  troopRoom(kind: TroopKind) {
    if (this.battle || !TROOP_KEYS.includes(kind) || !this.troopUnlocked(kind)) return 0;
    if (isSiege(kind)) return Math.max(0, 3 - this.siegeCount);
    return Math.max(
      0,
      Math.floor((this.capacity - this.armySize - this.queuedSize) / TROOPS[kind].space),
    );
  }
  /** How many more of a spell fit in spell housing. */
  spellRoom(kind: SpellKind) {
    if (this.battle || !SPELL_KEYS.includes(kind) || !this.spellUnlocked(kind)) return 0;
    return Math.max(
      0,
      Math.floor(
        (this.spellCapacity - this.spellHousing - this.queuedSpellHousing) / SPELLS[kind].space,
      ),
    );
  }
  /** Adds as many of a troop as the remaining room allows, in one step. */
  fillTroop(kind: TroopKind) {
    if (this.battle || !TROOP_KEYS.includes(kind)) return 0;
    if (!this.troopUnlocked(kind)) {
      this.train(kind);
      return 0;
    }
    const count = this.troopRoom(kind);
    if (!count) {
      this.notify(
        isSiege(kind)
          ? 'The siege reserve holds three machines.'
          : 'Army camps are full. Remove troops or upgrade a camp.',
      );
      return 0;
    }
    this.state.army[kind] = (this.state.army[kind] ?? 0) + count;
    this.state.stats.trained = (this.state.stats.trained ?? 0) + count;
    this.changed();
    return count;
  }
  /** Adds as many of a spell as the remaining spell housing allows. */
  fillSpell(kind: SpellKind) {
    if (this.battle || !SPELL_KEYS.includes(kind)) return 0;
    if (!this.spellUnlocked(kind)) {
      this.brew(kind);
      return 0;
    }
    const count = this.spellRoom(kind);
    if (!count) {
      this.notify('Not enough spell housing. Remove a spell or upgrade the factory.');
      return 0;
    }
    this.state.spells[kind] += count;
    this.changed();
    return count;
  }
  /** Removes `count` of a troop (every one of them when `count` is Infinity). */
  removeTroop(kind: TroopKind, count = 1) {
    if (this.serverReadOnly) return false;
    if (this.battle || !TROOP_KEYS.includes(kind) || this.state.army[kind] <= 0) return;
    if (!(count >= 1)) return;
    this.state.army[kind] -= Math.min(this.state.army[kind], Math.floor(count));
    this.changed();
  }
  removeSpell(kind: SpellKind, count = 1) {
    if (this.serverReadOnly) return false;
    if (this.battle || !SPELL_KEYS.includes(kind) || this.state.spells[kind] <= 0) return;
    if (!(count >= 1)) return;
    this.state.spells[kind] -= Math.min(this.state.spells[kind], Math.floor(count));
    this.changed();
  }
  clearArmy() {
    if (this.serverReadOnly) return false;
    if (this.battle) return;
    this.state.army = emptyArmy();
    this.state.spells = emptySpells();
    this.state.queue = [];
    this.state.spellQueue = [];
    this.changed();
  }
  /** Shared validation for preparation controls and atomic composition changes. */
  armyPreparationIssue(army: Army, spells: SpellBook): string | null {
    if (this.battle) return 'Return home before preparing an army.';
    if (TROOP_KEYS.filter(isSiege).reduce((n, k) => n + (army[k] ?? 0), 0) > 3)
      return 'The siege reserve holds three machines.';
    if (armySpace(army) > this.capacity || spellSpace(spells) > this.spellCapacity)
      return 'This army needs more troop or spell housing.';
    const troop = TROOP_KEYS.find((k) => army[k] > this.state.army[k] && !this.troopUnlocked(k));
    if (troop)
      return `${TROOPS[troop].name} requires a completed level ${TROOP_UNLOCK[troop]} Barracks.`;
    const spell = SPELL_KEYS.find(
      (k) => spells[k] > this.state.spells[k] && !this.spellUnlocked(k),
    );
    if (spell)
      return `${SPELLS[spell].name} requires a completed level ${SPELL_UNLOCK[spell]} ${BUILDINGS[spellFactory(spell)].name}.`;
    return null;
  }
  private prepareArmy(army: Army, spells: SpellBook) {
    const issue = this.armyPreparationIssue(army, spells);
    if (issue) {
      this.notify(issue);
      return false;
    }
    const added = TROOP_KEYS.reduce((n, k) => n + Math.max(0, army[k] - this.state.army[k]), 0);
    this.state.army = { ...army };
    this.state.spells = { ...spells };
    this.state.queue = [];
    this.state.spellQueue = [];
    this.state.stats.trained = (this.state.stats.trained ?? 0) + added;
    this.changed();
    return true;
  }
  /** Whether the current army has anything a Quick army could hold: troops or siege machines. */
  get canSaveArmyPreset() {
    return this.armySize > 0 || this.siegeCount > 0;
  }
  saveArmyPreset(slot: number, name?: string) {
    if (this.battle || !Number.isInteger(slot) || slot < 0 || slot > 2) return;
    if (!this.canSaveArmyPreset) return this.notify('Add troops before saving an army.');
    this.state.armyPresets ??= [null, null, null];
    const previous = this.state.armyPresets[slot];
    if (previous) this.overwritten.presets.set(slot, structuredClone(previous));
    const gear = this.gear,
      pets = this.petProgress;
    const heroes = this.heroLineup.map((kind) => ({
      kind,
      items: (gear.loadouts[kind] ?? []).filter((slug) => gear.levels[slug] !== undefined),
      ...(pets.assigned[kind] ? { pet: pets.assigned[kind] } : {}),
    }));
    this.state.armyPresets[slot] = {
      name: (name?.trim() || this.state.armyPresets[slot]?.name || `Army ${slot + 1}`).slice(0, 32),
      army: { ...this.state.army },
      spells: { ...this.state.spells },
      ...(heroes.length ? { heroes } : {}),
    };
    this.notify('Army saved.');
    this.changed();
  }
  /**
   * What loading a Quick army's heroes would do here: the lineup that fits this Hero Hall, and a
   * note for everything that cannot be restored as saved (a hero, item or pet not available, or
   * no slot for it). Shown before loading and applied by `loadArmyPreset`.
   */
  presetHeroPlan(preset: ArmyPreset) {
    const changes: string[] = [];
    const gear = this.gear,
      pets = this.petProgress;
    const lineup: PresetHero[] = [];
    for (const hero of preset.heroes ?? []) {
      const name = HERO_SOURCE[hero.kind];
      if (!this.heroProgress(hero.kind)) {
        changes.push(`${name} is not in this village`);
        continue;
      }
      if (lineup.length >= this.heroSlotCount) {
        changes.push(`No Hero Hall slot for ${name}`);
        continue;
      }
      const items = hero.items.filter(
        (slug) =>
          validItem(slug) && itemHero(slug) === hero.kind && gear.levels[slug] !== undefined,
      );
      for (const slug of hero.items)
        if (!items.includes(slug))
          changes.push(`${name} keeps the current item for ${itemName(slug)}`);
      if (items.length && !this.blacksmith) changes.push(`${name}'s items need a Blacksmith`);
      const pet = hero.pet && pets.levels[hero.pet] !== undefined ? hero.pet : undefined;
      if (hero.pet && !pet) changes.push(`${PET_DISPLAY[hero.pet]} is not researched yet`);
      else if (pet && !this.petHouse) changes.push(`${PET_DISPLAY[pet]} needs a Pet House`);
      lineup.push({ kind: hero.kind, items, ...(pet ? { pet } : {}) });
    }
    return { lineup, changes };
  }
  loadArmyPreset(slot: number) {
    const preset = this.state.armyPresets?.[slot];
    if (!preset) return this.notify('Save an army in this slot first.');
    if (!this.prepareArmy(preset.army, preset.spells)) return;
    const changes = this.applyPresetHeroes(preset);
    if (changes.length) return this.notify(`Your army is ready · ${changes.join(' · ')}.`);
    this.notify('Your army is ready.');
  }
  /** Puts a preset's heroes, items and pets in place as `presetHeroPlan` allows; its notes. */
  private applyPresetHeroes(preset: ArmyPreset) {
    if (!preset.heroes?.length) return [];
    const { lineup, changes } = this.presetHeroPlan(preset);
    if (lineup.length) this.state.heroLineup = lineup.map((hero) => hero.kind);
    if (this.blacksmith) {
      const gear = structuredClone(this.gear);
      for (const hero of lineup) if (hero.items.length) gear.loadouts[hero.kind] = [...hero.items];
      this.state.gear = gear;
    }
    if (this.petHouse) {
      const pets = structuredClone(this.petProgress);
      for (const hero of lineup) {
        if (!hero.pet) continue;
        for (const [other, assigned] of Object.entries(pets.assigned))
          if (assigned === hero.pet) delete pets.assigned[other as HeroKind];
        pets.assigned[hero.kind] = hero.pet;
      }
      this.state.pets = pets;
    }
    this.changed();
    return changes;
  }
  /** The Cookbook recipes offered at this Town Hall (docs/ARMY-RECIPES.md). */
  get armyRecipes() {
    return armyRecipesFor(this.townhallLevel);
  }
  /**
   * Makes a Cookbook recipe the active army, as the original's Use does: its troops, siege
   * machines and spells replace the army, and its heroes, items and pets take their places where
   * this village has them (the rest are swapped or left out, and the message says which).
   */
  useArmyRecipe(id: string) {
    const recipe = this.armyRecipes.find((r) => r.id === id);
    if (this.battle || !recipe) return false;
    const issue = this.armyPreparationIssue(recipe.army, recipe.spells);
    if (issue) {
      this.notify(`${ARMY_RECIPE_TEXTS.cannotTrain}. ${issue}`);
      return false;
    }
    this.prepareArmy(recipe.army, recipe.spells);
    const changes = this.applyPresetHeroes(recipe);
    const loaded = ARMY_RECIPE_TEXTS.loaded.replace('<army>', recipe.name);
    this.notify(changes.length ? `${loaded} ${changes.join(' · ')}.` : loaded);
    return true;
  }
  /**
   * Saves a Cookbook recipe as a Quick army, as the original's Save keeps it among the player's
   * own recipes: in the first empty slot, or over `slot` (which Undo save can restore).
   */
  saveArmyRecipe(id: string, slot?: number) {
    const recipe = this.armyRecipes.find((r) => r.id === id);
    if (this.battle || !recipe) return false;
    const presets = (this.state.armyPresets ??= [null, null, null]);
    const target = slot ?? presets.findIndex((p) => !p);
    if (!Number.isInteger(target) || target < 0 || target > 2) {
      this.notify('All three Quick army slots are full. Choose one to save over.');
      return false;
    }
    const previous = presets[target];
    if (previous) this.overwritten.presets.set(target, structuredClone(previous));
    presets[target] = {
      name: recipe.name.slice(0, 32),
      army: { ...recipe.army },
      spells: { ...recipe.spells },
      ...(recipe.heroes.length
        ? { heroes: recipe.heroes.map((hero) => ({ ...hero, items: [...hero.items] })) }
        : {}),
    };
    this.notify(`${recipe.name} saved as Quick army ${target + 1}.`);
    this.changed();
    return true;
  }
  retrain() {
    if (!this.state.lastArmy) {
      this.notify('Complete a raid to save an army composition.');
      return false;
    }
    const army = { ...this.state.army },
      spells = { ...this.state.spells };
    for (const k of TROOP_KEYS) army[k] = Math.max(army[k], this.state.lastArmy[k]);
    for (const k of SPELL_KEYS) spells[k] = Math.max(spells[k], this.state.lastSpells?.[k] ?? 0);
    if (!this.prepareArmy(army, spells)) return false;
    this.notify('Your last army is ready.');
    return true;
  }

  // ------------------------------------------------------------------- battle
  get blacksmith() {
    return this.state.buildings.find((b) => b.kind === 'blacksmith' && !b.constructing);
  }
  /**
   * The King's three original items in the classic record's shape, read from `gear`. A view only:
   * equipping and upgrading write `gear`, which is also what battles carry.
   */
  get kingEquipment(): { levels: Record<EquipmentKind, number>; loadout: EquipmentKind[] } {
    const gear = this.gear;
    const levels = Object.fromEntries(
      EQUIPMENT_KEYS.map((k) => [k, gear.levels[LEGACY_ITEM[k]] ?? 1]),
    ) as Record<EquipmentKind, number>;
    const loadout = (gear.loadouts.king ?? []).flatMap((slug) =>
      EQUIPMENT_KEYS.filter((k) => LEGACY_ITEM[k] === slug),
    );
    return { levels, loadout };
  }
  get ores() {
    return this.state.ores ?? emptyOres();
  }
  /** What this village's forge can hold. A village with no forge still keeps what it has. */
  get oreCapacity() {
    return oreCapacity(this.blacksmith?.level ?? 1);
  }
  get starBonus() {
    return this.state.starBonus ?? emptyStarBonus();
  }
  /** The pinned league this village's trophies fall in; its bands are contiguous. */
  get league() {
    return leagueFor(this.state.trophies);
  }
  /** Whether the daily bonus is both paid for and off cooldown. */
  get starBonusReady() {
    const bonus = this.starBonus;
    return bonus.stars >= STAR_BONUS_STARS && this.clock >= bonus.readyAt;
  }
  /** The Clan Castle that holds the Treasury, once built. */
  get clanCastle() {
    return this.state.buildings.find((b) => b.kind === 'clancastle' && !b.constructing);
  }
  /** What the Treasury holds; without a clan, its size follows the Town Hall alone. */
  get treasury(): Treasury {
    return this.state.treasury ?? emptyTreasury();
  }
  get treasuryCapacity(): Treasury {
    return treasuryCapacity(this.townhall?.level ?? 1);
  }
  /** Whether a Town Hall upgrade's boost multiplies the Star Bonus right now. */
  get starBonusBoosted() {
    return this.clock < (this.starBonus.boostUntil ?? 0);
  }
  /** The bonus the league pays now, boost included. */
  get starBonusPayout(): StarBonusReward {
    const reward = starBonusReward(this.state.trophies),
      multiplier = this.starBonusBoosted ? TOWN_HALL_BOOST_MULTIPLIER : 1;
    return Object.fromEntries(
      Object.entries(reward).map(([k, v]) => [k, v * multiplier]),
    ) as StarBonusReward;
  }
  /**
   * The league's own reward. Gold, elixir and Dark Elixir are banked in the Clan Castle's
   * Treasury, up to its room (the rest is lost, as in the original); a village without a Clan
   * Castle takes them straight into its storages instead. Ore goes to the forge either way.
   */
  collectStarBonus() {
    if (this.serverReadOnly) return false;
    if (this.battle || !this.starBonusReady) return false;
    const reward = this.starBonusPayout;
    const bonus = (this.state.starBonus ??= emptyStarBonus());
    const taken: Partial<Record<string, number>> = {};
    const castle = !!this.clanCastle;
    if (castle) {
      const treasury = { ...this.treasury },
        capacity = this.treasuryCapacity;
      for (const k of TREASURY_RESOURCES) {
        const amount = Math.min(reward[k], Math.max(0, capacity[k] - treasury[k]));
        treasury[k] += amount;
        taken[k] = amount;
      }
      this.state.treasury = treasury;
    } else
      for (const k of TREASURY_RESOURCES) {
        const room = Math.max(0, this.resourceCap(k) - this.state[k]);
        const amount = Math.min(reward[k], room);
        if (amount > 0) this.state[k] += amount;
        taken[k] = amount;
      }
    const ores = { ...this.ores },
      capacity = this.oreCapacity;
    for (const k of ORE_KEYS) {
      const amount = Math.min(reward[k], Math.max(0, capacity[k] - ores[k]));
      ores[k] += amount;
      taken[k] = amount;
    }
    this.state.ores = ores;
    bonus.stars -= STAR_BONUS_STARS;
    bonus.readyAt = this.clock + STAR_BONUS_COOLDOWN;
    // 'Resources collected' counts gold, elixir and dark elixir as collectors do, when they
    // reach the storages; ore is not a village resource and has its own balance.
    if (!castle)
      this.state.stats.collected =
        (this.state.stats.collected ?? 0) + taken.gold! + taken.elixir! + taken.dark!;
    this.notify(
      `${this.league.name} Star Bonus ${castle ? 'banked in the Treasury' : 'collected'}.`,
    );
    this.changed();
    return taken;
  }
  /**
   * Moves the Treasury into the storages. Everything is collected at once; what a full storage
   * cannot take stays in the Treasury. Gold collected from the Clan Castle counts toward Clan
   * War Wealth, whose tiers read "Collect … Gold from the Clan Castle".
   */
  collectTreasury() {
    if (this.serverReadOnly) return false;
    if (this.battle || !this.clanCastle) return false;
    const treasury = { ...this.treasury },
      moved = emptyTreasury();
    for (const k of TREASURY_RESOURCES) {
      moved[k] = Math.min(treasury[k], Math.max(0, this.resourceCap(k) - this.state[k]));
      treasury[k] -= moved[k];
      this.state[k] += moved[k];
    }
    const total = moved.gold + moved.elixir + moved.dark;
    if (!total) {
      this.notify(
        TREASURY_RESOURCES.some((k) => treasury[k] > 0)
          ? 'Your storages are full.'
          : 'The Treasury is empty.',
      );
      return false;
    }
    this.state.treasury = treasury;
    this.state.stats.collected = (this.state.stats.collected ?? 0) + total;
    this.countAchievements('war_loot', moved.gold);
    this.notify(
      TREASURY_RESOURCES.some((k) => treasury[k] > 0)
        ? 'Treasury collected. What your storages could not hold stays in the Treasury.'
        : 'Treasury collected.',
    );
    this.changed();
    return moved;
  }
  /** A finished Town Hall upgrade multiplies the Star Bonus for its level's hours. */
  private boostStarBonus(level: number, finished: number) {
    const hours = townHallBoostHours(level);
    if (!hours) return;
    const bonus = (this.state.starBonus ??= emptyStarBonus());
    bonus.boostUntil = Math.max(bonus.boostUntil ?? 0, finished + hours * 3600_000);
    this.notify(`Star Bonus boosted ${TOWN_HALL_BOOST_MULTIPLIER}× for ${hours / 24} days!`);
  }
  /** Highest equipment level this village's forge opens; every item shares the gate. */
  get equipmentCeiling() {
    const forge = this.blacksmith?.level ?? 0;
    return forge ? EQUIPMENT_LEVELS.filter((row) => row.blacksmith <= forge).length : 0;
  }
  /** Classic King slots: the same `gear` loadout the King's native panel and battles use. */
  equipKing(kind: EquipmentKind, slot: number) {
    if (this.battle || !this.state.king || !validEquipmentKind(kind)) return false;
    return this.equipItem('king', LEGACY_ITEM[kind], slot);
  }
  /** Classic King upgrade: the same `gear` level the native item upgrade raises. */
  upgradeEquipment(kind: EquipmentKind, expectedLevel: number, maxGems = 0) {
    if (this.serverReadOnly) return false;
    if (!validEquipmentKind(kind)) return false;
    return this.upgradeItem(LEGACY_ITEM[kind], expectedLevel, maxGems);
  }
  get heroHall() {
    return this.state.buildings.find((b) => b.kind === 'herohall' && !b.constructing);
  }
  // ------------------------------------------------------------ Hero's Journey
  /** Open from Town Hall 7 with a Hero Hall. */
  get journeyOpen() {
    return this.townhallLevel >= JOURNEY_TOWN_HALL && !!this.heroHall;
  }
  /** Journey progress: every hero's level added together. */
  get journeyPoints() {
    return HERO_KINDS.reduce((sum, kind) => sum + (this.heroProgress(kind)?.level ?? 0), 0);
  }
  get journey(): JourneyState {
    return this.state.journey ?? { claimed: [] };
  }
  /** Tiers reached and not yet taken; a quest tier waits while another quest runs. */
  get journeyClaimable() {
    const j = this.journey;
    return JOURNEY_TIERS.flatMap((tier, i) =>
      tier.level <= this.journeyPoints &&
      !j.claimed.includes(i) &&
      !(tier.reward.type === 'quest' && (j.quest || !questTarget(i)))
        ? [i]
        : [],
    );
  }
  /** Take a reached tier's reward, or start its Hero Quest. */
  claimJourney(tier: number) {
    if (this.battle || !this.journeyOpen || !this.journeyClaimable.includes(tier)) return false;
    const j = (this.state.journey ??= { claimed: [] });
    const reward = JOURNEY_TIERS[tier].reward;
    let note = '';
    switch (reward.type) {
      case 'elixir':
      case 'dark': {
        const room = Math.max(
          0,
          Math.floor(this.resourceCap(reward.type) - this.state[reward.type]),
        );
        const taken = Math.min(room, reward.amount);
        this.state[reward.type] += taken;
        note = `+${taken.toLocaleString()} ${reward.type === 'dark' ? 'Dark Elixir' : 'Elixir'}${taken < reward.amount ? ` · ${(reward.amount - taken).toLocaleString()} did not fit` : ''}`;
        break;
      }
      case 'ore': {
        const ores = { ...this.ores };
        const taken = Math.min(
          reward.amount,
          Math.max(0, this.oreCapacity[reward.ore] - ores[reward.ore]),
        );
        ores[reward.ore] += taken;
        this.state.ores = ores;
        note = `+${taken.toLocaleString()} ${ORES[reward.ore].name}${taken < reward.amount ? ` · ${(reward.amount - taken).toLocaleString()} did not fit` : ''}`;
        break;
      }
      case 'item': {
        const kind = journeyMagicItem(reward.item);
        if (!kind) return false;
        const sold = this.addMagicItem(kind, reward.count);
        note = `+${reward.count} ${reward.item}${sold ? ` · ${sold} did not fit and sold for ${sold * MAGIC_ITEMS[kind].gemValue} gems` : ''}`;
        break;
      }
      case 'equipment': {
        const gear = structuredClone(this.gear);
        const slug = nextJourneyEpic(reward.hero, (s) => gear.levels[s] !== undefined);
        if (slug) {
          gear.levels[slug] = Math.min(reward.level, itemMaxLevel(slug));
          this.state.gear = gear;
          note = `${itemName(slug)} level ${gear.levels[slug]} unlocked`;
        } else {
          const ores = { ...this.ores };
          ores.starry += Math.min(
            JOURNEY_ALL_OWNED_STARRY,
            Math.max(0, this.oreCapacity.starry - ores.starry),
          );
          this.state.ores = ores;
          note = `Every Epic item is owned: +${JOURNEY_ALL_OWNED_STARRY} Starry Ore`;
        }
        break;
      }
      case 'skin':
        note = 'Skin recorded (skins are not drawn in this game)';
        break;
      case 'quest': {
        const target = questTarget(tier)!;
        j.quest = { tier, ...target, stars: 0, ends: this.clock + JOURNEY_QUEST_MS };
        note = `Hero Quest started: ${JOURNEY_QUEST_STARS} stars in ladder matches with ${target.item ? itemName(target.item) : HERO_SOURCE[target.hero]}`;
        break;
      }
    }
    j.claimed.push(tier);
    this.notify(note);
    this.changed();
    return true;
  }
  /** Stars a ladder match earns toward the running Hero Quest, then its Ore Chests. */
  private advanceJourneyQuest(b: Battle) {
    const quest = this.state.journey?.quest;
    if (!quest || !b.ladder || !b.stars || this.clock >= quest.ends) return;
    const hero = b.nativeHeroes?.find((h) => h.kind === quest.hero && h.deployed);
    // An item quest whose Epic is not owned asks for the hero's starting item instead.
    const item =
      quest.item && this.gear.levels[quest.item] === undefined
        ? heroDefaultItems(quest.hero)[0]
        : quest.item;
    if (!hero || (item && !hero.items.some((carried) => carried.slug === item))) return;
    quest.stars = Math.min(JOURNEY_QUEST_STARS, quest.stars + b.stars);
    if (quest.stars < JOURNEY_QUEST_STARS) return;
    const chests = questChests(
      this.townhallLevel,
      quest.tier * 7919 + Math.floor(quest.ends / 1000),
    );
    const ores = { ...this.ores },
      capacity = this.oreCapacity;
    for (const k of ORE_KEYS) ores[k] += Math.min(chests[k], Math.max(0, capacity[k] - ores[k]));
    this.state.ores = ores;
    const j = this.state.journey!;
    (j.completed ??= []).push(quest.tier);
    delete j.quest;
    this.notify(
      `Hero Quest complete! Ore Chests: ${chests.shiny} Shiny, ${chests.glowy} Glowy, ${chests.starry} Starry`,
    );
  }
  // ------------------------------------------------------------ magic items
  magicItemCount(kind: MagicItemKind) {
    return this.state.magicItems?.[kind] ?? 0;
  }
  /**
   * Adds items up to each item's limit; what does not fit is sold for its gem value, as the client
   * does with rewards that cannot fit. Returns how many were sold.
   */
  addMagicItem(kind: MagicItemKind, count = 1) {
    const items = (this.state.magicItems ??= {});
    const held = items[kind] ?? 0;
    const kept = Math.max(0, Math.min(count, MAGIC_ITEMS[kind].max - held));
    items[kind] = held + kept;
    const sold = count - kept;
    this.state.gems += sold * MAGIC_ITEMS[kind].gemValue;
    return sold;
  }
  /** Cash one item in for its gems. */
  sellMagicItem(kind: MagicItemKind) {
    if (this.battle || !this.magicItemCount(kind)) return false;
    this.spendItem(kind);
    const gems = MAGIC_ITEMS[kind].gemValue;
    this.state.gems += gems;
    this.notify(`${MAGIC_ITEMS[kind].name} sold for ${gems} gems.`);
    this.changed();
    return true;
  }
  private spendItem(kind: MagicItemKind, count = 1) {
    this.state.magicItems![kind] = this.magicItemCount(kind) - count;
  }
  /**
   * Runs an upgrade whose cost a Hammer, Wall Ring or Super Potion covers: the usual rules apply,
   * but every resource is on hand and none is spent. Nothing observes the purse in between.
   */
  private covered<T>(action: () => T): T {
    const purse = { gold: this.state.gold, elixir: this.state.elixir, dark: this.state.dark };
    this.state.gold = this.state.elixir = this.state.dark = Number.MAX_SAFE_INTEGER;
    try {
      return action();
    } finally {
      Object.assign(this.state, purse);
    }
  }
  /** Runes fill their resource's storages, and only when they have room. */
  useRune(kind: MagicItemKind) {
    if (this.serverReadOnly) return false;
    const effect = MAGIC_ITEMS[kind]?.effect;
    if (this.battle || !effect || !('fill' in effect) || !this.magicItemCount(kind)) return false;
    const resource = effect.fill,
      cap = this.resourceCap(resource);
    if (this.state[resource] >= cap) {
      this.notify(
        cap ? 'Those storages are already full.' : 'Build a storage for this resource first.',
      );
      return false;
    }
    this.spendItem(kind);
    const added = cap - this.state[resource];
    this.state[resource] = cap;
    this.notify(`${MAGIC_ITEMS[kind].name} used: +${Math.floor(added).toLocaleString()}.`);
    this.changed();
    return true;
  }
  /** What a Book's target is: building upgrades, troop or spell research, hero or pet upgrades. */
  private bookTarget(target: BookTarget): MagicTarget | undefined {
    if ('building' in target)
      return this.state.buildings.find((b) => b.id === target.building)?.upgradeEnd !== undefined
        ? 'building'
        : undefined;
    if ('research' in target) {
      const r = this.state.research;
      return r ? (isSpellKind(r.kind) ? 'spell' : 'troop') : undefined;
    }
    if ('pet' in target) return this.state.pets?.research ? 'hero' : undefined;
    return this.heroProgress(target.hero)?.upgradeEnd ? 'hero' : undefined;
  }
  /** Books that can finish this running upgrade now, the Book of Everything last. */
  booksFor(target: BookTarget): MagicItemKind[] {
    const kind = this.bookTarget(target);
    if (!kind) return [];
    const books = Object.entries(MAGIC_ITEMS)
      .filter(
        ([item, d]) =>
          'finish' in d.effect && d.effect.finish.includes(kind) && this.magicItemCount(item),
      )
      .map(([item]) => item);
    // The Book of Everything only stands in when no other book can.
    return books.length > 1 ? books.filter((b) => b !== 'book-of-everything') : books;
  }
  /** A Book finishes one running upgrade now. */
  useBook(kind: MagicItemKind, target: BookTarget) {
    if (this.serverReadOnly) return false;
    if (this.battle || !this.booksFor(target).includes(kind)) return false;
    let name: string;
    if ('building' in target) {
      const b = this.state.buildings.find((v) => v.id === target.building)!;
      finishTimerNow(b, this.clock);
      name = BUILDINGS[b.kind].name;
    } else if ('research' in target) {
      const r = this.state.research!;
      r.end = this.clock;
      name = isSpellKind(r.kind) ? SPELLS[r.kind].name : TROOPS[r.kind].name;
    } else if ('pet' in target) {
      const r = this.state.pets!.research!;
      r.end = this.clock;
      name = PET_DISPLAY[r.kind];
    } else {
      finishTimerNow(this.heroProgress(target.hero)!, this.clock);
      name = HERO_SOURCE[target.hero];
    }
    this.spendItem(kind);
    this.notify(`${MAGIC_ITEMS[kind].name} used: ${name} upgrade finished.`);
    this.tick(this.clock);
    this.changed();
    return true;
  }
  /** Book of Heroes: finish one hero's upgrade now. */
  useBookOfHeroes(kind: HeroKind) {
    if (this.serverReadOnly) return false;
    const book = this.booksFor({ hero: kind })[0];
    return !!book && this.useBook(book, { hero: kind });
  }
  /**
   * A Hammer performs the next upgrade of a building, troop, spell, hero or pet instantly and at
   * no cost. Every other requirement holds: a free builder for buildings and heroes, the Town
   * Hall, Laboratory or Pet House level, and no upgrade of that target already running. Walls
   * take Wall Rings, never Hammers.
   */
  useHammer(kind: MagicItemKind, target: HammerTarget) {
    if (this.serverReadOnly) return false;
    const effect = MAGIC_ITEMS[kind]?.effect;
    if (this.battle || !effect || !('upgrade' in effect) || !this.magicItemCount(kind))
      return false;
    const done = () => {
      this.spendItem(kind);
      this.tick(this.clock);
      this.changed();
      return true;
    };
    if ('building' in target) {
      const b = this.state.buildings.find((v) => v.id === target.building);
      if (!effect.upgrade.includes('building') || !b || b.kind === 'wall' || b.constructing)
        return false;
      if (b.upgradeEnd) return (this.notify('This building is already upgrading.'), false);
      this.covered(() => this.upgrade(b.id));
      if (!b.upgradeEnd) return false;
      finishTimerNow(b, this.clock);
      this.notify(`${MAGIC_ITEMS[kind].name} used: ${BUILDINGS[b.kind].name} upgraded.`);
      return done();
    }
    if ('hero' in target) {
      const hero = this.heroProgress(target.hero);
      if (!effect.upgrade.includes('hero') || !hero || hero.upgradeEnd) return false;
      if (!this.covered(() => this.upgradeRosterHero(target.hero))) return false;
      finishTimerNow(hero, this.clock);
      this.notify(`${MAGIC_ITEMS[kind].name} used: ${HERO_SOURCE[target.hero]} upgraded.`);
      return done();
    }
    if ('pet' in target) {
      const pets = this.state.pets,
        level = pets?.levels[target.pet];
      if (!effect.upgrade.includes('hero') || !this.petHouse || level === undefined) return false;
      if (pets!.research?.kind === target.pet)
        return (this.notify('This pet is already upgrading.'), false);
      if (level >= petLevelCap(target.pet, this.petHouse.level))
        return (this.notify('Upgrade the Pet House to raise this pet further.'), false);
      pets!.levels[target.pet] = level + 1;
      this.notify(
        `${MAGIC_ITEMS[kind].name} used: ${PET_DISPLAY[target.pet]} reached level ${level + 1}!`,
      );
      return done();
    }
    const research = target.research,
      spell = isSpellKind(research);
    if (!effect.upgrade.includes(spell ? 'spell' : 'troop')) return false;
    if (this.state.research?.kind === research)
      return (this.notify('This research is already running.'), false);
    const issue = this.researchIssue(research);
    if (issue) return (this.notify(issue), false);
    const { name, level } = this.raiseResearch(research);
    this.notify(`${MAGIC_ITEMS[kind].name} used: ${name} upgraded to level ${level}!`);
    return done();
  }
  /** Wall Rings one wall's next level takes: one per million of its cost. */
  wallRingsFor(id: number) {
    const b = this.state.buildings.find((v) => v.id === id && v.kind === 'wall');
    return b && b.level < this.maxLevel('wall') ? wallRings(this.upgradeCost(b)) : undefined;
  }
  /** Wall Rings upgrade one wall, with a free builder, as gold or elixir would. */
  useWallRing(id: number) {
    if (this.serverReadOnly) return false;
    const rings = this.wallRingsFor(id),
      held = this.magicItemCount('wall-ring');
    if (this.battle || rings === undefined || !held) return false;
    if (held < rings) return (this.notify(`This wall takes ${rings} Wall Rings.`), false);
    if (!this.covered(() => this.upgradeWalls([id], 'gold'))) return false;
    this.spendItem('wall-ring', rings);
    return true;
  }
  /** Super Potion: boosts a troop into its Super Troop with the usual rules, free. */
  useSuperPotion(kind: TroopKind) {
    if (this.serverReadOnly) return false;
    if (this.battle || !this.magicItemCount('super-potion')) return false;
    const before = this.state.superBoosts?.[kind] ?? 0;
    this.covered(() => this.boostSuperTroop(kind));
    if ((this.state.superBoosts?.[kind] ?? 0) === before) return false;
    this.spendItem('super-potion');
    this.notify(`Super Potion used: ${TROOPS[kind].name} boosted.`);
    this.changed();
    return true;
  }
  /** Builder, Research, Pet and Resource Potions; another of a running kind extends it. */
  usePotion(kind: MagicItemKind) {
    if (this.serverReadOnly) return false;
    const effect = MAGIC_ITEMS[kind]?.effect;
    if (this.battle || !effect || !('boost' in effect) || !this.magicItemCount(kind)) return false;
    if (
      (effect.boost === 'army' || effect.boost === 'heroes') &&
      !this.potionRaises(effect.boost)
    ) {
      this.notify(
        effect.boost === 'army'
          ? 'Your troops and spells are already at their Town Hall maximum.'
          : this.heroLineup.length
            ? 'Your heroes and pets are already at their Town Hall maximum.'
            : 'You have no hero to boost.',
      );
      return false;
    }
    const boosts = (this.state.boosts ??= {});
    const running = boosts[effect.boost];
    if (running && running.end > this.clock) running.end += effect.seconds * 1000;
    else
      boosts[effect.boost] = {
        start: this.clock,
        end: this.clock + effect.seconds * 1000,
        applied: this.clock,
      };
    this.spendItem(kind);
    this.notify(`${MAGIC_ITEMS[kind].name} active.`);
    this.changed();
    return true;
  }
  /**
   * The highest level a troop reaches at this Town Hall: the level its fully upgraded Laboratory
   * researches up to. A Super Troop follows its original's.
   */
  townHallTroopLevel(kind: TroopKind): number {
    const original = superOriginal(kind);
    if (original)
      return Math.max(
        1,
        Math.min(maxTroopLevel(kind), this.townHallTroopLevel(original) - superLevelOffset(kind)),
      );
    return researchLevelForLab(kind, this.maxLevel('laboratory'));
  }
  townHallSpellLevel(kind: SpellKind) {
    const lab = this.maxLevel('laboratory');
    let level = 1;
    while (
      level < maxSpellLevelFor(kind) &&
      (spellProgression(kind, level + 1)?.laboratory ?? Infinity) <= lab
    )
      level++;
    return level;
  }
  /** Power Potion: troops, spells and siege machines fight at their Town Hall maximum. */
  armyLevel(kind: TroopKind) {
    const level = this.troopLevel(kind);
    return this.boostLeft('army') ? Math.max(level, this.townHallTroopLevel(kind)) : level;
  }
  armySpellLevel(kind: SpellKind) {
    const level = this.spellLevel(kind);
    return this.boostLeft('army') ? Math.max(level, this.townHallSpellLevel(kind)) : level;
  }
  /** The highest level a hero reaches at this Town Hall, with its Hero Hall fully upgraded. */
  townHallHeroLevel(kind: HeroKind) {
    const hall = this.maxLevel('herohall');
    return kind === 'king'
      ? heroLevelCap(this.townhallLevel, hall)
      : rosterLevelCap(kind, this.townhallLevel, hall);
  }
  townHallPetLevel(kind: PetKind) {
    return petLevelCap(kind, this.maxLevel('pethouse'));
  }
  /** Hero Potion: heroes and pets fight at their Town Hall maximum. */
  battleHeroLevel(kind: HeroKind) {
    const level = this.heroProgress(kind)?.level ?? 1;
    return this.boostLeft('heroes') ? Math.max(level, this.townHallHeroLevel(kind)) : level;
  }
  battlePetLevel(kind: PetKind) {
    const level = this.petProgress.levels[kind] ?? 1;
    return this.boostLeft('heroes') ? Math.max(level, this.townHallPetLevel(kind)) : level;
  }
  /** Whether a Power or Hero Potion would raise anything the village fields. */
  private potionRaises(kind: 'army' | 'heroes') {
    if (kind === 'army')
      return (
        TROOP_KEYS.some(
          (k) =>
            !superOriginal(k) &&
            this.troopUnlocked(k) &&
            this.troopLevel(k) < this.townHallTroopLevel(k),
        ) ||
        SPELL_KEYS.some(
          (k) => this.spellUnlocked(k) && this.spellLevel(k) < this.townHallSpellLevel(k),
        )
      );
    return (
      HERO_KINDS.some((k) => {
        const hero = this.heroProgress(k);
        return hero && hero.level < this.townHallHeroLevel(k);
      }) ||
      (Object.keys(this.petProgress.levels) as PetKind[]).some(
        (k) => (this.petProgress.levels[k] ?? 1) < this.townHallPetLevel(k),
      )
    );
  }
  // ---------------------------------------------------------------- Trader
  /** This week's deals, the free one first. */
  get traderDeals(): TraderOffer[] {
    return weeklyDeals(traderWeek(this.clock));
  }
  /** Purchases of a deal this week. */
  traderBought(id: string) {
    const t = this.state.trader;
    return t?.week === traderWeek(this.clock) ? (t.bought[id] ?? 0) : 0;
  }
  /** Why a deal cannot be bought now, in the client's words where it has them. */
  traderIssue(deal: TraderOffer): string | null {
    if (this.townhallLevel < TRADER_TOWN_HALL)
      return `Trader arrives at Town Hall Level ${TRADER_TOWN_HALL}`;
    if (this.townhallLevel < TRADER_GEM_TOWN_HALL)
      return `Gem Offers unlock at Town Hall Level ${TRADER_GEM_TOWN_HALL}`;
    if (this.traderBought(deal.id) >= deal.quantity) return 'Out of stock';
    const room =
      'item' in deal.good
        ? MAGIC_ITEMS[deal.good.item].max - this.magicItemCount(deal.good.item)
        : this.oreCapacity[deal.good.ore] - this.ores[deal.good.ore];
    if (room < deal.amount) return 'Storage Full';
    if (this.state.gems < deal.gems) return 'Not enough gems';
    return null;
  }
  /** Buys one of this week's deals for its gems. */
  buyDeal(id: string) {
    if (this.serverReadOnly) return false;
    const deal = this.traderDeals.find((d) => d.id === id);
    if (this.battle || !deal) return false;
    const issue = this.traderIssue(deal);
    if (issue) return (this.notify(issue), false);
    const week = traderWeek(this.clock);
    if (this.state.trader?.week !== week) this.state.trader = { week, bought: {} };
    this.state.trader.bought[id] = this.traderBought(id) + 1;
    this.state.gems -= deal.gems;
    let name: string;
    if ('item' in deal.good) {
      this.addMagicItem(deal.good.item, deal.amount);
      name = MAGIC_ITEMS[deal.good.item].name;
    } else {
      const ores = { ...this.ores };
      ores[deal.good.ore] += deal.amount;
      this.state.ores = ores;
      name = ORES[deal.good.ore].name;
    }
    this.notify(`Bought ${deal.amount}× ${name}${deal.gems ? ` for ${deal.gems} gems` : ''}.`);
    this.changed();
    return true;
  }
  /** Seconds a potion has left, if it is running. */
  boostLeft(kind: BoostKind) {
    const boost = this.state.boosts?.[kind];
    return boost && boost.end > this.clock ? (boost.end - this.clock) / 1000 : 0;
  }
  /** The running timers a potion speeds up. */
  private boostTimers(kind: 'builders' | 'laboratory' | 'pets'): BoostTimer[] {
    const timer = (t: { upgradeStart?: number; upgradeEnd?: number }): BoostTimer => ({
      get end() {
        return t.upgradeEnd ?? 0;
      },
      // Both ends move, so the scheduled length and its completion XP are kept.
      move: (ms) => {
        t.upgradeEnd! -= ms;
        if (t.upgradeStart !== undefined) t.upgradeStart -= ms;
      },
    });
    const ending = (r: { end: number }): BoostTimer => ({
      get end() {
        return r.end;
      },
      move: (ms) => (r.end -= ms),
    });
    if (kind === 'laboratory') return this.state.research ? [ending(this.state.research)] : [];
    if (kind === 'pets') return this.state.pets?.research ? [ending(this.state.pets.research)] : [];
    return [
      ...this.state.buildings.filter((b) => b.upgradeEnd !== undefined).map(timer),
      ...HERO_KINDS.map((k) => this.heroProgress(k))
        .filter((h) => h?.upgradeEnd !== undefined)
        .map((h) => timer(h!)),
    ];
  }
  /** Marks a finished hero upgrade or research at the building that did it (home only). */
  private finishedAt(b: Building | undefined, finished: 'hero' | 'research') {
    if (!b || this.battle) return;
    const size = BUILDINGS[b.kind].size;
    this.onEffect({ type: 'upgrade', x: b.x + size / 2, y: b.y + size / 2, finished });
  }
  // ------------------------------------------------------------ Helper Hut
  get helperHut() {
    return this.state.buildings.find((b) => b.kind === 'helperhut' && !b.constructing);
  }
  helper(kind: HelperKind) {
    return this.state.helpers?.[kind];
  }
  /** Rested helpers with a job they could take: the Helper Hut's notification badge. */
  get helpersIdle() {
    if (!this.helperHut) return 0;
    return HELPER_KINDS.filter((kind) => {
      const h = this.helper(kind);
      return h && !h.job && helperReady(h, this.clock) && this.helperJobs(kind).length > 0;
    }).length;
  }
  /** The level a gem purchase would buy next, or undefined at the last level. */
  helperNext(kind: HelperKind) {
    return helperLevel(kind, (this.helper(kind)?.level ?? 0) + 1);
  }
  /** Why the next helper level cannot be bought now, or undefined when it can. */
  helperBlocker(kind: HelperKind): string | undefined {
    const next = this.helperNext(kind);
    if (!next) return 'Maximum level reached.';
    if (!this.helperHut) return 'Build the Helper Hut first.';
    if (this.townhallLevel < next.townHall) return `Requires Town Hall level ${next.townHall}.`;
    // TID_LAB_ASSISTANT_CANT_UPGRADE_WORKING
    if (helperWorking(kind, this.helper(kind)))
      return `You cannot upgrade the ${helperName(kind)} while he is working. Try again when he is resting!`;
    if (this.state.gems < next.cost) return 'Not enough gems.';
    return undefined;
  }
  /** Unlocks a helper or buys its next level with gems. */
  buyHelper(kind: HelperKind) {
    if (this.serverReadOnly) return false;
    if (this.battle) return false;
    const blocker = this.helperBlocker(kind);
    if (blocker) {
      this.notify(blocker);
      return false;
    }
    const next = this.helperNext(kind)!;
    this.state.gems -= next.cost;
    const helpers = (this.state.helpers ??= {});
    const h = helpers[kind];
    if (h) h.level = next.level;
    else helpers[kind] = { level: next.level };
    this.notify(
      next.level === 1
        ? `${helperName(kind)} Unlocked!`
        : `${helperName(kind)} upgraded to level ${next.level}!`,
    );
    this.changed();
    return true;
  }
  /** Jobs a helper can take now: running upgrades for the apprentice, research for the lab. */
  helperJobs(kind: HelperKind): { target: HelperTarget; name: string; end: number }[] {
    const now = this.clock;
    if (kind === 'alchemist') return [];
    if (kind === 'lab') {
      const r = this.state.research;
      if (!r || r.end <= now) return [];
      const name = isSpellKind(r.kind) ? SPELLS[r.kind].name : TROOPS[r.kind].name;
      return [
        { target: { research: r.kind, level: this.researchLevel(r.kind) }, name, end: r.end },
      ];
    }
    const jobs: { target: HelperTarget; name: string; end: number }[] = [];
    for (const b of this.state.buildings)
      if (b.upgradeEnd && b.upgradeEnd > now)
        jobs.push({
          target: { building: b.id, level: b.level },
          name: BUILDINGS[b.kind].name,
          end: b.upgradeEnd,
        });
    for (const kind of HERO_KINDS) {
      const hero = this.heroProgress(kind);
      if (hero?.upgradeEnd && hero.upgradeEnd > now)
        jobs.push({
          target: { hero: kind, level: hero.level },
          name: HERO_SOURCE[kind],
          end: hero.upgradeEnd,
        });
    }
    return jobs.sort((a, b) => a.end - b.end);
  }
  /** The running timer a helper target names, or undefined once it has completed or changed. */
  private helperTimer(target: HelperTarget): HelperTimer | undefined {
    let timer: { upgradeStart?: number; upgradeEnd?: number } | undefined;
    if ('building' in target) {
      const b = this.state.buildings.find((b) => b.id === target.building);
      if (b?.level === target.level) timer = b;
    } else if ('hero' in target) {
      const hero = this.heroProgress(target.hero);
      if (hero?.level === target.level) timer = hero;
    } else {
      const r = this.state.research;
      if (r?.kind !== target.research || this.researchLevel(r.kind) !== target.level) return;
      return {
        get end() {
          return r.end;
        },
        move: (ms) => (r.end -= ms),
      };
    }
    if (!timer?.upgradeEnd) return undefined;
    const t = timer;
    return {
      get end() {
        return t.upgradeEnd ?? 0;
      },
      // Both ends move, so the scheduled length and its completion XP are kept.
      move: (ms) => {
        t.upgradeEnd! -= ms;
        if (t.upgradeStart !== undefined) t.upgradeStart -= ms;
      },
    };
  }
  /** Sends a rested helper to work on a running job, optionally every day until it completes. */
  assignHelper(kind: HelperKind, target: HelperTarget, repeat = false) {
    if (this.battle || !this.helperHut) return false;
    const h = this.helper(kind);
    if (!h) {
      this.notify(`Unlock the ${helperName(kind)} to assign him to an upgrade.`);
      return false;
    }
    if (!helperReady(h, this.clock)) {
      this.notify(`The ${helperName(kind)} is resting right now. Come back later!`);
      return false;
    }
    const timer = this.helperTimer(target);
    if (!timer || timer.end <= this.clock) return false;
    startHelperJob(kind, h, structuredClone(target), this.clock, repeat);
    this.notify(`${helperName(kind)} is at work.`);
    this.changed();
    return true;
  }
  /**
   * The Alchemist converts `amount` of one resource into another at once, then rests. Output
   * beyond the target's storage is lost, as the client warns.
   */
  convertResources(from: ConvertResource, to: ConvertResource, amount: number) {
    if (this.battle || !this.helperHut) return false;
    const h = this.helper('alchemist');
    const name = (r: ConvertResource) =>
      r === 'dark' ? 'Dark Elixir' : r === 'gold' ? 'Gold' : 'Elixir';
    // The client's TID_ALCHEMIST_* and TID_VILLAGER_ALCHEMIST_* messages.
    const refuse = (message: string) => (this.notify(message), false);
    if (!h) return refuse('You need to unlock the Alchemist first!');
    if (!helperReady(h, this.clock))
      return refuse('The Alchemist is resting right now. Come back later!');
    if (from === to) return refuse('Cannot convert to the same resource');
    const take = Math.floor(amount);
    if (!(take > 0)) return refuse('You need to select a resource to convert!');
    if (take > alchemistCap(h.level, from) || take > this.state[from])
      return refuse(`Not enough ${name(from)}`);
    const made = alchemistOutput(h.level, from, to, take);
    const kept = Math.min(made, Math.max(0, Math.floor(this.resourceCap(to) - this.state[to])));
    this.state[from] -= take;
    this.state[to] += kept;
    h.readyAt =
      this.clock + (helperLevel('alchemist', h.level)!.seconds + HELPER_COOLDOWN_SECONDS) * 1000;
    this.notify(
      `Converted ${Math.floor(take).toLocaleString('en-US')} ${name(from)} into ${kept.toLocaleString('en-US')} ${name(to)}.`,
    );
    this.changed();
    return true;
  }
  /** Stops a recurring assignment; today's work, if any, still finishes. */
  stopHelperRepeat(kind: HelperKind) {
    const job = this.helper(kind)?.job;
    if (this.battle || !job?.repeat) return false;
    delete job.repeat;
    this.changed();
    return true;
  }
  // ------------------------------------------------------------ complete hero roster
  get heroHallLevel() {
    return this.heroHall?.level ?? 0;
  }
  get blacksmithLevel() {
    return this.blacksmith?.level ?? 0;
  }
  get petHouse() {
    return this.state.buildings.find((b) => b.kind === 'pethouse' && !b.constructing);
  }
  heroProgress(kind: HeroKind): HeroRosterProgress | undefined {
    return kind === 'king' ? this.state.king : this.state.heroes?.[kind];
  }
  /** The hero exists in this village (unlocked by its Hero Hall and Town Hall gates). */
  heroUnlocked(kind: HeroKind) {
    return (
      !!this.heroHall &&
      this.heroHallLevel >= heroUnlockHall(kind) &&
      this.townhallLevel >= heroUnlockTownHall(kind)
    );
  }
  heroLevelMax(kind: HeroKind) {
    return rosterLevelCap(kind, this.townhallLevel, this.heroHallLevel);
  }
  get heroSlotCount() {
    return this.heroHall ? heroSlots(this.heroHallLevel) : 0;
  }
  /** Every hero's items and loadouts: the one record panels, upgrades and battles read. */
  get gear(): HeroGear {
    this.migrateLegacyEquipment();
    const gear = this.state.gear ?? gearFromLegacy();
    unlockCommonItems(gear, this.blacksmithLevel);
    return gear;
  }
  /**
   * Saves from before the hero roster kept the King's items in `equipment`; later ones could
   * hold both, and the two drifted apart. Fold the original record into `gear` once and drop it,
   * whichever way the state arrived (construction, import or a test replacing it).
   */
  private migrateLegacyEquipment() {
    const legacy = this.state.equipment;
    if (!legacy) return;
    this.state.gear = this.state.gear
      ? mergeLegacyEquipment(this.state.gear, legacy)
      : gearFromLegacy(legacy);
    delete this.state.equipment;
  }
  get petProgress(): PetProgress {
    return this.state.pets ?? { levels: {}, assigned: {} };
  }
  /** Heroes that attack, in slot order: the saved lineup, then unlocked heroes in roster order. */
  get heroLineup(): HeroKind[] {
    const ready = HERO_KINDS.filter((kind) => this.heroProgress(kind));
    const chosen = (this.state.heroLineup ?? []).filter((kind) => ready.includes(kind));
    for (const kind of ready) if (!chosen.includes(kind)) chosen.push(kind);
    return chosen.slice(0, this.heroSlotCount);
  }
  setHeroLineup(heroes: HeroKind[]) {
    if (this.battle || !heroes.every((kind) => this.heroProgress(kind))) return false;
    if (new Set(heroes).size !== heroes.length || heroes.length > this.heroSlotCount) return false;
    this.state.heroLineup = [...heroes];
    this.changed();
    return true;
  }
  private advanceHeroRoster(now: number) {
    let changed = false;
    for (const kind of HERO_KINDS) {
      if (kind === 'king' || !this.heroUnlocked(kind) || this.state.heroes?.[kind]) continue;
      (this.state.heroes ??= {})[kind] = { level: 1 };
      this.notify(`${HERO_SOURCE[kind]} has joined your village!`);
      changed = true;
    }
    for (const [kind, hero] of Object.entries(this.state.heroes ?? {}) as [
      HeroKind,
      HeroRosterProgress,
    ][]) {
      if (!hero.upgradeEnd || hero.upgradeEnd > now) continue;
      const xp = completionXp(hero.upgradeStart, hero.upgradeEnd);
      hero.level++;
      delete hero.upgradeEnd;
      delete hero.upgradeStart;
      this.notify(`${HERO_SOURCE[kind]} reached level ${hero.level}!${xp ? ` +${xp} XP` : ''}`);
      this.gainXp(xp);
      this.finishedAt(this.heroHall, 'hero');
      changed = true;
    }
    const house = this.petHouse?.level ?? 0;
    if (house > 0) {
      const pets = (this.state.pets ??= { levels: {}, assigned: {} });
      for (const pet of PET_KINDS)
        if (petUnlockHouse(pet) <= house && pets.levels[pet] === undefined) {
          pets.levels[pet] = 1;
          this.notify(`${PET_DISPLAY[pet]} is ready at the Pet House!`);
          changed = true;
        }
    }
    const research = this.state.pets?.research;
    if (research && research.end <= now) {
      const pets = this.state.pets!;
      pets.levels[research.kind] = Math.min(
        petMaxLevel(research.kind),
        (pets.levels[research.kind] ?? 0) + 1,
      );
      delete pets.research;
      this.notify(`${PET_DISPLAY[research.kind]} reached level ${pets.levels[research.kind]}!`);
      changed = true;
    }
    return changed;
  }
  /** Upgrade any hero with a builder (the King keeps its original progress record). */
  upgradeRosterHero(kind: HeroKind) {
    if (this.serverReadOnly) return false;
    if (kind === 'king') return this.upgradeHero();
    const hero = this.state.heroes?.[kind];
    if (this.battle || !hero || !this.heroHall || hero.upgradeEnd) return false;
    if (hero.level >= this.heroLevelMax(kind)) {
      this.notify('Upgrade your Town Hall and Hero Hall to unlock more hero levels.');
      return false;
    }
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    const quote = heroUpgradeQuote(kind, hero.level)!;
    if (this.state[quote.resource] < quote.cost) {
      this.lacking(
        quote.resource,
        quote.cost,
        `You need ${quote.cost.toLocaleString()} ${quote.resource === 'dark' ? 'dark elixir' : quote.resource}.`,
        () => {
          this.upgradeRosterHero(kind);
        },
      );
      return false;
    }
    this.state[quote.resource] -= quote.cost;
    hero.upgradeStart = this.clock;
    hero.upgradeEnd = this.clock + quote.seconds * 1000;
    this.changed();
    return true;
  }
  finishRosterHero(kind: HeroKind) {
    if (kind === 'king') return this.finishHero();
    const hero = this.state.heroes?.[kind];
    if (this.battle || !hero?.upgradeEnd) return false;
    const cost = gemCost((hero.upgradeEnd - this.clock) / 1000);
    if (this.state.gems < cost) {
      this.notify('Not enough gems.');
      return false;
    }
    this.state.gems -= cost;
    finishTimerNow(hero, this.clock);
    this.tick(this.clock);
    this.changed();
    return true;
  }
  /** Equip an owned item in one of the hero's two slots; an item in the other slot swaps. */
  equipItem(hero: HeroKind, slug: string, slot: number) {
    if (this.battle || !this.blacksmith || (slot !== 0 && slot !== 1)) return false;
    const gear = structuredClone(this.gear);
    if (!validItem(slug) || itemHero(slug) !== hero || gear.levels[slug] === undefined)
      return false;
    const loadout = [...(gear.loadouts[hero] ?? [])];
    const previous = loadout[slot];
    if (previous === slug) return false;
    const other = loadout.indexOf(slug);
    if (other >= 0) loadout[other] = previous!;
    loadout[slot] = slug;
    gear.loadouts[hero] = loadout.filter(Boolean);
    this.state.gear = gear;
    this.changed();
    return true;
  }
  /** Instant ore upgrade, gated by the Blacksmith; a confirmed gem ceiling covers missing ore. */
  upgradeItem(slug: string, expectedLevel: number, maxGems = 0) {
    if (this.serverReadOnly) return false;
    if (
      this.battle ||
      !this.blacksmith ||
      !validItem(slug) ||
      !Number.isInteger(maxGems) ||
      maxGems < 0
    )
      return false;
    const gear = structuredClone(this.gear);
    const level = gear.levels[slug];
    if (level === undefined || level !== expectedLevel) return false;
    if (level >= itemLevelCap(slug, this.blacksmithLevel)) {
      this.notify('Upgrade the Blacksmith to raise this item further.');
      return false;
    }
    const cost = itemUpgradeCost(slug, level)!;
    const ores = { ...this.ores };
    const gems = ORE_KEYS.reduce(
      (sum, k) => sum + Math.max(0, cost[k] - ores[k]) * ORES[k].gems,
      0,
    );
    if (gems > maxGems || gems > this.state.gems) {
      this.notify(
        gems > this.state.gems ? 'Not enough gems.' : 'More ore is needed for this upgrade.',
      );
      return false;
    }
    for (const k of ORE_KEYS) ores[k] -= Math.min(ores[k], cost[k]);
    this.state.ores = ores;
    this.state.gems -= gems;
    gear.levels[slug] = level + 1;
    this.state.gear = gear;
    this.notify(`${itemName(slug)} upgraded to level ${level + 1}.`);
    this.changed();
    return true;
  }
  /** Epic items are sold by the Trader for gems (official wiki: 1,500 gems). */
  buyEpicItem(slug: string) {
    if (this.serverReadOnly) return false;
    if (this.battle || !this.blacksmith || !validItem(slug) || itemRarity(slug) !== 'EPIC')
      return false;
    const gear = structuredClone(this.gear);
    if (gear.levels[slug] !== undefined) return false;
    if (this.state.gems < EPIC_ITEM_GEMS) {
      this.notify('Not enough gems.');
      return false;
    }
    this.state.gems -= EPIC_ITEM_GEMS;
    gear.levels[slug] = 1;
    this.state.gear = gear;
    this.notify(`${itemName(slug)} added to your Blacksmith.`);
    this.changed();
    return true;
  }
  /** One pet per hero and one hero per pet; `null` removes the hero's pet. */
  assignPet(hero: HeroKind, pet: PetKind | null) {
    if (this.battle || !this.petHouse || !this.heroProgress(hero)) return false;
    const pets = structuredClone(this.petProgress);
    if (pet !== null && pets.levels[pet] === undefined) return false;
    for (const [other, assigned] of Object.entries(pets.assigned))
      if (assigned === pet) delete pets.assigned[other as HeroKind];
    if (pet === null) delete pets.assigned[hero];
    else pets.assigned[hero] = pet;
    this.state.pets = pets;
    this.changed();
    return true;
  }
  /** Pet House upgrade: Dark Elixir, one pet at a time, no builder. */
  researchPet(kind: PetKind) {
    if (this.serverReadOnly) return false;
    if (this.battle || !this.petHouse) return false;
    const pets = structuredClone(this.petProgress);
    const level = pets.levels[kind];
    if (level === undefined || pets.research) return false;
    if (level >= petLevelCap(kind, this.petHouse.level)) {
      this.notify('Upgrade the Pet House to raise this pet further.');
      return false;
    }
    const quote = petUpgradeQuote(kind, level)!;
    if (this.state[quote.resource] < quote.cost) {
      this.lacking(
        quote.resource,
        quote.cost,
        `You need ${quote.cost.toLocaleString()} dark elixir.`,
        () => {
          this.researchPet(kind);
        },
      );
      return false;
    }
    this.state[quote.resource] -= quote.cost;
    pets.research = { kind, start: this.clock, end: this.clock + quote.seconds * 1000 };
    this.state.pets = pets;
    this.changed();
    return true;
  }
  finishPetResearch() {
    const research = this.state.pets?.research;
    if (this.battle || !research) return false;
    const cost = gemCost((research.end - this.clock) / 1000);
    if (this.state.gems < cost) {
      this.notify('Not enough gems.');
      return false;
    }
    this.state.gems -= cost;
    research.end = this.clock;
    this.tick(this.clock);
    this.changed();
    return true;
  }
  get heroReady() {
    return this.heroLineup.some((kind) => !this.heroProgress(kind)!.upgradeEnd);
  }
  /** The battle hero entry for a kind, in version 46 battles. */
  battleHero(kind: HeroKind = this.activeHeroKind ?? 'king') {
    return this.battle?.nativeHeroes?.find((hero) => hero.kind === kind);
  }
  /** Select one native hero for deployment (or deselect); clears troop/spell selection. */
  selectNativeHero(kind: HeroKind | null) {
    if (this.replay) return false;
    if (kind !== null && !this.battle?.nativeHeroes?.some((hero) => hero.kind === kind))
      return false;
    this.activeHeroKind = kind;
    this.activeHero = false;
    this.activeSpell = null;
    this.changed();
    return true;
  }
  get heroMaxLevel() {
    return heroLevelCap(this.townhallLevel, this.heroHall?.level ?? 0);
  }
  upgradeHero() {
    if (this.serverReadOnly) return false;
    const king = this.state.king;
    if (this.battle || !king || !this.heroHall || king.upgradeEnd) return false;
    if (king.level >= this.heroMaxLevel) {
      this.notify('Upgrade your Town Hall and Hero Hall to unlock more hero levels.');
      return false;
    }
    if (this.busy >= this.builders) {
      this.notify('All builders are busy.');
      return false;
    }
    const cost = heroUpgradeCost(king.level);
    if (this.state.dark < cost) {
      this.notify('Collect more dark elixir from your drills.');
      return false;
    }
    this.state.dark -= cost;
    king.upgradeStart = this.clock;
    king.upgradeEnd = this.clock + heroUpgradeSeconds(king.level) * 1000;
    this.changed();
    return true;
  }
  finishHero() {
    const king = this.state.king;
    if (this.battle || !king?.upgradeEnd) return false;
    const cost = gemCost((king.upgradeEnd - this.clock) / 1000);
    if (this.state.gems < cost) {
      this.notify('Not enough gems.');
      return false;
    }
    this.state.gems -= cost;
    finishTimerNow(king, this.clock);
    this.tick(this.clock);
    this.changed();
    return true;
  }
  /** Hero setups for a version 46 battle: lineup order, equipped items and assigned pets. */
  private heroSetups(): HeroSetup[] {
    const gear = this.gear;
    const pets = this.petProgress;
    return this.heroLineup
      .filter((kind) => {
        const hero = this.heroProgress(kind);
        return hero && !hero.upgradeEnd;
      })
      .map((kind) => {
        const items = (gear.loadouts[kind] ?? [])
          .filter((slug) => gear.levels[slug] !== undefined)
          .slice(0, 2)
          .map((slug) => ({ slug, level: gear.levels[slug] }));
        const pet = pets.assigned[kind];
        const level = pet ? this.battlePetLevel(pet) : undefined;
        return {
          kind,
          level: this.battleHeroLevel(kind),
          items,
          ...(pet && level ? { pet: { kind: pet, level } } : {}),
        };
      });
  }
  /** Deploy one hero of the roster with its pet (version 46). */
  deployNativeHero(kind: HeroKind, x: number, y: number) {
    if (this.serverReadOnly) return false;
    if (this.replay) return false;
    const b = this.battle;
    const hero = b?.nativeHeroes?.find((entry) => entry.kind === kind);
    if (!b || b.finished || !hero || hero.unitId !== null) return false;
    const spot = this.guidePlacement({ hero: kind }, x, y);
    if (!spot) return false;
    ({ x, y } = spot);
    if (this.deployBlocked(x, y)) return false;
    this.recordAction({ type: 'hero', hero: kind, x, y });
    const starting = !b.started;
    this.beginFight();
    const stats = heroTroopStats(hero, b.townhall ?? this.townhallLevel);
    hero.unitId = this.state.nextId++;
    const recalled = hero.recalledHp;
    delete hero.recalledHp;
    if (recalled === undefined) recordWakeSpace(b, heroWakeSpace());
    b.units.push({
      id: hero.unitId,
      kind: heroUnitKind(kind),
      hero: kind,
      level: hero.level,
      x,
      y,
      hp: recalled ?? stats.hp,
      maxHp: stats.hp,
      cooldown: 0,
      target: null,
      path: [],
      pathAt: 0,
      attacking: false,
      spawnedAt: b.elapsed,
      native: initialNativeState(heroUnitKind(kind), hero.level),
    });
    if (hero.pet) {
      const pet = petTroopStats(hero.pet);
      const recalledPet = hero.recalledPetHp;
      delete hero.recalledPetHp;
      hero.petId = this.state.nextId++;
      b.units.push({
        id: hero.petId,
        kind: petUnitKind(hero.pet.kind),
        level: hero.pet.level,
        x: x + 0.6,
        y: y + 0.4,
        hp: recalledPet ?? pet.hp,
        maxHp: pet.hp,
        cooldown: 0,
        target: null,
        path: [],
        pathAt: 0,
        attacking: false,
        spawnedAt: b.elapsed,
        native: initialNativeState(petUnitKind(hero.pet.kind), hero.pet.level),
      });
    }
    hero.deployed = true;
    if (b.nativeHeroPassives) {
      const native = this.nativeContext(b, this.sharedWalls(b));
      refreshHeroPassives(
        native,
        hero,
        b.units.find((u) => u.id === hero.unitId)!,
      );
    }
    this.onEffect({ type: 'spawn', x, y });
    this.guidePlaced({ hero: kind });
    this.deployChanged(starting);
    return true;
  }
  /** One ability activation per hero and battle; a knocked-out hero fires it automatically. */
  activateNativeHeroAbility(kind: HeroKind, automatic = false) {
    if (this.serverReadOnly) return false;
    if (this.replay) return false;
    const b = this.battle;
    const hero = b?.nativeHeroes?.find((entry) => entry.kind === kind);
    const unit = b?.units.find((u) => u.id === hero?.unitId);
    if (!b || b.finished || !hero || !unit || hero.abilityUsed || unit.spent) return false;
    if (!automatic && unit.hp <= 0) return false;
    if (!automatic) this.recordAction({ type: 'ability', hero: kind });
    const native = this.nativeContext(b, this.sharedWalls(b));
    activateHero(
      {
        ...native,
        spawn: (k, level, x, y, at, owner) => spawnNativeUnit(native, k, level, x, y, at, owner),
      },
      hero,
      unit,
      b.townhall ?? this.townhallLevel,
    );
    this.changed();
    return true;
  }
  /** Legacy entry point: version 46 battles deploy the King from the roster. */
  deployHero(x: number, y: number) {
    if (this.serverReadOnly) return false;
    if (this.replay) return false;
    const b = this.battle,
      h = b?.hero;
    if (b?.nativeHeroes) return this.deployNativeHero(this.activeHeroKind ?? 'king', x, y);
    if (!b || b.finished || !h || h.unitId !== null || this.deployBlocked(x, y)) return false;
    this.recordAction({ type: 'hero', x, y });
    const starting = !b.started;
    this.beginFight();
    const stats = heroStats(h.level, h.townhall, h.equipment);
    h.unitId = this.state.nextId++;
    const recalled = h.recalledHp;
    delete h.recalledHp;
    if (recalled === undefined) recordWakeSpace(b, heroWakeSpace());
    b.units.push({
      id: h.unitId,
      kind: 'swordsman',
      hero: 'king',
      x,
      y,
      hp: recalled ?? stats.hp,
      maxHp: stats.hp,
      cooldown: 0,
      target: null,
      path: [],
      pathAt: 0,
      attacking: false,
    });
    this.onEffect({ type: 'spawn', x, y });
    this.deployChanged(starting);
    return true;
  }
  activateHeroAbility(automatic = false) {
    if (this.serverReadOnly) return false;
    if (this.replay) return false;
    const b = this.battle,
      h = b?.hero;
    if (b?.nativeHeroes)
      return this.activateNativeHeroAbility(this.activeHeroKind ?? 'king', automatic);
    const u = b?.units.find((u) => u.id === h?.unitId);
    if (!b || b.finished || !h || !u || h.abilityUsed || u.spent || (!automatic && u.hp <= 0))
      return false;
    if (!automatic) this.recordAction({ type: 'ability' });
    h.abilityUsed = true;
    h.abilityAt = b.elapsed;
    h.summonsSpawned = 0;
    const gear = equipmentBonuses(h.equipment);
    h.rageUntil = b.elapsed + gear.duration;
    u.hp = Math.min(u.maxHp, u.hp + heroRecovery(h.level, h.townhall, h.equipment));
    startKingQuake(b, u);
    this.spawnHeroSummons();
    this.onEffect({
      type: 'trap',
      x: u.x,
      y: u.y,
      text: gear.duration ? 'RAGE VIAL!' : gear.quakeBuilding ? 'EARTHQUAKE!' : 'BARBARIAN PUPPET!',
      color: 0xffcc4d,
    });
    this.changed();
    return true;
  }
  private spawnHeroSummons() {
    const b = this.battle,
      h = b?.hero;
    if (!b || b.finished || h?.abilityAt === undefined) return;
    const u = b.units.find((unit) => unit.id === h.unitId);
    if (!u || u.hp <= 0) return;
    const due = Math.min(
      equipmentBonuses(h.equipment).summons,
      (1 + Math.floor((b.elapsed - h.abilityAt + 1e-9) / HERO_ABILITY.spawnInterval)) *
        HERO_ABILITY.spawnBatch,
    );
    while ((h.summonsSpawned ?? 0) < due) {
      const spawnedAt =
        h.abilityAt +
        Math.floor((h.summonsSpawned ?? 0) / HERO_ABILITY.spawnBatch) * HERO_ABILITY.spawnInterval;
      const stats = this.troopStats('swordsman');
      b.units.push({
        id: this.state.nextId++,
        kind: 'swordsman',
        summoned: true,
        spawnedAt,
        rageUntil: spawnedAt + HERO_ABILITY.summonDuration,
        x: u.x,
        y: u.y,
        hp: stats.hp,
        maxHp: stats.hp,
        cooldown: 0,
        target: null,
        path: [],
        pathAt: 0,
        attacking: false,
      });
      h.summonsSpawned = (h.summonsSpawned ?? 0) + 1;
      this.onEffect({ type: 'spawn', x: u.x, y: u.y });
    }
  }
  visibleBuilding(building: Building) {
    if (this.battle && building.kind === 'skeletontrap') {
      const state = this.battle.traps[building.id];
      return (
        !this.battle.finished &&
        !!state &&
        this.battle.elapsed - state.activatedAt < SKELETON_COFFIN_SECONDS
      );
    }
    return (
      !this.battle ||
      (!concealedTesla(this.battle, building) &&
        (!isTrap(building.kind) ||
          !!this.battle.traps[building.id] ||
          alwaysVisibleTrap(this.battle, building)))
    );
  }
  campaignLoot(index: number, catalog?: CampaignCatalog): CampaignResources {
    const loot =
      (catalog === 'goblin-v1'
        ? this.state.nativeCampaign?.remaining[index]
        : this.state.campaignLoot?.remaining[index]) ?? campaignStage(index, catalog);
    return campaignResources(loot, campaignAmount(campaignStage(index, catalog), 'dark') > 0);
  }
  /**
   * A Goblin map village can be attacked: its path is open and, for a Practice level, the Town
   * Hall has reached the level's own.
   */
  campaignOpen(index: number) {
    const drill = practiceLevelAt(index);
    return (
      nativeUnlocked(index, this.state.nativeCampaign?.stars ?? []) &&
      (!drill || this.townhallLevel >= drill.townHall)
    );
  }
  /**
   * Attack a Goblin map village. A Practice level's first attempt (no star yet) is guided step
   * by step, as in the original; `guided` asks for the guide again, or goes without it.
   */
  startCampaign(index: number, guided?: boolean) {
    if (this.serverReadOnly) return false;
    this.startBattle(index, false, 'goblin-v1');
    const drill = practiceLevelAt(index),
      b = this.battle as Battle | null;
    if (!drill?.steps.length || !b?.fixedArmy || b.index !== index || b.started) return;
    if (!(guided ?? !(this.state.nativeCampaign?.stars[index] ?? 0))) return;
    this.practiceGuide = { steps: drill.steps, index: 0, placed: 0, elapsed: 0 };
    this.beginGuideStep();
    this.changed();
  }
  /** The guide's current step, if one is showing. */
  get guideStep(): PracticeStep | null {
    const g = this.practiceGuide;
    return g ? (g.steps[g.index] ?? null) : null;
  }
  /** What the guide says now: its step's words, or the last ones given while a step waits. */
  get guideText() {
    const g = this.practiceGuide;
    if (!g) return null;
    for (let i = g.index; i >= 0; i--) if (g.steps[i]?.text) return g.steps[i].text!;
    return null;
  }
  /** The original lets the player skip a level's guide and play on freely. */
  skipPracticeGuide() {
    if (!this.practiceGuide) return;
    this.practiceGuide = null;
    this.changed();
  }
  /** The building a guide step names by its tile: to wait for, or to point out. */
  guideBuilding(at: { x: number; y: number }) {
    return this.battle?.buildings.find((v) => v.x === at.x && v.y === at.y && !isTrap(v.kind));
  }
  /** The battle's pace under the guide's step: frozen (0), slowed, or running (1). */
  private guideSpeed(b: Battle) {
    const step = this.guideStep;
    if (!step?.pause || !(step.unit || step.ability) || this.guideStepDone(step, b)) return 1;
    return step.slowdown ? step.slowdown / 100 : 0;
  }
  /** Whether any of a unit is still in the tray to deploy. */
  private guideUnitLeft(b: Battle, unit: PracticeUnit) {
    if ('troop' in unit)
      return b.remaining[unit.troop] > 0 && !(isSiege(unit.troop) && b.siegeDeployed);
    if ('spell' in unit) return b.spells[unit.spell] > 0;
    const hero = b.nativeHeroes?.find((h) => h.kind === unit.hero);
    return !!hero && hero.unitId === null && !hero.deployed;
  }
  /**
   * A step is met when its units are placed (or none are left), its hero's ability is used (or
   * the hero cannot use it), its building has fallen, or its time has run.
   */
  private guideStepDone(step: PracticeStep, b: Battle) {
    const g = this.practiceGuide!;
    if (step.ability && step.unit && 'hero' in step.unit) {
      const kind = step.unit.hero;
      const hero = b.nativeHeroes?.find((h) => h.kind === kind);
      const unit = hero && b.units.find((u) => u.id === hero.unitId);
      return !hero || !!hero.abilityUsed || !unit || unit.hp <= 0;
    }
    if (step.unit)
      return (
        g.placed >= step.count ||
        !this.guideUnitLeft(b, step.unit) ||
        (step.duration !== undefined && g.elapsed >= step.duration)
      );
    // A wait also ends when nothing is left fighting, or after a minute: the original's
    // scripted attack always brings the building down, a player's may not.
    if (step.waitFor)
      return (
        !(this.guideBuilding(step.waitFor)?.hp ?? 0) ||
        g.elapsed >= GUIDE_WAIT_LIMIT ||
        (b.started && !b.units.some((u) => u.hp > 0))
      );
    return g.elapsed >= (step.duration ?? 0);
  }
  /** Moves the guide past every step that is met, selecting the next step's unit. */
  private advanceGuide() {
    const g = this.practiceGuide,
      b = this.battle;
    if (!g) return;
    if (!b || b.finished) {
      this.practiceGuide = null;
      return;
    }
    const from = g.index;
    while (g.index < g.steps.length && this.guideStepDone(g.steps[g.index], b)) {
      g.index++;
      g.placed = 0;
      g.elapsed = 0;
    }
    if (g.index >= g.steps.length) this.practiceGuide = null;
    else if (g.index !== from) this.beginGuideStep();
    if (g.index !== from) this.changed();
  }
  /** Finds the step's spot and puts its unit in hand, as the original's guide does. */
  private beginGuideStep() {
    const g = this.practiceGuide,
      step = this.guideStep,
      unit = step?.unit,
      b = this.battle;
    if (!g || !step || !b) return;
    delete g.spot;
    if (step.at) {
      const at = step.at;
      const clamp = (v: number) => Math.min(MAP_SIZE - 1, Math.max(1, v));
      // A spell may fall anywhere; a troop or hero needs open grass, as near the spot as can be.
      let best = { x: clamp(at.x), y: clamp(at.y) };
      if (!(unit && 'spell' in unit) && this.deployBlocked(best.x, best.y)) {
        let distance = Infinity;
        for (let x = 1; x < MAP_SIZE; x++)
          for (let y = 1; y < MAP_SIZE; y++) {
            const d = Math.hypot(x - at.x, y - at.y);
            if (d < distance && !this.deployBlocked(x, y)) {
              distance = d;
              best = { x, y };
            }
          }
      }
      g.spot = best;
    }
    if (!unit || step.ability || !this.guideUnitLeft(b, unit)) return;
    this.activeHero = false;
    this.activeSpell = null;
    this.activeHeroKind = null;
    if ('troop' in unit) this.activeTroop = unit.troop;
    else if ('spell' in unit) this.activeSpell = unit.spell;
    else this.activeHeroKind = unit.hero;
  }
  /**
   * Where a deploy may land under the guide: the tap itself, the step's spot for an exact step,
   * or nowhere when the step refuses it (another unit, outside its circle, or a wait).
   */
  private guidePlacement(
    unit: PracticeUnit,
    x: number,
    y: number,
  ): { x: number; y: number } | null {
    const step = this.guideStep;
    if (!step) return { x, y };
    const own = !!step.unit && !step.ability && sameUnit(step.unit, unit);
    if (step.forceType && !own) {
      this.notify(
        step.unit && !step.ability
          ? `Follow the guide: deploy ${practiceUnitName(step.unit)} now.`
          : 'Wait for the guide’s next step.',
      );
      return null;
    }
    const spot = this.practiceGuide?.spot;
    if (!own || !spot) return { x, y };
    if (step.forceLocation && Math.hypot(x - spot.x, y - spot.y) > step.radius + 0.5) {
      this.notify('Deploy inside the marked circle.');
      return null;
    }
    if (step.exact && ('spell' in unit || !this.deployBlocked(spot.x, spot.y))) return { ...spot };
    return { x, y };
  }
  /** Counts a deploy toward the guide's step and moves on when it is met. */
  private guidePlaced(unit: PracticeUnit) {
    const g = this.practiceGuide,
      step = this.guideStep;
    if (!g || !step) return;
    if (step.unit && !step.ability && sameUnit(step.unit, unit)) g.placed++;
    this.advanceGuide();
  }
  /** The next ladder opponent: a native layout near your Town Hall and trophies near yours. */
  get ladderPreview() {
    return ladderOpponent(this.state.ladderSeed ?? 0, this.townhallLevel, this.state.trophies);
  }
  /** Attack the next ladder opponent. Each match started moves on to a new opponent. */
  startLadder() {
    if (this.serverReadOnly) return false;
    if (this.battle) return;
    const { index, match } = this.ladderPreview;
    this.startBattle(index, false, 'goblin-v1', match);
    // startBattle may refuse (no army); the same opponent then waits for the next try.
    if ((this.battle as Battle | null)?.ladder)
      this.state.ladderSeed = (this.state.ladderSeed ?? 0) + 1;
  }
  startBattle(
    index: number,
    practice = false,
    catalog: CampaignCatalog = 'valley-v1',
    ladder?: LadderMatch,
  ) {
    if (this.serverReadOnly) return false;
    if (this.battle) return;
    if (
      !validCampaignCatalog(catalog) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= campaignStages(catalog).length ||
      (practice && catalog !== 'valley-v1') ||
      (ladder && (practice || catalog !== 'goblin-v1'))
    )
      return;
    // A Practice level brings its own army and opens at its Town Hall.
    const drill =
      !practice && !ladder && catalog === 'goblin-v1' ? practiceLevelAt(index) : undefined;
    if (drill && this.townhallLevel < drill.townHall)
      return this.notify(`${drill.name} opens at Town Hall ${drill.townHall}.`);
    if (!practice && catalog === 'goblin-v1') {
      const issues = nativeCampaignIssues(index);
      if (issues.length) return this.notify('This village is still being prepared.');
      if (!ladder && !nativeUnlocked(index, this.state.nativeCampaign?.stars ?? []))
        return this.notify('Earn a star along the path to unlock this village.');
    }
    if (!practice && catalog === 'valley-v1' && index > 0 && !this.state.stars[index - 1])
      return this.notify(`Earn a star on ${CAMPAIGN[index - 1].name} to unlock this village.`);
    if (
      !drill &&
      this.armySize === 0 &&
      !TROOP_KEYS.some((k) => isSiege(k) && this.state.army[k] > 0) &&
      !this.heroReady
    )
      return this.notify('Prepare an army or a hero before attacking.');
    this.cancel();
    this.editing = false;
    this.practiceGuide = null;
    if (!practice && !drill) {
      this.state.lastArmy = { ...this.state.army };
      this.state.lastSpells = { ...this.state.spells };
    }
    const heroes = drill ? structuredClone(drill.heroes) : this.heroSetups();
    const buildings = practice
      ? this.state.buildings.map((building) => ({ ...building, hp: building.maxHp, cooldown: 0 }))
      : catalog === 'goblin-v1'
        ? nativeBuildings(index)
        : enemyBase(index);
    const garrisons =
      !practice && catalog === 'goblin-v1' ? campaignGarrisonSetup(index, buildings) : undefined;
    const home =
      buildings.find((b) => b.kind === 'herohall') ?? buildings.find((b) => b.kind === 'townhall')!;
    // Practice defends with your own heroes; a campaign village defends with the heroes its
    // source names. They stand around the Hero Hall, except on a Practice level, whose level
    // file posts each one on a hero flag.
    const defenders = practice
      ? heroes.map((h) => ({ kind: h.kind, level: h.level }))
      : catalog === 'goblin-v1'
        ? nativeDefendingHeroes(index)
        : [];
    // A hall against the edge would otherwise post a hero off the board.
    const inside = (value: number) => Math.min(BUILD_MAX, Math.max(BUILD_MIN, value));
    // A Practice level's file posts each defending hero on its hero flag.
    const flags =
      !practice && catalog === 'goblin-v1' ? practiceLevelAt(index)?.heroFlags : undefined;
    const defendingHeroes = defenders.map((h, i) => {
      const flag = flags?.find((f) => f.kind === h.kind);
      return {
        kind: h.kind,
        level: h.level,
        x:
          flag?.x ??
          inside(home.x + BUILDINGS[home.kind].size / 2 + Math.cos((i * Math.PI) / 2) * 3),
        y:
          flag?.y ??
          inside(home.y + BUILDINGS[home.kind].size / 2 + Math.sin((i * Math.PI) / 2) * 3),
      };
    });
    // A ladder layout carries no loot: only trophies are at stake.
    const noLoot = campaignResources(
      { gold: 0, elixir: 0, dark: 0 },
      this.campaignLoot(index, catalog).dark !== undefined,
    );
    const initial = {
      ...(defendingHeroes.length ? { defendingHeroes } : {}),
      ...(garrisons ? { garrisons } : {}),
      ...(catalog === 'goblin-v1' ? { catalog, scenery: nativeScenery(index) } : {}),
      ...(ladder ? { ladder: { ...ladder } } : {}),
      ...(drill ? { fixedArmy: true } : {}),
      index,
      practice,
      buildings,
      army: { ...emptyArmy(), ...(drill?.army ?? this.state.army) },
      spells: { ...emptySpells(), ...(drill?.spells ?? this.state.spells) },
      troopLevels: drill
        ? { ...drill.troopLevels }
        : (Object.fromEntries(TROOP_KEYS.map((k) => [k, this.armyLevel(k)])) as Army),
      spellLevels: drill
        ? { ...drill.spellLevels }
        : (Object.fromEntries(SPELL_KEYS.map((k) => [k, this.armySpellLevel(k)])) as SpellBook),
      nextId: this.state.nextId,
      ...(ladder ? { availableLoot: noLoot, lootRoom: { ...noLoot } } : {}),
      ...(!practice && !ladder
        ? {
            availableLoot: this.campaignLoot(index, catalog),
            lootRoom: {
              gold: Math.min(
                this.campaignLoot(index, catalog).gold,
                Math.max(0, Math.floor(this.resourceCap('gold') - this.state.gold)),
              ),
              elixir: Math.min(
                this.campaignLoot(index, catalog).elixir,
                Math.max(0, Math.floor(this.resourceCap('elixir') - this.state.elixir)),
              ),
              ...(this.campaignLoot(index, catalog).dark !== undefined
                ? {
                    dark: Math.min(
                      this.campaignLoot(index, catalog).dark!,
                      Math.max(0, Math.floor(this.resourceCap('dark') - this.state.dark)),
                    ),
                  }
                : {}),
            },
          }
        : {}),
      townhall: this.townhallLevel,
      ...(heroes.length ? { heroes } : {}),
    };
    this.battle = replayBattle(initial);
    resetPathCaches();
    this.recordingLimitReached = false;
    this.recording = this.recordBattles
      ? {
          version: REPLAY_VERSION,
          initial: structuredClone(initial),
          steps: [],
          actions: [],
        }
      : null;
    this.activeTroop = TROOP_KEYS.find((k) => initial.army[k] > 0) ?? 'swordsman';
    this.activeSpell = null;
    this.activeHero = false;
    this.activeHeroKind = null;
    this.changed();
  }
  /** True where a troop may not be dropped: the red boundary the scene draws. */
  deployBlocked(x: number, y: number) {
    const b = this.battle;
    if (!b) return true;
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 1 ||
      y < 1 ||
      x > MAP_SIZE - 1 ||
      y > MAP_SIZE - 1
    )
      return true;
    return b.buildings.some(
      (v) =>
        v.hp > 0 &&
        v.kind !== 'wall' &&
        !isTrap(v.kind) &&
        !concealedTesla(b, v) &&
        x > v.x - 1.5 &&
        x < v.x + BUILDINGS[v.kind].size + 1.5 &&
        y > v.y - 1.5 &&
        y < v.y + BUILDINGS[v.kind].size + 1.5,
    );
  }
  /**
   * Deploys only move tray counts, which the HUD patches live; the first
   * deploy of a battle also starts the fight (banner, clock, buttons) and
   * still needs a full render.
   */
  private deployChanged(starting: boolean) {
    if (starting) this.changed();
    else this.changed(true);
  }
  deploy(x: number, y: number) {
    if (this.serverReadOnly) return false;
    if (this.replay) return false;
    if (this.activeHeroKind) return this.deployNativeHero(this.activeHeroKind, x, y);
    if (this.activeHero) return this.deployHero(x, y);
    const b = this.battle,
      k = this.activeTroop;
    if (!b || b.finished || b.remaining[k] <= 0 || (isSiege(k) && b.siegeDeployed)) return false;
    const spot = this.guidePlacement({ troop: k }, x, y);
    if (!spot) return false;
    ({ x, y } = spot);
    if (this.deployBlocked(x, y)) {
      this.notify('Deploy on the grass outside the red boundary.');
      return false;
    }
    this.recordAction({ type: 'troop', kind: k, x, y });
    const starting = !b.started;
    this.beginFight();
    b.remaining[k]--;
    if (isSiege(k)) b.siegeDeployed = true;
    if (!b.practice && !b.fixedArmy) this.state.army[k]--;
    const d = this.troopStats(k);
    const recalled = b.recalledHp?.[k]?.shift();
    if (recalled === undefined) recordWakeSpace(b, troopWakeSpace(TROOPS[k].space));
    b.units.push({
      id: this.state.nextId++,
      kind: k,
      x,
      y,
      hp: recalled ?? d.hp,
      maxHp: d.hp,
      cooldown: 0,
      target: null,
      path: [],
      pathAt: 0,
      attacking: false,
      ...(nativeBehavior(b, k) ? { native: initialNativeState(k, this.troopLevel(k)) } : {}),
    });
    this.onEffect({ type: 'spawn', x, y });
    this.guidePlaced({ troop: k });
    this.deployChanged(starting);
    return true;
  }
  /** Drops `count` troops in a small ring, the way a drag-deploy does in Clash. */
  deployMany(x: number, y: number, count: number) {
    if (this.serverReadOnly) return false;
    let placed = 0;
    for (let i = 0; i < count; i++) {
      const angle = (i / Math.max(1, count)) * Math.PI * 2;
      const radius = i === 0 ? 0 : 0.55;
      if (this.deploy(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)) placed++;
      else if (this.deploy(x, y)) placed++;
      else break;
    }
    return placed;
  }
  castSpell(x: number, y: number) {
    if (this.serverReadOnly) return false;
    if (this.replay) return false;
    const b = this.battle,
      k = this.activeSpell;
    if (!b || b.finished || !k || b.spells[k] <= 0) return false;
    const spot = this.guidePlacement({ spell: k }, x, y);
    if (!spot) return false;
    ({ x, y } = spot);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      y < 0 ||
      x > MAP_SIZE ||
      y > MAP_SIZE
    )
      return false;
    this.recordAction({ type: 'spell', kind: k, x, y });
    const starting = !b.started;
    this.beginFight();
    recordWakeSpace(b, spellWakeSpace(SPELLS[k].space));
    b.spells[k]--;
    if (!b.practice && !b.fixedArmy) this.state.spells[k]--;
    const d = this.spellStats(k);
    this.onEffect({ type: 'spell', x, y, spell: k, radius: d.radius });
    if (b.nativeContentExpansion) {
      castNativeSpell(b, SPELL_SOURCE[k], this.spellLevel(k), 'attack', x, y);
    } else if (k === 'lightning') {
      damageDefenders(b, { x, y }, d.damage, d.radius, 'both');
      lateLightningStrike(b, x, y, d.radius);
      for (const enemy of b.defenders ?? [])
        if (
          enemy.hp > 0 &&
          (enemy.kind === 'skeleton' || enemy.spawnedAt <= b.elapsed) &&
          distance2D(enemy.x - x, enemy.y - y) <= d.radius
        )
          enemy.stunnedUntil = b.elapsed + LIGHTNING_STUN;
      for (const v of b.buildings)
        if (
          v.hp > 0 &&
          !isTrap(v.kind) &&
          !concealedTesla(b, v) &&
          !['townhall', 'clancastle', 'goldstorage', 'elixirstorage', 'darkstorage'].includes(
            v.kind,
          ) &&
          distanceTo({ x, y }, v) <= d.radius
        ) {
          this.damage(v, d.damage, b.elapsed, true);
          if (v.hp > 0 && isDefense(v.kind)) {
            b.defenseStuns[v.id] = b.elapsed + LIGHTNING_STUN;
            v.cooldown = BUILDINGS[v.kind].rate!;
            delete b.defenseTargets[v.id];
          }
        }
    } else if (b.nativeRoster && !RELEASED_SPELL_KEYS.includes(k)) {
      // The spells the native roster added are cast from their client rows; the nine released
      // before it keep the implementation their own recordings were made with.
      castNativeSpell(b, SPELL_SOURCE[k], this.spellLevel(k), 'attack', x, y);
    } else if (k === 'freeze') {
      // Cold, not damage: defences stop mid-reload and defenders stop mid-step. The source
      // states a shorter `FreezeOuterTimeMS` for the edge of the burst, which needs an outer
      // radius the table does not give, so the whole radius takes the inner time.
      const until = b.elapsed + freezeSeconds(this.spellLevel('freeze'));
      for (const enemy of b.defenders ?? [])
        if (
          enemy.hp > 0 &&
          (enemy.kind === 'skeleton' || enemy.spawnedAt <= b.elapsed) &&
          distance2D(enemy.x - x, enemy.y - y) <= d.radius
        )
          enemy.stunnedUntil = Math.max(enemy.stunnedUntil ?? 0, until);
      for (const v of b.buildings)
        if (
          v.hp > 0 &&
          isDefense(v.kind) &&
          !concealedTesla(b, v) &&
          distanceTo({ x, y }, v) <= d.radius
        ) {
          b.defenseStuns[v.id] = Math.max(b.defenseStuns[v.id] ?? 0, until);
          v.cooldown = BUILDINGS[v.kind].rate!;
          delete b.defenseTargets[v.id];
        }
    } else if (k === 'clone') {
      // Copies are made in the order the originals were deployed, while the housing the
      // spell can carry lasts. A copy of a copy is not made: the source spends its housing
      // on what is really standing there.
      let room = cloneHousing(this.spellLevel('clone'));
      for (const original of b.units) {
        if (original.hp <= 0 || original.hero || original.summoned) continue;
        if (!(original.kind in b.remaining)) continue;
        if (distance2D(original.x - x, original.y - y) > d.radius) continue;
        const space = TROOPS[original.kind].space;
        if (space > room) continue;
        room -= space;
        const stats = this.troopStats(original.kind as TroopKind);
        b.units.push({
          id: this.state.nextId++,
          kind: original.kind,
          x: original.x,
          y: original.y,
          hp: stats.hp,
          maxHp: stats.hp,
          cooldown: 0,
          target: null,
          path: [],
          pathAt: 0,
          attacking: false,
          spawnedAt: b.elapsed,
          summoned: true,
          fadesAt: b.elapsed + CLONE_LIFETIME,
        });
        this.onEffect({ type: 'spawn', x: original.x, y: original.y });
      }
    } else if (k === 'recall') {
      // Troops come back into the hand, nearest the centre of the ring first, while the
      // housing the spell can carry lasts. A copy has nowhere to return to and is simply lost.
      let room = recallHousing(this.spellLevel('recall'));
      const inside = b.units
        .filter((u) => u.hp > 0 && !u.hero && distance2D(u.x - x, u.y - y) <= d.radius)
        .sort((a, c) => distance2D(a.x - x, a.y - y) - distance2D(c.x - x, c.y - y) || a.id - c.id);
      const taken = new Set<number>();
      for (const unit of inside) {
        const space = TROOPS[unit.kind].space;
        if (space > room) continue;
        room -= space;
        taken.add(unit.id);
        if (!unit.summoned && unit.kind in b.remaining) b.remaining[unit.kind as TroopKind]++;
        this.onEffect({ type: 'spawn', x: unit.x, y: unit.y });
      }
      if (taken.size) b.units = b.units.filter((u) => !taken.has(u.id));
    } else if (k === 'revive') {
      // The hero comes back where it fell, part way healed. With no hero down there is
      // nothing to revive and the spell is not spent.
      const hero = b.units.find((u) => u.hero && u.hp <= 0);
      if (!hero || distance2D(hero.x - x, hero.y - y) > d.radius) {
        b.spells[k]++;
        if (!b.practice && !b.fixedArmy) this.state.spells[k]++;
        this.notify('Cast the Revive Spell on a fallen hero.');
        return false;
      }
      hero.hp = Math.max(1, Math.round(hero.maxHp * reviveFraction(this.spellLevel('revive'))));
      delete hero.defeatedAt;
      delete hero.spent;
      hero.target = null;
      hero.path = [];
      hero.pathAt = 0;
      hero.attacking = false;
      this.onEffect({ type: 'spawn', x: hero.x, y: hero.y });
    } else startSpellAura(b, k as AuraSpell, x, y);
    if (b.spells[k] <= 0) this.activeSpell = SPELL_KEYS.find((s) => b.spells[s] > 0) ?? null;
    this.guidePlaced({ spell: k });
    this.deployChanged(starting);
    return true;
  }
  /** Pure healers never keep a battle open; a Druid does, because it becomes a fighting Bear. */
  private supportOnly(b: Battle, kind: UnitKind) {
    return !!TROOPS[kind].healer && !isSiege(kind) && !(b.nativeRoster && kind === 'druid');
  }
  /** Walls by tile for per-waypoint lookups; callers verify hp live at each hit. */
  private sharedWalls(b: Battle) {
    const wallTile = new Map<number, Building>();
    for (const v of b.buildings)
      if (v.kind === 'wall' && v.hp > 0) wallTile.set(v.y * MAP_SIZE + v.x, v);
    return { wallTile };
  }
  /** Version 45 roster rules share model damage, identifiers and effects with legacy combat. */
  private nativeContext(
    b: Battle,
    shared: { wallTile: Map<number, Building> },
  ): NativeTroopContext {
    const buildings = b.buildings.filter((v) => !concealedTesla(b, v));
    return {
      battle: b,
      buildings,
      buildingsById: new Map(buildings.map((v) => [v.id, v])),
      wallTile: shared.wallTile,
      damageBuilding: (target, amount, at, spell) => this.damage(target, amount, at, spell),
      effect: (fx) => this.onEffect(fx),
      nextId: () => this.state.nextId++,
      troopLevel: (kind) => this.troopLevel(kind),
      passableWalls: new Set(),
      recall: (u) => this.recallUnit(b, u),
    };
  }
  /** Troops that would divert onto a newly revealed Hidden Tesla. */
  private teslaDiverts(b: Battle, u: Unit) {
    if (TROOPS[u.kind].prefersDefenses) return true;
    if (!nativeBehavior(b, u.kind)) return false;
    const s = statsFor(b, u);
    return s.preferredClass === 'Defense' || !!s.preferredBuilding;
  }
  /** Recall Spell: the unit leaves the field and its card returns with the same health. */
  private recallUnit(b: Battle, u: Unit) {
    (u.native ??= {}).recalled = true;
    u.attacking = false;
    const roster = b.nativeHeroes?.find((hero) => hero.unitId === u.id);
    if (roster) {
      roster.unitId = null;
      roster.recalledHp = u.hp;
      const pet = b.units.find((other) => other.id === roster.petId);
      if (pet) {
        (pet.native ??= {}).recalled = true;
        roster.recalledPetHp = pet.hp;
        roster.petId = null;
      }
    } else if (u.hero && b.hero) {
      b.hero.unitId = null;
      b.hero.recalledHp = u.hp;
    } else if (TROOP_KEYS.includes(u.kind as TroopKind)) {
      const kind = u.kind as TroopKind;
      b.remaining[kind]++;
      if (!b.practice && !b.fixedArmy) this.state.army[kind]++;
      ((b.recalledHp ??= {})[kind] ??= []).push(u.hp);
    }
    this.onEffect({ type: 'spawn', x: u.x, y: u.y });
  }
  private beginFight() {
    const b = this.battle!;
    if (b.started) return;
    b.started = true;
    b.prep = 0;
  }
  step(dt: number) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    if (this.serverReadOnly) return;
    if (this.replay) {
      this.stepReplay(dt);
      return;
    }
    const b = this.battle;
    if (!b || b.finished) return;
    // A guide's opening words run their time while the player scouts.
    if (this.practiceGuide && !b.started) {
      this.practiceGuide.elapsed += dt;
      this.advanceGuide();
    }
    // Untimed campaign scouting changes no combat state and needs no replay frames.
    if (!timedBattle(b) && !b.started) return;
    // A Practice guide's step can hold the battle (frozen, or slowed) until the player acts.
    if (this.practiceGuide && b.started) {
      // A step just met (an ability used, a building down, time spent) releases the battle.
      this.advanceGuide();
      if (this.practiceGuide) {
        dt *= this.guideSpeed(b);
        if (dt <= 0) return;
        this.practiceGuide.elapsed += dt;
        this.advanceGuide();
      }
    }
    if (this.recording) {
      if (this.recording.steps.length >= MAX_REPLAY_STEPS || dt > 10 || dt < 0.000001) {
        this.recording = null;
        this.recordingLimitReached = true;
      } else this.recording.steps.push(dt);
    }
    if (!b.started) {
      // Scouting. The battle clock has not begun, but the countdown to it has.
      b.prep = Math.max(0, b.prep - dt);
      if (b.prep <= 0) {
        b.started = true;
        this.changed();
      }
      return;
    }
    // Practice and ladder matches have a deadline; campaign combat continues until resolved or ended.
    if (timedBattle(b)) dt = Math.min(dt, Math.max(0, BATTLE_SECONDS - b.elapsed));
    b.elapsed += dt;
    this.spawnHeroSummons();
    if (revealTeslas(b, this.onEffect, (u) => this.teslaDiverts(b, u))) this.changed();
    // One wall index per tick, shared by the native context and the legacy loop below.
    const shared = this.sharedWalls(b);
    const native = b.nativeRoster ? this.nativeContext(b, shared) : null;
    // Shared per-tick A* budget, spent by native units first and the legacy
    // loop after. Only enforced for large battles so small-battle determinism
    // (historical hashes) is unchanged.
    const pathBudget = b.units.length > 100 ? { count: 0, limit: 48 } : undefined;
    if (native && pathBudget) native.pathBudget = pathBudget;
    // Per-tick targetability for the native phase (same predicate the legacy
    // loop uses below). Built separately because statuses can change mid-tick
    // (Tesla reveals, fresh auras), and hp stays live at each use.
    const nativeUntargetable = new Set<number>();
    for (const v of b.buildings) {
      if (
        isTrap(v.kind) ||
        concealedTesla(b, v) ||
        lateBuildingHidden(b, v) ||
        buildingHidden(b, v)
      )
        nativeUntargetable.add(v.id);
    }
    if (native) native.isTargetable = (v) => v.hp > 0 && !nativeUntargetable.has(v.id);
    if (native && b.nativeHeroPassives)
      for (const hero of b.nativeHeroes ?? []) {
        const unit = b.units.find((u) => u.id === hero.unitId);
        if (unit) refreshHeroPassives(native, hero, unit);
      }
    const defenses: NativeDefenseContext | null = native
      ? {
          ...native,
          defenseScale:
            b.practice || b.catalog === 'goblin-v1' ? 1 : CAMPAIGN_LAYOUTS[b.index].defense,
        }
      : null;
    stepProjectiles(
      b,
      (target, power, at) => this.damage(target, power, at),
      this.onEffect,
      native
        ? (p) => (p.defense ? resolveDefenseImpact(native, p) : resolveNativeImpact(native, p))
        : undefined,
    );
    if (native) stepNativeBattle(native);
    this.stepLate('projectiles', dt);
    stepDeathBombs(b, this.onEffect);
    stepSpellAuras(b);
    this.stepLate('auras', dt);
    stepKingQuakes(b, (target, power, at) => this.damage(target, power, at), this.onEffect);
    prepareHealerTargets(b);
    stepSweepers(b, dt, this.onEffect);
    stepGarrisonReleases(b);
    stepDefenders(b, dt, this.onEffect);
    if (b.nativeContentExpansion) stepDefendingHeroes(b, dt, this.onEffect);
    if (native) stepGuardians(native, dt);
    // Concealed defenses cannot influence target selection or navigation.
    const gear = equipmentBonuses(b.hero?.equipment);
    const knownBuildings = b.buildings.filter(
      (v) => !concealedTesla(b, v) && !lateBuildingHidden(b, v),
    );
    // Late campaign Invisibility conceals targets, not obstacles: routes and crowd separation
    // still collide with concealed buildings. Without `late` this is the same list as before.
    const solidBuildings = b.late
      ? b.buildings.filter((v) => !concealedTesla(b, v))
      : knownBuildings;
    // A Clone Spell copy lives out its stated life and then goes, fought or not.
    for (const u of b.units)
      if (u.fadesAt !== undefined && u.hp > 0 && u.fadesAt <= b.elapsed) {
        u.hp = 0;
        u.defeatedAt = b.elapsed;
      }
    // Empty unless a Jump Spell is holding a ring open, so ordinary routing is unchanged.
    const breaches = openBreaches(b);
    if (native) {
      native.buildings = knownBuildings;
      native.buildingsById = new Map(knownBuildings.map((v) => [v.id, v]));
      native.wallTile = shared.wallTile;
      native.breaches = breaches;
    }
    if (defenses) defenses.buildings = knownBuildings;
    // Jump Spells change every ground route while active; the set changes only at cast/expiry.
    const passableWalls = native ? jumpWalls(b) : undefined;
    if (native) {
      native.passableWalls = passableWalls!;
      // Breach-free routing list for defender chases (mirrors the wall filter
      // the native building chase applies per search).
      native.routableBuildings = passableWalls!.size
        ? knownBuildings.filter((v) => v.kind !== 'wall' || !passableWalls!.has(v.id))
        : undefined;
      // Numeric version instead of joining every wall id into a string per tick; the change
      // itself is decided by comparing the sets, so two open-wall sets that hash alike can
      // never leave units on routes computed for the other.
      let jumpVersion = passableWalls!.size;
      for (const id of passableWalls!) jumpVersion = (jumpVersion * 31 + id) | 0;
      const seen = this.jumpWallsSeen.get(b);
      let sameWalls = seen
        ? seen.size === passableWalls!.size
        : (b.jumpVersion ?? 0) === 0 && !passableWalls!.size;
      if (sameWalls && seen)
        for (const id of passableWalls!)
          if (!seen.has(id)) {
            sameWalls = false;
            break;
          }
      if (!sameWalls) {
        this.jumpWallsSeen.set(b, new Set(passableWalls));
        b.jumpVersion = jumpVersion;
        b.jumpSignature = String(jumpVersion);
        for (const u of b.units) {
          if (TROOPS[u.kind].flying) continue;
          u.pathAt = 0;
        }
      }
    }
    // The legacy loop spends from the shared budget the native phase used first.
    const repathState = pathBudget ?? { count: 0, limit: Number.POSITIVE_INFINITY };
    // All-buildings scope (concealed included): distinct from the native maps above.
    const buildingById = new Map(b.buildings.map((v) => [v.id, v]));
    // Per-tick targetability for the non-hp reasons (trap, concealment, hiding).
    // hp is checked live at each use so mid-tick kills keep exact semantics.
    const untargetableStatus = new Set<number>();
    for (const v of b.buildings) {
      if (
        isTrap(v.kind) ||
        concealedTesla(b, v) ||
        lateBuildingHidden(b, v) ||
        buildingHidden(b, v)
      )
        untargetableStatus.add(v.id);
    }
    const isTargetableLive = (v: Building) => v.hp > 0 && !untargetableStatus.has(v.id);
    // Wall-by-tile index shared with the native context above; hp verified live at each hit.
    const wallTile = shared.wallTile;
    // Memoize unit stats by kind+level for the tick.
    const statsCache = new Map<string, Map<number, ReturnType<GameModel['unitStats']>>>();
    const routeBuildings = passableWalls?.size
      ? solidBuildings.filter((v) => !passableWalls.has(v.id))
      : solidBuildings;
    // Hero base stats are constant within a tick: compute once, not per unit.
    const heroBaseStats = b.hero
      ? heroStats(b.hero.level, b.hero.townhall, b.hero.equipment)
      : null;
    const rageSpellStats = this.spellStats('rage');
    for (const u of b.units) {
      if (u.hp <= 0 || u.native?.recalled) continue;
      const unitDt = Math.min(dt, Math.max(0, b.elapsed - (u.spawnedAt ?? 0)));
      if (!unitDt) continue;
      const shrunkDt = shrinkStepTime(u, b.elapsed, unitDt);
      if (u.shrink) u.shrink.timeLost += unitDt - shrunkDt;
      if (stepAirPush(u, unitDt)) continue;
      if ((u.springUntil ?? 0) > b.elapsed) {
        u.attacking = false;
        continue;
      }
      // Frozen, stunned and ice-blocked legacy troops pause; native units resolve their own timers.
      if (native && u.native && unitFrozen(u, b.elapsed) && !nativeBehavior(b, u.kind)) {
        u.attacking = false;
        continue;
      }
      if (lateUnitHeld(b, u)) {
        u.attacking = false;
        continue;
      }
      // Late status effects scale attack timers and movement separately (Poison: 25% / 35%).
      const lateScale = lateUnitTimeScale(b, u);
      const actionDt = lateScale === 1 ? shrunkDt : shrunkDt * lateScale;
      const lateMove = lateUnitMoveScale(b, u);
      const moveDt = lateMove === 1 ? shrunkDt : shrunkDt * lateMove;
      // Garrison Headhunter poison slows movement and attack timers by separate source percentages.
      const poison = garrisonUnitScales(b, u);
      const troop = TROOPS[u.kind];
      const abilityRage =
        (u.rageUntil ?? 0) > b.elapsed || !!(u.hero && b.hero && b.hero.rageUntil > b.elapsed);
      const spellRage = (u.spellRageUntil ?? 0) > b.elapsed ? rageSpellStats : null;
      const heroScale = u.hero ? RAGE_HERO_MULTIPLIER : 1;
      u.cooldown -= poison.attack === 1 ? actionDt : actionDt * poison.attack;
      u.pathAt -= unitDt;
      u.attacking = false;
      // Memoize stats by kind+level for the tick instead of recomputing per unit.
      // Only hero/pet units can resolve to per-unit stats (the heroOf/petOwner id
      // lookup); unit ids are unique, so no other unit can hit that branch. The
      // old key scoped by id whenever the battle had a hero roster (u.id is
      // always defined, and even an empty nativeHeroes array is truthy), so it
      // never hit.
      const perUnitStats = !!u.hero || isHeroUnitKind(u.kind) || isPetUnitKind(u.kind);
      // Per-unit stats are read once per tick (each unit steps once), so they skip the memo;
      // shared rows are keyed by kind, then level, without building a string per unit.
      let unitBase: ReturnType<GameModel['unitStats']> | undefined;
      if (perUnitStats) unitBase = this.unitStats(u);
      else {
        const level =
          u.level ??
          b.troopLevels?.[u.kind as TroopKind] ??
          this.state.troopLevels?.[u.kind as TroopKind] ??
          1;
        let byLevel = statsCache.get(u.kind);
        if (!byLevel) statsCache.set(u.kind, (byLevel = new Map()));
        unitBase = byLevel.get(level);
        if (!unitBase) {
          unitBase = this.unitStats(u);
          byLevel.set(level, unitBase);
        }
      }
      const base =
        u.hero && b.hero && heroBaseStats
          ? {
              ...unitBase,
              ...heroBaseStats,
            }
          : unitBase;
      const heal =
        base.heal === undefined ? undefined : base.heal * (1 + (spellRage?.damageBoost ?? 0) / 100);
      const damage =
        base.damage *
        Math.max(
          abilityRage ? (u.hero ? gear.damage : gear.summonDamage) : 1,
          1 + ((spellRage?.damageBoost ?? 0) / 100) * heroScale,
          u.native ? unitDamageScale(u, b.elapsed) : 1,
        );
      // A late campaign vortex carries this attacker: it may attack in range but never moves itself.
      const speed = lateUnitRooted(b, u)
        ? 0
        : (base.speed +
            Math.max(
              abilityRage ? (u.hero ? gear.speedBoost : gear.summonSpeedBoost) : 0,
              ((spellRage?.speedBoost ?? 0) / SPELL_SPEED_SCALE) * heroScale,
              u.native ? unitSpeedBonus(u, b.elapsed) : 0,
            )) *
          ((poison.move === 1 ? moveDt : moveDt * poison.move) / unitDt) *
          (u.native ? unitSpeedScale(u, b.elapsed) : 1);
      if (native && nativeBehavior(b, u.kind)) {
        // Native rules read only the boosted damage, speed and heal: no copy of the stats row.
        stepNativeUnit(native, u, { damage, speed, heal }, unitDt);
        continue;
      }
      const d = { ...base, heal, damage, speed };
      if (troop.healer) {
        stepHealer(b, u, d, unitDt, this.onEffect);
        continue;
      }
      if (
        stepAttackerVsDefenders(
          b,
          u,
          d,
          unitDt,
          solidBuildings,
          (target, power) => this.damage(target, power),
          this.onEffect,
          undefined,
          isTargetableLive,
          {
            buildings: routeBuildings,
            wallTile,
            passableWalls,
            budget: repathState,
            breaches,
          },
        )
      )
        continue;
      let target = typeof u.target === 'number' ? buildingById.get(u.target) : undefined;
      if (!target || !isTargetableLive(target)) target = undefined;
      if (!target) {
        // Min-scan instead of filter-sort over the whole building list.
        let best: (typeof b.buildings)[number] | undefined;
        let bestPreferred: (typeof b.buildings)[number] | undefined;
        let bestPreferredDist = Infinity;
        let bestDist = Infinity;
        const angry = (u.native?.angryUntil ?? 0) > b.elapsed && !troop.healer;
        for (const v of knownBuildings) {
          if (v.kind === 'wall' || !isTargetableLive(v)) continue;
          const dTo = distanceTo(u, v);
          if (dTo < bestDist) {
            bestDist = dTo;
            best = v;
          }
          const preferredMatch =
            troop.prefersResources && !angry
              ? isResourceBuilding(v.kind) && v.npc !== 'goblin-castle'
              : troop.prefersDefenses || angry
                ? (activeAsDefense(b, v) && v.npc !== 'tutorial-cannon') ||
                  lateActivatedDefense(b, v)
                : true;
          if (preferredMatch && dTo < bestPreferredDist) {
            bestPreferredDist = dTo;
            bestPreferred = v;
          }
        }
        target =
          (troop.wallBreaker ? breachTarget(u, knownBuildings, !!b.nativeSubtiles) : undefined) ??
          bestPreferred ??
          best;
        if (!target) continue;
        u.target = target.id;
        u.path = [];
        u.pathAt = 0;
      }
      const distance = distanceTo(u, target);
      if (distance <= d.range) {
        u.attacking = true;
        if (u.cooldown <= 0) {
          u.cooldown = d.rate;
          if (troop.wallBreaker) {
            this.detonate(u, d.damage + (base.deathDamage ?? 0));
            continue;
          }
          const damage =
            d.damage * (troop.prefersResources && isResourceBuilding(target.kind) ? 2 : 1);
          if (u.kind === 'dragon') {
            const size = BUILDINGS[target.kind].size;
            const aim = {
              x: Math.max(target.x, Math.min(u.x, target.x + size)),
              y: Math.max(target.y, Math.min(u.y, target.y + size)),
            };
            this.damage(target, damage);
            damageDefenders(b, aim, damage, troop.splash ?? 0, 'ground');
            for (const other of b.buildings)
              if (
                other.id !== target.id &&
                other.hp > 0 &&
                !isTrap(other.kind) &&
                distanceTo(aim, other) <= (troop.splash ?? 0)
              )
                this.damage(other, damage);
            this.onEffect({
              type: 'breath',
              x: u.x,
              y: u.y,
              toX: aim.x,
              toY: aim.y,
              fromAir: true,
              sourceId: u.id,
              targetId: target.id,
              targetBuilding: true,
            });
          } else if (d.range > 2 || troop.flying) {
            launchProjectile(
              b,
              {
                weapon: troop.flying ? 'bomb' : u.kind === 'wizard' ? 'fireball' : 'arrow',
                sourceId: u.id,
                targetId: target.id,
                targetBuilding: true,
                fromX: u.x,
                fromY: u.y,
                x: target.x + BUILDINGS[target.kind].size / 2,
                y: target.y + BUILDINGS[target.kind].size / 2,
                fromAir: troop.flying,
                damage,
                splash: troop.splash,
              },
              this.onEffect,
            );
          } else {
            this.damage(target, damage);
            this.onEffect({
              type: 'hit',
              x: u.x,
              y: u.y,
              toX: target.x + BUILDINGS[target.kind].size / 2,
              toY: target.y + BUILDINGS[target.kind].size / 2,
              sourceId: u.id,
              targetId: target.id,
              targetBuilding: true,
            });
          }
        }
        continue;
      }
      if (troop.flying || troop.wallJumper) {
        // Flying and wall-jumping units move directly while retaining their target layer.
        const cx = Math.max(target.x, Math.min(u.x, target.x + BUILDINGS[target.kind].size)),
          cy = Math.max(target.y, Math.min(u.y, target.y + BUILDINGS[target.kind].size));
        const dx = cx - u.x,
          dy = cy - u.y,
          len = distance2D(dx, dy) || 1,
          move = Math.min(d.speed * unitDt, len);
        u.x += (dx / len) * move;
        u.y += (dy / len) * move;
        continue;
      }
      if (!u.path.length || u.pathAt <= 0) {
        // Per-tick A* budget: defer overflow to the next tick instead of spiking.
        if (repathState.count >= repathState.limit) {
          u.pathAt = Math.min(Math.max(u.pathAt, 0.05), 0.15);
        } else {
          repathState.count++;
          u.path = findPath(u, target, routeBuildings, d.range, !!b.nativeSubtiles, breaches);
          u.pathAt = 1.5;
        }
      }
      const next = u.path[0];
      if (next) {
        const hit = wallTile.get(Math.floor(next.y) * MAP_SIZE + Math.floor(next.x));
        const wall = hit && hit.hp > 0 && !passableWalls?.has(hit.id) ? hit : undefined;
        if (wall && distanceTo(u, wall) <= d.range) {
          u.attacking = true;
          if (u.cooldown <= 0) {
            u.cooldown = d.rate;
            if (troop.wallBreaker) {
              this.detonate(u, d.damage + (base.deathDamage ?? 0));
              continue;
            }
            if (d.range > 2)
              launchProjectile(
                b,
                {
                  weapon: u.kind === 'wizard' ? 'fireball' : 'arrow',
                  sourceId: u.id,
                  targetId: wall.id,
                  targetBuilding: true,
                  fromX: u.x,
                  fromY: u.y,
                  x: wall.x + 0.5,
                  y: wall.y + 0.5,
                  damage: d.damage,
                },
                this.onEffect,
              );
            else {
              this.damage(wall, d.damage);
              this.onEffect({ type: 'hit', x: wall.x + 0.5, y: wall.y + 0.5 });
            }
          }
          continue;
        }
        if (b.nativeSubtiles) {
          // Half-tile waypoints: carry unused travel past each one, stopping before a wall.
          let travel = d.speed * unitDt;
          while (travel > 0 && u.path.length) {
            const point = u.path[0];
            const walledTile = wallTile.get(Math.floor(point.y) * MAP_SIZE + Math.floor(point.x));
            const walled = !!walledTile && walledTile.hp > 0;
            if (point !== next && walled) break;
            // Crowd separation can push a unit past a half-tile waypoint. Walking back to it
            // stalls whole crowds, so a non-wall waypoint the unit already passed along the
            // following leg is dropped while the unit stays within half a sub-tile of that leg.
            const after = u.path[1];
            if (after && !walled) {
              const lx = after.x - point.x,
                ly = after.y - point.y,
                leg = distance2D(lx, ly) || 1,
                ahead = ((u.x - point.x) * lx + (u.y - point.y) * ly) / leg,
                aside = Math.abs((u.x - point.x) * ly - (u.y - point.y) * lx) / leg;
              if (ahead > 0 && aside <= 0.25) {
                u.path.shift();
                continue;
              }
            }
            const dx = point.x - u.x,
              dy = point.y - u.y,
              len = distance2D(dx, dy);
            if (len <= travel) {
              u.x = point.x;
              u.y = point.y;
              u.path.shift();
              travel -= len;
            } else {
              u.x += (dx / len) * travel;
              u.y += (dy / len) * travel;
              travel = 0;
            }
          }
          continue;
        }
        const dx = next.x - u.x,
          dy = next.y - u.y,
          len = distance2D(dx, dy),
          move = d.speed * unitDt;
        if (len <= move) {
          u.x = next.x;
          u.y = next.y;
          u.path.shift();
        } else {
          u.x += (dx / len) * move;
          u.y += (dy / len) * move;
        }
      }
    }
    separateUnits(
      b.units,
      solidBuildings,
      !!b.nativeSubtiles,
      b.separationCap ? SEPARATION_TILES_PER_SECOND * dt : undefined,
    );
    if (revealTeslas(b, this.onEffect, (u) => this.teslaDiverts(b, u))) this.changed();
    // A sprung trap only restyles itself and the HUD's live counters: a passive change, so
    // the scene skips the full building restyle (and the HUD its rebuild) a busy battle
    // would otherwise pay several times a second.
    if (stepTraps(b, dt, this.onEffect)) this.changed(true);
    this.stepLate('traps', dt);
    stepMortarShells(b, this.onEffect);
    stepInfernos(b, dt);
    // Unit visibility is fixed for the defense phase (only hp changes below).
    const hiddenUnits = new Set<number>();
    for (const u of b.units) if (untargetable(b, u)) hiddenUnits.add(u.id);
    for (const tower of b.buildings) {
      if (defenses && nativeDefense(b, tower)) {
        stepNativeDefense(defenses, tower, dt);
        continue;
      }
      if (tower.kind === 'inferno') continue;
      const d = BUILDINGS[tower.kind];
      const canAct = b.nativeRoster
        ? tower.hp > 0 && !concealedTesla(b, tower) && !buildingImmune(b, tower)
        : targetableBuilding(b, tower);
      // Version 51: a Rage Spell Tower boosts damage; frost and chill slow the attack clock.
      // One engine boosts a tower, never both: the native rules own a version 51 home defense,
      // and the late campaign families keep their own defensive Rage.
      const nativeBoost = b.nativeRoster && !b.late ? buildingDamageScale(b, tower, b.elapsed) : 1;
      // Supercharged DPS (client mini levels) exists only in version 51 battles.
      const charged = b.nativeRoster ? superchargeBonus(tower.kind, tower.supercharge).dps : 0;
      const tempo = b.nativeRoster ? 1 / buildingAttackIntervalScale(b, tower, b.elapsed) : 1;
      if (tower.kind === 'archertower' && b.archerTowerWindups) {
        stepArcherTower(
          b,
          tower,
          dt,
          canAct && presentBuilding(b, tower),
          defenseDamage(tower.kind, tower.level) *
            (b.practice || b.catalog === 'goblin-v1' ? 1 : CAMPAIGN_LAYOUTS[b.index].defense) *
            // Defensive Rage (version 44 late campaign only; exactly one otherwise).
            (b.late ? lateDefenseBoost(b, tower).damage : 1) *
            nativeBoost,
          this.onEffect,
        );
        continue;
      }
      if (
        !d.damage ||
        !canAct ||
        !presentBuilding(b, tower) ||
        tower.constructing ||
        tower.upgradeEnd
      )
        continue;
      const activeDt =
        Math.min(dt, Math.max(0, b.elapsed - (b.defenseStuns[tower.id] ?? 0))) * tempo;
      if (activeDt <= 0) continue;
      if (tower.kind === 'xbow') {
        stepXbow(
          b,
          tower,
          activeDt,
          (defenseDamage(tower.kind, tower.level) + charged * 0.128) *
            (b.practice || b.catalog === 'goblin-v1' ? 1 : CAMPAIGN_LAYOUTS[b.index].defense) *
            (b.late ? lateDefenseBoost(b, tower).damage : 1) *
            nativeBoost,
          this.onEffect,
        );
        continue;
      }
      const cooling = tower.cooldown > 0;
      // Defensive Rage from late campaign Spell Towers; exactly one without an active cast.
      const boost = b.late ? lateDefenseBoost(b, tower) : { damage: 1, rate: 1 };
      tower.cooldown -= boost.rate === 1 ? activeDt : activeDt * boost.rate;
      if (tower.cooldown > 0) continue;
      const center = { x: tower.x + d.size / 2, y: tower.y + d.size / 2 };
      // Min-scan with the old sort's winner (distance, then smaller unit id).
      const range = d.range!;
      const minRange = d.minRange ?? 0;
      const stickyId = b.defenseTargets[tower.id];
      let sticky: (typeof b.units)[number] | undefined;
      let best: (typeof b.units)[number] | undefined;
      let bestDist = Infinity;
      for (const u of b.units) {
        if (u.hp <= 0 || hiddenUnits.has(u.id) || !canTarget(d.targets, u.kind)) continue;
        const dist = distance2D(u.x - center.x, u.y - center.y);
        if (dist > range || dist < minRange) continue;
        if (u.id === stickyId) sticky = u;
        if (best === undefined || dist < bestDist || (dist === bestDist && u.id < best.id)) {
          best = u;
          bestDist = dist;
        }
      }
      // Keep firing at the same eligible target until it dies or leaves range.
      const target = sticky ?? best;
      if (target) {
        b.defenseTargets[tower.id] = target.id;
        // Carry the fraction of a frame past the deadline, so sustained fire
        // does not lose time every shot. Idle towers never accumulate a burst.
        tower.cooldown = Math.max(0, d.rate! + (cooling ? tower.cooldown : 0));
        const basePower =
          tower.npc === 'tutorial-cannon'
            ? TUTORIAL_CANNON_DAMAGE
            : (defenseDamage(tower.kind, tower.level) + charged * d.rate!) *
              (b.practice || b.catalog === 'goblin-v1' ? 1 : CAMPAIGN_LAYOUTS[b.index].defense) *
              nativeBoost;
        const power = boost.damage === 1 ? basePower : basePower * boost.damage;
        if (tower.kind === 'tesla') {
          hurtUnit(b, target, power);
          recordTeslaShot(b, tower, target);
          this.onEffect({
            type: 'tesla-zap',
            sourceId: tower.id,
            targetId: target.id,
            x: center.x,
            y: center.y,
            toX: target.x,
            toY: target.y,
            toAir: TROOPS[target.kind].flying,
          });
          continue;
        }
        if (tower.kind === 'mortar') {
          launchMortarShell(b, tower, target, power, this.onEffect);
          continue;
        }
        const projectile = launchProjectile(
          b,
          {
            fromX: center.x,
            fromY: center.y,
            x: target.x,
            y: target.y,
            damage: power,
            splash: d.splash,
            toAir: TROOPS[target.kind].flying,
            weapon:
              tower.kind === 'bombtower'
                ? 'towerbomb'
                : tower.kind === 'airdefense'
                  ? 'rocket'
                  : tower.kind === 'archertower'
                    ? 'arrow'
                    : tower.kind === 'wizardtower'
                      ? 'arcane'
                      : 'cannonball',
            ...(tower.kind === 'cannon' && !tower.npc && !b.legacyCannonFlight
              ? { variant: tower.level }
              : {}),
            ...(tower.kind === 'archertower' && b.nativeArcherTowers
              ? { variant: tower.level }
              : {}),
            ...(tower.kind === 'wizardtower'
              ? { variant: wizardTowerProjectileTier(tower.level) }
              : {}),
            sourceId: tower.id,
            targetId: target.id,
            targetBuilding: false,
          },
          this.onEffect,
        );
        if (tower.kind === 'archertower' && b.nativeArcherTowers)
          recordArcherTowerShot(b, tower, projectile);
        if (tower.kind === 'cannon' && !tower.npc) recordCannonShot(b, tower, projectile);
        if (tower.kind === 'bombtower') recordBombTowerShot(b, tower, projectile);
        if (tower.kind === 'wizardtower') recordWizardTowerShot(b, tower, projectile);
      }
    }
    this.stepLate('defenses', dt);
    if (native) stepPiercingShots(native);
    if (native && b.nativeHeroes)
      for (const hero of b.nativeHeroes) {
        const unit = b.units.find((u) => u.id === hero.unitId);
        if (!unit) continue;
        // A knocked-out hero fires its ability automatically (SimulatePlayerInputOnDeath).
        if (unit.hp <= 0 && !unit.spent && !hero.abilityUsed)
          this.activateNativeHeroAbility(hero.kind, true);
        // Waves stop when the hero falls; the automatic activation above still fires once.
        if (unit.hp > 0)
          stepHeroAbilities(
            {
              ...native,
              spawn: (k, level, x, y, at, owner) =>
                spawnNativeUnit(native, k, level, x, y, at, owner),
            },
            hero,
            unit,
            b.townhall ?? this.townhallLevel,
          );
      }
    const king = b.units.find((u) => u.hero);
    if (king && !king.spent && king.hp <= 0 && b.hero && !b.hero.abilityUsed)
      this.activateHeroAbility(true);
    for (const u of b.units) {
      if (u.hp > 0) continue;
      u.defeatedAt ??= b.elapsed;
      // Nothing routes a fallen unit (a revived hero gets a fresh path), so its waypoints only
      // weighed down every keyframe clone and save of the battle.
      if (b.dropFallenPaths && u.path.length) u.path = [];
      if (u.spent) continue;
      u.spent = true;
      if (native && nativeBehavior(b, u.kind)) {
        resolveNativeDeath(native, u);
        continue;
      }
      const troop = this.unitStats(u);
      if (!troop.deathDamage) continue;
      if (troop.wallBreaker) {
        this.detonate(u, troop.deathDamage);
        continue;
      }
      this.onEffect({
        type: 'blast',
        x: u.x,
        y: u.y,
        radius: troop.deathRadius,
      });
      for (const v of b.buildings)
        if (v.hp > 0 && distanceTo(u, v) <= (troop.deathRadius ?? 1.5))
          this.damage(v, troop.deathDamage);
      damageDefenders(b, u, troop.deathDamage, troop.deathRadius ?? 1.5);
    }
    if (native && b.units.some((u) => u.native?.recalled))
      b.units = b.units.filter((u) => !u.native?.recalled);
    this.refreshBattleScore();
    const stalled = b.stalledSupportEnds ? this.trackBattleProgress(b) : false;
    if (
      b.destruction === 100 ||
      (timedBattle(b) && b.elapsed >= BATTLE_SECONDS) ||
      (!b.shells.length &&
        !b.projectiles?.some((p) => p.weapon !== 'healing') &&
        !Object.values(b.deathBombs ?? {}).some((bomb) => !bomb.resolved && !bomb.cancelled) &&
        !lateCampaignPending(b) &&
        !b.units.some(
          (u) => u.hp > 0 && !this.supportOnly(b, u.kind) && !(stalled && summonedUnit(u)),
        ) &&
        !b.nativeDeaths?.some((blast) => !blast.resolved) &&
        !b.nativeChains?.length &&
        !b.nativePendingSpawns?.length &&
        !b.nativeSpells?.some((cast) => nativeSpellCanStillFight(cast)) &&
        !TROOP_KEYS.some(
          (k) => b.remaining[k] > 0 && !(isSiege(k) && b.siegeDeployed) && !this.supportOnly(b, k),
        ) &&
        !b.spells.lightning &&
        !(b.nativeRoster && FIGHTING_SPELLS.some((k) => (b.spells[k] ?? 0) > 0)) &&
        !(b.hero && b.hero.unitId === null) &&
        !b.nativeHeroes?.some((hero) => hero.unitId === null))
    )
      this.finishBattle();
  }
  /**
   * Version 54 stall clock: remembers when any building (walls and traps aside) or defender
   * last lost hit points. True once that is STALLED_BATTLE_SECONDS ago.
   */
  private trackBattleProgress(b: Battle) {
    let hp = 0;
    for (const v of b.buildings) if (v.kind !== 'wall' && !isTrap(v.kind)) hp += Math.max(0, v.hp);
    for (const d of b.defenders ?? []) hp += Math.max(0, d.hp);
    if (b.progressHp === undefined || hp < b.progressHp) b.progressAt = b.elapsed;
    b.progressHp = hp;
    return b.elapsed - (b.progressAt ?? 0) >= STALLED_BATTLE_SECONDS;
  }
  /** Late campaign families run at fixed points in each simulation step. */
  private stepLate(phase: LatePhase, dt: number) {
    const battle = this.battle;
    if (!battle?.late) return;
    stepLateCampaign({
      battle,
      dt,
      phase,
      effect: this.onEffect,
      damageBuilding: (target, power, at) => this.damage(target, power, at),
    });
  }
  /** Recompute destruction, stars and loot from the buildings' current health. */
  refreshBattleScore() {
    const b = this.battle!;
    // Single walk instead of re-walking buildings ~8 times per tick.
    let total = 0;
    let dead = 0;
    let townHallDead = false;
    for (const v of b.buildings) {
      if (v.kind === 'wall' || isTrap(v.kind)) continue;
      total++;
      if (v.hp <= 0) {
        dead++;
        if (v.kind === 'townhall') townHallDead = true;
      }
    }
    b.destruction = total ? Math.floor((dead / total) * 100) : 100;
    b.stars = Number(b.destruction >= 50) + Number(townHallDead) + Number(b.destruction === 100);
    if (revealTeslas(b, this.onEffect, (u) => this.teslaDiverts(b, u))) this.changed();
    if (b.practice) {
      b.loot = { gold: 0, elixir: 0 };
      return;
    }
    // Each resource building pays out as it is damaged. Storages hold four
    // shares, collectors one, and the Town Hall two of each resource.
    const available = b.availableLoot ?? campaignResources(campaignStage(b.index, b.catalog));
    for (const resource of campaignResourceKeys(available)) {
      const storage =
        resource === 'gold'
          ? 'goldstorage'
          : resource === 'elixir'
            ? 'elixirstorage'
            : 'darkstorage';
      const weight = (v: Building) =>
        b.catalog === 'goblin-v1'
          ? Number(v.kind === 'townhall' || v.kind === storage)
          : v.kind === 'townhall'
            ? 2
            : v.kind === storage
              ? 4
              : v.kind ===
                  (resource === 'gold'
                    ? 'goldmine'
                    : resource === 'elixir'
                      ? 'collector'
                      : 'darkdrill')
                ? 1
                : 0;
      let weightTotal = 0;
      let weightTaken = 0;
      for (const v of b.buildings) {
        if (v.kind === 'wall' || isTrap(v.kind)) continue;
        const w = weight(v);
        if (!w) continue;
        weightTotal += w;
        weightTaken += w * (1 - Math.max(0, lateLootHitpoints(b, v)) / v.maxHp);
      }
      const taken = weightTotal ? weightTaken / weightTotal : dead / Math.max(1, total);
      const removed = Math.floor(
        campaignAmount(available, resource) * Math.min(1, Math.max(0, taken)),
      );
      b.lootTaken ??= { gold: 0, elixir: 0 };
      b.lootTaken[resource] = removed;
      b.loot[resource] = Math.min(removed, b.lootRoom?.[resource] ?? Infinity);
    }
  }
  private detonate(u: Unit, power: number) {
    u.hp = 0;
    u.spent = true;
    const radius = TROOPS[u.kind].deathRadius ?? 1.6;
    this.onEffect({ type: 'blast', x: u.x, y: u.y, radius });
    if (this.battle) damageDefenders(this.battle, u, power, radius);
    for (const building of this.battle?.buildings ?? [])
      if (building.hp > 0 && distanceTo(u, building) <= radius)
        this.damage(building, power * (building.kind === 'wall' ? 40 : 1));
  }
  damage(b: Building, n: number, at = this.battle?.elapsed ?? 0, spell = false) {
    if (b.hp <= 0 || isTrap(b.kind) || (this.battle && concealedTesla(this.battle, b))) return;
    if (this.battle?.buildingEffects && buildingImmune(this.battle, b, at)) return;
    if (this.battle?.nativeRoster && n > 0) noteBuildingDamage(this.battle, b, at, spell);
    b.hp -= n;
    if (b.hp <= 0) {
      b.hp = 0;
      if (b.kind === 'archertower' && this.battle?.nativeArcherTowers)
        (this.battle.archerTowerDestructions ??= {})[b.id] ??= {
          at,
          x: b.x + 1.5,
          y: b.y + 1.5,
          level: b.level,
        };
      if (b.kind === 'darkdrill' && this.battle?.drillDestructions)
        this.battle.drillDestructions[b.id] ??= { at, x: b.x + 1.5, y: b.y + 1.5, level: b.level };
      const tesla = b.kind === 'tesla' ? this.battle?.teslas?.[b.id] : undefined;
      if (tesla) tesla.destroyedAt = at;
      if (this.battle?.late)
        lateBuildingDestroyed(
          {
            battle: this.battle,
            dt: 0,
            phase: 'defenses',
            effect: this.onEffect,
            damageBuilding: (target, power, time) => this.damage(target, power, time),
          },
          b,
          at,
        );
      if (this.battle && b.kind === 'wizardtower') recordWizardTowerDestroyed(this.battle, b, at);
      if (this.battle && b.kind === 'airsweeper') recordSweeperDestroyed(this.battle, b, at);
      if (this.battle && b.kind === 'mortar') recordMortarDestroyed(this.battle, b, at);
      if (this.battle && b.kind === 'cannon' && !b.npc) recordCannonDestroyed(this.battle, b, at);
      if (this.battle && b.kind === 'bombtower') {
        recordBombTowerDestroyed(this.battle, b, at);
        primeDeathBomb(
          this.battle,
          b,
          bombTowerDeathDamage(b.level) *
            (this.battle.practice || this.battle.catalog === 'goblin-v1'
              ? 1
              : CAMPAIGN_LAYOUTS[this.battle.index].defense),
          at,
        );
      }
      this.onEffect({
        type: 'destroy',
        ...(b.kind === 'archertower' && this.battle?.nativeArcherTowers ? { sourceId: b.id } : {}),
        ...(b.kind === 'darkdrill' && this.battle?.drillDestructions ? { sourceId: b.id } : {}),
        ...(b.kind === 'bombtower' ? { sourceId: b.id, weapon: 'towerbomb' as const } : {}),
        ...(b.kind === 'wizardtower' ? { sourceId: b.id, weapon: 'arcane' as const } : {}),
        ...(['airsweeper', 'mortar'].includes(b.kind) || (b.kind === 'cannon' && !b.npc)
          ? { sourceId: b.id }
          : {}),
        x: b.x + BUILDINGS[b.kind].size / 2,
        y: b.y + BUILDINGS[b.kind].size / 2,
        major: b.kind === 'townhall',
      });
      // Selective re-path for large battles only; small battles keep the
      // original mass invalidation so historical hashes are unchanged. Large
      // battles skip unaffected units (their recomputed route would usually
      // match) and rely on the per-tick A* budget to spread genuine spikes.
      if (this.battle) {
        if (this.battle.units.length > 100) {
          const size = BUILDINGS[b.kind].size;
          const x0 = b.x - 1;
          const y0 = b.y - 1;
          const x1 = b.x + size + 1;
          const y1 = b.y + size + 1;
          for (const u of this.battle.units) {
            if (TROOPS[u.kind].flying) continue;
            if (u.target !== b.id && u.defenderTarget === undefined) {
              const crosses = u.path?.some((p) => p.x >= x0 && p.x < x1 && p.y >= y0 && p.y < y1);
              if (!crosses) continue;
            }
            u.pathAt = 0;
          }
        } else {
          for (const u of this.battle.units) {
            u.pathAt = 0;
          }
        }
      }
    }
  }
  finishBattle() {
    if (this.replay) return;
    const b = this.battle;
    if (!b || b.finished) return;
    this.recordAction({ type: 'end' });
    this.refreshBattleScore();
    b.finished = true;
    this.practiceGuide = null;
    b.projectiles = [];
    b.shells = [];
    for (const bomb of Object.values(b.deathBombs ?? {})) if (!bomb.resolved) bomb.cancelled = true;
    const trophies = b.ladder ? ladderTrophies(b.ladder, b.stars) : 0;
    const overflow = (gold: number, elixir: number, dark = 0) => {
      const lost = {
        gold: Math.max(0, (b.lootTaken?.gold ?? 0) - gold),
        elixir: Math.max(0, (b.lootTaken?.elixir ?? 0) - elixir),
        ...(b.loot.dark !== undefined
          ? { dark: Math.max(0, (b.lootTaken?.dark ?? 0) - dark) }
          : {}),
      };
      return lost.gold || lost.elixir || lost.dark ? { lostLoot: lost } : {};
    };
    // A playback runner reproduces the recorded result without applying a
    // second village's storage limits or producing rewards/history of its own.
    if (!this.recordBattles) {
      b.result = {
        gold: b.loot.gold,
        elixir: b.loot.elixir,
        ...(b.loot.dark !== undefined ? { dark: b.loot.dark } : {}),
        ...overflow(b.loot.gold, b.loot.elixir, b.loot.dark),
        trophies,
        stars: b.stars,
        destruction: b.destruction,
      };
      this.changed();
      return;
    }
    const gold = b.practice
        ? 0
        : Math.max(0, Math.min(b.loot.gold, this.resourceCap('gold') - this.state.gold)),
      elixir = b.practice
        ? 0
        : Math.max(0, Math.min(b.loot.elixir, this.resourceCap('elixir') - this.state.elixir)),
      dark = b.practice
        ? 0
        : Math.max(0, Math.min(b.loot.dark ?? 0, this.resourceCap('dark') - this.state.dark));
    this.state.gold += gold;
    this.state.elixir += elixir;
    this.state.dark += dark;
    if (b.ladder) this.state.trophies = Math.max(0, this.state.trophies + trophies);
    if (!b.practice && !b.ladder) {
      if (b.catalog === 'goblin-v1') this.state.nativeCampaign ??= freshNativeCampaign();
      else this.state.campaignLoot ??= freshCampaignLoot();
      const remaining =
        b.catalog === 'goblin-v1'
          ? this.state.nativeCampaign!.remaining[b.index]
          : this.state.campaignLoot!.remaining[b.index];
      for (const k of campaignResourceKeys(b.loot))
        remaining[k] = Math.max(0, (remaining[k] ?? 0) - (b.lootTaken?.[k] ?? 0));
      const stars = b.catalog === 'goblin-v1' ? this.state.nativeCampaign!.stars : this.state.stars;
      stars[b.index] = Math.max(stars[b.index] ?? 0, b.stars);
    }
    if (!b.practice) {
      this.state.stats.raids++;
      if (b.stars > 0) this.state.stats.wins = (this.state.stats.wins ?? 0) + 1;
      this.state.stats.destroyed += b.buildings.filter(
        (v) => v.hp <= 0 && v.kind !== 'wall' && !isTrap(v.kind),
      ).length;
      // The original pays experience for the Town Hall alone: one point per level destroyed.
      const hall = b.buildings.find((v) => v.kind === 'townhall' && v.hp <= 0);
      if (hall) this.gainXp(hall.level);
      this.countAchievements('loot', (a) => b.lootTaken?.[LOOT_RESOURCES[a.data!]] ?? 0);
      // Ladder matches stand in for the original's multiplayer battles.
      if (b.ladder) {
        if (b.stars > 0) this.countAchievements('win_pvp_attack');
        const ruins = b.buildings.filter((v) => v.hp <= 0 && !isTrap(v.kind));
        this.countAchievements('destroy', (a) => ruins.filter((v) => destroyCounts(a, v)).length);
        const best = achievementById('victory_points');
        if (best) {
          const counts = (this.state.achievements ??= emptyAchievements()).counts;
          counts[best.id] = Math.max(counts[best.id] ?? 0, this.state.trophies);
        }
      }
      if (b.catalog === 'goblin-v1')
        this.countAchievements('slay', (a) =>
          (b.defenders ?? []).some((d) => d.kind === SLAIN_KINDS[a.data!] && d.hp <= 0) &&
          !(this.state.achievements?.counts[a.id] ?? 0)
            ? 1
            : 0,
        );
      // Stars bank toward the daily bonus and are allowed to overflow past its price.
      if (b.stars > 0) {
        const bonus = (this.state.starBonus ??= emptyStarBonus());
        bonus.stars += b.stars;
      }
    }
    b.result = {
      gold,
      elixir,
      ...(b.loot.dark !== undefined ? { dark } : {}),
      ...overflow(gold, elixir, dark),
      trophies,
      stars: b.stars,
      destruction: b.destruction,
    };
    const deployed = emptyArmy(),
      spells = emptySpells();
    for (const k of TROOP_KEYS) deployed[k] = b.carriedArmy[k] - b.remaining[k];
    for (const k of SPELL_KEYS) spells[k] = b.carried[k] - b.spells[k];
    if (!b.practice) this.starterBattle(b, deployed, spells);
    this.state.raidLog = [
      {
        id: this.state.nextId++,
        at: this.clock,
        ...(b.catalog ? { catalog: b.catalog } : {}),
        index: b.index,
        practice: b.practice,
        ...(b.ladder ? { ladder: { ...b.ladder } } : {}),
        duration: b.elapsed,
        ...(this.recordingLimitReached ? { replayUnavailable: 'limit' as const } : {}),
        result: { ...b.result },
        ...(this.recording && validateReplay(this.recording) ? { replay: this.recording } : {}),
        deployed,
        spells,
        ...(b.hero?.unitId != null
          ? { hero: { level: b.hero.level, abilityUsed: b.hero.abilityUsed } }
          : nativeHeroRecord(b)),
      },
      ...(this.state.raidLog ?? []),
    ].slice(0, 20);
    for (const old of this.state.raidLog.slice(REPLAY_LIMIT)) delete old.replay;
    this.advanceJourneyQuest(b);
    this.recording = null;
    this.changed();
  }
  /**
   * The village is about to be put away while a raid is open. Troops leave the camps the
   * moment they are deployed, so abandoning the battle unresolved would spend an army for
   * nothing: settle it at its current score instead, exactly as surrendering does.
   */
  suspendBattle() {
    const b = this.battle;
    if (!b) return;
    if (this.replay) return this.returnHome();
    const spent =
      TROOP_KEYS.some((k) => b.remaining[k] < b.carriedArmy[k]) ||
      SPELL_KEYS.some((k) => b.spells[k] < b.carried[k]) ||
      b.hero?.unitId != null ||
      b.nativeHeroes?.some((hero) => hero.unitId != null || hero.deployed);
    // Nothing was committed yet, so scouting costs the player nothing.
    if (!b.finished && spent) this.finishBattle();
    this.battle = null;
    this.recording = null;
    this.selected = null;
    this.activeSpell = null;
    this.activeHero = false;
    this.activeHeroKind = null;
  }
  /**
   * The village as it would stand if the open raid were settled now, for a checkpoint written
   * while the page may be discarded (a hidden tab). This model and its battle are untouched:
   * if the player returns, the raid carries on and its real result replaces the checkpoint.
   * A raid that has committed nothing yet checkpoints as the village itself.
   */
  settledState(): Save {
    if (!this.battle || this.replay || this.battle.finished) return this.state;
    const copy = new GameModel(structuredClone(this.state), this.clock);
    copy.battle = structuredClone(this.battle);
    copy.suspendBattle();
    return copy.state;
  }
  /** Toolbox mutations are not player inputs and cannot produce faithful recordings. */
  discardRecording() {
    this.recording = null;
  }
  private recordAction(
    action:
      | Omit<Extract<ReplayAction, { type: 'troop' }>, 'step'>
      | Omit<Extract<ReplayAction, { type: 'spell' }>, 'step'>
      | { type: 'hero'; x: number; y: number; hero?: HeroKind }
      | { type: 'ability'; hero?: HeroKind }
      | { type: 'end' },
  ) {
    if (!this.recording) return;
    if (this.recording.actions.length >= MAX_REPLAY_ACTIONS) {
      this.recording = null;
      this.recordingLimitReached = true;
      return;
    }
    this.recording.actions.push({
      ...action,
      step: this.recording.steps.length,
    } as ReplayAction);
  }
  startReplay(recordId: number) {
    if (this.battle && !this.battle.finished && !this.replay) return false;
    const record = this.state.raidLog?.find((r) => r.id === recordId);
    if (
      !record?.replay ||
      !compatibleReplayVersion(record.replay.version) ||
      !validateReplay(record.replay)
    ) {
      this.notify('This attack has no compatible replay. New attacks record automatically.');
      return false;
    }
    return this.openReplay(record.replay, recordId);
  }
  /**
   * The opening Goblin raid: goblins attack this village and its own defenses answer. It is
   * a practice attack recorded on a copy of the village, played back with the replay viewer,
   * so nothing here is spent, damaged or logged. Ten goblins land in three waves from three
   * sides; the tutorial's own scripted raid is client data this build does not have.
   */
  goblinRaidRecording(): ReplayData | null {
    const runner = new GameModel(structuredClone(this.state), this.clock);
    runner.state.army = { ...emptyArmy(), goblin: GOBLIN_RAID_SIZE };
    runner.state.spells = emptySpells();
    runner.state.troopLevels = { ...runner.state.troopLevels!, goblin: 1 };
    runner.startBattle(0, true);
    const b = runner.battle;
    if (!b) return null;
    const home = this.townhall;
    const cx = home ? home.x + BUILDINGS[home.kind].size / 2 : MAP_SIZE / 2,
      cy = home ? home.y + BUILDINGS[home.kind].size / 2 : MAP_SIZE / 2;
    // Walk out from the Town Hall until the grass allows a deployment.
    const landing = (angle: number) => {
      for (let r = 2; r < MAP_SIZE; r += 0.5) {
        const x = cx + Math.cos(angle) * r,
          y = cy + Math.sin(angle) * r;
        if (x < 1 || y < 1 || x > MAP_SIZE - 1 || y > MAP_SIZE - 1) return null;
        if (!runner.deployBlocked(x, y)) return { x, y };
      }
      return null;
    };
    const waves = [
      { at: 0, angle: 0.4, count: 4 },
      { at: 60, angle: 2.5, count: 3 },
      { at: 120, angle: 4.4, count: 3 },
    ];
    runner.activeTroop = 'goblin';
    let step = 0;
    for (const wave of waves) {
      while (step < wave.at && !b.finished) {
        runner.step(GOBLIN_RAID_TICK);
        step++;
      }
      const spot = landing(wave.angle) ?? landing(wave.angle + Math.PI);
      if (!spot) continue;
      for (let i = 0; i < wave.count; i++) {
        const x = spot.x + (i % 2) * 0.6,
          y = spot.y + i * 0.4;
        runner.deploy(
          ...(runner.deployBlocked(x, y) ? ([spot.x, spot.y] as const) : ([x, y] as const)),
        );
      }
    }
    for (let t = 0; t < BATTLE_SECONDS / GOBLIN_RAID_TICK && !b.finished; t++)
      runner.step(GOBLIN_RAID_TICK);
    if (!b.finished) runner.finishBattle();
    return runner.state.raidLog?.[0]?.replay ?? null;
  }
  /** Watch the opening Goblin raid; leaving it marks it seen. */
  watchGoblinRaid() {
    if (this.battle) return false;
    const data = this.goblinRaidRecording();
    if (!data || !this.openReplay(data)) {
      this.state.goblinRaidSeen = true;
      this.changed();
      return false;
    }
    this.goblinRaid = true;
    this.changed();
    return true;
  }
  /** Imported recordings are transient and never enter the home result log. */
  openReplay(data: ReplayData, recordId: number | null = null) {
    if (
      (this.battle && !this.battle.finished && !this.replay) ||
      !validateReplay(data) ||
      !compatibleReplayVersion(data.version)
    )
      return false;
    this.cancel();
    this.editing = false;
    this.recording = null;
    this.replayData = structuredClone(data);
    this.replay = {
      recordId,
      paused: false,
      speed: 1,
      time: 0,
      duration: data.steps.reduce((n, dt) => n + dt, 0),
      complete: false,
      seeking: false,
      seekTarget: 0,
    };
    this.resetReplayRunner();
    this.battle = this.replayRunner!.battle;
    this.activeHero = false;
    this.activeHeroKind = null;
    this.activeSpell = null;
    this.selected = null;
    this.applyReplayActions();
    this.changed();
    return true;
  }
  private resetReplayRunner() {
    const data = this.replayData!;
    const runner = new GameModel();
    runner.recordBattles = false;
    runner.state.army = { ...data.initial.army };
    runner.state.spells = { ...data.initial.spells };
    runner.state.troopLevels = { ...data.initial.troopLevels };
    runner.state.nextId = data.initial.nextId;
    runner.battle = replayBattle(data.initial, data.version);
    resetPathCaches();
    runner.onEffect = (fx) => {
      if (!this.replay?.seeking) this.onEffect(fx);
    };
    // Deploys report passive changes (live HUD refresh); forward that instead of forcing a
    // full render for every replayed troop.
    runner.onChange = (passive) => {
      if (!this.replay?.seeking) this.changed(passive);
    };
    this.replayRunner = runner;
    this.replayStep = this.replayAction = this.replayBudget = 0;
    this.replayKeyframes = [];
  }
  replayRecording(recordId?: number) {
    return recordId === undefined
      ? this.replayData
      : (this.state.raidLog?.find((r) => r.id === recordId)?.replay ?? null);
  }
  restartReplay() {
    if (!this.replayData || !this.replay) return false;
    return this.openReplay(this.replayData, this.replay.recordId);
  }
  /** Jump-opened wall ids as of the last tick, per battle (see the jump version below). */
  private jumpWallsSeen = new WeakMap<object, Set<number>>();
  /** Reconstruct silently in bounded chunks; dragging never blocks the browser for a whole raid. */
  seekReplay(seconds: number) {
    const r = this.replay;
    if (!r || !Number.isFinite(seconds)) return false;
    if (!r.seeking) this.replaySeekPaused = r.paused;
    r.seekTarget = Math.max(0, Math.min(r.duration, seconds));
    r.seeking = true;
    this.replayBudget = 0;
    r.complete = false;
    r.paused = true;
    // Forward seeks continue from the current runner; backward seeks restore the
    // nearest keyframe snapshot (every 10s) instead of restarting from tick zero.
    if (r.seekTarget < r.time - 1e-9) {
      let frame: (typeof this.replayKeyframes)[number] | undefined;
      for (const key of this.replayKeyframes) {
        if (key.time <= r.seekTarget + 1e-9) frame = key;
        else break;
      }
      if (frame && this.replayRunner) {
        r.time = frame.time;
        this.replayStep = frame.step;
        this.replayAction = frame.action;
        this.replayRunner.battle = structuredClone(frame.battle) as Battle;
        this.replayRunner.state.nextId = frame.nextId;
        // Drop newer keyframes; they will be rebuilt as the seek advances.
        this.replayKeyframes = this.replayKeyframes.filter((k) => k.time <= frame!.time + 1e-9);
      } else {
        r.time = 0;
        this.resetReplayRunner();
      }
      // A long backward seek draws for several frames before it completes: show the restored
      // battle at once rather than the pre-seek one.
      if (this.replayRunner) this.battle = this.replayRunner.battle;
    }
    this.applyReplayActions();
    this.advanceReplaySeek();
    this.changed();
    return true;
  }
  /** Keyframe ring every 10s so backward seeks start near the target, not at tick zero. */
  private maybeKeyframe() {
    const r = this.replay!;
    const last = this.replayKeyframes.at(-1);
    if (last && r.time - last.time < 10) return;
    try {
      this.replayKeyframes.push({
        time: r.time,
        step: this.replayStep,
        action: this.replayAction,
        battle: structuredClone(this.replayRunner!.battle) as Battle,
        nextId: this.replayRunner!.state.nextId,
      });
      if (this.replayKeyframes.length > 36) this.replayKeyframes.shift();
    } catch {
      // Cloning can fail on very large battles; seeking still works from zero.
    }
  }
  private advanceReplaySeek() {
    const r = this.replay!,
      data = this.replayData!;
    let work = 0;
    const deadline = performance.now() + MAX_REPLAY_UPDATE_MS;
    // Stop on the last recorded simulation boundary at or before the requested time.
    while (
      this.replayStep < data.steps.length &&
      r.time + data.steps[this.replayStep] <= r.seekTarget + 1e-9 &&
      work < MAX_REPLAY_STEPS_PER_UPDATE &&
      (work === 0 || performance.now() < deadline)
    ) {
      work++;
      const dt = data.steps[this.replayStep++];
      r.time += dt;
      this.replayRunner!.step(dt);
      this.applyReplayActions();
      this.maybeKeyframe();
    }
    if (
      this.replayStep === data.steps.length ||
      r.time + data.steps[this.replayStep] > r.seekTarget + 1e-9
    ) {
      r.seeking = false;
      r.paused = r.complete || this.replaySeekPaused;
      this.battle = this.replayRunner!.battle;
      this.changed();
    }
  }
  skipReplayScouting() {
    const data = this.replayData;
    if (!this.replay || !data) return;
    const first = data.actions.find(
      (a) => a.type === 'troop' || a.type === 'hero' || a.type === 'spell',
    );
    this.seekReplay(
      first
        ? data.steps.slice(0, first.step).reduce((n, dt) => n + dt, 0)
        : Math.min(PREP_SECONDS, this.replay.duration),
    );
  }
  toggleReplay() {
    if (!this.replay || this.replay.complete || this.replay.seeking) return;
    this.replay.paused = !this.replay.paused;
    this.replayBudget = 0;
    this.changed();
  }
  /** How fast a live attack runs: more fixed steps per frame, never longer steps. */
  get battleSpeed(): BattleSpeed {
    return this.replay ? 1 : (this.state.settings.battleSpeed ?? 1);
  }
  /** Steps through 1×, 2× and 4×. The choice is kept for the next attack. */
  cycleBattleSpeed() {
    const at = BATTLE_SPEEDS.indexOf(this.state.settings.battleSpeed ?? 1);
    this.state.settings.battleSpeed = BATTLE_SPEEDS[(at + 1) % BATTLE_SPEEDS.length];
    this.changed();
  }
  setReplaySpeed(speed: number) {
    if (!this.replay || (speed !== 1 && speed !== 2 && speed !== 4)) return;
    this.replay.speed = speed;
    this.replayBudget = 0;
    this.changed();
  }
  private applyReplayActions() {
    const data = this.replayData!,
      runner = this.replayRunner!;
    while (
      this.replayAction < data.actions.length &&
      data.actions[this.replayAction].step === this.replayStep
    ) {
      const a = data.actions[this.replayAction++];
      if (a.type === 'troop') {
        runner.activeTroop = a.kind;
        runner.deploy(a.x, a.y);
      } else if (a.type === 'spell') {
        runner.activeSpell = a.kind;
        runner.castSpell(a.x, a.y);
      } else if (a.type === 'hero')
        a.hero ? runner.deployNativeHero(a.hero, a.x, a.y) : runner.deployHero(a.x, a.y);
      else if (a.type === 'ability')
        a.hero ? runner.activateNativeHeroAbility(a.hero) : runner.activateHeroAbility();
      else runner.finishBattle();
    }
    if (this.replayStep === data.steps.length) {
      this.replay!.complete = true;
      this.replay!.paused = true;
      if (!this.replay!.seeking) this.changed();
    }
  }
  private stepReplay(dt: number) {
    const replay = this.replay!;
    if (replay.seeking) {
      this.advanceReplaySeek();
      return;
    }
    if (replay.paused || replay.complete) return;
    this.replayBudget += dt * replay.speed;
    const data = this.replayData!;
    let work = 0;
    const deadline = performance.now() + MAX_REPLAY_UPDATE_MS;
    while (
      this.replayStep < data.steps.length &&
      this.replayBudget + 1e-9 >= data.steps[this.replayStep] &&
      work < MAX_REPLAY_STEPS_PER_UPDATE &&
      (work === 0 || performance.now() < deadline)
    ) {
      work++;
      const delta = data.steps[this.replayStep++];
      this.replayBudget -= delta;
      replay.time += delta;
      this.replayRunner!.step(delta);
      this.applyReplayActions();
      this.maybeKeyframe();
    }
    // A battle heavier than real time falls behind instead of banking the shortfall: an
    // unbounded backlog later fast-forwarded up to 100 steps (5 s) in a single frame.
    this.replayBudget = Math.min(this.replayBudget, MAX_REPLAY_BACKLOG_SECONDS);
  }
  returnHome() {
    if (this.goblinRaid) {
      this.goblinRaid = false;
      this.state.goblinRaidSeen = true;
    }
    this.replay = null;
    this.replayRunner = null;
    this.replayData = null;
    this.recording = null;
    this.battle = null;
    this.practiceGuide = null;
    this.selected = null;
    this.activeSpell = null;
    this.activeHero = false;
    this.activeHeroKind = null;
    this.changed();
  }
}
/** Playback may run at most this far behind the clock before it slows down instead. */
export const MAX_REPLAY_BACKLOG_SECONDS = 0.25;
export function canTarget(targets: 'ground' | 'air' | 'both' | undefined, kind: UnitKind) {
  // Totems are valid targets for ground-only and air-only defenses.
  if (kind === 'totem') return true;
  const flying = !!TROOPS[kind].flying;
  if (!targets || targets === 'both') return true;
  return targets === 'air' ? flying : !flying;
}
export function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  if (s >= 3600) {
    const minutes = Math.round(s / 60),
      h = Math.floor(minutes / 60),
      m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (s >= 60) {
    const m = Math.floor(s / 60);
    return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
  }
  return `${s}s`;
}
/** Version 46 raid summary of the hero roster: every deployed hero, named, in lineup order. */
function nativeHeroRecord(b: Battle): { heroes?: RaidHero[] } {
  const heroes = (b.nativeHeroes ?? [])
    .filter((hero) => hero.deployed)
    .map((hero) => ({ kind: hero.kind, level: hero.level, abilityUsed: !!hero.abilityUsed }));
  return heroes.length ? { heroes } : {};
}
/** The heroes a log entry names; an entry from before the roster names the Barbarian King. */
export function raidHeroes(record: Pick<RaidRecord, 'hero' | 'heroes'>): RaidHero[] {
  return record.heroes ?? (record.hero ? [{ kind: 'king', ...record.hero }] : []);
}
export function makeBuilding(
  id: number,
  kind: BuildingKind,
  x: number,
  y: number,
  level = 1,
): Building {
  const hp = buildingHp(kind, level);
  return {
    id,
    kind,
    x,
    y,
    level,
    hp,
    maxHp: hp,
    stored: 0,
    cooldown: 0,
  };
}
export function initialSave(): Save {
  let id = 1;
  const b: Building[] = [];
  const add = (k: BuildingKind, x: number, y: number, l = 1) =>
    b.push(makeBuilding(id++, k, x, y, l));
  add('townhall', 11, 10, 2);
  add('goldstorage', 9, 14, 2);
  add('elixirstorage', 15, 10, 2);
  add('cannon', 12, 14, 2);
  add('archertower', 15, 15, 2);
  add('barracks', 4, 15, 2);
  add('camp', 10, 21, 2);
  add('goldmine', 3, 8, 2);
  add('goldmine', 5, 4);
  add('collector', 17, 4, 2);
  add('collector', 21, 7);
  add('builder', 16, 23);
  add('builder', 21, 19);
  add('goldstorage', 6, 20);
  add('elixirstorage', 9, 4);
  add('cannon', 5, 11);
  for (let n = 8; n <= 19; n++) {
    if (n <= 12) add('wall', n, 8, 2);
    if (n !== 13 && n !== 14) add('wall', n, 19, 2);
  }
  for (let n = 9; n < 19; n++) {
    add('wall', 8, n, 2);
  }
  // The opening village has been running a while; its mines start with something to collect.
  for (const v of b) if (v.kind === 'goldmine' || v.kind === 'collector') v.stored = 1800;
  // Walls may border footprints; remove any segment occupying another building's footprint.
  const buildings = b.filter(
    (v) =>
      v.kind !== 'wall' ||
      !b.some(
        (o) =>
          o.kind !== 'wall' &&
          v.x >= o.x &&
          v.x < o.x + BUILDINGS[o.kind].size &&
          v.y >= o.y &&
          v.y < o.y + BUILDINGS[o.kind].size,
      ),
  );
  return {
    version: 4,
    dark: 0,
    // The original's own opening grant. Storage now holds the original allowance, which a
    // prototype-sized purse would overflow several times over before the first battle.
    gold: STARTING_GRANT.gold,
    elixir: STARTING_GRANT.elixir,
    gems: STARTING_GRANT.gems,
    trophies: 1248,
    xp: 1850,
    buildings,
    obstacles: initialObstacles(buildings),
    army: { ...emptyArmy(), swordsman: 12, archer: 10 },
    queue: [],
    spells: emptySpells(),
    spellQueue: [],
    stars: Array(12).fill(0),
    lastTick: Date.now(),
    nextId: id,
    tutorial: false,
    settings: { sound: true, music: false, reducedMotion: false },
    stats: { raids: 0, wins: 0, destroyed: 0, collected: 0 },
  };
}
export function makeNpcBuilding(
  id: number,
  npc: NpcBuildingKind,
  x: number,
  y: number,
  level = 1,
): Building {
  const d = NPC_BUILDINGS[npc];
  if (!d || !validNpcBuilding(npc, d.kind, level)) throw Error('Unsupported NPC building level');
  const b = makeBuilding(id, d.kind, x, y, level);
  return { ...b, npc, hp: d.hp[level - 1], maxHp: d.hp[level - 1] };
}
export function enemyBase(index: number) {
  return campaignBlueprint(index).map(([kind, x, y, direction, skeletonMode], i) => {
    const b = makeBuilding(
      1000 + i,
      kind,
      x,
      y,
      Math.min(BUILDINGS[kind].maxLevel, 3, 1 + Math.floor(index / 4)),
    );
    if (kind === 'airsweeper') b.direction = direction ?? 0;
    if (kind === 'skeletontrap') b.skeletonMode = skeletonMode ?? 'ground';
    b.hp *= CAMPAIGN_LAYOUTS[index].health;
    b.maxHp = b.hp;
    return b;
  });
}
export function distanceTo(u: { x: number; y: number }, b: Building | { x: number; y: number }) {
  const s = 'level' in b && b.kind in BUILDINGS ? BUILDINGS[b.kind as BuildingKind].size : 0;
  return distance2D(Math.max(b.x - u.x, 0, u.x - b.x - s), Math.max(b.y - u.y, 0, u.y - b.y - s));
}
/** Walls by tile and non-wall structures of one building list (hp is read at each use). */
interface BreachIndex {
  length: number;
  first: Building | undefined;
  last: Building | undefined;
  walls: Building[];
  wallTiles: Map<number, Building[]>;
  structures: Building[];
}
const breachIndexes = new WeakMap<readonly Building[], BreachIndex>();
function breachIndex(buildings: Building[]): BreachIndex {
  const known = breachIndexes.get(buildings);
  if (
    known &&
    known.length === buildings.length &&
    known.first === buildings[0] &&
    known.last === buildings[buildings.length - 1]
  )
    return known;
  const walls: Building[] = [],
    structures: Building[] = [];
  const wallTiles = new Map<number, Building[]>();
  for (const b of buildings) {
    if (b.kind === 'wall') {
      walls.push(b);
      const tile = b.y * MAP_SIZE + b.x;
      const list = wallTiles.get(tile);
      if (list) list.push(b);
      else wallTiles.set(tile, [b]);
    } else if (!isTrap(b.kind)) structures.push(b);
  }
  const index = {
    length: buildings.length,
    first: buildings[0],
    last: buildings[buildings.length - 1],
    walls,
    wallTiles,
    structures,
  };
  breachIndexes.set(buildings, index);
  return index;
}
/** The standing wall a tile map built from the list's living walls would hold (the last one). */
function standingWallAt(index: BreachIndex, tile: number) {
  const list = index.wallTiles.get(tile);
  if (!list) return undefined;
  for (let i = list.length - 1; i >= 0; i--) if (list[i].hp > 0) return list[i];
  return undefined;
}
/**
 * Find an actual obstruction on an approach to a building, ignoring stray walls.
 * The five nearest living structures (distance, then id) are selected without sorting the
 * whole list, and their routes come from the pathfinder's memo when already searched.
 */
export function breachTarget(u: { x: number; y: number }, buildings: Building[], subtiles = false) {
  const index = breachIndex(buildings);
  if (!index.walls.some((b) => b.hp > 0)) return undefined;
  const nearest: Building[] = [];
  const distances: number[] = [];
  for (const b of index.structures) {
    if (b.hp <= 0) continue;
    const d = distanceTo(u, b);
    // Insert into the sorted top five: same order as sort((a, b) => da - db || a.id - b.id).
    let at = nearest.length;
    while (
      at > 0 &&
      (distances[at - 1] > d || (distances[at - 1] === d && nearest[at - 1].id > b.id))
    )
      at--;
    if (at >= 5) continue;
    nearest.splice(at, 0, b);
    distances.splice(at, 0, d);
    if (nearest.length > 5) {
      nearest.pop();
      distances.pop();
    }
  }
  const candidates: Building[] = [];
  for (const structure of nearest) {
    const path = findPath(u, structure, buildings, TROOPS.wallbreaker.range, subtiles);
    let obstruction: Building | undefined;
    for (const p of path) {
      obstruction = standingWallAt(index, Math.floor(p.y) * MAP_SIZE + Math.floor(p.x));
      if (obstruction) break;
    }
    if (obstruction) candidates.push(obstruction);
  }
  return candidates.sort((a, b) => distanceTo(u, a) - distanceTo(u, b) || a.id - b.id)[0];
}
// A* on the occupancy grid. Walls carry a break-through cost, buildings are solid.
// Version-44 native campaign battles pass `subtiles` for the client's building-edge lanes.
// Pooled buffers: findPath runs many times per tick, so reuse fixed grid buffers
// instead of allocating ~8 MAP_SIZE² arrays per call (no reentrancy: single-threaded).
// Search state uses a generation stamp: bumping one counter replaces five full-array
// fills per search, with identical observable behavior.
const PATH_CELLS = MAP_SIZE * MAP_SIZE;
const pathCost = new Float64Array(PATH_CELLS);
const pathPrev = new Int16Array(PATH_CELLS);
const pathClosed = new Uint8Array(PATH_CELLS);
const pathPriority = new Float64Array(PATH_CELLS);
const pathHeuristic = new Float64Array(PATH_CELLS);
const pathOrder = new Uint32Array(PATH_CELLS);
const pathPosition = new Int16Array(PATH_CELLS);
const pathStamp = new Uint32Array(PATH_CELLS);
let pathEpoch = 0;
const pathOpen = new Int32Array(PATH_CELLS);
/** A whole-tile collision grid for one exact building list and set of Jump Spell rings. */
interface TileGrid {
  key: BuildingListSnapshot;
  breaches: number[];
  blocked: Uint8Array;
  wall: Uint8Array;
  /** Exact search results: A* is a pure function of the grid, start cell, goal and range. */
  paths: Map<string, readonly { x: number; y: number }[]>;
}
const TILE_GRID_SLOTS = 6;
const tileGrids: TileGrid[] = [];
/** Drop every cached route grid (a new battle or replay runner). Never needed for results. */
export function resetPathCaches() {
  tileGrids.length = 0;
  resetSubtileGrids();
}
function sameBreaches(known: number[], breaches: readonly { x: number; y: number }[]) {
  if (known.length !== breaches.length * 2) return false;
  for (let i = 0; i < breaches.length; i++)
    if (known[i * 2] !== breaches[i].x || known[i * 2 + 1] !== breaches[i].y) return false;
  return true;
}
function tileGridFor(buildings: Building[], breaches: readonly { x: number; y: number }[]) {
  for (let i = 0; i < tileGrids.length; i++) {
    const grid = tileGrids[i];
    if (!sameBreaches(grid.breaches, breaches) || !grid.key.matches(buildings)) continue;
    if (i) {
      tileGrids.splice(i, 1);
      tileGrids.unshift(grid);
    }
    return grid;
  }
  const size = MAP_SIZE;
  const blocked = new Uint8Array(PATH_CELLS),
    wall = new Uint8Array(PATH_CELLS);
  const radius = SPELLS.jump.radius;
  const breached = (x: number, y: number) =>
    breaches.some((ring) => distance2D(x + 0.5 - ring.x, y + 0.5 - ring.y) <= radius);
  for (const b of buildings) {
    if (b.hp <= 0 || isTrap(b.kind)) continue;
    for (let x = b.x; x < b.x + BUILDINGS[b.kind].size; x++)
      for (let y = b.y; y < b.y + BUILDINGS[b.kind].size; y++) {
        if (b.kind === 'wall') {
          // A breached wall is not removed, only walked over: it still stands and still
          // blocks everything outside the ring.
          if (!breaches.length || !breached(x, y)) wall[y * size + x] = 1;
        } else blocked[y * size + x] = 1;
      }
  }
  const grid: TileGrid = {
    key: new BuildingListSnapshot(buildings),
    breaches: breaches.flatMap((ring) => [ring.x, ring.y]),
    blocked,
    wall,
    paths: new Map(),
  };
  tileGrids.unshift(grid);
  if (tileGrids.length > TILE_GRID_SLOTS) tileGrids.pop();
  return grid;
}
export function findPath(
  start: { x: number; y: number },
  target: Building | { x: number; y: number },
  buildings: Building[],
  range: number,
  subtiles = false,
  /** Jump Spell rings. A wall inside one costs nothing to cross while the ring holds. */
  breaches: readonly { x: number; y: number }[] = [],
): { x: number; y: number }[] {
  if (subtiles) return findSubtilePath(start, target, buildings, range);
  const grid = tileGridFor(buildings, breaches);
  const sx = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(start.x))),
    sy = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(start.y))),
    first = sy * MAP_SIZE + sx;
  const goalSize =
    'level' in target && target.kind in BUILDINGS ? BUILDINGS[target.kind as BuildingKind].size : 0;
  // The start point matters only through its cell and whether it is already in range.
  const far = distanceTo(start, target) > range;
  const key = `${first},${target.x},${target.y},${goalSize},${range},${far ? 1 : 0}`;
  const known = grid.paths.get(key);
  if (known) return known.map((p) => ({ x: p.x, y: p.y }));
  const path = searchTilePath(grid, first, target, goalSize, range, far);
  if (grid.paths.size >= PATH_MEMO_LIMIT) grid.paths.clear();
  grid.paths.set(
    key,
    path.map((p) => ({ x: p.x, y: p.y })),
  );
  return path;
}
/**
 * The original closure-based search with its helpers inlined: the same arithmetic in the
 * same order and the same stable heap (priority, then first-in), without allocating a
 * point per scored node or a direction array per expansion.
 */
function searchTilePath(
  grid: TileGrid,
  first: number,
  target: Building | { x: number; y: number },
  goalSize: number,
  range: number,
  far: boolean,
): { x: number; y: number }[] {
  const size = MAP_SIZE;
  const blocked = grid.blocked,
    wall = grid.wall;
  const cost = pathCost;
  const prev = pathPrev;
  const closed = pathClosed;
  const priority = pathPriority;
  const heuristic = pathHeuristic;
  const order = pathOrder;
  const position = pathPosition;
  const stamp = pathStamp;
  // Generation stamp replaces cost/prev/closed/heuristic/position fills.
  if (pathEpoch === 0xffffffff) {
    stamp.fill(0);
    pathEpoch = 0;
  }
  const epoch = ++pathEpoch;
  const heap = pathOpen;
  let length = 0;
  let sequence = 0;
  const targetX = target.x,
    targetY = target.y;
  // distanceTo({ x: cx + 0.5, y: cy + 0.5 }, target), expression for expression.
  const score = (cx: number, cy: number) => {
    const ux = cx + 0.5,
      uy = cy + 0.5;
    return distance2D(
      Math.max(targetX - ux, 0, ux - targetX - goalSize),
      Math.max(targetY - uy, 0, uy - targetY - goalSize),
    );
  };
  stamp[first] = epoch;
  prev[first] = -1;
  closed[first] = 0;
  cost[first] = 0;
  heuristic[first] = score(first % size, Math.floor(first / size));
  priority[first] = cost[first] + heuristic[first];
  order[first] = sequence++;
  heap[length++] = first;
  position[first] = 0;
  let goal = -1;
  let approach: { x: number; y: number } | undefined;
  while (length) {
    const current = heap[0];
    const last = heap[--length];
    position[current] = -1;
    if (length) {
      const lastPriority = priority[last],
        lastOrder = order[last];
      let at = 0;
      while (at * 2 + 1 < length) {
        let child = at * 2 + 1;
        if (child + 1 < length) {
          const right = heap[child + 1],
            left = heap[child];
          if (
            priority[right] < priority[left] ||
            (priority[right] === priority[left] && order[right] < order[left])
          )
            child++;
        }
        const node = heap[child];
        if (!(
          priority[node] < lastPriority ||
          (priority[node] === lastPriority && order[node] < lastOrder)
        ))
          break;
        heap[at] = node;
        position[node] = at;
        at = child;
      }
      heap[at] = last;
      position[last] = at;
    }
    closed[current] = 1;
    const x = current % size,
      y = Math.floor(current / size);
    // heuristic[current] is distanceTo(cell center, target), scored when it was queued.
    if (heuristic[current] <= range) {
      // A grid-center goal can be in range while the unit's actual position is not.
      // Keep that final segment for buildings as well as defending troops.
      if (current === first && far) approach = { x: x + 0.5, y: y + 0.5 };
      goal = current;
      break;
    }
    // A melee reach below half a tile cannot reach a building from grid centers.
    // Finish with a short segment inside the final cell, never through a corner
    // or an extra occupied cell. Other ranges retain their original grid route.
    if (range < 0.5 && !blocked[current]) {
      const centerX = x + 0.5,
        centerY = y + 0.5,
        s = goalSize;
      const tx = Math.max(targetX, Math.min(centerX, targetX + s));
      const ty = Math.max(targetY, Math.min(centerY, targetY + s));
      const dx = centerX - tx,
        dy = centerY - ty,
        distance = distance2D(dx, dy);
      if (distance <= 1e-9) {
        goal = current;
        break;
      }
      const reach = Math.max(0, range - 1e-6); // Stay inside range despite float rounding.
      const point = { x: tx + (dx * reach) / distance, y: ty + (dy * reach) / distance };
      if (Math.floor(point.x) === x && Math.floor(point.y) === y) {
        approach = point;
        goal = current;
        break;
      }
    }
    const base = cost[current];
    // Neighbours in the original order: +x, -x, +y, -y.
    for (let d = 0; d < 4; d++) {
      let nx = x,
        ny = y;
      if (d === 0) nx++;
      else if (d === 1) nx--;
      else if (d === 2) ny++;
      else ny--;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const n = ny * size + nx;
      if (blocked[n]) continue;
      if (stamp[n] !== epoch) {
        stamp[n] = epoch;
        cost[n] = Infinity;
        prev[n] = -1;
        closed[n] = 0;
        heuristic[n] = NaN;
        position[n] = -1;
      } else if (closed[n]) continue;
      const next = base + 1 + (wall[n] ? 6 : 0);
      if (next < cost[n]) {
        cost[n] = next;
        prev[n] = current;
        if (Number.isNaN(heuristic[n])) heuristic[n] = score(nx, ny);
        const value = next + heuristic[n];
        priority[n] = value;
        let at = position[n];
        if (at < 0) {
          at = length++;
          order[n] = sequence++;
        }
        const nodeOrder = order[n];
        while (at > 0) {
          const parent = (at - 1) >> 1;
          const above = heap[parent];
          if (!(value < priority[above] || (value === priority[above] && nodeOrder < order[above])))
            break;
          heap[at] = above;
          position[above] = at;
          at = parent;
        }
        heap[at] = n;
        position[n] = at;
      }
    }
  }
  if (goal < 0) return [];
  const path = [];
  while (goal !== first && goal >= 0) {
    path.push({ x: (goal % size) + 0.5, y: Math.floor(goal / size) + 0.5 });
    goal = prev[goal];
  }
  path.reverse();
  if (approach) path.push(approach);
  return path;
}

/**
 * Version 54: a battle whose only fighters are summons (Witch skeletons, hero and spell
 * summons, spawned units) ends after this long without damaging a building or defender,
 * once the player has nothing left to deploy. See docs/CAMPAIGN-RULES.md.
 */
export const STALLED_BATTLE_SECONDS = 30;
/** Units the player did not deploy: spawned by another unit, a hero ability or a spell. */
export const summonedUnit = (u: Unit) => !!u.summoned || u.native?.owner !== undefined;
/** Version 54: the most crowd separation may move one unit in a second (tiles). */
export const SEPARATION_TILES_PER_SECOND = 2;
// Reused separation buckets: per (tile, layer) linked lists in insertion order.
const SEPARATION_CELLS = MAP_SIZE * MAP_SIZE * 2;
const separationHead = new Int32Array(SEPARATION_CELLS).fill(-1);
const separationTail = new Int32Array(SEPARATION_CELLS).fill(-1);
let separationNext = new Int32Array(256);
let separationSpent = new Float64Array(256);
const separationTouched: number[] = [];
/**
 * Local, deterministic crowd separation. A sparse grid bounds neighbor work.
 * `maxPush` (version 54) bounds how far separation moves any one unit in the call; without
 * it each overlapping pair pushes up to 0.07 tiles, and a dense blob could throw a unit well
 * over a tile in one 50 ms tick.
 */
export function separateUnits(
  units: Unit[],
  buildings: Building[],
  subtiles = false,
  maxPush?: number,
) {
  // Fewer than two living units cannot push each other; skip the collision rebuild.
  let living = 0;
  for (const u of units) if (u.hp > 0 && ++living > 1) break;
  if (living < 2) return;
  // Version-44 native campaign crowds use the same sub-tile building collision as routes.
  // Whole-tile battles read the route grid for the list: blocked or walled is solid.
  const lanes = subtiles ? subtileSolid(buildings) : undefined;
  const tiles = lanes ? undefined : tileGridFor(buildings, []);
  const alive: Unit[] = [];
  for (const u of units) if (u.hp > 0) alive.push(u);
  const count = alive.length;
  if (separationNext.length < count) {
    separationNext = new Int32Array(count * 2);
    separationSpent = new Float64Array(count * 2);
  }
  const next = separationNext,
    spent = separationSpent;
  // Air and ground share no space, so they never push each other around: each (tile, layer)
  // keeps its own list, in the same order the shared tile list used to hold them.
  const flying = new Uint8Array(count);
  const radius = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const u = alive[i];
    flying[i] = TROOPS[u.kind].flying ? 1 : 0;
    radius[i] = u.kind === 'giant' ? 0.85 : 0.5;
    spent[i] = 0;
    next[i] = -1;
    const key = (Math.floor(u.y) * MAP_SIZE + Math.floor(u.x)) * 2 + flying[i];
    // Units can stand off the grid; the old sparse map still bucketed them by that key.
    if (key < 0 || key >= SEPARATION_CELLS || !Number.isInteger(key)) {
      next[i] = -2;
      continue;
    }
    if (separationHead[key] < 0) {
      separationHead[key] = i;
      separationTouched.push(key);
    } else next[separationTail[key]] = i;
    separationTail[key] = i;
  }
  const free = (air: number, x: number, y: number) =>
    x >= 0.1 &&
    y >= 0.1 &&
    x < MAP_SIZE - 0.1 &&
    y < MAP_SIZE - 0.1 &&
    (air === 1 ||
      (lanes
        ? !lanes(x, y)
        : tiles!.blocked[Math.floor(y) * MAP_SIZE + Math.floor(x)] !== 1 &&
          tiles!.wall[Math.floor(y) * MAP_SIZE + Math.floor(x)] !== 1));
  for (let i = 0; i < count; i++) {
    const u = alive[i];
    const air = flying[i];
    const cx = Math.floor(u.x),
      cy = Math.floor(u.y);
    for (let oy = -1; oy <= 1; oy++)
      for (let ox = -1; ox <= 1; ox++) {
        const nx = cx + ox,
          ny = cy + oy;
        // A flat index wraps at the row edges; column 0 must not neighbour the last column.
        if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue;
        for (let j = separationHead[(ny * MAP_SIZE + nx) * 2 + air]; j >= 0; j = next[j]) {
          const v = alive[j];
          if (v.id <= u.id) continue;
          const spacing = radius[i] + radius[j];
          const desired = spacing / 2;
          let dx = v.x - u.x,
            dy = v.y - u.y;
          let distance = distance2D(dx, dy);
          if (distance >= desired) continue;
          if (distance < 0.0001) {
            const angle = ((u.id * 127 + v.id * 31) % 628) / 100;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          const push = Math.min(0.07, (desired - distance2D(v.x - u.x, v.y - u.y)) * 0.25);
          if (maxPush === undefined) {
            const px = (dx / distance) * push,
              py = (dy / distance) * push;
            if (free(air, u.x - px, u.y - py)) {
              u.x -= px;
              u.y -= py;
            }
            if (free(air, v.x + px, v.y + py)) {
              v.x += px;
              v.y += py;
            }
            continue;
          }
          const pushU = Math.min(push, maxPush - spent[i]);
          if (pushU > 0) {
            const px = (dx / distance) * pushU,
              py = (dy / distance) * pushU;
            if (free(air, u.x - px, u.y - py)) {
              u.x -= px;
              u.y -= py;
              spent[i] += pushU;
            }
          }
          const pushV = Math.min(push, maxPush - spent[j]);
          if (pushV > 0) {
            const px = (dx / distance) * pushV,
              py = (dy / distance) * pushV;
            if (free(air, v.x + px, v.y + py)) {
              v.x += px;
              v.y += py;
              spent[j] += pushV;
            }
          }
        }
      }
  }
  for (const key of separationTouched) {
    separationHead[key] = -1;
    separationTail[key] = -1;
  }
  separationTouched.length = 0;
}
