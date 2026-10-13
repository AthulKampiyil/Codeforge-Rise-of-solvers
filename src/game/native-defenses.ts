import { distance2D } from './distance';
import { BUILDINGS, TROOPS, isDefense, isTrap } from './data';
import { MAP_SIZE } from './grid';
import { concealedTesla } from './hidden-tesla';
import { flag, nativeRow, num, text, tiles } from './native-data';
import {
  HERO_WAKE_MULTIPLIER,
  SPELL_WAKE_MULTIPLIER,
  isNativeDefenseKind,
  monolithProjectile,
  nativeGearedWeapon,
  nativeWeapon,
  revengeTier,
  spellTowerSpell,
  townHallActivation,
  type NativeDefenseKind,
  type NativeWeapon,
  type SpellTowerMode,
} from './native-defense-stats';
import { castNativeSpell, spellRandom } from './native-spells';
import {
  buildingAttackIntervalScale,
  buildingDamageScale,
  buildingImmune,
  hurtUnit,
  unitEffects,
  unitHidden,
} from './native-status';
import {
  candleTargets,
  craftedLevel,
  craftedStats,
  type CraftedKind,
  type ModuleLevels,
} from './crafted-defenses';
import { nativeUnitStats, TROOP_SOURCE } from './native-units';
import { launchProjectile, type CombatProjectile, type NativeDefenseShot } from './projectiles';
import type { NativeTroopContext } from './native-troops';
import type { Battle, Building, Unit } from './model';

/**
 * Version 45+ rules for the Town Hall 11-18 defenses: Eagle Artillery, Scattershot, Spell Tower,
 * Monolith, the merged defenses, Firespitter, Revenge Tower, Builder's Hut turrets and the Town
 * Hall weapons. Numbers come from native-defense-stats (client 18.400.21); behavior follows the
 * official wiki pages archived under reference/official-wiki/defenses.
 */
export interface NativeDefenseState {
  /** Weapon clock: advances only while the defense can act, slowed by chill and frost. */
  clock: number;
  /** Clock time the next attack may start. */
  readyAt: number;
  /** Clock time of the pending release for the current target. */
  releaseAt?: number;
  target?: number;
  /** Per-archer or per-beam targets for multi-target weapons. */
  targets?: number[];
  /** Burst shots still to release, in clock time. */
  queue?: { at: number; target: number; x: number; y: number }[];
  /** Battle time the weapon wakes; undefined while dormant. */
  awakeAt?: number;
  /** Remaining volleys (Eagle Artillery) or shots (Scattershot). */
  ammo?: number;
  /** Spell Tower: unit inside the activation radius and when it entered. */
  dwell?: { unit: number; since: number };
  /** Spell Tower Invisibility: attackers that hit a covered building, and when. */
  trigger?: { units: number[]; at: number };
  /** Spell Tower clock time a new spell is loaded. */
  loadedAt?: number;
  /** Super Wizard Tower chain hits waiting to land. */
  chains?: { at: number; unit: number; damage: number; from: number }[];
  /** Town Hall weapon: battle time the death bomb explodes. */
  deathAt?: number;
  destroyed?: boolean;
  /** Presentation: beams currently held by a Giga Inferno. */
  beams?: number[];
  firedAt?: number;
  /** Hot Candle: battle time its melt timer started (the first destroyed building). */
  meltFrom?: number;
  /** Cake-A-Pult bombs waiting to explode. */
  bombs?: { at: number; x: number; y: number; damage: number; radius: number }[];
  /** Hero Hunter poison still ticking on units. */
  poisons?: { unit: number; until: number; dps: number; tickAt: number }[];
}
export interface NativeDefenseContext extends NativeTroopContext {
  /** Campaign difficulty multiplier; 1 in practice and native campaign battles. */
  defenseScale: number;
}

const EPS = 1e-9;
export const defenseState = (battle: Battle, tower: Building): NativeDefenseState =>
  ((battle.nativeDefenses ??= {})[tower.id] ??= { clock: 0, readyAt: 0 });
const center = (b: Building) => ({
  x: b.x + BUILDINGS[b.kind].size / 2,
  y: b.y + BUILDINGS[b.kind].size / 2,
});
const air = (u: Unit) => !!TROOPS[u.kind].flying;
const housing = (u: Unit) => (u.hero ? 25 : TROOPS[u.kind].space);
const liveTarget = (u: Unit, at: number) =>
  u.hp > 0 && !u.ejected && (u.spawnedAt ?? 0) <= at + EPS && !unitHidden(u, at);

/** Defenses the version 45 engine owns; campaign NPC archetypes keep their own rules. */
/**
 * Defenses the version 51 engine owns. A campaign layout keeps the late families that have
 * always stepped it, so the two engines never step the same building.
 */
export const nativeDefense = (battle: Battle, tower: Building): boolean =>
  !!battle.nativeRoster &&
  !tower.npc &&
  battle.catalog !== 'goblin-v1' &&
  // The Builder's Hut turret and its Defending Builder stay with the late family wherever that
  // family is running, so one hut is never armed and repaired by both engines.
  !(tower.kind === 'builder' && !!battle.late) &&
  (isNativeDefenseKind(tower.kind) ||
    (tower.kind === 'craftingstation' && !!tower.crafted) ||
    (!!tower.geared &&
      (tower.kind === 'cannon' || tower.kind === 'archertower' || tower.kind === 'mortar')));

export function weaponFor(tower: Building): NativeWeapon | null {
  if (tower.kind === 'craftingstation') return craftedWeapon(tower);
  if (
    tower.geared &&
    (tower.kind === 'cannon' || tower.kind === 'archertower' || tower.kind === 'mortar')
  )
    return nativeGearedWeapon(tower.kind, tower.level, tower.supercharge);
  // Traps and ordinary buildings have no weapon row of their own.
  if (!isNativeDefenseKind(tower.kind)) return null;
  const kind = tower.kind as NativeDefenseKind;
  const supercharge = tower.supercharge;
  if (kind === 'spelltower')
    return nativeWeapon(kind, tower.level, { mode: tower.spellMode ?? 'rage' });
  if (kind === 'multigeartower')
    return nativeWeapon(kind, tower.level, { mode: tower.gearMode ?? 'long', supercharge });
  if (kind === 'townhall')
    return nativeWeapon(kind, tower.level, { weaponLevel: tower.weaponLevel ?? 1 });
  return nativeWeapon(kind, tower.level, { supercharge });
}

