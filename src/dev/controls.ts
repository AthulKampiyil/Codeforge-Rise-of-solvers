import { freshNativeCampaign, NATIVE_CAMPAIGN } from '../game/native-campaign';
import { GameModel, makeBuilding, type Save } from '../game/model';
import {
  BUILDINGS,
  BUILDING_KEYS,
  buildingHp,
  CAMPAIGN,
  MAX_TOWNHALL,
  isTrap,
  maxTroopLevel,
  researchLevelForLab,
  SPELL_KEYS,
  TROOP_KEYS,
  type BuildingKind,
  type TroopKind,
  type SpellKind,
} from '../game/data';
import type { CampaignCatalog } from '../game/campaign-catalog';
import { maxSpellLevelFor, spellProgression } from '../game/spell-progression';
import { isSiege } from '../game/special-troops';
import {
  HERO_KINDS,
  heroItems,
  heroLevelCap as rosterLevelCap,
  heroMaxLevel,
  heroSlots,
  itemLevelCap,
  itemMaxLevel,
  oreCaps,
  petLevelCap,
  petMaxLevel,
  PET_KINDS,
  validItem,
  type HeroKind,
  type OreKind,
  type PetKind,
} from '../game/native-hero-data';
import { gearFromLegacy, unlockCommonItems } from '../game/native-hero-village';
import { heroLevelCap as kingLevelCap } from '../game/heroes';
import { migrateSave, validateSave, MAX_SAVED_BUILDINGS } from '../game/save';
import { distributeArmy, distributeSpells, singleArmy } from './loadout';
import { readVillageSlots, writeVillageSlot } from './slots';
import { maxVillagePlan, packVillage, plannedTotal } from './village';

const balances = ['gold', 'elixir', 'dark', 'gems'] as const;
type Balance = (typeof balances)[number];
const ORE_KINDS = ['shiny', 'glowy', 'starry'] as const;
/** Production and timers are advanced in chunks, because one tick credits at most eight hours. */
const TICK_CHUNK = 8 * 3600_000;

function integer(value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw Error(`Enter a whole number between ${min} and ${max}.`);
}
/** What a maxed village of this Town Hall grants: every option is on unless switched off. */
export interface MaxVillageOptions {
  walls?: boolean;
  research?: boolean;
  heroes?: boolean;
  army?: boolean;
  resources?: boolean;
  campaign?: boolean;
}

/** Test mutations are atomic, validated, and independent of renderer state. */
export class DeveloperControls {
  private saved: Save;
  constructor(
    private model: GameModel,
    checkpoint?: Save,
  ) {
    const restored = migrateSave(checkpoint);
    this.saved = structuredClone(restored && validateSave(restored) ? restored : model.state);
  }
  private edit(change: (draft: GameModel) => void) {
    if (this.model.battle) throw Error('Return home before editing the village.');
    const draft = new GameModel(structuredClone(this.model.state));
    change(draft);
    draft.tick(Date.now());
    if (!validateSave(draft.state)) throw Error('That change would create an invalid village.');
    this.model.state = draft.state;
    this.model.cancel();
    this.model.endEdit();
    this.model.tick(Date.now());
    this.model.changed();
  }
  get checkpointSave() {
    return structuredClone(this.saved);
  }
  checkpoint() {
    if (this.model.battle) throw Error('Return home before taking a checkpoint.');
    this.saved = structuredClone(this.model.state);
    return this.checkpointSave;
  }
  restore() {
    // Restore gameplay data; leave current audio/accessibility settings in effect.
    const settings = structuredClone(this.model.state.settings);
    this.model.returnHome();
    this.model.endEdit();
    this.model.state = { ...this.checkpointSave, settings };
    this.model.cancel();
    this.model.tick(Date.now());
    this.model.changed();
  }

