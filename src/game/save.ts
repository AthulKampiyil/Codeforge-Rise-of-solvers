import { validLadderMatch } from './ladder';
import { validJourney } from './heroes-journey';
import { validAchievements } from './achievements';
import { validBoosts, validMagicItems } from './magic-items';
import { validTrader } from './trader';
import { validStarter } from './starter-challenges';
import { validHelpers } from './helpers';
import { validCraftedFields } from './crafted-defenses';
import { superLicence } from './special-troops';
import type { TroopKind } from './data';
import {
  SPELL_TOWER_MODES,
  validGearMode,
  validSpellTowerMode,
  validWeaponLevel,
} from './native-defense-stats';
import { isGearable } from './native-merges';
import { superchargeCount } from './native-supercharge';
import { HERO_KINDS, heroMaxLevel, itemHero, validItem, validPet } from './native-hero-data';
import { validGear, validHeroRoster, validPetProgress } from './native-hero-village';
import { guardianLevels, validGuardian } from './native-guardians';
import { validInfernoMode } from './inferno-weapon';
import { validSpellTowerWeapon } from './late-campaign';
import { campaignStage, campaignStages, validCampaignCatalog } from './campaign-catalog';
import { expandNativeCampaign, validNativeCampaign } from './native-campaign';
import { validCampaignLoot, validCampaignResources, campaignAmount } from './campaign-loot';
import { validDirection } from './air-control-stats';
import { validSkeletonMode } from './skeleton-stats';
import { validXbowMode } from './xbow-stats';
import { gridSize, footprintSize, SAVE_VERSION, type GridVersion } from './grid';
import { migrateFootprints, validArrangement } from './layout-migration';
import { validObstacles, validObstacleGrowth, OBSTACLE_GEMS, overlapsObstacle } from './obstacles';
import {
  DECORATIONS,
  validDecorations,
  validStashedDecorations,
  withinDecorationLimits,
} from './decorations';
import { validateReplay } from './replay';
import { HERO_MAX_LEVEL } from './heroes';
import { validEquipment, validOres, EQUIPMENT_KEYS } from './equipment';
import { validStarBonus, validTreasury } from './leagues';
import { BUILDINGS, maxTroopLevel, SPELL_KEYS, TROOP_KEYS, isSpellKind } from './data';
import { emptySpells, expandArmyRoster } from './army';
import { maxSpellLevelFor } from './spell-progression';
import { BATTLE_SPEEDS, initialSave, type Save } from './model';
const KEY = 'crown-clan-save-v1';
/**
 * Ceiling on stored buildings, and on the slots of a saved layout. A maxed Town Hall 18 village
 * owns 483 pieces (158 buildings and 325 walls), so the former 400 could not hold one; the
 * limit exists to bound a malformed or hostile save, not to cap legitimate progress.
 */
export const MAX_SAVED_BUILDINGS = 600;
/** A Quick army's hero lineup: known heroes, once each, with their own items and a known pet. */
function validPresetHeroes(heroes: unknown) {
  return (
    Array.isArray(heroes) &&
    heroes.length <= HERO_KINDS.length &&
    new Set(heroes.map((h) => h?.kind)).size === heroes.length &&
    heroes.every(
      (h) =>
        h &&
        HERO_KINDS.includes(h.kind) &&
        Array.isArray(h.items) &&
        h.items.length <= 2 &&
        new Set(h.items).size === h.items.length &&
        h.items.every((slug: unknown) => validItem(slug) && itemHero(slug) === h.kind) &&
        (h.pet === undefined || validPet(h.pet)),
    )
  );
}
function finite(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}
const QUEST_IDS = [
  'gold-rush',
  'first-raid',
  'wall-breaker',
  'valley-explorer',
  'master-builder',
  'drill-sergeant',
  'town-planner',
  'goblin-raider',
  // Retired (it asked for trophies no attack awards); kept so saves that list it stay valid.
  'high-flier',
];
/**
 * Version 1 villages predate air troops and spells; early version 2 villages
 * predate specialist troops. Add only missing expansion fields, preserving
 * existing progress and leaving malformed values for validation to reject.
 */