// ------------------------------------------------------------ Crafting Station
const craftedLevels = (tower: Building, kind: CraftedKind): ModuleLevels =>
  tower.craftedModules?.[kind] ?? [1, 1, 1];
/** Client projectile rows the crafted shots borrow for flight speed and drawing. */
const CRAFTED_PROJECTILE: Record<CraftedKind, (levels: ModuleLevels) => string> = {
  candle: () => 'Tower Arrow Fire3',
  hunter: (levels) => `Headhunter_Card_lvl${Math.min(4, Math.ceil(levels[1] / 2.5))}`,
  cake: () => 'Mortar Ammo1',
};
/** The chosen Crafted Defense as a native weapon, from its three module levels. */
function craftedWeapon(tower: Building): NativeWeapon | null {
  const kind = tower.crafted;
  if (!kind) return null;
  const levels = craftedLevels(tower, kind);
  const stats = craftedStats(kind, levels);
  return {
    source: 'Crafting Station',
    level: craftedLevel(levels),
    range: stats.range,
    minRange: stats.minRange,
    air: true,
    ground: true,
    interval: stats.attackSeconds,
    windup: 0,
    retarget: 0,
    damage: stats.damage,
    burst: 1,
    burstDelay: 0,
    projectile: CRAFTED_PROJECTILE[kind](levels),
    splash: 0,
    targets: stats.stageTargets?.[0] ?? 1,
    sharedTargets: kind === 'candle',
    bounces: 0,
    hpPermil: 0,
    pushback: 0,
    pushbackHousing: 0,
    wakeSpace: 0,
    wakeDelay: 0,
    groupRadius: 0,
    ammo: 0,
    cone: 0,
    randomTarget: false,
    ...(kind === 'hunter'
      ? {
          preferHeroes: true,
          heroMultiplier: stats.heroMultiplier,
          poison: { level: stats.poisonLevel!, seconds: stats.poisonSeconds! },
        }
      : {}),
    ...(kind === 'cake'
      ? {
          layerSplash: stats.splashRadius,
          bomb: { damage: stats.bombDamage!, radius: stats.bombRadius!, delay: stats.bombDelay! },
        }
      : {}),
  };
}
const defenseStateById = (battle: Battle, id: number): NativeDefenseState =>
  ((battle.nativeDefenses ??= {})[id] ??= { clock: 0, readyAt: 0 });
/**
 * Hero Hunter poison: the slow and attack slow of a Poison Spell of the module's level for the
 * poison's seconds, and its damage per second, ticked by the defense that left it.
 */
function poisonUnit(
  battle: Battle,
  sourceId: number,
  unit: Unit,
  poison: { level: number; seconds: number },
  at: number,
) {
  const row = nativeRow('spells', 'Poison', poison.level);
  const e = unitEffects(unit);
  const until = at + poison.seconds;
  e.poison = {
    until: Math.max(e.poison?.until ?? 0, until),
    speed: Math.min(
      e.poison && e.poison.until > at ? e.poison.speed : 0,
      num(row, 'SpeedBoost') / 100,
    ),
    attackSpeed: Math.min(
      e.poison && e.poison.until > at ? e.poison.attackSpeed : 0,
      num(row, 'AttackSpeedBoost') / 100,
    ),
    dps: Math.max(num(row, 'PoisonDPS'), e.poison && e.poison.until > at ? e.poison.dps : 0),
    since: e.poison && e.poison.until > at ? e.poison.since : at,
  };
  const state = defenseStateById(battle, sourceId);
  const list = (state.poisons ??= []);
  const held = list.find((p) => p.unit === unit.id);
  if (held) {
    held.until = Math.max(held.until, until);
    held.dps = Math.max(held.dps, num(row, 'PoisonDPS'));
  } else list.push({ unit: unit.id, until, dps: num(row, 'PoisonDPS'), tickAt: at });
}
/** Cake bombs that are due explode on both layers; poison ticks up to now. */
function stepCraftedEffects(ctx: NativeDefenseContext, tower: Building, state: NativeDefenseState) {
  const battle = ctx.battle;
  const at = battle.elapsed;
  if (state.poisons?.length) {
    for (const p of state.poisons) {
      const unit = battle.units.find((u) => u.id === p.unit);
      const end = Math.min(at, p.until);
      if (unit && unit.hp > 0 && end > p.tickAt)
        hurtUnit(battle, unit, p.dps * (end - p.tickAt), end, tower.id);
      p.tickAt = end;
    }
    state.poisons = state.poisons.filter((p) => p.until > at + EPS);
  }
  if (!state.bombs?.length) return;
  const due = state.bombs.filter((bomb) => bomb.at <= at + EPS);
  if (!due.length) return;
  state.bombs = state.bombs.filter((bomb) => bomb.at > at + EPS);
  for (const bomb of due) {
    for (const u of battle.units)
      if (
        liveTarget(u, bomb.at) &&
        !u.native?.burrowed &&
        distance2D(u.x - bomb.x, u.y - bomb.y) <= bomb.radius + EPS
      )
        hurtUnit(battle, u, bomb.damage * ctx.defenseScale, bomb.at, tower.id);
    ctx.effect({ type: 'blast', x: bomb.x, y: bomb.y, radius: bomb.radius, color: 0xff8fc4 });
  }
}

/** Counts deployed housing toward Eagle Artillery and Builder's Hut activation. */
export function recordWakeSpace(battle: Battle, amount: number, at = battle.elapsed) {
  if (!battle.nativeRoster || !(amount > 0)) return;
  const log = (battle.nativeDeployments ??= []);
  log.push({ at, space: (log.at(-1)?.space ?? 0) + amount });
}
export const troopWakeSpace = (space: number) => space;
export const heroWakeSpace = () => 25 * HERO_WAKE_MULTIPLIER;
export const spellWakeSpace = (space: number) => space * SPELL_WAKE_MULTIPLIER;
const wakeTime = (battle: Battle, space: number) =>
  battle.nativeDeployments?.find((entry) => entry.space >= space)?.at;

/** Whether a Town Hall or Builder's Hut currently counts as a defense for troop targeting. */
export function activeAsDefense(battle: Battle, b: Building) {
  if (!battle.nativeRoster || b.npc) return isDefense(b.kind);
  if (b.kind === 'spelltower') return true;
  if (b.kind !== 'townhall' && b.kind !== 'builder') return isDefense(b.kind);
  if (b.constructing || b.upgradeEnd || !weaponFor(b)) return false;
  const state = battle.nativeDefenses?.[b.id];
  return state?.awakeAt !== undefined && state.awakeAt <= battle.elapsed + EPS;
}