  // ------------------------------------------------------------------ economy
  setResources(values: Partial<Record<Balance, number>>) {
    this.edit((m) => {
      for (const [key, value] of Object.entries(values)) {
        if (!balances.includes(key as Balance)) throw Error('Unknown resource.');
        integer(value, 0, 999999999);
        m.state[key as Balance] = value;
      }
    });
  }
  fillResources() {
    this.edit((m) => fillResources(m));
  }
  setOres(values: Partial<Record<OreKind, number>>) {
    this.edit((m) => {
      const ores = (m.state.ores ??= { shiny: 0, glowy: 0, starry: 0 });
      for (const [key, value] of Object.entries(values)) {
        if (!ORE_KINDS.includes(key as OreKind)) throw Error('Unknown ore.');
        integer(value, 0, 99999999);
        ores[key as OreKind] = value;
      }
    });
  }
  fillOres() {
    this.edit((m) => {
      const caps = oreCaps(m.blacksmithLevel);
      if (!caps.shiny) throw Error('Build a Blacksmith before filling ores.');
      m.state.ores = { ...caps };
    });
  }
  setProgress(values: { trophies?: number; xp?: number }) {
    this.edit((m) => {
      if (values.trophies !== undefined) {
        integer(values.trophies, 0, 999999);
        m.state.trophies = values.trophies;
      }
      if (values.xp !== undefined) {
        integer(values.xp, 0, 99999999);
        m.state.xp = values.xp;
      }
    });
  }
  /**
   * Move every timer and production clock back by `seconds`, then settle. Wall-clock time is
   * untouched, so collectors, builders, research and hero upgrades advance exactly that far.
   */
  advanceTime(seconds: number) {
    integer(seconds, 1, 90 * 24 * 3600);
    this.edit((m) => {
      const ms = seconds * 1000;
      const back = (value: number | undefined) => (value === undefined ? undefined : value - ms);
      m.state.lastTick -= ms;
      for (const b of m.state.buildings) {
        b.upgradeEnd = back(b.upgradeEnd);
        b.upgradeStart = back(b.upgradeStart);
      }
      for (const o of m.state.obstacles ?? []) {
        o.removeEnd = back(o.removeEnd);
        o.removeStart = back(o.removeStart);
      }
      if (m.state.obstacleGrowth) m.state.obstacleGrowth.nextAt -= ms;
      if (m.state.king?.upgradeEnd !== undefined) {
        m.state.king.upgradeEnd -= ms;
        m.state.king.upgradeStart = back(m.state.king.upgradeStart);
      }
      for (const hero of Object.values(m.state.heroes ?? {}))
        if (hero.upgradeEnd !== undefined) {
          hero.upgradeEnd -= ms;
          hero.upgradeStart = back(hero.upgradeStart);
        }
      if (m.state.research) m.state.research.end -= ms;
      if (m.state.pets?.research) {
        m.state.pets.research.end -= ms;
        m.state.pets.research.start -= ms;
      }
      if (m.state.starBonus?.readyAt)
        m.state.starBonus.readyAt = Math.max(0, m.state.starBonus.readyAt - ms);
      const now = Date.now();
      for (let at = m.state.lastTick + TICK_CHUNK; at < now; at += TICK_CHUNK) m.tick(at);
      m.tick(now);
    });
  }

  // --------------------------------------------------------------------- army
  setArmy(
    troops: Partial<Record<TroopKind, number>>,
    spells: Partial<Record<SpellKind, number>> = {},
  ) {
    this.edit((m) => {
      for (const [key, value] of Object.entries(troops)) {
        if (!TROOP_KEYS.includes(key as TroopKind)) throw Error('Unknown troop.');
        integer(value, 0, 9999);
        m.state.army[key as TroopKind] = value;
      }
      for (const [key, value] of Object.entries(spells)) {
        if (!SPELL_KEYS.includes(key as SpellKind)) throw Error('Unknown spell.');
        integer(value, 0, 999);
        m.state.spells[key as SpellKind] = value;
      }
      m.state.queue = [];
      m.state.spellQueue = [];
    });
  }
  /**
   * Fill camp housing (and spell housing) from the troops this village has unlocked. One troop
   * takes every camp when `troop` is given; otherwise housing is split evenly across the roster.
   */
  fillArmy(options: { troop?: TroopKind; spells?: boolean; siege?: boolean } = {}) {
    if (options.troop && !TROOP_KEYS.includes(options.troop)) throw Error('Unknown troop.');
    this.edit((m) => {
      if (m.capacity <= 0) throw Error('Build an Army Camp first.');
      if (options.troop && !m.troopUnlocked(options.troop))
        throw Error(`${BUILDINGS.barracks.name} level too low for that troop.`);
      const roster = TROOP_KEYS.filter((kind) => m.troopUnlocked(kind) && !isSiege(kind));
      if (!roster.length) throw Error('No troops are unlocked yet.');
      const army = options.troop
        ? singleArmy(m.capacity, options.troop)
        : distributeArmy(m.capacity, roster);
      if (options.siege !== false) {
        const sieges = TROOP_KEYS.filter((kind) => isSiege(kind) && m.troopUnlocked(kind));
        // The reserve holds three machines whatever the camps hold.
        for (let i = 0; i < 3 && sieges.length; i++) army[sieges[i % sieges.length]]++;
      }
      m.state.army = army;
      if (options.spells !== false)
        m.state.spells = distributeSpells(
          m.spellCapacity,
          SPELL_KEYS.filter((kind) => m.spellUnlocked(kind)),
        );
      m.state.queue = [];
      m.state.spellQueue = [];
    });
  }