export function migrateSave(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const raw = input as { version?: unknown };
  if (raw.version !== 1 && raw.version !== 2 && raw.version !== 3 && raw.version !== 4)
    return input;
  const s = structuredClone(input) as Record<string, unknown> & Omit<Partial<Save>, 'version'>;
  const version: GridVersion = raw.version === 4 ? 4 : raw.version === 3 ? 3 : 2;
  expandArmyRoster(s);
  expandNativeCampaign(s.nativeCampaign);
  if (version === 4) return validateVersion(s, version) ? s : input;
  const record = (value: unknown) =>
    value && typeof value === 'object' ? (value as Record<string, number>) : undefined;
  const army = record(s.army);
  const last = record(s.lastArmy);
  const levels = record(s.troopLevels);
  const added =
    s.version === 1
      ? ['balloon', 'goblin', 'wallbreaker']
      : s.version === 2
        ? ['goblin', 'wallbreaker']
        : [];
  for (const kind of added) {
    // Only absent fields are migrated; malformed values must still fail validation.
    if (army && !(kind in army)) army[kind] = 0;
    if (last && !(kind in last)) last[kind] = 0;
    if (levels && !(kind in levels)) levels[kind] = 1;
  }
  if (s.version === 1) {
    s.spells ??= emptySpells();
    s.spellQueue ??= [];
  }
  if (version === 2) s.dark ??= 0;
  s.version = version;
  if (!validateVersion(s, version)) return input;
  const moved = migrateFootprints(s as unknown as Save, version);
  if (moved === undefined) return input;
  if (moved) s.mapUpgrade = { moved };
  s.version = SAVE_VERSION;
  return s;
}
export function validateSave(input: unknown): input is Save {
  return validateVersion(input);
}
function validateVersion(input: unknown, version: GridVersion = SAVE_VERSION): input is Save {
  if (!input || typeof input !== 'object') return false;
  const s = input as Save;
  if (
    s.mapUpgrade !== undefined &&
    (!s.mapUpgrade ||
      !Number.isInteger(s.mapUpgrade.moved) ||
      s.mapUpgrade.moved < 1 ||
      s.mapUpgrade.moved > MAX_SAVED_BUILDINGS)
  )
    return false;
  if (s.saveRevision !== undefined && (!Number.isSafeInteger(s.saveRevision) || s.saveRevision < 0))
    return false;
  if (
    (s.version as number) !== version ||
    typeof s.tutorial !== 'boolean' ||
    !Number.isInteger(s.nextId) ||
    !['gold', 'elixir', 'gems', 'trophies', 'xp', 'lastTick', 'nextId'].every((k) =>
      finite(s[k as keyof Save]),
    ) ||
    !Array.isArray(s.buildings) ||
    s.buildings.length > MAX_SAVED_BUILDINGS ||
    s.buildings.length === 0 ||
    !s.army ||
    !s.spells ||
    !s.settings ||
    !s.stats ||
    !Array.isArray(s.queue) ||
    s.queue.length > 300 ||
    !Array.isArray(s.spellQueue) ||
    s.spellQueue.length > 50 ||
    !Array.isArray(s.stars) ||
    s.stars.length !== 12
  )
    return false;
  if (
    s.superBoosts !== undefined &&
    (!s.superBoosts ||
      typeof s.superBoosts !== 'object' ||
      Array.isArray(s.superBoosts) ||
      Object.entries(s.superBoosts).some(
        ([kind, end]) =>
          !TROOP_KEYS.includes(kind as TroopKind) ||
          !superLicence(kind as TroopKind) ||
          !Number.isFinite(end) ||
          end! < 0,
      ))
  )
    return false;
  if (
    !TROOP_KEYS.every((k) => Number.isInteger(s.army[k]) && s.army[k] >= 0 && s.army[k] < 10000) ||
    !SPELL_KEYS.every(
      (k) => Number.isInteger(s.spells[k]) && s.spells[k] >= 0 && s.spells[k] < 1000,
    ) ||
    !s.stars.every((v) => Number.isInteger(v) && v >= 0 && v <= 3)
  )
    return false;
  if (
    !['sound', 'music', 'reducedMotion'].every(
      (k) => typeof s.settings[k as keyof Save['settings']] === 'boolean',
    ) ||
    (s.settings.fullMotion !== undefined && typeof s.settings.fullMotion !== 'boolean') ||
    (s.settings.batterySaver !== undefined && typeof s.settings.batterySaver !== 'boolean') ||
    (s.settings.haptics !== undefined && typeof s.settings.haptics !== 'boolean') ||
    (s.settings.battleSpeed !== undefined && !BATTLE_SPEEDS.includes(s.settings.battleSpeed)) ||
    !['raids', 'destroyed', 'collected'].every((k) => finite(s.stats[k as keyof Save['stats']])) ||
    !(['built', 'trained', 'wins'] as const).every(
      (k) => s.stats[k] === undefined || finite(s.stats[k]),
    )
  )
    return false;
  if (
    s.claimedQuests !== undefined &&
    (!Array.isArray(s.claimedQuests) ||
      s.claimedQuests.length > QUEST_IDS.length ||
      s.claimedQuests.some((q) => !QUEST_IDS.includes(q)) ||
      new Set(s.claimedQuests).size !== s.claimedQuests.length)
  )
    return false;
  if (s.achievements !== undefined && !validAchievements(s.achievements)) return false;
  if (s.nativeCampaign !== undefined && !validNativeCampaign(s.nativeCampaign)) return false;
  if (s.campaignLoot !== undefined && !validCampaignLoot(s.campaignLoot)) return false;
  if (s.dark !== undefined && !finite(s.dark)) return false;
  if (s.ores !== undefined && !validOres(s.ores)) return false;
  if (s.starBonus !== undefined && !validStarBonus(s.starBonus)) return false;
  if (s.treasury !== undefined && !validTreasury(s.treasury)) return false;
  if (s.heroes !== undefined) {
    if (!validHeroRoster(s.heroes)) return false;
    if (!s.buildings.some((b) => b?.kind === 'herohall' && !b.constructing)) return false;
  }
  if (s.gear !== undefined && !validGear(s.gear)) return false;
  if (s.pets !== undefined && !validPetProgress(s.pets)) return false;
  if (
    s.heroLineup !== undefined &&
    (!Array.isArray(s.heroLineup) ||
      s.heroLineup.length > 4 ||
      new Set(s.heroLineup).size !== s.heroLineup.length ||
      !s.heroLineup.every((hero) => HERO_KINDS.includes(hero)))
  )
    return false;
  if (s.equipment !== undefined) {
    if (!validEquipment(s.equipment)) return false;
    const requiresBlacksmith =
      EQUIPMENT_KEYS.some((k) => s.equipment!.levels[k] > 1) ||
      s.equipment.loadout.includes('boots');
    if (requiresBlacksmith && !s.buildings.some((b) => b?.kind === 'blacksmith' && !b.constructing))
      return false;
  }
  if (
    s.king !== undefined &&
    (!s.king ||
      !Number.isInteger(s.king.level) ||
      s.king.level < 1 ||
      s.king.level > HERO_MAX_LEVEL ||
      !s.buildings.some((b) => b?.kind === 'herohall' && !b.constructing) ||
      (s.king.upgradeEnd !== undefined &&
        (!finite(s.king.upgradeEnd) ||
          !finite(s.king.upgradeStart) ||
          s.king.upgradeEnd <= s.king.upgradeStart! ||
          s.king.level >= HERO_MAX_LEVEL)) ||
      (s.king.upgradeEnd === undefined && s.king.upgradeStart !== undefined))
  )
    return false;
  const armyRecord = (value: unknown) =>
    value !== null &&
    typeof value === 'object' &&
    TROOP_KEYS.every(
      (k) =>
        Number.isInteger((value as Record<string, number>)[k]) &&
        (value as Record<string, number>)[k] >= 0 &&
        (value as Record<string, number>)[k] < 10000,
    );
  if (
    s.troopLevels !== undefined &&
    (!armyRecord(s.troopLevels) ||
      TROOP_KEYS.some((k) => s.troopLevels![k] < 1 || s.troopLevels![k] > maxTroopLevel(k)))
  )
    return false;
  if (s.lastArmy !== undefined && !armyRecord(s.lastArmy)) return false;
  const spellRecord = (value: unknown) =>
    value !== null &&
    typeof value === 'object' &&
    SPELL_KEYS.every(
      (k) =>
        Number.isInteger((value as Record<string, number>)[k]) &&
        (value as Record<string, number>)[k] >= 0 &&
        (value as Record<string, number>)[k] < 1000,
    );
  if (
    s.armyPresets !== undefined &&
    (!Array.isArray(s.armyPresets) ||
      s.armyPresets.length > 3 ||
      s.armyPresets.some(
        (p) =>
          p !== null &&
          (!p ||
            typeof p.name !== 'string' ||
            p.name.length > 32 ||
            !armyRecord(p.army) ||
            !spellRecord(p.spells) ||
            (p.heroes !== undefined && !validPresetHeroes(p.heroes))),
      ))
  )
    return false;
  if (
    s.raidLog !== undefined &&
    (!Array.isArray(s.raidLog) ||
      s.raidLog.length > 20 ||
      new Set(s.raidLog.map((r) => r?.id)).size !== s.raidLog.length ||
      s.raidLog.some(
        (r) =>
          !r ||
          !Number.isInteger(r.id) ||
          r.id < 1 ||
          r.id >= s.nextId ||
          !finite(r.at) ||
          !Number.isInteger(r.index) ||
          r.index < 0 ||
          !validCampaignCatalog(r.catalog) ||
          r.index >= campaignStages(r.catalog).length ||
          (r.practice && r.catalog === 'goblin-v1') ||
          typeof r.practice !== 'boolean' ||
          !finite(r.duration) ||
          r.duration > Number.MAX_SAFE_INTEGER ||
          (r.replayUnavailable !== undefined && r.replayUnavailable !== 'limit') ||
          !armyRecord(r.deployed) ||
          !spellRecord(r.spells) ||
          (r.hero !== undefined &&
            (!r.hero ||
              !Number.isInteger(r.hero.level) ||
              r.hero.level < 1 ||
              r.hero.level > HERO_MAX_LEVEL ||
              typeof r.hero.abilityUsed !== 'boolean')) ||
          (r.heroes !== undefined &&
            (!Array.isArray(r.heroes) ||
              r.heroes.length > HERO_KINDS.length ||
              new Set(r.heroes.map((h) => h?.kind)).size !== r.heroes.length ||
              r.heroes.some(
                (h) =>
                  !h ||
                  !HERO_KINDS.includes(h.kind) ||
                  !Number.isInteger(h.level) ||
                  h.level < 1 ||
                  h.level > heroMaxLevel(h.kind) ||
                  typeof h.abilityUsed !== 'boolean',
              ))) ||
          (r.replay !== undefined &&
            (!validateReplay(r.replay) ||
              r.index !== r.replay.initial.index ||
              r.practice !== r.replay.initial.practice ||
              JSON.stringify(r.ladder) !== JSON.stringify(r.replay.initial.ladder) ||
              (r.catalog ?? 'valley-v1') !== (r.replay.initial.catalog ?? 'valley-v1'))) ||
          !r.result ||
          (r.result.lostLoot !== undefined &&
            !validCampaignResources(r.result.lostLoot, campaignStage(r.index, r.catalog))) ||
          !finite(r.result.gold) ||
          !finite(r.result.elixir) ||
          (r.result.dark !== undefined &&
            (!Number.isSafeInteger(r.result.dark) ||
              r.result.dark < 0 ||
              r.result.dark >
                (r.practice ? 0 : campaignAmount(campaignStage(r.index, r.catalog), 'dark')))) ||
          !Number.isInteger(r.result.trophies) ||
          // Only a ladder match moves trophies; older valley records kept their -10..24 range.
          (r.ladder !== undefined
            ? !validLadderMatch(r.ladder) ||
              r.practice ||
              r.catalog !== 'goblin-v1' ||
              r.result.trophies < -r.ladder.loss ||
              r.result.trophies > r.ladder.win
            : r.result.trophies < -10 || r.result.trophies > 24) ||
          !Number.isInteger(r.result.stars) ||
          r.result.stars < 0 ||
          r.result.stars > 3 ||
          !Number.isInteger(r.result.destruction) ||
          r.result.destruction < 0 ||
          r.result.destruction > 100,
      ))
  )
    return false;
  if (
    s.lastSpells !== undefined &&
    (!s.lastSpells ||
      typeof s.lastSpells !== 'object' ||
      !SPELL_KEYS.every(
        (k) =>
          Number.isInteger(s.lastSpells![k]) && s.lastSpells![k] >= 0 && s.lastSpells![k] < 1000,
      ))
  )
    return false;
  if (
    s.research !== undefined &&
    (!s.research ||
      !(isSpellKind(s.research.kind) || TROOP_KEYS.includes(s.research.kind)) ||
      !finite(s.research.end) ||
      (isSpellKind(s.research.kind)
        ? (s.spellLevels?.[s.research.kind] ?? 1) >= maxSpellLevelFor(s.research.kind)
        : (s.troopLevels?.[s.research.kind] ?? 1) >= maxTroopLevel(s.research.kind)))
  )
    return false;
  if (
    s.spellLevels !== undefined &&
    (!spellRecord(s.spellLevels) ||
      SPELL_KEYS.some((k) => s.spellLevels![k] < 1 || s.spellLevels![k] > maxSpellLevelFor(k)))
  )
    return false;
  const ids = new Set<number>();
  for (const b of s.buildings) {
    if (
      !b ||
      !Object.hasOwn(BUILDINGS, b.kind) ||
      b.npc !== undefined ||
      !Number.isInteger(b.id) ||
      b.id < 1 ||
      ids.has(b.id) ||
      !Number.isInteger(b.x) ||
      !Number.isInteger(b.y) ||
      b.x < 0 ||
      b.y < 0 ||
      b.x + footprintSize(b.kind, BUILDINGS[b.kind].size, version) > gridSize(version) ||
      b.y + footprintSize(b.kind, BUILDINGS[b.kind].size, version) > gridSize(version) ||
      !validDirection(b.direction) ||
      !validSkeletonMode(b.skeletonMode) ||
      !validXbowMode(b.xbowMode) ||
      !validInfernoMode(b.infernoMode) ||
      !validSpellTowerMode(b.spellMode, b.kind, b.level) ||
      !validSpellTowerWeapon(b.spellTowerWeapon) ||
      !validGearMode(b.gearMode, b.kind) ||
      !validWeaponLevel(b.weaponLevel, b.kind, b.level) ||
      !validCraftedFields(b) ||
      (b.improving !== undefined &&
        (b.upgradeEnd === undefined ||
          !(
            (b.improving === 'weapon' && b.kind === 'townhall') ||
            (b.improving === 'gearup' && isGearable(b.kind) && !b.geared) ||
            (b.improving === 'guardian' && b.kind === 'townhall' && b.level >= 18) ||
            (b.improving === 'module' && b.kind === 'craftingstation') ||
            (b.improving === 'supercharge' &&
              b.level === BUILDINGS[b.kind].maxLevel &&
              (b.supercharge ?? 0) < superchargeCount(b.kind))
          ))) ||
      (b.supercharge !== undefined &&
        (!Number.isInteger(b.supercharge) ||
          b.supercharge < 1 ||
          b.supercharge > superchargeCount(b.kind) ||
          b.level !== BUILDINGS[b.kind].maxLevel)) ||
      (b.geared !== undefined && (b.geared !== true || !isGearable(b.kind))) ||
      ((b.guardian !== undefined || b.guardianLevel !== undefined) &&
        (b.kind !== 'townhall' ||
          b.level < 18 ||
          !validGuardian(b.guardian) ||
          (b.guardianLevel !== undefined &&
            (!Number.isInteger(b.guardianLevel) ||
              b.guardianLevel < 1 ||
              b.guardianLevel > guardianLevels(b.guardian ?? 'longshot'))))) ||
      b.infernoAmmo !== undefined ||
      (b.infernoMode !== undefined && b.kind !== 'inferno') ||
      !Number.isInteger(b.level) ||
      b.level < 1 ||
      b.level > BUILDINGS[b.kind].maxLevel ||
      !finite(b.hp) ||
      !finite(b.maxHp) ||
      !finite(b.stored) ||
      !finite(b.cooldown) ||
      (b.upgradeEnd !== undefined && !finite(b.upgradeEnd)) ||
      (b.upgradeStart !== undefined && !finite(b.upgradeStart))
    )
      return false;
    ids.add(b.id);
  }
  if (!validArrangement(s.buildings, [], version)) return false;
  if (s.obstacles !== undefined && !validObstacles(s.obstacles, s.buildings, version)) return false;
  if (
    s.obstacleGrowth !== undefined &&
    (!Array.isArray(s.obstacles) || !validObstacleGrowth(s.obstacleGrowth, s.obstacles))
  )
    return false;
  if (s.decorations !== undefined || s.stashedDecorations !== undefined) {
    // Decorations arrived with the current grid; older villages never held any.
    const placed = s.decorations ?? [],
      stashed = s.stashedDecorations ?? {};
    if (
      version !== SAVE_VERSION ||
      !validDecorations(placed) ||
      !validStashedDecorations(stashed) ||
      !withinDecorationLimits(placed, stashed) ||
      placed.some(
        (d) =>
          overlapsObstacle(s.obstacles ?? [], d.x, d.y, DECORATIONS[d.kind].size) ||
          s.buildings!.some(
            (b) =>
              d.x < b.x + BUILDINGS[b.kind].size &&
              d.x + DECORATIONS[d.kind].size > b.x &&
              d.y < b.y + BUILDINGS[b.kind].size &&
              d.y + DECORATIONS[d.kind].size > b.y,
          ),
      )
    )
      return false;
  }
  if (s.ladderSeed !== undefined && (!Number.isSafeInteger(s.ladderSeed) || s.ladderSeed < 0))
    return false;
  if (s.journey !== undefined && !validJourney(s.journey)) return false;
  if (s.goblinRaidSeen !== undefined && typeof s.goblinRaidSeen !== 'boolean') return false;
  if (s.magicItems !== undefined && !validMagicItems(s.magicItems)) return false;
  if (s.boosts !== undefined && !validBoosts(s.boosts)) return false;
  if (s.trader !== undefined && !validTrader(s.trader)) return false;
  if (s.starter !== undefined && !validStarter(s.starter)) return false;
  if (s.helpers !== undefined && !validHelpers(s.helpers)) return false;
  if (
    s.obstacleGemIndex !== undefined &&
    (!Number.isInteger(s.obstacleGemIndex) ||
      s.obstacleGemIndex < 0 ||
      s.obstacleGemIndex >= OBSTACLE_GEMS.length)
  )
    return false;
  if (
    s.layouts !== undefined &&
    (!Array.isArray(s.layouts) ||
      s.layouts.length > 3 ||
      s.layouts.some(
        (l) =>
          !l ||
          typeof l.name !== 'string' ||
          l.name.length > 40 ||
          !Array.isArray(l.slots) ||
          l.slots.length > MAX_SAVED_BUILDINGS ||
          l.slots.some(
            (v) =>
              !v ||
              !validDirection(v.direction) ||
              !validSkeletonMode(v.skeletonMode) ||
              !validXbowMode(v.xbowMode) ||
              !validInfernoMode(v.infernoMode) ||
              !validSpellTowerWeapon(v.spellTowerWeapon) ||
              (v.spellMode !== undefined && !SPELL_TOWER_MODES.includes(v.spellMode)) ||
              (v.gearMode !== undefined && v.gearMode !== 'long' && v.gearMode !== 'fast') ||
              !Number.isInteger(v.id) ||
              !Number.isInteger(v.x) ||
              !Number.isInteger(v.y) ||
              v.x < 0 ||
              v.y < 0 ||
              v.x >= gridSize(version) ||
              v.y >= gridSize(version),
          ),
      ))
  )
    return false;
  return (
    s.buildings.some((b) => b.kind === 'townhall') &&
    s.buildings.some((b) => b.kind === 'builder') &&
    s.nextId > Math.max(...ids) &&
    s.queue.every((q) => q && TROOP_KEYS.includes(q.kind) && finite(q.end)) &&
    s.spellQueue.every((q) => q && SPELL_KEYS.includes(q.kind) && finite(q.end))
  );
}
let db: IDBDatabase | null = null;
/** Highest commit revision either store held at load, or this session has written since. */
let commitRevision = 0;
/**
 * Recordings live apart from the village. A save writes the village without them (small enough
 * to stringify on every save and on unload); each recording is written to IndexedDB once, under
 * its raid record's id, in the same transaction as the village that first lists it, and deleted
 * with the last village that lists it. Loading attaches them again.
 */