/**
 * Model damage hook. Town Hall weapons wake on any damage; Spell Tower Invisibility watches
 * attacker (non-spell) hits on buildings inside its radius.
 */
export function noteBuildingDamage(battle: Battle, b: Building, at: number, spell: boolean) {
  if (!battle.nativeRoster) return;
  if (b.kind === 'townhall' && !b.npc) {
    const activation = townHallActivation(b.level);
    const state = defenseState(battle, b);
    if (activation.onDamage && state.awakeAt === undefined && weaponFor(b))
      state.awakeAt = at + activation.delay;
  }
  if (spell || b.kind === 'wall') return;
  for (const tower of spellTowers(battle)) {
    if (tower.hp <= 0 || tower.npc) continue;
    if ((tower.spellMode ?? 'rage') !== 'invisibility') continue;
    const weapon = weaponFor(tower);
    if (!weapon) continue;
    const c = center(tower);
    const size = BUILDINGS[b.kind].size;
    const gap = distance2D(
      Math.max(b.x - c.x, 0, c.x - b.x - size),
      Math.max(b.y - c.y, 0, c.y - b.y - size),
    );
    if (gap > weapon.range + EPS) continue;
    const state = defenseState(battle, tower);
    const attackers = battle.units.filter((u) => u.hp > 0 && u.target === b.id).map((u) => u.id);
    if (!state.trigger) state.trigger = { units: attackers, at };
    else
      for (const id of attackers)
        if (!state.trigger.units.includes(id)) state.trigger.units.push(id);
  }
}

/** The layout's Spell Towers in building order; kinds never change during a battle. */
const spellTowerLists = new WeakMap<
  Battle,
  { buildings: Building[]; length: number; towers: Building[] }
>();
function spellTowers(battle: Battle) {
  const known = spellTowerLists.get(battle);
  if (known && known.buildings === battle.buildings && known.length === battle.buildings.length)
    return known.towers;
  const towers = battle.buildings.filter((b) => b.kind === 'spelltower');
  spellTowerLists.set(battle, {
    buildings: battle.buildings,
    length: battle.buildings.length,
    towers,
  });
  return towers;
}

/** Whether one unit is a valid target for the weapon right now (`c` is the tower center). */
function eligibleUnit(
  tower: Building,
  weapon: NativeWeapon,
  at: number,
  c: { x: number; y: number },
  u: Unit,
) {
  if (!liveTarget(u, at)) return false;
  if (u.kind === 'totem' && tower.kind === 'spelltower') return false;
  const flying = air(u);
  if (u.kind !== 'totem' && (flying ? !weapon.air : !weapon.ground)) return false;
  const d = distance2D(u.x - c.x, u.y - c.y);
  return d <= weapon.range + EPS && d >= weapon.minRange - EPS;
}
function eligible(battle: Battle, tower: Building, weapon: NativeWeapon, at: number) {
  const c = center(tower);
  return battle.units.filter((u) => eligibleUnit(tower, weapon, at, c, u));
}
const byDistance = (from: { x: number; y: number }) => (a: Unit, b: Unit) =>
  distance2D(a.x - from.x, a.y - from.y) - distance2D(b.x - from.x, b.y - from.y) || a.id - b.id;

/** Destroyed non-wall structures, for Revenge Tower stages. */
export const destroyedBuildings = (battle: Battle) => {
  let count = 0;
  for (const b of battle.buildings) if (b.hp <= 0 && b.kind !== 'wall' && !isTrap(b.kind)) count++;
  return count;
};

/** Step one native defense. Returns early for levels without a weapon. */
export function stepNativeDefense(ctx: NativeDefenseContext, tower: Building, dt: number) {
  const battle = ctx.battle;
  const state = defenseState(battle, tower);
  const at = battle.elapsed;
  // A cake's bomb and a card's poison outlive the defense that left them.
  if (tower.kind === 'craftingstation') stepCraftedEffects(ctx, tower, state);
  if (tower.hp <= 0) {
    if (!state.destroyed) {
      state.destroyed = true;
      destroyed(ctx, tower, state, at);
    }
    stepDeathBomb(ctx, tower, state);
    return;
  }
  stepChains(ctx, tower, state);
  if (tower.constructing || tower.upgradeEnd) return;
  const weapon = weaponFor(tower);
  if (!weapon) return;
  if (!awake(battle, tower, state, weapon, at)) return;
  if (concealedTesla(battle, tower)) return;
  // Freeze, stun and Overgrowth stop the weapon clock; chill and frost slow it.
  const stopped = Math.max(
    battle.defenseStuns[tower.id] ?? 0,
    buildingImmune(battle, tower, at) ? at : 0,
  );
  const activeDt = Math.min(dt, Math.max(0, at - stopped));
  const speed = 1 / buildingAttackIntervalScale(battle, tower, at);
  const start = state.clock;
  const frameStart = at - activeDt;
  state.clock += activeDt * speed;
  const battleTime = (clock: number) => Math.min(at, frameStart + (clock - start) / speed);
  if (activeDt <= 0) {
    delete state.releaseAt;
    delete state.queue;
    delete state.beams;
    return;
  }
  if (tower.kind === 'craftingstation' && tower.crafted === 'candle') {
    // The melt timer starts with the first destroyed building (client InfernoCandleEffectAbility
    // ActiveAfterNumBuildingsDestroyed 1); each stage fires fewer flames.
    if (state.meltFrom === undefined && destroyedBuildings(battle) > 0) state.meltFrom = at;
    const stats = craftedStats('candle', craftedLevels(tower, 'candle'));
    const targets = candleTargets(stats, state.meltFrom === undefined ? 0 : at - state.meltFrom);
    return stepMultiTarget(
      ctx,
      tower,
      state,
      { ...weapon, targets, sharedTargets: targets > 3 },
      battleTime,
    );
  }
  const kind = tower.kind as NativeDefenseKind;
  if (kind === 'spelltower') return stepSpellTower(ctx, tower, state, weapon, battleTime);
  if (kind === 'eagleartillery') return stepEagle(ctx, tower, state, weapon, battleTime);
  if (kind === 'townhall' && weapon.targets > 1)
    return stepMultiTarget(ctx, tower, state, weapon, battleTime);
  if (kind === 'multiarchertower') return stepMultiTarget(ctx, tower, state, weapon, battleTime);
  if (kind === 'revengetower') {
    const tier = revengeTier(tower.level, destroyedBuildings(battle), tower.supercharge);
    if (tier.disabled) {
      delete state.target;
      delete state.releaseAt;
      return;
    }
    return stepSingle(
      ctx,
      tower,
      state,
      {
        ...weapon,
        damage: tier.damage,
        interval: tier.interval,
        projectile: tier.projectile,
        bounces: tier.bounces,
      },
      battleTime,
    );
  }
  stepSingle(ctx, tower, state, weapon, battleTime);
}