  // -------------------------------------------------------------- progression
  setTownHall(level: number) {
    integer(level, 1, MAX_TOWNHALL);
    this.edit((m) => {
      const hall = m.townhall!;
      hall.level = level;
      delete hall.upgradeEnd;
      delete hall.upgradeStart;
      hall.maxHp = hall.hp = BUILDINGS.townhall.hp * (1 + (level - 1) * 0.25);
    });
  }
  maxBuildings() {
    this.edit((m) => {
      for (const b of m.state.buildings) {
        if (b.kind !== 'townhall') b.level = Math.max(b.level, m.maxLevel(b.kind));
        b.hp = b.maxHp = buildingHp(b.kind, b.level);
        delete b.upgradeEnd;
        delete b.upgradeStart;
        delete b.constructing;
      }
    });
  }
  /** Raise (or lower) every building of one kind to an explicit level. */
  setBuildingLevel(kind: BuildingKind, level: number) {
    if (!BUILDING_KEYS.includes(kind)) throw Error('Unknown building.');
    integer(level, 1, BUILDINGS[kind].maxLevel);
    this.edit((m) => {
      const owned = m.state.buildings.filter((b) => b.kind === kind);
      if (!owned.length) throw Error(`This village has no ${BUILDINGS[kind].name}.`);
      for (const b of owned) {
        b.level = level;
        b.hp = b.maxHp = buildingHp(kind, level);
        delete b.upgradeEnd;
        delete b.upgradeStart;
        delete b.constructing;
        // A supercharge only exists at the catalog ceiling, and a weapon level with it.
        if (level !== BUILDINGS[kind].maxLevel) delete b.supercharge;
      }
      if (kind === 'townhall') m.tick(Date.now());
    });
  }
  maxResearch() {
    this.edit((m) => {
      m.state.troopLevels = Object.fromEntries(
        TROOP_KEYS.map((k) => [k, maxTroopLevel(k)]),
      ) as Record<TroopKind, number>;
      m.state.spellLevels = Object.fromEntries(
        SPELL_KEYS.map((k) => [k, maxSpellLevelFor(k)]),
      ) as Record<SpellKind, number>;
      delete m.state.research;
    });
  }
  setTroopLevel(kind: TroopKind, level: number) {
    if (!TROOP_KEYS.includes(kind)) throw Error('Unknown troop.');
    integer(level, 1, maxTroopLevel(kind));
    this.edit((m) => {
      m.state.troopLevels = {
        ...(Object.fromEntries(TROOP_KEYS.map((k) => [k, m.troopLevel(k)])) as Record<
          TroopKind,
          number
        >),
        [kind]: level,
      };
      if (m.state.research?.kind === kind) delete m.state.research;
    });
  }
  setSpellLevel(kind: SpellKind, level: number) {
    if (!SPELL_KEYS.includes(kind)) throw Error('Unknown spell.');
    integer(level, 1, maxSpellLevelFor(kind));
    this.edit((m) => {
      m.state.spellLevels = {
        ...(Object.fromEntries(SPELL_KEYS.map((k) => [k, m.spellLevel(k)])) as Record<
          SpellKind,
          number
        >),
        [kind]: level,
      };
      if (m.state.research?.kind === kind) delete m.state.research;
    });
  }
  /** Batch research: every named troop and spell level applied in one validated edit. */
  setResearch(
    troops: Partial<Record<TroopKind, number>> = {},
    spells: Partial<Record<SpellKind, number>> = {},
  ) {
    for (const [kind, level] of Object.entries(troops)) {
      if (!TROOP_KEYS.includes(kind as TroopKind)) throw Error('Unknown troop.');
      integer(level, 1, maxTroopLevel(kind as TroopKind));
    }
    for (const [kind, level] of Object.entries(spells)) {
      if (!SPELL_KEYS.includes(kind as SpellKind)) throw Error('Unknown spell.');
      integer(level, 1, maxSpellLevelFor(kind as SpellKind));
    }
    this.edit((m) => {
      m.state.troopLevels = Object.fromEntries(
        TROOP_KEYS.map((kind) => [kind, troops[kind] ?? m.troopLevel(kind)]),
      ) as Record<TroopKind, number>;
      m.state.spellLevels = Object.fromEntries(
        SPELL_KEYS.map((kind) => [kind, spells[kind] ?? m.spellLevel(kind)]),
      ) as Record<SpellKind, number>;
      delete m.state.research;
    });
  }
  /** Research every troop and spell as far as this village's Laboratory allows. */
  researchToLaboratory() {
    this.edit((m) => researchForLaboratory(m));
  }
  /** Batch hero levels, each capped by this village's Town Hall and Hero Hall. */
  setHeroLevels(levels: Partial<Record<HeroKind, number>>) {
    this.edit((m) => {
      if (!m.heroHall) throw Error('Build a Hero Hall first.');
      for (const [kind, level] of Object.entries(levels)) {
        if (!HERO_KINDS.includes(kind as HeroKind)) throw Error('Unknown hero.');
        if (!m.heroUnlocked(kind as HeroKind)) continue;
        const cap = kind === 'king' ? m.heroMaxLevel : m.heroLevelMax(kind as HeroKind);
        integer(level, 1, cap);
        if (kind === 'king') m.state.king = { level };
        else (m.state.heroes ??= {})[kind as Exclude<HeroKind, 'king'>] = { level };
      }
    });
  }
  /** Batch pet levels, each capped by this village's Pet House. */
  setPetLevels(levels: Partial<Record<PetKind, number>>) {
    this.edit((m) => {
      const house = m.petHouse?.level ?? 0;
      if (!house) throw Error('Build a Pet House first.');
      const pets = (m.state.pets ??= { levels: {}, assigned: {} });
      for (const [kind, level] of Object.entries(levels)) {
        if (!PET_KINDS.includes(kind as PetKind)) throw Error('Unknown pet.');
        const cap = petLevelCap(kind as PetKind, house);
        if (cap < 1) continue;
        integer(level, 1, cap);
        pets.levels[kind as PetKind] = level;
      }
    });
  }
  unlockKing() {
    this.edit((m) => {
      if (m.townhallLevel < 4) {
        const hall = m.townhall!;
        hall.level = 4;
        hall.hp = hall.maxHp = BUILDINGS.townhall.hp * 1.75;
        delete hall.upgradeEnd;
        delete hall.upgradeStart;
      }
      let hall = m.state.buildings.find((b) => b.kind === 'herohall');
      if (!hall) {
        for (let y = 2; y < 24 && !hall; y++)
          for (let x = 2; x < 24 && !hall; x++) {
            if (m.canPlace('herohall', x, y)) {
              hall = makeBuilding(m.state.nextId++, 'herohall', x, y);
              m.state.buildings.push(hall);
            }
          }
      }
      if (!hall) throw Error('Make room for a Hero Hall first.');
      delete hall.constructing;
      delete hall.upgradeEnd;
      delete hall.upgradeStart;
      m.tick(Date.now());
    });
  }
  setKingLevel(level: number) {
    this.edit((m) => {
      if (!m.state.king) throw Error('Unlock the King first.');
      integer(level, 1, m.heroMaxLevel);
      m.state.king = { level };
    });
  }
  /** Any hero, capped by this village's Town Hall and Hero Hall. */
  setHeroLevel(kind: HeroKind, level: number) {
    if (!HERO_KINDS.includes(kind)) throw Error('Unknown hero.');
    this.edit((m) => {
      if (!m.heroHall) throw Error('Build a Hero Hall first.');
      if (!m.heroUnlocked(kind))
        throw Error(`${kind} is not unlocked at this Town Hall and Hero Hall.`);
      const cap = kind === 'king' ? m.heroMaxLevel : m.heroLevelMax(kind);
      integer(level, 1, cap);
      if (kind === 'king') m.state.king = { level };
      else (m.state.heroes ??= {})[kind] = { level };
    });
  }
  /** Every unlocked hero, pet and gear item at the ceiling this village allows. */
  maxHeroes() {
    this.edit((m) => {
      if (!m.heroHall) throw Error('Build a Hero Hall first.');
      m.tick(Date.now());
      maxHeroRoster(m);
    });
  }
  setPetLevel(kind: PetKind, level: number) {
    if (!PET_KINDS.includes(kind)) throw Error('Unknown pet.');
    integer(level, 1, petMaxLevel(kind));
    this.edit((m) => {
      const house = m.petHouse?.level ?? 0;
      if (!house) throw Error('Build a Pet House first.');
      if (level > petLevelCap(kind, house))
        throw Error(`Pet House level ${house} allows level ${petLevelCap(kind, house)}.`);
      const pets = (m.state.pets ??= { levels: {}, assigned: {} });
      pets.levels[kind] = level;
    });
  }
  setItemLevel(slug: string, level: number) {
    if (!validItem(slug)) throw Error('Unknown hero item.');
    integer(level, 1, itemMaxLevel(slug));
    this.edit((m) => {
      const blacksmith = m.blacksmithLevel;
      if (!blacksmith) throw Error('Build a Blacksmith first.');
      if (level > itemLevelCap(slug, blacksmith))
        throw Error(
          `Blacksmith level ${blacksmith} allows level ${itemLevelCap(slug, blacksmith)}.`,
        );
      const gear = m.state.gear ?? gearFromLegacy(m.state.equipment);
      unlockCommonItems(gear, blacksmith);
      gear.levels[slug] = level;
      m.state.gear = gear;
    });
  }
  finishTimers() {
    this.edit((m) => {
      const now = Date.now();
      for (const b of m.state.buildings) if (b.upgradeEnd) b.upgradeEnd = now;
      if (m.state.king?.upgradeEnd) m.state.king.upgradeEnd = now;
      for (const hero of Object.values(m.state.heroes ?? {}))
        if (hero.upgradeEnd) hero.upgradeEnd = now;
      if (m.state.pets?.research) m.state.pets.research.end = now;
      if (m.state.research) m.state.research.end = now;
      m.tick(now);
    });
  }