// Keyed by record id and time: an imported village may reuse an id for a different raid.
const REPLAY_KEY = (record: { id: number; at: number }) => `replay:${record.id}:${record.at}`;
/** Keys of the recordings IndexedDB already holds. A recording never changes once written. */
const storedReplays = new Set<string>();
/** The village without its recordings; the in-memory state keeps them. */
export function villageSnapshot(state: Save): Save {
  if (!state.raidLog?.some((record) => record.replay)) return state;
  return {
    ...state,
    raidLog: state.raidLog.map((record) => {
      if (!record.replay) return record;
      const { replay: _, ...rest } = record;
      return rest;
    }),
  };
}
/** Reattaches stored recordings to a loaded village, keeping only ones that still validate. */
async function attachReplays(save: Save): Promise<Save> {
  const wanted = (save.raidLog ?? []).filter(
    (record) => !record.replay && storedReplays.has(REPLAY_KEY(record)),
  );
  if (!db || !wanted.length) return save;
  let replays: unknown[];
  try {
    const store = db.transaction('saves').objectStore('saves');
    replays = await Promise.all(
      wanted.map(
        (record) =>
          new Promise<unknown>((resolve, reject) => {
            const req = store.get(REPLAY_KEY(record));
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          }),
      ),
    );
  } catch {
    return save;
  }
  const full = structuredClone(save);
  for (const [i, record] of wanted.entries()) {
    const target = full.raidLog!.find((r) => r.id === record.id)!;
    if (replays[i]) target.replay = replays[i] as NonNullable<typeof target.replay>;
    // A recording that no longer fits its record is dropped rather than failing the village.
    if (!validateSave(full)) delete target.replay;
  }
  return full;
}
/** Whether `a` is a later commit than `b`: revision first, then the economy clock. */
const newer = (a: Save, b: Save) =>
  (a.saveRevision ?? 0) !== (b.saveRevision ?? 0)
    ? (a.saveRevision ?? 0) > (b.saveRevision ?? 0)
    : a.lastTick > b.lastTick;