function awake(
  battle: Battle,
  tower: Building,
  state: NativeDefenseState,
  weapon: NativeWeapon,
  at: number,
) {
  if (state.awakeAt === undefined) {
    if (tower.kind === 'townhall') {
      const activation = townHallActivation(tower.level);
      if (activation.afterSeconds >= 0) state.awakeAt = activation.afterSeconds;
      else if (battle.destruction > activation.destruction) state.awakeAt = at + activation.delay;
    } else if (weapon.wakeSpace > 0) {
      const crossed = wakeTime(battle, weapon.wakeSpace);
      if (crossed !== undefined) state.awakeAt = crossed + weapon.wakeDelay;
    } else state.awakeAt = 0;
    if (state.awakeAt === undefined) return false;
  }
  if (state.awakeAt > at + EPS) return false;
  if (state.ammo === undefined && weapon.ammo > 0) state.ammo = weapon.ammo;
  return true;
}

const damageScale = (ctx: NativeDefenseContext, tower: Building, at: number) =>
  ctx.defenseScale * buildingDamageScale(ctx.battle, tower, at);

/** Sticky single-target weapons with optional wind-up, retarget delay and bursts. */
function stepSingle(
  ctx: NativeDefenseContext,
  tower: Building,
  state: NativeDefenseState,
  weapon: NativeWeapon,
  battleTime: (clock: number) => number,
) {
  const battle = ctx.battle;
  const at = battle.elapsed;
  const c = center(tower);
  stepQueue(ctx, tower, state, weapon, battleTime);
  if (state.queue?.length) return;
  if (state.ammo !== undefined && state.ammo <= 0) return;
  const candidates = eligible(battle, tower, weapon, at).filter((u) => inCone(tower, weapon, u));
  let target = candidates.find((u) => u.id === state.target);
  if (!target) {
    target = weapon.randomTarget
      ? candidates.sort((a, b) => a.id - b.id)[
          Math.floor(
            spellRandom(battle.seed ^ tower.id, Math.floor(state.clock * 1000)) * candidates.length,
          )
        ]
      : (weapon.preferHeroes && candidates.some((u) => u.hero)
          ? candidates.filter((u) => u.hero)
          : candidates
        ).sort(byDistance(c))[0];
    if (!target) {
      delete state.target;
      delete state.releaseAt;
      return;
    }
    const wind = state.target === undefined ? weapon.windup : weapon.retarget || weapon.windup;
    state.target = target.id;
    state.releaseAt = Math.max(state.readyAt, state.clock - 1e-6 + wind);
    battle.defenseTargets[tower.id] = target.id;
  }
  state.releaseAt ??= Math.max(state.readyAt, state.clock);
  while (state.releaseAt! <= state.clock + EPS && target.hp > 0) {
    const release = state.releaseAt!;
    state.readyAt = release + weapon.interval;
    state.releaseAt = state.readyAt;
    state.firedAt = battleTime(release);
    if (state.ammo !== undefined) state.ammo--;
    if (weapon.burst > 1) {
      state.queue = Array.from({ length: weapon.burst }, (_, i) => ({
        at: release + i * weapon.burstDelay,
        target: target!.id,
        x: target!.x,
        y: target!.y,
      }));
      stepQueue(ctx, tower, state, weapon, battleTime);
      break;
    }
    fire(ctx, tower, weapon, target, battleTime(release));
    if (state.ammo !== undefined && state.ammo <= 0) break;
  }
}

/** Firespitter arcs are measured around its facing, in 90-degree steps along tile edges. */
const FACING = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;
function inCone(tower: Building, weapon: NativeWeapon, u: Unit) {
  if (!weapon.cone || weapon.cone >= 360) return true;
  const c = center(tower);
  const [fx, fy] = FACING[Math.floor(((tower.direction ?? 0) % 8) / 2)];
  const dx = u.x - c.x,
    dy = u.y - c.y,
    d = distance2D(dx, dy);
  return d < EPS || (dx * fx + dy * fy) / d >= Math.cos(((weapon.cone / 2) * Math.PI) / 180) - EPS;
}

function stepQueue(
  ctx: NativeDefenseContext,
  tower: Building,
  state: NativeDefenseState,
  weapon: NativeWeapon,
  battleTime: (clock: number) => number,
) {
  if (!state.queue?.length) return;
  const battle = ctx.battle;
  while (state.queue.length && state.queue[0].at <= state.clock + EPS) {
    const shot = state.queue.shift()!;
    const target = battle.units.find((u) => u.id === shot.target);
    const at = battleTime(shot.at);
    if (tower.kind === 'eagleartillery') {
      // Shells lock onto the chosen unit; a lost target keeps its last position.
      const live = target && liveTarget(target, at) ? target : undefined;
      if (live) Object.assign(shot, { x: live.x, y: live.y });
      fireEagleShell(ctx, tower, weapon, shot, live, at);
      continue;
    }
    if (
      !target ||
      !liveTarget(target, at) ||
      !eligibleUnit(tower, weapon, at, center(tower), target)
    ) {
      // Burst weapons stop and retarget when their unit dies or leaves range.
      state.queue = [];
      delete state.target;
      break;
    }
    fire(ctx, tower, weapon, target, at);
  }
  if (!state.queue.length) delete state.queue;
}