  // ----------------------------------------------------------- maxed villages
  /**
   * Replace the village with a complete Town Hall `level` base: every building the tier permits,
   * at its ceiling, laid out fresh, with research, heroes, army and storages to match. Saved
   * layouts and obstacles are cleared, because both describe the arrangement being replaced.
   */
  maxTownHall(level: number, options: MaxVillageOptions = {}) {
    integer(level, 1, MAX_TOWNHALL);
    const plan = maxVillagePlan(level).filter(
      (entry) => options.walls !== false || entry.kind !== 'wall',
    );
    if (plannedTotal(plan) > MAX_SAVED_BUILDINGS)
      throw Error(`A Town Hall ${level} village needs more than ${MAX_SAVED_BUILDINGS} buildings.`);
    const placements = packVillage(plan);
    if (!placements) throw Error(`A Town Hall ${level} village does not fit the buildable area.`);
    this.edit((m) => {
      let id = m.state.nextId;
      m.state.buildings = placements.map((p) => makeBuilding(id++, p.kind, p.x, p.y, p.level));
      m.state.nextId = id;
      // The old arrangement and its obstacles describe a village that no longer exists.
      delete m.state.layouts;
      m.state.obstacles = [];
      // A maxed village is past the tutorial; `tutorial` records that it has been dismissed.
      m.state.tutorial = true;
      // Progress the new halls cannot support (a lower tier has no Hero Hall, Blacksmith or
      // Pet House) is cleared rather than carried over; the tick below re-grants what it can.
      delete m.state.king;
      delete m.state.heroes;
      delete m.state.heroLineup;
      delete m.state.pets;
      delete m.state.gear;
      delete m.state.equipment;
      delete m.state.ores;
      delete m.state.research;
      delete m.state.superBoosts;
      m.tick(Date.now());
      if (options.research !== false) researchForLaboratory(m);
      if (options.heroes !== false) maxHeroRoster(m);
      if (options.resources !== false) fillResources(m);
      if (options.army !== false) fillCamps(m);
      if (options.campaign) unlockCampaign(m, 3);
      m.tick(Date.now());
    });
  }
  /** What `maxTownHall` would place, for a panel that wants to show the cost before applying. */
  plan(level: number) {
    integer(level, 1, MAX_TOWNHALL);
    const plan = maxVillagePlan(level);
    return { entries: plan, total: plannedTotal(plan) };
  }