export class SaveRecoveryError extends Error {
  constructor(public readonly copies: { source: string; text: string }[]) {
    super('Your saved village could not be opened. Download your saved data before trying again.');
    this.name = 'SaveRecoveryError';
  }
}
export async function loadSave(): Promise<Save | undefined> {
  // Read stores independently: a corrupt backup must not hide a healthy primary save.
  let backup: unknown;
  let primary: unknown;
  let backupText: string | null = null;
  try {
    backupText = localStorage.getItem(KEY);
    backup = JSON.parse(backupText || 'null');
  } catch {
    /* Try IndexedDB. */
  }
  try {
    db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('crown-and-clan', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('saves');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Save database is blocked by another tab'));
    });
    primary = await new Promise<unknown>((resolve, reject) => {
      const req = db!.transaction('saves').objectStore('saves').get('village');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const req = db!.transaction('saves').objectStore('saves').getAllKeys();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    storedReplays.clear();
    for (const key of keys)
      if (typeof key === 'string' && key.startsWith('replay:')) storedReplays.add(key);
  } catch {
    /* A valid local backup remains usable. */
  }
  const originals = [primary, backup];
  primary = migrateSave(primary);
  backup = migrateSave(backup);
  const migrated = [primary, backup];
  const valid = migrated.filter(validateSave);
  commitRevision = Math.max(commitRevision, ...valid.map((s) => s.saveRevision ?? 0));
  const newestValid = Math.max(-1, ...valid.map((s) => s.lastTick));
  const blocked = originals.some((s, i) => {
    const old = s as { version?: number; lastTick?: number } | undefined;
    return (
      old?.version === 3 &&
      validateVersion(s, 3) &&
      !validateSave(migrated[i]) &&
      old.lastTick! >= newestValid
    );
  });
  if (!blocked && validateSave(primary) && validateSave(backup))
    // IndexedDB wins a full tie: it is the primary store and the last to be written.
    return attachReplays(newer(backup, primary) ? backup : primary);
  if (!blocked && validateSave(primary)) return attachReplays(primary);
  if (!blocked && validateSave(backup)) return attachReplays(backup);
  // Existing data must never be overwritten by the new-village autosave. The recovery copy is
  // built only here: a pretty stringify of a multi-megabyte save on every boot bought nothing.
  let primaryText: string | undefined;
  try {
    primaryText = originals[0] == null ? undefined : JSON.stringify(originals[0], null, 2);
  } catch {
    primaryText = undefined;
  }
  const copies: SaveRecoveryError['copies'] = [];
  if (backupText !== null) copies.push({ source: 'backup', text: backupText });
  if (primaryText !== undefined) copies.push({ source: 'primary', text: primaryText });
  if (copies.length) throw new SaveRecoveryError(copies);
  return undefined;
}
/**
 * Keeps the unreadable stored copies under their own keys before a recovery import replaces the
 * village, so nothing is lost if the damaged save turns out to matter. True when at least one
 * store kept them.
 */
export async function preserveDamagedSave(copies: SaveRecoveryError['copies']) {
  const record = { at: Date.now(), copies };
  let kept = false;
  try {
    localStorage.setItem(KEY + '-damaged', JSON.stringify(record));
    kept = true;
  } catch {
    /* IndexedDB may still hold it. */
  }
  if (db)
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db!.transaction('saves', 'readwrite');
        tx.objectStore('saves').put(record, 'damaged');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      kept = true;
    } catch {
      /* The local copy, if any, remains. */
    }
  return kept;
}
export async function saveGame(state: Save): Promise<boolean> {
  let stored = false;
  // Every commit outranks every earlier one in either store, whatever its economy clock says.
  state.saveRevision = ++commitRevision;
  const village = villageSnapshot(state);
  const listed = new Map(
    (state.raidLog ?? []).flatMap((record) =>
      record.replay ? [[REPLAY_KEY(record), record.replay] as const] : [],
    ),
  );
  const added = [...listed.keys()].filter((id) => !storedReplays.has(id));
  const dropped = [...storedReplays].filter((id) => !listed.has(id));
  // No defensive structuredClone: both writes capture the state synchronously,
  // before the first await (JSON.stringify here, and IndexedDB's put() clones its
  // value when called inside the promise executor below).
  try {
    localStorage.setItem(KEY, JSON.stringify(village));
    stored = true;
  } catch {
    /* IndexedDB may still be available. */
  }
  if (db)
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db!.transaction('saves', 'readwrite');
        const store = tx.objectStore('saves');
        store.put(village, 'village');
        for (const key of added) store.put(listed.get(key), key);
        for (const key of dropped) store.delete(key);
        tx.oncomplete = () => {
          for (const key of added) storedReplays.add(key);
          for (const key of dropped) storedReplays.delete(key);
          resolve();
        };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      stored = true;
    } catch {
      /* Keep the local backup. */
    }
  return stored;
}
/**
 * Largest village backup the importer accepts. Exports are built to fit it: a village carrying
 * five of the longest recordings the replay validator allows stays well inside it once written
 * compactly, and anything larger drops recordings (oldest first) rather than producing a file
 * the importer refuses.
 */