/** Release one shot, projectile or instant, with the defense's hit rules. */
function fire(
  ctx: NativeDefenseContext,
  tower: Building,
  weapon: NativeWeapon,
  target: Unit,
  at: number,
) {
  const battle = ctx.battle;
  const c = center(tower);
  const damage =
    weapon.damage *
    damageScale(ctx, tower, at) *
    (weapon.heroMultiplier && target.hero ? weapon.heroMultiplier : 1);
  if (weapon.pierce) return firePiercing(ctx, tower, weapon, target, at, damage);
  if (weapon.chain) {
    hurtUnit(battle, target, damage, at, tower.id);
    ctx.effect({
      type: 'defense-zap',
      sourceId: tower.id,
      targetId: target.id,
      x: c.x,
      y: c.y,
      toX: target.x,
      toY: target.y,
      toAir: air(target),
      text: tower.kind,
    });
    const state = defenseState(battle, tower);
    const chained = battle.units
      .filter(
        (u) =>
          u.id !== target.id &&
          liveTarget(u, at) &&
          (air(u) ? weapon.air : weapon.ground) &&
          distance2D(u.x - target.x, u.y - target.y) <= weapon.chain!.distance + EPS,
      )
      .sort(byDistance(target))
      .slice(0, weapon.chain.targets);
    chained.forEach((u, i) =>
      (state.chains ??= []).push({
        at: at + (i + 1) * weapon.chain!.delay,
        unit: u.id,
        damage: damage * weapon.chain!.factor,
        from: target.id,
      }),
    );
    return;
  }
  if (!weapon.projectile) {
    hurtUnit(battle, target, damage, at, tower.id);
    ctx.effect({
      type: 'defense-zap',
      sourceId: tower.id,
      targetId: target.id,
      x: c.x,
      y: c.y,
      toX: target.x,
      toY: target.y,
      toAir: air(target),
      text: tower.kind,
    });
    return;
  }
  const projectile =
    tower.kind === 'monolith' ? monolithProjectile(tower.level, target.maxHp) : weapon.projectile;
  const row = nativeRow('projectiles', projectile);
  const shot: NativeDefenseShot = {
    hit: [],
    air: weapon.air,
    ground: weapon.ground,
    bounces: weapon.bounces,
    bounceDistance: tiles(row, 'MaxBounceDistance'),
    bounceFactor: 1 - num(row, 'BounceDamageReductionPercent') / 100,
    ...(weapon.hpPermil ? { hpPermil: weapon.hpPermil } : {}),
    ...(tower.kind === 'mortar' && weapon.splash ? { splash: weapon.splash } : {}),
    ...(weapon.layerSplash ? { layerSplash: weapon.layerSplash } : {}),
    ...(weapon.poison ? { poison: { ...weapon.poison } } : {}),
    ...(weapon.bomb ? { bomb: { ...weapon.bomb } } : {}),
    ...(tower.kind === 'scattershot' ? { scatter: { level: tower.level, angle: 0 } } : {}),
    ...(text(row, 'HitSpell') && tower.kind !== 'scattershot'
      ? { spell: { name: text(row, 'HitSpell'), level: num(row, 'HitSpellLevel', 1) || 1 } }
      : {}),
  };
  launchProjectile(
    battle,
    {
      weapon: 'native',
      native: { name: projectile, kind: tower.kind, level: tower.level },
      defense: shot,
      sourceId: tower.id,
      targetId: target.id,
      targetBuilding: false,
      fromX: c.x,
      fromY: c.y,
      x: target.x,
      y: target.y,
      toAir: air(target),
      damage,
    },
    ctx.effect,
    at,
  );
}

function stepChains(ctx: NativeDefenseContext, tower: Building, state: NativeDefenseState) {
  if (!state.chains?.length) return;
  const battle = ctx.battle;
  const due = state.chains.filter((hop) => hop.at <= battle.elapsed + EPS);
  if (!due.length) return;
  state.chains = state.chains.filter((hop) => hop.at > battle.elapsed + EPS);
  for (const hop of due) {
    const unit = battle.units.find((u) => u.id === hop.unit);
    if (!unit || !liveTarget(unit, hop.at)) continue;
    const from = battle.units.find((u) => u.id === hop.from) ?? unit;
    hurtUnit(battle, unit, hop.damage, hop.at);
    ctx.effect({
      type: 'defense-zap',
      sourceId: tower.id,
      targetId: unit.id,
      x: from.x,
      y: from.y,
      toX: unit.x,
      toY: unit.y,
      toAir: air(unit),
      text: 'chain',
    });
  }
}

/**
 * Multi-Archer Tower archers and Town Hall beams: each release picks distinct nearest units,
 * keeping current targets; weapons that allow it double up when fewer units are in range.
 */
function stepMultiTarget(
  ctx: NativeDefenseContext,
  tower: Building,
  state: NativeDefenseState,
  weapon: NativeWeapon,
  battleTime: (clock: number) => number,
) {
  const battle = ctx.battle;
  const at = battle.elapsed;
  const c = center(tower);
  const candidates = eligible(battle, tower, weapon, at).sort(byDistance(c));
  if (!candidates.length) {
    delete state.targets;
    delete state.releaseAt;
    delete state.beams;
    return;
  }
  const kept = (state.targets ?? []).filter((id) => candidates.some((u) => u.id === id));
  const unique = [...new Set(kept)];
  const assigned: number[] = [];
  for (const id of unique) if (assigned.length < weapon.targets) assigned.push(id);
  for (const u of candidates)
    if (assigned.length < weapon.targets && !assigned.includes(u.id)) assigned.push(u.id);
  if (weapon.sharedTargets && assigned.length < weapon.targets) {
    // Inferno Artillery: 3 units -> the nearest takes two; 2 units -> two each; 1 unit -> all four.
    const base = [...assigned];
    for (let i = 0; assigned.length < weapon.targets; i++) assigned.push(base[i % base.length]);
  }
  const changed = assigned.join(',') !== (state.targets ?? []).join(',');
  const fresh = state.targets === undefined || state.releaseAt === undefined;
  state.targets = assigned;
  if (fresh) state.releaseAt = Math.max(state.readyAt, state.clock - 1e-6 + weapon.windup);
  else if (changed && weapon.retarget)
    state.releaseAt = Math.max(state.releaseAt!, state.clock + weapon.retarget);
  // Giga Infernos hold continuous beams; presentation reads them from the state.
  if (tower.kind === 'townhall' && !weapon.projectile && weapon.interval < 0.2)
    state.beams = [...new Set(assigned)];
  while (state.releaseAt! <= state.clock + EPS) {
    const release = state.releaseAt!;
    state.readyAt = release + weapon.interval;
    state.releaseAt = state.readyAt;
    const time = battleTime(release);
    state.firedAt = time;
    for (const id of assigned) {
      const target = battle.units.find((u) => u.id === id);
      if (!target || target.hp <= 0) continue;
      if (state.beams) {
        hurtUnit(battle, target, weapon.damage * damageScale(ctx, tower, time), time, tower.id);
        continue;
      }
      fire(ctx, tower, weapon, target, time);
    }
  }
}