  // ----------------------------------------------------------------- campaign
  unlockCampaign() {
    this.edit((m) => unlockCampaign(m, 1));
  }
  /**
   * Enter any campaign stage directly. The path to it is unlocked first (existing higher star
   * counts are kept), because a locked stage refuses to start.
   */
  startStage(index: number, catalog: CampaignCatalog = 'valley-v1', practice = false) {
    if (this.model.battle) throw Error('Return home before starting another attack.');
    const stages = catalog === 'goblin-v1' ? NATIVE_CAMPAIGN.length : CAMPAIGN.length;
    integer(index, 0, stages - 1);
    if (!practice) this.edit((m) => unlockCampaign(m, 1));
    this.model.startBattle(index, practice, catalog);
    if (!this.model.battle)
      throw Error('That stage refused to start. Prepare an army, or try another stage.');
  }
  /** Clear every obstacle, freeing the tiles they hold. */
  clearObstacles() {
    this.edit((m) => {
      m.state.obstacles = [];
      if (m.selected !== null && m.selected < 0) m.selected = null;
    });
  }
  /** Give every stage of one (or both) catalogs a star count. */
  setCampaignStars(stars: number, catalog?: CampaignCatalog) {
    integer(stars, 0, 3);
    this.edit((m) => {
      if (catalog !== 'goblin-v1') m.state.stars = CAMPAIGN.map(() => stars);
      if (catalog !== 'valley-v1') {
        m.state.nativeCampaign ??= freshNativeCampaign();
        m.state.nativeCampaign.stars = NATIVE_CAMPAIGN.map(() => stars);
      }
    });
  }