export const MAX_SAVE_FILE_BYTES = 16 * 1024 * 1024;
const byteLength = (text: string) => new TextEncoder().encode(text).length;
/** Recordings removed to fit a backup, or excluded by a village-only backup. */
export interface SaveFile {
  text: string;
  droppedRecordings: number;
}
/** The backup file for `state`: compact JSON, within MAX_SAVE_FILE_BYTES. */
export function saveFileText(state: Save, recordings = true): SaveFile {
  const log = state.raidLog ?? [];
  const recorded = log.filter((record) => record.replay).length;
  let copy: Save = state;
  if (!recordings && recorded) copy = { ...state, raidLog: log.map(({ replay: _, ...r }) => r) };
  let text = JSON.stringify(copy);
  let dropped = recordings ? 0 : recorded;
  if (byteLength(text) > MAX_SAVE_FILE_BYTES) {
    const trimmed = structuredClone(copy);
    for (const record of [...(trimmed.raidLog ?? [])].reverse()) {
      if (!record.replay) continue;
      delete record.replay;
      dropped++;
      text = JSON.stringify(trimmed);
      if (byteLength(text) <= MAX_SAVE_FILE_BYTES) break;
    }
  }
  return { text, droppedRecordings: dropped };
}
/** Migrates and validates a backup's text; null when it is not a usable village. */
export function parseSaveFile(text: string): Save | null {
  if (byteLength(text) > MAX_SAVE_FILE_BYTES) return null;
  let data: unknown;
  try {
    data = migrateSave(JSON.parse(text));
  } catch {
    return null;
  }
  return validateSave(data) ? data : null;
}
/**
 * The village an import replaced, kept (without recordings) so the import can be undone, even
 * after a reload. One is kept at a time.
 */
const REPLACED_KEY = KEY + '-before-import';
export function keepReplacedVillage(state: Save) {
  try {
    localStorage.setItem(
      REPLACED_KEY,
      JSON.stringify({ at: Date.now(), state: villageSnapshot(state) }),
    );
    return true;
  } catch {
    return false;
  }
}
export function replacedVillage(): { at: number; state: Save } | null {
  try {
    const kept = JSON.parse(localStorage.getItem(REPLACED_KEY) ?? 'null');
    if (!kept || typeof kept.at !== 'number') return null;
    const state = migrateSave(kept.state);
    return validateSave(state) ? { at: kept.at, state } : null;
  } catch {
    return null;
  }
}
export function forgetReplacedVillage() {
  try {
    localStorage.removeItem(REPLACED_KEY);
  } catch {
    /* Nothing to forget. */
  }
}
export const saveFileName = (recordings: boolean) =>
  recordings ? 'crown-and-clan-village.json' : 'crown-and-clan-village-only.json';
export function freshSave() {
  return initialSave();
}