/** Eagle Artillery: heat-map target, 3-shell volleys, blind spot and limited ammunition. */
function stepEagle(
  ctx: NativeDefenseContext,
  tower: Building,
  state: NativeDefenseState,
  weapon: NativeWeapon,
  battleTime: (clock: number) => number,
) {
  const battle = ctx.battle;
  stepQueue(ctx, tower, state, weapon, battleTime);
  if (state.queue?.length || (state.ammo ?? 1) <= 0) return;
  const candidates = eligible(battle, tower, weapon, battle.elapsed);
  if (!candidates.length) {
    delete state.releaseAt;
    return;
  }
  state.releaseAt ??= Math.max(state.readyAt, state.clock - 1e-6 + weapon.windup);
  if (state.releaseAt > state.clock + EPS) return;
  // Heat map: the unit whose TargetGroupsRadius neighborhood carries the most enemy weight.
  let best: Unit | undefined,
    bestScore = -1;
  for (const u of candidates) {
    let score = 0;
    for (const v of battle.units)
      if (liveTarget(v, battle.elapsed) && distance2D(v.x - u.x, v.y - u.y) <= weapon.groupRadius)
        score += groupWeight(battle, v);
    if (score > bestScore + EPS || (Math.abs(score - bestScore) <= EPS && best && u.id < best.id)) {
      best = u;
      bestScore = score;
    }
  }
  const release = state.releaseAt;
  state.readyAt = release + weapon.interval;
  state.releaseAt = state.readyAt;
  state.firedAt = battleTime(release);
  state.target = best!.id;
  battle.defenseTargets[tower.id] = best!.id;
  if (state.ammo !== undefined) state.ammo--;
  state.queue = Array.from({ length: weapon.burst }, (_, i) => ({
    at: release + i * weapon.burstDelay,
    target: best!.id,
    x: best!.x,
    y: best!.y,
  }));
  stepQueue(ctx, tower, state, weapon, battleTime);
}
function groupWeight(battle: Battle, u: Unit) {
  if (u.hero) return num(nativeRow('heroes', 'Barbarian King', 1), 'EnemyGroupWeight', 100);
  const level = u.level ?? battle.troopLevels?.[u.kind as keyof typeof TROOP_SOURCE] ?? 1;
  return nativeUnitStats(u.kind, level).enemyGroupWeight;
}
function fireEagleShell(
  ctx: NativeDefenseContext,
  tower: Building,
  weapon: NativeWeapon,
  shot: { target: number; x: number; y: number },
  target: Unit | undefined,
  at: number,
) {
  const c = center(tower);
  // A unit inside the blind spot or beyond range draws the shell to the edge of the range.
  const dx = shot.x - c.x,
    dy = shot.y - c.y,
    d = distance2D(dx, dy) || 1;
  const reach = Math.min(weapon.range, Math.max(weapon.minRange, d));
  const x = c.x + (dx / d) * reach,
    y = c.y + (dy / d) * reach;
  const row = nativeRow('projectiles', weapon.projectile);
  const spell = text(row, 'HitSpell');
  const level = num(row, 'HitSpellLevel', 1) || 1;
  const spellRow = nativeRow('spells', spell, level);
  launchProjectile(
    ctx.battle,
    {
      weapon: 'native',
      native: { name: weapon.projectile, kind: tower.kind, level: tower.level },
      defense: {
        hit: [],
        air: true,
        ground: true,
        bounces: 0,
        bounceDistance: 0,
        bounceFactor: 1,
        spell: { name: spell, level },
        shock: {
          damage: weapon.damage,
          inner: tiles(spellRow, 'Radius'),
          outer: weapon.splash,
          pushback: weapon.pushback,
          housing: weapon.pushbackHousing,
        },
      },
      sourceId: tower.id,
      targetId: target?.id ?? shot.target,
      targetBuilding: false,
      fromX: c.x,
      fromY: c.y,
      x,
      y,
      toAir: target ? air(target) : false,
      damage: 0,
    },
    ctx.effect,
    at,
  );
}

/** Firespitter balls fly straight past the aim point and strike up to two units on the way. */
export interface NativePiercingShot {
  id: string;
  sourceId: number;
  fromX: number;
  fromY: number;
  dirX: number;
  dirY: number;
  length: number;
  speed: number;
  launched: number;
  travelled: number;
  radius: number;
  hits: number;
  damage: number;
  hit: number[];
  /** Logger logs knock struck units back along their path. */
  pushback?: number;
}
function firePiercing(
  ctx: NativeDefenseContext,
  tower: Building,
  weapon: NativeWeapon,
  target: Unit,
  at: number,
  damage: number,
) {
  const battle = ctx.battle;
  const c = center(tower);
  const sequence = (battle.nativeShotSequence = (battle.nativeShotSequence ?? 0) + 1);
  const angle = spellRandom(battle.seed ^ tower.id, sequence * 2) * Math.PI * 2;
  const reach =
    Math.sqrt(spellRandom(battle.seed ^ tower.id, sequence * 2 + 1)) * weapon.pierce!.spread;
  const aimX = target.x + Math.cos(angle) * reach,
    aimY = target.y + Math.sin(angle) * reach;
  const dx = aimX - c.x,
    dy = aimY - c.y,
    d = distance2D(dx, dy) || 1;
  const speed = num(nativeRow('projectiles', weapon.projectile), 'Speed', 2000) / 100;
  (battle.nativePiercing ??= []).push({
    id: `${tower.id}:${sequence}`,
    sourceId: tower.id,
    fromX: c.x,
    fromY: c.y,
    dirX: dx / d,
    dirY: dy / d,
    length: d + weapon.pierce!.extra,
    speed,
    launched: at,
    travelled: 0,
    radius: weapon.pierce!.radius,
    hits: weapon.pierce!.hits,
    damage,
    hit: [],
  });
}
/** Advance piercing balls along their lines; each unit is struck at most once per ball. */
export function stepPiercingShots(ctx: NativeTroopContext) {
  const battle = ctx.battle;
  if (!battle.nativePiercing?.length) return;
  for (const shot of battle.nativePiercing) {
    const travelled = Math.min(
      shot.length,
      Math.max(0, battle.elapsed - shot.launched) * shot.speed,
    );
    const from = shot.travelled;
    shot.travelled = travelled;
    if (travelled <= from) continue;
    const candidates = battle.units
      .filter((u) => liveTarget(u, battle.elapsed) && !shot.hit.includes(u.id))
      .map((u) => {
        const along = (u.x - shot.fromX) * shot.dirX + (u.y - shot.fromY) * shot.dirY;
        const side = Math.abs((u.x - shot.fromX) * shot.dirY - (u.y - shot.fromY) * shot.dirX);
        return { u, along, side };
      })
      .filter(
        (c) =>
          c.along >= from - shot.radius &&
          c.along <= travelled + EPS &&
          c.side <= shot.radius + EPS,
      )
      .sort((a, b) => a.along - b.along || a.u.id - b.u.id);
    for (const c of candidates) {
      if (shot.hit.length >= shot.hits) break;
      shot.hit.push(c.u.id);
      hurtUnit(battle, c.u, shot.damage, shot.launched + Math.max(0, c.along) / shot.speed);
      if (shot.pushback && c.u.hp > 0 && !c.u.native?.siege)
        knockback(ctx, c.u, c.u.x - shot.dirX, c.u.y - shot.dirY, shot.pushback);
    }
  }
  battle.nativePiercing = battle.nativePiercing.filter(
    (shot) => shot.travelled < shot.length - EPS && shot.hit.length < shot.hits,
  );
}