  // ------------------------------------------------------------------- saving
  /** The current village as portable JSON, matching Settings → Export village. */
  exportSave() {
    return JSON.stringify(this.model.state, null, 2);
  }
  /** Replace the village with an exported save, migrated and validated before it is accepted. */
  importSave(text: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw Error('That is not valid save JSON.');
    }
    const migrated = migrateSave(parsed);
    if (!validateSave(migrated)) throw Error('That save is not a valid village.');
    this.adopt(migrated);
  }
  /** Keep the current village under a name, so several bases can be switched between. */
  saveVillageSlot(name: string) {
    if (this.model.battle) throw Error('Return home before saving this village.');
    return writeVillageSlot(name, this.model.state);
  }
  /** Switch to a stored village. Its own audio and accessibility settings are not restored. */
  loadVillageSlot(name: string) {
    const slot = readVillageSlots().find((entry) => entry.name === name);
    if (!slot) throw Error('That saved village is gone.');
    this.adopt(slot.save);
  }
  /** Adopt a validated save as the live village, keeping the player's current settings. */
  private adopt(save: Save) {
    if (this.model.battle) throw Error('Return home before switching villages.');
    const settings = structuredClone(this.model.state.settings);
    this.model.returnHome();
    this.model.endEdit();
    this.model.state = { ...structuredClone(save), settings };
    this.model.cancel();
    this.model.tick(Date.now());
    this.model.changed();
  }

  // ------------------------------------------------------------------- battle
  endBattle(victory: boolean) {
    const battle = this.model.battle;
    if (!battle || battle.finished || this.model.replay) throw Error('Start an attack first.');
    if (victory) {
      this.model.discardRecording();
      for (const b of battle.buildings) b.hp = 0;
    }
    this.model.finishBattle();
  }
  /** Destroy the weakest standing buildings until the attack sits at `percent` destruction. */
  damageBattle(percent: number) {
    integer(percent, 1, 100);
    const battle = this.model.battle;
    if (!battle || battle.finished || this.model.replay) throw Error('Start an attack first.');
    // Walls and traps are not scored, so destroying them would not move the percentage.
    const scored = battle.buildings.filter((b) => b.kind !== 'wall' && !isTrap(b.kind));
    const target = Math.ceil((percent / 100) * scored.length);
    const standing = scored.filter((b) => b.hp > 0).sort((a, b) => a.hp - b.hp);
    let destroyed = scored.length - standing.length;
    for (const b of standing) {
      if (destroyed >= target) break;
      this.model.damage(b, b.hp);
      // A concealed Tesla shrugs the damage off; it only counts once it actually falls.
      if (b.hp <= 0) destroyed++;
    }
    this.model.refreshBattleScore();
    this.model.changed();
  }
}

