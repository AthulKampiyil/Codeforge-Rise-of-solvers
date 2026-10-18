import { isSiege, superOriginal, superMinimum, superLicence } from '../game/special-troops';
import { archerTowerPortrait } from './archer-tower-portrait';
import { infernoStats, type InfernoMode } from '../game/inferno-weapon';
import { cannonIconAsset } from '../game/cannon-art';
import { darkStorageCapacity } from '../game/dark-storage-stats';
import { collectorProduction, isCollector } from '../game/collector-production';
import { campaignStage } from '../game/campaign-catalog';
import { campaignAmount, campaignResourceKeys, type CampaignResource } from '../game/campaign-loot';
import {
  NATIVE_CAMPAIGN,
  NATIVE_COMBAT,
  nativeBuildings,
  nativeCampaignIssues,
} from '../game/native-campaign';
import { sweeperStats } from '../game/air-control-stats';
import { XBOW, xbowRange, type XbowMode } from '../game/xbow-stats';
import {
  EQUIPMENT_LEVELS,
  oreCapacity,
  ORES,
  ORE_KEYS,
  validEquipmentKind,
  type EquipmentKind,
  type OreKind,
} from '../game/equipment';
import { campCapacity } from '../game/camp-stats';
import { spellFactoryCapacity } from '../game/facility-progression';
import { BOMB_TOWER, bombTowerDeathDamage } from '../game/bomb-tower';
import { WIZARD_TOWER_PROJECTILES, wizardTowerProjectileTier } from '../game/wizard-tower-stats';
import {
  SKELETON_TRAP,
  skeletonCount,
  skeletonSpawnLevel,
  skeletonStats,
} from '../game/skeleton-stats';
import {
  maxSpellLevelFor,
  SPELL_LEVELS,
  HEAL_PULSES,
  freezeSeconds,
  invisibilitySeconds,
  INVISIBILITY_LINGER,
  jumpSeconds,
  cloneHousing,
  CLONE_LIFETIME,
  recallHousing,
  reviveFraction,
  HEAL_HERO_MULTIPLIER,
  SPELL_PULSE_INTERVAL,
  RAGE_LINGER,
} from '../game/spell-progression';
import { OBSTACLES } from '../game/obstacles';
import { DECORATIONS, DECORATION_KINDS, DECORATION_TEXTS } from '../game/decorations';
import { traderWeekEnds, type TraderOffer } from '../game/trader';
import { GEM_TEXTS, TREASURE_PACKS, type GemResource, type TreasurePack } from '../game/gem-costs';
import { BUILDER_MENU_TEXTS, builderMenu, type BuilderOption } from '../game/builder-menu';
import Phaser from 'phaser';
import { TROOP_ORDER, SPELL_ORDER, spellUnlockLabel } from './army-roster';
import {
  TROOP_UNLOCK,
  SPELL_UNLOCK,
  facilityUnlocks,
  spellFactory,
  troopFacility,
} from '../game/army-unlocks';
import {
  parseReplayFile,
  replayFileText,
  MAX_REPLAY_FILE_BYTES,
  REPLAY_FILE_NAME,
} from '../game/replay-file';
import { deliverFile } from './share-file';
import { compatibleReplayVersion } from '../game/replay';
import { heroNextRequirement, heroUpgradeCost, heroUpgradeSeconds } from '../game/heroes';
import {
  HERO_KINDS,
  HERO_SOURCE,
  PET_DISPLAY,
  PET_KINDS,
  heroItems,
  heroLevelCap as nativeHeroLevelCap,
  heroPortraitImage,
  heroSlots as nativeHeroSlots,
  heroTownHallScale,
  heroUnlockHall,
  heroUnlockTownHall,
  heroUpgradeQuote as nativeHeroUpgradeQuote,
  itemLevelCap,
  itemMaxLevel,
  itemName as nativeItemName,
  itemRarity,
  itemStats as nativeItemStats,
  itemUpgradeCost,
  petLevelCap,
  petMaxLevel,
  petUnlockHouse,
  petUpgradeQuote,
  validPet,
  validItem,
  itemHero,
  type HeroKind,
  type PetKind,
} from '../game/native-hero-data';
import {
  JOURNEY_QUEST_STARS,
  JOURNEY_TIERS,
  JOURNEY_TOWN_HALL,
  questTarget,
  type JourneyReward,
} from '../game/heroes-journey';
import { MAGIC_ITEMS, MAGIC_ITEM_KINDS } from '../game/magic-items';
import {
  HELPER_COOLDOWN_SECONDS,
  CONVERT_RESOURCES,
  HELPER_KINDS,
  alchemistCap,
  alchemistOutput,
  helperInfo,
  helperLevel,
  helperMaxLevel,
  helperName,
  helperReady,
  helperWorkEnd,
  helperWorking,
  type ConvertResource,
  type HelperKind,
  type HelperTarget,
} from '../game/helpers';
import {
  CRAFTED_KINDS,
  MODULE_MAX_LEVEL,
  craftedArt,
  craftedLevel,
  craftedModules,
  craftedName,
  craftedStats,
  moduleUpgrade,
  validCraftedKind,
  type CraftedKind,
  type ModuleLevels,
} from '../game/crafted-defenses';
import { LEGACY_ITEM } from '../game/native-hero-village';
import { heroAbilityHeal, heroStatsFor } from '../game/native-heroes';
import { BUILDING_LEVELS, requiredTownHall } from '../game/progression';
import { armySpace, emptyArmy, emptySpells, spellSpace, type ArmyPreset } from '../game/army';
import { ARMY_RECIPE_TEXTS, FIRST_RECIPE_TOWN_HALL, type ArmyRecipe } from '../game/army-recipes';
import { PRACTICE_TEXTS, practiceLevelAt, type PracticeLevel } from '../game/practice-mode';
import {
  BUILDINGS,
  buildPrice,
  buildingHp,
  TROOPS,
  TROOP_KEYS,
  SPELLS,
  TROOP_HOTKEYS,
  SPELL_HOTKEYS,
  maxTroopLevel,
  researchLevelForLab,
  asset,
  defenseDamage,
  defenseDps,
  trapDamage,
  trapStats,
  isSpellKind,
  springCapacity,
  unlockTownHall,
  MAX_TOWNHALL,
  storageCapacity,
  upgradeSeconds,
  upgradeCost as costFor,
  isDefense,
  producedResource,
  MAP_CURSOR_KEY,
  BUILDING_LIST_KEY,
  type BuildingKind,
  type TroopKind,
  type SpellKind,
  type ResearchKind,
} from '../game/data';
import {
  GameModel,
  formatTime,
  BATTLE_SECONDS,
  timedBattle,
  EPIC_ITEM_GEMS,
  raidHeroes,
  type Building,
  type Save,
} from '../game/model';
import {
  spellTowerModes,
  townHallWeaponUpgrade,
  type SpellTowerMode,
} from '../game/native-defense-stats';
import {
  MERGED_KINDS,
  gearUpQuote,
  isGearable,
  isMergedKind,
  mergeInputs,
  mergeQuote,
  type MergedKind,
} from '../game/native-merges';
import { superchargeQuote } from '../game/native-supercharge';
import { GUARDIAN_KINDS, GUARDIAN_NAMES, guardianUpgrade } from '../game/native-guardians';

const SPELL_TOWER_LABEL: Record<SpellTowerMode, string> = {
  rage: 'Rage',
  poison: 'Poison',
  invisibility: 'Invisibility',
  earthquake: 'Earthquake',
};
import { VillageScene } from '../game/scene';
import { AudioManager } from '../game/audio';
import {
  saveFileName,
  saveFileText,
  forgetReplacedVillage,
  keepReplacedVillage,
  replacedVillage,
  parseSaveFile,
  saveGame,
  MAX_SAVE_FILE_BYTES,
} from '../game/save';
import { STAR_BONUS_STARS, TOWN_HALL_BOOST_MULTIPLIER, TREASURY_RESOURCES } from '../game/leagues';
import { icon, resource, coin, elixir, gem } from './icons';
import { applyMotionPreference } from './motion';
import { offlineStatus, retryOfflineWarm, watchOfflineStatus } from '../offline';
import { ACHIEVEMENTS, UNAVAILABLE_ACHIEVEMENTS } from '../game/achievements';
import { musicScene } from '../game/music';
import { openCodeForgeDialog } from './codeforge-dialog';
import './topic-outpost-toolbar.css';
import { attacksApi, villageApi } from '../cp/api';
import type { AttackDetail, SolvedHistoryItem, VillageTopic } from '../cp/types';
import { cpVillageStore, type CPVillageSnapshot } from '../cp/store';
import { decodeLayout, layoutFromLink, layoutLink } from '../game/layout-share';
import {
  STARTER_END_TEXT,
  STARTER_MAX_POINTS,
  STARTER_TIERS,
  STARTER_TITLE,
  type StarterTier,
} from '../game/starter-challenges';
type Panel =
  | 'magic-items'
  | 'trader'
  | 'shortfall'
  | 'treasure'
  | 'builders'
  | 'treasury'
  | 'starter'
  | 'blacksmith'
  | 'heroes'
  | 'journey'
  | 'crafting'
  | 'helpers'
  | 'pets'
  | 'progression'
  | 'research'
  | 'campaign'
  | 'campaign-scout'
  | 'settings'
  | 'import-confirm'
  | 'buildings'
  | 'achievements'
  | 'star-bonus'
  | 'help'
  | 'info'
  | 'layouts'
  | 'surrender'
  | 'troop-info'
  | 'spell-info'
  | 'army-presets'
  | 'cookbook'
  | 'battle-log'
  | null;
/** Shop and army live in a bottom sheet so the village stays visible and clickable. */
type Drawer = 'shop' | 'army' | null;
const n = (v: number | null | undefined) =>
  v == null ? 'unavailable' : Math.floor(v).toLocaleString('en-US');
/** A guide step's words: the client's <cRRGGBB>…</c> colours as spans, everything else text. */
const guideMarkup = (text: string) =>
  html(text)
    .replace(/&lt;c([0-9a-f]{6})&gt;/gi, '<b class="guide-word" style="color:#$1">')
    .replace(/&lt;\/c&gt;/g, '</b>');
/** A Practice level's army in a few words: "26 troops, 2 spells and a hero". */
const practiceArmyLine = (drill: PracticeLevel) => {
  const troops = Object.values(drill.army).reduce((a, b) => a + b, 0),
    spells = Object.values(drill.spells).reduce((a, b) => a + b, 0),
    heroes = drill.heroes.length;
  const parts = [
    `${troops} troops`,
    ...(spells ? [`${spells} spell${spells === 1 ? '' : 's'}`] : []),
    ...(heroes ? [heroes === 1 ? 'a hero' : `${heroes} heroes`] : []),
  ];
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
};
/** Siege machines in a stored army: they use the siege reserve, not troop housing. */
const presetSiege = (army: Record<string, number>) =>
  Object.entries(army).reduce((sum, [k, count]) => sum + (isSiege(k as TroopKind) ? count : 0), 0);
const damageNumber = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });
/** One glyph per achievement action. */
const ACHIEVEMENT_ICONS: Record<string, string> = {
  upgrade: 'Hammer',
  unit_unlock: 'UsersRound',
  loot: 'Coins',
  clear_obstacles: 'Axe',
  victory_points: 'Trophy',
  win_pvp_attack: 'Swords',
  destroy: 'Castle',
  npc_stars: 'Star',
  slay: 'Crown',
  supercharge: 'Zap',
  seasonal_defense: 'Anvil',
  activate_super_licence: 'Sparkles',
};
const gearImage = (kind: EquipmentKind | OreKind, cls = '') =>
  `<img class="${cls}" src="/assets/equipment/${kind}-v1.webp" alt="">`;
/** Matching hero portraits; the legacy King alias uses the same approved art. */
const HERO_PORTRAIT: Record<HeroKind, string> = {
  king: heroPortraitImage('king'),
  queen: heroPortraitImage('queen'),
  prince: heroPortraitImage('prince'),
  warden: heroPortraitImage('warden'),
  champion: heroPortraitImage('champion'),
  duke: heroPortraitImage('duke'),
};
const heroPortrait = (kind: HeroKind) => HERO_PORTRAIT[kind];
/** Pet House portraits; filenames follow the client record names, not the short keys. */
const PET_PORTRAIT: Record<PetKind, string> = {
  lassi: '/assets/catalog-native/roster/pet-lassi.png',
  yak: '/assets/catalog-native/roster/pet-mighty-yak.png',
  owl: '/assets/catalog-native/roster/equipment-mp-trap-shield.png',
  unicorn: '/assets/catalog-native/roster/pet-unicorn.png',
  frosty: '/assets/catalog-native/roster/pet-frosty.png',
  diggy: '/assets/catalog-native/roster/pet-diggy.png',
  lizard: '/assets/catalog-native/roster/pet-poison-lizard.png',
  phoenix: '/assets/catalog-native/roster/equipment-unused17.png',
  fox: '/assets/catalog-native/roster/pet-spirit-fox.png',
  jelly: '/assets/catalog-native/roster/pet-angry-jelly.png',
  sneezy: '/assets/catalog-native/roster/pet-sneezy.png',
  crow: '/assets/catalog-native/roster/pet-crow.png',
};
const nativeItemImage = (slug: string, cls = '') =>
  `<img class="${cls}" src="/assets/catalog-native/roster/equipment-${slug}.png" alt="">`;
const time = (seconds: number) => formatTime(seconds);
const clock = (seconds: number) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
/** 1.5M, 10K: an amount short enough for a stat box. */
const short = (v: number) =>
  v >= 1e6 ? `${+(v / 1e6).toFixed(2)}M` : v >= 1e4 ? `${+(v / 1e3).toFixed(1)}K` : n(v);
/** A helper job's id in actions: `b.<building>`, `h.<hero>` or `r.<research>`. */
const helperJobId = (t: HelperTarget) =>
  'building' in t ? `b.${t.building}` : 'hero' in t ? `h.${t.hero}` : `r.${t.research}`;
const button = (action: string, label: string, cls = 'game-btn green', extra = '') =>
  `<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
/**
 * One Army drawer action. Narrow screens show only the icon (see .modern-army-actions in the
 * stylesheet) so the troop catalog keeps the width; the label stays for tooltips and readers.
 */
const armyAction = (action: string, glyph: string, label: string, tone: string, disabled = false) =>
  button(
    action,
    `${icon(glyph, 17)}<span class="army-action-label">${label}</span>`,
    `game-btn ${tone}`,
    `title="${label}" aria-label="${label}"${disabled ? ' disabled' : ''}`,
  );
const html = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
/** Only trusted HTTPS Codeforces links are rendered as clickable problem URLs. */
export function codeforcesProblemUrl(problem: Record<string, unknown>) {
  let candidate = typeof problem.problem_url === 'string' ? problem.problem_url : '';
  if (!candidate && problem.contest_id != null && problem.index != null)
    candidate = `https://codeforces.com/contest/${encodeURIComponent(String(problem.contest_id))}/problem/${encodeURIComponent(String(problem.index))}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && ['codeforces.com', 'www.codeforces.com', 'codeforces.com.ru'].includes(url.hostname.toLowerCase())
      ? html(url.toString())
      : '';
  } catch {
    return '';
  }
}
/** A solved-history id (`755-C`) addresses the Codeforces problem an attack row would link to. */
export function codeforcesSolvedProblemUrl(problemId: string) {
  const match = /^(\d+)-(.+)$/.exec(String(problemId).trim());
  return match ? codeforcesProblemUrl({ contest_id: match[1], index: match[2] }) : '';
}
/** Kept small so the outpost dialog grows in one step the user asked for, not by a screenful. */
const CODEFORGE_TOPIC_PROBLEMS_PAGE = 12;
/** Placeholder rows, so the outpost list has its shape before the first village snapshot lands. */
const codeforgeSkeleton = (rows: number) => `<div class="cf-skeleton" aria-hidden="true">${'<span></span>'.repeat(rows)}</div>`;
const pct = (v: number) => `${Math.max(0, Math.min(100, Number.isNaN(v) ? 0 : v))}%`;
/** The one place that says what a building level actually buys you. */
function statRows(
  kind: BuildingKind,
  level: number,
  xbowMode: XbowMode = 'ground',
  infernoMode: InfernoMode = 'single',
  supercharge = 0,
): [string, string, string][] {
  const d = BUILDINGS[kind];
  const rows: [string, string, string][] = [['Heart', 'Hitpoints', n(buildingHp(kind, level))]];
  const trap = trapStats(kind, level);
  if (trap && kind !== 'skeletontrap') {
    rows.length = 0;
    rows.push(['Swords', 'Damage', n(trapDamage(kind, level))]);
    rows.push(['Radar', 'Trigger radius', `${trap.trigger} tile${trap.trigger === 1 ? '' : 's'}`]);
    if (trap.springCapacity)
      rows.push(['Users', 'Spring capacity', `${springCapacity(level)} spaces`]);
    else if (!trap.homingSpeed) rows.push(['Target', 'Blast radius', `${trap.radius} tiles`]);
    if (trap.homingSpeed)
      rows.push(
        ['Target', 'Damage type', 'Single target'],
        ['Gauge', 'Flight speed', `${trap.homingSpeed} tiles/s`],
        ['Users', 'Minimum housing', `${trap.minHousing} spaces`],
      );
    if (!trap.homingSpeed)
      rows.push(['Clock3', 'Fuse / flight', trap.delay ? `${trap.delay}s` : 'Instant']);
    rows.push(['Radar', 'Targets', trap.targets === 'air' ? 'Air only' : 'Ground only']);
  }
  if (kind === 'skeletontrap') {
    const skeleton = skeletonStats('ground', skeletonSpawnLevel(level));
    rows.length = 0;
    rows.push(
      ['Users', 'Skeletons', String(skeletonCount(level))],
      ['Heart', 'Skeleton hitpoints', String(skeleton.hp)],
      ['Swords', 'Damage per second', String(skeleton.dps)],
      ['Swords', 'Damage per hit', String(skeleton.damage)],
      ['Gauge', 'Attack speed', `${skeleton.rate}s`],
      ['Radar', 'Trigger radius', `${SKELETON_TRAP.trigger} tiles`],
      ['Clock3', 'First spawn', `${SKELETON_TRAP.firstSpawn}s`],
      ['Clock3', 'Between spawns', `${SKELETON_TRAP.spawnInterval}s`],
      ['Radar', 'Targets', 'Ground or air'],
    );
  }
  if (kind === 'airsweeper')
    rows.push(
      ['Wind', 'Push strength', `${sweeperStats(level).push.toFixed(1)} tiles`],
      ['Target', 'Range', '1–15 tiles'],
      ['Gauge', 'Attack speed', '5s'],
      ['Radar', 'Targets', 'Air only'],
      ['RotateCw', 'Rotation', '8 directions'],
    );
  if (kind === 'inferno') {
    const { weapon } = infernoStats(level);
    rows.push(['Target', 'Mode', infernoMode === 'multi' ? 'Multi-target' : 'Single-target']);
    rows.push([
      'Swords',
      infernoMode === 'multi' ? 'Damage per second per target' : 'Damage per second',
      infernoMode === 'multi' ? n(weapon.dps[0]) : weapon.dps.map(n).join(' → '),
    ]);
    if (infernoMode === 'single')
      rows.push(['Clock3', 'Heat increases after', '1.5s / 5.25s on the same target']);
    rows.push(
      [
        'Users',
        'Simultaneous targets',
        String(infernoMode === 'multi' ? weapon.alternateTargets : 1),
      ],
      ['Target', 'Range', `${infernoMode === 'multi' ? 10 : 9} tiles`],
      ['Radar', 'Targets', 'Ground & air'],
    );
  }
  if (d.damage && kind !== 'inferno') {
    rows.push(['Swords', 'Damage per second', damageNumber(defenseDps(kind, level))]);
    rows.push(['Swords', 'Damage per hit', damageNumber(defenseDamage(kind, level))]);
    rows.push([
      'Target',
      'Range',
      `${d.minRange ? `${d.minRange}–` : ''}${kind === 'xbow' ? xbowRange(xbowMode) : d.range} tiles`,
    ]);
    rows.push(['Gauge', 'Attack speed', `${d.rate}s`]);
    if (d.splash)
      rows.push(['Sparkles', 'Splash radius', `${d.splash} tile${d.splash === 1 ? '' : 's'}`]);
    rows.push([
      'Radar',
      'Targets',
      kind === 'xbow'
        ? xbowMode === 'both'
          ? 'Ground & air'
          : 'Ground only'
        : d.targets === 'air'
          ? 'Air only'
          : d.targets === 'ground'
            ? 'Ground only'
            : 'Ground & air',
    ]);
  }
  if (kind === 'xbow') rows.push(['Layers', 'Ammunition', `${n(XBOW.ammunition)} bolts`]);
  if (kind === 'wizardtower')
    rows.push([
      'Gauge',
      'Flight speed',
      `${WIZARD_TOWER_PROJECTILES[wizardTowerProjectileTier(level) - 1].speed} tiles/s`,
    ]);
  if (kind === 'bombtower')
    rows.push(
      ['Swords', 'Death damage', n(bombTowerDeathDamage(level))],
      ['Target', 'Death blast radius', `${BOMB_TOWER.deathRadius} tiles`],
      ['Clock3', 'Death fuse', `${BOMB_TOWER.deathDelay}s`],
    );
  if (kind === 'tesla')
    rows.push(
      ['Radar', 'Reveal radius', '6 tiles'],
      ['Eye', 'Automatic reveal', '51% destruction'],
      ['Target', 'Damage type', 'Single target'],
    );
  if (isCollector(kind)) {
    // The simulation's own rates, supercharges included.
    const production = collectorProduction(kind, level, supercharge);
    rows.push(
      ['Timer', 'Production', `${n(production.perHour)} / hour`],
      ['Layers', 'Holds', n(production.capacity)],
    );
  }
  if (kind === 'goldstorage' || kind === 'elixirstorage')
    rows.push(['Layers', 'Adds capacity', `+${n(storageCapacity(level))}`]);
  if (kind === 'darkstorage')
    rows.push(['Layers', 'Dark elixir capacity', n(darkStorageCapacity(level))]);
  if (kind === 'herohall')
    rows.push(['ShieldCheck', 'King level cap at TH7+', level === 1 ? '10' : '20']);
  if (kind === 'blacksmith') {
    // Each forge level opens its own band of equipment levels and stores more ore.
    const reach = EQUIPMENT_LEVELS.filter((row) => row.blacksmith <= level).length;
    const capacity = oreCapacity(level);
    rows.push(['Anvil', 'Equipment level cap', String(reach)]);
    for (const k of ORE_KEYS) rows.push(['Gem', `${ORES[k].name} capacity`, n(capacity[k])]);
  }
  if (kind === 'camp') rows.push(['UsersRound', 'Troop capacity', `${campCapacity(level)}`]);
  if (kind === 'spellfactory')
    rows.push(['Sparkles', 'Spell housing', String(spellFactoryCapacity(level))]);
  if (kind === 'laboratory') {
    rows.push([
      'FlaskConical',
      'Researches up to',
      `Up to level ${Math.max(...TROOP_KEYS.map((k) => researchLevelForLab(k, level)))} · varies by troop`,
    ]);
    rows.push([
      'Sparkles',
      'Spell research',
      `Up to level ${Math.max(...SPELL_ORDER.map((k) => SPELL_LEVELS[k].filter((s) => s.laboratory <= level).length))} · varies by spell`,
    ]);
  }
  if (kind === 'builder') rows.push(['Hammer', 'Builders', '+1 construction slot']);
  if (kind === 'barracks') rows.push(['Swords', 'Preparation', 'Free and instant']);
  if (kind === 'townhall') rows.push(['LayoutGrid', 'Caps buildings at', `Level ${level + 1}`]);
  return rows;
}
/**
 * First-run coaching. Each step is satisfied by a counter that already exists in
 * the save, so a village part-way through the game opens with the tutorial already
 * finished rather than being told to do things it has done.
 */
const TUTORIAL: {
  title: string;
  body: string;
  target: string;
  done: (m: GameModel) => boolean;
}[] = [
  {
    title: 'Goblins are raiding!',
    body: 'Watch your defenses hold them off, then build up and strike back.',
    target: '.coach-watch',
    done: (m) => !!m.state.goblinRaidSeen || m.state.stats.raids > 0,
  },
  {
    title: 'Collect what your village made',
    body: 'Tap Collect, or any bubble floating over a mine.',
    target: '.collect-btn',
    done: (m) => m.state.stats.collected > 0,
  },
  {
    title: 'Put up a new building',
    body: 'Open the Shop and drag a building onto clear ground.',
    target: '.shop-btn',
    done: (m) => (m.state.stats.built ?? 0) > 0,
  },
  {
    title: 'Train a troop',
    body: 'Open Army and add a troop. Preparation is free and instant.',
    target: '.train-add',
    done: (m) => (m.state.stats.trained ?? 0) > 0,
  },
  {
    title: 'Raid the valley',
    body: 'Tap Attack! and raid Payback, the first Goblin village.',
    target: '.attack-btn',
    done: (m) => m.state.stats.raids > 0,
  },
];
/**
 * A focused control, identified in a way that survives an innerHTML rebuild:
 * by id, or by its data-action plus its position among controls sharing it
 * (the Army drawer and quest list repeat the same action several times).
 */
type FocusMark = {
  id?: string;
  action?: string;
  index: number;
  selection?: [number, number, 'forward' | 'backward' | 'none'];
};
function focusMark(el: Element | null): FocusMark | null {
  if (!(el instanceof HTMLElement) || el === document.body) return null;
  let selection: FocusMark['selection'];
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    try {
      if (el.selectionStart !== null && el.selectionEnd !== null)
        selection = [el.selectionStart, el.selectionEnd, el.selectionDirection ?? 'none'];
    } catch {
      /* Range and other inputs have no caret. */
    }
  }
  if (el.id) return { id: el.id, index: 0, selection };
  const action = el.dataset.action;
  if (!action) return null;
  const same = Array.from(document.querySelectorAll<HTMLElement>('[data-action]')).filter(
    (other) => other.dataset.action === action,
  );
  return { action, index: Math.max(0, same.indexOf(el)), selection };
}
function restoreFocusMark(mark: FocusMark | null) {
  if (!mark) return;
  let el: HTMLElement | undefined;
  if (mark.id) el = document.getElementById(mark.id) ?? undefined;
  else if (mark.action) {
    const same = Array.from(document.querySelectorAll<HTMLElement>('[data-action]')).filter(
      (other) => other.dataset.action === mark.action,
    );
    el = same[mark.index] ?? same[0];
  }
  if (!el || el === document.activeElement) return;
  el.focus({ preventScroll: true });
  if (mark.selection && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement))
    try {
      el.setSelectionRange(...mark.selection);
    } catch {
      /* Not a text control. */
    }
}
/** Drawer markup split at its stable structure, so an update can replace single tiles. */
type DrawerParts = { open: string; head: string; body: string; items: string[]; foot: string };
/** Elements updateLive() patches, looked up once per rebuild instead of every 250 ms. */
type ArmyShow = 'all' | 'unlocked' | 'ready';
type ArmyFamily = 'all' | 'elixir' | 'dark' | 'super' | 'siege' | 'spells';
/** A troop's catalog family: where it is trained, or a boost for super troops. */
const troopFamily = (kind: TroopKind): Exclude<ArmyFamily, 'all' | 'spells'> =>
  superOriginal(kind)
    ? 'super'
    : troopFacility(kind) === 'workshop'
      ? 'siege'
      : troopFacility(kind) === 'darkbarracks'
        ? 'dark'
        : 'elixir';
type LiveRefs = {
  heroTimers: HTMLElement[];
  helperTimers: HTMLElement[];
  helperJobTimes: HTMLElement[];
  heroGems: HTMLElement[];
  petTimers: HTMLElement[];
  petGems: HTMLElement[];
  nativeHeroCards: HTMLElement[];
  legacyHeroCard: HTMLElement | null;
  trayButtons: HTMLButtonElement[];
  deployLabel: HTMLElement | null;
  resources: HTMLElement[];
  obstacleTimes: HTMLElement[];
  upgrades: HTMLElement[];
  finishes: HTMLElement[];
  research: HTMLElement | null;
  researchCost: HTMLElement | null;
  starBonusStatus: HTMLElement | null;
  boostTimers: HTMLElement[];
  armyCounts: HTMLElement[];
  starBonusButton: HTMLButtonElement | null;
  queue: HTMLElement | null;
  replayTime: HTMLElement | null;
  replayProgress: HTMLInputElement | null;
  battleTimer: HTMLElement | null;
  destructionValue: HTMLElement | null;
  destructionFill: HTMLElement | null;
  battleStars: HTMLElement | null;
  loot: Map<string, HTMLElement>;
  lootBars: Map<string, HTMLElement>;
};
/** Sets text only when it differs, so unchanged values cost no DOM mutation. */
function setText(el: Element | null | undefined, text: string) {
  if (el && el.textContent !== text) el.textContent = text;
}
/** Horizontal fill as a compositor-only transform instead of a layout-triggering width. */
const fillScale = (percent: number) =>
  `scaleX(${(Math.max(0, Math.min(100, Number.isNaN(percent) ? 0 : percent)) / 100).toFixed(4)})`;
/**
 * Static per-stage data, computed per stage on first use rather than on every render. The home
 * screen's campaign badge stops at the first open stage, so boot validates one stage, not 150.
 */
const campaignPendingCache: (boolean | undefined)[] = [];
const campaignPending = (index: number) =>
  (campaignPendingCache[index] ??= nativeCampaignIssues(index).length > 0);
let campaignMapCache: string[] | null = null;
/** The minimap SVG, rendered once per stage into an image URL instead of inline DOM. */
function campaignMapSource(index: number) {
  campaignMapCache ??= [];
  let url = campaignMapCache[index];
  if (url) return url;
  const v = NATIVE_CAMPAIGN[index];
  // Frame the village itself: early bases fill a few tiles of the 48-tile board. The square
  // view keeps at least 14 tiles so a one-building village still reads as a village.
  const shown = v.buildings.filter(([id]) => id !== 1000019);
  const size = (id: number) => NATIVE_COMBAT[id].size;
  const minX = Math.min(...shown.map(([, x]) => x + 2)),
    minY = Math.min(...shown.map(([, , y]) => y + 2)),
    maxX = Math.max(...shown.map(([id, x]) => x + 2 + size(id))),
    maxY = Math.max(...shown.map(([id, , y]) => y + 2 + size(id)));
  const side = shown.length ? Math.max(14, maxX - minX + 3, maxY - minY + 3) : 48;
  const left = shown.length ? (minX + maxX - side) / 2 : 0,
    top = shown.length ? (minY + maxY - side) / 2 : 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${side} ${side}"><rect x="${left}" y="${top}" width="${side}" height="${side}" fill="#637d43"/>${shown
    .map(
      ([id, x, y]) =>
        `<rect x="${x + 2}" y="${y + 2}" width="${NATIVE_COMBAT[id].size - 0.18}" height="${NATIVE_COMBAT[id].size - 0.18}" rx=".25" fill="${id === 1000010 ? '#b9ada0' : id === 1000001 || id === 1000017 || id === 1000069 ? '#f3c346' : '#e0cf97'}"/>`,
    )
    .join('')}</svg>`;
  url =
    typeof URL.createObjectURL === 'function' && typeof Blob === 'function'
      ? URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
      : `data:image/svg+xml,${encodeURIComponent(svg)}`;
  campaignMapCache[index] = url;
  return url;
}
export class HUD {
  private root: HTMLElement;
  private panel: Panel = null;
  private drawerPanel: Drawer = null;
  private tab = 'All';
  /** The decoration whose Stash the context card is asking to confirm. */
  private stashConfirm: number | null = null;
  private inspectedTroop: TroopKind = 'swordsman';
  private inspectedSpell: SpellKind = 'lightning';
  private inspectedSmithHero: HeroKind = 'king';
  private inspectedNativeItem = '';
  private nativeOrePurchase: { slug: string; level: number; gems: number } | null = null;
  private presetNames = new Map<number, string>();
  /** A shared layout link or code waiting to be copied into a slot (pasted or opened). */
  private layoutCode = '';
  private toastTimer?: ReturnType<typeof setTimeout>;
  private resultShown = false;
  private raf = false;
  private pressedActions = new Set<number>();
  /** Hold-to-repeat on Add and Remove: a short delay, then steady repeats until release. */
  private repeatTimer?: ReturnType<typeof setTimeout>;
  private repeatedClick = false;
  private startRepeat(control: HTMLButtonElement) {
    if ((this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly) return;
    this.stopRepeat();
    const action = (control.dataset.action ?? control.dataset.add)!;
    const tick = () => {
      if (!control.isConnected || control.disabled) return this.stopRepeat();
      this.repeatedClick = true;
      this.action(action);
      this.updateLive();
      this.repeatTimer = setTimeout(tick, 110);
    };
    this.repeatTimer = setTimeout(tick, 450);
  }
  private stopRepeat() {
    clearTimeout(this.repeatTimer);
    this.repeatTimer = undefined;
    // The click that follows this release (if any) runs first; later clicks count again.
    if (this.repeatedClick) setTimeout(() => (this.repeatedClick = false), 0);
  }
  private renderPending = false;
  private drawerMarkup = '';
  private modalMarkup = '';
  private hudMarkup = '';
  private contextMarkup = '';
  private lastPanel: Panel = null;
  private lastDrawer: Drawer = null;
  private focusBefore: FocusMark | null = null;
  /** The control that opened the current drawer, focused again when it closes. */
  private drawerLauncher: FocusMark | null = null;
  private drawerBefore: { panel: Drawer; left: number; top: number } | null = null;
  private actionSource: HTMLElement | null = null;
  private dragging = false;
  private liveTimer: ReturnType<typeof setInterval> | undefined;
  private lastAnchorLeft = -1;
  private lastAnchorTop = -1;
  /** The card the last anchor position was written to; a rebuilt card must be placed again. */
  private anchorCard: HTMLElement | null = null;
  private anchorWidth = 470;
  private anchorHeight = 120;
  private anchorFloor = 150;
  private replayScrubbing = false;
  /** When the replay slider last reported an input; the live clock leaves it alone briefly. */
  private replayInputAt = -Infinity;
  private rafId = 0;
  /** Which drawer the current #drawer markup shows, so an update does not replay its slide-in. */
  private renderedDrawer: Drawer = null;
  /** The pieces of the latest drawer markup, and those of the markup now in the DOM. */
  private drawerParts: DrawerParts | null = null;
  private renderedDrawerParts: DrawerParts | null = null;
  /** Every document/window listener is registered against this and removed by destroy(). */
  private readonly listeners = new AbortController();
  /** Element references used by updateLive(); dropped whenever a region is rebuilt. */
  private liveRefs: LiveRefs | null = null;
  private safeInsets: { top: number; right: number; bottom: number; left: number } | null = null;
  private readonly hudEl: HTMLElement;
  private readonly contextEl: HTMLElement;
  private readonly drawerEl: HTMLElement;
  private readonly modalEl: HTMLElement;
  private codeforgeObserver?: MutationObserver;
  private codeforgeTargets: Awaited<ReturnType<typeof attacksApi.targets>> = [];
  private codeforgeActive: Awaited<ReturnType<typeof attacksApi.active>> = [];
  private codeforgeCooldown: Awaited<ReturnType<typeof attacksApi.cooldown>> | null = null;
  private codeforgeAttack: AttackDetail | null = null;
  private codeforgeAttackBusy = false;
  private codeforgeAttackGeneration = 0;
  private codeforgeAttackError = '';
  private codeforgeFocusAttacks = false;
  private codeforgeFocusTopic = false;
  private codeforgePanelMarkup = new WeakMap<HTMLElement, string>();
  private codeforgeTopicId: string | null = null;
  private codeforgeTopicProblems: { topicId: string; items: SolvedHistoryItem[]; total: number } | null = null;
  private codeforgeTopicProblemsBusy = false;
  private codeforgeTopicProblemsError = '';
  private codeforgeTopicProblemsGeneration = 0;
  private codeforgeVillageSnapshot: Readonly<CPVillageSnapshot> = cpVillageStore.getSnapshot();
  private codeforgeUpgradeTopic: string | null = null;
  private codeforgeUpgradeError = '';
  private codeforgeUpgradeNotice = '';
  private codeforgeLayoutBusy = false;
  private codeforgeLayoutError = '';
  private codeforgeLayoutNotice = '';
  private codeforgeLayoutRevision: number | null = null;
  private codeforgeStoreUnsubscribe?: () => void;
  constructor(
    private model: GameModel,
    private scene: VillageScene,
    private audio: AudioManager,
  ) {
    this.root = document.querySelector('#ui')!;
    this.root.innerHTML =
      '<div id="hud"></div><div id="coach-ring" aria-hidden="true" hidden></div><div id="context"></div><div id="drawer"></div><div id="modal-root"></div><div id="toast" role="status" aria-live="polite"></div><div id="save-state" aria-live="polite"></div><div id="map-announcer" class="visually-hidden" aria-live="polite"></div><button class="skip-link" data-action="buildings">Building list (B) · Map cursor (M)</button><div id="safe-probe" aria-hidden="true"></div><input id="import-file" type="file" accept="application/json,.json" hidden><input id="import-replay-file" type="file" accept="application/json,.json" hidden>';
    this.hudEl = this.root.querySelector<HTMLElement>('#hud')!;
    this.contextEl = this.root.querySelector<HTMLElement>('#context')!;
    this.drawerEl = this.root.querySelector<HTMLElement>('#drawer')!;
    this.modalEl = this.root.querySelector<HTMLElement>('#modal-root')!;
    const signal = this.listeners.signal;
    this.codeforgeStoreUnsubscribe = cpVillageStore.subscribe((snapshot) => {
      this.codeforgeVillageSnapshot = snapshot;
      this.renderCodeForgeOutposts();
    });
    window.addEventListener('codeforge:topic-selected', (event) => {
      const topicId = (event as CustomEvent<{ topicId?: string }>).detail?.topicId;
      if (!topicId) return;
      this.codeforgeTopicId = topicId;
      this.codeforgeFocusTopic = true;
      this.action('codeforge');
      void this.loadCodeForgeTopicProblems(topicId);
    }, { signal });
    this.root.addEventListener(
      'click',
      (e) => {
        // An army portrait (data-add) adds as its tile's Add button does.
        const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action], [data-add]');
        // A hold that already repeated its action has done the work of this click.
        if (this.repeatedClick) {
          this.repeatedClick = false;
          if (target?.hasAttribute('data-repeat')) return;
        }
        if (target && !(target as HTMLButtonElement).disabled) {
          this.audio.play('click');
          this.actionSource = target;
          try {
            this.action((target.dataset.action ?? target.dataset.add)!);
          } finally {
            this.actionSource = null;
          }
        }
      },
      { signal },
    );
    this.root.addEventListener(
      'pointerdown',
      (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-action], [data-add]')) this.pressedActions.add(e.pointerId);
        const repeat = target.closest<HTMLButtonElement>('[data-repeat]');
        if (repeat && !repeat.disabled && e.isPrimary) this.startRepeat(repeat);
        if (target.id === 'replay-progress' && this.model.replay) {
          this.replayScrubbing = true;
          this.model.replay.paused = true;
        }
        const card = target.closest<HTMLElement>('[data-drag]');
        // The price button is a tap target; everything else on the tile is a drag handle.
        if (card && !target.closest('button') && e.isPrimary && !(this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly)
          this.beginDrawerDrag(card.dataset.drag as BuildingKind, e);
      },
      { signal },
    );
    const finishScrub = () => {
      if (!this.replayScrubbing) return;
      this.replayScrubbing = false;
      this.scheduleRender();
    };
    document.addEventListener('pointerup', finishScrub, { signal });
    document.addEventListener('pointercancel', finishScrub, { signal });
    const releaseAction = (e: PointerEvent) => {
      this.stopRepeat();
      this.pressedActions.delete(e.pointerId);
      // The browser dispatches click after pointerup; render on the next frame.
      if (!this.pressedActions.size && this.renderPending) this.scheduleRender();
    };
    document.addEventListener('pointerup', releaseAction, { signal });
    document.addEventListener('pointercancel', releaseAction, { signal });
    window.addEventListener(
      'blur',
      () => {
        this.pressedActions.clear();
        if (this.renderPending) this.scheduleRender();
      },
      { signal },
    );
    window.addEventListener(
      'resize',
      () => {
        this.safeInsets = null;
        // The card's size and the HUD floor are measured again on the next frame.
        this.anchorCard = null;
        this.markCoachTarget();
      },
      { signal },
    );
    this.root.addEventListener(
      'change',
      (e) => {
        const t = e.target as HTMLInputElement;
        if (t.id === 'import-file' && t.files?.[0] && !(this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly) void this.import(t.files[0]);
        if (t.id === 'import-replay-file' && t.files?.[0] && !(this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly) void this.importReplay(t.files[0]);
        if (t.id === 'replay-progress' && !(this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly) this.model.seekReplay(Number(t.value));
      },
      { signal },
    );
    this.root.addEventListener(
      'input',
      (e) => {
        const t = e.target as HTMLInputElement;
        if (t.id === 'alchemy-amount') {
          this.alchemyAmount = Number(t.value);
          const { take, out, lost } = this.alchemyPreview();
          setText(this.root.querySelector<HTMLElement>('[data-alchemy-in]'), n(take));
          setText(this.root.querySelector<HTMLElement>('[data-alchemy-out]'), n(out));
          this.root
            .querySelector<HTMLElement>('[data-alchemy-warn]')
            ?.toggleAttribute('hidden', !lost);
        }
        if (t.id === 'replay-progress' && this.model.replay) {
          // Keep the slider mounted while the pointer or keyboard changes its value.
          this.model.replay.paused = true;
          this.replayInputAt = performance.now();
          const time = document.querySelector('#replay-time');
          if (time)
            time.textContent = `${clock(Number(t.value))} / ${clock(this.model.replay.duration)}`;
          t.setAttribute('aria-valuetext', clock(Number(t.value)));
          const status = document.querySelector('.replay-status strong');
          if (status) status.textContent = 'Replay paused';
        }
        if (t.id.startsWith('preset-name-'))
          this.presetNames.set(Number(t.id.slice('preset-name-'.length)), t.value);
        if (t.id === 'layout-code') {
          this.layoutCode = t.value;
          // Re-rendering would drop the caret: update the summary and buttons in place.
          const code = layoutFromLink(t.value) ?? t.value.trim(),
            shared = code ? decodeLayout(code) : null;
          const summary = document.querySelector('.layout-import-summary');
          if (summary) {
            summary.textContent = this.layoutSummary(code, shared);
            summary.classList.toggle('bad', !!code && !shared);
          }
          document
            .querySelectorAll<HTMLButtonElement>('[data-action^="layout-import:"]')
            .forEach((b) => (b.disabled = !shared));
        }
        if (t.id === 'campaign-filter') {
          this.campaignFilter = t.value as typeof this.campaignFilter;
          this.render();
          this.modalEl.querySelector('.campaign-list')?.scrollTo(0, 0);
        }
        if (t.id === 'campaign-section' && t.value) {
          this.campaignFilter = 'all';
          this.render();
          this.scrollToStage(Number(t.value), true);
        }
        if (t.id === 'army-search' || t.id === 'army-show' || t.id === 'army-family') {
          if (t.id === 'army-search') this.armyFilter.query = t.value.slice(0, 40);
          else if (t.id === 'army-show') this.armyFilter.show = t.value as ArmyShow;
          else this.armyFilter.family = t.value as ArmyFamily;
          this.render();
        }
      },
      { signal },
    );
    document.addEventListener('keydown', (e) => this.keydown(e), { signal });
    model.onChange = (passive) => {
      // A refused price the client would offer to complete with gems asks first.
      if (model.shortfall && this.panel !== 'shortfall') return this.show('shortfall');
      return passive ? this.updateLive() : this.scheduleRender();
    };
    watchOfflineStatus(() => {
      if (this.panel === 'settings') this.scheduleRender();
    });
    model.onToast = (m) => this.toast(m);
    scene.onSelect = () => {
      this.panel = null;
      this.drawerPanel = null;
      this.render();
    };
    scene.onVillageObject = (opens) => {
      if ((model as GameModel & { serverReadOnly?: boolean }).serverReadOnly) return;
      if (model.battle) return;
      if (opens === 'trader') return this.show('trader');
      // The Super Troop building lists the boosts: the army's Super troops.
      this.panel = null;
      this.armyFilter = { query: '', show: 'all', family: 'super' };
      if (this.drawerPanel === 'army') this.render();
      else this.showDrawer('army');
    };
    this.render();
    this.liveTimer = setInterval(() => this.updateLive(), 250);
    this.trackAnchor();
  }
  destroy() {
    if (this.liveTimer !== undefined) clearInterval(this.liveTimer);
    if (this.raf) cancelAnimationFrame(this.rafId);
    this.raf = false;
    this.listeners.abort();
    this.codeforgeObserver?.disconnect();
    this.codeforgeStoreUnsubscribe?.();
    this.scene.events?.off(Phaser.Scenes.Events.POST_UPDATE, this.positionContext, this);
  }
  private scheduleRender() {
    if (this.raf) return;
    this.raf = true;
    this.rafId = requestAnimationFrame(() => {
      this.raf = false;
      this.render();
    });
  }
  /** Keeps the building card pinned to its building while the camera moves. */
  private trackAnchor() {
    // Reposition on Phaser's post-update, in the same frame after the camera
    // moved. A standalone rAF loop races Phaser's own frame and trails by one.
    // The HUD is built before Phaser boots the scene, so `events` may not exist yet.
    this.scene.whenBooted(() => {
      this.positionContext();
      this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.positionContext, this);
    });
  }
  /** env(safe-area-inset-*) in pixels, read from a probe element and refreshed on resize. */
  private insets() {
    if (!this.safeInsets) {
      const probe = this.root.querySelector<HTMLElement>('#safe-probe');
      const style = probe ? getComputedStyle(probe) : null;
      const px = (v?: string) => parseFloat(v ?? '') || 0;
      this.safeInsets = {
        top: px(style?.paddingTop),
        right: px(style?.paddingRight),
        bottom: px(style?.paddingBottom),
        left: px(style?.paddingLeft),
      };
    }
    return this.safeInsets;
  }
  positionContext() {
    const card = this.contextEl.querySelector<HTMLElement>('.building-context[data-anchor]');
    if (!card) {
      this.anchorCard = null;
      this.lastAnchorLeft = -1;
      this.lastAnchorTop = -1;
      return;
    }
    // #context is rebuilt with innerHTML: a new card has no inline position yet. Its size and
    // the HUD floor are measured once per card (and per resize): reading them every frame
    // right after the previous frame's position write forced a layout per frame while panning.
    if (card !== this.anchorCard) {
      this.anchorCard = card;
      this.lastAnchorLeft = -1;
      this.lastAnchorTop = -1;
      this.anchorWidth = card.offsetWidth || 470;
      this.anchorHeight = card.offsetHeight || 120;
      this.anchorFloor = card.classList.contains('wall-context')
        ? Math.max(
            150,
            (document.querySelector('.resources')?.getBoundingClientRect().bottom ?? 0) + 8,
          )
        : 150;
    }
    const b = this.model.state.buildings.find((v) => v.id === Number(card.dataset.anchor));
    const o = this.model.selectedObstacle;
    const decoration = this.model.selectedDecoration;
    if (!b && !o && !decoration) return;
    const target = b ?? o ?? decoration!;
    const size = b
      ? BUILDINGS[b.kind].size
      : o
        ? OBSTACLES[o.kind].size
        : DECORATIONS[decoration!.kind].size;
    const p = this.scene.screenFor(target.x + size / 2, target.y + size / 2);
    const width = this.anchorWidth,
      height = this.anchorHeight;
    const inset = this.insets();
    const edgeLeft = Math.max(12, inset.left),
      edgeRight = Math.max(12, inset.right),
      edgeBottom = Math.max(12, inset.bottom);
    const left = Math.min(
      Math.max(width / 2 + edgeLeft, p.x),
      window.innerWidth - width / 2 - edgeRight,
    );
    const hudFloor = this.anchorFloor;
    const minTop = Math.min(
      hudFloor,
      Math.max(Math.max(8, inset.top), window.innerHeight - height - edgeBottom),
    );
    const maxTop = Math.max(
      minTop,
      window.innerHeight - height - (window.innerHeight >= 650 ? 150 + inset.bottom : edgeBottom),
    );
    const top = Math.min(Math.max(minTop, p.y - height - 62), maxTop);
    const leftPx = Math.round(left);
    const topPx = Math.round(top);
    // offsetWidth/offsetHeight force layout: skip style writes when pinned position is unchanged.
    if (leftPx === this.lastAnchorLeft && topPx === this.lastAnchorTop) return;
    this.lastAnchorLeft = leftPx;
    this.lastAnchorTop = topPx;
    card.style.left = `${leftPx}px`;
    card.style.top = `${topPx}px`;
  }
  toast(message: string) {
    const el = document.querySelector<HTMLElement>('#toast')!;
    el.textContent = message;
    el.classList.toggle('show', !!message);
    clearTimeout(this.toastTimer);
    if (message) this.toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }
  private saveOk: boolean | undefined;
  setSaveState(ok: boolean) {
    if (ok === this.saveOk) return;
    this.saveOk = ok;
    document.querySelector('#save-state')!.textContent = ok
      ? ''
      : 'Saving is unavailable. Export your village in Settings.';
  }
  /** Keeps the campaign list's position for the next time it opens. */
  private rememberCampaign() {
    if (this.panel !== 'campaign') return;
    const list = this.modalEl.querySelector<HTMLElement>('.campaign-list');
    if (list) this.campaignScroll = list.scrollTop;
  }
  /** The next village worth attacking: the first open one without a star, else short of three. */
  private nextCampaignStage() {
    const stars = this.model.state.nativeCampaign?.stars ?? [];
    const open = NATIVE_CAMPAIGN.map((_, i) => i).filter(
      (i) => this.model.campaignOpen(i) && !campaignPending(i),
    );
    return open.find((i) => !stars[i]) ?? open.find((i) => (stars[i] ?? 0) < 3) ?? null;
  }
  /** Opens the list where the player left it, or at the next village on a first visit. */
  private positionCampaign() {
    const list = this.modalEl.querySelector<HTMLElement>('.campaign-list');
    if (!list) return;
    if (this.campaignScroll !== null) list.scrollTop = this.campaignScroll;
    else this.scrollToStage(this.nextCampaignStage(), false);
  }
  private scrollToStage(index: number | null, focus: boolean) {
    if (index === null) return;
    const card = this.modalEl.querySelector<HTMLElement>(`#campaign-stage-${index}`);
    const list = this.modalEl.querySelector<HTMLElement>('.campaign-list');
    if (!card || !list) return;
    list.scrollTop += card.getBoundingClientRect().top - list.getBoundingClientRect().top - 8;
    if (focus)
      card.querySelector<HTMLElement>('[data-action^="attack:"]')?.focus({ preventScroll: true });
  }
  private show(panel: Panel) {
    this.rememberCampaign();
    // Another panel replaces an unanswered gem offer.
    if (panel !== 'shortfall') this.model.shortfall = null;
    // The info sheet describes the selected building, so it is the one panel that
    // must survive the cancel that clears placement state.
    const selected = this.model.selected;
    // Mouse/touch activation does not necessarily focus a button (notably in
    // WebKit). Remember the actual launcher before cancellation can redraw it.
    if (panel && !this.panel) {
      this.focusBefore = focusMark(this.actionSource ?? document.activeElement);
      const body = document.querySelector('.drawer-body');
      this.drawerBefore = this.drawerPanel
        ? { panel: this.drawerPanel, left: body?.scrollLeft ?? 0, top: body?.scrollTop ?? 0 }
        : null;
    }
    this.panel = panel;
    if (panel) {
      this.drawerPanel = null;
      this.model.cancel();
      if (panel === 'info') this.model.selected = selected;
    }
    this.render();
  }
  private closePanel() {
    this.rememberCampaign();
    if (this.panel === 'shortfall') this.model.dismissShortfall();
    if (this.panel === 'treasure') this.treasureConfirm = null;
    this.panel = null;
    const previous = this.drawerBefore;
    this.drawerBefore = null;
    if (previous && !this.model.battle) this.drawerPanel = previous.panel;
    this.render();
    const body = document.querySelector('.drawer-body');
    if (body && previous) {
      body.scrollLeft = previous.left;
      body.scrollTop = previous.top;
    }
    this.restoreFocus();
  }
  private showDrawer(drawer: Drawer) {
    // Remember the launcher (the Train or Shop button) so closing the sheet can return to it.
    if (!this.drawerPanel)
      this.drawerLauncher = focusMark(this.actionSource ?? document.activeElement);
    this.drawerPanel = this.drawerPanel === drawer ? null : drawer;
    this.panel = null;
    this.drawerBefore = null;
    if (this.drawerPanel) this.model.cancel();
    this.render();
  }
  private restoreFocus() {
    restoreFocusMark(this.focusBefore);
  }
  private mountCodeForgeAttacks() {
    this.codeforgeObserver?.disconnect();
    let mountedPanel: HTMLElement | null = null;
    const attach = () => {
      if (!this.modalEl.isConnected) return;
      const body = this.modalEl.querySelector<HTMLElement>('.settings-body');
      if (!body) {
        if (!this.modalEl.firstElementChild) this.codeforgeObserver?.disconnect();
        return;
      }
      let panel = body.querySelector<HTMLElement>('.cf-attack-panel');
      let outposts = body.querySelector<HTMLElement>('.cf-outpost-panel');
      if (!panel) {
        panel = document.createElement('section');
        panel.className = 'cf-attack-panel';
        body.append(panel);
        mountedPanel = panel;
      } else if (panel === mountedPanel) return;
      else mountedPanel = panel;
      if (!outposts) {
        outposts = document.createElement('section');
        outposts.className = 'cf-outpost-panel';
        body.insertBefore(outposts, panel);
      }
      this.renderCodeForgeAttacks();
      this.renderCodeForgeOutposts();
      this.renderCodeForgeLayoutControls();
      // Only scroll once the row the tap aimed at exists: scrolling the freshly mounted, still
      // empty panels is what made the popup jump around for its first second.
      if (this.codeforgeFocusTopic && outposts.querySelector('[data-topic-details]')) {
        this.codeforgeFocusTopic = false;
        this.scrollCodeForgeOutpostDetail('start', 'auto');
      }
    };
    this.codeforgeObserver = new MutationObserver(attach);
    this.codeforgeObserver.observe(this.modalEl, { childList: true, subtree: true });
    attach();
  }
  private renderCodeForgeAttacks() {
    const panel = this.modalEl.querySelector<HTMLElement>('.cf-attack-panel');
    if (!panel) return;
    const cooldown = this.codeforgeCooldown;
    const attack = this.codeforgeAttack;
    const pending = !!attack && (attack.pending === true || (attack.pending !== false && ['active', 'in_progress'].includes(attack.status.toLowerCase())));
    this.paintCodeForgePanel(panel, `<h3>Village attacks</h3><p>Challenge another CodeForge village with a Codeforces problem set.</p>${cooldown && !cooldown.can_attack ? `<p role="status">Attacks are on cooldown${cooldown.remaining_seconds != null ? ` · ${Math.ceil(cooldown.remaining_seconds / 60)} min remaining` : ''}${cooldown.next_available_at ? ` · Available ${new Date(cooldown.next_available_at).toLocaleString()}` : ''}.</p>` : ''}${this.codeforgeAttackError ? `<p role="alert">${html(this.codeforgeAttackError)}</p>` : ''}<button class="game-btn stone" data-action="cf-attack-refresh" ${this.codeforgeAttackBusy ? 'disabled' : ''}>${this.codeforgeAttackBusy ? 'Refreshing…' : 'Refresh attacks'}</button>${attack ? `<div class="setting-row"><div><h3>Attack on ${html(attack.target_username || 'opponent village')}</h3><p>${pending ? `Result pending${attack.resolution_state ? ` · ${html(attack.resolution_state.replaceAll('_', ' '))}` : ''}` : `Status: ${html(attack.status)} · Server score: ${n(attack.score)}${attack.solved_fraction == null ? '' : ` · ${Math.round(attack.solved_fraction * 100)}% solved`}`}</p>${attack.problems.map((problem) => { const link = codeforcesProblemUrl(problem); return `<p>${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${html(String(problem.name ?? problem.problem_name ?? problem.problem_id ?? 'Codeforces problem'))}</a>` : html(String(problem.name ?? problem.problem_name ?? problem.problem_id ?? 'Codeforces problem'))}</p>`; }).join('')}</div>${pending ? '<button class="game-btn stone" data-action="cf-attack-refresh">Refresh result</button>' : `<button class="game-btn green" data-action="cf-attack-check" ${this.codeforgeAttackBusy ? 'disabled' : ''}>Check result</button>`}</div>` : ''}<h3>Active attacks</h3>${this.codeforgeActive.length ? this.codeforgeActive.map((item) => `<div class="setting-row"><div><h3>${html(item.id.slice(0, 8))} · ${html(item.status)}</h3><p>${html(item.target_user_id)}</p></div><button class="game-btn blue" data-action="cf-attack-open:${html(item.id)}">Open</button></div>`).join('') : '<p>No active attacks.</p>'}<h3>Available villages</h3>${this.codeforgeTargets.length ? this.codeforgeTargets.map((target) => `<div class="setting-row"><div><h3>${html(target.username)}</h3><p>Defence rating ${n(target.defense_rating)}${target.level == null ? '' : ` · Level ${n(target.level)}`}${target.relative_strength ? ` · ${html(target.relative_strength)}` : ''}</p></div><button class="game-btn orange" data-action="cf-attack-launch:${html(target.id)}" ${this.codeforgeAttackBusy || (!!cooldown && !cooldown.can_attack) ? 'disabled' : ''}>Launch</button></div>`).join('') : '<p>No attack targets are available.</p>'}<a class="game-btn blue" href="/?cp=1&amp;return=%2F">Open full CodeForge workflow</a>`);
  }
  private renderCodeForgeOutposts() {
    const panel = this.modalEl.querySelector<HTMLElement>('.cf-outpost-panel');
    if (!panel) return;
    const snapshot = this.codeforgeVillageSnapshot;
    const topics = snapshot.village?.topics ?? [];
    const wallet = snapshot.outposts?.wallet ?? snapshot.wallet;
    const selected = topics.find((topic) => topic.id === this.codeforgeTopicId) ?? null;
    const outpost = selected && snapshot.outposts?.items.find((item) => item.topic_id === selected.id);
    const stale = snapshot.stale || snapshot.updatedAt === null;
    const progressed = !!selected && (selected.progress_points > 0 || selected.level > 0);
    const maxed = !!outpost && outpost.tier >= 5;
    const costsAvailable = !!outpost && typeof outpost.next_gold_cost === 'number' && typeof outpost.next_elixir_cost === 'number';
    const insufficient = !!outpost && !!wallet && outpost.next_gold_cost !== null && outpost.next_elixir_cost !== null && (wallet.gold < outpost.next_gold_cost || wallet.elixir < outpost.next_elixir_cost);
    const blocked = stale || !selected || !outpost || !wallet || !progressed || maxed || !costsAvailable || insufficient || this.codeforgeUpgradeTopic !== null;
    this.paintCodeForgePanel(panel, `<h3>Topic outposts</h3><p>Topic progress comes from solved problems. Outpost tiers are purchased separately.</p>${snapshot.loading ? '<p role="status">Refreshing village progress…</p>' : ''}${snapshot.stale ? `<p role="status">${html(snapshot.error?.message || 'Progress data is stale. Refresh before upgrading.')}</p>` : ''}${this.codeforgeUpgradeNotice ? `<p role="status">${html(this.codeforgeUpgradeNotice)}</p>` : ''}${this.codeforgeUpgradeError ? `<p role="alert">${html(this.codeforgeUpgradeError)}</p>` : ''}<button class="game-btn stone" data-action="cf-outpost-refresh" ${snapshot.loading ? 'disabled' : ''}>Refresh progress</button>${topics.length ? topics.map((topic) => { const row = snapshot.outposts?.items.find((item) => item.topic_id === topic.id); return `<div class="setting-row"><div><h3>${html(topic.display_name || topic.name)}</h3><p>Topic level ${n(topic.level)} · ${n(topic.progress_points)} solve points · ${Math.round(Number(topic.progress_pct) || 0)}% to next topic level</p>${row ? `<small>Purchased outpost tier ${n(row.tier)}${row.tier < 5 ? ` · Next: ${n(row.next_gold_cost)} gold + ${n(row.next_elixir_cost)} elixir` : ' · Maximum tier'}</small>` : '<small>Outpost purchase data unavailable</small>'}<div class="journey-bar" role="progressbar" aria-label="${html(topic.display_name || topic.name)} solve progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.max(0, Math.min(100, Number(topic.progress_pct) || 0))}"><i style="transform:${fillScale(Number(topic.progress_pct) || 0)}"></i></div></div><button class="game-btn ${this.codeforgeTopicId === topic.id ? 'orange' : 'blue'}" data-action="cf-topic-select:${html(topic.id)}">${this.codeforgeTopicId === topic.id ? 'Selected' : 'Details'}</button></div>`; }).join('') : snapshot.loading ? codeforgeSkeleton(4) : '<p>No topic progress is available yet.</p>'}${selected ? `<div class="setting-row cf-outpost-detail" data-topic-details><div><h3>${html(selected.display_name || selected.name)} outpost</h3><p>Topic level ${n(selected.level)} · ${n(selected.progress_points)} solve points${outpost ? ` · Purchased tier ${n(outpost.tier)}` : ''}</p>${outpost && !maxed ? `<small>Upgrade cost: ${n(outpost.next_gold_cost)} gold + ${n(outpost.next_elixir_cost)} elixir</small>` : ''}${!progressed ? '<small>Earn progress in this topic before upgrading.</small>' : ''}${maxed ? '<small>Maximum outpost tier reached.</small>' : ''}${insufficient ? '<small>Not enough server-reported gold or elixir.</small>' : ''}${!wallet ? '<small>Server wallet unavailable.</small>' : ''}${!outpost ? '<small>Outpost purchase details are unavailable.</small>' : ''}${this.codeforgeTopicProblemsView(selected)}</div><button class="game-btn green" data-action="cf-outpost-upgrade:${html(selected.id)}" ${blocked ? 'disabled' : ''}>${this.codeforgeUpgradeTopic === selected.id ? 'Upgrading…' : 'Upgrade outpost'}</button></div>` : '<p>Select a topic to view its solve progress and purchased outpost tier.</p>'}`);
    this.renderCodeForgeLayoutControls();
  }
  private renderCodeForgeLayoutControls() {
    const panel = this.model.topicOutpostEditMode ? this.root : this.modalEl.querySelector<HTMLElement>('.cf-outpost-panel');
    if (!panel) return;
    const snapshot = this.codeforgeVillageSnapshot;
    const layout = snapshot.layout;
    if (this.model.topicOutpostEditMode && this.codeforgeLayoutRevision !== null && layout?.revision !== this.codeforgeLayoutRevision && !this.codeforgeLayoutBusy) {
      this.model.cancelTopicOutpostEdit();
      this.codeforgeLayoutRevision = null;
      this.codeforgeLayoutError = 'This layout changed elsewhere. Refresh progress and review the latest layout before editing again.';
    }
    const editing = this.model.topicOutpostEditMode;
    const draft = this.model.topicOutpostDraftItems;
    const selected = draft?.find((item) => item.topic_key === this.model.selectedTopicKey);
    const current = panel.querySelector<HTMLElement>('.cf-layout-controls');
    const htmlMarkup = `<section class="cf-layout-controls" aria-label="Topic outpost layout" ${editing ? 'role="region"' : ''}><h3>Outpost layout</h3>${editing ? `<p role="status">${selected ? `Selected: ${html(selected.topic_key)} · Facing ${selected.facing === 'mirrored' ? 'flipped' : 'default'}` : 'Select an outpost on the map.'}</p>${this.codeforgeLayoutError ? `<p role="alert">${html(this.codeforgeLayoutError)}</p>` : ''}${this.codeforgeLayoutNotice ? `<p role="status">${html(this.codeforgeLayoutNotice)}</p>` : ''}<div class="cf-layout-buttons"><button class="game-btn stone" data-action="cf-layout-flip" ${!selected || this.codeforgeLayoutBusy ? 'disabled' : ''}>Flip facing</button><button class="game-btn green" data-action="cf-layout-save" ${!this.model.topicOutpostDraftForSave || snapshot.stale || this.codeforgeLayoutBusy ? 'disabled' : ''}>${this.codeforgeLayoutBusy ? 'Saving…' : 'Save layout'}</button><button class="game-btn stone" data-action="cf-layout-cancel" ${this.codeforgeLayoutBusy ? 'disabled' : ''}>Cancel</button></div>` : '<p>Arrange your topic outposts on the village map.</p><button class="game-btn blue" data-action="cf-layout-edit">Edit layout</button>'}</section>`;
    if (current && current.outerHTML !== htmlMarkup) current.outerHTML = htmlMarkup;
    else panel.insertAdjacentHTML('beforeend', htmlMarkup);
  }
  private async saveCodeForgeLayout() {
    if (this.codeforgeLayoutBusy) return;
    const snapshot = this.codeforgeVillageSnapshot;
    const draft = this.model.topicOutpostDraftForSave;
    if (!draft || !this.model.topicOutpostDraftValid || snapshot.stale || !snapshot.layout || snapshot.layout.revision !== this.codeforgeLayoutRevision) {
      this.codeforgeLayoutError = 'Refresh progress and resolve any layout conflicts before saving.';
      this.renderCodeForgeOutposts();
      return;
    }
    this.codeforgeLayoutBusy = true;
    this.codeforgeLayoutError = '';
    this.codeforgeLayoutNotice = '';
    this.renderCodeForgeOutposts();
    try {
      const response = await cpVillageStore.saveOutpostLayout(draft.items);
      if (!this.model.applyTopicOutpostLayout(response.layout)) throw new Error('The server returned an invalid layout. Refresh progress before trying again.');
      // The model intentionally retains a draft when an applied layout has the same revision.
      // A confirmed server save is the explicit end of this editing session regardless.
      this.model.cancelTopicOutpostEdit();
      this.codeforgeLayoutRevision = null;
      this.codeforgeLayoutNotice = 'Layout saved.';
      this.toast('Outpost layout saved.');
    } catch (cause) {
      this.codeforgeLayoutError = cause instanceof Error ? cause.message : 'Unable to save layout.';
      if (/409|conflict/i.test(this.codeforgeLayoutError)) this.codeforgeLayoutError = 'Layout conflict: refresh progress and review the latest layout before trying again.';
      await cpVillageStore.refresh().catch(() => undefined);
    } finally {
      this.codeforgeLayoutBusy = false;
      if (!this.model.topicOutpostEditMode) this.root.querySelector('.cf-layout-controls')?.remove();
      else this.renderCodeForgeLayoutControls();
    }
  }
  private async upgradeCodeForgeOutpost(topicId: string) {
    this.codeforgeUpgradeTopic = topicId;
    this.codeforgeUpgradeError = '';
    this.codeforgeUpgradeNotice = '';
    this.renderCodeForgeOutposts();
    try {
      await cpVillageStore.upgradeOutpost(topicId);
      this.codeforgeUpgradeNotice = 'Outpost upgraded. Wallet and tier updated from the server.';
    } catch (cause) {
      this.codeforgeUpgradeError = cause instanceof Error ? cause.message : 'Unable to upgrade this outpost.';
      // Refresh authoritative state after errors; the store retains its idempotency key for retry.
      await cpVillageStore.refresh().catch(() => undefined);
    } finally {
      this.codeforgeUpgradeTopic = null;
      this.renderCodeForgeOutposts();
    }
  }
  /**
   * A building (and a Details button) names exactly one topic, so the list it opens
   * holds that topic's solved problems only. The server owns the judge-tag to topic
   * mapping; nothing is filtered here.
   */
  private async loadCodeForgeTopicProblems(topicId: string, append = false) {
    const topic = this.codeforgeVillageSnapshot.village?.topics.find((item) => item.id === topicId);
    if (!topic) return;
    const previous = append && this.codeforgeTopicProblems?.topicId === topicId ? this.codeforgeTopicProblems.items : [];
    const generation = ++this.codeforgeTopicProblemsGeneration;
    this.codeforgeTopicProblemsBusy = true;
    this.codeforgeTopicProblemsError = '';
    this.renderCodeForgeOutposts();
    try {
      const page = await villageApi.solvedHistory(previous.length, CODEFORGE_TOPIC_PROBLEMS_PAGE, topic.name);
      if (generation !== this.codeforgeTopicProblemsGeneration) return;
      this.codeforgeTopicProblems = { topicId, items: [...previous, ...page.items], total: page.total };
    } catch (cause) {
      if (generation !== this.codeforgeTopicProblemsGeneration) return;
      if (!append) this.codeforgeTopicProblems = null;
      this.codeforgeTopicProblemsError = cause instanceof Error ? cause.message : 'Unable to load this topic\u2019s problems.';
    } finally {
      if (generation === this.codeforgeTopicProblemsGeneration) {
        this.codeforgeTopicProblemsBusy = false;
        this.renderCodeForgeOutposts();
        this.scrollCodeForgeOutpostDetail(append ? 'nearest' : 'start', this.codeforgeScrollBehavior());
      }
    }
  }
  /**
   * One DOM write per real change. The popup renders the same panels from several sources
   * (mount, the village snapshot, the attack refresh); rewriting identical markup threw away
   * scroll positions and repainted the list, which is the flicker seen while it loaded.
   */
  private paintCodeForgePanel(panel: HTMLElement, markup: string) {
    if (this.codeforgePanelMarkup.get(panel) === markup) return;
    this.codeforgePanelMarkup.set(panel, markup);
    panel.innerHTML = markup;
  }
  private codeforgeScrollBehavior(): ScrollBehavior {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }
  /**
   * Scrolls the dialog body alone. `scrollIntoView` also scrolled `#ui` and the document, and the
   * content landing mid-animation shifted the target, so the panel visibly jumped.
   */
  private scrollDialogBodyTo(target: HTMLElement | null, align: 'start' | 'nearest', behavior: ScrollBehavior) {
    const scroller = target?.closest<HTMLElement>('.modal-body');
    if (!target || !scroller) return;
    const row = target.getBoundingClientRect();
    const view = scroller.getBoundingClientRect();
    const offset = align === 'start' ? row.top - view.top
      : row.bottom > view.bottom ? row.bottom - view.bottom
      : row.top < view.top ? row.top - view.top : 0;
    if (!offset) return;
    scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + offset), behavior });
  }
  private scrollCodeForgeOutpostDetail(align: 'start' | 'nearest', behavior: ScrollBehavior) {
    this.scrollDialogBodyTo(this.modalEl.querySelector<HTMLElement>('[data-topic-details]'), align, behavior);
  }
  private codeforgeTopicProblemsView(selected: VillageTopic): string {
    const heading = '<h4>Problems in this topic</h4>';
    const slot = (body: string) => `<div class="cf-topic-problems-slot">${body}</div>`;
    if (this.codeforgeTopicProblemsError) return slot(`${heading}<p role="alert">${html(this.codeforgeTopicProblemsError)}</p>`);
    const loaded = this.codeforgeTopicProblems?.topicId === selected.id ? this.codeforgeTopicProblems : null;
    if (!loaded) return slot(`${heading}${this.codeforgeTopicProblemsBusy ? '<p role="status">Loading solved problems…</p>' : '<p>Refresh progress to load this topic\u2019s problems.</p>'}`);
    if (!loaded.items.length)
      return slot(`${heading}<p>No solved problems are recorded for ${html(selected.display_name || selected.name)} yet.</p>`);
    const rows = loaded.items.map((item) => {
      const link = codeforcesSolvedProblemUrl(item.problem_id);
      const label = html(item.problem_id);
      return `<li>${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${label}</a>` : label}${item.rating == null ? '' : `<b>${n(item.rating)}</b>`}<small>${html(new Date(item.solved_at).toLocaleDateString())}</small></li>`;
    }).join('');
    return slot(`${heading}<ol class="cf-topic-problems">${rows}</ol><small>${n(loaded.total)} solved in ${html(selected.display_name || selected.name)}${loaded.total > loaded.items.length ? ` · showing ${n(loaded.items.length)}` : ''}</small>${loaded.total > loaded.items.length ? `<button class="game-btn stone" data-action="cf-topic-problems-more" ${this.codeforgeTopicProblemsBusy ? 'disabled' : ''}>${this.codeforgeTopicProblemsBusy ? 'Loading…' : 'Load more'}</button>` : ''}`);
  }
  private async refreshCodeForgeAttacks() {
    if (this.codeforgeAttackBusy) return;
    const generation = ++this.codeforgeAttackGeneration;
    const selectedId = this.codeforgeAttack?.id ?? null;
    this.codeforgeAttackBusy = true;
    this.codeforgeAttackError = '';
    this.renderCodeForgeAttacks();
    try {
      [this.codeforgeTargets, this.codeforgeActive, this.codeforgeCooldown] = await Promise.all([
        attacksApi.targets(), attacksApi.active(), attacksApi.cooldown(),
      ]);
      if (selectedId) {
        const detail = await attacksApi.detail(selectedId);
        if (generation === this.codeforgeAttackGeneration && this.codeforgeAttack?.id === selectedId) this.codeforgeAttack = detail;
      }
    } catch (cause) {
      if (generation === this.codeforgeAttackGeneration) this.codeforgeAttackError = cause instanceof Error ? cause.message : 'Unable to refresh attacks.';
    } finally {
      if (generation === this.codeforgeAttackGeneration) {
        this.codeforgeAttackBusy = false;
        this.renderCodeForgeAttacks();
        // An attack tapped from the village scrolls to its panel once the panel has the result,
        // not while the dialog is still fading in empty.
        if (this.codeforgeFocusAttacks) {
          this.codeforgeFocusAttacks = false;
          this.scrollDialogBodyTo(this.modalEl.querySelector<HTMLElement>('.cf-attack-panel'), 'start', 'auto');
        }
      }
    }
  }
  private async openCodeForgeAttack(id: string) {
    if (this.codeforgeAttackBusy) return;
    const generation = ++this.codeforgeAttackGeneration;
    this.codeforgeAttackBusy = true;
    this.codeforgeAttack = null;
    this.renderCodeForgeAttacks();
    try { const detail = await attacksApi.detail(id); if (generation === this.codeforgeAttackGeneration) { this.codeforgeAttack = detail; this.codeforgeAttackError = ''; } }
    catch (cause) { if (generation === this.codeforgeAttackGeneration) this.codeforgeAttackError = cause instanceof Error ? cause.message : 'Unable to load attack.'; }
    finally { if (generation === this.codeforgeAttackGeneration) { this.codeforgeAttackBusy = false; this.renderCodeForgeAttacks(); } }
  }
  private async launchCodeForgeAttack(targetId: string) {
    if (this.codeforgeAttackBusy) return;
    const generation = ++this.codeforgeAttackGeneration;
    this.codeforgeAttackBusy = true;
    this.codeforgeAttackError = '';
    this.renderCodeForgeAttacks();
    try {
      const created = await attacksApi.launch(targetId);
      const detail = await attacksApi.detail(created.id);
      if (generation !== this.codeforgeAttackGeneration) return;
      this.codeforgeAttack = detail;
      [this.codeforgeTargets, this.codeforgeActive, this.codeforgeCooldown] = await Promise.all([
        attacksApi.targets(), attacksApi.active(), attacksApi.cooldown(),
      ]);
    } catch (cause) { if (generation === this.codeforgeAttackGeneration) this.codeforgeAttackError = cause instanceof Error ? cause.message : 'Unable to launch attack.'; }
    finally { if (generation === this.codeforgeAttackGeneration) { this.codeforgeAttackBusy = false; this.renderCodeForgeAttacks(); } }
  }
  private async resolveCodeForgeAttack() {
    if (this.codeforgeAttackBusy) return;
    if (!this.codeforgeAttack) return;
    const id = this.codeforgeAttack.id;
    const generation = ++this.codeforgeAttackGeneration;
    this.codeforgeAttackBusy = true;
    this.codeforgeAttackError = '';
    this.renderCodeForgeAttacks();
    try {
      const detail = await attacksApi.detail(id);
      if (generation === this.codeforgeAttackGeneration && this.codeforgeAttack?.id === id) this.codeforgeAttack = detail;
    } catch (cause) { if (generation === this.codeforgeAttackGeneration) this.codeforgeAttackError = cause instanceof Error ? cause.message : 'Unable to refresh attack result.'; }
    finally { if (generation === this.codeforgeAttackGeneration) { this.codeforgeAttackBusy = false; this.renderCodeForgeAttacks(); } }
  }
  /**
   * Picks a building up out of the shop drawer and follows the pointer onto the
   * map, dropping it where the pointer is released. Releasing over the drawer
   * keeps the building armed for a plain tap instead.
   */
  private beginDrawerDrag(kind: BuildingKind, event: PointerEvent) {
    if ((this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly) return;
    // Pressing a tile to drag (or to scroll the sheet) never opens the gem offer.
    this.model.beginBuild(kind, false);
    if (!this.model.placement) return;
    this.dragging = true;
    document.querySelector('#drawer')?.classList.add('dragging');
    this.scene.trackGhost(event.clientX, event.clientY);
    const move = (e: PointerEvent) => this.scene.trackGhost(e.clientX, e.clientY);
    const up = (e: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      this.dragging = false;
      this.scene.releaseGhost();
      if (e.type === 'pointercancel') {
        this.model.cancel();
        this.drawerPanel = null;
        this.render();
        return;
      }
      const overDrawer = document
        .elementFromPoint(e.clientX, e.clientY)
        // Only controls count as "over the HUD": releasing over an info panel (which
        // now catches taps itself) still drops the building on the village beneath.
        ?.closest('#drawer, #hud button, #hud input, .modal-backdrop');
      if (overDrawer) {
        // Treated as a plain pick-up: close the sheet and let them tap the map.
        this.drawerPanel = null;
      } else {
        const g = this.scene.gridAtScreen(e.clientX, e.clientY);
        if (!this.scene.placeBuilding(Math.floor(g.x), Math.floor(g.y))) this.drawerPanel = null;
      }
      this.render();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    this.render();
  }
  private action(a: string) {
    const [verb, arg] = a.split(':');
    const m = this.model;
    // Server-backed villages are read-only. Keep navigation, camera, selection and
    // explanatory panels available, but never dispatch a local mutation.
    if ((m as GameModel & { serverReadOnly?: boolean }).serverReadOnly) {
      const allowed = new Set([
        'close', 'settings', 'sound', 'music', 'motion', 'battery', 'haptics',
        'zoom-in', 'zoom-out', 'recenter', 'info', 'help',
        'cancel', 'settings-server-workflows', 'select-building', 'codeforge',
        'cf-attack-refresh', 'cf-attack-open', 'cf-attack-check', 'cf-attack-launch',
        'cf-topic-select', 'cf-topic-problems-more', 'cf-outpost-upgrade', 'cf-outpost-refresh', 'cf-layout-edit', 'cf-layout-save', 'cf-layout-cancel', 'cf-layout-flip',
      ]);
      if (!allowed.has(verb)) return;
      if (verb === 'settings-server-workflows') {
        window.location.assign('/?cp=1&return=%2F');
        return;
      }
    }
    switch (verb) {
      case 'codeforge':
        if (!this.codeforgeFocusTopic) this.codeforgeFocusAttacks = true;
        openCodeForgeDialog(this.modalEl);
        this.mountCodeForgeAttacks();
        void cpVillageStore.start();
        void this.refreshCodeForgeAttacks();
        if (this.codeforgeTopicId && this.codeforgeTopicProblems?.topicId !== this.codeforgeTopicId)
          void this.loadCodeForgeTopicProblems(this.codeforgeTopicId);
        break;
      case 'cf-attack-refresh':
        void this.refreshCodeForgeAttacks();
        break;
      case 'cf-attack-open':
        void this.openCodeForgeAttack(arg);
        break;
      case 'cf-attack-launch':
        void this.launchCodeForgeAttack(arg);
        break;
      case 'cf-attack-check':
        void this.resolveCodeForgeAttack();
        break;
      case 'cf-topic-select':
        this.codeforgeTopicId = arg;
        this.codeforgeUpgradeError = '';
        this.renderCodeForgeOutposts();
        void this.loadCodeForgeTopicProblems(arg);
        break;
      case 'cf-topic-problems-more':
        if (this.codeforgeTopicId) void this.loadCodeForgeTopicProblems(this.codeforgeTopicId, true);
        break;
      case 'cf-outpost-upgrade':
        void this.upgradeCodeForgeOutpost(arg);
        break;
      case 'cf-outpost-refresh':
        this.codeforgeUpgradeError = '';
        this.codeforgeUpgradeNotice = '';
        void cpVillageStore.refresh();
        if (this.codeforgeTopicId) void this.loadCodeForgeTopicProblems(this.codeforgeTopicId);
        break;
      case 'cf-layout-edit':
        this.codeforgeLayoutError = '';
        this.codeforgeLayoutNotice = '';
        if (m.beginTopicOutpostEdit(m.selectedTopicKey ?? undefined)) {
          this.codeforgeLayoutRevision = this.codeforgeVillageSnapshot.layout?.revision ?? null;
          this.modalEl.querySelector<HTMLElement>('[data-codeforge-close]')?.click();
          requestAnimationFrame(() => (document.querySelector<HTMLElement>('#game canvas, canvas')?.focus({ preventScroll: true })));
        }
        this.renderCodeForgeLayoutControls();
        break;
      case 'cf-layout-cancel':
        m.cancelTopicOutpostEdit();
        this.codeforgeLayoutRevision = null;
        this.codeforgeLayoutError = '';
        this.renderCodeForgeOutposts();
        this.root.querySelector('.cf-layout-controls')?.remove();
        break;
      case 'cf-layout-flip':
        m.flipSelectedTopicOutpost();
        this.renderCodeForgeLayoutControls();
        break;
      case 'cf-layout-save':
        void this.saveCodeForgeLayout();
        break;
      case 'blacksmith':
        this.show('blacksmith');
        break;
      case 'equipment-view':
        // Classic King item links open the King's own gear, the record battles carry.
        if (!validEquipmentKind(arg)) break;
        this.nativeOrePurchase = null;
        this.inspectedSmithHero = 'king';
        this.inspectedNativeItem = LEGACY_ITEM[arg];
        this.show('blacksmith');
        break;
      case 'blacksmith-hero':
        this.nativeOrePurchase = null;
        this.inspectedSmithHero = (HERO_KINDS as string[]).includes(arg)
          ? (arg as HeroKind)
          : 'king';
        this.show('blacksmith');
        break;
      case 'native-item':
      case 'native-slot':
        this.nativeOrePurchase = null;
        if (validItem(arg)) this.inspectedSmithHero = itemHero(arg);
        this.inspectedNativeItem = arg;
        this.show('blacksmith');
        break;
      case 'native-equip': {
        const [slug, rawSlot] = arg.split(',');
        if (Number(rawSlot) <= 1) m.equipItem(this.inspectedSmithHero, slug, Number(rawSlot));
        break;
      }
      case 'native-upgrade': {
        const [slug, rawLevel] = arg.split(','),
          level = Number(rawLevel);
        if (!m.blacksmith) break;
        if (m.gear.levels[slug] !== level) break;
        const cost = itemUpgradeCost(slug, level);
        if (!cost) break;
        const gems = ORE_KEYS.reduce(
          (sum, k) => sum + Math.max(0, cost[k] - m.ores[k]) * ORES[k].gems,
          0,
        );
        if (gems > 0) {
          this.nativeOrePurchase = { slug, level, gems };
          this.show('blacksmith');
        } else if (m.upgradeItem(slug, level)) this.audio.play('build');
        break;
      }
      case 'native-ore-buy': {
        const purchase = this.nativeOrePurchase;
        this.nativeOrePurchase = null;
        if (purchase && m.upgradeItem(purchase.slug, purchase.level, purchase.gems))
          this.audio.play('build');
        this.show('blacksmith');
        break;
      }
      case 'native-ore-cancel':
        this.nativeOrePurchase = null;
        this.show('blacksmith');
        break;
      case 'epic-buy':
        m.buyEpicItem(arg);
        break;
      case 'close':
        this.closePanel();
        break;
      case 'treasure-pack': {
        const [resource, share] = arg.split(',');
        const pack = TREASURE_PACKS.find(
          (p) => p.resource === resource && p.share === Number(share),
        );
        if (!pack || m.battle) break;
        this.treasureConfirm = { resource: pack.resource, share: pack.share };
        this.show('treasure');
        break;
      }
      case 'treasure-buy': {
        const p = this.treasureConfirm;
        if (p && m.buyResourcePack(p.resource, p.share))
          this.audio.effect(
            p.resource === 'gold'
              ? 'Collect Gold'
              : p.resource === 'dark'
                ? 'Collect Dark Elixir'
                : 'Collect Elixir',
            'collect',
          );
        this.closePanel();
        break;
      }
      case 'shortfall-buy': {
        const bought = m.buyShortfall();
        this.closePanel();
        // A bought building or decoration is in hand: the village needs to be clear to place it.
        if (bought && (m.placement || m.decorationPlacement)) {
          this.drawerPanel = null;
          this.render();
        }
        if (bought) this.audio.play('build');
        break;
      }
      case 'wall-move':
        m.beginWallMove();
        break;
      case 'sweeper-rotate':
        m.rotateSweeper();
        break;
      case 'skeleton-mode':
        m.toggleSkeletonMode();
        break;
      case 'inferno-mode':
        this.model.toggleInfernoMode();
        break;
      case 'spell-tower-weapon':
        this.model.cycleSpellTowerWeapon();
        break;
      case 'xbow-mode':
        this.model.toggleXbowMode();
        break;
      case 'merge': {
        const [result, anchor] = arg.split('.');
        if (m.merge(result as MergedKind, Number(anchor))) this.audio.play('build');
        break;
      }
      case 'guardian-next': {
        const current = m.townhall?.guardian ?? 'longshot';
        m.selectGuardian(
          GUARDIAN_KINDS[(GUARDIAN_KINDS.indexOf(current) + 1) % GUARDIAN_KINDS.length],
        );
        break;
      }
      case 'guardian-upgrade':
        if (m.upgradeGuardian()) this.audio.play('build');
        break;
      case 'supercharge':
        if (m.supercharge(Number(arg))) this.audio.play('build');
        break;
      case 'gear-up':
        if (m.gearUp(Number(arg))) this.audio.play('build');
        break;
      case 'th-weapon':
        if (m.upgradeTownHallWeapon(Number(arg))) this.audio.play('build');
        break;
      case 'spelltower-mode':
        this.model.cycleSpellTowerMode();
        break;
      case 'gear-mode':
        this.model.toggleGearMode();
        break;
      case 'wall-rotate':
        m.rotateWallMove();
        break;
      case 'wall-place':
        if (m.confirmWallMove()) this.audio.play('build');
        break;
      case 'wall-row':
        m.selectWallRow();
        break;
      case 'wall-single':
        m.selectSingleWall();
        break;
      case 'wall-count':
        m.adjustWallSelection(Number(arg));
        break;
      case 'wall-info-upgrade':
        m.upgradeWalls([Number(arg)], 'gold');
        break;
      case 'wall-upgrade':
        m.upgradeWalls(
          m.selectedWalls.map((b) => b.id),
          arg as 'gold' | 'elixir',
        );
        break;
      case 'obstacle-shovel':
        m.shovelObstacle(Number(arg));
        break;
      case 'obstacle-move':
        m.moveObstacle(Number(arg));
        break;
      case 'obstacle-remove':
        m.removeObstacle(Number(arg));
        break;
      case 'obstacle-cancel':
        m.cancelObstacleRemoval(Number(arg));
        break;
      case 'obstacle-finish':
        m.finishObstacleRemoval(Number(arg));
        break;
      case 'close-drawer':
        this.drawerPanel = null;
        this.render();
        break;
      case 'heroes':
        this.show('heroes');
        break;
      case 'journey':
        this.show('journey');
        break;
      case 'magic-items':
        this.show('magic-items');
        break;
      case 'treasury':
        this.show('treasury');
        break;
      case 'starter':
        this.show('starter');
        break;
      case 'treasury-collect':
        this.model.collectTreasury();
        break;
      case 'trader':
        this.show('trader');
        break;
      case 'trader-buy':
        m.buyDeal(arg);
        this.render();
        break;
      case 'starter-claim':
        m.claimStarterTier(Number(arg));
        this.render();
        break;
      case 'item-sell':
        m.sellMagicItem(arg);
        this.render();
        break;
      case 'item-rune':
        m.useRune(arg);
        this.render();
        break;
      case 'item-potion':
        m.usePotion(arg);
        this.render();
        break;
      case 'book-building':
      case 'book-research':
      case 'book-hero':
      case 'book-pet': {
        const target =
          verb === 'book-building'
            ? { building: Number(arg) }
            : verb === 'book-research'
              ? { research: true as const }
              : verb === 'book-pet'
                ? { pet: true as const }
                : { hero: arg as HeroKind };
        const book = m.booksFor(target)[0];
        if (book) m.useBook(book, target);
        this.render();
        break;
      }
      case 'hammer-building':
        m.useHammer('hammer-of-building', { building: Number(arg) });
        break;
      case 'hammer-research':
        m.useHammer(isSpellKind(arg) ? 'hammer-of-spells' : 'hammer-of-fighting', {
          research: arg as ResearchKind,
        });
        this.render();
        break;
      case 'hammer-hero':
        m.useHammer('hammer-of-heroes', { hero: arg as HeroKind });
        this.render();
        break;
      case 'hammer-pet':
        m.useHammer('hammer-of-heroes', { pet: arg as PetKind });
        this.render();
        break;
      case 'wall-ring':
        m.useWallRing(Number(arg));
        break;
      case 'super-potion':
        m.useSuperPotion(arg as TroopKind);
        this.render();
        break;
      case 'crafting':
        this.craftingStation = Number(arg);
        this.show('crafting');
        break;
      case 'helpers':
        this.show('helpers');
        break;
      case 'helper-buy':
        if ((HELPER_KINDS as readonly string[]).includes(arg) && m.buyHelper(arg as HelperKind))
          this.audio.play('build');
        break;
      case 'helper-repeat':
        if ((HELPER_KINDS as readonly string[]).includes(arg)) {
          const kind = arg as HelperKind;
          this.helperRepeat[kind] = !this.helperRepeat[kind];
          this.render();
        }
        break;
      case 'alchemy-from':
      case 'alchemy-to':
        if ((CONVERT_RESOURCES as readonly string[]).includes(arg)) {
          const r = arg as ConvertResource;
          if (verb === 'alchemy-from') {
            this.alchemyFrom = r;
            this.alchemyAmount = null;
            if (this.alchemyTo === r) this.alchemyTo = CONVERT_RESOURCES.find((v) => v !== r)!;
          } else if (r !== this.alchemyFrom) this.alchemyTo = r;
          this.render();
        }
        break;
      case 'alchemy-convert':
        if (m.convertResources(this.alchemyFrom, this.alchemyTo, this.alchemyTake())) {
          this.alchemyAmount = null;
          this.audio.play('collect');
        }
        break;
      case 'helper-stop':
        if ((HELPER_KINDS as readonly string[]).includes(arg))
          m.stopHelperRepeat(arg as HelperKind);
        break;
      case 'helper-assign': {
        const [kind, id] = [arg.slice(0, arg.indexOf('.')), arg.slice(arg.indexOf('.') + 1)];
        if (!(HELPER_KINDS as readonly string[]).includes(kind)) break;
        const job = m.helperJobs(kind as HelperKind).find((j) => helperJobId(j.target) === id);
        if (
          job &&
          m.assignHelper(kind as HelperKind, job.target, this.helperRepeat[kind as HelperKind])
        )
          this.audio.play('build');
        break;
      }
      case 'craft-choose':
        if (this.craftingStation !== null && validCraftedKind(arg))
          m.chooseCrafted(this.craftingStation, arg);
        break;
      case 'craft-module': {
        const [kind, module] = arg.split('-');
        if (this.craftingStation !== null && validCraftedKind(kind))
          if (m.upgradeCraftedModule(this.craftingStation, kind, Number(module)))
            this.audio.play('build');
        break;
      }
      case 'journey-claim':
        m.claimJourney(Number(arg));
        break;
      case 'book-of-heroes':
        if ((HERO_KINDS as string[]).includes(arg)) m.useBookOfHeroes(arg as HeroKind);
        break;
      case 'progression':
        this.show('progression');
        break;
      case 'hero-upgrade':
        if (
          arg && (HERO_KINDS as string[]).includes(arg)
            ? m.upgradeRosterHero(arg as HeroKind)
            : m.upgradeHero()
        )
          this.audio.effect('Start Hero Upgrade', 'build');
        break;
      case 'hero-finish':
        if (arg && (HERO_KINDS as string[]).includes(arg)) m.finishRosterHero(arg as HeroKind);
        else m.finishHero();
        break;
      case 'hero-lineup': {
        if (!(HERO_KINDS as string[]).includes(arg)) break;
        const kind = arg as HeroKind;
        if (!m.heroProgress(kind)) break;
        const current = m.heroLineup;
        if (current.includes(kind)) break;
        // The lineup always refills from ready heroes in roster order, so benching is
        // expressed as swapping: append when a slot is free, otherwise take the last slot.
        const next =
          current.length < m.heroSlotCount ? [...current, kind] : [...current.slice(0, -1), kind];
        if (!m.setHeroLineup(next)) m.notify('That hero cannot join the lineup right now.');
        break;
      }
      case 'pets':
        this.show('pets');
        break;
      case 'pet-research':
        if (validPet(arg)) m.researchPet(arg);
        break;
      case 'pet-finish':
        m.finishPetResearch();
        break;
      case 'pet-assign': {
        const [pet, hero] = arg.split(',');
        if (!validPet(pet)) break;
        if (hero === 'none') {
          const current = Object.entries(m.petProgress.assigned).find(([, p]) => p === pet)?.[0];
          if (current) m.assignPet(current as HeroKind, null);
        } else if ((HERO_KINDS as string[]).includes(hero)) {
          // Assigning an already-assigned pet moves it; the model enforces one pet per hero.
          const current = Object.entries(m.petProgress.assigned).find(([, p]) => p === pet)?.[0];
          if (current === hero) break;
          m.assignPet(hero as HeroKind, pet as PetKind);
        }
        break;
      }
      case 'hero-select': {
        // Native battles (v51+) carry the whole roster; legacy battles carry one King.
        if (arg && (HERO_KINDS as string[]).includes(arg)) {
          const kind = arg as HeroKind;
          const hero = m.battle?.nativeHeroes?.find((h) => h.kind === kind);
          if (!hero) break;
          if (hero.unitId === null) m.selectNativeHero(kind);
          else void m.activateNativeHeroAbility(kind);
          break;
        }
        if (m.battle?.nativeHeroes?.length) {
          const heroes = m.battle.nativeHeroes;
          const ready = heroes.filter((h) => {
            const unit = m.battle!.units.find((u) => u.id === h.unitId);
            return h.unitId === null || (!!unit && unit.hp > 0 && !h.abilityUsed);
          });
          if (!ready.length) break;
          // H cycles through ready heroes; a second press on a deployed hero fires its ability.
          const current = heroes.find((h) => h.kind === m.activeHeroKind);
          const currentUnit = m.battle.units.find((u) => u.id === current?.unitId);
          if (
            current &&
            current.unitId !== null &&
            currentUnit &&
            currentUnit.hp > 0 &&
            !current.abilityUsed
          ) {
            void m.activateNativeHeroAbility(current.kind);
            break;
          }
          const at = current ? ready.findIndex((h) => h.kind === current.kind) : -1;
          const next = ready[(at + 1) % ready.length];
          if (next.unitId === null) m.selectNativeHero(next.kind);
          else void m.activateNativeHeroAbility(next.kind);
          break;
        }
        if (!m.battle?.hero) break;
        if (m.battle.hero.unitId === null) {
          m.activeHero = true;
          m.activeHeroKind = null;
          m.activeSpell = null;
          m.changed();
        } else m.activateHeroAbility();
        break;
      }
      case 'shop':
        this.tab = 'All';
        this.showDrawer('shop');
        break;
      case 'army':
        this.showDrawer('army');
        break;
      case 'builders':
        this.show('builders');
        break;
      case 'builder-option': {
        // Each tap shows the next building of the group, as the original cycles them.
        const [kind, level] = arg.split(',');
        const menu = builderMenu(m);
        const option = [...menu.suggested, ...menu.other].find(
          (o) => o.kind === kind && o.level === Number(level),
        );
        if (!option || m.battle) break;
        if (!option.ids.length) {
          // A new building: the Shop, on its own tab.
          this.panel = null;
          this.tab = BUILDINGS[option.kind].category;
          this.showDrawer('shop');
          break;
        }
        const turn = (this.builderTurns.get(arg) ?? -1) + 1;
        this.builderTurns.set(arg, turn);
        this.action(`select-building:${option.ids[turn % option.ids.length]}`);
        break;
      }
      case 'builder-hut':
        this.panel = null;
        this.tab = 'All';
        this.showDrawer('shop');
        break;
      case 'select-building': {
        const id = Number(arg);
        if (!m.state.buildings.some((v) => v.id === id) || m.battle) break;
        this.panel = null;
        m.cancel();
        m.selected = id;
        this.scene.focusBuilding(id);
        m.changed();
        this.render();
        this.contextEl
          .querySelector<HTMLElement>('.building-context [data-action="info"]')
          ?.focus();
        break;
      }
      case 'buildings':
        this.show('buildings');
        break;
      case 'campaign-scout':
        this.scoutedStage = Math.max(0, Math.min(NATIVE_CAMPAIGN.length - 1, Number(arg) || 0));
        this.show('campaign-scout');
        break;
      case 'campaign-continue':
        this.scrollToStage(this.nextCampaignStage(), true);
        break;
      case 'army-filter-clear':
        this.armyFilter = { query: '', show: 'all', family: 'all' };
        this.render();
        break;
      case 'army-jump': {
        if (arg !== 'troops' && arg !== 'spells') break;
        const body = document.querySelector<HTMLElement>('.army-strip');
        const tile = body?.querySelector<HTMLElement>(`[data-army-category="${arg}"]`);
        if (body && tile) {
          const left =
            body.scrollLeft +
            tile.getBoundingClientRect().left -
            body.getBoundingClientRect().left -
            parseFloat(getComputedStyle(body).paddingLeft);
          body.scrollTo({
            left,
            behavior: m.reducedMotion ? 'instant' : 'smooth',
          });
        }
        break;
      }
      case 'troop-info':
        this.inspectedTroop = arg as TroopKind;
        this.show('troop-info');
        break;
      case 'spell-info':
        this.inspectedSpell = arg as SpellKind;
        this.show('spell-info');
        break;
      case 'research-view':
        this.show('research');
        document
          .querySelector(`[data-research-kind="${arg}"]`)
          ?.scrollIntoView({ block: 'nearest' });
        break;
      case 'research':
        this.show('research');
        break;
      case 'research-start': {
        const idle = !m.state.research;
        m.research(arg as ResearchKind);
        if (idle && m.state.research) this.audio.effect('Troop Upgrade Start', 'build');
        break;
      }
      case 'research-finish':
        m.finishResearch();
        break;
      case 'train-five':
        m.train(arg as TroopKind, 5);
        break;
      case 'brew':
        // The model announces the change; its scheduled render covers the drawer.
        m.brew(arg as SpellKind);
        break;
      case 'brew-five':
        m.brew(arg as SpellKind, 5);
        break;
      case 'army-presets':
        this.show('army-presets');
        break;
      case 'cookbook':
        this.show('cookbook');
        break;
      case 'recipe-use':
        m.useArmyRecipe(arg);
        break;
      case 'guide-skip':
        m.skipPracticeGuide();
        break;
      case 'attack-guided':
        m.startCampaign(Number(arg), true);
        if (m.battle) {
          this.panel = null;
          this.drawerPanel = null;
          this.resultShown = false;
          this.audio.play('deploy');
        }
        this.render();
        break;
      case 'recipe-save': {
        const [id, slot] = arg.split(',');
        m.saveArmyRecipe(id, slot === undefined ? undefined : Number(slot));
        break;
      }
      case 'battle-log':
        this.show('battle-log');
        break;
      case 'preset-save': {
        const slot = Number(arg);
        m.saveArmyPreset(
          slot,
          document.querySelector<HTMLInputElement>(`#preset-name-${arg}`)?.value,
        );
        const saved = m.state.armyPresets?.[slot];
        if (saved) this.presetNames.set(slot, saved.name);
        break;
      }
      case 'preset-load':
        m.loadArmyPreset(Number(arg));
        break;
      case 'remove-troop':
        m.removeTroop(arg as TroopKind);
        break;
      case 'remove-spell':
        m.removeSpell(arg as SpellKind);
        break;
      case 'remove-all-troop':
        m.removeTroop(arg as TroopKind, Infinity);
        break;
      case 'remove-all-spell':
        m.removeSpell(arg as SpellKind, Infinity);
        break;
      case 'train-fill':
        m.fillTroop(arg as TroopKind);
        break;
      case 'brew-fill':
        m.fillSpell(arg as SpellKind);
        break;
      case 'clear-army':
        m.clearArmy();
        break;
      case 'replay':
        if (m.startReplay(Number(arg))) {
          clearTimeout(this.toastTimer);
          document.querySelector('#toast')?.classList.remove('show');
          this.panel = null;
          this.drawerPanel = null;
          this.resultShown = false;
          this.render();
        }
        break;
      case 'replay-pause':
        m.toggleReplay();
        break;
      case 'battle-speed':
        m.cycleBattleSpeed();
        break;
      case 'replay-speed':
        m.setReplaySpeed(Number(arg));
        break;
      case 'replay-restart':
        m.restartReplay();
        break;
      case 'replay-jump':
        if (m.replay) m.seekReplay(m.replay.time + Number(arg));
        break;
      case 'replay-skip':
        m.skipReplayScouting();
        break;
      case 'replay-export': {
        try {
          const data = m.replayRecording(arg ? Number(arg) : undefined);
          if (data) void deliverFile(replayFileText(data), REPLAY_FILE_NAME, 'CodeForge replay');
          else this.toast('This recording is no longer available.');
        } catch (error) {
          this.toast(error instanceof Error ? error.message : 'Could not export this replay.');
        }
        break;
      }
      case 'replay-import':
        document.querySelector<HTMLInputElement>('#import-replay-file')!.click();
        break;
      case 'replay-exit': {
        const raid = m.goblinRaid;
        m.returnHome();
        this.resultShown = false;
        // The opening raid hands back to the coach; other replays return to the log.
        if (raid) {
          this.panel = null;
          this.render();
        } else this.show('battle-log');
        break;
      }
      case 'goblin-raid':
        m.watchGoblinRaid();
        this.panel = null;
        this.drawerPanel = null;
        this.render();
        break;
      case 'ladder':
        m.startLadder();
        if (m.battle) {
          this.panel = null;
          this.drawerPanel = null;
          this.resultShown = false;
          this.audio.play('deploy');
        }
        this.render();
        break;
      case 'practice':
        m.startBattle(0, true);
        if (m.battle) {
          this.panel = null;
          this.drawerPanel = null;
          this.resultShown = false;
        }
        this.render();
        break;
      case 'raid-again': {
        const battle = m.battle;
        if (!battle?.finished) break;
        m.returnHome();
        if (!battle.practice && !m.retrain()) {
          this.resultShown = false;
          this.showDrawer('army');
          break;
        }
        // Another ladder match meets a new opponent, not the one just fought.
        if (battle.ladder) m.startLadder();
        else m.startBattle(battle.index, battle.practice, battle.catalog);
        this.resultShown = false;
        this.panel = null;
        this.render();
        break;
      }
      case 'retrain':
        m.retrain();
        break;
      case 'campaign':
        this.show('campaign');
        break;
      case 'settings':
        this.show('settings');
        break;
      case 'star-bonus':
        this.model.collectStarBonus();
        return;
      case 'achievements':
        this.show('achievements');
        break;
      case 'help':
        this.show('help');
        break;
      case 'info':
        this.show('info');
        break;
      case 'layouts':
        this.show('layouts');
        break;
      case 'layout-save':
        m.saveLayout(Number(arg));
        break;
      case 'layout-load':
        m.loadLayout(Number(arg));
        break;
      case 'layout-share':
        void this.shareLayout(Number(arg));
        break;
      case 'layout-import': {
        const code = layoutFromLink(this.layoutCode) ?? this.layoutCode.trim();
        if (m.importLayout(code, Number(arg)) !== false) this.layoutCode = '';
        break;
      }
      case 'edit':
        m.beginEdit();
        this.drawerPanel = null;
        this.panel = null;
        this.render();
        break;
      case 'edit-done':
        m.endEdit();
        this.panel = null;
        this.render();
        break;
      case 'undo':
        m.undo();
        break;
      case 'redo':
        m.redo();
        break;
      case 'tab':
        this.tab = arg;
        this.render();
        break;
      case 'collect':
        // Each collect effect plays its resource's own sound.
        m.collect(
          undefined,
          arg === 'gold' || arg === 'elixir' || arg === 'dark' ? arg : undefined,
        );
        break;
      case 'build':
        m.beginBuild(arg as BuildingKind);
        if (m.placement) this.drawerPanel = null;
        this.render();
        break;
      case 'decoration':
        m.beginDecoration(arg);
        if (m.decorationPlacement) this.drawerPanel = null;
        this.render();
        break;
      case 'decoration-move':
        this.stashConfirm = null;
        m.moveDecoration(Number(arg));
        break;
      case 'decoration-stash':
        this.stashConfirm = Number(arg);
        this.render();
        break;
      case 'decoration-stash-cancel':
        this.stashConfirm = null;
        this.render();
        break;
      case 'decoration-stash-confirm':
        this.stashConfirm = null;
        m.stashDecoration(Number(arg));
        break;
      case 'cancel':
        m.cancel();
        break;
      case 'upgrade':
        m.upgrade(Number(arg));
        this.audio.play('build');
        break;
      case 'finish':
        m.finish(Number(arg));
        break;
      case 'move':
        m.move(Number(arg));
        break;
      case 'boost-super':
        m.boostSuperTroop(arg as TroopKind);
        break;
      case 'train':
        m.train(arg as TroopKind);
        break;
      case 'attack':
        m.startCampaign(Number(arg));
        if (m.battle) {
          this.panel = null;
          this.drawerPanel = null;
          this.resultShown = false;
          this.audio.play('deploy');
        }
        this.render();
        break;
      case 'troop':
        if (!m.battle || !m.battle.remaining[arg as TroopKind]) break;
        m.activeHero = false;
        m.activeHeroKind = null;
        m.activeTroop = arg as TroopKind;
        m.activeSpell = null;
        // Selection only moves the highlight and hint, which updateLive patches in place.
        this.updateLive();
        document
          .querySelector(`[data-action="troop:${arg}"]`)
          ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        break;
      case 'spell':
        if (!m.battle || !m.battle.spells[arg as SpellKind]) break;
        m.activeHero = false;
        m.activeHeroKind = null;
        m.activeSpell = m.activeSpell === arg ? null : (arg as SpellKind);
        this.updateLive();
        document
          .querySelector(`[data-action="spell:${arg}"]`)
          ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        break;
      case 'surrender':
        this.show('surrender');
        break;
      case 'end':
        this.panel = null;
        m.finishBattle();
        break;
      case 'home':
        m.returnHome();
        this.panel = null;
        this.resultShown = false;
        this.render();
        break;
      case 'zoom-in':
        this.scene.zoomBy(1.15);
        break;
      case 'zoom-out':
        this.scene.zoomBy(1 / 1.15);
        break;
      case 'recenter':
        this.scene.resetCamera();
        break;
      case 'sound':
        m.state.settings.sound = !m.state.settings.sound;
        this.audio.enabled = m.state.settings.sound;
        m.changed();
        break;
      case 'music':
        m.state.settings.music = !m.state.settings.music;
        this.audio.music(m.state.settings.music);
        m.changed();
        break;
      case 'motion':
        m.toggleReducedMotion();
        applyMotionPreference(m);
        break;
      case 'battery':
        m.toggleBatterySaver();
        break;
      case 'haptics':
        m.toggleHaptics();
        break;
      case 'claim':
        if (m.claimAchievement(arg)) this.audio.effect('Collect Diamonds', 'collect');
        break;
      case 'offline-retry':
        retryOfflineWarm();
        this.render();
        break;
      case 'import-cancel':
        this.pendingImport = null;
        this.show('settings');
        break;
      case 'import-confirm': {
        const data = this.pendingImport;
        this.pendingImport = null;
        if (!data || m.battle) break;
        const kept = keepReplacedVillage(m.state);
        void this.applyVillage(
          data,
          kept
            ? 'Village restored successfully. Undo it from Settings.'
            : 'Village restored successfully.',
        );
        break;
      }
      case 'import-undo': {
        const replaced = replacedVillage();
        if (!replaced || m.battle) break;
        forgetReplacedVillage();
        void this.applyVillage(replaced.state, 'Your previous village is back.');
        break;
      }
      case 'layout-undo':
        m.undoSlot('layout', Number(arg));
        break;
      case 'preset-undo':
        m.undoSlot('preset', Number(arg));
        break;
      case 'export':
      case 'export-village': {
        const recordings = verb === 'export';
        const file = saveFileText(m.state, recordings);
        // A share sheet the player closed exported nothing, so it gets no confirmation.
        void deliverFile(file.text, saveFileName(recordings), 'CodeForge village').then(
          (delivery) => {
            if (delivery === 'cancelled') return;
            this.toast(
              !recordings
                ? 'Your village backup has been exported without recordings.'
                : file.droppedRecordings
                  ? `Your village backup has been exported. ${file.droppedRecordings} oldest recording${file.droppedRecordings === 1 ? ' was' : 's were'} left out to fit the file limit.`
                  : 'Your village backup has been exported.',
            );
          },
        );
        break;
      }
      case 'import':
        document.querySelector<HTMLInputElement>('#import-file')!.click();
        break;
      case 'tutorial':
        this.panel = null;
        this.render();
        break;
      case 'skip-tutorial':
        m.state.tutorial = true;
        m.changed();
        break;
    }
  }
  private async importReplay(file: File) {
    try {
      if (file.size > MAX_REPLAY_FILE_BYTES)
        throw Error('Replay files must be smaller than 512 KB.');
      const replay = parseReplayFile(await file.text());
      if (!this.model.openReplay(replay))
        throw Error('Finish your current attack before opening a replay.');
      this.panel = null;
      this.drawerPanel = null;
      this.resultShown = false;
      this.render();
      this.toast('Shared replay opened. Your village is unchanged.');
    } catch (error) {
      this.toast(error instanceof Error ? error.message : 'Could not open this replay.');
    } finally {
      document.querySelector<HTMLInputElement>('#import-replay-file')!.value = '';
    }
  }
  /** A parsed backup waiting for the player to confirm it replaces this village. */
  private pendingImport: Save | null = null;
  private async import(file: File) {
    let data: Save | null = null;
    try {
      if (file.size <= MAX_SAVE_FILE_BYTES) data = parseSaveFile(await file.text());
    } catch {
      data = null;
    } finally {
      document.querySelector<HTMLInputElement>('#import-file')!.value = '';
    }
    if (!data) {
      this.toast('That backup is not a valid CodeForge village.');
      return;
    }
    // Review before anything is replaced.
    this.pendingImport = data;
    this.show('import-confirm');
  }
  /** What a backup holds, beside the village it would replace. */
  private importConfirm() {
    const data = this.pendingImport;
    if (!data) return `<div class="modal-body">${button('settings', 'Back to settings')}</div>`;
    const summary = (state: Save) => {
      const th = state.buildings.find((b) => b.kind === 'townhall')?.level ?? 1;
      return `Town Hall ${th} · ${n(state.buildings.length)} buildings · ${coin} ${n(state.gold)} ${elixir} ${n(state.elixir)} ${gem} ${n(state.gems)}`;
    };
    const when = new Date(data.lastTick).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return `<div class="modal-body confirm-body import-review"><h3>Backup</h3><p>${summary(data)}</p><p><small>Last played ${html(when)} · ${data.raidLog?.length ?? 0} raids in its log</small></p><h3>Your current village</h3><p>${summary(this.model.state)}</p><p class="confirm-line">${icon('ShieldCheck', 20)} Your current village is kept, so you can undo this import from Settings.</p><div class="confirm-actions">${button('import-cancel', 'Cancel', 'game-btn stone')}${button('import-confirm', `${icon('Upload', 18)} Replace village`, 'game-btn green')}</div></div>`;
  }
  /** Makes `data` the village: resets transient state, then saves it and says whether it stuck. */
  private async applyVillage(data: Save, done: string) {
    this.model.state = data;
    this.model.clearSlotHistory();
    this.presetNames.clear();
    this.model.returnHome();
    this.model.endEdit();
    this.model.tick(Date.now());
    applyMotionPreference(this.model);
    this.audio.enabled = data.settings.sound;
    this.audio.music(data.settings.music);
    let saved = false;
    try {
      saved = await saveGame(data);
    } catch {
      saved = false;
    }
    this.setSaveState(saved);
    // A structural change keeps the timed save retrying until a write succeeds.
    this.model.changed();
    this.panel = null;
    this.render();
    if (!saved)
      this.toast(
        'Village restored for this session only: it could not be saved in this browser. Export it from Settings to keep it.',
      );
    else if (!this.showMapUpgrade()) this.toast(done);
  }
  /**
   * Keyboard map access: M toggles a tile cursor that arrows (or WASD) move and Enter or Space
   * acts on (select, place, deploy), and B opens the building list. True when the key was used.
   */
  private mapKeys(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (key === BUILDING_LIST_KEY && !this.model.battle) {
      e.preventDefault();
      this.show('buildings');
      return true;
    }
    if (key === MAP_CURSOR_KEY) {
      e.preventDefault();
      this.scene.toggleKeyCursor();
      this.announce(
        this.scene.keyCursor
          ? `Map cursor on. ${this.scene.describeKeyCursor()}. Arrows move, Enter acts, Escape leaves.`
          : 'Map cursor off',
      );
      return true;
    }
    if (!this.scene.keyCursor) return false;
    // Buttons keep their own Enter and Space.
    if (e.target instanceof HTMLButtonElement) return false;
    const moves: Record<string, [number, number]> = {
      arrowup: [0, -1],
      w: [0, -1],
      arrowdown: [0, 1],
      s: [0, 1],
      arrowleft: [-1, 0],
      a: [-1, 0],
      arrowright: [1, 0],
      d: [1, 0],
    };
    const move = moves[key];
    if (move) {
      e.preventDefault();
      this.scene.moveKeyCursor(move[0], move[1]);
      this.announce(this.scene.describeKeyCursor());
      return true;
    }
    if (key === 'enter' || key === ' ') {
      e.preventDefault();
      this.scene.activateKeyCursor();
      // A selected building's card is keyboard-reachable at once.
      requestAnimationFrame(() =>
        this.contextEl
          .querySelector<HTMLElement>('.building-context [data-action="info"]')
          ?.focus(),
      );
      return true;
    }
    return false;
  }
  /** Polite screen-reader announcement for keyboard map actions. */
  private announce(text: string) {
    const region = this.root.querySelector<HTMLElement>('#map-announcer');
    if (region) region.textContent = text;
  }
  /** Every building, with its state and a way to select it: the keyboard's way into the map. */
  private buildingList() {
    const m = this.model;
    const rows = [...m.state.buildings]
      .sort(
        (a, b) =>
          BUILDINGS[a.kind].category.localeCompare(BUILDINGS[b.kind].category) ||
          BUILDINGS[a.kind].name.localeCompare(BUILDINGS[b.kind].name) ||
          b.level - a.level,
      )
      .map((b) => {
        const d = BUILDINGS[b.kind];
        const status = b.constructing
          ? 'Being built'
          : b.upgradeEnd
            ? `Upgrading · ${time((b.upgradeEnd - m.clock) / 1000)} left`
            : b.stored >= 1 && producedResource(b.kind)
              ? `${n(b.stored)} ready to collect`
              : m.upgradeIssue(b)
                ? 'Ready'
                : 'Can upgrade';
        return `<li>${button(`select-building:${b.id}`, `<b>${d.name}</b><span>Level ${b.level} · ${status}</span>`, 'building-list-item', `aria-label="${d.name}, level ${b.level}, ${status}"`)}</li>`;
      })
      .join('');
    return `<div class="modal-body building-list-body"><p class="settings-note">Choose a building to select it on the map. Press M for a map cursor (arrows move it, Enter selects, places or deploys) and B for this list.</p><ul class="building-list">${rows}</ul></div>`;
  }
  showMapUpgrade() {
    const moved = this.model.state.mapUpgrade?.moved;
    if (!moved) return false;
    delete this.model.state.mapUpgrade;
    this.model.changed(true);
    this.toast(
      `Village updated · ${moved} building${moved === 1 ? '' : 's'} moved to clear ground. Your progress is preserved.`,
    );
    return true;
  }
  private keydown(e: KeyboardEvent) {
    if ((this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly) {
      if (this.model.topicOutpostEditMode && !this.panel && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        if (e.key === 'Escape') { e.preventDefault(); this.action('cf-layout-cancel'); return; }
        const delta = e.key === 'ArrowLeft' ? [-1, 0] : e.key === 'ArrowRight' ? [1, 0] : e.key === 'ArrowUp' ? [0, -1] : e.key === 'ArrowDown' ? [0, 1] : null;
        if (delta) { e.preventDefault(); this.model.nudgeSelectedTopicOutpost(delta[0], delta[1]); this.renderCodeForgeLayoutControls(); return; }
      }
      if (e.key === '+' || e.key === '=') this.scene.zoomBy(1.15);
      else if (e.key === '-') this.scene.zoomBy(1 / 1.15);
      else if (e.key === 'Escape' && this.panel) this.closePanel();
      return;
    }
    if (e.key === 'Escape' && !this.panel && this.scene.keyCursor) {
      this.scene.toggleKeyCursor(false);
      this.announce('Map cursor off');
      return;
    }
    if (e.key === 'Escape') {
      if (this.panel) {
        this.closePanel();
      } else if (this.drawerPanel) {
        this.drawerPanel = null;
        this.render();
      } else if (this.model.wallMove) this.model.cancel();
      else if (this.model.editing) this.action('edit-done');
      else this.model.cancel();
    }
    if ((this.panel || this.model.battle?.finished) && e.key === 'Tab') {
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const items = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = items[0],
        last = items.at(-1);
      const outside = !dialog?.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || outside)) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && (document.activeElement === last || outside)) {
        e.preventDefault();
        first?.focus();
      }
    }
    if (this.panel || e.target instanceof HTMLInputElement) return;
    if (!e.metaKey && !e.ctrlKey && !e.altKey && this.mapKeys(e)) return;
    if (this.model.editing && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      this.action(e.shiftKey ? 'redo' : 'undo');
      return;
    }
    // Browser chords (Cmd/Ctrl+R reload, Cmd+1..9 tabs, Cmd+plus zoom) are never game keys.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (this.model.wallMove) {
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.model.rotateWallMove();
      }
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        this.action('wall-place');
      }
      return;
    }
    if (!this.model.battle && e.key.toLowerCase() === 'r' && this.model.rotateSweeper()) {
      e.preventDefault();
      return;
    }
    // Space activates a focused control (Restart, Back, speed); otherwise it pauses the replay.
    if (this.model.replay && e.code === 'Space' && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      this.model.toggleReplay();
      return;
    }
    if (this.model.battle && !this.model.replay) {
      if (e.key.toLowerCase() === 'h') {
        this.action('hero-select');
        return;
      }
      const troopIndex = TROOP_HOTKEYS.indexOf(e.key.toLowerCase());
      if (troopIndex >= 0) this.action(`troop:${TROOP_ORDER[troopIndex]}`);
      const spellIndex = SPELL_HOTKEYS.indexOf(e.key);
      if (spellIndex >= 0) this.action(`spell:${SPELL_ORDER[spellIndex]}`);
    }
    if (e.key === '+' || e.key === '=') this.scene.zoomBy(1.15);
    if (e.key === '-') this.scene.zoomBy(1 / 1.15);
  }
  render() {
    // Rendering now satisfies any render already queued for the next frame.
    if (this.raf) {
      cancelAnimationFrame(this.rafId);
      this.raf = false;
    }
    // A structural update must not remove a control between press and release.
    if (this.pressedActions.size) {
      this.renderPending = true;
      this.updateLive();
      return;
    }
    this.renderPending = false;
    const m = this.model,
      b = m.battle;
    if (this.replayScrubbing && m.replay) {
      this.updateLive();
      return;
    }
    const drawerBody = this.drawerEl.querySelector('.drawer-body');
    const modalScroll = this.modalEl.querySelector('.modal-body')?.scrollTop ?? 0;
    const drawerScroll = drawerBody?.scrollLeft ?? 0;
    const drawerScrollY = drawerBody?.scrollTop ?? 0;
    const categoryScroll = this.drawerEl.querySelector('.shop-tabs')?.scrollLeft ?? 0;
    const armyScroll = this.hudEl.querySelector('.army-tray')?.scrollLeft ?? 0;
    const active = document.activeElement;
    const focused = focusMark(active);
    let rebuilt = false;
    const hudMarkup = b ? this.battleHUD() : this.homeHUD();
    if (hudMarkup !== this.hudMarkup) {
      this.hudEl.innerHTML = hudMarkup;
      this.hudMarkup = hudMarkup;
      rebuilt = true;
      this.syncLoops(this.hudEl);
    }
    const contextMarkup = this.context();
    if (contextMarkup !== this.contextMarkup) {
      this.contextEl.innerHTML = contextMarkup;
      this.contextMarkup = contextMarkup;
      rebuilt = true;
    }
    const drawerMarkup = this.drawer();
    const drawerChanged = drawerMarkup !== this.drawerMarkup;
    if (drawerChanged) {
      // Updating an open sheet (+ Add, Remove, a shop tab) must not slide it in again.
      const updatingOpenDrawer =
        !!this.drawerMarkup && !!this.drawerPanel && this.drawerPanel === this.renderedDrawer;
      const next = drawerMarkup ? this.drawerParts : null;
      if (!updatingOpenDrawer || !next || !this.patchDrawer(this.renderedDrawerParts, next)) {
        this.drawerEl.innerHTML = drawerMarkup;
        if (updatingOpenDrawer)
          this.drawerEl
            .querySelector<HTMLElement>('.drawer-sheet')
            ?.style.setProperty('animation', 'none');
      }
      this.renderedDrawerParts = next;
      this.drawerMarkup = drawerMarkup;
      this.renderedDrawer = drawerMarkup ? this.drawerPanel : null;
      rebuilt = true;
    }
    this.drawerEl.classList.toggle('dragging', this.dragging);
    // An open sheet owns the bottom of the screen, so the bars beneath it step aside.
    this.root.classList.toggle('drawer-open', !!this.drawerPanel && !b);
    const result = b?.finished && !m.replay;
    // Drawers deliberately leave the map live; only real dialogs block it.
    this.scene.uiBlocked = !!this.panel || !!result;
    this.hudEl.inert = this.scene.uiBlocked;
    this.contextEl.inert = this.scene.uiBlocked;
    this.drawerEl.inert = this.scene.uiBlocked;
    const modalMarkup = result ? this.result() : this.panel ? this.modal() : '';
    if (modalMarkup !== this.modalMarkup) {
      const root = this.modalEl;
      const updatingOpenDialog =
        !!this.modalMarkup &&
        (result ? this.resultShown : this.panel !== null && this.panel === this.lastPanel);
      root.innerHTML = modalMarkup;
      // Updating research, settings or results must not fade/shrink an already open dialog.
      if (updatingOpenDialog)
        root.querySelectorAll<HTMLElement>('.modal, .modal-backdrop').forEach((el) => {
          el.style.animation = 'none';
        });
      this.modalMarkup = modalMarkup;
      root.querySelector('.modal-body')?.scrollTo(0, modalScroll);
      rebuilt = true;
    }
    // The layout toolbar is an external overlay while editing; keep its selected item,
    // validity and button states in sync with model changes after all modal DOM settles.
    this.renderCodeForgeLayoutControls();
    if ((m as GameModel & { serverReadOnly?: boolean }).serverReadOnly) {
        const allowed = new Set(['settings', 'sound', 'music', 'motion', 'battery', 'haptics', 'zoom-in', 'zoom-out', 'recenter', 'close', 'info', 'help', 'cancel', 'settings-server-workflows', 'select-building', 'codeforge', 'cf-attack-refresh', 'cf-attack-open', 'cf-attack-check', 'cf-attack-launch', 'cf-topic-select', 'cf-outpost-upgrade', 'cf-outpost-refresh', 'cf-layout-edit', 'cf-layout-save', 'cf-layout-cancel', 'cf-layout-flip']);
      this.root.querySelectorAll<HTMLButtonElement>('[data-action], [data-add], [data-repeat]').forEach((control) => {
        const action = control.dataset.action ?? control.dataset.add ?? '';
        if (!allowed.has(action.split(':')[0])) control.disabled = true;
      });
      this.root.querySelectorAll<HTMLInputElement>('#import-file, #import-replay-file').forEach((input) => { input.disabled = true; });
    }
    if (rebuilt) this.liveRefs = null;
    const armyTray = this.hudEl.querySelector('.army-tray');
    if (armyTray && armyTray.scrollLeft !== armyScroll) armyTray.scrollLeft = armyScroll;
    const body = this.drawerEl.querySelector('.drawer-body');
    if (body && drawerChanged) {
      body.scrollLeft = drawerScroll;
      body.scrollTop = drawerScrollY;
    }
    const categories = this.drawerEl.querySelector<HTMLElement>('.shop-tabs');
    const activeCategory = categories?.querySelector<HTMLElement>('.active');
    if (categories && activeCategory && drawerChanged) {
      categories.scrollLeft = categoryScroll;
      const bounds = categories.getBoundingClientRect();
      const tab = activeCategory.getBoundingClientRect();
      if (tab.right > bounds.right) categories.scrollLeft += tab.right - bounds.right;
      if (tab.left < bounds.left) categories.scrollLeft -= bounds.left - tab.left;
    }
    this.positionContext();
    this.markCoachTarget();
    // Every step satisfied: retire the coaching for good.
    if (!(m as GameModel & { serverReadOnly?: boolean }).serverReadOnly && !m.state.tutorial && !b && TUTORIAL.every((step) => step.done(m))) {
      m.state.tutorial = true;
      this.toast('That is the whole loop, Chief. The valley is yours from here.');
    }
    const drawerSwitched = this.drawerPanel !== this.lastDrawer;
    this.lastDrawer = this.drawerPanel;
    if (this.panel === 'campaign' && this.lastPanel !== 'campaign') this.positionCampaign();
    if (this.panel !== this.lastPanel) {
      this.modalEl.querySelector<HTMLElement>('.modal [data-action="close"]')?.focus();
      this.lastPanel = this.panel;
    } else if (drawerSwitched) {
      // Opening moves focus into the sheet; closing returns it to the launcher if it was lost
      // (the launcher itself may have been rebuilt meanwhile).
      if (this.drawerPanel && !b)
        this.drawerEl.querySelector<HTMLElement>('.drawer-head h2')?.focus({ preventScroll: true });
      else if (!document.activeElement?.isConnected || document.activeElement === document.body)
        restoreFocusMark(this.drawerLauncher);
    } else if (focused && active && !active.isConnected && (this.panel || !this.scene.uiBlocked)) {
      // The focused control (or text field, with its caret) was rebuilt: focus its replacement.
      restoreFocusMark(focused);
    }
    if (result && !this.resultShown) {
      this.resultShown = true;
      this.countUp();
      this.audio.play('victory');
      this.modalEl.querySelector<HTMLElement>('[data-action="home"]')?.focus();
    }
    this.updateLive();
  }
  /**
   * Replaces only the drawer tiles whose markup changed (+ Add touches one tile and
   * the counters, not the other seventy). Returns false when the structure differs
   * and the caller must rebuild the whole sheet.
   */
  private patchDrawer(prev: DrawerParts | null, next: DrawerParts) {
    const sheet = this.drawerEl.firstElementChild;
    if (
      !prev ||
      !sheet ||
      prev.open !== next.open ||
      prev.body !== next.body ||
      prev.items.length !== next.items.length ||
      sheet.children.length !== 3
    )
      return false;
    const [head, body, foot] = Array.from(sheet.children);
    if (body.children.length !== prev.items.length) return false;
    const tiles = Array.from(body.children);
    if (prev.head !== next.head) head.outerHTML = next.head;
    next.items.forEach((markup, i) => {
      if (markup !== prev.items[i]) tiles[i].outerHTML = markup;
    });
    if (prev.foot !== next.foot) foot.outerHTML = next.foot;
    return true;
  }
  /**
   * Looping decorations (full storage glow) are restarted whenever #hud is rebuilt.
   * Pin them to the document timeline so a rebuild continues the same phase.
   */
  private syncLoops(scope: HTMLElement) {
    if (typeof scope.getAnimations !== 'function') return;
    for (const animation of scope.getAnimations({ subtree: true }))
      if ((animation as CSSAnimation).animationName === 'store-full') animation.startTime = 0;
  }
  /** The first unfinished coaching step, or -1 once there is nothing left to teach. */
  private get coachStep() {
    if ((this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly) return -1;
    if (this.model.state.tutorial || this.model.battle || this.model.editing) return -1;
    return TUTORIAL.findIndex((step) => !step.done(this.model));
  }
  private coach() {
    const index = this.coachStep;
    if (index < 0) return '';
    const step = TUTORIAL[index];
    return `<div class="coach-banner" data-coach="${step.target}"><span class="coach-step">${index + 1}<i>/${TUTORIAL.length}</i></span><div><b>${step.title}</b><small>${step.body}</small></div>${step.target === '.coach-watch' ? button('goblin-raid', `${icon('Play', 16)} Watch`, 'game-btn orange coach-watch') : ''}${button('skip-tutorial', 'Skip', 'coach-skip')}</div>`;
  }
  /** Rings the control the current step is about, without touching its layout. */
  private markCoachTarget() {
    for (const el of Array.from(this.root.querySelectorAll('.coach-target')))
      el.classList.remove('coach-target');
    const banner = this.hudEl.querySelector<HTMLElement>('[data-coach]');
    const target = banner ? this.hudEl.querySelector<HTMLElement>(banner.dataset.coach!) : null;
    target?.classList.add('coach-target');
    // The pulse lives on its own element outside #hud: it animates only transform and
    // opacity (no per-frame repaint of box-shadow) and survives #hud rebuilds unrestarted.
    const ring = this.root.querySelector<HTMLElement>('#coach-ring');
    if (!ring) return;
    const rect = target && !this.scene.uiBlocked ? target.getBoundingClientRect() : null;
    if (!rect || !rect.width || !rect.height) {
      ring.hidden = true;
      return;
    }
    const radius = getComputedStyle(target!).borderRadius;
    const next = `${Math.round(rect.left)}px,${Math.round(rect.top)}px,${Math.round(rect.width)}px,${Math.round(rect.height)}px,${radius}`;
    if (ring.hidden) ring.hidden = false;
    if (ring.dataset.box === next) return;
    ring.dataset.box = next;
    ring.style.left = `${Math.round(rect.left)}px`;
    ring.style.top = `${Math.round(rect.top)}px`;
    ring.style.width = `${Math.round(rect.width)}px`;
    ring.style.height = `${Math.round(rect.height)}px`;
    ring.style.borderRadius = radius;
  }
  /** The chief's level; the shield fills from the bottom as XP for the next level builds. */
  private levelShield() {
    if ((this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly)
      return '';
    const { level, into, needed } = this.model.chiefProgress;
    const xp = needed ? `${n(into)} of ${n(needed)} XP to level ${level + 1}` : 'Maximum level';
    return `<button class="level-shield" data-action="achievements" aria-label="Chief level ${level}, ${xp}" title="${xp}" style="--xp:${needed ? ((into / needed) * 100).toFixed(1) : 100}%">${level}</button>`;
  }
  private chiefXpLine() {
    const { level, into, needed } = this.model.chiefProgress;
    return `<div class="chief-xp"><div class="journey-bar"><i style="transform:${fillScale(needed ? (into / needed) * 100 : 100)}"></i></div><small>${needed ? `${n(into)} / ${n(needed)} XP to level ${level + 1}` : 'Maximum chief level'}</small></div>`;
  }
  private homeHUD() {
    const m = this.model,
      s = m.state,
      economy = (m as GameModel & { serverEconomy?: { gold: number; elixir: number; gems: number; builderCapacity: number; username: string } | null }).serverEconomy;
    if (m.editing) return this.editHUD();
    const readOnly = !!(m as GameModel & { serverReadOnly?: boolean }).serverReadOnly;
    const builderCapacity = readOnly
      ? economy?.builderCapacity
      : m.builders;
    const gold = readOnly ? economy?.gold : s.gold, elixirAmount = readOnly ? economy?.elixir : s.elixir, gems = readOnly ? economy?.gems : s.gems;
    return `
 <header class="player-hud">${this.levelShield()}<div class="player-info"><div class="eyebrow">CHIEF'S VILLAGE</div><div class="player-name">${html(readOnly ? economy?.username || '—' : 'Oakheart')}</div>${readOnly ? '' : `<button class="trophy-pill" data-action="achievements">${icon('Trophy', 17)} <b>${n(s.trophies)}</b> <span>${m.league.name}</span></button>`}</div></header>
  <div class="village-status"><div class="brand">CODE<span>FORGE</span></div><div class="status-chips"><button data-action="codeforge" aria-label="Open Codeforces attacks and account progress">${readOnly ? 'Codeforces' : 'CF'}</button>${readOnly ? '' : `<button data-action="builders" aria-label="Builder capacity: ${builderCapacity ?? 'unavailable'}">${icon('Hammer', 20)} <b>${builderCapacity ?? '—'}</b> <span>Builders</span></button>`}${readOnly ? '' : `<button data-action="help">${icon('ShieldCheck', 20)} <b>Village safe</b></button>`}</div></div>
 <div class="resources">${(
   [
     'gold',
     'elixir',
      ...(readOnly ? (m.townhallLevel >= 7 ? ['dark' as const] : []) : m.townhallLevel >= 7 || s.dark > 0 ? ['dark' as const] : []),
     'gems',
   ] as const
 )
    .map((k) => {
      const amount = readOnly
        ? k === 'gold' ? gold : k === 'elixir' ? elixirAmount : k === 'gems' ? gems : undefined
        : s[k];
      const fill = readOnly ? '0%' : k === 'gems' ? pct((amount as number) / 5) : pct((s[k] / m.resourceCap(k)) * 100);
      const counter = amount == null ? '—' : n(amount);
      return `<div class="resource-bar ${k} ${!readOnly && k !== 'gems' && m.resourceCap(k) > 0 && s[k] >= m.resourceCap(k) ? 'full' : ''}"><div class="resource-fill" style="width:${fill}"></div><div class="resource-topline">${readOnly ? 'Solve rewards' : k === 'gems' ? 'Gems' : `Max: ${n(m.resourceCap(k))}`}</div><span class="resource-amount" data-resource="${k}">${counter}</span>${resource(k)}${readOnly ? '' : k === 'gems'
           ? `<button class="resource-plus gems-earn" data-action="achievements" aria-label="Earn gems from achievements" title="Earn gems from achievements">${icon('Trophy', 15)}</button>`
           : `<button class="resource-plus" data-action="collect:${k}" aria-label="Collect ${k === 'dark' ? 'dark elixir' : k}" title="Collect ${k === 'dark' ? 'dark elixir from drills' : k === 'gold' ? 'gold from mines' : 'elixir from collectors'}">+</button>`
        }</div>`;
    })
   .join('')}</div>
  ${readOnly ? '' : `<nav class="left-tools" aria-label="Village activities"><button class="square-btn" data-action="campaign" aria-label="Campaign map">${icon('Map', 29)}${NATIVE_CAMPAIGN.some((_, i) => !s.nativeCampaign?.stars[i] && this.model.campaignOpen(i) && !campaignPending(i)) ? '<span class="notification">!</span>' : ''}</button><button class="square-btn" data-action="achievements" aria-label="Achievements">${icon('Trophy', 27)}<span class="tool-label">Awards</span></button><button class="square-btn" data-action="edit" aria-label="Edit village layout">${icon('Pencil', 25)}<span class="tool-label">Edit</span></button><button class="square-btn" data-action="battle-log" aria-label="Battle log">${icon('ScrollText', 27)}<span class="tool-label">Log</span></button></nav>`}
 <div class="right-tools"><button class="square-btn small" data-action="settings" aria-label="Settings">${icon('Settings', 24)}</button><div class="camera-tools"><button data-action="zoom-in" aria-label="Zoom in">${icon('Plus', 20)}</button><button data-action="recenter" aria-label="Center village">${icon('LocateFixed', 18)}</button><button data-action="zoom-out" aria-label="Zoom out">${icon('Minus', 20)}</button></div></div>
  <div class="village-caption"><span class="caption-line"></span> HOME VILLAGE <span class="caption-line"></span><small>${readOnly ? 'Codeforces progress' : `Town Hall Level ${m.townhallLevel}`}</small></div>
  <div class="bottom-left"><button class="attack-btn" data-action="${readOnly ? 'codeforge' : 'campaign'}" aria-label="${readOnly ? 'Open Codeforces challenge attacks' : 'Attack'}">${icon('Swords', 44)}<span>${readOnly ? 'Attack' : 'Attack!'}</span><small>${readOnly ? 'CF CHALLENGE' : 'SINGLE PLAYER'}</small></button></div>
 <div class="bottom-center">${
    !readOnly && !m.selected && !m.placement && !this.drawerPanel
      ? `<div class="army-label"><span>${icon('UsersRound', 16)} YOUR ARMY</span><button data-action="army">${readOnly ? '— / —' : `${m.armySize}/${m.capacity}`} ${icon('ChevronRight', 14)}</button></div><div class="army-tray">${readOnly ? '' : `${this.heroCard()}${TROOP_ORDER.filter(
         (k) => s.army[k] > 0,
       )
         .map((k) => this.troopCard(k, s.army[k], 'army'))
         .join('')}${
         SPELL_ORDER.some((k) => s.spells[k])
           ? SPELL_ORDER.filter((k) => s.spells[k])
               .map((k) => this.spellCard(k, s.spells[k], 'army'))
               .join('')
           : ''
        }<button class="train-add" data-action="army" aria-label="Train troops">${icon('Plus', 24)}<small>Train</small></button>`}</div>`
     : ''
 }</div>
  ${readOnly ? '' : `<div class="bottom-right"><button class="collect-btn" data-action="collect">${coin}<span>Collect</span></button><button class="shop-btn ${this.drawerPanel === 'shop' ? 'open' : ''}" data-action="shop">${icon('ShoppingBasket', 38)}<span>Shop</span></button></div>`}
 ${this.coach()}
 <div class="control-hint">Drag to explore <span>·</span> Scroll to zoom <span>·</span> Click a building</div>`;
  }
  private editHUD() {
    const m = this.model;
    if (m.wallMove) return '';
    return `
 <div class="village-caption edit-caption"><span class="caption-line"></span> EDIT MODE <span class="caption-line"></span><small>Drag any building to a clear tile · Ctrl/⌘+Z to undo · Esc to finish</small></div>
 <div class="right-tools"><div class="camera-tools"><button data-action="zoom-in" aria-label="Zoom in">${icon('Plus', 20)}</button><button data-action="recenter" aria-label="Center village">${icon('LocateFixed', 18)}</button><button data-action="zoom-out" aria-label="Zoom out">${icon('Minus', 20)}</button></div></div>
 <div class="edit-toolbar">
   ${button('undo', `${icon('Undo2', 20)}<span>Undo</span>`, 'game-btn stone edit-tool', m.canUndo ? '' : 'disabled')}
   ${button('redo', `${icon('Redo2', 20)}<span>Redo</span>`, 'game-btn stone edit-tool', m.canRedo ? '' : 'disabled')}
   ${button('layouts', `${icon('LayoutGrid', 20)}<span>Layouts</span>`, 'game-btn blue edit-tool')}
   ${button('edit-done', `${icon('Check', 20)}<span>Done</span>`, 'game-btn green edit-tool')}
 </div>`;
  }
  private troopCard(k: TroopKind, count: number, action: string, selected = false) {
    const flying = TROOPS[k].flying ? '<span class="air-tag">AIR</span>' : '';
    return `<button class="troop-card ${selected ? 'selected' : ''} ${count === 0 ? 'empty' : ''}" data-action="${action}" aria-label="${TROOPS[k].name}, ${count} available" ${action.startsWith('troop') && count === 0 ? 'disabled' : ''}><span class="troop-count">x${count}</span>${action.startsWith('troop:') && TROOP_HOTKEYS[TROOP_ORDER.indexOf(k)] ? `<kbd class="troop-key">${TROOP_HOTKEYS[TROOP_ORDER.indexOf(k)].toUpperCase()}</kbd>` : ''}<img src="${hudAsset(k)}" alt="" draggable="false">${flying}<span class="troop-level">★ ${this.model.troopDisplayLevel(k)}</span><span class="troop-name">${TROOPS[k].name}</span></button>`;
  }
  private spellCard(k: SpellKind, count: number, action: string, selected = false) {
    return `<button class="troop-card spell-card ${selected ? 'selected' : ''} ${count === 0 ? 'empty' : ''}" data-action="${action}" aria-label="${SPELLS[k].name}, ${count} available" ${action.startsWith('spell') && count === 0 ? 'disabled' : ''}><span class="troop-count">x${count}</span>${action.startsWith('spell:') && SPELL_HOTKEYS[SPELL_ORDER.indexOf(k)] ? `<kbd class="troop-key">${SPELL_HOTKEYS[SPELL_ORDER.indexOf(k)]}</kbd>` : ''}<img src="${hudAsset(k)}" alt="" draggable="false"><span class="troop-level">★ ${this.model.spellLevel(k)}</span><span class="troop-name">${SPELLS[k].name.replace(' Spell', '')}</span></button>`;
  }

  /** Town Hall 18: Guardian choice and upgrades. */
  /** The Crafting Station card opens its panel. */
  private craftingButton(b: Building) {
    if (b.kind !== 'craftingstation') return '';
    return button(
      `crafting:${b.id}`,
      `<span>${icon('Hammer', 19)} ${b.crafted ? craftedName(b.crafted) : 'Choose a defense'}</span><small>Crafting</small>`,
      'game-btn orange',
    );
  }
  /** Crafting Station id the open panel belongs to. */
  private craftingStation: number | null = null;
  /** Each Crafted Defense with its three modules, the one on the platform first. */
  private crafting() {
    const m = this.model;
    const b = m.state.buildings.find((v) => v.id === this.craftingStation);
    if (!b || b.kind !== 'craftingstation')
      return '<div class="modal-body"><p>This Crafting Station is gone.</p></div>';
    const busy = !!b.upgradeEnd;
    const job = b.moduleUpgrade;
    const cards = CRAFTED_KINDS.map((kind) => {
      const levels = b.craftedModules?.[kind] ?? [1, 1, 1];
      const on = b.crafted === kind;
      const modules = craftedModules(kind)
        .map((mod, i) => {
          const next = moduleUpgrade(kind, i, levels[i]);
          const running = job?.kind === kind && job.module === i;
          const action = running
            ? `<span class="crafted-state">${icon('Clock3', 15)} <span data-crafting-timer>${time((b.upgradeEnd! - m.clock) / 1000)}</span></span>`
            : !next
              ? '<span class="crafted-state">Max</span>'
              : next.townHall > m.townhallLevel
                ? `<span class="crafted-state">Town Hall ${next.townHall}</span>`
                : button(
                    `craft-module:${kind}-${i}`,
                    `<span>${resource(next.resource)} ${n(next.cost)}</span><small>${time(next.seconds)}</small>`,
                    'game-btn green',
                    `aria-label="Upgrade ${craftedName(kind)} ${mod.name} to level ${next.level}" ${busy || m.busy >= m.builders || m.state[next.resource] < next.cost ? 'disabled' : ''}`,
                  );
          return `<li class="crafted-module"><span><b>${mod.name}</b><small>Level ${levels[i]} / ${MODULE_MAX_LEVEL} · ${this.craftedValue(kind, i, levels[i])}</small></span>${action}</li>`;
        })
        .join('');
      return `<article class="crafted-card ${on ? 'on' : ''}"><header><img src="${craftedArt(kind)}" alt="" width="72" height="72"><div><h3>${craftedName(kind)}</h3><small>Level ${craftedLevel(levels)} / 30</small></div>${on ? `<span class="crafted-state on">${icon('Check', 16)} On the platform</span>` : button(`craft-choose:${kind}`, 'Place', 'game-btn blue')}</header><ul>${modules}</ul></article>`;
    });
    return `<div class="modal-body crafting-body"><p class="crafting-note">Switching is free and instant; each defense keeps its modules. One module upgrades at a time and needs a free builder.</p>${cards.join('')}<p class="crafting-note">Numbers from the pinned client tables. The defense art is this game’s own.</p></div>`;
  }
  /** "Keep assigned until upgrade is complete" for the next assignment of each helper. */
  private helperRepeat: Record<HelperKind, boolean> = {
    builder: false,
    lab: false,
    alchemist: false,
  };
  /** The Alchemist's chosen conversion; a null amount means as much as she can take. */
  private alchemyFrom: ConvertResource = 'gold';
  private alchemyTo: ConvertResource = 'elixir';
  private alchemyAmount: number | null = null;
  /** The most the Alchemist can take of the chosen resource now. */
  private alchemyMax() {
    const h = this.model.helper('alchemist');
    if (!h) return 0;
    return Math.max(
      0,
      Math.min(
        alchemistCap(h.level, this.alchemyFrom),
        Math.floor(this.model.state[this.alchemyFrom]),
      ),
    );
  }
  private alchemyTake() {
    const max = this.alchemyMax();
    return Math.min(max, this.alchemyAmount ?? max);
  }
  /** Conversion preview text: what goes in, what comes out, and whether storage overflows. */
  private alchemyPreview() {
    const m = this.model;
    const h = m.helper('alchemist')!;
    const take = this.alchemyTake();
    const out = alchemistOutput(h.level, this.alchemyFrom, this.alchemyTo, take);
    const room = Math.max(0, Math.floor(m.resourceCap(this.alchemyTo) - m.state[this.alchemyTo]));
    return { take, out, lost: out > room };
  }
  /** The Alchemist's controls: source, target, amount and the client's warnings. */
  private alchemy() {
    const name = (r: ConvertResource) =>
      r === 'dark' ? 'Dark Elixir' : r === 'gold' ? 'Gold' : 'Elixir';
    const choice = (verb: string, r: ConvertResource, on: boolean, disabled = false) =>
      button(
        `${verb}:${r}`,
        `${resource(r)} ${name(r)}`,
        `alchemy-choice ${on ? 'on' : ''}`,
        `aria-pressed="${on}" ${disabled ? 'disabled title="Cannot convert to the same resource"' : ''}`,
      );
    const max = this.alchemyMax();
    const { take, out, lost } = this.alchemyPreview();
    return `<small class="helper-heading">Choose a resource to convert:</small><div class="alchemy-row">${CONVERT_RESOURCES.map((r) => choice('alchemy-from', r, r === this.alchemyFrom)).join('')}</div><small class="helper-heading">Convert ${name(this.alchemyFrom)} to:</small><div class="alchemy-row">${CONVERT_RESOURCES.map((r) => choice('alchemy-to', r, r === this.alchemyTo, r === this.alchemyFrom)).join('')}</div><input id="alchemy-amount" class="alchemy-amount" type="range" min="0" max="${max}" step="1" value="${take}" aria-label="Amount of ${name(this.alchemyFrom)} to convert" ${max ? '' : 'disabled'}><p class="alchemy-preview">${resource(this.alchemyFrom)} <b data-alchemy-in>${n(take)}</b> ${icon('ArrowRight', 15)} ${resource(this.alchemyTo)} <b data-alchemy-out>${n(out)}</b></p><p class="alchemy-warn" data-alchemy-warn ${lost ? '' : 'hidden'}>Your storage is almost full and some of the resources will be lost.</p>${button('alchemy-convert', 'Convert', 'game-btn green alchemy-convert', take > 0 ? '' : 'disabled')}`;
  }
  /** Each helper with the client's status line, its stats and the jobs it can take. */
  private helpers() {
    const m = this.model;
    if (!m.helperHut) return '<div class="modal-body"><p>Build the Helper Hut first.</p></div>';
    const cards = HELPER_KINDS.map((kind) => {
      const h = m.helper(kind);
      const row = h ? helperLevel(kind, h.level)! : helperLevel(kind, 1)!;
      const next = m.helperNext(kind);
      const working = helperWorking(kind, h);
      const ready = helperReady(h, m.clock);
      const jobs = m.helperJobs(kind);
      const status = !h
        ? `${icon('LockKeyhole', 15)} Locked`
        : working
          ? `${icon('Hammer', 15)} Time left: <b data-helper-timer="${kind}">${time((helperWorkEnd(kind, h)! - m.clock) / 1000)}</b>`
          : ready
            ? `${icon('Check', 15)} Ready to work!`
            : `${icon('Clock3', 15)} Available in: <b data-helper-timer="${kind}">${time((h.readyAt! - m.clock) / 1000)}</b>`;
      const current =
        h?.job && jobs.find((j) => helperJobId(j.target) === helperJobId(h.job!.target));
      const job = h?.job
        ? `<p class="helper-job">${working ? 'Working on' : 'Returns to'} <b>${current?.name ?? 'an upgrade'}</b>${h.job.repeat ? ' every day until it completes.' : '.'}</p>${h.job.repeat ? button(`helper-stop:${kind}`, 'Stop recurrence', 'game-btn stone') : ''}`
        : '';
      const list =
        h && ready && !h.job
          ? jobs.length
            ? `<small class="helper-heading">${kind === 'lab' ? 'Ongoing research:' : 'Ongoing upgrades:'}</small><ul class="helper-jobs">${jobs
                .map(
                  (j) =>
                    `<li><span><b>${j.name}</b><small><span data-helper-job="${kind}.${helperJobId(j.target)}">${time((j.end - m.clock) / 1000)}</span> left · saves ${time(Math.min(row.multiplier * row.seconds, ((j.end - m.clock) / 1000) * (row.multiplier / (1 + row.multiplier))))}</small></span>${button(`helper-assign:${kind}.${helperJobId(j.target)}`, 'Assign', 'game-btn green', `aria-label="Assign the ${helperName(kind)} to ${j.name}"`)}</li>`,
                )
                .join(
                  '',
                )}</ul>${button(`helper-repeat:${kind}`, `${icon(this.helperRepeat[kind] ? 'Check' : 'Circle', 16)} Keep assigned until upgrade is complete`, `helper-repeat ${this.helperRepeat[kind] ? 'on' : ''}`, `aria-pressed="${this.helperRepeat[kind]}"`)}`
            : `<p class="helper-job">${kind === 'lab' ? 'Start a Laboratory research upgrade to assign the Lab Assistant.' : 'Start a Builder upgrade to assign the Builder’s Apprentice.'}</p>`
          : '';
      const blocker = next ? m.helperBlocker(kind) : undefined;
      const buy = next
        ? button(
            `helper-buy:${kind}`,
            `<span>${h ? `Upgrade to level ${next.level}` : 'Unlock'}</span><small>${next.cost ? `${gem} ${n(next.cost)}` : 'Free'}</small>`,
            'game-btn green helper-buy',
            `${blocker ? 'disabled' : ''}`,
          ) + (blocker ? `<small class="helper-gate">${blocker}</small>` : '')
        : '<small class="helper-gate">Maximum level</small>';
      const stats =
        kind === 'alchemist'
          ? `<div><dt>Resource Conversion Max</dt><dd>${resource('gold')} ${short(alchemistCap(row.level, 'gold'))} ${resource('dark')} ${short(alchemistCap(row.level, 'dark'))}</dd></div><div><dt>Conversion bonus</dt><dd>+${row.ratePercent! - 100}%</dd></div><div><dt>Cooldown</dt><dd>${time(HELPER_COOLDOWN_SECONDS)}</dd></div>`
          : `<div><dt>Working time</dt><dd>${time(row.seconds)}</dd></div><div><dt>Cooldown</dt><dd>${time(HELPER_COOLDOWN_SECONDS)}</dd></div><div><dt>Working speed</dt><dd>×${row.multiplier}</dd></div>${h?.saved ? `<div><dt>Total saved time</dt><dd>${time(h.saved)}</dd></div>` : ''}`;
      const body = kind === 'alchemist' ? (h && ready ? this.alchemy() : '') : `${job}${list}`;
      return `<article class="helper-card ${!h ? 'locked' : working ? 'working' : ready ? 'ready' : 'resting'}"><header><span class="helper-glyph">${icon(kind === 'lab' ? 'FlaskConical' : kind === 'alchemist' ? 'Sparkles' : 'Hammer', 30)}</span><div><h3>${helperName(kind)}</h3><small>${h ? `Level ${h.level} / ${helperMaxLevel(kind)}` : `Town Hall ${row.townHall}`}</small></div><span class="helper-status">${status}</span></header><p class="helper-info">${helperInfo(kind)}</p><dl class="helper-stats">${stats}</dl>${body}<footer>${buy}</footer></article>`;
    });
    return `<div class="modal-body helpers-body">${cards.join('')}<p class="crafting-note">Helpers work once a day, then rest. Levels, speeds, conversion rates and gem costs are the pinned client’s.</p></div>`;
  }
  private craftedValue(kind: CraftedKind, module: number, level: number) {
    const levels: ModuleLevels = [1, 1, 1];
    levels[module] = level;
    const s = craftedStats(kind, levels);
    if (module === 0) return `${n(s.hp)} hitpoints`;
    if (module === 1)
      return `${n(s.damage)} per ${kind === 'candle' ? 'flame' : kind === 'hunter' ? 'card' : 'cake'}`;
    if (kind === 'candle') return `melts at ${s.stageStarts![0]} s and ${s.stageStarts![1]} s`;
    if (kind === 'hunter') return `Poison level ${s.poisonLevel}`;
    return `${n(s.bombDamage!)} bomb damage`;
  }
  private guardianButtons(b: Building) {
    if (b.kind !== 'townhall' || b.level < 18) return '';
    const kind = b.guardian ?? 'longshot';
    const next = b.upgradeEnd ? null : guardianUpgrade(kind, b.guardianLevel ?? 1);
    return `${button(
      'guardian-next',
      `<span>${icon('ShieldCheck', 19)} ${GUARDIAN_NAMES[kind]}</span><small>Level ${b.guardianLevel ?? 1}</small>`,
      'game-btn blue',
      `aria-label="Switch Town Hall Guardian (currently ${GUARDIAN_NAMES[kind]})" ${b.improving === 'guardian' ? 'disabled' : ''}`,
    )}${
      next
        ? button(
            'guardian-upgrade',
            `<span>${icon('ArrowBigUp', 19)} Guardian ${next.level}</span><small>${resource(next.resource)} ${n(next.cost)}</small>`,
            'game-btn green',
          )
        : ''
    }`;
  }
  /** Merge and gear-up actions for maxed Cannons, Archer Towers, Mortars and Wizard Towers. */
  private mergeButtons(b: Building) {
    const m = this.model;
    if (b.upgradeEnd || b.constructing) return '';
    let html = '';
    for (const result of MERGED_KINDS) {
      if (!mergeInputs(result).some((input) => input.kind === b.kind)) continue;
      if (m.maxCount(result) === 0) continue;
      const candidate = m.mergeCandidates(result, b.id);
      if (!candidate.inputs?.includes(b)) continue;
      const quote = mergeQuote(result);
      html += button(
        `merge:${result}.${b.id}`,
        `<span>${icon('Layers', 19)} ${BUILDINGS[result].name}</span><small>${resource(quote.resource)} ${n(quote.cost)}</small>`,
        'game-btn blue',
        `aria-label="Merge into ${BUILDINGS[result].name}"`,
      );
    }
    const charge = superchargeQuote(b.kind, b.supercharge ?? 0);
    if (charge && b.level >= BUILDINGS[b.kind].maxLevel && m.townhallLevel >= charge.townhall)
      html += button(
        `supercharge:${b.id}`,
        `<span>${icon('Zap', 19)} Supercharge ${charge.charge}</span><small>${resource(charge.resource)} ${n(charge.cost)}</small>`,
        'game-btn blue',
      );
    if (isGearable(b.kind) && !b.geared) {
      const quote = gearUpQuote(b.kind);
      const geared = m.state.buildings.filter(
        (v) => v.kind === b.kind && (v.geared || v.improving === 'gearup'),
      ).length;
      if (quote && b.level >= quote.level && geared < quote.limit)
        html += button(
          `gear-up:${b.id}`,
          `<span>${icon('Gauge', 19)} Gear Up</span><small>${resource(quote.resource)} ${n(quote.cost)}</small>`,
          'game-btn blue',
        );
    }
    return html;
  }

  // ------------------------------------------------------- anchored context
  /** A selected decoration: Move, or the client's Stash with its own confirmation. */
  private decorationContext(id: number, kind: string) {
    const d = DECORATIONS[kind];
    if (this.stashConfirm !== id) this.stashConfirm = null;
    const info = this.stashConfirm
      ? `<small>DECORATION</small><h2>${DECORATION_TEXTS.stashTitle}</h2><span>${html(DECORATION_TEXTS.stashText.replace('<item>', d.name))}</span>`
      : `<small>DECORATION</small><h2>${d.name}</h2><span>${d.size}×${d.size} tiles · Purely ornamental</span>`;
    const actions = this.stashConfirm
      ? button('decoration-stash-cancel', 'Cancel', 'game-btn stone') +
        button(
          `decoration-stash-confirm:${id}`,
          `${icon('ShoppingBasket', 18)} ${DECORATION_TEXTS.stash}`,
          'game-btn orange',
        )
      : button(`decoration-move:${id}`, `${icon('Move', 18)} Move`, 'game-btn blue') +
        button(
          `decoration-stash:${id}`,
          `${icon('ShoppingBasket', 18)} ${DECORATION_TEXTS.stash}`,
          'game-btn stone',
        );
    return `<div class="building-context obstacle-context decoration-context" data-anchor="decoration-${id}"><img class="context-art" src="/${d.art.path}" alt=""><div class="context-info">${info}</div><div class="context-actions">${actions}</div><button class="context-close" data-action="cancel" aria-label="Close decoration">${icon('X', 18)}</button></div>`;
  }
  private context() {
    const m = this.model;
    if (m.battle) return '';
    if (m.wallMove) return this.wallMoveContext();
    if (m.placement) {
      return `<div class="placement-banner">${icon('Move', 23)}<div><b>${m.moving ? 'Move' : 'Place'} ${BUILDINGS[m.placement].name}</b><small>Drop it on a clear green tile</small></div>${button('cancel', icon('X', 20), 'square-btn small', 'aria-label="Cancel placement"')}</div>`;
    }
    const moving = m.obstacles.find((o) => o.id === m.movingObstacle);
    if (moving)
      return `<div class="placement-banner">${icon('Move', 23)}<div><b>Move ${OBSTACLES[moving.kind].name}</b><small>Drop it on clear ground, the edge included</small></div>${button('cancel', icon('X', 20), 'square-btn small', 'aria-label="Cancel moving"')}</div>`;
    if (m.decorationPlacement) {
      const d = DECORATIONS[m.decorationPlacement];
      const note = m.movingDecoration
        ? 'Drop it on clear ground, the edge included'
        : m.stashedDecorations[m.decorationPlacement]
          ? 'From the Shop at no cost · the edge is allowed'
          : `${n(d.cost)} ${d.resource === 'gems' ? 'gems' : d.resource} · the edge is allowed`;
      return `<div class="placement-banner">${icon('Move', 23)}<div><b>${m.movingDecoration ? 'Move' : 'Place'} ${d.name}</b><small>${note}</small></div>${button('cancel', icon('X', 20), 'square-btn small', 'aria-label="Cancel placement"')}</div>`;
    }
    const decoration = m.selectedDecoration;
    if (decoration) return this.decorationContext(decoration.id, decoration.kind);
    const b = m.state.buildings.find((v) => v.id === m.selected);
    if (!b) {
      const o = m.selectedObstacle;
      if (!o) return '';
      const d = OBSTACLES[o.kind];
      return `<div class="building-context obstacle-context" data-anchor="${-o.id}"><img class="context-art" src="/${d.art.path}" alt=""><div class="context-info"><small>OBSTACLE</small><h2>${d.name}</h2><span>${d.size}×${d.size} tiles · Needs a free builder</span></div><div class="context-actions">${o.removeEnd ? button(`obstacle-finish:${o.id}`, `<small data-obstacle-time="${o.id}">${time((o.removeEnd - m.clock) / 1000)}</small><span>Finish ${gem} ${m.finishCost({ upgradeEnd: o.removeEnd } as Building)}</span>`) + button(`obstacle-cancel:${o.id}`, `${icon('X', 18)} Cancel`, 'game-btn stone') : button(`obstacle-remove:${o.id}`, `<span>${icon('Axe', 18)} Remove</span><small>${resource(d.resource)} ${n(d.cost)} · ${d.seconds}s</small>`, 'game-btn green', m.state[d.resource] < d.cost || m.busy >= m.builders ? 'disabled' : '')}${o.removeEnd ? '' : o.movable ? button(`obstacle-move:${o.id}`, `${icon('Move', 18)} Move`, 'game-btn blue') : m.magicItemCount('shovel-of-obstacles') ? button(`obstacle-shovel:${o.id}`, `${icon('Move', 18)} Shovel`, 'game-btn blue', 'aria-label="Make movable with a Shovel of Obstacles"') : ''}</div><button class="context-close" data-action="cancel" aria-label="Close obstacle">${icon('X', 18)}</button></div>`;
    }
    const rotate =
      b.kind === 'inferno' && !b.constructing
        ? button(
            'inferno-mode',
            `${icon('Target', 21)}<span>${b.infernoMode === 'multi' ? 'Multi-target' : 'Single-target'}</span>`,
            'game-btn blue',
            `aria-label="Switch Inferno Tower to ${b.infernoMode === 'multi' ? 'single' : 'multi'}-target mode"`,
          )
        : b.kind === 'airsweeper' && !b.constructing
          ? button(
              'sweeper-rotate',
              `${icon('RotateCw', 21)}<span>Rotate</span>`,
              'game-btn blue',
              'aria-label="Rotate Air Sweeper 45 degrees" title="Rotate clockwise · R"',
            )
          : b.kind === 'skeletontrap'
            ? button(
                'skeleton-mode',
                `${icon(b.skeletonMode === 'air' ? 'Wind' : 'Swords', 21)}<span>${b.skeletonMode === 'air' ? 'Air' : 'Ground'}</span>`,
                'game-btn blue',
                `aria-label="Switch Skeleton Trap to ${b.skeletonMode === 'air' ? 'ground' : 'air'} mode"`,
              )
            : b.kind === 'xbow' && !b.constructing
              ? button(
                  'xbow-mode',
                  `${icon(b.xbowMode === 'both' ? 'Wind' : 'Swords', 21)}<span>${b.xbowMode === 'both' ? 'Ground & air' : 'Ground'}</span>`,
                  'game-btn blue',
                  `aria-label="Switch X-Bow to ${b.xbowMode === 'both' ? 'ground' : 'ground and air'} mode"`,
                )
              : b.kind === 'spelltower' && !b.constructing
                ? button(
                    'spelltower-mode',
                    `${icon('Sparkles', 21)}<span>${SPELL_TOWER_LABEL[b.spellMode ?? 'rage']}</span>`,
                    'game-btn blue',
                    `aria-label="Change the Spell Tower spell" ${spellTowerModes(b.level).length < 2 ? 'disabled' : ''}`,
                  )
                : b.kind === 'multigeartower' && !b.constructing
                  ? button(
                      'gear-mode',
                      `${icon(b.gearMode === 'fast' ? 'Zap' : 'Target', 21)}<span>${b.gearMode === 'fast' ? 'Fast Attack' : 'Long Range'}</span>`,
                      'game-btn blue',
                      `aria-label="Switch Multi-Gear Tower to ${b.gearMode === 'fast' ? 'Long Range' : 'Fast Attack'} mode"`,
                    )
                  : b.kind === 'firespitter' && !b.constructing
                    ? button(
                        'sweeper-rotate',
                        `${icon('RotateCw', 21)}<span>Rotate</span>`,
                        'game-btn blue',
                        'aria-label="Rotate Firespitter 90 degrees" title="Rotate clockwise · R"',
                      )
                    : '';
    if (m.editing && b.kind !== 'wall')
      return `<div class="building-context compact" data-anchor="${b.id}"><div class="context-info"><h2>${BUILDINGS[b.kind].name}</h2><span>Level ${b.level} <i>·</i> drag to reposition</span></div>${rotate}</div>`;
    if (b.kind === 'wall' && !b.upgradeEnd) return this.wallContext(b);
    const d = BUILDINGS[b.kind];
    const capped = b.level >= d.maxLevel;
    const gated = !capped && b.level >= m.maxLevel(b.kind);
    return `<div class="building-context" data-anchor="${b.id}"><img class="context-art" src="${hudAsset(b.kind, b.level, b.skeletonMode, b.xbowMode, b.infernoMode)}" alt=""><div class="context-info"><small>${d.category.toUpperCase()}</small><h2>${d.name}</h2><span>Level ${b.level} <i>·</i> ${d.trap ? `${icon('ShieldCheck', 13)} ${b.upgradeEnd ? 'Inactive' : 'Armed'}` : `${icon('Heart', 13)} ${n(b.maxHp)} HP`}</span></div><div class="context-actions">${button('info', `${icon('Info', 21)}<span>Info</span>`, 'game-btn stone')}${button(`move:${b.id}`, `${icon('Move', 21)}<span>Move</span>`, 'game-btn stone')}${rotate}${
      b.upgradeEnd
        ? button(
            `finish:${b.id}`,
            `<small data-upgrade="${b.id}">${time((b.upgradeEnd - m.clock) / 1000)}</small><span>Finish ${gem} <i data-finish="${b.id}">${m.finishCost(b)}</i></span>`,
          )
        : capped
          ? '<span class="max-level">★ Max level</span>'
          : gated
            ? `<span class="max-level locked">${icon('LockKeyhole', 14)} ${requiredTownHall(b.kind, b.level + 1) ? `Town Hall ${requiredTownHall(b.kind, b.level + 1)}` : 'Village tier maximum'}</span>`
            : this.upgradeControl(b)
    }${this.itemButtons(b, capped || gated)}${b.kind === 'blacksmith' ? button('blacksmith', `${icon('Anvil', 20)} Equipment`, 'game-btn blue') : ''}${b.kind === 'clancastle' && !b.constructing && !b.npc ? button('treasury', `${icon('Landmark', 20)} Treasury${TREASURY_RESOURCES.some((k) => m.treasury[k] > 0 && m.treasury[k] >= m.treasuryCapacity[k]) ? '<span class="notification">!</span>' : ''}`, 'game-btn blue') : ''}${b.kind === 'herohall' ? button('heroes', `${icon('ShieldCheck', 20)} Heroes`, 'game-btn blue') : ''}${b.kind === 'herohall' && m.journeyOpen ? button('journey', `${icon('Map', 20)} Journey${m.journeyClaimable.length ? '<span class="notification">!</span>' : ''}`, 'game-btn orange') : ''}${b.kind === 'pethouse' ? button('pets', `${icon('PawPrint', 20)} Pets`, 'game-btn blue') : ''}${b.kind === 'helperhut' ? button('helpers', `${icon('Users', 20)} Helpers${m.helpersIdle ? '<span class="notification">!</span>' : ''}`, 'game-btn blue') : ''}${b.kind === 'townhall' ? button('progression', `${icon('Layers', 20)} Progression`, 'game-btn blue') : ''}${this.mergeButtons(b)}${this.guardianButtons(b)}${this.craftingButton(b)}${b.kind === 'townhall' && !b.upgradeEnd && townHallWeaponUpgrade(b.level, b.weaponLevel ?? 1) ? button(`th-weapon:${b.id}`, `<span>${icon('Zap', 19)} Weapon ${(b.weaponLevel ?? 1) + 1}</span><small>${resource(townHallWeaponUpgrade(b.level, b.weaponLevel ?? 1)!.resource)} ${n(townHallWeaponUpgrade(b.level, b.weaponLevel ?? 1)!.cost)}</small>`, 'game-btn green') : ''}${b.kind === 'laboratory' ? button('research', `${icon('FlaskConical', 20)} Research`, 'game-btn blue') : ''}${b.kind === 'barracks' || b.kind === 'camp' || b.kind === 'spellfactory' ? button('army', `${icon('Swords', 20)} Train`, 'game-btn blue') : ''}${b.kind === 'goldmine' || b.kind === 'collector' || b.kind === 'darkdrill' ? button('collect', `${coin} Collect`, 'game-btn gold') : ''}</div><button class="context-close" data-action="cancel" aria-label="Close building">${icon('X', 18)}</button></div>`;
  }

  /**
   * A building's magic items: a Book for its running upgrade, the Hammer of Building for its next
   * level, and on the Town Hall the inventory itself.
   */
  private itemButtons(b: Building, blocked: boolean) {
    const m = this.model;
    const book = b.upgradeEnd ? m.booksFor({ building: b.id })[0] : undefined;
    const hammer =
      !b.upgradeEnd && !b.constructing && !blocked && m.magicItemCount('hammer-of-building') > 0;
    return `${book ? button(`book-building:${b.id}`, `${icon('BookOpen', 20)}<span>${MAGIC_ITEMS[book].name.replace('Book of ', 'Book: ')}</span>`, 'game-btn blue', `aria-label="Finish with the ${MAGIC_ITEMS[book].name}"`) : ''}${hammer ? button(`hammer-building:${b.id}`, `${icon('Hammer', 20)}<span>Hammer</span>`, 'game-btn blue', `aria-label="Upgrade instantly with the Hammer of Building" ${m.busy >= m.builders ? 'disabled' : ''}`) : ''}${b.kind === 'townhall' ? button('magic-items', `${icon('Sparkles', 20)}<span>Items</span>`, 'game-btn stone', 'aria-label="Magic items"') : ''}`;
  }
  /**
   * Upgrade with everything that decides it in view: cost, duration and free builders, and the
   * exact blocker when there is one (with a way to the building a Town Hall merge needs).
   */
  private upgradeControl(b: Building) {
    const m = this.model,
      d = BUILDINGS[b.kind];
    const issue = m.upgradeIssue(b);
    const free = m.builders - m.busy;
    const facts = `<small class="upgrade-facts">${resource(d.resource)} ${n(m.upgradeCost(b))} <i>·</i> ${icon('Clock3', 12)} ${time(m.upgradeSeconds(b))} <i>·</i> ${icon('Hammer', 12)} ${free}/${m.builders}</small>`;
    const target = issue?.merge ? m.state.buildings.find((v) => v.kind === issue.merge) : undefined;
    return `<span class="upgrade-control">${button(
      `upgrade:${b.id}`,
      `<span>${icon('ArrowBigUp', 19)} Upgrade</span>${facts}`,
      `game-btn ${issue ? 'stone' : 'green'}`,
      issue ? `aria-describedby="upgrade-blocker-${b.id}"` : '',
    )}${issue ? `<small class="upgrade-blocker" id="upgrade-blocker-${b.id}" role="note">${icon('Info', 12)} ${html(issue.reason)}${target ? ` ${button(`select-building:${target.id}`, `Show ${BUILDINGS[target.kind].name}`, 'replay-link')}` : ''}</small>` : ''}</span>`;
  }
  private wallMoveContext() {
    const m = this.model,
      move = m.wallMove!;
    const issue = m.wallPlacementIssue;
    return `<section class="wall-move-toolbar" aria-label="Move wall row">
      <div class="wall-move-heading"><b>Move ${move.source.length} walls</b><span>Tap ground or drag the row · R to rotate</span></div>
      <p class="wall-move-status ${issue ? 'blocked' : ''}" role="status">${issue ?? 'Clear ground · Ready to place'}</p>
      <div class="wall-move-actions">${button('cancel', `${icon('X', 18)} Cancel`, 'game-btn stone')}${button('wall-rotate', `${icon('RotateCw', 18)} Rotate`, 'game-btn blue', 'aria-label="Rotate wall row 90 degrees"')}${button('wall-place', `${icon('Check', 18)} Place`, 'game-btn green', issue ? 'disabled' : '')}</div>
    </section>`;
  }
  /** One wall's Wall Ring upgrade, when rings are held. */
  private ringButton(walls: readonly Building[]) {
    const m = this.model,
      held = m.magicItemCount('wall-ring');
    const rings = walls.length === 1 ? m.wallRingsFor(walls[0].id) : undefined;
    if (m.editing || !held || rings === undefined) return '';
    return button(
      `wall-ring:${walls[0].id}`,
      `<span>${icon('Circle', 18)} Ring</span><small>${rings} of ${held} Wall Rings</small>`,
      'game-btn blue',
      `${held < rings || m.busy >= m.builders ? 'disabled' : ''} aria-label="Upgrade with ${rings} Wall ${rings === 1 ? 'Ring' : 'Rings'}"`,
    );
  }
  private wallContext(anchor: Building) {
    const m = this.model;
    const walls = m.selectedWalls,
      ids = walls.map((b) => b.id);
    const gold = m.wallUpgradeQuote(ids, 'gold'),
      pink = m.wallUpgradeQuote(ids, 'elixir');
    const low = Math.min(...walls.map((b) => b.level)),
      high = Math.max(...walls.map((b) => b.level));
    const rowAvailable = m.wallAxis
      ? m.selectedWallRow(m.wallAxis === 'x' ? 'y' : 'x').length > 1
      : Math.max(m.selectedWallRow('x').length, m.selectedWallRow('y').length) > 1;
    const adjust = (delta: number) =>
      button(
        `wall-count:${delta}`,
        `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`,
        'game-btn stone',
        `${m.canAdjustWallSelection(delta) ? '' : 'disabled'} aria-label="${delta > 0 ? 'Add' : 'Remove'} ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'wall' : 'walls'}"`,
      );
    const purchase = (kind: 'gold' | 'elixir', quote: typeof gold) =>
      button(
        `wall-upgrade:${kind}`,
        `<span>${icon('ArrowBigUp', 18)} Upgrade ${quote.walls.length > 1 ? quote.walls.length : ''}</span><small>${resource(kind)} ${n(quote.cost)}</small>`,
        // Short of the price: grey like the Shop's unaffordable tiles, still tappable for gems.
        `game-btn ${quote.short ? 'stone' : 'green'}`,
        `${quote.issue && !quote.short ? 'disabled' : ''} aria-label="Upgrade ${quote.walls.length} ${quote.walls.length === 1 ? 'wall' : 'walls'} with ${kind}"`,
      );
    const levelText = low === high ? `Level ${low}` : `Levels ${low}–${high}`;
    const note = !gold.walls.length
      ? requiredTownHall('wall', low + 1)
        ? `Requires Town Hall ${requiredTownHall('wall', low + 1)} for the next level.`
        : 'Maximum wall level reached.'
      : m.busy >= m.builders
        ? 'A free builder is needed. Walls finish instantly.'
        : gold.skipped
          ? `${gold.walls.length} of ${walls.length} walls can upgrade; capped or unfinished walls stay as they are.`
          : 'Instant upgrade · Requires one free builder';
    return `<div class="building-context wall-context" data-anchor="${anchor.id}">
      <img class="context-art" src="${hudAsset('wall', anchor.level)}" alt="">
      <div class="context-info"><small>${m.wallAxis ? `WALL ROW ${m.wallAxis === 'x' ? '↘' : '↙'}` : 'WALLS'}</small><h2>${walls.length === 1 ? 'Wall' : `${walls.length} Walls`}</h2><span>${levelText} · ${walls.length} selected</span></div>
      <div class="wall-tools">${button('info', `${icon('Info', 17)} Info`, 'game-btn stone')}${walls.length === 1 ? button(`move:${anchor.id}`, `${icon('Move', 17)} Move`, 'game-btn stone') : button('wall-single', 'Single wall', 'game-btn stone')}${button('wall-row', `${icon('LayoutGrid', 17)} ${m.wallAxis ? 'Other row' : 'Select row'}`, 'game-btn stone', rowAvailable ? '' : 'disabled')}</div>
      ${m.wallAxis ? `<div class="wall-tools wall-row-move">${button('wall-move', `${icon('Move', 18)} Move row`, 'game-btn blue')}</div>` : ''}
      ${m.editing ? '' : m.wallAxis ? `<div class="wall-row-note"><span>Connected row · Each eligible wall gains one level</span>${button('wall-single', 'Select by level', 'game-btn stone')}</div>` : `<div class="wall-quantity" aria-label="Select walls of the same level">${adjust(-10)}${adjust(-1)}<span><b>${walls.length}</b><small>selected</small></span>${adjust(1)}${adjust(10)}</div>`}
      <div class="wall-upgrade-actions">${!m.editing && gold.walls.length ? purchase('gold', gold) + (low >= 4 ? purchase('elixir', pink) : '') : ''}${this.ringButton(walls)}</div>
      <p class="wall-note">${m.editing ? 'Select a row to move or rotate it together.' : note}</p><button class="context-close" data-action="cancel" aria-label="Close wall selection">${icon('X', 18)}</button></div>`;
  }

  /** Hero's Journey: progress, the running quest, magic items and the reward track. */
  private journey() {
    const m = this.model,
      j = m.journey,
      points = m.journeyPoints;
    if (!m.journeyOpen)
      return `<div class="modal-body journey-body"><p class="journey-locked">${icon('LockKeyhole', 22)} Hero’s Journey opens at Town Hall ${JOURNEY_TOWN_HALL} with a Hero Hall.</p></div>`;
    const next = JOURNEY_TIERS.find((t) => t.level > points);
    const claimable = new Set(m.journeyClaimable);
    const quest = j.quest;
    const questCard = quest
      ? `<article class="journey-quest"><span class="eyebrow">HERO QUEST</span><h3>${quest.item ? `${nativeItemImage(quest.item, 'journey-icon')} ${nativeItemName(quest.item)}` : `<img class="journey-icon" src="${heroPortrait(quest.hero)}" alt=""> ${HERO_SOURCE[quest.hero]}`}</h3><p>Win <b>${quest.stars} / ${JOURNEY_QUEST_STARS}</b> stars in ladder matches with ${quest.item ? `${HERO_SOURCE[quest.hero]} carrying it` : 'this hero deployed'} · <span data-journey-quest>${time((quest.ends - m.clock) / 1000)}</span> left</p><div class="journey-bar"><i style="transform:${fillScale((quest.stars / JOURNEY_QUEST_STARS) * 100)}"></i></div></article>`
      : '';
    const items = MAGIC_ITEM_KINDS.filter((k) => (m.state.magicItems?.[k] ?? 0) > 0);
    const upgrading = HERO_KINDS.filter((k) => m.heroProgress(k)?.upgradeEnd);
    const inventory = items.length
      ? `<section class="journey-items"><h3>Magic items</h3>${items
          .map(
            (k) =>
              `<div class="journey-item"><b>${n(m.state.magicItems![k]!)}×</b><span><strong>${MAGIC_ITEMS[k].name}</strong><small>${MAGIC_ITEMS[k].description}</small></span>${
                k === 'book-of-heroes'
                  ? upgrading.length
                    ? upgrading
                        .map((h) =>
                          button(
                            `book-of-heroes:${h}`,
                            `Finish ${HERO_SOURCE[h]}`,
                            'game-btn green',
                          ),
                        )
                        .join('')
                    : '<small class="journey-hint">Use it while a hero upgrades.</small>'
                  : ''
              }</div>`,
          )
          .join('')}</section>`
      : '';
    const rows = JOURNEY_TIERS.map((tier, i) => {
      const taken = j.claimed.includes(i),
        reached = tier.level <= points;
      const done = j.completed?.includes(i);
      const state = taken
        ? `<span class="journey-state">${icon('Check', 16)} ${tier.reward.type === 'quest' ? (done ? 'Quest done' : quest?.tier === i ? 'In progress' : 'Quest ended') : 'Claimed'}</span>`
        : claimable.has(i)
          ? button(
              `journey-claim:${i}`,
              tier.reward.type === 'quest' ? 'Start' : 'Claim',
              'game-btn green',
            )
          : reached
            ? '<span class="journey-state">Finish your quest first</span>'
            : `<span class="journey-state locked">${n(tier.level - points)} more</span>`;
      return `<li class="journey-tier ${taken ? 'taken' : reached ? 'reached' : ''}" id="journey-tier-${i}"><b class="journey-level">${tier.level}</b><span class="journey-reward">${this.journeyReward(tier.reward)}</span>${state}</li>`;
    }).join('');
    return `<div class="modal-body journey-body"><header class="journey-progress"><div><b>${n(points)}</b><small>Hero levels</small></div><div class="journey-bar"><i style="transform:${fillScale(next ? (points / next.level) * 100 : 100)}"></i></div><small>${next ? `Next reward at ${n(next.level)}` : 'Track complete'}</small></header>${questCard}${inventory}<ol class="journey-track">${rows}</ol><p class="journey-note">From the Hero’s Journey wiki track. Ladder matches stand in for multiplayer stars.</p></div>`;
  }
  private journeyReward(r: JourneyReward) {
    switch (r.type) {
      case 'elixir':
      case 'dark':
        return `${resource(r.type)} ${n(r.amount)} ${r.type === 'dark' ? 'Dark Elixir' : 'Elixir'}`;
      case 'ore':
        return `${gearImage(r.ore)} ${n(r.amount)} ${ORES[r.ore].name}`;
      case 'item':
        return `${icon('Sparkles', 18)} ${r.count}× ${r.item}`;
      case 'quest': {
        const target = questTarget(JOURNEY_TIERS.findIndex((t) => t.reward === r));
        return `${icon('Swords', 18)} Quest · ${target?.item ? nativeItemName(target.item) : target ? HERO_SOURCE[target.hero] : r.equipment}`;
      }
      case 'equipment':
        return `${icon('Anvil', 18)} ${HERO_SOURCE[r.hero]} Epic item · level ${r.level}`;
      case 'skin':
        return `${icon('Crown', 18)} Majestic ${HERO_SOURCE[r.hero]} skin`;
    }
  }
  // ----------------------------------------------------------------- battle
  private battleHUD() {
    const m = this.model,
      b = m.battle!,
      v = b.practice
        ? {
            name: m.replay?.recordId === null && !m.goblinRaid ? 'Shared village' : 'Your village',
            gold: 0,
            elixir: 0,
          }
        : { ...campaignStage(b.index, b.catalog), ...b.availableLoot };
    const lootKeys = campaignResourceKeys(v);
    const lootLeft = (k: CampaignResource) =>
      Math.max(0, campaignAmount(v, k) - (b.lootTaken?.[k] ?? 0));
    const limitedStorage =
      !b.practice &&
      !m.replay &&
      lootKeys.some((k) => (b.lootRoom?.[k] ?? campaignAmount(v, k)) < campaignAmount(v, k));
    const lootBar = (k: CampaignResource) =>
      `<div class="loot-row ${k}" aria-label="${k === 'dark' ? 'Dark Elixir' : k} remaining">${resource(k)}<div class="loot-track"><i data-lootbar="${k}" style="transform:${fillScale((lootLeft(k) / Math.max(1, campaignAmount(v, k))) * 100)}"></i></div><b data-loot="${k}">${n(lootLeft(k))}</b></div>`;
    return `<div class="battle-enemy"><span class="eyebrow">${m.goblinRaid ? 'GOBLIN RAID' : m.replay ? (m.replay.recordId === null ? 'SHARED REPLAY' : 'ATTACK REPLAY') : b.practice ? 'PRACTICE ATTACK' : b.ladder ? 'LADDER MATCH' : 'ENEMY VILLAGE'}</span><h2>${v.name}</h2>${m.goblinRaid ? '<small class="practice-note">Goblins are raiding your village!<br>Watch your defenses fight back.</small>' : m.replay ? '<small class="practice-note">Recorded attack · Watch &amp; learn</small>' : b.practice ? '<small class="practice-note">Your village and army are safe.<br>No loot or trophies at stake.</small>' : b.ladder ? `<small class="ladder-stake">${icon('Trophy', 15)} ${n(b.ladder.opponent)} · Win <b>+${b.ladder.win}</b> · Defeat <b>−${b.ladder.loss}</b></small><small class="practice-note">No loot at stake.</small>` : `<small>AVAILABLE LOOT</small><div class="loot-bars">${lootKeys.map(lootBar).join('')}</div>${limitedStorage ? '<small class="loot-capacity-note">Loot beyond your storage capacity will be lost.</small>' : ''}`}</div>
 <div class="battle-clock ${b.started ? '' : 'prep'}"><span>${!timedBattle(b) ? 'NO TIME LIMIT' : b.started ? 'BATTLE ENDS IN' : 'SCOUTING — BATTLE BEGINS IN'}</span><b id="battle-timer">${timedBattle(b) ? clock(b.started ? BATTLE_SECONDS - b.elapsed : b.prep) : '∞'}</b></div>
 <div class="destruction"><span>Total destruction</span><div id="battle-stars" class="battle-stars" data-stars="${b.stars}">${'★'.repeat(b.stars)}<span>${'★'.repeat(3 - b.stars)}</span></div><b id="destruction-value">${b.destruction}%</b><div class="destruction-bar"><i id="destruction-fill" style="transform:${fillScale(b.destruction)}"></i><span class="notch half" style="left:50%"></span><span class="notch full" style="left:100%"></span></div><small>★ 50% <i>·</i> ★ Town Hall <i>·</i> ★ 100%</small></div>
 ${m.practiceGuide && !m.replay ? this.practiceGuideBanner() : !b.started && !m.replay ? `<div class="prep-banner">${icon('Timer', 20)}<div><b>Scout the base</b><small>Tap a defense to see its range · Deploy to start</small></div></div>` : ''}
  ${
    m.replay
      ? this.replayControls()
      : `<div class="battle-bottom"><button class="game-btn red end-battle" data-action="${b.started ? 'surrender' : 'home'}">${icon('Flag', 23)} ${b.started ? 'Surrender' : 'Return home'}</button>${button('battle-speed', `${icon('FastForward', 20)} <b>${m.battleSpeed}×</b>`, `game-btn ${m.battleSpeed > 1 ? 'green' : 'stone'} battle-speed`, `aria-label="Battle speed ${m.battleSpeed}×, tap to change"`)}<div class="deploy-tray"><div class="deploy-label">${this.deployHint()}</div><div class="army-tray">${this.battleHeroCards()}${TROOP_ORDER.filter(
          (k) => b.carriedArmy[k] > 0,
        )
          .map((k) =>
            this.troopCard(
              k,
              b.remaining[k],
              `troop:${k}`,
              !m.activeHero && !m.activeHeroKind && !m.activeSpell && m.activeTroop === k,
            ),
          )
          .join('')}${
          SPELL_ORDER.some((k) => b.carried[k])
            ? `<span class="tray-divider"></span>${SPELL_ORDER.filter((k) => b.carried[k])
                .map((k) => this.spellCard(k, b.spells[k], `spell:${k}`, m.activeSpell === k))
                .join('')}`
            : ''
        }</div></div><div class="battle-tip">${icon('MousePointer2', 19)}<span>Troops <b>1–7, Q, W, E</b> · Spells <b>8, 9, 0</b> · Heroes <b>H</b><br>Drag the base to move the camera</span></div></div>`
  }`;
  }

  // ----------------------------------------------------------------- drawer
  private replayControls() {
    const r = this.model.replay!;
    // The opening raid is something to watch, not study: status, speed and the way home.
    if (this.model.goblinRaid)
      return `<section class="replay-controls goblin-raid-controls" aria-label="Goblin raid">
      <div class="replay-status"><strong>${r.complete ? 'The raid is over' : 'Goblins attacking…'}</strong><span id="replay-time">${clock(r.time)} / ${clock(r.duration)}</span></div>
      <div class="replay-buttons"><div class="replay-speeds" role="group" aria-label="Playback speed">${[1, 2, 4].map((speed) => button(`replay-speed:${speed}`, `${speed}×`, `game-btn ${r.speed === speed ? 'green' : 'stone'}`, `aria-pressed="${r.speed === speed}"`)).join('')}</div>${button('replay-exit', `${icon('House', 17)} Back to village`, `game-btn ${r.complete ? 'green' : 'stone'}`)}</div>
    </section>`;
    return `<section class="replay-controls" aria-label="Replay playback">
      <div class="replay-status"><strong>${r.seeking ? 'Seeking…' : r.complete ? 'Replay complete' : r.paused ? 'Replay paused' : 'Watching replay'}</strong><span id="replay-time">${clock(r.time)} / ${clock(r.duration)}</span></div>
      <input id="replay-progress" data-action="replay-position" type="range" aria-label="Replay position" aria-valuetext="${clock(r.time)}" min="0" max="${r.duration || 1}" step="any" value="${r.seeking ? r.seekTarget : r.time}" ${r.seeking || !r.duration ? 'disabled' : ''}><div class="replay-shortcuts">${button('replay-jump:-10', '−10s', 'replay-link', r.seeking ? 'disabled' : '')}${button('replay-jump:10', '+10s', 'replay-link', r.seeking ? 'disabled' : '')}${button('replay-skip', 'First deployment', 'replay-link', r.seeking ? 'disabled' : '')}${button('replay-export', `${icon('Download', 14)} Export replay`, 'replay-link')}</div>
      <div class="replay-buttons">${button('replay-pause', r.paused ? 'Play' : 'Pause', 'game-btn blue', r.complete || r.seeking ? 'disabled' : '')}${button('replay-restart', `${icon('RotateCcw', 17)} Restart`, 'game-btn stone')}<div class="replay-speeds" role="group" aria-label="Playback speed">${[1, 2, 4].map((speed) => button(`replay-speed:${speed}`, `${speed}×`, `game-btn ${r.speed === speed ? 'green' : 'stone'}`, `aria-pressed="${r.speed === speed}"`)).join('')}</div>${button('replay-exit', 'Back to log', 'game-btn stone')}</div>
    </section>`;
  }
  private deployHint() {
    const m = this.model;
    if (m.activeHeroKind) return this.nativeDeploymentHint(m.activeHeroKind);
    if (m.activeHero) return this.kingDeploymentHint();
    if (m.activeSpell) return `Tap anywhere to cast ${SPELLS[m.activeSpell].name}`;
    return `${TROOPS[m.activeTroop].name} · ${TROOPS[m.activeTroop].prefersResources ? 'Resources ×2' : TROOPS[m.activeTroop].wallBreaker ? 'Walls ×40' : TROOPS[m.activeTroop].prefersDefenses ? 'Targets defenses' : TROOPS[m.activeTroop].role.toLowerCase()} · Tap, hold or drag to deploy`;
  }
  private nativeDeploymentHint(kind: HeroKind) {
    const battle = this.model.battle,
      hero = battle?.nativeHeroes?.find((h) => h.kind === kind),
      unit = battle?.units.find((u) => u.id === hero?.unitId);
    const name = HERO_SOURCE[kind];
    const status =
      !hero || hero.unitId === null
        ? 'Tap outside the red boundary to deploy'
        : unit && unit.hp <= 0
          ? 'Defeated · Returns next attack'
          : hero.abilityUsed
            ? 'Ability used · Fighting'
            : `Tap ${kind === 'king' ? 'his' : 'its'} card or press H to activate`;
    return `${name} · ${status}`;
  }
  private kingDeploymentHint() {
    const battle = this.model.battle,
      hero = battle?.hero,
      unit = battle?.units.find((u) => u.id === hero?.unitId);
    const status =
      !hero || hero.unitId === null
        ? 'Tap outside the red boundary to deploy'
        : unit && unit.hp <= 0
          ? 'Defeated · Returns next attack'
          : hero.abilityUsed
            ? 'Ability used · Fighting'
            : 'Tap his card or press H to activate';
    return `Barbarian King · ${status}`;
  }
  /** Battle cards: the native roster when present, otherwise the legacy King. */
  private battleHeroCards() {
    const m = this.model;
    if (m.battle?.nativeHeroes?.length) return this.nativeHeroCards();
    return this.heroCard();
  }
  private nativeHeroCards() {
    const m = this.model,
      battle = m.battle!;
    return battle
      .nativeHeroes!.map((hero, index) => this.nativeHeroCard(hero.kind, index === 0))
      .join('');
  }
  private nativeHeroCard(kind: HeroKind, hotkey = false) {
    const m = this.model,
      battle = m.battle!,
      hero = battle.nativeHeroes!.find((h) => h.kind === kind)!;
    const unit = battle.units.find((u) => u.id === hero.unitId);
    const defeated = !!unit && unit.hp <= 0;
    const ready = hero.unitId === null;
    const disabled = defeated || (!ready && !!hero.abilityUsed) || !!m.replay;
    const name = HERO_SOURCE[hero.kind];
    const short = name
      .replace('Barbarian ', '')
      .replace('Archer ', '')
      .replace('Grand ', '')
      .replace('Royal ', '')
      .replace('Minion ', '')
      .replace('Dragon ', '');
    const label = ready
      ? `Deploy ${short}`
      : defeated
        ? 'Defeated'
        : hero.abilityUsed
          ? 'Ability used'
          : 'Activate ability';
    const selected = m.activeHeroKind === hero.kind;
    return `<button class="troop-card hero-card ${selected ? 'selected' : ''}" data-hero-state="${hero.kind}:${ready}:${defeated}:${!!hero.abilityUsed}:${selected}" data-action="hero-select:${hero.kind}" aria-label="${name}, ${label}" ${disabled ? 'disabled' : ''}>${hotkey ? '<kbd class="troop-key">H</kbd>' : ''}<img src="${heroPortrait(hero.kind)}" alt=""><span class="troop-level">★ ${hero.level}</span><span class="hero-health"><i style="width:${unit ? pct((unit.hp / unit.maxHp) * 100) : '100%'}"></i></span><span class="troop-name">${label}</span></button>`;
  }
  /** Home village tray: the saved lineup with levels; opens the Hero Hall. */
  private rosterCards() {
    const m = this.model;
    if (!m.heroHall) return '';
    const lineup = m.heroLineup;
    if (!lineup.length) return '';
    return lineup
      .map((kind) => {
        const progress = m.heroProgress(kind);
        if (!progress) return '';
        const upgrading = !!progress.upgradeEnd;
        return `<button class="troop-card hero-card" data-action="heroes" aria-label="${HERO_SOURCE[kind]}, level ${progress.level}${upgrading ? ', upgrading' : ''}"><img src="${heroPortrait(kind)}" alt=""><span class="troop-level">★ ${progress.level}</span><span class="troop-name">${HERO_SOURCE[kind].replace('Barbarian ', '').replace('Archer ', '').replace('Grand ', '').replace('Royal ', '').replace('Minion ', '').replace('Dragon ', '')}</span></button>`;
      })
      .join('');
  }
  private heroCard() {
    const m = this.model,
      h = m.battle?.hero;
    if (m.battle) {
      if (!h) return '';
    } else {
      // Home village uses the roster preview instead of a single King card.
      return this.rosterCards();
    }
    const u = m.battle!.units.find((u) => u.id === h!.unitId);
    const defeated = !!u && u.hp <= 0;
    const ready = h!.unitId === null;
    const disabled = defeated || (!ready && h!.abilityUsed);
    const label = ready
      ? 'Deploy King'
      : defeated
        ? 'Defeated'
        : h!.abilityUsed
          ? 'Ability used'
          : 'Activate ability';
    return `<button class="troop-card hero-card ${m.activeHero ? 'selected' : ''}" data-hero-state="${ready}:${defeated}:${h!.abilityUsed}:${m.activeHero}" data-action="hero-select" aria-label="Barbarian King, ${label}" ${disabled ? 'disabled' : ''}><kbd class="troop-key">H</kbd><img src="${hudAsset('king')}" alt=""><span class="troop-level">★ ${h!.level}</span><span class="hero-health"><i style="width:${u ? pct((u.hp / u.maxHp) * 100) : '100%'}"></i></span><span class="troop-name">${label}</span></button>`;
  }
  /** The client's builder menu: work under way, then suggested and other upgrades. */
  private builderMenu() {
    const m = this.model,
      menu = builderMenu(m);
    const option = (o: BuilderOption) => {
      const d = BUILDINGS[o.kind],
        price = `${o.resource === 'gems' ? gem : resource(o.resource as 'gold')} ${n(o.cost)}`;
      return `<li>${button(
        `builder-option:${o.kind},${o.level}`,
        `<img src="${hudAsset(o.kind, Math.max(1, o.level))}" alt=""><span><b>${html(d.name)}${o.ids.length > 1 ? ` <i>×${o.ids.length}</i>` : ''}</b><small>${o.level ? `Level ${o.level} → ${o.level + 1}` : 'New'}</small></span><em class="${o.affordable ? '' : 'short'}">${price}</em>`,
        'builder-option',
        `aria-label="${html(d.name)}${o.ids.length > 1 ? `, ${o.ids.length} of them` : ''}: ${o.level ? `level ${o.level} to ${o.level + 1}` : 'new'}, ${n(o.cost)} ${o.resource}${o.affordable ? '' : ', not enough'}"`,
      )}</li>`;
    };
    // The work under way counts down like the boost timers ([data-boost-end]).
    const jobs = menu.jobs.length
      ? `<ul class="builder-list">${menu.jobs
          .map(
            (j) =>
              `<li>${button(
                j.id === undefined ? 'heroes' : j.id < 0 ? 'close' : `select-building:${j.id}`,
                `${icon('Hammer', 18)}<span><b>${html(j.name)}</b><small>${html(j.detail)}</small></span><em data-boost-end="${j.end}">${time(Math.max(0, j.end - m.clock) / 1000)}</em>`,
                'builder-option working',
              )}</li>`,
          )
          .join('')}</ul>`
      : `<p class="builder-idle">${icon('Hammer', 16)} All builders are free.</p>`;
    return `<div class="modal-body builder-menu"><h3>${html(BUILDER_MENU_TEXTS.inProgress)}</h3>${jobs}${menu.suggested.length ? `<h3>${html(BUILDER_MENU_TEXTS.suggested)}</h3><ul class="builder-list">${menu.suggested.map(option).join('')}</ul>` : ''}${menu.other.length ? `<h3>${html(BUILDER_MENU_TEXTS.other)}</h3><ul class="builder-list">${menu.other.map(option).join('')}</ul>` : ''}<footer class="builder-foot">${button('builder-hut', `${icon('Plus', 18)} More builders`, 'game-btn green', 'aria-label="Builder huts in the Shop"')}</footer></div>`;
  }
  private treasureTitle() {
    const p = this.treasureConfirm;
    return p ? GEM_TEXTS.packHeader.replace('<resource>', GEM_TEXTS[p.resource]) : '';
  }
  /** Confirms a Treasure pack, as the client asks before spending the gems. */
  private treasureBody() {
    const m = this.model,
      p = this.treasureConfirm;
    if (!p) return '';
    const pack = m.resourcePack(p.resource, p.share),
      name = GEM_TEXTS[p.resource];
    return `<div class="modal-body confirm-body shortfall-body"><p class="confirm-line">${resource(p.resource)} ${pack.amount ? html(GEM_TEXTS.packText.replace('<count>', n(pack.amount)).replace('<resource>', name)) : html(GEM_TEXTS.packLocked)}</p><p class="gem-balance">You have ${gem} <b>${n(m.state.gems)}</b> gems</p>${pack.issue ? `<p class="ore-insufficient">${html(pack.issue)}</p>` : ''}<div class="confirm-actions">${button('close', html(GEM_TEXTS.cancel), 'game-btn stone')}${button('treasure-buy', `${gem} ${n(pack.gems)}`, 'game-btn green', `${pack.issue ? 'disabled' : ''} aria-label="Buy ${n(pack.amount)} ${name} for ${n(pack.gems)} gems"`)}</div></div>`;
  }
  private shortfallTitle() {
    const offer = this.model.shortfallOffer;
    return offer ? GEM_TEXTS.header.replace('<resource>', GEM_TEXTS[offer.resource]) : '';
  }
  /** The client's offer of a refused price's missing resource for gems. */
  private shortfallBody() {
    const m = this.model,
      offer = m.shortfallOffer;
    if (!offer) return '';
    const name = GEM_TEXTS[offer.resource],
      short = offer.gems > m.state.gems;
    return `<div class="modal-body confirm-body shortfall-body"><p class="confirm-line">${resource(offer.resource)} ${html(GEM_TEXTS.text.replace('<count>', n(offer.missing)).replace('<resource>', name))}</p><p class="gem-balance">You have ${gem} <b>${n(m.state.gems)}</b> gems</p>${short ? `<p class="ore-insufficient">${html(GEM_TEXTS.notEnoughGems)}. Earn more by clearing obstacles and completing achievements.</p>` : ''}<div class="confirm-actions">${button('close', html(GEM_TEXTS.cancel), 'game-btn stone')}${button('shortfall-buy', `${gem} ${n(offer.gems)}`, 'game-btn green', `${short ? 'disabled' : ''} aria-label="Buy ${n(offer.missing)} ${name} for ${n(offer.gems)} gems"`)}</div></div>`;
  }
  /** The Trader's Weekly Deals: the free one, then this week's Gem offers. */
  /** The Clan Castle's Treasury: what it holds against its Town Hall size, and collection. */
  private treasury() {
    const m = this.model,
      held = m.treasury,
      capacity = m.treasuryCapacity;
    const names = { gold: 'Gold', elixir: 'Elixir', dark: 'Dark Elixir' } as const;
    const rows = TREASURY_RESOURCES.filter((k) => capacity[k] > 0)
      .map((k) => {
        const share = Math.min(100, (held[k] / capacity[k]) * 100);
        return `<div class="treasury-row${held[k] >= capacity[k] ? ' full' : ''}" data-treasury="${k}">${resource(k)}<div><b>${names[k]}</b><span class="journey-bar" role="progressbar" aria-label="${names[k]} in the Treasury" aria-valuemin="0" aria-valuemax="${capacity[k]}" aria-valuenow="${held[k]}"><i style="width:${share}%"></i></span></div><small>${n(held[k])} / ${n(capacity[k])}</small></div>`;
      })
      .join('');
    const any = TREASURY_RESOURCES.some((k) => held[k] > 0);
    return `<div class="modal-body treasury-body">${rows}<p class="treasury-note">The Star Bonus is banked here. Collecting moves everything at once; whatever your storages cannot hold stays in the Treasury. Without a clan, its size follows your Town Hall.</p></div><footer class="modal-footer">${button('treasury-collect', `${icon('Download', 16)} Collect`, 'game-btn green', any ? '' : 'disabled')}<span>Town Hall ${m.townhall?.level ?? 1} Treasury</span></footer>`;
  }
  private trader() {
    const m = this.model;
    const art = (deal: TraderOffer) =>
      'item' in deal.good
        ? `<img src="/${MAGIC_ITEMS[deal.good.item].icon!.path}" alt="" width="54" height="${Math.round((54 * MAGIC_ITEMS[deal.good.item].icon!.height) / MAGIC_ITEMS[deal.good.item].icon!.width)}" loading="lazy">`
        : gearImage(deal.good.ore);
    const name = (deal: TraderOffer) =>
      'item' in deal.good ? MAGIC_ITEMS[deal.good.item].name : ORES[deal.good.ore].name;
    return `<div class="modal-body magic-items-body"><div class="magic-item-grid">${m.traderDeals
      .map((deal) => {
        const issue = m.traderIssue(deal),
          left = deal.quantity - m.traderBought(deal.id);
        return `<article class="magic-item trader-deal" data-deal="${deal.id}">${art(deal)}<div><h3>${deal.amount}× ${name(deal)} <b>${left}/${deal.quantity} left</b></h3><p>${'item' in deal.good ? html(MAGIC_ITEMS[deal.good.item].description) : `Ore for Hero Equipment, kept at the Blacksmith (${n(m.ores[deal.good.ore])} / ${n(m.oreCapacity[deal.good.ore])}).`}</p><div class="magic-item-actions">${button(`trader-buy:${deal.id}`, deal.gems ? `${gem} ${n(deal.gems)}` : 'Free', `game-btn ${issue ? 'stone' : 'green'}`, issue ? 'disabled' : '')}${issue && issue !== 'Not enough gems' ? `<small class="item-note">${issue}</small>` : ''}</div></div></article>`;
      })
      .join(
        '',
      )}</div></div><footer class="modal-footer">${gem} ${n(m.state.gems)} gems ${button('magic-items', `${icon('Sparkles', 16)} Magic items`, 'game-btn stone')}<span>Raid Medal deals need the Clan Capital</span></footer>`;
  }
  /** The Town Hall's magic items: what each does, how many are held, and its use or sale. */
  private magicItems() {
    const m = this.model;
    const held = (k: string) => m.magicItemCount(k);
    const kinds = [...MAGIC_ITEM_KINDS].sort((a, b) => Number(!held(a)) - Number(!held(b)));
    const use = (k: string) => {
      const effect = MAGIC_ITEMS[k].effect;
      // A running potion shows its time even when none is left to drink.
      const left = 'boost' in effect ? m.boostLeft(effect.boost) : 0;
      const running = left
        ? `<small class="item-note">${icon('Clock3', 12)} ${time(left)} left</small>`
        : '';
      if (!held(k)) return running;
      if ('fill' in effect)
        return button(
          `item-rune:${k}`,
          'Use',
          'game-btn green',
          m.state[effect.fill] >= m.resourceCap(effect.fill) ? 'disabled' : '',
        );
      if ('boost' in effect) {
        return `${running}${button(`item-potion:${k}`, left ? 'Extend' : 'Use', 'game-btn green')}`;
      }
      if ('finish' in effect) {
        const targets = [
          ...m.state.buildings
            .filter((b) => b.upgradeEnd)
            .map(
              (b) => [`book-building:${b.id}`, BUILDINGS[b.kind].name, { building: b.id }] as const,
            ),
          ...(m.state.research ? [['book-research', 'Research', { research: true }] as const] : []),
          ...HERO_KINDS.filter((h) => m.heroProgress(h)?.upgradeEnd).map(
            (h) => [`book-hero:${h}`, HERO_SOURCE[h], { hero: h }] as const,
          ),
          ...(m.state.pets?.research ? [['book-pet', 'Pet', { pet: true }] as const] : []),
        ].filter(([, , target]) => m.booksFor(target as never)[0] === k);
        return targets.length
          ? targets
              .map(([action, name]) => button(action, `Finish ${name}`, 'game-btn green'))
              .join('')
          : '<small class="item-note">Nothing it can finish is upgrading.</small>';
      }
      const where =
        'upgrade' in effect
          ? effect.upgrade.includes('building')
            ? 'Use it from a building’s card.'
            : effect.upgrade.includes('hero')
              ? 'Use it in the Hero Hall or Pet House.'
              : 'Use it in the Laboratory.'
          : 'ring' in effect
            ? 'Use it from a wall’s card.'
            : 'super' in effect
              ? 'Use it on a Super Troop in the army.'
              : 'shovel' in effect
                ? 'Use it from an obstacle’s card.'
                : 'Kept until its use arrives.';
      return `<small class="item-note">${where}</small>`;
    };
    return `<div class="modal-body magic-items-body"><div class="magic-item-grid">${kinds
      .map((k) => {
        const d = MAGIC_ITEMS[k];
        return `<article class="magic-item ${held(k) ? '' : 'empty'}" data-item="${k}">${d.icon ? `<img src="/${d.icon.path}" alt="" width="${d.icon.width / 2}" height="${d.icon.height / 2}" loading="lazy">` : ''}<div><h3>${d.name} <b>${held(k)}/${d.max}</b></h3><p>${html(d.description)}</p><div class="magic-item-actions">${use(k)}${held(k) && d.gemValue ? button(`item-sell:${k}`, `Sell ${gem} ${d.gemValue}`, 'game-btn stone') : ''}</div></div></article>`;
      })
      .join(
        '',
      )}</div></div><footer class="modal-footer">${gem} ${n(m.state.gems)} gems ${button('trader', `${icon('ShoppingBasket', 16)} Weekly Deals`, 'game-btn orange')}<span>Items that do not fit are sold for their gems</span></footer>`;
  }
  private heroes() {
    const m = this.model,
      king = m.state.king,
      hall = m.heroHall;
    if (!king || !hall)
      return `<div class="modal-body hero-body"><div class="hero-portrait"><img src="${hudAsset('king')}" alt="Barbarian King"></div><h2>Meet the Barbarian King</h2><p>Build a Hero Hall at Town Hall 4 to unlock your first hero. He fights without army housing and returns at full health for every attack.</p>${button('shop', 'Open the shop', 'game-btn green')}</div>`;
    const slots = nativeHeroSlots(hall.level);
    const lineup = m.heroLineup;
    return `<div class="modal-body hero-body">
      <p class="hero-stats-note">Hero Hall ${hall.level} · ${slots} battle slot${slots === 1 ? '' : 's'} · ${lineup.length} selected. Heroes use no army space and return at full health for every attack.</p>
      ${m.boostLeft('heroes') ? `<p class="hero-stats-note potion-level">${icon('Sparkles', 14)} Hero Potion · ${time(m.boostLeft('heroes'))} left · heroes and pets fight at their Town Hall maximum.</p>` : ''}
      ${HERO_KINDS.map((kind) => this.heroRosterCard(kind)).join('')}
      ${button('practice', 'Practice with this army', 'game-btn blue', m.armyReady ? '' : 'disabled')}
    </div>`;
  }
  /** One roster entry: unlock gate, native stats, equipment, pet, upgrade and lineup. */
  private heroRosterCard(kind: HeroKind) {
    const m = this.model,
      hall = m.heroHall!,
      name = HERO_SOURCE[kind],
      progress = m.heroProgress(kind);
    if (!m.heroUnlocked(kind)) {
      const th = heroUnlockTownHall(kind),
        hh = heroUnlockHall(kind);
      return `<section class="hero-section" data-hero="${kind}"><article class="hero-overview"><div class="hero-portrait"><img src="${heroPortrait(kind)}" alt="${name}"></div><div><span class="eyebrow">HERO HALL ${hall.level}</span><h2>${name}</h2><p>Locked · Requires Town Hall ${th} and Hero Hall ${hh}</p></div></article></section>`;
    }
    if (!progress)
      return `<section class="hero-section" data-hero="${kind}"><article class="hero-overview"><div class="hero-portrait"><img src="${heroPortrait(kind)}" alt="${name}"></div><div><span class="eyebrow">HERO HALL ${hall.level}</span><h2>${name}</h2><p>Unlocked · Joining your village…</p></div></article></section>`;
    const inLineup = m.heroLineup.includes(kind);
    const gear = m.gear,
      loadout = (gear.loadouts[kind] ?? []).filter((slug) => gear.levels[slug] !== undefined),
      setup = {
        kind,
        level: progress.level,
        items: loadout.slice(0, 2).map((slug) => ({ slug, level: gear.levels[slug] })),
      };
    const native = heroStatsFor(setup, m.townhallLevel),
      heal = heroAbilityHeal(setup, m.townhallLevel);
    const pet = m.petProgress.assigned[kind];
    // The King keeps its original upgrade record; the other five use the native quote.
    const isKing = kind === 'king';
    const max = isKing ? m.heroMaxLevel : m.heroLevelMax(kind);
    const capped = progress.level >= max;
    const quote = isKing ? null : nativeHeroUpgradeQuote(kind, progress.level);
    const required = isKing
      ? heroNextRequirement(progress.level)
      : quote
        ? null
        : (() => {
            const cap = nativeHeroLevelCap(kind, 18, 12);
            return progress.level >= cap ? null : { townhall: 0, hall: 0 };
          })();
    const missing = !required
      ? []
      : [
          ...(required.townhall > m.townhallLevel ? [`Town Hall ${required.townhall}`] : []),
          ...(required.hall > hall.level ? [`Hero Hall ${required.hall}`] : []),
        ];
    // The next level's stats, when there is one, so an upgrade shows what it buys.
    const upcoming = capped
      ? null
      : heroStatsFor({ ...setup, level: progress.level + 1 }, m.townhallLevel);
    const stat = (label: string, value: number, next?: number, suffix = '') =>
      `<div>${label}<b>${damageNumber(value)}${suffix}${next === undefined || damageNumber(next) === damageNumber(value) ? '' : ` → ${damageNumber(next)}${suffix}`}</b></div>`;
    const scale = heroTownHallScale(kind, m.townhallLevel);
    const upgradeCostText = isKing
      ? `${resource('dark')} ${n(heroUpgradeCost(progress.level))} · Upgrade to ${progress.level + 1}`
      : quote
        ? `${resource(quote.resource as 'dark' | 'elixir' | 'gold')} ${n(quote.cost)} · Upgrade to ${quote.level}`
        : '';
    const upgradeDisabled = isKing
      ? m.busy >= m.builders || m.state.dark < heroUpgradeCost(progress.level)
      : !quote ||
        m.busy >= m.builders ||
        m.state[quote.resource as 'dark' | 'elixir' | 'gold'] < quote.cost;
    const upgradeSecondsText = isKing
      ? time(heroUpgradeSeconds(progress.level))
      : quote
        ? time(quote.seconds)
        : '';
    return `<section class="hero-section" data-hero="${kind}"><article class="hero-overview"><div class="hero-portrait"><img src="${isKing ? hudAsset('king') : heroPortrait(kind)}" alt="${name}"></div><div><span class="eyebrow">HERO HALL ${hall.level}${inLineup ? ` · SLOT ${m.heroLineup.indexOf(kind) + 1} OF ${nativeHeroSlots(hall.level)}` : ' · BENCHED'}</span><h2>${name}</h2><p>Level ${progress.level} / ${max} · ${progress.upgradeEnd ? 'Upgrading' : inLineup ? 'In battle lineup' : 'Benched'}${pet ? ` · ${PET_DISPLAY[pet as keyof typeof PET_DISPLAY] ?? pet}` : ''}</p></div></article>
      ${`<div class="hero-stat-grid">${stat('Hitpoints', native.hp, upcoming?.hp)}${stat('Damage per second', native.dps, upcoming?.dps)}${stat('Damage per hit', native.damage, upcoming?.damage)}${stat('Attack interval', native.rate, undefined, 's')}${stat('Attack range', native.range, undefined, native.range === 1 ? ' tile' : ' tiles')}${stat('Movement', native.speed, undefined, ' tiles/s')}</div>
      ${scale < 1 ? `<p class="hero-scaling">Town Hall ${m.townhallLevel} strength: ${scale * 100}% health, damage and recovery. Full strength at Town Hall 6.</p>` : ''}
      <p class="hero-stats-note">Stats include the equipped items below.</p>
      <p class="hero-activation"><b>Recover ${damageNumber(heal)} hitpoints on activation.</b> Tap the deployed hero's card or press H to use both items once per attack.</p>
      ${
        loadout.length
          ? `<div class="hero-equipment">${loadout
              .slice(0, 2)
              .map(
                (slug) =>
                  `<article class="hero-ability">${nativeItemImage(slug, 'hero-gear-icon')}<span class="eyebrow">EQUIPPED · LEVEL ${gear.levels[slug]}</span><h3>${nativeItemName(slug)}</h3>${button(`native-slot:${slug}`, 'View equipment', 'replay-link')}</article>`,
              )
              .join('')}</div>`
          : ''
      }`}
      <p class="hero-stats-note">Pet: ${pet ? (PET_DISPLAY[pet as keyof typeof PET_DISPLAY] ?? pet) : 'none'} · ${button('pets', 'Manage pets', 'replay-link')}</p>
      <div class="hero-upgrade"><p>${resource('dark')} <b data-resource="dark">${n(m.state.dark)}</b> dark elixir · ${resource('elixir')} <b data-resource="elixir">${n(m.state.elixir)}</b> elixir</p>${progress.upgradeEnd ? `<p>Upgrade completes in <b data-hero-timer="${kind}">${time((progress.upgradeEnd - m.clock) / 1000)}</b></p>${button(`hero-finish:${kind}`, `Finish ${gem} <span data-hero-gems="${kind}">${m.finishCost({ upgradeEnd: progress.upgradeEnd } as Building)}</span>`, 'game-btn green')}${m.booksFor({ hero: kind }).length ? button(`book-hero:${kind}`, `${icon('BookOpen', 17)} ${MAGIC_ITEMS[m.booksFor({ hero: kind })[0]].name}`, 'game-btn blue') : ''}` : capped ? `<p class="max-level">${isKing && m.townhallLevel < 7 ? 'Hero upgrades unlock at Town Hall 7' : missing.length ? `Upgrade to ${missing.join(' and ')}` : 'Maximum hero level'}</p>` : `${button(`hero-upgrade:${kind}`, upgradeCostText, 'game-btn green', upgradeDisabled ? 'disabled' : '')}${m.magicItemCount('hammer-of-heroes') ? button(`hammer-hero:${kind}`, `${icon('Hammer', 17)} Hammer of Heroes`, 'game-btn blue', m.busy >= m.builders ? 'disabled' : '') : ''}<p>${upgradeSecondsText} · Requires one free builder</p>`}</div>
      ${inLineup ? '' : `<div class="hero-upgrade">${m.heroLineup.length >= nativeHeroSlots(hall.level) ? button(`hero-lineup:${kind}`, `Swap in for ${HERO_SOURCE[m.heroLineup[m.heroLineup.length - 1]]}`, 'game-btn blue') : button(`hero-lineup:${kind}`, 'Add to lineup', 'game-btn blue')}</div>`}</section>`;
  }
  /** Pet House: research one pet at a time and assign one pet to each hero. */
  private pets() {
    const m = this.model,
      house = m.petHouse;
    if (!house)
      return `<div class="modal-body hero-body"><div class="hero-portrait"><img src="${PET_PORTRAIT.lassi}" alt="L.A.S.S.I"></div><h2>Meet your future companions</h2><p>Build a Pet House to research pets and assign one to each hero. A pet deploys with its hero and stays by its side in battle.</p>${button('shop', 'Open the shop', 'game-btn green')}</div>`;
    const pets = m.petProgress,
      research = pets.research;
    const heroButtons = (pet: PetKind, assigned?: string) =>
      HERO_KINDS.filter((hero) => m.heroProgress(hero))
        .map((hero) =>
          button(
            `pet-assign:${pet},${hero}`,
            HERO_SOURCE[hero]
              .replace('Barbarian ', '')
              .replace('Archer ', '')
              .replace('Grand ', '')
              .replace('Royal ', '')
              .replace('Minion ', '')
              .replace('Dragon ', ''),
            `game-btn ${assigned === hero ? 'green' : 'stone'}`,
            assigned === hero
              ? 'disabled'
              : `aria-label="Assign ${PET_DISPLAY[pet]} to ${HERO_SOURCE[hero]}"`,
          ),
        )
        .join('') +
      (assigned ? button(`pet-assign:${pet},none`, 'Unassign', 'game-btn stone') : '');
    return `<div class="modal-body hero-body">
      <p class="hero-stats-note">Pet House ${house.level} · ${research ? `Researching ${PET_DISPLAY[research.kind]} to level ${(pets.levels[research.kind] ?? 0) + 1}` : 'No research in progress'} · One pet per hero.</p>
      ${PET_KINDS.map((kind) => {
        const level = pets.levels[kind];
        if (level === undefined)
          return `<section class="hero-section" data-pet="${kind}"><article class="hero-overview"><div class="hero-portrait"><img src="${PET_PORTRAIT[kind]}" alt="${PET_DISPLAY[kind]}"></div><div><span class="eyebrow">PET HOUSE ${house.level}</span><h2>${PET_DISPLAY[kind]}</h2><p>Locked · Requires Pet House ${petUnlockHouse(kind)}</p></div></article></section>`;
        const cap = petLevelCap(kind, house.level),
          max = petMaxLevel(kind),
          capped = level >= cap,
          quote = !capped && !research ? petUpgradeQuote(kind, level) : null;
        const assigned = Object.entries(pets.assigned).find(([, p]) => p === kind)?.[0];
        return `<section class="hero-section" data-pet="${kind}"><article class="hero-overview"><div class="hero-portrait"><img src="${PET_PORTRAIT[kind]}" alt="${PET_DISPLAY[kind]}"></div><div><span class="eyebrow">PET HOUSE ${house.level}</span><h2>${PET_DISPLAY[kind]}</h2><p>Level ${level} / ${max}${level >= max ? ' · Max' : capped ? ` · Pet House cap ${cap}` : ''} · ${assigned ? HERO_SOURCE[assigned as HeroKind] : 'Unassigned'}</p></div></article>
        <div class="hero-upgrade">${research?.kind === kind ? `<p>Upgrade completes in <b data-pet-timer>${time((research.end - m.clock) / 1000)}</b></p>${button('pet-finish', `Finish ${gem} <span data-pet-gems>${m.finishCost({ upgradeEnd: research.end } as Building)}</span>`, 'game-btn green')}${m.booksFor({ pet: true }).length ? button('book-pet', `${icon('BookOpen', 17)} ${MAGIC_ITEMS[m.booksFor({ pet: true })[0]].name}`, 'game-btn blue') : ''}` : capped ? `<p class="max-level">${level >= max ? 'Maximum pet level' : `Upgrade the Pet House for higher levels`}</p>` : quote ? `${button(`pet-research:${kind}`, `${resource(quote.resource as 'dark' | 'elixir' | 'gold')} ${n(quote.cost)} · Research to ${quote.level}`, 'game-btn green', research || m.state[quote.resource as 'dark' | 'elixir' | 'gold'] < quote.cost || !!m.battle ? 'disabled' : '')}${m.magicItemCount('hammer-of-heroes') ? button(`hammer-pet:${kind}`, `${icon('Hammer', 17)} Hammer of Heroes`, 'game-btn blue', m.battle ? 'disabled' : '') : ''}<p>${time(quote.seconds)} · One research at a time</p>` : ''}</div>
        <div class="hero-upgrade"><p>Assigned to</p><div>${heroButtons(kind, assigned)}</div></div></section>`;
      }).join('')}
    </div>`;
  }
  /** Hero tabs above the forge: one loadout per hero the village has. */
  private smithTabs() {
    const m = this.model;
    const tab = (value: HeroKind, label: string) =>
      button(
        `blacksmith-hero:${value}`,
        label,
        `tab ${this.inspectedSmithHero === value ? 'active' : ''}`,
        `role="tab" aria-selected="${this.inspectedSmithHero === value}"`,
      );
    return `<div class="shop-tabs" role="tablist" aria-label="Hero equipment">${HERO_KINDS.filter(
      (hero) => m.heroProgress(hero),
    )
      .map((hero) => tab(hero, HERO_SOURCE[hero].replace('Barbarian ', '')))
      .join('')}</div>`;
  }
  /** Native equipment for one hero: two loadout slots, the full catalog, upgrades and Epic offers. */
  private nativeBlacksmith(hero: HeroKind) {
    const m = this.model,
      gear = m.gear,
      catalog = heroItems(hero),
      loadout = (gear.loadouts[hero] ?? []).filter((slug) => gear.levels[slug] !== undefined),
      unlocked = !!m.blacksmith;
    let slug = this.inspectedNativeItem;
    if (!catalog.includes(slug)) slug = loadout[0] ?? catalog[0] ?? '';
    const level = gear.levels[slug],
      owned = level !== undefined,
      rarity = slug ? itemRarity(slug) : null,
      cap = slug ? itemLevelCap(slug, m.blacksmithLevel) : 0,
      max = slug ? itemMaxLevel(slug) : 0,
      cost = owned && slug ? itemUpgradeCost(slug, level) : null;
    const purchase = this.nativeOrePurchase;
    const stats = slug ? nativeItemStats(slug, owned ? level : 1) : null;
    return `<div class="modal-body blacksmith-body">
      <div class="ore-wallet" aria-label="Ore storage">${ORE_KEYS.map((k) => `<div class="ore-balance ${k}">${gearImage(k)}<span>${ORES[k].name}<b>${n(m.ores[k])}<small> / ${n(m.oreCapacity[k])}</small></b></span></div>`).join('')}</div>
      ${this.smithTabs()}
      ${unlocked ? '' : `<div class="equipment-locked">${icon('LockKeyhole', 20)}<span>Build a Blacksmith at Town Hall 8 to equip and upgrade items. Your default equipment is ready for battle.</span>${button('shop', 'Shop', 'game-btn green')}</div>`}
      <div class="king-loadout"><img class="loadout-portrait" src="${heroPortrait(hero)}" alt="${HERO_SOURCE[hero]}"><div class="loadout-label"><span class="eyebrow">${HERO_SOURCE[hero].toUpperCase()}</span><h2>Equipped abilities</h2><p>Both activate together, once per attack.</p></div><div class="equipment-slots">${[
        0, 1,
      ]
        .map((slot) => {
          const equipped = loadout[slot];
          return equipped
            ? button(
                `native-slot:${equipped}`,
                `${nativeItemImage(equipped)}<span>Slot ${slot + 1}<b>${nativeItemName(equipped)}</b></span><em>${gear.levels[equipped]}</em>`,
                'equipment-slot',
                `aria-label="Slot ${slot + 1}: ${nativeItemName(equipped)}, level ${gear.levels[equipped]}"`,
              )
            : `<span class="equipment-slot" aria-label="Slot ${slot + 1}: empty">Slot ${slot + 1}<b>Empty</b></span>`;
        })
        .join('')}</div></div>
      <div class="equipment-catalog" role="group" aria-label="${HERO_SOURCE[hero]} equipment">${catalog
        .map((s) => {
          const own = gear.levels[s] !== undefined;
          return button(
            `native-item:${s}`,
            `<span class="equipment-badge">${loadout.includes(s) ? 'Equipped' : own ? 'Available' : itemRarity(s) === 'EPIC' ? 'Epic' : 'Locked'}</span>${nativeItemImage(s)}<strong>${nativeItemName(s)}</strong><span class="equipment-level">${own ? `Level ${gear.levels[s]} / ${itemMaxLevel(s)}` : itemRarity(s)}</span>`,
            `equipment-card ${s === slug ? 'selected' : ''}`,
            `aria-pressed="${s === slug}"`,
          );
        })
        .join('')}</div>
      ${
        slug
          ? `<section class="equipment-detail" aria-label="${nativeItemName(slug)} details"><div class="equipment-detail-heading">${nativeItemImage(slug)}<div><span class="eyebrow">${rarity} · ${stats!.passive ? 'PASSIVE' : 'ACTIVE ABILITY'}</span><h2>${nativeItemName(slug)}</h2><p>${owned ? `Level ${level} / ${max}` : `${rarity} item · Not owned`}</p></div></div>
      ${
        stats
          ? `<table class="equipment-stats"><thead><tr><th>Attribute</th><th>${owned ? `Level ${level}` : 'Level 1'}</th></tr></thead><tbody>${[
              ['Hitpoint increase', stats.hp ? `+${n(stats.hp)}` : '—'],
              ['Damage per second', stats.dps ? `+${n(stats.dps)}` : '—'],
              ['Hitpoint recovery', stats.heal ? n(stats.heal) : '—'],
              [
                'Attack speed',
                stats.attackSpeed ? `+${Math.round(stats.attackSpeed * 100)}%` : '—',
              ],
              ['Abilities', stats.abilities.map((a) => a.name).join(', ') || '—'],
            ]
              .map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`)
              .join('')}</tbody></table>`
          : ''
      }
      ${owned ? `<div class="equipment-equip">${loadout.includes(slug) ? `<span class="equipped-label">${icon('Check', 18)} Equipped in slot ${loadout.indexOf(slug) + 1}</span>` : [0, 1].map((slot) => button(`native-equip:${slug},${slot}`, `Equip in slot ${slot + 1}`, 'game-btn blue', unlocked && !m.battle ? '' : 'disabled')).join('')}</div>` : ''}
      ${!owned && rarity === 'EPIC' ? `<div class="equipment-upgrade"><div><b>Buy for ${gem} ${n(EPIC_ITEM_GEMS)}</b><p>Instant · Epic items are sold, not forged</p></div>${button(`epic-buy:${slug}`, `${icon('ArrowBigUp', 20)} Buy`, 'game-btn green', unlocked && m.state.gems >= EPIC_ITEM_GEMS && !m.battle ? '' : 'disabled')}</div>` : ''}
      ${
        owned && cost
          ? `<div class="equipment-upgrade"><div><b>Upgrade to level ${level + 1}</b><p>Instant · No builder needed</p><div class="equipment-cost">${ORE_KEYS.filter(
              (k) => cost[k],
            )
              .map(
                (k) =>
                  `<span class="${m.ores[k] < cost[k] ? 'short' : ''}">${gearImage(k)}${n(cost[k])}<small>${ORES[k].name}</small></span>`,
              )
              .join(
                '',
              )}</div></div>${button(`native-upgrade:${slug},${level}`, `${icon('ArrowBigUp', 20)} Upgrade`, 'game-btn green', unlocked && !m.battle ? '' : 'disabled')}</div>`
          : ''
      }
      ${owned && !cost ? `<p class="max-level">${level >= max ? 'Maximum item level' : `Upgrade the Blacksmith to raise this item further (cap ${cap}).`}</p>` : ''}
      ${
        purchase && purchase.slug === slug
          ? `<div class="ore-confirm-body"><p>Use your stored ore and buy the missing amount below.</p><div class="missing-ores">${ORE_KEYS.filter(
              (k) => cost && cost[k] > m.ores[k],
            )
              .map((k) => {
                const missing = cost![k] - m.ores[k];
                return `<div>${gearImage(k)}<span><b>${n(missing)}</b> ${ORES[k].name}</span><strong>${gem}${n(missing * ORES[k].gems)}</strong></div>`;
              })
              .join(
                '',
              )}</div><p class="gem-balance">You have ${gem} <b>${n(m.state.gems)}</b> gems</p>${purchase.gems > m.state.gems ? '<p class="ore-insufficient">Not enough gems. Earn more by clearing obstacles and completing achievements.</p>' : ''}<div class="confirm-actions">${button('native-ore-cancel', 'Cancel', 'game-btn stone')}${button('native-ore-buy', `Buy & upgrade ${gem} ${n(purchase.gems)}`, 'game-btn green', purchase.gems > m.state.gems || m.gear.levels[slug] !== purchase.level ? 'disabled' : '')}</div></div>`
          : ''
      }
      </section>`
          : '<p class="hero-stats-note">Select an item to inspect it.</p>'
      }
      <p class="ore-source-note">Ore comes from the Star Bonus (collect it under Your legacy), and missing ore can be purchased with gems during an upgrade. Hero’s Journey quests (Hero Hall, Town Hall 7+) open Ore Chests. Clan War rewards are not available in this village.</p>
    </div>`;
  }
  /**
   * Every hero's equipment, King included, is the native `gear` record the battles carry. With
   * no hero yet, the King's items preview what the forge will work on.
   */
  private blacksmith() {
    const m = this.model;
    const hero = m.heroProgress(this.inspectedSmithHero)
      ? this.inspectedSmithHero
      : (HERO_KINDS.find((kind) => m.heroProgress(kind)) ?? 'king');
    return this.nativeBlacksmith(hero);
  }
  private progression() {
    const m = this.model;
    return `<div class="modal-body progression-body"><p>Current Town Hall: <b>${m.townhallLevel}</b>. Upgrade your Town Hall to unlock buildings and raise their level limits.</p>${Array.from(
      { length: MAX_TOWNHALL },
      (_, i) => {
        const th = i + 1;
        const changed = (Object.keys(BUILDINGS) as BuildingKind[]).filter(
          (k) => k !== 'townhall' && BUILDING_LEVELS[k][i] > (BUILDING_LEVELS[k][i - 1] ?? 0),
        );
        const armyUnlocks = [
          ...TROOP_ORDER.filter(
            (k) => requiredTownHall(troopFacility(k), TROOP_UNLOCK[k]) === th,
          ).map(
            (k) =>
              `<span class="progression-unlock"><img src="${hudAsset(k)}" alt=""><span>${TROOPS[k].name}<small>${BUILDINGS[troopFacility(k)].name} ${TROOP_UNLOCK[k]}</small></span></span>`,
          ),
          ...SPELL_ORDER.filter(
            (k) => requiredTownHall(spellFactory(k), SPELL_UNLOCK[k]) === th,
          ).map(
            (k) =>
              `<span class="progression-unlock"><img src="${hudAsset(k)}" alt=""><span>${SPELLS[k].name}<small>${spellUnlockLabel(k)}</small></span></span>`,
          ),
        ].join('');
        return `<article class="progression-tier ${th === m.townhallLevel ? 'current' : ''}"><h2>Town Hall ${th}${th === m.townhallLevel ? ' · Current' : ''}</h2><div>${changed.map((k) => `<span class="progression-unlock"><img src="${hudAsset(k, BUILDING_LEVELS[k][i])}" alt=""><span>${BUILDINGS[k].name}<small>${(BUILDING_LEVELS[k][i - 1] ?? 0) === 0 ? 'Unlock · ' : ''}Level ${BUILDING_LEVELS[k][i]}</small></span></span>`).join('')}${armyUnlocks}</div></article>`;
      },
    ).join('')}</div>`;
  }
  /** Army catalog search and filters; kept while the drawer is closed and reopened. */
  /** Builder menu groups by `kind,level`: how many taps each has had, to cycle its buildings. */
  private builderTurns = new Map<string, number>();
  /** The Treasure pack waiting for its confirmation. */
  private treasureConfirm: { resource: GemResource; share: TreasurePack['share'] } | null = null;
  private armyFilter = { query: '', show: 'all' as ArmyShow, family: 'all' as ArmyFamily };
  private armyFilters() {
    const f = this.armyFilter;
    const option = (value: string, label: string, current: string) =>
      `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`;
    return `<div class="army-filters" role="search"><input id="army-search" type="search" placeholder="Search army" aria-label="Search troops and spells" autocomplete="off" value="${html(f.query)}"><select id="army-show" aria-label="Show">${option('all', 'All', f.show)}${option('unlocked', 'Unlocked', f.show)}${option('ready', 'Ready', f.show)}</select><select id="army-family" aria-label="Family">${option('all', 'Every family', f.family)}${option('elixir', 'Elixir troops', f.family)}${option('dark', 'Dark troops', f.family)}${option('super', 'Super troops', f.family)}${option('siege', 'Siege machines', f.family)}${option('spells', 'Spells', f.family)}</select></div>`;
  }
  /** Whether a catalog tile passes the Army drawer's search and filters. */
  private armyShown(kind: TroopKind | SpellKind, spell: boolean) {
    const m = this.model,
      f = this.armyFilter;
    const name = (spell ? SPELLS[kind as SpellKind] : TROOPS[kind as TroopKind]).name;
    const query = f.query.trim().toLowerCase();
    if (query && !name.toLowerCase().includes(query)) return false;
    const unlocked = spell
      ? m.spellUnlocked(kind as SpellKind)
      : m.troopUnlocked(kind as TroopKind);
    const ready = spell
      ? m.state.spells[kind as SpellKind] > 0
      : m.state.army[kind as TroopKind] > 0;
    if ((f.show === 'unlocked' && !unlocked) || (f.show === 'ready' && !ready)) return false;
    if (f.family === 'all') return true;
    if (spell) return f.family === 'spells';
    return troopFamily(kind as TroopKind) === f.family;
  }
  private drawer() {
    if (!this.drawerPanel || this.model.battle) return '';
    const titles = { shop: 'Shop', army: 'Army' };
    const body = this.drawerPanel === 'shop' ? this.shop() : this.army();
    const head = `<header class="drawer-head${this.drawerPanel === 'army' ? ' army-head' : ''}"><h2 tabindex="-1">${titles[this.drawerPanel]}</h2>${this.drawerPanel === 'shop' ? `<div class="shop-tabs" role="tablist" aria-label="Building category">${['All', 'Resources', 'Army', 'Defenses', 'Traps', DECORATION_TEXTS.shopTab, GEM_TEXTS.treasureTab].map((t) => button(`tab:${t}`, t, `tab ${this.tab === t ? 'active' : ''}`, `role="tab" aria-selected="${this.tab === t}"`)).join('')}</div>` : `<nav class="army-categories" aria-label="Army catalog">${button('army-jump:troops', `${icon('Tent', 17)}<span>Troops<b>${this.model.armySize + this.model.queuedSize}/${this.model.capacity}</b></span>`, 'army-category', `aria-label="Show troops, ${this.model.armySize + this.model.queuedSize} of ${this.model.capacity} housing spaces"`)}${button('army-jump:spells', `${icon('Sparkles', 17)}<span>Spells<b>${this.model.spellHousing}/${this.model.spellCapacity}</b></span>`, 'army-category', `aria-label="Show spells, ${this.model.spellHousing} of ${this.model.spellCapacity} housing spaces"`)}</nav>${this.armyFilters()}`}<button class="square-btn small close-btn" data-action="close-drawer" aria-label="Close">${icon('X', 22)}</button></header>`;
    const open = `<section class="drawer-sheet" aria-label="${titles[this.drawerPanel]}">`;
    this.drawerParts = { open, head, body: body.body, items: body.items, foot: body.foot };
    return `${open}${head}${body.body}${body.items.join('')}</div>${body.foot}</section>`;
  }
  /** The Decorations tab: the client's Shop rows, with stashed ones placed again for free. */
  private decorationShop() {
    const m = this.model;
    const cards = DECORATION_KINDS.map((k) => {
      const d = DECORATIONS[k],
        owned = m.decorationCount(k),
        stashed = m.stashedDecorations[k] ?? 0;
      const locked = !stashed && m.chiefLevel < d.chiefLevel;
      const full = !stashed && owned >= d.max;
      const afford = stashed > 0 || m.state[d.resource] >= d.cost;
      const label = stashed
        ? `${icon('Move', 13)} Place · free`
        : locked
          ? `${icon('LockKeyhole', 13)} Level ${d.chiefLevel}`
          : full
            ? 'At limit'
            : `${resource(d.resource)} ${n(d.cost)}`;
      return `<article class="shop-tile decoration-tile ${locked || full ? 'unavailable' : ''}" data-decoration="${k}"><div class="shop-tile-art"><img src="/${d.art.path}" alt="" draggable="false"></div><h3>${d.name}</h3><small class="shop-count">${owned}/${d.max}${stashed ? ` · ${stashed} in Shop` : ''}</small>${button(`decoration:${k}`, label, `game-btn ${locked || full || !afford ? 'stone' : 'green'} shop-buy`, locked || full ? 'disabled' : '')}</article>`;
    });
    return {
      body: '<div class="drawer-body shop-strip">',
      items: cards,
      foot: `<footer class="drawer-foot">${icon('Sparkles', 16)} Purely ornamental · no builder needed <span>Decorations may also stand on the outer edge</span></footer>`,
    };
  }
  /** The client's Treasure: each resource the village stores in three packs, bought with gems. */
  private treasureShop() {
    const m = this.model;
    const cards = TREASURE_PACKS.filter((p) => m.resourceCap(p.resource) > 0).map((p) => {
      const pack = m.resourcePack(p.resource, p.share),
        blocked = !!pack.issue && pack.issue !== GEM_TEXTS.notEnoughGems;
      return `<article class="shop-tile treasure-tile ${blocked ? 'unavailable' : ''}" data-pack="${p.resource}-${p.share}"><div class="shop-tile-art"><img src="/${p.art.path}" alt="" draggable="false" width="${p.art.width}" height="${p.art.height}"></div><h3>${html(p.name)}</h3><small class="shop-count">${resource(p.resource)} ${pack.amount ? `+${n(pack.amount)}` : '—'}</small>${button(`treasure-pack:${p.resource},${p.share}`, blocked ? html(GEM_TEXTS.packLocked) : `${gem} ${n(pack.gems)}`, `game-btn ${pack.issue ? 'stone' : 'green'} shop-buy`, `${blocked ? 'disabled' : ''} aria-label="${html(p.name)}: ${pack.amount ? `${n(pack.amount)} ${GEM_TEXTS[p.resource]} for ${n(pack.gems)} gems` : html(GEM_TEXTS.packLocked)}"`)}</article>`;
    });
    return {
      body: '<div class="drawer-body shop-strip">',
      items: cards,
      foot: `<footer class="drawer-foot">${gem} ${n(m.state.gems)} gems <span>Packs fill your storages at once</span></footer>`,
    };
  }
  private shop() {
    const m = this.model;
    if (this.tab === DECORATION_TEXTS.shopTab) return this.decorationShop();
    if (this.tab === GEM_TEXTS.treasureTab) return this.treasureShop();
    const cards = (Object.entries(BUILDINGS) as [BuildingKind, (typeof BUILDINGS)[BuildingKind]][])
      .filter(([k, d]) => k !== 'townhall' && (this.tab === 'All' || d.category === this.tab))
      // A kind retired past its Town Hall (the Eagle Artillery, merged into the Inferno Artillery
      // at Town Hall 17) leaves the Shop, as in the original, unless the village still has one.
      .filter(([k]) => m.maxCount(k) > 0 || m.townhallLevel < unlockTownHall(k) || m.countOf(k) > 0)
      // Buildable tiles first in catalog order, then locked ones by their Town Hall requirement.
      .sort(
        ([a], [b]) =>
          Number(m.maxCount(a) === 0) - Number(m.maxCount(b) === 0) ||
          (m.maxCount(a) === 0 ? unlockTownHall(a) - unlockTownHall(b) : 0),
      )
      .map(([k, d]) => {
        const count = m.countOf(k),
          limit = m.maxCount(k);
        const locked = limit === 0;
        const full = !locked && count >= limit;
        // A Builder's Hut is priced per hut in gems, so the tile quotes the next one.
        const price = buildPrice(k, count);
        const afford = m.state[price.resource] >= price.cost;
        if (isMergedKind(k))
          return `<article class="shop-tile unavailable"><div class="shop-tile-art"><img src="${hudAsset(k)}" alt="" draggable="false"></div><h3>${d.name}</h3><small class="shop-count">${locked ? `Town Hall ${unlockTownHall(k)}` : `${count}/${limit}`}</small>${button(
            `build:${k}`,
            `${icon('Layers', 13)} Merge ${mergeInputs(k)
              .map(
                (input) =>
                  `${input.geared ? 'geared ' : ''}${BUILDINGS[input.kind].name} ${input.level}`,
              )
              .join(' + ')}`,
            'game-btn stone shop-buy',
            'disabled',
          )}</article>`;
        return `<article class="shop-tile ${full || locked ? 'unavailable' : ''}" ${full || locked ? '' : `data-drag="${k}"`}><div class="shop-tile-art"><img src="${hudAsset(k)}" alt="" draggable="false"></div><h3>${d.name}</h3><small class="shop-count">${locked ? `Town Hall ${unlockTownHall(k)}` : `${count}/${limit}`}</small>${button(`build:${k}`, locked ? `${icon('LockKeyhole', 13)} Locked` : full ? 'At limit' : price.cost === 0 ? 'Free' : `${resource(price.resource)} ${n(price.cost)}`, `game-btn ${locked || full || !afford ? 'stone' : 'green'} shop-buy`, locked || full ? 'disabled' : '')}</article>`;
      });
    return {
      body: '<div class="drawer-body shop-strip">',
      items: cards,
      foot: `<footer class="drawer-foot">${icon('Hammer', 16)} ${m.builders - m.busy} of ${m.builders} builders free <span>Drag a building onto the village, or tap to pick it up</span></footer>`,
    };
  }
  private army() {
    const m = this.model;
    const upgradingFacilities = (['barracks', 'spellfactory'] as const)
      .filter((kind) =>
        m.state.buildings.some((b) => b.kind === kind && !b.constructing && !!b.upgradeEnd),
      )
      .map((kind) => BUILDINGS[kind].name);
    const preparationLabel = upgradingFacilities.length
      ? 'Free &amp; instant during upgrades'
      : 'Free &amp; instant preparation';
    const overTroops = m.armySize + m.queuedSize > m.capacity;
    const overSpells = m.spellHousing + m.queuedSpellHousing > m.spellCapacity;
    const overCapacity = overTroops || overSpells;
    const power = m.boostLeft('army');
    const preparationNote = power
      ? `Power Potion · ${time(power)} left · troops and spells fight at their Town Hall maximum`
      : overCapacity
        ? overTroops && overSpells
          ? 'Your army is kept. Deploy or remove troops and spells to make room.'
          : overSpells
            ? 'Your army is kept. Deploy or remove spells to make room.'
            : 'Your troops are kept. Deploy or remove troops to make room.'
        : upgradingFacilities.length
          ? `${upgradingFacilities.join(' and ')} upgrading`
          : 'Rage and Healing use 2 spell spaces · Lightning uses 1';
    const troopTile = (k: TroopKind) => {
      const d = m.troopStats(k);
      const unlocked = m.troopUnlocked(k);
      const room = m.troopRoom(k);
      const blocked =
        !unlocked ||
        (isSiege(k)
          ? TROOP_KEYS.filter(isSiege).reduce((n, kind) => n + (m.state.army[kind] ?? 0), 0) >= 3
          : m.armySize + m.queuedSize + d.space > m.capacity);
      return `<article class="shop-tile army-tile ${unlocked ? '' : 'army-locked'}" data-army-category="troops"><div class="shop-tile-art"${blocked ? '' : ` data-add="train:${k}" data-repeat`}><img src="${hudAsset(k)}" alt="" draggable="false">${d.flying ? '<span class="air-tag">AIR</span>' : ''}</div><h3>${d.name} ${m.armyLevel(k) > m.troopLevel(k) ? `<small class="potion-level" title="Power Potion">★${m.troopDisplayLevel(k) + m.armyLevel(k) - m.troopLevel(k)}</small>` : `<small>★${m.troopDisplayLevel(k)}</small>`}</h3>${button(`troop-info:${k}`, `${icon('Info', 13)} ${d.role}`, 'troop-info-button', `aria-label="About ${d.name}"`)}<small class="shop-count">${icon('Heart', 11)} ${d.hp} ${icon('Swords', 11)} ${d.damage} ${icon('Users', 11)} ${d.space}</small>${superOriginal(k) && unlocked && m.state.superBoosts?.[k] ? `<small class="boost-left">${icon('Clock3', 11)} Boosted · <b data-boost-end="${m.state.superBoosts[k]}">${time((m.state.superBoosts[k]! - m.clock) / 1000)}</b> left</small>` : ''}${superOriginal(k) && !unlocked && m.magicItemCount('super-potion') ? button(`super-potion:${k}`, `Boost · Super Potion (${m.magicItemCount('super-potion')})`, 'game-btn blue shop-buy', m.townhallLevel < 11 || m.troopLevel(superOriginal(k)!) < superMinimum(k) ? 'disabled' : '') : ''}${superOriginal(k) && !unlocked ? button(`boost-super:${k}`, `Boost · ${Number(superLicence(k)?.ResourceCost).toLocaleString()} dark · 3 days`, 'game-btn purple shop-buy', m.townhallLevel < 11 || m.troopLevel(superOriginal(k)!) < superMinimum(k) ? 'disabled' : '') + `<small>TH11 · ${TROOPS[superOriginal(k)!].name} level ${superMinimum(k)}</small>` : ''}${button(`train:${k}`, unlocked ? `+ Add` : `${icon('LockKeyhole', 13)} ${BUILDINGS[troopFacility(k)].name} ${TROOP_UNLOCK[k]}`, `game-btn ${blocked ? 'stone' : 'green'} shop-buy`, `${blocked ? 'disabled' : ''} data-repeat title="Hold to keep adding"`)}<span class="army-bulk">${button(`train-five:${k}`, `×5`, 'game-btn stone shop-buy tiny', blocked || isSiege(k) || m.armySize + m.queuedSize + d.space * 5 > m.capacity ? 'disabled' : '')}${button(`train-fill:${k}`, `Fill${room ? ` +${room}` : ''}`, 'game-btn stone shop-buy tiny', `${room ? '' : 'disabled'} aria-label="Fill: add ${room} ${d.name}${isSiege(k) ? '' : `, ${room * d.space} housing space${room * d.space === 1 ? '' : 's'}`}"`)}</span><span class="army-bulk">${button(`remove-troop:${k}`, `${icon('Minus', 12)} Remove`, 'army-remove', `aria-label="Remove one ${d.name}" data-repeat ${m.state.army[k] ? '' : 'disabled'}`)}${button(`remove-all-troop:${k}`, 'All', 'army-remove', `aria-label="Remove every ${d.name}" ${m.state.army[k] > 1 ? '' : 'disabled'}`)}</span><small class="shop-note"><b data-army-count="troop:${k}">${m.state.army[k]}</b> ready · ${isSiege(k) ? `Siege reserve ${m.siegeCount}/3 · one per battle` : `${d.space} space${d.space === 1 ? '' : 's'}`}</small></article>`;
    };
    const spellTile = (k: SpellKind) => {
      const d = m.spellStats(k);
      const unlocked = m.spellUnlocked(k);
      const room = m.spellRoom(k);
      const blocked = !unlocked || m.spellHousing + d.space > m.spellCapacity;
      return `<article class="shop-tile army-tile ${unlocked ? '' : 'army-locked'}" data-army-category="spells"><div class="shop-tile-art"${blocked || !m.spellCapacity ? '' : ` data-add="brew:${k}" data-repeat`}><img src="${hudAsset(k)}" alt="" draggable="false"></div><h3>${d.name.replace(' Spell', '')} <small>★${m.spellLevel(k)}</small></h3>${button(`spell-info:${k}`, `${icon('Info', 13)} ${d.role}`, 'troop-info-button', `aria-label="About ${d.name}"`)}<small class="shop-count">${d.effect}</small>${button(`brew:${k}`, unlocked ? '+ Add' : `${icon('LockKeyhole', 13)} ${spellFactory(k) === 'darkspellfactory' ? 'Dark ' : ''}Factory ${SPELL_UNLOCK[k]}`, `game-btn ${blocked || !m.spellCapacity ? 'stone' : 'green'} shop-buy`, `${blocked || !m.spellCapacity ? 'disabled' : ''} data-repeat title="Hold to keep adding"`)}${button(`brew-fill:${k}`, `Fill${room ? ` +${room}` : ''}`, 'game-btn stone shop-buy tiny', `${room ? '' : 'disabled'} aria-label="Fill: add ${room} ${d.name}, ${room * d.space} spell space${room * d.space === 1 ? '' : 's'}"`)}<span class="army-bulk">${button(`remove-spell:${k}`, `${icon('Minus', 12)} Remove`, 'army-remove', `aria-label="Remove one ${d.name}" data-repeat ${m.state.spells[k] ? '' : 'disabled'}`)}${button(`remove-all-spell:${k}`, 'All', 'army-remove', `aria-label="Remove every ${d.name}" ${m.state.spells[k] > 1 ? '' : 'disabled'}`)}</span><small class="shop-note"><b data-army-count="spell:${k}">${m.state.spells[k]}</b> ready · ${d.space} spell space${d.space === 1 ? '' : 's'}</small></article>`;
    };
    const troopTiles = TROOP_ORDER.filter((k) => this.armyShown(k, false)).map(troopTile);
    const spellTiles = SPELL_ORDER.filter((k) => this.armyShown(k, true)).map(spellTile);
    return {
      body: '<div class="drawer-body army-strip">',
      items: [
        `<div class="army-actions modern-army-actions" role="toolbar" aria-label="Army actions"><span class="army-ready-label">READY WHEN YOU ARE</span>${armyAction('heroes', 'ShieldCheck', 'Heroes', 'blue')}${armyAction('progression', 'Layers', 'Progression', 'stone')}${armyAction('army-presets', 'Save', 'Quick armies', 'green')}${armyAction('retrain', 'RotateCcw', 'Last army', 'stone', !m.state.lastArmy)}${armyAction('research', 'FlaskConical', 'Research', 'blue')}${armyAction('practice', 'Swords', 'Practice', 'blue', !m.armyReady)}${armyAction('clear-army', 'X', 'Clear army', 'stone', !(m.armySize || m.siegeCount || m.spellCount))}</div>`,
        ...troopTiles,
        ...(troopTiles.length && spellTiles.length
          ? ['<span class="tray-divider tall"></span>']
          : []),
        ...spellTiles,
        ...(troopTiles.length || spellTiles.length
          ? []
          : [
              `<p class="army-empty">No troops or spells match. ${button('army-filter-clear', 'Clear filters', 'replay-link')}</p>`,
            ]),
      ],
      foot: `<footer class="drawer-foot ${overCapacity ? 'army-over-capacity' : ''}">${icon(overCapacity ? 'UsersRound' : 'Check', 17)} ${overCapacity ? 'Over capacity' : preparationLabel} <span>${preparationNote}</span></footer>`,
    };
  }

  // ----------------------------------------------------------------- modals
  private modal() {
    const titles: Record<string, string> = {
      'troop-info': TROOPS[this.inspectedTroop].name,
      'spell-info': SPELLS[this.inspectedSpell].name,
      'army-presets': 'Quick armies',
      cookbook: ARMY_RECIPE_TEXTS.tab,
      'battle-log': 'Battle log',
      blacksmith: 'Hero Equipment',
      heroes: 'Hero Hall',
      'magic-items': 'Magic items',
      trader: 'Weekly Deals',
      shortfall: this.shortfallTitle(),
      treasure: this.treasureTitle(),
      builders: 'Builders',
      treasury: 'Treasury',
      starter: STARTER_TITLE,
      journey: 'Hero’s Journey',
      crafting: 'Crafting Station',
      helpers: 'Helper Hut',
      pets: 'Pet House',
      progression: 'Town Hall progression',
      research: 'The laboratory',
      campaign: 'The Goblin Valley',
      'campaign-scout': 'Scout village',
      settings: 'Settings',
      'import-confirm': 'Replace this village?',
      buildings: 'Buildings',
      achievements: 'Your legacy',
      help: 'Welcome, Chief',
      info: 'Building details',
      layouts: 'Saved layouts',
      surrender: 'End this battle?',
    };
    const subtitles: Record<string, string> = {
      'troop-info': 'Know your troops. Plan your attack.',
      'spell-info': 'Place each spell where it makes the difference.',
      'army-presets': 'Save a composition. Be ready in one tap.',
      cookbook: ARMY_RECIPE_TEXTS.info,
      'battle-log': 'Your last twenty attacks, kept with your village.',
      blacksmith: 'Forge your King’s abilities.',
      heroes: 'A champion for every attack.',
      journey: 'Every hero level moves you along the track.',
      'magic-items': 'Kept in your Town Hall. Use them, or cash them in for gems.',
      trader: `New deals in ${time((traderWeekEnds(this.model.clock) - this.model.clock) / 1000)}!`,
      treasury: 'Star Bonus loot, kept safe in your Clan Castle.',
      shortfall: 'Gems complete the price, then it goes ahead.',
      treasure: 'Straight into your storages.',
      builders: BUILDER_MENU_TEXTS.hint,
      starter: STARTER_END_TEXT,
      crafting: 'One platform, three defenses. Switch any time.',
      helpers: 'Assign Helpers to jobs around the village.',
      pets: 'A companion for every hero.',
      progression: 'See what each Town Hall unlocks.',
      research: 'A little elixir. A stronger army.',
      campaign: 'Beyond the forest, a whole valley is waiting.',
      'campaign-scout': 'Study the layout before you attack.',
      settings: 'Make yourself at home.',
      'import-confirm': 'Check the backup before it replaces your village.',
      buildings: 'Every building in your village, for keyboard and screen reader play.',
      achievements: 'Small victories. A growing legend.',
      help: 'Your village. Your army. Your adventure.',
      info: 'What this level gives you, and what the next one adds.',
      layouts: 'Three slots. Rearrange freely, restore instantly.',
      surrender: this.model.battle?.practice
        ? 'Your village and army are safe.'
        : 'Your loot so far is kept.',
    };
    const content =
      this.panel === 'magic-items'
        ? this.magicItems()
        : this.panel === 'shortfall'
          ? this.shortfallBody()
          : this.panel === 'treasure'
            ? this.treasureBody()
            : this.panel === 'builders'
              ? this.builderMenu()
              : this.panel === 'trader'
                ? this.trader()
                : this.panel === 'treasury'
                  ? this.treasury()
                  : this.panel === 'starter'
                    ? this.starterPass()
                    : this.panel === 'blacksmith'
                      ? this.blacksmith()
                      : this.panel === 'heroes'
                        ? this.heroes()
                        : this.panel === 'journey'
                          ? this.journey()
                          : this.panel === 'crafting'
                            ? this.crafting()
                            : this.panel === 'helpers'
                              ? this.helpers()
                              : this.panel === 'pets'
                                ? this.pets()
                                : this.panel === 'progression'
                                  ? this.progression()
                                  : this.panel === 'army-presets'
                                    ? this.armyPresets()
                                    : this.panel === 'cookbook'
                                      ? this.cookbook()
                                      : this.panel === 'battle-log'
                                        ? this.battleLog()
                                        : this.panel === 'spell-info'
                                          ? this.spellInfo()
                                          : this.panel === 'troop-info'
                                            ? this.troopInfo()
                                            : this.panel === 'campaign'
                                              ? this.campaign()
                                              : this.panel === 'campaign-scout'
                                                ? this.campaignScout()
                                                : this.panel === 'settings'
                                                  ? this.settings()
                                                  : this.panel === 'import-confirm'
                                                    ? this.importConfirm()
                                                    : this.panel === 'buildings'
                                                      ? this.buildingList()
                                                      : this.panel === 'achievements'
                                                        ? this.achievements()
                                                        : this.panel === 'research'
                                                          ? this.research()
                                                          : this.panel === 'info'
                                                            ? this.info()
                                                            : this.panel === 'layouts'
                                                              ? this.layoutPanel()
                                                              : this.panel === 'surrender'
                                                                ? this.surrender()
                                                                : this.help();
    return `<div class="modal-backdrop"><section class="modal ${this.panel === 'campaign' ? 'campaign-modal' : ''} ${this.panel === 'surrender' ? 'small-modal' : this.panel === 'blacksmith' ? 'blacksmith-modal' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><small>CODEFORGE</small><h1 id="modal-title">${titles[this.panel!]}</h1><p>${subtitles[this.panel!]}</p></div><button class="square-btn small close-btn" data-action="close" aria-label="Close dialog">${icon('X', 25)}</button></header>${content}</section></div>`;
  }
  private composition(
    army: import('../game/model').Army,
    spells: import('../game/model').SpellBook,
  ) {
    return `<div class="composition">${TROOP_ORDER.filter((k) => army[k])
      .map(
        (k) =>
          `<span title="${TROOPS[k].name}" aria-label="${army[k]} ${TROOPS[k].name}"><img src="${hudAsset(k)}" alt=""><b>×${army[k]}</b></span>`,
      )
      .join('')}${SPELL_ORDER.filter((k) => spells[k])
      .map(
        (k) =>
          `<span title="${SPELLS[k].name}" aria-label="${spells[k]} ${SPELLS[k].name}"><img src="${hudAsset(k)}" alt=""><b>×${spells[k]}</b></span>`,
      )
      .join('')}</div>`;
  }
  /** A Quick army's heroes, items and pets, and what loading it here would change. */
  private presetHeroes(preset: ArmyPreset, note = 'When used here:') {
    const plan = this.model.presetHeroPlan(preset);
    const heroes = preset
      .heroes!.map((hero) => {
        const extras = [
          ...hero.items.map((slug) => nativeItemName(slug)),
          ...(hero.pet ? [PET_DISPLAY[hero.pet as keyof typeof PET_DISPLAY] ?? hero.pet] : []),
        ];
        return `<b>${HERO_SOURCE[hero.kind]}</b>${extras.length ? ` (${extras.map(html).join(', ')})` : ''}`;
      })
      .join(' · ');
    return `<p class="preset-heroes">${icon('ShieldCheck', 14)} ${heroes}</p>${plan.changes.length ? `<p class="preset-empty">${note} ${plan.changes.map(html).join(' · ')}.</p>` : ''}`;
  }
  private armyPresets() {
    const m = this.model;
    return `<div class="modal-body preset-body">${this.presetTabs()}<p class="preset-current">Current army: <b>${m.armySize}/${m.capacity}</b> troop spaces · <b>${m.spellHousing}/${m.spellCapacity}</b> spell spaces</p>${[
      0, 1, 2,
    ]
      .map((slot) => {
        const p = m.state.armyPresets?.[slot];
        const fits =
          p && armySpace(p.army) <= m.capacity && spellSpace(p.spells) <= m.spellCapacity;
        const issue = p ? m.armyPreparationIssue(p.army, p.spells) : null;
        return `<article class="preset-card"><div class="preset-title"><span class="preset-number">${slot + 1}</span><label for="preset-name-${slot}">Army name<input id="preset-name-${slot}" maxlength="32" value="${html(this.presetNames.get(slot) ?? p?.name ?? `Army ${slot + 1}`)}"></label><small>${p ? `${armySpace(p.army)} troop · ${spellSpace(p.spells)} spell spaces${presetSiege(p.army) ? ` · ${presetSiege(p.army)} siege` : ''}` : 'Empty slot'}</small></div>${p ? this.composition(p.army, p.spells) : '<p class="preset-empty">Build an army in the Army drawer, then save it here.</p>'}${p?.heroes?.length ? this.presetHeroes(p) : ''}<div class="preset-actions">${button(`preset-save:${slot}`, `${icon('Save', 16)} ${p ? 'Save current army' : 'Save army'}`, 'game-btn stone', m.canSaveArmyPreset ? '' : 'disabled')}${m.canUndoSlot('preset', slot) ? button(`preset-undo:${slot}`, `${icon('RotateCcw', 16)} Undo save`, 'game-btn stone') : ''}${button(`preset-load:${slot}`, `${icon('Check', 16)} ${p && !fits ? 'Needs more housing' : issue ? 'Locked composition' : 'Use army'}`, 'game-btn green', fits && !issue ? '' : 'disabled')}</div>${issue ? `<p class="preset-empty">${issue}</p>` : ''}</article>`;
      })
      .join(
        '',
      )}${button('army', `${icon('Swords', 17)} Edit current army`, 'game-btn blue')}</div>`;
  }
  /** Quick armies and the Cookbook, as the original's army screen tabs them. */
  private presetTabs() {
    const tab = (panel: Panel, label: string) =>
      button(
        panel!,
        label,
        `tab ${this.panel === panel ? 'active' : ''}`,
        `role="tab" aria-selected="${this.panel === panel}"`,
      );
    return `<div class="shop-tabs preset-tabs" role="tablist" aria-label="Army recipes">${tab('army-presets', 'Quick armies')}${tab('cookbook', ARMY_RECIPE_TEXTS.tab)}</div>`;
  }
  /** The Cookbook: the client's Featured and Creator recipes for this Town Hall. */
  private cookbook() {
    const m = this.model,
      recipes = m.armyRecipes;
    const empty =
      m.townhallLevel < FIRST_RECIPE_TOWN_HALL
        ? `Featured and Creator recipes start appearing at Town Hall ${FIRST_RECIPE_TOWN_HALL}.`
        : `No recipes for Town Hall ${m.townhallLevel} yet.`;
    return `<div class="modal-body preset-body cookbook-body">${this.presetTabs()}<p class="preset-current">Current army: <b>${m.armySize}/${m.capacity}</b> troop spaces · <b>${m.spellHousing}/${m.spellCapacity}</b> spell spaces</p>${
      recipes.length
        ? recipes.map((recipe) => this.recipeCard(recipe)).join('')
        : `<p class="preset-empty">${empty} Save your own armies under Quick armies.</p>`
    }</div>`;
  }
  private recipeCard(recipe: ArmyRecipe) {
    const m = this.model,
      issue = m.armyPreparationIssue(recipe.army, recipe.spells);
    const castleArmy = emptyArmy(),
      castleSpells = emptySpells();
    for (const [k, count] of recipe.castle.troops) castleArmy[k] += count;
    for (const [k, count] of recipe.castle.spells) castleSpells[k] += count;
    const castle = recipe.castle.troops.length + recipe.castle.spells.length;
    const siege = presetSiege(recipe.army);
    const creator = recipe.creator
      ? ARMY_RECIPE_TEXTS.creator.replace('<creator>', recipe.creator)
      : 'Featured';
    // Save keeps the recipe as a Quick army: in the first empty slot, or over a chosen one.
    const presets = m.state.armyPresets ?? [null, null, null];
    const save = presets.some((p) => !p)
      ? button(
          `recipe-save:${recipe.id}`,
          `${icon('Save', 16)} ${ARMY_RECIPE_TEXTS.save}`,
          'game-btn stone',
        )
      : `<span class="recipe-slots">${ARMY_RECIPE_TEXTS.save} over ${[0, 1, 2]
          .map((slot) =>
            button(
              `recipe-save:${recipe.id},${slot}`,
              `${slot + 1}`,
              'game-btn stone',
              `aria-label="${ARMY_RECIPE_TEXTS.save} over ${html(presets[slot]!.name)}"`,
            ),
          )
          .join('')}</span>`;
    return `<article class="preset-card recipe-card" data-recipe="${recipe.id}"><div class="recipe-head"><h3>${html(recipe.name)}</h3><small>${html(creator)} · ${armySpace(recipe.army)} troop · ${spellSpace(recipe.spells)} spell spaces${siege ? ` · ${siege} siege` : ''}</small></div>${this.composition(recipe.army, recipe.spells)}${recipe.heroes.length ? this.presetHeroes(recipe, ARMY_RECIPE_TEXTS.autofix) : ''}${castle ? `<details class="recipe-castle"><summary>${icon('ChevronRight', 15)} ${icon('Castle', 15)} Clan Castle · not used here</summary>${this.composition(castleArmy, castleSpells)}</details>` : ''}<div class="preset-actions">${button(`recipe-use:${recipe.id}`, `${icon('Check', 16)} ${issue ? ARMY_RECIPE_TEXTS.cannotTrain : 'Use army'}`, 'game-btn green', issue ? 'disabled' : '')}${save}${recipe.guide ? `<a class="game-btn stone" href="${html(recipe.guide)}" target="_blank" rel="noopener noreferrer">${icon('Play', 16)} Watch guide</a>` : ''}</div>${issue ? `<p class="preset-empty">${html(issue)}</p>` : ''}</article>`;
  }
  private battleLog() {
    const log = this.model.state.raidLog ?? [];
    return `<div class="modal-body battle-log-body"><div class="replay-import-bar">${button('replay-import', `${icon('Upload', 17)} Open shared replay`, 'game-btn blue')}<small>Watch a replay file without replacing your village.</small></div>${
      log.length
        ? log
            .map(
              (r) =>
                `<article class="raid-record"><div class="raid-record-head"><div><small>${r.practice ? 'PRACTICE' : r.ladder ? 'LADDER' : 'CAMPAIGN'} · ${new Date(r.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${new Date(r.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</small><h3>${r.practice ? 'Your village' : campaignStage(r.index, r.catalog).name}</h3></div><div class="raid-score"><b>${r.result.destruction}%</b><span aria-label="${r.result.stars} stars">${'★'.repeat(r.result.stars)}<i>${'★'.repeat(3 - r.result.stars)}</i></span></div></div><p class="raid-loot">${r.practice ? 'Practice · no army losses or rewards' : `${coin} ${n(r.result.gold)} ${elixir} ${n(r.result.elixir)}${r.result.dark !== undefined ? ` ${resource('dark')} ${n(r.result.dark)}` : ''} ${r.result.trophies ? `${icon('Trophy', 16)} ${r.result.trophies > 0 ? '+' : ''}${r.result.trophies}` : ''}`}<span>${time(r.duration)}</span></p><small class="deployed-label">TROOPS &amp; SPELLS DEPLOYED</small>${this.composition(r.deployed, r.spells)}${compatibleReplayVersion(r.replay?.version) ? button(`replay:${r.id}`, `${icon('Play', 16)} Watch replay`, 'game-btn blue replay-watch') + button(`replay-export:${r.id}`, `${icon('Download', 16)} Export replay`, 'game-btn stone') : `<p class="replay-unavailable">${r.replay ? 'Replay unavailable · Recorded before a combat update.' : r.replayUnavailable === 'limit' ? 'Replay unavailable · This attack exceeded the recording limit.' : 'Replay unavailable · Recordings kept for the latest five attacks.'}</p>`}${raidHeroes(
                  r,
                )
                  .map(
                    (h) =>
                      `<p class="hero-log">${HERO_SOURCE[h.kind]} · Level ${h.level} · ${h.abilityUsed ? 'Ability used' : 'Ability unused'}</p>`,
                  )
                  .join(
                    '',
                  )}${r.ladder ? button('ladder', `${icon('Swords', 15)} Next ladder match`, 'game-btn stone', this.model.armyReady ? '' : 'disabled') : r.practice || r.catalog === 'goblin-v1' ? button(r.practice ? 'practice' : `attack:${r.index}`, `${icon('Swords', 15)} ${r.practice ? 'Practice again' : 'Attack village'}`, 'game-btn stone', this.model.armyReady ? '' : 'disabled') : ''}</article>`,
            )
            .join('')
        : `<div class="empty-log">${icon('ScrollText', 48)}<h2>Your story starts here</h2><p>Complete a campaign or practice attack to record its result and the army you deployed.</p>${button('practice', 'Practice your defense', 'game-btn blue', this.model.armyReady ? '' : 'disabled')}</div>`
    }</div>`;
  }
  private troopInfo() {
    const kind = this.inspectedTroop,
      d = this.model.troopStats(kind);
    const target = d.healer
      ? 'Friendly ground troops'
      : d.wallBreaker
        ? 'Walls (40× damage)'
        : d.prefersResources
          ? 'Resources (2× damage)'
          : d.prefersDefenses
            ? 'Defenses'
            : 'Any building';
    const tactic = d.healer
      ? 'Deploy behind a ground army. Healing pulses land where the ally was when cast, restoring nearby ground troops. Heroes receive 55% healing. Additional Healers have diminishing effectiveness; eight or more add no further healing to the same group.'
      : kind === 'dragon'
        ? 'Fly over walls and burn clustered buildings. Dragons have no favorite target, so clear outer buildings to guide them toward Air Defenses.'
        : kind === 'pekka'
          ? 'Open the walls and funnel this heavy attacker into the base. Support with Healers or spells; P.E.K.K.A has no preferred target or bonus against walls.'
          : d.wallBreaker
            ? 'Let Giants draw defensive fire first. Reaching a wall deals both attack and death damage; being defeated on the way deals only death damage. Both deal 40× damage to walls.'
            : d.prefersResources
              ? 'Clear a route through the walls, then send Goblins toward storages. Loot is released with each hit, so a quick raid can pay even without a star.'
              : d.flying
                ? 'Bombs damage nearby buildings when they land. Remove Air Defenses before sending Balloons over the walls.'
                : d.prefersDefenses
                  ? 'Deploy first to draw defensive fire, then send your more fragile troops behind.'
                  : 'Spread your deployment to avoid mortar splash. Support your frontline with ranged damage and spells.';
    const rows: [string, string][] = [
      ['Unlock requirement', `${BUILDINGS[troopFacility(kind)].name} ${TROOP_UNLOCK[kind]}`],
      ['Favorite target', target],
      [
        d.healer ? 'Healing per second' : 'Damage per second',
        damageNumber((d.heal ?? d.damage) / d.rate),
      ],
      [d.healer ? 'Healing per pulse' : 'Damage per hit', damageNumber(d.heal ?? d.damage)],
      ['Hitpoints', n(d.hp)],
      ['Housing space', `${d.space}`],
      ['Movement', d.flying ? 'Air · ignores walls' : 'Ground'],
      ['Movement speed', `${d.speed} tiles/s`],
      [d.healer ? 'Healing range' : 'Attack range', `${d.range} tile${d.range === 1 ? '' : 's'}`],
      [d.healer ? 'Healing interval' : 'Attack interval', `${d.rate}s`],
    ];
    if (d.splash) rows.push([d.healer ? 'Healing radius' : 'Attack splash', `${d.splash} tiles`]);
    if (d.healer) rows.push(['Hero healing per second', damageNumber((d.heal! / d.rate) * 0.55)]);
    if (d.deathDamage) {
      rows.push(['Damage on destruction', damageNumber(d.deathDamage)]);
      rows.push(['Death blast radius', `${d.deathRadius} tiles`]);
    }
    if (d.wallBreaker)
      rows.push(['Contact damage vs walls', damageNumber((d.damage + (d.deathDamage ?? 0)) * 40)]);
    return `<div class="modal-body troop-info-body"><div class="troop-info-hero"><img src="${hudAsset(kind)}" alt="${d.name}"><div><span class="eyebrow">${d.role} · LEVEL ${this.model.troopDisplayLevel(kind)}</span><h2>${d.name}</h2><p>${d.description}</p></div></div><dl class="troop-stats">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="troop-tactic">${icon('Info', 20)}<span>${tactic}</span></p>${button('army', `${icon('Swords', 18)} Train troops`, 'game-btn green')}</div>`;
  }
  private spellInfo() {
    const kind = this.inspectedSpell,
      d = this.model.spellStats(kind);
    const rows: [string, string][] = [
      ['Unlock requirement', spellUnlockLabel(kind)],
      ['Housing space', `${d.space}`],
      ['Effect radius', `${d.radius} tiles`],
      [
        'Targets',
        kind === 'lightning'
          ? 'Enemy buildings'
          : kind === 'freeze'
            ? 'Defences and defending troops'
            : kind === 'invisibility' || kind === 'clone' || kind === 'recall'
              ? 'Your own troops'
              : kind === 'jump'
                ? 'Walls beneath the ring'
                : kind === 'revive'
                  ? 'Your fallen hero'
                  : 'Ground and air troops',
      ],
    ];
    if (kind === 'lightning') rows.push(['Damage', n(d.damage)], ['Stun duration', '0.1s']);
    else if (kind === 'jump')
      rows.push(
        ['Damage', 'None'],
        ['Breach holds for', `${jumpSeconds(this.model.spellLevel(kind))}s`],
      );
    else if (kind === 'clone')
      rows.push(
        ['Damage', 'None'],
        ['Housing copied', `${cloneHousing(this.model.spellLevel(kind))}`],
        ['Each copy lives', `${CLONE_LIFETIME}s`],
      );
    else if (kind === 'recall')
      rows.push(
        ['Damage', 'None'],
        ['Housing recalled', `${recallHousing(this.model.spellLevel(kind))}`],
      );
    else if (kind === 'revive')
      rows.push(
        ['Damage', 'None'],
        ['Hero returns with', `${Math.round(reviveFraction(this.model.spellLevel(kind)) * 100)}%`],
      );
    else if (kind === 'invisibility')
      rows.push(
        ['Damage', 'None'],
        ['Hidden for', `${invisibilitySeconds(this.model.spellLevel(kind))}s`],
        ['Cover lingers', `${INVISIBILITY_LINGER}s after leaving the veil`],
      );
    else if (kind === 'freeze')
      rows.push(
        ['Damage', 'None'],
        ['Freeze duration', `${freezeSeconds(this.model.spellLevel(kind))}s`],
      );
    else if (kind === 'heal')
      rows.push(
        ['Total troop healing', n(d.heal * HEAL_PULSES)],
        ['Total hero healing', damageNumber(d.heal * HEAL_PULSES * HEAL_HERO_MULTIPLIER)],
        ['Healing per pulse', `${d.heal}`],
        ['Pulses', `${HEAL_PULSES} · every ${SPELL_PULSE_INTERVAL}s`],
        ['Spell duration', `${damageNumber(d.duration)}s`],
      );
    else
      rows.push(
        ['Damage increase', `+${d.damageBoost}%`],
        ['Movement increase', `+${d.speedBoost / 8} tiles/s`],
        ['Spell duration', `${d.duration}s`],
        ['Effect lingers', `${RAGE_LINGER}s after the last pulse`],
        ['Hero effectiveness', '50% of each boost'],
      );
    const tactic =
      kind === 'jump'
        ? 'Lay it over the wall you want opened, not over your troops. Ground troops walk straight across while the ring holds, and the wall is still standing when it closes.'
        : kind === 'clone'
          ? 'Copy what is already winning, not what is about to die. Copies are made at full health and fade after half a minute whatever happens to them.'
          : kind === 'recall'
            ? 'Take troops back out of a corner they cannot win and send them somewhere better. Recalled troops return to your hand at full count; Clone copies have nowhere to go and are lost.'
            : kind === 'revive'
              ? 'Cast it where your hero fell. The hero stands back up part way healed, keeping whatever ability charge it had left.'
              : kind === 'invisibility'
                ? 'Drop it over troops that are being shot at, not over troops that are walking. Nothing can target what it cannot see, so the veil buys a crossing or a clean run at a Town Hall — but walls still block and traps still trigger.'
                : kind === 'freeze'
                  ? 'Cast it over the defences that are firing, not the ones ahead. Frozen defences stop mid-reload and pick a target again when they thaw, and frozen defenders stop where they stand. It deals no damage, so it buys time rather than destruction.'
                  : kind === 'lightning'
                    ? 'Aim at clustered defenses. The bolt hits any building footprint within its radius, but Town Halls, resource storages and traps are immune. Surviving defenses briefly stop and choose a target again.'
                    : kind === 'heal'
                      ? 'Place Healing where damaged troops will stay. Each spell heals independently, so overlapping rings stack. Heroes receive 55% of the healing; defeated troops cannot be revived.'
                      : 'Lead your troops with the ring. Damage and movement increase without changing attack speed. Overlapping Rage spells do not add their boosts, and the stronger spell or hero ability boost takes effect.';
    return `<div class="modal-body troop-info-body spell-info-body"><div class="troop-info-hero"><img src="${hudAsset(kind)}" alt="${d.name}"><div><span class="eyebrow">${d.role} · LEVEL ${this.model.spellLevel(kind)}</span><h2>${d.name}</h2><p>${d.description}</p></div></div><dl class="troop-stats">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="troop-tactic">${icon('Info', 20)}<span>${tactic}</span></p>${button(`research-view:${kind}`, `${icon('FlaskConical', 18)} Research spell`, 'game-btn green')}</div>`;
  }
  private surrender() {
    const b = this.model.battle!;
    return `<div class="modal-body confirm-body"><p class="confirm-line">${icon('TriangleAlert', 34)} You are at <b>${b.destruction}% destruction</b> with <b>${b.stars} ${b.stars === 1 ? 'star' : 'stars'}</b>. ${b.practice ? 'Ending now records this practice result without spending your army.' : 'Ending now keeps that result and any loot already taken.'}</p><div class="confirm-actions">${button('close', 'Keep fighting', 'game-btn stone')}${button('end', `${icon('Flag', 18)} End battle`, 'game-btn red')}</div></div>`;
  }
  private info() {
    const m = this.model;
    const b = m.state.buildings.find((v) => v.id === m.selected);
    if (!b) return '<div class="modal-body"><p>Select a building first.</p></div>';
    const d = BUILDINGS[b.kind];
    const capped = b.level >= d.maxLevel;
    const gated = !capped && b.level >= m.maxLevel(b.kind);
    const now = statRows(b.kind, b.level, b.xbowMode, b.infernoMode, b.supercharge);
    const next = capped
      ? []
      : statRows(b.kind, b.level + 1, b.xbowMode, b.infernoMode, b.supercharge);
    const nextUnlocks =
      b.kind === 'barracks' || b.kind === 'darkbarracks' || b.kind === 'workshop'
        ? TROOP_ORDER.filter((k) => facilityUnlocks(b.kind, b.level + 1).includes(k)).map(
            (k) => TROOPS[k].name,
          )
        : b.kind === 'spellfactory' || b.kind === 'darkspellfactory'
          ? SPELL_ORDER.filter(
              (k) => spellFactory(k) === b.kind && SPELL_UNLOCK[k] === b.level + 1,
            ).map((k) => SPELLS[k].name)
          : [];
    return `<div class="modal-body info-body"><div class="info-hero"><img src="${hudAsset(b.kind, b.level, b.skeletonMode, b.xbowMode, b.infernoMode)}" alt=""><div><span class="eyebrow">${d.category.toUpperCase()} · LEVEL ${b.level} OF ${d.maxLevel}</span><h2>${d.name}</h2><p>${d.description}</p>${b.kind === 'skeletontrap' ? `<p class="trap-note"><b>${b.skeletonMode === 'air' ? 'Air mode' : 'Ground mode'}</b> · Skeletons pursue ${b.skeletonMode === 'air' ? 'flying' : 'ground'} troops.</p>` : ''}${d.trap ? '<p class="trap-note">Hidden from attackers until triggered. One use per attack; automatically armed for the next practice. Traps do not count toward destruction.</p>' : ''}<div class="info-levels">${Array.from({ length: d.maxLevel }, (_, i) => `<i class="${i < b.level ? 'on' : ''}"></i>`).join('')}</div></div></div>
 <table class="info-table"><thead><tr><th>Stat</th><th>Level ${b.level}</th><th>${capped ? 'Max' : `Level ${b.level + 1}`}</th></tr></thead><tbody>${now
   .map(([ic, label, value], i) => {
     const after = next[i]?.[2];
     const changed = after !== undefined && after !== value;
     return `<tr><td>${icon(ic, 15)} ${label}</td><td>${value}</td><td class="${changed ? 'better' : 'same'}">${capped ? '—' : changed ? `${after} ${icon('ArrowBigUp', 13)}` : after}</td></tr>`;
   })
   .join('')}</tbody></table>
 ${nextUnlocks.length ? `<p class="upgrade-unlocks">Unlocks at level ${b.level + 1}: <b>${nextUnlocks.join(', ')}</b></p>` : ''}
 <div class="info-upgrade">${
   capped
     ? `<span class="max-level">★ Fully upgraded</span>`
     : gated
       ? `<span class="max-level locked">${icon('LockKeyhole', 15)} ${requiredTownHall(b.kind, b.level + 1) ? `Requires Town Hall ${requiredTownHall(b.kind, b.level + 1)}` : 'Maximum level for the available Town Hall tiers'}</span>`
       : `<div class="info-cost"><span>${resource(d.resource)} <b>${n(costFor(b.kind, b.level))}</b></span><span>${icon('Clock3', 15)} <b>${b.kind === 'wall' ? 'Instant' : time(upgradeSeconds(b.kind, b.level))}</b></span><span>${icon('Hammer', 15)} <b>${m.builders - m.busy} free</b></span></div>${button(b.kind === 'wall' ? `wall-info-upgrade:${b.id}` : `upgrade:${b.id}`, `${icon('ArrowBigUp', 19)} Upgrade to level ${b.level + 1}`, 'game-btn green', b.upgradeEnd || m.busy >= m.builders ? 'disabled' : '')}`
 }</div></div>`;
  }
  private layoutPanel() {
    const m = this.model;
    const code = layoutFromLink(this.layoutCode) ?? this.layoutCode.trim();
    const shared = code ? decodeLayout(code) : null;
    const summary = this.layoutSummary(code, shared);
    return `<div class="modal-body layouts-body"><p class="layouts-note">Save the arrangement you are happy with, then experiment freely. Restoring a layout can be undone.</p>${[
      0, 1, 2,
    ]
      .map((i) => {
        const layout = m.layouts[i];
        const filled = !!layout?.slots.length;
        return `<article class="layout-row"><div class="layout-icon">${icon('LayoutGrid', 24)}</div><div><h3>${html(layout?.name ?? `Layout ${i + 1}`)}</h3><p>${filled ? `${layout!.slots.length} buildings stored` : 'Empty slot'}</p></div><div class="layout-actions">${button(`layout-save:${i}`, `${icon('Save', 16)} Save`, 'game-btn stone')}${m.canUndoSlot('layout', i) ? button(`layout-undo:${i}`, `${icon('RotateCcw', 16)} Undo save`, 'game-btn stone') : ''}${button(`layout-share:${i}`, `${icon('Upload', 16)} Share`, 'game-btn stone', filled ? '' : 'disabled')}${button(`layout-load:${i}`, `${icon('RotateCcw', 16)} Restore`, 'game-btn green', filled ? '' : 'disabled')}</div></article>`;
      })
      .join(
        '',
      )}<section class="layout-import"><h3>${icon('Download', 18)} Shared layout</h3><label for="layout-code">Layout link</label><input id="layout-code" inputmode="url" autocomplete="off" spellcheck="false" placeholder="Paste a layout link" value="${html(this.layoutCode)}"><p class="layout-import-summary${code && !shared ? ' bad' : ''}">${html(summary)}</p><div class="layout-actions">${[
      0, 1, 2,
    ]
      .map((i) =>
        button(
          `layout-import:${i}`,
          `Copy to ${html(m.layouts[i]?.name ?? `Layout ${i + 1}`)}`,
          'game-btn blue',
          shared ? '' : 'disabled',
        ),
      )
      .join('')}</div></section></div>`;
  }
  private layoutSummary(code: string, shared: ReturnType<typeof decodeLayout>) {
    if (!code) return 'Paste a layout link someone shared, then copy it into a slot.';
    if (!shared) return 'This layout link is damaged.';
    const count = Object.values(shared.positions).reduce((t, list) => t + (list?.length ?? 0), 0);
    return `Town Hall ${shared.townhall} layout · ${n(count)} buildings`;
  }
  /** A saved layout as a link: the share sheet on phones, else the clipboard, else the field. */
  private async shareLayout(slot: number) {
    const code = this.model.layoutShareCode(slot);
    if (!code) return;
    const link = layoutLink(location.origin, code);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CodeForge layout', url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      this.model.notify('Layout link copied.');
      return;
    } catch (error) {
      // A dismissed share sheet needs nothing more.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
    // Neither works (an insecure page, a denied permission): show it to copy by hand.
    this.layoutCode = link;
    this.render();
    const field = document.querySelector<HTMLInputElement>('#layout-code');
    field?.focus();
    field?.select();
    this.model.notify('Copy the layout link from the field below.');
  }
  /** A layout link the page was opened with: offer it in the layouts panel. */
  receiveLayout(code: string) {
    this.layoutCode = code;
    this.show('layouts');
  }
  private researchCard(kind: ResearchKind) {
    const m = this.model,
      spell = isSpellKind(kind);
    const name = spell ? SPELLS[kind].name : TROOPS[kind].name;
    const level = m.researchLevel(kind),
      maximum = isSpellKind(kind) ? maxSpellLevelFor(kind) : maxTroopLevel(kind);
    const max = level >= maximum,
      nextLevel = Math.min(level + 1, maximum);
    const unlocked = spell ? m.spellUnlocked(kind) : m.troopUnlocked(kind);
    const requiredLab = m.researchLaboratory(kind);
    const gated = !unlocked || !m.laboratory || m.laboratory.level < requiredLab;
    const researchResource = !spell && troopFacility(kind) === 'darkbarracks' ? 'dark' : 'elixir';
    const label = max
      ? '★ Fully researched'
      : !unlocked
        ? `Requires ${spell ? spellUnlockLabel(kind) : `${BUILDINGS[troopFacility(kind)].name} ${TROOP_UNLOCK[kind]}`}`
        : gated
          ? `Requires laboratory ${requiredLab}`
          : `Research ${researchResource === 'dark' ? 'Dark elixir' : elixir} ${n(m.researchCost(kind))}`;
    let rows: [string, string, string, string][];
    if (isSpellKind(kind)) {
      const d = m.spellStats(kind),
        next = m.spellStats(kind, nextLevel);
      rows =
        kind === 'lightning'
          ? [
              ['Zap', 'Damage', damageNumber(d.damage), damageNumber(next.damage)],
              ['Scan', 'Radius', `${d.radius}`, `${next.radius}`],
            ]
          : kind === 'heal'
            ? [
                ['Heart', 'Healing', n(d.heal * HEAL_PULSES), n(next.heal * HEAL_PULSES)],
                ['Scan', 'Radius', `${d.radius}`, `${next.radius}`],
              ]
            : [
                ['Swords', 'Damage', `+${d.damageBoost}%`, `+${next.damageBoost}%`],
                ['Wind', 'Speed', `+${d.speedBoost / 8}`, `+${next.speedBoost / 8}`],
              ];
    } else {
      const d = m.troopStats(kind),
        next = m.troopStats(kind, nextLevel);
      // Damage scaled by a rate can carry float noise (209.00000000000003): print it rounded,
      // or a narrow phone card overflows.
      rows = [
        ['Heart', 'Health', `${d.hp}`, `${next.hp}`],
        d.healer
          ? [
              'HeartPulse',
              'Healing/s',
              damageNumber(d.heal! / d.rate),
              damageNumber(next.heal! / next.rate),
            ]
          : ['Swords', 'Damage', damageNumber(d.damage), damageNumber(next.damage)],
      ];
    }
    return `<article class="training-card" data-research-kind="${kind}"><span class="role-tag">LEVEL ${level} OF ${maximum}${max ? ' · MAX' : ` → ${level + 1}`}</span><div class="training-art"><img src="${hudAsset(kind)}" alt=""></div><h3>${name.replace(' Spell', '')}</h3><div class="research-stats">${rows.map(([glyph, label, value, next]) => `<span>${icon(glyph, 16)} ${label} <b>${value}${max || value === next ? '' : ` <em>→ ${next}</em>`}</b></span>`).join('')}</div>${button(`research-start:${kind}`, label, 'game-btn ' + (max || gated ? 'stone' : 'green'), max || gated || !!m.state.research || m.state[researchResource] < m.researchCost(kind) ? 'disabled' : '')}${!max && !gated && m.magicItemCount(spell ? 'hammer-of-spells' : 'hammer-of-fighting') && m.state.research?.kind !== kind ? button(`hammer-research:${kind}`, `${icon('Hammer', 15)} Hammer`, 'game-btn blue', `aria-label="Upgrade ${name} instantly with the ${spell ? 'Hammer of Spells' : 'Hammer of Fighting'}"`) : ''}<small>${max ? 'Ready for the toughest battles' : `${time(m.researchSeconds(kind))} research · permanent upgrade`}</small></article>`;
  }
  private research() {
    const m = this.model,
      lab = m.laboratory,
      r = m.state.research;
    const name = r
      ? isSpellKind(r.kind)
        ? SPELLS[r.kind].name.replace(' Spell', '')
        : TROOPS[r.kind].name
      : '';
    return `<div class="modal-body research-body"><div class="research-banner"><img src="${hudAsset('laboratory', lab?.level ?? 1)}" alt=""><div><span class="eyebrow">LABORATORY LEVEL ${lab?.level ?? 0}</span><h2>${r ? `${name} research` : 'Strengthen your army'}</h2><p>${r ? 'Your next upgrade is on its way.' : 'Research permanently improves troops and spells. Upgrade the laboratory to unlock higher levels.'}</p>${lab?.upgradeEnd ? `<p class="facility-research-note">Upgrading to level ${lab.level + 1}. Research remains available at level ${lab.level}.</p>` : ''}${r ? `<div class="research-status"><strong data-research>${time((r.end - m.clock) / 1000)}</strong>${button('research-finish', `Finish ${gem} <span data-research-cost>${m.finishCost({ upgradeEnd: r.end } as Building)}</span>`, 'game-btn green')}${m.booksFor({ research: true }).length ? button('book-research', `${icon('BookOpen', 17)} ${MAGIC_ITEMS[m.booksFor({ research: true })[0]].name}`, 'game-btn blue') : ''}</div>` : ''}</div></div><div class="training-grid research-grid">${[...TROOP_ORDER, ...SPELL_ORDER].map((kind) => this.researchCard(kind)).join('')}</div></div><footer class="modal-footer">${elixir} ${n(m.state.elixir)} elixir available <span>One research project at a time</span></footer>`;
  }
  private campaignMap(index: number) {
    return `<button class="campaign-map-button" data-action="campaign-scout:${index}" aria-label="Scout ${html(NATIVE_CAMPAIGN[index].name)}"><img class="campaign-map" src="${campaignMapSource(index)}" alt="${html(NATIVE_CAMPAIGN[index].name)} base layout" width="94" height="94" loading="lazy" decoding="async" draggable="false"></button>`;
  }
  /** The stage a scouting preview shows. */
  private scoutedStage = 0;
  /**
   * An enlarged look at a campaign village before attacking: its layout, the defenses on show
   * (hidden Teslas and traps stay hidden, as in battle), the loot left and the suggested tier.
   */
  /** The Practice guide's words, in the client's colours, and its Skip. */
  private practiceGuideBanner() {
    const text = this.model.guideText;
    return `<div class="practice-guide" role="status" aria-live="polite">${icon('Info', 22)}<p>${text ? guideMarkup(text) : 'Follow the guide.'}</p>${button('guide-skip', 'Skip guide', 'game-btn stone')}</div>`;
  }
  /** A Practice level's own army, as its scout page shows it. */
  private practiceArmy(drill: PracticeLevel, firstAttempt: boolean) {
    const heroes = drill.heroes
      .map((hero) => `<b>${HERO_SOURCE[hero.kind]}</b> level ${hero.level}`)
      .join(' · ');
    return `<h3>Army provided</h3><p class="campaign-scout-note">${PRACTICE_TEXTS.title} brings its own army at these levels; yours stays home.${drill.steps.length ? (firstAttempt ? ' Your first attack is guided step by step.' : '') : ''}</p>${this.composition(drill.army, drill.spells)}${heroes ? `<p class="preset-heroes">${icon('ShieldCheck', 14)} ${heroes}</p>` : ''}`;
  }
  private campaignScout() {
    const m = this.model,
      i = this.scoutedStage,
      v = NATIVE_CAMPAIGN[i];
    const locked = !m.campaignOpen(i) || campaignPending(i);
    const loot = m.campaignLoot(i, 'goblin-v1');
    const drill = practiceLevelAt(i);
    const counts = new Map<string, number>();
    for (const b of nativeBuildings(i))
      if (isDefense(b.kind) && b.kind !== 'tesla') {
        const name = BUILDINGS[b.kind].name;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    const defenses = [...counts].sort((a, b) => b[1] - a[1]);
    return `<div class="modal-body campaign-scout"><img class="campaign-scout-map" src="${campaignMapSource(i)}" alt="${html(v.name)} base layout" width="320" height="320"><div class="campaign-scout-info"><span class="eyebrow">STAGE ${v.stage}${v.family === 'forged' ? ' · FAN-MADE' : ''}${v.recommendedTownHall ? ` · SUGGESTED TOWN HALL ${v.recommendedTownHall}` : ''}</span><h2>${html(v.name)}</h2><p class="campaign-loot" aria-label="Remaining loot">${coin} ${n(loot.gold)} ${elixir} ${n(loot.elixir)}${loot.dark !== undefined ? ` ${resource('dark')} ${n(loot.dark)}` : ''}</p>${drill ? this.practiceArmy(drill, !(m.state.nativeCampaign?.stars[i] ?? 0)) : ''}<h3>Defenses on show</h3>${defenses.length ? `<ul class="campaign-scout-defenses">${defenses.map(([name, count]) => `<li><b>${count}×</b> ${html(name)}</li>`).join('')}</ul>` : '<p>No defenses in sight.</p>'}<p class="campaign-scout-note">Traps and hidden defenses are not shown until they trigger.</p><div class="confirm-actions">${button('campaign', 'Back to campaign', 'game-btn stone')}${drill?.steps.length && !locked && (m.state.nativeCampaign?.stars[i] ?? 0) ? button(`attack-guided:${i}`, `${icon('Info', 17)} Guided attack`, 'game-btn blue') : ''}${button(`attack:${i}`, locked ? 'Locked' : `Attack ${icon('ArrowRight', 17)}`, 'game-btn orange', locked ? 'disabled' : '')}</div></div></div>`;
  }
  /** Campaign list filter and position; kept between visits. */
  private campaignFilter: 'all' | 'open' | 'stars' | 'done' = 'all';
  private campaignScroll: number | null = null;
  /** Card markup by stage; rebuilt only when that stage's stars, lock or loot change. */
  private campaignCards = new Map<number, { key: string; markup: string }>();
  private campaign() {
    const stars = this.model.state.nativeCampaign?.stars ?? [];
    const next = this.nextCampaignStage();
    const filter = this.campaignFilter;
    const option = (value: string, label: string) =>
      `<option value="${value}"${value === filter ? ' selected' : ''}>${label}</option>`;
    // Where each part of the map begins, for the section jump.
    const sections = (['goblin', 'challenge', 'forged'] as const)
      .map(
        (family) =>
          [family, NATIVE_CAMPAIGN.findIndex((v) => (v.family ?? 'goblin') === family)] as const,
      )
      .filter(([, i]) => i >= 0);
    const sectionName = {
      goblin: 'Goblin map',
      challenge: PRACTICE_TEXTS.title,
      forged: 'Fan-made villages',
    };
    // The client ships 103 stages; the rest are the project's own, and say so.
    const forged = NATIVE_CAMPAIGN.filter((v) => v.family === 'forged').length;
    const shown = (i: number) => {
      const score = stars[i] ?? 0;
      const open = this.model.campaignOpen(i) && !campaignPending(i);
      if (filter === 'open') return open && !score;
      if (filter === 'stars') return open && score < 3;
      if (filter === 'done') return score === 3;
      return true;
    };
    const ladder = this.model.ladderPreview.match;
    return `<div class="campaign-summary">${button('practice', `${icon('ShieldCheck', 17)} Practice your defense`, 'game-btn blue', this.model.armyReady ? '' : 'disabled')}${button('ladder', `${icon('Trophy', 17)} Ladder match <small>+${ladder.win} / −${ladder.loss}</small>`, 'game-btn orange', `${this.model.armyReady ? '' : 'disabled'} aria-label="Ladder match: win up to ${ladder.win} trophies, lose ${ladder.loss}"`)}${icon('Map', 23)} <span>${NATIVE_CAMPAIGN.length} villages · ${forged} fan-made</span><b>${stars.reduce((a, b) => a + b, 0)} / ${NATIVE_CAMPAIGN.length * 3} ${icon('Star', 17)}</b></div><div class="campaign-nav">${next === null ? '' : button('campaign-continue', `${icon('ArrowRight', 17)} Continue · ${html(NATIVE_CAMPAIGN[next].name)}`, 'game-btn orange')}<select id="campaign-filter" aria-label="Show villages">${option('all', 'All villages')}${option('open', 'Not yet won')}${option('stars', 'Missing stars')}${option('done', 'Three stars')}</select><select id="campaign-section" aria-label="Jump to">${'<option value="">Jump to…</option>'}${sections.map(([family, i]) => `<option value="${i}">${sectionName[family]} · ${NATIVE_CAMPAIGN[i].stage}+</option>`).join('')}</select></div><p class="campaign-rules">Campaign villages: no time limit · no trophy changes · loot does not replenish</p><div class="modal-body campaign-list">${NATIVE_CAMPAIGN.map(
      (v, i) => {
        if (!shown(i)) return '';
        const loot = this.model.campaignLoot(i, 'goblin-v1');
        const pending = campaignPending(i);
        const locked = !this.model.campaignOpen(i),
          score = stars[i] ?? 0;
        // A Practice level brings its own army and opens at its Town Hall.
        const drill = practiceLevelAt(i);
        const key = `${locked}|${score}|${loot.gold}|${loot.elixir}|${loot.dark}`;
        const cached = this.campaignCards.get(i);
        if (cached?.key === key) return cached.markup;
        const markup = `<article class="campaign-card ${locked || pending ? 'locked' : ''}" id="campaign-stage-${i}" data-stage="${v.stage}"><div class="campaign-number">${locked ? icon('LockKeyhole', 22) : v.stage}</div>${this.campaignMap(i)}<div class="campaign-info"><span>${drill ? PRACTICE_TEXTS.title.toUpperCase() : 'SINGLE PLAYER'}</span><h3>${v.name}</h3><p>${pending ? 'This village is coming soon.' : drill ? (locked ? `Opens at Town Hall ${drill.townHall}.` : `Fought with its own army: ${practiceArmyLine(drill)}. Yours stays home.`) : v.dependencies.length ? 'Win a star to open the next path.' : 'Your campaign begins here.'}</p>${v.family === 'forged' ? '<small class="campaign-fan-made">Fan-made · not a client village</small>' : ''}${v.recommendedTownHall ? `<small class="campaign-recommendation">Suggested Town Hall: ${v.recommendedTownHall}</small>` : ''}<div class="campaign-loot" aria-label="Remaining loot">${coin} ${n(loot.gold)} ${elixir} ${n(loot.elixir)}${loot.dark !== undefined ? ` ${resource('dark')} ${n(loot.dark)}` : ''}</div>${loot.gold || loot.elixir || loot.dark ? '' : `<small class="campaign-depleted">Loot depleted${score < 3 ? ' · Replay for stars' : ' · Village cleared'}</small>`}</div><div class="campaign-action"><div class="campaign-stars">${'★'.repeat(score)}<span>${'★'.repeat(3 - score)}</span></div>${button(`attack:${i}`, pending ? 'Coming soon' : locked ? 'Locked' : `Attack ${icon('ArrowRight', 17)}`, 'game-btn ' + (locked || pending ? 'stone' : 'orange'), locked || pending ? 'disabled' : '')}</div></article>`;
        this.campaignCards.set(i, { key, markup });
        return markup;
      },
    ).join('')}</div>`;
  }

  private settings() {
    const s = this.model.state.settings;
    return `<div class="modal-body settings-body">${(
      [
        ['sound', 'Sound effects', 'Little sounds for big moments.', s.sound],
        ['music', 'Music', 'The original Home theme and battle music.', s.music],
        [
          'motion',
          'Reduced motion',
          this.model.systemReducedMotion
            ? `Less camera shake and decorative movement. Your device asks for reduced motion${s.fullMotion ? '; full motion is on by your choice' : ''}.`
            : 'Less camera shake and decorative movement.',
          this.model.reducedMotion,
        ],
        [
          'battery',
          'Battery saver',
          'Draws 30 frames a second at no more than 2× sharpness, so phones run cooler and last longer.',
          !!s.batterySaver,
        ],
        // Only where the browser can vibrate (not iOS Safari).
        ...(typeof navigator.vibrate === 'function'
          ? ([
              [
                'haptics',
                'Vibration',
                'A light tap when your troops land, buildings fall and stars are won.',
                s.haptics !== false,
              ],
            ] as const)
          : []),
      ] as const
    )
      .map(
        ([k, title, desc, on]) =>
          `<div class="setting-row"><div><h3>${title}</h3><p>${desc}</p></div><button class="toggle ${on ? 'on' : ''}" data-action="${k}" role="switch" aria-checked="${on}" aria-label="${title}"><span></span></button></div>`,
      )
      .join(
        '',
    )}<div class="save-section"><h3>${icon('Save', 20)} Your village, saved</h3><p>${(this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly ? 'This village is managed by the server. Use the server tools to manage it.' : 'Progress is saved automatically in this browser. Export a backup to keep it safe or move to another device. Importing replaces this village.'}</p><div>${(this.model as GameModel & { serverReadOnly?: boolean }).serverReadOnly ? button('settings-server-workflows', 'Open server tools', 'game-btn blue') : `${button('export', `${icon('Download', 18)} Export village`, 'game-btn blue')}${button('export-village', `${icon('Download', 18)} Export without recordings`, 'game-btn stone')}${button('import', `${icon('Upload', 18)} Import backup`, 'game-btn stone')}${(() => {
      const replaced = replacedVillage();
      return replaced
        ? button(
            'import-undo',
            `${icon('RotateCcw', 18)} Undo import (${new Date(replaced.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`,
            'game-btn stone',
          )
        : '';
    })()}`}</div></div><div class="settings-note">${this.offlineNote()}<br>Version 0.2 · Independent fan project · Clash of Clans assets and trademarks belong to Supercell</div></div>`;
  }
  /** What offline play covers right now, from the service worker's own report. */
  private offlineNote() {
    const status = offlineStatus();
    if (status === 'unsupported')
      return 'Frontend-only · Offline play is not available in this browser session';
    if (status === 'preparing') return 'Frontend-only · Preparing offline play…';
    const scope =
      'your village and the art you have already seen are saved; campaign villages you have not visited yet need a connection';
    if (status === 'ready') return `Frontend-only · Ready offline: ${scope}`;
    return `Frontend-only · Some art could not be saved for offline play (${scope}). ${button('offline-retry', 'Retry', 'replay-link')}`;
  }
  /** The league's own daily bonus, which is where ore comes from. */
  /** The Star Bonus line: stars still needed, the cooldown, or ready. */
  private starBonusStatus() {
    const m = this.model,
      bonus = m.starBonus,
      waiting = Math.max(0, bonus.readyAt - m.clock);
    const short = Math.max(0, STAR_BONUS_STARS - bonus.stars);
    return short
      ? `${short} more ${short === 1 ? 'star' : 'stars'}`
      : waiting
        ? `Ready in ${time(waiting / 1000)}`
        : 'Ready to collect';
  }
  private starBonusCard() {
    const m = this.model,
      bonus = m.starBonus,
      reward = m.starBonusPayout;
    const parts = (['gold', 'elixir', 'dark'] as const)
      .filter((k) => reward[k] > 0)
      .map((k) => `<span>${resource(k)} ${n(reward[k])}</span>`)
      .concat(
        ORE_KEYS.filter((k) => reward[k] > 0).map(
          (k) => `<span>${gearImage(k)} ${n(reward[k])}</span>`,
        ),
      )
      .join('');
    const status = this.starBonusStatus();
    // A Town Hall upgrade's boost multiplies the reward shown; resources go to the Treasury.
    const boost = m.starBonusBoosted
      ? `<p class="star-bonus-note boosted">${icon('Zap', 14)} ${TOWN_HALL_BOOST_MULTIPLIER}× Town Hall boost · ${time(((bonus.boostUntil ?? 0) - m.clock) / 1000)} left</p>`
      : '';
    const where = m.clanCastle
      ? `<p class="star-bonus-note">Gold, Elixir and Dark Elixir are banked in the Clan Castle’s Treasury.</p>`
      : '';
    return `<div class="star-bonus${m.starBonusBoosted ? ' boosted' : ''}"><div class="star-bonus-head">${icon('Star', 20)}<b>Star Bonus</b><small data-star-bonus-status>${Math.min(bonus.stars, STAR_BONUS_STARS)}/${STAR_BONUS_STARS} stars · ${status}</small></div><div class="star-bonus-reward">${parts}</div>${boost}${where}${button('star-bonus', 'Collect', 'game-btn green', m.starBonusReady ? '' : 'disabled')}</div>`;
  }
  /** The Starter Pass summary in the profile, while it runs (Town Halls below 7). */
  private starterCard() {
    const m = this.model;
    if (!m.starterActive) return '';
    const points = m.starterPoints,
      ready = m.starterClaimable;
    return `<div class="starter-card"><div class="star-bonus-head">${icon('Flag', 20)}<b>${STARTER_TITLE}</b><small>${n(Math.min(points, STARTER_MAX_POINTS))} / ${n(STARTER_MAX_POINTS)} points</small></div><span class="journey-bar" role="progressbar" aria-label="Starter Pass points" aria-valuemin="0" aria-valuemax="${STARTER_MAX_POINTS}" aria-valuenow="${Math.min(points, STARTER_MAX_POINTS)}"><i style="width:${Math.min(100, (points / STARTER_MAX_POINTS) * 100)}%"></i></span>${button('starter', `${icon('ListChecks', 16)} Challenges${ready ? `<span class="notification">${ready}</span>` : ''}`, 'game-btn blue')}</div>`;
  }
  private starterReward(tier: StarterTier) {
    const { kind, amount, item } = tier.reward;
    if (kind !== 'item') return `${resource(kind === 'gems' ? 'gem' : kind)} ${n(amount)}`;
    const magic = MAGIC_ITEM_KINDS.find((k) => MAGIC_ITEMS[k].name === item);
    const art = magic && MAGIC_ITEMS[magic].icon;
    return `${art ? `<img src="/${art.path}" alt="" width="28" height="28" loading="lazy">` : icon('Sparkles', 18)} ${amount}× ${html(item ?? '')}`;
  }
  /** Points, the reward track (scrolling sideways on phones) and the revealed challenges. */
  private starterPass() {
    const m = this.model,
      points = m.starterPoints;
    const tiers = STARTER_TIERS.map((tier, i) => {
      const issue = m.starterTierIssue(i);
      const state = issue === 'Claimed' ? 'claimed' : issue === null ? 'ready' : 'locked';
      return `<li class="starter-tier ${state}" data-tier="${i}"><small>${n(tier.score)}</small><span>${this.starterReward(tier)}</span>${issue === null ? button(`starter-claim:${i}`, 'Claim', 'game-btn green') : `<em>${issue === 'Claimed' ? icon('Check', 14) : ''}${html(issue === 'Claimed' ? 'Claimed' : issue)}</em>`}</li>`;
    }).join('');
    const groups = new Map<number, typeof m.starterChallenges>();
    for (const c of m.starterChallenges)
      groups.set(c.def.townhall, [...(groups.get(c.def.townhall) ?? []), c]);
    const challenges = [...groups.entries()]
      .sort(([a], [b]) => b - a)
      .map(
        ([th, list]) =>
          `<h3 class="starter-group">Town Hall ${th}</h3>${list
            .sort(
              (a, b) =>
                Number(a.done) - Number(b.done) ||
                Number(!!a.unavailable) - Number(!!b.unavailable),
            )
            .map(
              ({ def, progress, done, unavailable }) =>
                `<article class="starter-challenge${done ? ' done' : ''}${unavailable ? ' unavailable' : ''}" data-challenge="${def.id}"><div><h4>${html(def.title)}</h4><p>${html(def.info)}</p>${unavailable ? `<small class="item-note">${html(unavailable)}</small>` : `<span class="journey-bar" role="progressbar" aria-label="${html(def.title)}" aria-valuemin="0" aria-valuemax="${def.quantity}" aria-valuenow="${progress}"><i style="width:${(progress / def.quantity) * 100}%"></i></span><small>${n(progress)} / ${n(def.quantity)}</small>`}</div><b class="starter-points">${done ? icon('Check', 14) : ''}${def.score}</b></article>`,
            )
            .join('')}`,
      )
      .join('');
    return `<div class="modal-body starter-body"><div class="starter-summary"><b>${n(Math.min(points, STARTER_MAX_POINTS))}</b><small>/ ${n(STARTER_MAX_POINTS)} points</small><span class="journey-bar" role="progressbar" aria-label="Starter Pass points" aria-valuemin="0" aria-valuemax="${STARTER_MAX_POINTS}" aria-valuenow="${Math.min(points, STARTER_MAX_POINTS)}"><i style="width:${Math.min(100, (points / STARTER_MAX_POINTS) * 100)}%"></i></span></div><ol class="starter-track" aria-label="Rewards">${tiers}</ol><p class="treasury-note">Every reward not yet claimed is granted when your Town Hall reaches 7.</p>${challenges}</div>`;
  }
  private achievements() {
    const s = this.model.state;
    return `<div class="modal-body"><div class="league-banner">${icon('Trophy', 49)}<div><h2>${this.model.league.name}</h2><p>${n(s.trophies)} trophies · Chief level ${this.model.chiefLevel}</p>${this.chiefXpLine()}</div></div>${this.starterCard()}${this.starBonusCard()}<div class="profile-stats">${(
      [
        ['Swords', 'Raids won', n(s.stats.wins ?? 0)],
        ['Flag', 'Raids completed', n(s.stats.raids)],
        ['Castle', 'Buildings destroyed', n(s.stats.destroyed)],
        ['Coins', 'Resources collected', n(s.stats.collected)],
        [
          'Star',
          'Campaign stars',
          `${(s.nativeCampaign?.stars ?? []).reduce((a, b) => a + b, 0)} / ${NATIVE_CAMPAIGN.length * 3}`,
        ],
        ['LayoutGrid', 'Town Hall', `Level ${this.model.townhallLevel}`],
        ['Hammer', 'Builders', String(this.model.builders)],
      ] as const
    )
      .map(
        ([ic, label, value]) =>
          `<div class="profile-stat">${icon(ic, 18)}<b>${value}</b><small>${label}</small></div>`,
      )
      .join('')}</div>${this.achievementList()}</div>`;
  }
  private achievementList() {
    const list = [...this.model.achievements].sort(
      (a, b) =>
        Number(b.ready) - Number(a.ready) ||
        Number(!a.next) - Number(!b.next) ||
        ACHIEVEMENTS.indexOf(a.def) - ACHIEVEMENTS.indexOf(b.def),
    );
    const cards = list.map(({ def, claimed, next, value, ready }) => {
      const stars = def.tiers
        .map((_, i) => `<i class="${i < claimed ? 'won' : ''}">★</i>`)
        .join('');
      const shown = Math.min(value, next?.count ?? value);
      return `<article class="quest achievement" data-achievement="${def.id}"><div class="quest-icon">${icon(ACHIEVEMENT_ICONS[def.action] ?? 'Star', 28)}</div><div><h3>${def.title} <span class="achievement-stars" aria-label="${claimed} of ${def.tiers.length} stars">${stars}</span></h3><p>${next ? next.info : (def.completed ?? 'Complete')}</p>${next ? `<div class="quest-progress"><i style="width:${pct((shown / next.count) * 100)}"></i></div><small class="quest-count">${n(shown)} / ${n(next.count)} · +${n(next.xp)} XP</small>` : ''}</div>${next ? button(`claim:${def.id}`, `${gem} ${n(next.gems)}`, 'game-btn green quest-claim', ready ? '' : 'disabled') : `<b class="claimed-check">${icon('ShieldCheck', 23)}</b>`}</article>`;
    });
    const ready = this.model.achievementsReady;
    return `<h3 class="achievement-heading">Achievements${ready ? ` <small>${ready} ready</small>` : ''}</h3><div class="quest-list">${cards.join('')}</div><p class="achievement-note">${UNAVAILABLE_ACHIEVEMENTS.length} more of the original's achievements need clans, wars, Clan Games, Season Challenges, ranked leagues, defenses or a Supercell ID, which this offline village does not have.</p>`;
  }
  private help() {
    return `<div class="modal-body help-body"><div class="guide-hero"><img src="${hudAsset('swordsman')}" alt="Your Barbarian guide"><div><h2>Good to see you, Chief!</h2><p>The builders are ready, the gold is flowing, and your troops are itching for an adventure. Let's make this village a kingdom.</p></div></div><div class="help-steps"><article><b>1</b><div><h3>Build and rearrange</h3><p>Open the Shop and drag a building straight onto the village. Use Edit mode to drag anything already built — with undo, redo and three saved layouts.</p></div></article><article><b>2</b><div><h3>Grow past the Town Hall</h3><p>Buildings have distinct Town Hall requirements. Open Progression from the Army drawer to see the level caps and unlocks for each tier. Collectors keep working while you're away, up to 8 hours.</p></div></article><article><b>3</b><div><h3>Raise an army. Raid the valley.</h3><p>Prepare troops and spells instantly for free, save Quick armies, then attack. Practice against your own village from Army or the campaign map, and review your attacks in the Battle log. Campaign attacks have no time limit or trophy changes. Ladder matches, this game's own stand-in for multiplayer, pit you against a native layout for trophies: 30 seconds to scout, three minutes to attack, no loot. Each village has a finite supply of loot; any loot beyond your storage capacity is lost. Practice gives you 30 seconds to scout and three minutes to attack. Balloons fly over walls; Archer Towers and Air Defenses can hit them. Send Giants first, Wall Breakers to open a breach, then Goblins to steal resources. Mortars cannot fire within 4 tiles; moving troops can dodge their shells. Wizard Towers splash one troop layer at a time. Buy hidden traps from the Shop, place them in likely approaches, and test them in Practice. Traps are armed again for each new attack.</p></div></article></div><div class="help-controls"><span>Drag <b>Move camera</b></span><span>Hold <b>Stream troops</b></span><span>Hold &amp; drag <b>Spread troops</b></span><span>Double-tap <b>Deploy five</b></span><span>Esc <b>Close / cancel</b></span><span>M <b>Map cursor · Enter acts</b></span><span>B <b>Building list</b></span></div>${button('tutorial', `Let's build ${icon('ArrowRight', 19)}`, 'game-btn green start-btn')}</div>`;
  }
  private result() {
    const b = this.model.battle!,
      r = b.result!;
    return `<div class="modal-backdrop result-backdrop"><section class="result-modal" role="dialog" aria-modal="true" aria-labelledby="result-title"><div class="result-rays"></div><span class="result-eyebrow">BATTLE COMPLETE</span><h1 id="result-title">${b.practice ? 'Practice complete' : r.stars ? 'Victory!' : 'A brave attempt'}</h1><div class="result-stars">${[0, 1, 2].map((i) => `<span class="${i < r.stars ? 'earned' : ''}">★</span>`).join('')}</div><p>${r.destruction}% destruction <span>·</span> ${b.practice ? 'Your village' : campaignStage(b.index, b.catalog).name}</p>${
      b.practice
        ? '<p class="practice-result-note">Your village, troops and spells are unchanged.<br>Rearrange your defenses and try a different approach.</p>'
        : b.ladder
          ? ''
          : `<div class="result-loot"><div>${coin}<b data-count="${r.gold}">0</b><small>Gold received</small></div><div>${elixir}<b data-count="${r.elixir}">0</b><small>Elixir received</small></div>${r.dark !== undefined ? `<div>${resource('dark')}<b data-count="${r.dark}">0</b><small>Dark Elixir received</small></div>` : ''}</div>${
              r.lostLoot
                ? `<p class="loot-overflow-note">Storages full: ${campaignResourceKeys(r.lostLoot)
                    .filter((k) => campaignAmount(r.lostLoot!, k) > 0)
                    .map(
                      (k) =>
                        `${n(campaignAmount(r.lostLoot!, k))} ${k === 'dark' ? 'Dark Elixir' : k}`,
                    )
                    .join(', ')} could not be stored.</p>`
                : ''
            }`
    }${b.ladder ? `<p class="ladder-result">${icon('Trophy', 20)} <b>${r.trophies > 0 ? '+' : ''}${r.trophies}</b> trophies · now ${n(this.model.state.trophies)} · ${this.model.league.name}</p>` : ''}<div class="result-actions">${this.model.state.raidLog?.[0]?.replay ? button(`replay:${this.model.state.raidLog[0].id}`, `${icon('Play', 18)} Watch replay`, 'game-btn stone') : ''}${button('raid-again', `${icon('RotateCcw', 18)} ${b.practice ? 'Practice again' : b.ladder ? 'Next ladder match' : 'Prepare & attack again'}`, 'game-btn blue')}${button('home', `${icon('House', 22)} Return to village`, 'game-btn green')}</div><small class="result-note">${b.practice ? 'Practice never consumes your army.' : b.ladder ? 'Undeployed troops return home. Ladder matches are this game’s own stand-in for multiplayer.' : 'Undeployed troops return home. Loot does not replenish.'}</small></section></div>`;
  }
  /** Runs the result screen's loot numbers up from zero, once. */
  private countUp() {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-count]'))) {
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target) || this.model.reducedMotion) {
        el.textContent = n(target || 0);
        continue;
      }
      const started = performance.now();
      const step = () => {
        if (!el.isConnected) return;
        const t = Math.min(1, (performance.now() - started) / 780);
        el.textContent = n(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }
  /** Looks up every element updateLive() patches, once per rebuilt region. */
  private collectLiveRefs(): LiveRefs {
    const all = <T extends HTMLElement = HTMLElement>(selector: string) =>
      Array.from(this.root.querySelectorAll<T>(selector));
    const one = <T extends HTMLElement = HTMLElement>(selector: string) =>
      this.root.querySelector<T>(selector);
    const loot = new Map<string, HTMLElement>(),
      lootBars = new Map<string, HTMLElement>();
    for (const el of all('[data-loot]')) loot.set(el.dataset.loot!, el);
    for (const el of all('[data-lootbar]')) lootBars.set(el.dataset.lootbar!, el);
    const tray = this.hudEl.querySelector('.deploy-tray .army-tray');
    return {
      heroTimers: all('[data-hero-timer]'),
      helperTimers: all('[data-helper-timer]'),
      helperJobTimes: all('[data-helper-job]'),
      heroGems: all('[data-hero-gems]'),
      petTimers: all('[data-pet-timer]'),
      petGems: all('[data-pet-gems]'),
      nativeHeroCards: all('.deploy-tray .hero-card[data-action^="hero-select:"]'),
      legacyHeroCard: one('.hero-card'),
      trayButtons: tray
        ? Array.from(
            tray.querySelectorAll<HTMLButtonElement>(
              '[data-action^="troop:"],[data-action^="spell:"]',
            ),
          )
        : [],
      deployLabel: this.hudEl.querySelector<HTMLElement>('.deploy-label'),
      resources: all('[data-resource]'),
      obstacleTimes: all('[data-obstacle-time]'),
      upgrades: all('[data-upgrade]'),
      finishes: all('[data-finish]'),
      research: one('[data-research]'),
      researchCost: one('[data-research-cost]'),
      starBonusStatus: one('[data-star-bonus-status]'),
      boostTimers: all('[data-boost-end]'),
      armyCounts: all('[data-army-count]'),
      starBonusButton: one<HTMLButtonElement>('.star-bonus [data-action="star-bonus"]'),
      queue: one('[data-queue]'),
      replayTime: one('#replay-time'),
      replayProgress: one<HTMLInputElement>('#replay-progress'),
      battleTimer: one('#battle-timer'),
      destructionValue: one('#destruction-value'),
      destructionFill: one('#destruction-fill'),
      battleStars: one('#battle-stars'),
      loot,
      lootBars,
    };
  }
  private updateLive() {
    const m = this.model;
    this.audio.musicScene(musicScene(m.battle));
    let refs = (this.liveRefs ??= this.collectLiveRefs());
    // Legacy King and per-hero upgrade timers in the roster panel.
    for (const el of refs.heroTimers) {
      const kind = el.dataset.heroTimer;
      const end =
        kind && (HERO_KINDS as string[]).includes(kind)
          ? m.heroProgress(kind as HeroKind)?.upgradeEnd
          : m.state.king?.upgradeEnd;
      if (end) setText(el, time((end - m.clock) / 1000));
    }
    for (const el of refs.heroGems) {
      const kind = el.dataset.heroGems;
      const end =
        kind && (HERO_KINDS as string[]).includes(kind)
          ? m.heroProgress(kind as HeroKind)?.upgradeEnd
          : m.state.king?.upgradeEnd;
      if (end) setText(el, String(m.finishCost({ upgradeEnd: end } as Building)));
    }
    // Helper Hut: a working helper's hour, a resting one's rest, and each job's time left.
    for (const el of refs.helperTimers) {
      const kind = el.dataset.helperTimer as HelperKind;
      const h = m.helper(kind);
      const end = h && (helperWorking(kind, h) ? helperWorkEnd(kind, h) : h.readyAt);
      if (end) setText(el, time((end - m.clock) / 1000));
    }
    if (refs.helperJobTimes.length) {
      const ends = new Map<string, number>(
        HELPER_KINDS.flatMap((kind) =>
          m.helperJobs(kind).map((j) => [`${kind}.${helperJobId(j.target)}`, j.end] as const),
        ),
      );
      for (const el of refs.helperJobTimes) {
        const end = ends.get(el.dataset.helperJob!);
        if (end) setText(el, time((end - m.clock) / 1000));
      }
    }
    const petResearch = m.state.pets?.research;
    if (petResearch) {
      for (const el of refs.petTimers) setText(el, time((petResearch.end - m.clock) / 1000));
      for (const el of refs.petGems)
        setText(el, String(m.finishCost({ upgradeEnd: petResearch.end } as Building)));
    }
    // Native battle cards: refresh state transitions, otherwise just the health bars.
    if (m.battle?.nativeHeroes?.length) {
      let replaced = false;
      for (const card of refs.nativeHeroCards) {
        if (!card.isConnected) continue;
        const kind = card.dataset.action!.slice('hero-select:'.length) as HeroKind;
        const hero = m.battle.nativeHeroes.find((h) => h.kind === kind);
        if (!hero) continue;
        const unit = m.battle.units.find((u) => u.id === hero.unitId);
        const state = `${hero.kind}:${hero.unitId === null}:${!!unit && unit.hp <= 0}:${!!hero.abilityUsed}:${m.activeHeroKind === hero.kind}`;
        if (card.dataset.heroState !== state) {
          const focused = document.activeElement === card;
          const order = m.battle.nativeHeroes.map((h) => h.kind);
          card.outerHTML = this.nativeHeroCard(kind, order[0] === kind);
          replaced = true;
          if (focused)
            this.hudEl
              .querySelector<HTMLElement>(`[data-action="hero-select:${kind}"]`)
              ?.focus({ preventScroll: true });
          setText(refs.deployLabel, this.deployHint());
        } else {
          const health = card.querySelector<HTMLElement>('.hero-health i');
          if (health && unit) {
            const width = pct((unit.hp / unit.maxHp) * 100);
            if (health.style.width !== width) health.style.width = width;
          }
        }
      }
      if (replaced) refs = this.liveRefs = this.collectLiveRefs();
    }
    const heroCard = refs.legacyHeroCard;
    if (heroCard?.isConnected && m.battle?.hero && !m.battle.nativeHeroes?.length) {
      const h = m.battle.hero;
      const u = m.battle.units.find((u) => u.id === h.unitId);
      const state = `${h.unitId === null}:${!!u && u.hp <= 0}:${h.abilityUsed}:${m.activeHero}`;
      if (heroCard.dataset.heroState !== state) {
        const focused = document.activeElement === heroCard;
        heroCard.outerHTML = this.heroCard();
        refs = this.liveRefs = this.collectLiveRefs();
        if (m.activeHero) setText(refs.deployLabel, this.kingDeploymentHint());
        if (focused) refs.legacyHeroCard?.focus({ preventScroll: true });
      } else {
        const health = heroCard.querySelector<HTMLElement>('.hero-health i');
        if (health && u) {
          const width = pct((u.hp / u.maxHp) * 100);
          if (health.style.width !== width) health.style.width = width;
        }
      }
    }
    // Deploy tray counts: patched live so each deploy doesn't rebuild the whole
    // HUD. Mirrors troopCard/spellCard state (count, empty, disabled, selected).
    if (m.battle && !m.replay && refs.trayButtons.length) {
      const b = m.battle;
      for (const el of refs.trayButtons) {
        const action = el.dataset.action!;
        const troop = action.startsWith('troop:')
          ? (action.slice('troop:'.length) as TroopKind)
          : null;
        const spell = troop ? null : (action.slice('spell:'.length) as SpellKind);
        const count = troop ? (b.remaining[troop] ?? 0) : (b.spells[spell!] ?? 0);
        const name = troop ? TROOPS[troop].name : SPELLS[spell!].name;
        const selected = troop
          ? !m.activeHero && !m.activeHeroKind && !m.activeSpell && m.activeTroop === troop
          : m.activeSpell === spell;
        setText(el.querySelector('.troop-count'), `x${count}`);
        if (el.classList.contains('empty') !== (count === 0)) el.classList.toggle('empty');
        if (el.classList.contains('selected') !== selected) el.classList.toggle('selected');
        if (el.disabled !== (count === 0)) el.disabled = count === 0;
        const label = `${name}, ${count} available`;
        if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
      }
      setText(refs.deployLabel, this.deployHint());
    }
    const readOnly = !!(m as GameModel & { serverReadOnly?: boolean }).serverReadOnly;
    const economy = (m as GameModel & { serverEconomy?: { gold: number; elixir: number; gems: number; builderCapacity: number; username: string } | null }).serverEconomy;
    for (const el of refs.resources) {
      const key = el.dataset.resource as 'gold' | 'elixir' | 'dark' | 'gems';
      const value = readOnly
        ? key === 'gold' ? economy?.gold : key === 'elixir' ? economy?.elixir : key === 'gems' ? economy?.gems : undefined
        : m.state[key];
      setText(el, value == null ? '—' : n(value));
    }
    // Army tile counts, patched while a held Add or Remove defers the drawer's redraw.
    for (const el of refs.armyCounts) {
      const [type, kind] = el.dataset.armyCount!.split(':');
      setText(
        el,
        String(
          type === 'troop'
            ? (m.state.army[kind as TroopKind] ?? 0)
            : (m.state.spells[kind as SpellKind] ?? 0),
        ),
      );
    }
    for (const el of refs.boostTimers)
      setText(el, time(Math.max(0, Number(el.dataset.boostEnd) - m.clock) / 1000));
    // The Star Bonus cooldown ends without a structural change: count down and enable here.
    if (refs.starBonusStatus?.isConnected) {
      const bonus = m.starBonus;
      setText(
        refs.starBonusStatus,
        `${Math.min(bonus.stars, STAR_BONUS_STARS)}/${STAR_BONUS_STARS} stars · ${this.starBonusStatus()}`,
      );
      const button = refs.starBonusButton;
      if (button && button.disabled === m.starBonusReady) button.disabled = !m.starBonusReady;
    }
    if (refs.obstacleTimes.length) {
      const byId = new Map(m.obstacles.map((o) => [o.id, o]));
      for (const el of refs.obstacleTimes) {
        const o = byId.get(Number(el.dataset.obstacleTime));
        if (o?.removeEnd) setText(el, time((o.removeEnd - m.clock) / 1000));
      }
    }
    if (refs.upgrades.length || refs.finishes.length) {
      const byId = new Map(m.state.buildings.map((v) => [v.id, v]));
      for (const el of refs.upgrades) {
        const b = byId.get(Number(el.dataset.upgrade));
        if (b?.upgradeEnd) setText(el, time((b.upgradeEnd - m.clock) / 1000));
      }
      for (const el of refs.finishes) {
        const b = byId.get(Number(el.dataset.finish));
        if (b?.upgradeEnd) setText(el, String(m.finishCost(b)));
      }
    }
    if (m.state.research) {
      setText(refs.research, time((m.state.research.end - m.clock) / 1000));
      setText(
        refs.researchCost,
        String(m.finishCost({ upgradeEnd: m.state.research.end } as Building)),
      );
    }
    if (refs.queue) {
      let nextEnd = Infinity;
      for (const q of m.state.queue) if (q.end < nextEnd) nextEnd = q.end;
      for (const q of m.state.spellQueue) if (q.end < nextEnd) nextEnd = q.end;
      if (nextEnd !== Infinity) setText(refs.queue, time((nextEnd - m.clock) / 1000));
    }
    const replay = m.replay;
    // Leave the slider to the pointer while scrubbing (and briefly after a value
    // change); focus alone must not freeze the clock once playback resumes.
    if (replay && !this.replayScrubbing && performance.now() - this.replayInputAt > 300) {
      const value = replay.seeking ? replay.seekTarget : replay.time;
      setText(refs.replayTime, `${clock(value)} / ${clock(replay.duration)}`);
      const progress = refs.replayProgress;
      if (progress && progress.value !== String(value)) {
        progress.value = String(value);
        progress.setAttribute('aria-valuetext', clock(value));
      }
    }
    const b = m.battle;
    if (b) {
      setText(
        refs.battleTimer,
        timedBattle(b) ? clock(b.started ? BATTLE_SECONDS - b.elapsed : b.prep) : '∞',
      );
      setText(refs.destructionValue, `${b.destruction}%`);
      const fill = refs.destructionFill;
      if (fill) {
        const next = fillScale(b.destruction);
        if (fill.style.transform !== next) fill.style.transform = next;
      }
      const stars = refs.battleStars;
      if (stars && stars.dataset.stars !== String(b.stars)) {
        stars.dataset.stars = String(b.stars);
        stars.innerHTML = `${'★'.repeat(b.stars)}<span>${'★'.repeat(3 - b.stars)}</span>`;
      }
      if (refs.loot.size || refs.lootBars.size)
        for (const k of campaignResourceKeys(b.availableLoot ?? { gold: 0, elixir: 0 })) {
          const available = b.availableLoot?.[k] ?? 0;
          const left = Math.max(0, available - (b.lootTaken?.[k] ?? 0));
          setText(refs.loot.get(k), n(left));
          const bar = refs.lootBars.get(k);
          const next = fillScale((left / Math.max(1, available)) * 100);
          if (bar && bar.style.transform !== next) bar.style.transform = next;
        }
    }
  }
}

/** UI framing is independent of world registration; Cannon crops retain original pixels. */
function hudAsset(...args: Parameters<typeof asset>) {
  if (args[0] === 'archertower') return archerTowerPortrait(args[1] ?? 1);
  return args[0] === 'cannon' ? cannonIconAsset(args[1] ?? 1) : asset(...args);
}