/** Projectile landing for defense shots: damage, %-hitpoint bonus, spells, scatter and ricochets. */
export function resolveDefenseImpact(ctx: NativeTroopContext, p: CombatProjectile) {
  const battle = ctx.battle;
  const shot = p.defense!;
  const target = battle.units.find((u) => u.id === p.targetId);
  const at = p.impact;
  const struck = !!target && target.hp > 0 && !target.native?.burrowed && !target.native?.recalled;
  if (struck && p.damage > 0) {
    hurtUnit(
      battle,
      target!,
      p.damage + (shot.hpPermil ? (target!.maxHp * shot.hpPermil) / 1000 : 0),
      at,
      p.sourceId,
    );
    shot.hit.push(target!.id);
  }
  if (shot.spell)
    castNativeSpell(battle, shot.spell.name, shot.spell.level, 'defense', p.x, p.y, {
      at,
      immediate: true,
    });
  if (shot.shock) {
    for (const u of battle.units) {
      if (!liveTarget(u, at) || u.native?.burrowed) continue;
      const d = distance2D(u.x - p.x, u.y - p.y);
      if (d <= shot.shock.inner + EPS || d > shot.shock.outer + EPS) continue;
      hurtUnit(battle, u, shot.shock.damage, at, p.sourceId);
      if (shot.shock.pushback > 0 && housing(u) <= shot.shock.housing && !u.native?.siege)
        knockback(ctx, u, p.x, p.y, shot.shock.pushback);
    }
    ctx.effect({ type: 'blast', x: p.x, y: p.y, radius: shot.shock.outer, color: 0xffc04a });
  }
  if (shot.scatter && struck) scatter(battle, p, target!, shot, at);
  if (shot.poison && struck) poisonUnit(battle, p.sourceId, target!, shot.poison, at);
  if (shot.bomb)
    (defenseStateById(battle, p.sourceId).bombs ??= []).push({
      at: at + shot.bomb.delay,
      x: p.x,
      y: p.y,
      damage: shot.bomb.damage,
      radius: shot.bomb.radius,
    });
  if (shot.layerSplash && struck) {
    const layer = air(target!);
    for (const u of battle.units)
      if (
        u.id !== target!.id &&
        liveTarget(u, at) &&
        air(u) === layer &&
        !u.native?.burrowed &&
        distance2D(u.x - p.x, u.y - p.y) <= shot.layerSplash + EPS
      )
        hurtUnit(battle, u, p.damage, at, p.sourceId);
  }
  if (shot.splash) {
    // Geared-up Mortar shells: ground splash around the landing point (the target is included).
    for (const u of battle.units)
      if (
        liveTarget(u, at) &&
        !air(u) &&
        !u.native?.burrowed &&
        u.id !== (struck ? target!.id : -1) &&
        distance2D(u.x - p.x, u.y - p.y) <= shot.splash + EPS
      )
        hurtUnit(battle, u, p.damage, at, p.sourceId);
  }
  if (shot.bounces > (p.native?.bounce ?? 0) && shot.bounceDistance > 0) {
    const from = { x: p.x, y: p.y };
    const next = battle.units
      .filter(
        (u) =>
          liveTarget(u, at) &&
          !shot.hit.includes(u.id) &&
          (air(u) ? shot.air : shot.ground) &&
          distance2D(u.x - from.x, u.y - from.y) <= shot.bounceDistance + EPS,
      )
      .sort(byDistance(from))[0];
    if (next)
      launchProjectile(
        battle,
        {
          weapon: 'native',
          native: { ...p.native!, bounce: (p.native!.bounce ?? 0) + 1 },
          defense: { ...shot, hit: [...shot.hit] },
          sourceId: p.sourceId,
          targetId: next.id,
          targetBuilding: false,
          fromX: from.x,
          fromY: from.y,
          fromAir: p.toAir,
          x: next.x,
          y: next.y,
          toAir: air(next),
          damage: p.damage * shot.bounceFactor,
        },
        ctx.effect,
        at,
      );
  }
}

/**
 * Scattershot fragments: a 90-degree cone behind the impact on the struck layer. Inside the
 * building's 1-tile DamageRadius the value falls from the direct hit to the hit spell's Damage;
 * from there to the spell Radius (5 tiles) it falls linearly to MinDamage (SmoothDamage).
 */
function scatter(
  battle: Battle,
  p: CombatProjectile,
  target: Unit,
  shot: NativeDefenseShot,
  at: number,
) {
  const level = shot.scatter!.level;
  const spell = nativeRow(
    'spells',
    text(nativeRow('projectiles', p.native!.name), 'HitSpell'),
    level,
  );
  const building = nativeRow('buildings', 'Scattershot', level);
  const inner = tiles(building, 'DamageRadius');
  const outer = tiles(spell, 'Radius');
  const half = ((num(spell, 'ConeAngle', 90) / 2) * Math.PI) / 180;
  const dx = p.x - p.fromX,
    dy = p.y - p.fromY,
    len = distance2D(dx, dy) || 1;
  const layer = air(target);
  for (const u of battle.units) {
    if (u.id === target.id || !liveTarget(u, at) || air(u) !== layer || u.native?.burrowed)
      continue;
    const ux = u.x - p.x,
      uy = u.y - p.y,
      d = distance2D(ux, uy);
    if (d > outer + EPS) continue;
    if (d > EPS && (ux * dx + uy * dy) / (d * len) < Math.cos(half) - EPS) continue;
    const fragment =
      d <= inner
        ? p.damage + (num(spell, 'Damage') - p.damage) * (inner ? d / inner : 1)
        : num(spell, 'Damage') +
          (num(spell, 'MinDamage') - num(spell, 'Damage')) *
            ((d - inner) / Math.max(EPS, outer - inner));
    hurtUnit(battle, u, Math.max(0, fragment), at);
  }
}