// ---------------------------------------------------------------- shared edits
function fillResources(m: GameModel) {
  m.state.gold = m.resourceCap('gold');
  m.state.elixir = m.resourceCap('elixir');
  m.state.dark = m.resourceCap('dark');
  m.state.gems = 10000;
  const caps = oreCaps(m.blacksmithLevel);
  if (caps.shiny) m.state.ores = { ...caps };
}
/** Research every troop and spell as far as this village's Laboratory allows. */
function researchForLaboratory(m: GameModel) {
  const laboratory = m.laboratory?.level ?? 0;
  m.state.troopLevels = Object.fromEntries(
    TROOP_KEYS.map((kind) => [kind, laboratory ? researchLevelForLab(kind, laboratory) : 1]),
  ) as Record<TroopKind, number>;
  m.state.spellLevels = Object.fromEntries(
    SPELL_KEYS.map((kind) => [kind, spellLevelForLaboratory(kind, laboratory)]),
  ) as Record<SpellKind, number>;
  delete m.state.research;
}
/** Highest level of a spell the Laboratory permits; every row names the level it needs. */
export function spellLevelForLaboratory(kind: SpellKind, laboratory: number) {
  let level = 1;
  while (
    level < maxSpellLevelFor(kind) &&
    (spellProgression(kind, level + 1)?.laboratory ?? Infinity) <= laboratory
  )
    level++;
  return level;
}
/** Heroes, pets, gear and ores at the ceilings this village's halls allow. */
function maxHeroRoster(m: GameModel) {
  const townhall = m.townhallLevel;
  const hall = m.heroHallLevel;
  if (!hall) return;
  m.state.king = { level: Math.max(1, kingLevelCap(townhall, hall)) };
  const heroes = (m.state.heroes ??= {});
  for (const kind of HERO_KINDS) {
    if (kind === 'king' || !m.heroUnlocked(kind)) continue;
    const cap = Math.min(heroMaxLevel(kind), rosterLevelCap(kind, townhall, hall));
    heroes[kind] = { level: Math.max(1, cap) };
  }
  m.state.heroLineup = HERO_KINDS.filter((kind) => m.heroProgress(kind)).slice(0, heroSlots(hall));
  const blacksmith = m.blacksmithLevel;
  if (blacksmith) {
    const gear = m.state.gear ?? gearFromLegacy(m.state.equipment);
    unlockCommonItems(gear, blacksmith);
    for (const hero of HERO_KINDS)
      for (const slug of heroItems(hero)) {
        // Epics are bought rather than unlocked; a maxed village owns every one it could buy.
        const cap = itemLevelCap(slug, blacksmith);
        if (cap >= 1) gear.levels[slug] = cap;
      }
    m.state.gear = gear;
    m.state.ores = { ...oreCaps(blacksmith) };
  }
  const house = m.petHouse?.level ?? 0;
  if (house) {
    const pets = (m.state.pets ??= { levels: {}, assigned: {} });
    for (const kind of PET_KINDS) {
      const cap = petLevelCap(kind, house);
      if (cap >= 1) pets.levels[kind] = cap;
    }
    delete pets.research;
    const owned = PET_KINDS.filter((kind) => pets.levels[kind] !== undefined);
    pets.assigned = {};
    m.heroLineup.forEach((hero, index) => {
      if (owned[index]) pets.assigned[hero] = owned[index];
    });
  }
}
/** Camps and spell housing filled from the unlocked roster. */
function fillCamps(m: GameModel) {
  const roster = TROOP_KEYS.filter((kind) => m.troopUnlocked(kind) && !isSiege(kind));
  if (roster.length && m.capacity > 0) m.state.army = distributeArmy(m.capacity, roster);
  const sieges = TROOP_KEYS.filter((kind) => isSiege(kind) && m.troopUnlocked(kind));
  for (let i = 0; i < 3 && sieges.length; i++) m.state.army[sieges[i % sieges.length]]++;
  const spells = SPELL_KEYS.filter((kind) => m.spellUnlocked(kind));
  if (spells.length && m.spellCapacity > 0)
    m.state.spells = distributeSpells(m.spellCapacity, spells);
  m.state.queue = [];
  m.state.spellQueue = [];
}
function unlockCampaign(m: GameModel, stars: number) {
  m.state.stars = m.state.stars.map((s) => Math.max(stars, s));
  m.state.nativeCampaign ??= freshNativeCampaign();
  m.state.nativeCampaign.stars = m.state.nativeCampaign.stars.map((s) => Math.max(stars, s));
}