/** Push a unit away from a point, stopping before solid building footprints for ground units. */
export function knockback(
  ctx: NativeTroopContext,
  u: Unit,
  x: number,
  y: number,
  distance: number,
) {
  const dx = u.x - x,
    dy = u.y - y,
    d = distance2D(dx, dy);
  const nx = d > EPS ? dx / d : 1,
    ny = d > EPS ? dy / d : 0;
  let travel = 0;
  const step = 0.1;
  const flying = air(u);
  while (travel + step <= distance + EPS) {
    const px = u.x + nx * (travel + step),
      py = u.y + ny * (travel + step);
    if (px < 0.5 || py < 0.5 || px > MAP_SIZE - 0.5 || py > MAP_SIZE - 0.5) break;
    if (
      !flying &&
      ctx.battle.buildings.some(
        (b) =>
          b.hp > 0 &&
          !isTrap(b.kind) &&
          px > b.x &&
          px < b.x + BUILDINGS[b.kind].size &&
          py > b.y &&
          py < b.y + BUILDINGS[b.kind].size,
      )
    )
      break;
    travel += step;
  }
  if (travel <= EPS) return;
  const seconds = 0.25;
  u.airPush = { x: (nx * travel) / seconds, y: (ny * travel) / seconds, remaining: seconds };
  u.path = [];
  u.pathAt = 0;
}

/** Spell Tower: dwell, cast and recharge; the loaded spell is released when destroyed. */
function stepSpellTower(
  ctx: NativeDefenseContext,
  tower: Building,
  state: NativeDefenseState,
  weapon: NativeWeapon,
  battleTime: (clock: number) => number,
) {
  const battle = ctx.battle;
  const mode = (tower.spellMode ?? 'rage') as SpellTowerMode;
  if ((state.loadedAt ?? 0) > state.clock + EPS) {
    delete state.dwell;
    delete state.trigger;
    return;
  }
  const c = center(tower);
  if (mode === 'invisibility') {
    const trigger = state.trigger;
    if (!trigger) return;
    // A cast needs at least one attacker from the triggering hits to survive the 1.2 s dwell.
    const since = state.dwell?.since ?? state.clock;
    state.dwell ??= { unit: trigger.units[0] ?? -1, since };
    if (state.clock - state.dwell.since + EPS < weapon.windup) return;
    const survivors = trigger.units.some((id) => battle.units.some((u) => u.id === id && u.hp > 0));
    delete state.trigger;
    delete state.dwell;
    if (!survivors) return;
    castTowerSpell(ctx, tower, state, weapon, mode, c.x, c.y, battleTime(state.clock));
    return;
  }
  const candidates = eligible(battle, tower, weapon, battle.elapsed).sort(byDistance(c));
  let unit = candidates.find((u) => u.id === state.dwell?.unit);
  if (!unit) {
    unit = candidates[0];
    if (!unit) {
      delete state.dwell;
      return;
    }
    state.dwell = { unit: unit.id, since: state.clock };
  }
  if (state.clock - state.dwell!.since + EPS < weapon.windup) return;
  const at = battleTime(state.dwell!.since + weapon.windup);
  const self = flag(nativeRow('weapons', weapon.source, tower.level), 'SelfAsAoeCenter');
  castTowerSpell(ctx, tower, state, weapon, mode, self ? c.x : unit.x, self ? c.y : unit.y, at);
  delete state.dwell;
}
function castTowerSpell(
  ctx: NativeDefenseContext,
  tower: Building,
  state: NativeDefenseState,
  weapon: NativeWeapon,
  mode: SpellTowerMode,
  x: number,
  y: number,
  at: number,
) {
  const c = center(tower);
  state.loadedAt = state.clock + weapon.interval - weapon.windup;
  state.firedAt = at;
  launchProjectile(
    ctx.battle,
    {
      weapon: 'native',
      native: { name: weapon.projectile, kind: tower.kind, level: tower.level },
      defense: {
        hit: [],
        air: weapon.air,
        ground: weapon.ground,
        bounces: 0,
        bounceDistance: 0,
        bounceFactor: 1,
        spell: { name: spellTowerSpell(mode), level: 1 },
      },
      sourceId: tower.id,
      targetId: tower.id,
      targetBuilding: false,
      fromX: c.x,
      fromY: c.y,
      x,
      y,
      damage: 0,
    },
    ctx.effect,
    at,
  );
}

function destroyed(
  ctx: NativeDefenseContext,
  tower: Building,
  state: NativeDefenseState,
  at: number,
) {
  if (tower.constructing || tower.upgradeEnd) return;
  const weapon = weaponFor(tower);
  if (!weapon) return;
  if (tower.kind === 'spelltower' && (state.loadedAt ?? 0) <= state.clock + EPS) {
    const c = center(tower);
    const mode = (tower.spellMode ?? 'rage') as SpellTowerMode;
    castNativeSpell(ctx.battle, spellTowerSpell(mode), 1, 'defense', c.x, c.y, { at });
  }
  if (tower.kind === 'townhall' && weapon.death) state.deathAt = at + weapon.death.delay;
  delete state.queue;
  delete state.beams;
  delete state.targets;
}

/** Giga Tesla and Giga Inferno death bombs: damage in radius, then the frost or poison spell. */
function stepDeathBomb(ctx: NativeDefenseContext, tower: Building, state: NativeDefenseState) {
  if (state.deathAt === undefined || state.deathAt > ctx.battle.elapsed + EPS) return;
  const at = state.deathAt;
  delete state.deathAt;
  const weapon = weaponFor(tower);
  const death = weapon?.death;
  if (!death) return;
  const c = center(tower);
  for (const u of ctx.battle.units)
    if (
      liveTarget(u, at) &&
      !u.native?.burrowed &&
      distance2D(u.x - c.x, u.y - c.y) <= death.radius + EPS
    )
      hurtUnit(ctx.battle, u, death.damage * ctx.defenseScale, at);
  ctx.effect({ type: 'blast', x: c.x, y: c.y, radius: death.radius, color: 0xff5a2a, major: true });
  if (death.spell) castNativeSpell(ctx.battle, death.spell, 1, 'defense', c.x, c.y, { at });
}

/** Presentation and battle-end helpers. */
export const nativeDefensePending = (battle: Battle) =>
  !!battle.nativePiercing?.length ||
  Object.values(battle.nativeDefenses ?? {}).some(
    (state) => state.deathAt !== undefined || !!state.chains?.length,
  );
export { isNativeDefenseKind };
