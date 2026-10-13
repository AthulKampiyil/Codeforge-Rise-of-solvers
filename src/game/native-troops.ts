import { monolithArrow, stepEquipmentDash } from './native-equipment-effects';
import { isSiege } from './special-troops';
import { distance2D } from './distance';
import {
  BUILDINGS,
  TROOPS,
  isDefense,
  isResourceBuilding,
  isTrap,
  type BuildingKind,
  type TroopKind,
  type UnitKind,
} from './data';
import { EXTRA_TROOP_KINDS } from './extra-troops';
import { damageDefenders, stepAttackerVsDefenders } from './defenders';
import { MAP_SIZE } from './grid';
import { targetableBuilding } from './hidden-tesla';
import { flag, nativeRow, num, seconds as nativeSeconds, text, tiles } from './native-data';
import { castNativeSpell, stepNativeSpells, type NativeSpellContext } from './native-spells';
import {
  buildingEffects,
  healUnit,
  unitAttackIntervalScale,
  unitEffects,
  unitFrozen,
  type UnitEffects,
} from './native-status';
import { heroStatsFor } from './native-heroes';
import {
  isHeroUnitKind,
  isPetUnitKind,
  isSpawnKind,
  nativeUnitLevels,
  nativeUnitRow,
  nativeUnitStats,
  unitKindForName,
  type NativeUnitStats,
} from './native-units';
import { launchProjectile, type CombatProjectile } from './projectiles';
import { breachTarget, distanceTo, findPath, type Battle, type Building, type Unit } from './model';

/** Version 45+ native roster behavior state, created lazily on the unit. */
export interface NativeUnitState {
  effects?: UnitEffects;
  /** Hitpoints actually lost, for damage-triggered spawns. */
  damageTaken?: number;
  deploymentAbility?: boolean;
  lastDamageSource?: number;
  firingSince?: number;
  dash?: {
    dx: number;
    dy: number;
    remaining: number;
    speed: number;
    damage: number;
    radius: number;
    hit: number[];
  };
  /** Resolved attacks, for units with a declared attack count. */
  attacks?: number;
  /** Battle time the current building target was acquired. */
  targetAt?: number;
  /** Next scheduled periodic summon and lifetime summon count. */
  summonAt?: number;
  summoned?: number;
  /** Bunker spawns released so far. */
  released?: number;
  /** Damage-triggered spawns released so far. */
  damageSpawns?: number;
  /** Next hitpoint decay tick. */
  decayAt?: number;
  /** Aura cast bound to this unit. */
  aura?: number;
  /** Unit or building that created this unit. */
  owner?: number;
  /** Underground movers become targetable while attacking. */
  surfaced?: boolean;
  /** True while an underground unit travels below the village. */
  burrowed?: boolean;
  /** Client row declares TriggersTraps=FALSE. */
  noTraps?: boolean;
  /** Presentation cue for rage-when-alone style abilities. */
  alone?: boolean;
  /** Removed from the field by a Recall Spell and waiting in the deployment bar. */
  recalled?: boolean;
  /** Angry Spell: favors defenses until this time. */
  angryUntil?: number;
  /** Clone Spell copies vanish at this time without death effects. */
  cloneUntil?: number;
  /** Siege machines are immune to troop spells. */
  siege?: boolean;
  /** Units the client marks immune to healing (Totem). */
  noHealing?: boolean;
  /** Halves consumed by a merge resolve no death effects. */
  merged?: boolean;
  /** Last attack time; merging units only merge while not fighting. */
  lastAttackAt?: number;
  /** Battle time of the last lifetime drain sample (Furnace). */
  drainAt?: number;
  /** Ruin Witch rubble cycle: seek, vacuum, wind up and rest. */
  ruin?: { phase: 'seek' | 'vacuum' | 'windup' | 'rest'; until: number; rubble?: number };
}
/** A unit scheduled to appear later even if its creator is gone (Ruin Knight, thrown Meteormite). */
export interface NativePendingSpawn {
  at: number;
  kind: string;
  level: number;
  x: number;
  y: number;
  hp?: number;
  owner?: number;
}
export interface NativeDeathBlast {
  sourceId: number;
  x: number;
  y: number;
  at: number;
  damage: number;
  radius: number;
  air: boolean;
  resolved?: boolean;
}
export interface NativeChainHop {
  sourceId: number;
  at: number;
  x: number;
  y: number;
  damage: number;
  remaining: number;
  distance: number;
  reduction: number;
  delay: number;
  hit: number[];
}
export interface NativeTroopContext extends NativeSpellContext {
  /** Known targets: concealed Teslas and traps are already excluded. */
  buildings: Building[];
  /** Same list by id: replaces the per-unit linear find on retarget. */
  buildingsById: Map<number, Building>;
  /** Walls inside active Jump Spells: every ground route passes over them. */
  passableWalls: Set<number>;
  /**
   * Walls by tile for per-waypoint lookups; hp verified live at each hit.
   * Rebuilt with the context; cleared when the building list is reassigned.
   */
  wallTile?: Map<number, Building>;
  /**
   * Shared per-tick A* budget for large battles (same gate as the legacy loop).
   * Absent in small battles so historical hashes are untouched.
   */
  pathBudget?: { count: number; limit: number };
  /**
   * Per-tick building targetability (trap/concealment/hiding precomputed by the
   * model; hp checked live). Absent in hand-built contexts, which fall back to
   * the slow check.
   */
  isTargetable?: (b: Building) => boolean;
  /** Jump Spell rings for findPath; absent outside the stepped tick. */
  breaches?: readonly { x: number; y: number }[];
  /**
   * Buildings with Jump-opened walls removed, refreshed per tick like
   * `buildings`. Falls back to `buildings` when no ring is open.
   */
  routableBuildings?: Building[];
  nextId(): number;
  troopLevel(kind: TroopKind): number;
  /** Route lists shared by every search this tick (see routeBuildings). */
  routeCache?: { open: number; walker?: Building[]; jumper?: Building[] };
}

const NATIVE_TROOPS = new Set<string>(EXTRA_TROOP_KINDS);
/** Extra roster troops and every spawned unit follow the native rules from version 45. */
export const nativeBehavior = (battle: Battle, kind: UnitKind) =>
  !!battle.nativeRoster &&
  (NATIVE_TROOPS.has(kind) ||
    isSpawnKind(kind) ||
    ((isHeroUnitKind(kind) || isPetUnitKind(kind)) && !!battle.nativeHeroRoster));
export const unitLevel = (battle: Battle, u: Pick<Unit, 'kind' | 'level'>) =>
  u.level ?? battle.troopLevels?.[u.kind as TroopKind] ?? 1;
export function statsFor(battle: Battle, u: Pick<Unit, 'kind' | 'level' | 'id'>) {
  if (battle.nativeHeroes && u.id !== undefined) {
    const hero = battle.nativeHeroes.find((entry) => entry.unitId === u.id);
    if (hero) return heroStatsFor(hero, battle.townhall ?? 18);
  }
  return nativeUnitStats(u.kind, unitLevel(battle, u));
}

/** Client building names used by preferred-target columns. */
const BUILDING_NAME: Partial<Record<BuildingKind, string>> = {
  airdefense: 'Air Defense',
  townhall: 'Town Hall',
  wall: 'Wall',
};
const buildingName = (kind: BuildingKind) => BUILDING_NAME[kind] ?? BUILDINGS[kind].name;
const matchesPreferred = (s: NativeUnitStats, b: Building) =>
  s.preferredBuilding
    ? buildingName(b.kind) === s.preferredBuilding
    : s.preferredClass === 'Defense'
      ? isDefense(b.kind) && b.npc !== 'tutorial-cannon'
      : s.preferredClass === 'Resource'
        ? isResourceBuilding(b.kind)
        : s.preferredClass === 'Wall'
          ? b.kind === 'wall'
          : false;

/** Flags that other combat systems read directly from the unit. */
export function initialNativeState(kind: UnitKind, level: number, owner?: number): NativeUnitState {
  const s = nativeUnitStats(kind, level);
  return {
    ...(owner !== undefined ? { owner } : {}),
    ...(isSiege(kind) ? { siege: true } : {}),
    ...(s.immuneToHealing ? { noHealing: true } : {}),
    ...(s.underground ? { burrowed: true } : {}),
    ...(!s.triggersTraps ? { noTraps: true } : {}),
  };
}
/** Deterministic unit creation shared by death splits, summons and damage spawns. */
export function spawnNativeUnit(
  ctx: NativeTroopContext,
  kind: UnitKind,
  level: number,
  x: number,
  y: number,
  at: number,
  owner?: number,
) {
  const battle = ctx.battle;
  const count = nativeUnitLevels(kind);
  const s = nativeUnitStats(kind, Math.max(1, Math.min(count, level)));
  const spot = s.flying ? clampToMap(x, y) : openGround(ctx.buildings, x, y);
  const unit: Unit = {
    id: ctx.nextId(),
    kind,
    level: s.level,
    x: spot.x,
    y: spot.y,
    hp: s.hp,
    maxHp: s.hp,
    cooldown: 0,
    target: null,
    path: [],
    pathAt: 0,
    attacking: false,
    spawnedAt: at,
    native: initialNativeState(kind, s.level, owner),
  };
  // Units spawned by a Clone Spell copy inherit its expiry.
  const source = owner === undefined ? undefined : battle.units.find((u) => u.id === owner);
  if (source?.native?.cloneUntil !== undefined) unit.native!.cloneUntil = source.native.cloneUntil;
  battle.units.push(unit);
  ctx.effect({ type: 'spawn', x: unit.x, y: unit.y });
  return unit;
}
function clampToMap(x: number, y: number) {
  return {
    x: Math.max(0.5, Math.min(MAP_SIZE - 0.5, x)),
    y: Math.max(0.5, Math.min(MAP_SIZE - 0.5, y)),
  };
}
/** Ground units never appear inside a standing footprint; search outward one ring at a time. */
function openGround(buildings: Building[], x: number, y: number) {
  const solid = (px: number, py: number) =>
    buildings.some(
      (b) =>
        b.hp > 0 &&
        !isTrap(b.kind) &&
        b.kind !== 'wall' &&
        px >= b.x &&
        py >= b.y &&
        px < b.x + BUILDINGS[b.kind].size &&
        py < b.y + BUILDINGS[b.kind].size,
    );
  const start = clampToMap(x, y);
  if (!solid(start.x, start.y)) return start;
  for (let ring = 1; ring < 8; ring++)
    for (let i = 0; i < ring * 8; i++) {
      const angle = (i / (ring * 8)) * Math.PI * 2;
      const p = clampToMap(
        start.x + Math.cos(angle) * ring * 0.5,
        start.y + Math.sin(angle) * ring * 0.5,
      );
      if (!solid(p.x, p.y)) return p;
    }
  return start;
}
/** Positions evenly around a point; randomized rows use the battle seed and source id. */
function ringPoint(
  battle: Battle,
  source: Unit,
  index: number,
  count: number,
  distance: number,
  random: boolean,
) {
  const turn = random ? hash(battle.seed + source.id * 31, index) : index / Math.max(1, count);
  const reach = random
    ? distance * Math.sqrt(hash(battle.seed + source.id * 17, index + 101))
    : distance;
  const angle = turn * Math.PI * 2;
  return { x: source.x + Math.cos(angle) * reach, y: source.y + Math.sin(angle) * reach };
}
function hash(seed: number, index: number) {
  let v = (Math.imul(seed | 0, 0x27d4eb2d) ^ Math.imul(index + 1, 0x165667b1)) >>> 0;
  v = Math.imul(v ^ (v >>> 15), 0x85ebca6b) >>> 0;
  v = Math.imul(v ^ (v >>> 13), 0xc2b2ae35) >>> 0;
  return ((v ^ (v >>> 16)) >>> 0) / 0x100000000;
}

/** Choose the nearest eligible building, honoring the unit's native favorite target. */
function chooseTarget(ctx: NativeTroopContext, u: Unit, base: NativeUnitStats) {
  const battle = ctx.battle;
  const angry = (u.native?.angryUntil ?? 0) > battle.elapsed + 1e-9 && base.heal <= 0;
  const s = angry ? { ...base, preferredClass: 'Defense', preferredBuilding: '' } : base;
  if (
    isSiege(u.kind) &&
    text(nativeRow('characters', s.name, s.level), 'PreferredMovementTarget') === 'Town Hall'
  ) {
    const hall = ctx.buildings.find((b) => b.kind === 'townhall' && b.hp > 0);
    if (hall) return hall;
  }
  if (s.preferredClass === 'Wall') {
    const breach = breachTarget(u, ctx.buildings, !!ctx.battle.nativeSubtiles);
    if (breach) return breach;
  }
  const targetable = ctx.isTargetable ?? ((v: Building) => targetableBuilding(battle, v));
  // One pass over the known buildings keeps the nearest of three pools (same order and
  // tie-break as filtering each pool): the preferred match, then (for a named favorite such as
  // Air Defense) any defense, then any building.
  const wantPreferred = !!(s.preferredClass || s.preferredBuilding);
  const wantDefense = !!s.preferredBuilding;
  let best: Building | undefined,
    bestDistance = Infinity,
    favorite: Building | undefined,
    favoriteDistance = Infinity,
    defense: Building | undefined,
    defenseDistance = Infinity;
  for (const b of ctx.buildings) {
    if (b.kind === 'wall' || !targetable(b)) continue;
    const d = distanceTo(u, b);
    if (nearer(d, bestDistance, b, best)) {
      best = b;
      bestDistance = d;
    }
    if (wantPreferred && matchesPreferred(s, b) && nearer(d, favoriteDistance, b, favorite)) {
      favorite = b;
      favoriteDistance = d;
    }
    if (
      wantDefense &&
      isDefense(b.kind) &&
      b.npc !== 'tutorial-cannon' &&
      nearer(d, defenseDistance, b, defense)
    ) {
      defense = b;
      defenseDistance = d;
    }
  }
  return favorite ?? (wantDefense ? defense : undefined) ?? best;
}
const nearer = (d: number, distance: number, b: Building, best: Building | undefined) =>
  d < distance - 1e-9 || (Math.abs(d - distance) <= 1e-9 && !!best && b.id < best.id);

/** Group-following support units trail the nearest cluster of friendly housing. */
interface GroupWeights {
  tick: number;
  radius: number;
  /** Living units' positions and housing as they stood when the first follower asked. */
  x: Float64Array;
  y: Float64Array;
  space: Float64Array;
  /** Cell → indices into the snapshot arrays. */
  grid: Map<number, number[]>;
  /** Snapshot index per living unit id. */
  index: Map<number, number>;
  /** Cluster weight per unit id, measured on demand from the snapshot. */
  weights: Map<number, number>;
  anchors: Unit[];
}
const groupWeightCache = new WeakMap<Battle, GroupWeights>();
/** Numeric cell keys; units stay within a few tiles of the 48-tile map. */
const groupCell = (cx: number, cy: number) => (cx + 1024) * 4096 + (cy + 1024);
function groupAnchor(battle: Battle, u: Unit, s: NativeUnitStats) {
  // Snapshot the living units once per tick; weigh an anchor only when a follower in range
  // asks for it. Weights read the snapshot, so they equal what a full pass at that moment
  // would have measured no matter how many units have moved since.
  let cached = groupWeightCache.get(battle);
  // Keyed by radius too: every group follower shares one radius today, but a unit with its
  // own must not read weights measured with another's.
  if (!cached || cached.tick !== battle.elapsed || cached.radius !== s.groupRadius) {
    let living = 0;
    for (const other of battle.units) if (other.hp > 0) living++;
    cached = {
      tick: battle.elapsed,
      radius: s.groupRadius,
      x: new Float64Array(living),
      y: new Float64Array(living),
      space: new Float64Array(living),
      grid: new Map(),
      index: new Map(),
      weights: new Map(),
      anchors: [],
    };
    groupWeightCache.set(battle, cached);
    const cell = Math.max(1, s.groupRadius);
    let i = 0;
    for (const other of battle.units) {
      if (other.hp <= 0) continue;
      cached.x[i] = other.x;
      cached.y[i] = other.y;
      cached.space[i] = TROOPS[other.kind].space;
      cached.index.set(other.id, i);
      const key = groupCell(Math.floor(other.x / cell), Math.floor(other.y / cell));
      let list = cached.grid.get(key);
      if (!list) cached.grid.set(key, (list = []));
      list.push(i);
      // Anchor candidates in unit order: units that do not follow a group themselves. Units
      // missing from the snapshot (spawned later this tick) could never win a weight of 0.
      if (!nativeUnitStats(other.kind, unitLevel(battle, other)).groups) cached.anchors.push(other);
      i++;
    }
  }
  const snapshot = cached;
  const cell = Math.max(1, snapshot.radius);
  const weightOf = (ally: Unit) => {
    const known = snapshot.weights.get(ally.id);
    if (known !== undefined) return known;
    const at = snapshot.index.get(ally.id);
    if (at === undefined) return 0;
    // Housing within the radius, summed over the 3x3 cells around the ally (integers: the
    // sum is order-independent).
    let space = 0;
    const ax = snapshot.x[at],
      ay = snapshot.y[at];
    const cx = Math.floor(ax / cell),
      cy = Math.floor(ay / cell);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const list = snapshot.grid.get(groupCell(cx + dx, cy + dy));
        if (!list) continue;
        for (const other of list)
          if (distance2D(snapshot.x[other] - ax, snapshot.y[other] - ay) <= snapshot.radius)
            space += snapshot.space[other];
      }
    snapshot.weights.set(ally.id, space);
    return space;
  };
  let best: Unit | undefined,
    weight = 0;
  for (const ally of snapshot.anchors) {
    if (ally.id === u.id || ally.hp <= 0) continue;
    if (distance2D(ally.x - u.x, ally.y - u.y) > s.groupRange) continue;
    const space = weightOf(ally);
    if (space > weight) {
      weight = space;
      best = ally;
    }
  }
  return best;
}
/**
 * The route list a unit searches on: the known buildings minus the walls it may cross (all of
 * them for a jumper, Jump-opened ones for walkers). Shared per context (one tick), so every
 * search this tick reads one list and the collision grid recognizes it without a rescan.
 */
function routeBuildings(ctx: NativeTroopContext, jumping: boolean) {
  const cache = (ctx.routeCache ??= { open: -1 });
  if (cache.open !== ctx.passableWalls.size) {
    cache.open = ctx.passableWalls.size;
    cache.walker = cache.jumper = undefined;
  }
  if (jumping) return (cache.jumper ??= ctx.buildings.filter((b) => b.kind !== 'wall'));
  if (!ctx.passableWalls.size) return ctx.buildings;
  return (cache.walker ??= ctx.buildings.filter(
    (b) => b.kind !== 'wall' || !ctx.passableWalls.has(b.id),
  ));
}

export interface NativeStepStats {
  damage: number;
  speed: number;
  heal?: number;
}
/**
 * One simulation sample for a native-roster attacker. `boosted` carries the legacy Rage aura
 * multiplier already applied by the caller.
 */
export function stepNativeUnit(
  ctx: NativeTroopContext,
  u: Unit,
  boosted: NativeStepStats,
  dt: number,
) {
  const battle = ctx.battle;
  const s = statsFor(battle, u);
  const state = (u.native ??= {});
  const at = battle.elapsed;
  stepLifecycle(ctx, u, s, at);
  if (u.hp <= 0) return;
  if (unitFrozen(u, at)) {
    u.attacking = false;
    return;
  }
  if (stepEquipmentDash(ctx, u, dt)) return;
  if (s.ability === 'DisableAttacking') {
    u.attacking = false;
    return;
  }
  // The model already folded boosts, poison and chill into these values.
  const speed = boosted.speed;
  const damage = boosted.damage * aloneScale(battle, u, s, state);
  if (s.speed <= 0 && !s.summon && !s.bunker && s.range < 0.05) return;
  if (s.heal > 0 && s.dps <= 0 && !isSiege(u.kind)) {
    stepNativeHealer(ctx, u, s, boosted.heal ?? s.heal, speed, dt);
    return;
  }
  // Stationary spawners (Furnace) never attack; their timers already ran above.
  if (s.bunker) {
    u.attacking = false;
    return;
  }
  if (s.consumeDebris) {
    stepRuinWitch(ctx, u, s, speed, dt);
    return;
  }
  if (s.mergeTo && stepMerge(ctx, u, s, speed, dt)) return;
  if (
    stepAttackerVsDefenders(
      battle,
      u,
      { damage, speed, range: s.range, rate: s.rate * unitAttackIntervalScale(u, at) },
      dt,
      ctx.buildings,
      (target, power) => ctx.damageBuilding(target, power, battle.elapsed),
      ctx.effect,
      {
        prefersDefenses: s.preferredClass === 'Defense' || !!s.preferredBuilding || undefined,
        prefersResources: s.preferredClass === 'Resource' || undefined,
        wallBreaker: s.preferredClass === 'Wall' || undefined,
        healer: s.heal > 0 && s.dps <= 0,
        flying: s.flying || undefined,
        splash: s.splash || undefined,
        airTargets: s.airTargets,
      },
      ctx.isTargetable,
      {
        buildings: ctx.routableBuildings ?? ctx.buildings,
        wallTile: ctx.wallTile,
        passableWalls: ctx.passableWalls,
        budget: ctx.pathBudget,
        breaches: ctx.breaches,
      },
    )
  )
    return;
  let target = ctx.buildingsById.get(u.target ?? -1);
  const targetable = ctx.isTargetable ?? ((b: Building) => targetableBuilding(battle, b));
  if (!target || !targetable(target)) target = undefined;
  if (!target) {
    target = chooseTarget(ctx, u, s);
    if (!target) {
      u.attacking = false;
      return;
    }
    u.target = target.id;
    u.path = [];
    u.pathAt = 0;
    state.targetAt = at;
    if (s.underground) {
      state.surfaced = false;
      state.burrowed = true;
    }
  }
  if (s.groups) {
    const anchor = groupAnchor(battle, u, s);
    if (anchor && distanceTo(u, target) > s.range + 1e-9) {
      moveToward(
        u,
        anchor,
        Math.min(speed * dt, Math.max(0, distance2D(anchor.x - u.x, anchor.y - u.y) - 1)),
      );
      return;
    }
  }
  const distance = distanceTo(u, target);
  if (
    (u.kind === 'battleblimp' || u.kind === 'loglauncher') &&
    distance > s.range &&
    u.cooldown <= 0
  ) {
    let passing: Building | undefined = target;
    if (u.kind === 'battleblimp') {
      // Nearest standing structure in range, lowest id on a tie: the first of the old sort.
      passing = undefined;
      let best = Infinity;
      for (const b of ctx.buildings) {
        if (b.hp <= 0 || isTrap(b.kind)) continue;
        const d = distanceTo(u, b);
        if (d > s.range) continue;
        if (d < best || (d === best && b.id < passing!.id)) {
          best = d;
          passing = b;
        }
      }
    }
    if (passing) {
      u.cooldown = s.rate;
      strike(ctx, u, s, passing, damage);
    }
  }
  if (distance <= s.range + 1e-6) {
    u.attacking = true;
    if (s.underground) {
      if (!state.surfaced && u.kind === 'battledrill') {
        const row = nativeRow('abilities', 'BattleDrillStunOnSurface');
        castNativeSpell(
          battle,
          text(row, 'SelfSpell'),
          num(row, 'SelfSpellLevel', 1),
          'attack',
          u.x,
          u.y,
          { at, owner: u.id },
        );
      }
      state.surfaced = true;
      state.burrowed = false;
    }
    if (at + 1e-9 < (state.targetAt ?? 0) + s.newTargetDelay) return;
    if (u.cooldown > 0) return;
    u.cooldown = s.rate * unitAttackIntervalScale(u, at);
    const row = nativeUnitRow(u.kind, s.level);
    state.firingSince ??= at;
    const firing = at - state.firingSince;
    const stage = flag(row, 'IncreasingDamage')
      ? firing >= nativeSeconds(row, 'Lv3SwitchTime')
        ? 'DPSLv3'
        : firing >= nativeSeconds(row, 'Lv2SwitchTime')
          ? 'DPSLv2'
          : 'DPS'
      : 'DPS';
    strike(
      ctx,
      u,
      s,
      target,
      flag(row, 'IncreasingDamage') && s.dps > 0
        ? (damage * num(row, stage, s.dps)) / s.dps
        : damage,
    );
    return;
  }
  u.attacking = false;
  delete state.firingSince;
  if (s.speed <= 0) return;
  const edge = {
    x: Math.max(target.x, Math.min(u.x, target.x + BUILDINGS[target.kind].size)),
    y: Math.max(target.y, Math.min(u.y, target.y + BUILDINGS[target.kind].size)),
  };
  if (s.flying || s.underground) {
    moveToward(u, edge, Math.min(speed * dt, distance2D(edge.x - u.x, edge.y - u.y)));
    return;
  }
  const jumping = s.jumper;
  if (!u.path.length || u.pathAt <= 0) {
    // Large-battle A* budget shared with the legacy loop; defer overflow a tick.
    if (ctx.pathBudget && ctx.pathBudget.count >= ctx.pathBudget.limit) {
      u.pathAt = Math.min(Math.max(u.pathAt, 0.05), 0.15);
    } else {
      if (ctx.pathBudget) ctx.pathBudget.count++;
      u.path = findPath(
        u,
        target,
        routeBuildings(ctx, jumping),
        s.range,
        !!ctx.battle.nativeSubtiles,
      );
      u.pathAt = 1.5;
    }
  }
  const next = u.path[0];
  if (!next) return;
  if (!jumping) {
    // Index-only: a miss means no wall on that tile, which is nearly every waypoint.
    // The linear scan survives only for contexts built without the index (tests).
    const hit =
      ctx.wallTile?.get(Math.floor(next.y) * MAP_SIZE + Math.floor(next.x)) ??
      (ctx.wallTile
        ? undefined
        : battle.buildings.find(
            (v) =>
              v.kind === 'wall' &&
              v.hp > 0 &&
              !ctx.passableWalls.has(v.id) &&
              Math.floor(next.x) === v.x &&
              Math.floor(next.y) === v.y,
          ));
    const wall = hit && hit.hp > 0 && !ctx.passableWalls.has(hit.id) ? hit : undefined;
    if (wall && distanceTo(u, wall) <= s.range + 1e-6) {
      u.attacking = true;
      if (u.cooldown <= 0) {
        u.cooldown = s.rate * unitAttackIntervalScale(u, at);
        strike(ctx, u, s, wall, damage);
      }
      return;
    }
  }
  let travel = speed * dt;
  while (u.path.length && travel > 0) {
    const p = u.path[0],
      len = distance2D(p.x - u.x, p.y - u.y);
    if (len <= travel) {
      u.x = p.x;
      u.y = p.y;
      u.path.shift();
      travel -= len;
    } else {
      moveToward(u, p, travel);
      travel = 0;
    }
  }
}
function moveToward(u: Unit, point: { x: number; y: number }, travel: number) {
  const dx = point.x - u.x,
    dy = point.y - u.y,
    len = distance2D(dx, dy);
  if (len <= 1e-9 || travel <= 0) return;
  const step = Math.min(travel, len);
  u.x += (dx / len) * step;
  u.y += (dy / len) * step;
}

/** `ActiveWhileAloneRadius` per ability row: read per unit per tick, so memoized. */
const aloneRadii = new Map<string, Map<number, number>>();
function aloneRadius(ability: string, level: number) {
  let byLevel = aloneRadii.get(ability);
  if (!byLevel) aloneRadii.set(ability, (byLevel = new Map()));
  let radius = byLevel.get(level);
  if (radius === undefined) {
    radius = tiles(nativeRow('abilities', ability, level), 'ActiveWhileAloneRadius');
    byLevel.set(level, radius);
  }
  return radius;
}
/** Abilities active while no other friendly unit is nearby (Baby Dragon). */
function aloneScale(battle: Battle, u: Unit, s: NativeUnitStats, state: NativeUnitState) {
  // Version 53 hero passives feed the shared damage and attack-interval scales.
  // Keep the original path for Baby Dragons and historical recordings.
  if (battle.nativeHeroPassives && u.hero) return 1;
  if (!s.ability) return 1;
  const radius = aloneRadius(s.ability, s.abilityLevel);
  if (radius <= 0) return 1;
  const alone = !battle.units.some(
    (other) =>
      other.id !== u.id &&
      other.hp > 0 &&
      !other.ejected &&
      (other.spawnedAt ?? 0) <= battle.elapsed + 1e-9 &&
      !!TROOPS[other.kind].flying === s.flying &&
      distance2D(other.x - u.x, other.y - u.y) <= radius,
  );
  state.alone = alone;
  if (!alone) return 1;
  const row = nativeRow('abilities', s.ability, s.abilityLevel);
  const attackBoost = num(row, 'BoostAttackSpeedPercentage') / 100;
  // Attack speed shortens the interval; damage per hit rises separately.
  if (attackBoost && u.cooldown > s.rate / (1 + attackBoost))
    u.cooldown = s.rate / (1 + attackBoost);
  return 1 + num(row, 'BoostDamagePercentage') / 100;
}

function damageMultiplier(s: NativeUnitStats, b: Building) {
  let scale = matchesPreferred(s, b) ? s.preferredMultiplier : 1;
  if (s.damageMultiplierTarget && buildingName(b.kind) === s.damageMultiplierTarget)
    scale *= s.damageMultiplier;
  if (s.storageReduction && isResourceBuilding(b.kind)) scale *= 1 - s.storageReduction;
  return scale;
}

/** Resolve one attack against a building according to the unit's native attack shape. */
function strike(
  ctx: NativeTroopContext,
  u: Unit,
  s: NativeUnitStats,
  target: Building,
  damage: number,
) {
  const battle = ctx.battle;
  const state = (u.native ??= {});
  const arrow = monolithArrow(ctx, u);
  if (arrow) {
    s = { ...s, projectile: text(arrow, 'Projectile') };
    damage += (target.maxHp * num(arrow, 'DamagePermilHp')) / 1000;
  }
  const center = {
    x: target.x + BUILDINGS[target.kind].size / 2,
    y: target.y + BUILDINGS[target.kind].size / 2,
  };
  if (s.selfAreaCenter || s.multipleBuildings) {
    const radius = Math.max(s.splash, s.range);
    for (const b of battle.buildings)
      if (
        b.hp > 0 &&
        !isTrap(b.kind) &&
        targetableBuilding(battle, b) &&
        distanceTo(u, b) <= radius + 1e-9
      )
        ctx.damageBuilding(b, damage * damageMultiplier(s, b), battle.elapsed);
    damageDefenders(battle, u, damage, radius, 'ground');
    ctx.effect({ type: 'blast', x: u.x, y: u.y, radius, sourceId: u.id });
  } else if (s.projectile && s.range >= 1) {
    launchProjectile(
      battle,
      {
        weapon: 'native',
        native: { name: s.projectile, kind: u.kind, level: s.level },
        sourceId: u.id,
        targetId: target.id,
        targetBuilding: true,
        fromX: u.x,
        fromY: u.y,
        x: center.x,
        y: center.y,
        fromAir: s.flying,
        damage,
        splash: s.splash || undefined,
      },
      ctx.effect,
    );
  } else if (s.chainDepth > 0) {
    zapChain(ctx, u, s, target, damage);
  } else {
    ctx.damageBuilding(target, damage * damageMultiplier(s, target), battle.elapsed);
    if (s.splash)
      for (const b of battle.buildings)
        if (b.id !== target.id && b.hp > 0 && !isTrap(b.kind) && distanceTo(center, b) <= s.splash)
          ctx.damageBuilding(b, damage * damageMultiplier(s, b), battle.elapsed);
    applyFrost(battle, s, target);
    ctx.effect({
      type: 'hit',
      x: u.x,
      y: u.y,
      toX: center.x,
      toY: center.y,
      sourceId: u.id,
      targetId: target.id,
      targetBuilding: true,
    });
  }
  state.lastAttackAt = battle.elapsed;
  state.attacks = (state.attacks ?? 0) + 1;
  // A throwing golem's single attack ends in a split rather than its own defeat.
  if (s.secondaryOnAttack && s.secondary) {
    splitOnThrow(ctx, u, s, center);
    return;
  }
  if (s.attackCount > 0 && state.attacks >= s.attackCount) {
    u.hp = 0;
    u.spent = true;
    u.defeatedAt = battle.elapsed;
  }
}
/**
 * Meteor Golem: one Meteormite is hurled at the target and the other stays. Each starts with half of
 * the golem's health, rounded down to a 1% step of Meteormite health; below that only the thrown one
 * (1 HP) appears where it lands.
 */
function splitOnThrow(
  ctx: NativeTroopContext,
  u: Unit,
  s: NativeUnitStats,
  landing: { x: number; y: number },
) {
  const battle = ctx.battle;
  const kind = unitKindForName(s.secondary) as UnitKind | undefined;
  if (!kind || u.native?.cloneUntil !== undefined) return;
  const mite = nativeUnitStats(kind, s.level);
  const step = mite.hp / 100;
  const half = Math.floor(u.hp / 2 / step) * step;
  const travel = distance2D(landing.x - u.x, landing.y - u.y);
  const flight =
    travel / Math.max(0.5, num(nativeRow('projectiles', s.projectile), 'Speed', 800) / 100);
  (battle.nativePendingSpawns ??= []).push({
    at: battle.elapsed + flight,
    kind,
    level: mite.level,
    x: landing.x,
    y: landing.y,
    hp: half >= step ? half : 1,
  });
  if (half < step) {
    u.hp = 0;
    u.spent = true;
    u.defeatedAt = battle.elapsed;
    return;
  }
  u.kind = kind;
  u.level = mite.level;
  u.maxHp = mite.hp;
  u.hp = half;
  u.target = null;
  u.path = [];
  u.pathAt = 0;
  u.cooldown = mite.rate;
  const state = (u.native ??= {});
  state.lastAttackAt = battle.elapsed;
  state.attacks = 0;
}
/** Two idle Meteormites within reach walk together and merge into a briefly invulnerable golem. */
function stepMerge(
  ctx: NativeTroopContext,
  u: Unit,
  s: NativeUnitStats,
  speed: number,
  dt: number,
) {
  const battle = ctx.battle;
  const state = u.native!;
  if (state.cloneUntil !== undefined || !s.mergeTo) return false;
  const idle = (m: Unit) => battle.elapsed - (m.native?.lastAttackAt ?? -Infinity) > 2;
  if (!idle(u)) return false;
  let partner: Unit | undefined,
    best = Infinity;
  for (const other of battle.units) {
    if (
      other.id === u.id ||
      other.kind !== u.kind ||
      other.hp <= 0 ||
      other.native?.recalled ||
      other.native?.cloneUntil !== undefined ||
      (other.spawnedAt ?? 0) > battle.elapsed + 1e-9 ||
      !idle(other)
    )
      continue;
    const d = distance2D(other.x - u.x, other.y - u.y);
    if (
      d <= s.mergeRadius + 1e-9 &&
      (d < best - 1e-9 || (Math.abs(d - best) <= 1e-9 && partner && other.id < partner.id))
    ) {
      best = d;
      partner = other;
    }
  }
  if (!partner) return false;
  if (best > 0.5) {
    u.attacking = false;
    moveToward(u, partner, Math.min(speed * dt, best / 2));
    return true;
  }
  // The lower identifier completes the merge once, so both halves never resolve it twice.
  if (u.id > partner.id) return true;
  const golemKind = unitKindForName(s.mergeTo) as UnitKind | undefined;
  if (!golemKind) return false;
  const golem = nativeUnitStats(golemKind, s.level);
  const step = golem.hp / 200;
  const hp = Math.max(1, Math.floor((u.hp + partner.hp) / step) * step);
  for (const half of [u, partner]) {
    half.hp = 0;
    half.spent = true;
    half.defeatedAt = battle.elapsed;
    (half.native ??= {}).merged = true;
  }
  const merged = spawnNativeUnit(
    ctx,
    golemKind,
    s.level,
    (u.x + partner.x) / 2,
    (u.y + partner.y) / 2,
    battle.elapsed,
  );
  merged.hp = Math.min(merged.maxHp, hp);
  unitEffects(merged).immortalUntil = battle.elapsed + MERGE_INVULNERABLE_SECONDS;
  return true;
}
/** The wiki describes the merged golem as briefly invulnerable; the client row names no duration. */
const MERGE_INVULNERABLE_SECONDS = 1;

function applyFrost(battle: Battle, s: NativeUnitStats, target: Building) {
  if (!s.frostTime) return;
  const e = buildingEffects(battle, target);
  e.frost = { until: battle.elapsed + s.frostTime, percent: s.frostPercent };
}

/** Chain lightning: primary hit now, each hop after the native delay with reduced damage. */
function zapChain(
  ctx: NativeTroopContext,
  u: Unit,
  s: NativeUnitStats,
  target: Building,
  damage: number,
) {
  const battle = ctx.battle;
  ctx.damageBuilding(target, damage, battle.elapsed);
  const center = {
    x: target.x + BUILDINGS[target.kind].size / 2,
    y: target.y + BUILDINGS[target.kind].size / 2,
  };
  ctx.effect({
    type: 'tesla-zap',
    sourceId: u.id,
    targetId: target.id,
    x: u.x,
    y: u.y,
    toX: center.x,
    toY: center.y,
    fromAir: s.flying,
  });
  if (s.chainDepth > 1)
    (battle.nativeChains ??= []).push({
      sourceId: u.id,
      at: battle.elapsed + s.chainDelay,
      x: center.x,
      y: center.y,
      damage: damage * (1 - s.chainReduction),
      remaining: s.chainDepth - 1,
      distance: s.chainDistance,
      reduction: s.chainReduction,
      delay: s.chainDelay,
      hit: [target.id],
    });
}
export function stepNativeChains(ctx: NativeTroopContext) {
  const battle = ctx.battle;
  const pending: NativeChainHop[] = [];
  for (const hop of battle.nativeChains ?? []) {
    if (hop.at > battle.elapsed + 1e-9) {
      pending.push(hop);
      continue;
    }
    let next: Building | undefined,
      best = Infinity;
    for (const b of battle.buildings) {
      if (
        b.hp <= 0 ||
        isTrap(b.kind) ||
        b.kind === 'wall' ||
        hop.hit.includes(b.id) ||
        !targetableBuilding(battle, b)
      )
        continue;
      const d = distanceTo(hop, b);
      if (
        d <= hop.distance + 1e-9 &&
        (d < best - 1e-9 || (Math.abs(d - best) <= 1e-9 && next && b.id < next.id))
      ) {
        best = d;
        next = b;
      }
    }
    if (!next) continue;
    ctx.damageBuilding(next, hop.damage, hop.at);
    const center = {
      x: next.x + BUILDINGS[next.kind].size / 2,
      y: next.y + BUILDINGS[next.kind].size / 2,
    };
    ctx.effect({
      type: 'tesla-zap',
      sourceId: hop.sourceId,
      targetId: next.id,
      x: hop.x,
      y: hop.y,
      toX: center.x,
      toY: center.y,
    });
    if (hop.remaining > 1)
      pending.push({
        ...hop,
        at: hop.at + hop.delay,
        x: center.x,
        y: center.y,
        damage: hop.damage * (1 - hop.reduction),
        remaining: hop.remaining - 1,
        hit: [...hop.hit, next.id],
      });
  }
  battle.nativeChains = pending;
}

/** Native projectile arrival: damage, splash, bounces and on-hit spells. */
export function resolveNativeImpact(ctx: NativeTroopContext, p: CombatProjectile) {
  const battle = ctx.battle;
  const source = p.native!;
  const s = nativeUnitStats(source.kind, source.level);
  const target = p.targetBuilding ? battle.buildings.find((b) => b.id === p.targetId) : undefined;
  if (target && target.hp > 0) {
    ctx.damageBuilding(target, p.damage * damageMultiplier(s, target), p.impact);
    applyFrost(battle, s, target);
  }
  if (p.splash)
    for (const b of battle.buildings)
      if (b.id !== p.targetId && b.hp > 0 && !isTrap(b.kind) && distanceTo(p, b) <= p.splash)
        ctx.damageBuilding(b, p.damage * damageMultiplier(s, b), p.impact);
  if (p.splash) damageDefenders(battle, p, p.damage, p.splash, 'ground');
  const projectile = nativeRow('projectiles', source.name);
  const hitSpell = text(projectile, 'HitSpell');
  if (hitSpell)
    castNativeSpell(
      battle,
      hitSpell,
      num(projectile, 'HitSpellLevel', 1) || 1,
      'attack',
      p.x,
      p.y,
      { at: p.impact, immediate: true },
    );
  const row = nativeRow(
    isHeroUnitKind(source.kind) ? 'heroes' : isPetUnitKind(source.kind) ? 'pets' : 'characters',
    s.name,
    s.level,
  );
  if (battle.nativeContentExpansion && flag(row, 'PenetratingProjectile')) {
    const dx = p.x - p.fromX,
      dy = p.y - p.fromY,
      length = Math.hypot(dx, dy) || 1;
    const reach = length + tiles(row, 'PenetratingExtraRange'),
      radius = tiles(row, 'PenetratingRadius');
    for (const b of battle.buildings) {
      if (b.id === p.targetId || b.hp <= 0 || isTrap(b.kind)) continue;
      const bx = b.x + BUILDINGS[b.kind].size / 2 - p.fromX,
        by = b.y + BUILDINGS[b.kind].size / 2 - p.fromY;
      const along = (bx * dx + by * dy) / length;
      const across = Math.abs(bx * dy - by * dx) / length;
      if (along >= 0 && along <= reach && across <= radius + BUILDINGS[b.kind].size / 2)
        ctx.damageBuilding(b, p.damage * damageMultiplier(s, b), p.impact);
    }
  }
  const bounced = source.bounce ?? 0;
  if (s.bounces > 1 && bounced + 1 < s.bounces && s.bounceDistance > 0) {
    const dx = p.x - p.fromX,
      dy = p.y - p.fromY,
      len = distance2D(dx, dy) || 1;
    const x = p.x + (dx / len) * s.bounceDistance,
      y = p.y + (dy / len) * s.bounceDistance;
    let next: Building | undefined,
      best = Infinity;
    for (const b of battle.buildings) {
      if (b.hp <= 0 || isTrap(b.kind) || b.id === p.targetId || !targetableBuilding(battle, b))
        continue;
      const d = distanceTo({ x, y }, b);
      if (d <= Math.max(0.5, s.splash) + 1e-9 && d < best) {
        best = d;
        next = b;
      }
    }
    launchProjectile(
      battle,
      {
        weapon: 'native',
        native: { ...source, bounce: bounced + 1 },
        sourceId: p.sourceId,
        targetId: next?.id ?? p.targetId,
        targetBuilding: !!next,
        fromX: p.x,
        fromY: p.y,
        x,
        y,
        damage: p.damage,
        splash: Math.max(0.5, s.splash),
      },
      ctx.effect,
      p.impact,
    );
  }
}

/** Timers that run even while the unit is frozen. */
function stepLifecycle(ctx: NativeTroopContext, u: Unit, s: NativeUnitStats, at: number) {
  const battle = ctx.battle;
  const state = (u.native ??= {});
  if (!state.deploymentAbility && isSiege(u.kind) === false && s.superLicence) {
    state.deploymentAbility = true;
    for (const ability of s.abilities) {
      const row = nativeRow('abilities', ability.name, ability.level);
      const duration = nativeSeconds(row, 'DeactivateAfterTime');
      if (duration <= 0 || num(row, 'ActiveWhileAloneRadius') > 0) continue;
      const effects = unitEffects(u),
        until = (u.spawnedAt ?? at) + duration;
      if (flag(row, 'IsInvisible')) effects.invisibleUntil = until;
      if (num(row, 'SpeedBoost') || num(row, 'BoostDamagePercentage'))
        effects.boost = {
          until,
          speed: num(row, 'SpeedBoost') / 100,
          damage: num(row, 'BoostDamagePercentage') / 100,
          attackSpeed: 0,
        };
    }
  }
  if (s.aura && state.aura === undefined) {
    const cast = castNativeSpell(battle, s.aura, s.auraLevel, 'attack', u.x, u.y, {
      at,
      follow: u.id,
      owner: u.id,
      immediate: true,
    });
    state.aura = cast.id;
  }
  if (s.loseHp > 0 && s.loseHpInterval > 0) {
    state.decayAt ??= (u.spawnedAt ?? at) + s.loseHpInterval;
    while (state.decayAt <= at + 1e-9 && u.hp > 0) {
      u.hp -= s.loseHp;
      state.decayAt += s.loseHpInterval;
    }
  }
  if (s.summon && s.summonCooldown > 0 && !s.consumeDebris) stepSummons(ctx, u, s, at);
  if (s.bunker && s.bunkerCount > 0) stepBunker(ctx, u, s, at);
  if (s.evolveTo && s.evolveTime > 0 && at + 1e-9 >= (u.spawnedAt ?? 0) + s.evolveTime && u.hp > 0)
    evolve(ctx, u, s);
  if (s.spawnWhenDamaged > 0 && s.ability) stepDamageSpawns(ctx, u, s, at, false);
}

function stepSummons(ctx: NativeTroopContext, u: Unit, s: NativeUnitStats, at: number) {
  const battle = ctx.battle;
  const state = u.native!;
  state.summonAt ??= (u.spawnedAt ?? at) + s.summonDelay;
  const kind = unitKindForName(s.summon) as UnitKind | undefined;
  if (!kind) return;
  while (state.summonAt <= at + 1e-9 && u.hp > 0) {
    const alive = battle.units.filter((m) => m.hp > 0 && m.native?.owner === u.id).length;
    const lifetime = state.summoned ?? 0;
    if (s.summonLifetimeLimit > 0 && lifetime >= s.summonLifetimeLimit) {
      if (s.diesWhenSpawnLimitReached) {
        u.hp = 0;
        u.defeatedAt = at;
      }
      return;
    }
    const room = Math.max(0, (s.summonLimit || Infinity) - alive);
    const count = Math.min(s.summonCount || 1, room);
    for (let i = 0; i < count; i++) {
      const p = ringPoint(battle, u, lifetime + i, count, s.secondaryDistance || 1, false);
      spawnNativeUnit(ctx, kind, s.summonLevel, p.x, p.y, state.summonAt + s.summonTime, u.id);
    }
    state.summoned = lifetime + count;
    state.summonAt += s.summonCooldown + s.summonTime;
  }
}

/**
 * Furnace: hitpoints drain at a fixed rate over its 60 s lifetime and Firemites leave on a fixed
 * schedule. The wiki says an untouched Furnace releases every Firemite with a little under 10% of
 * its health left; releasing at (index + 1) / (count + 2) of the lifetime reproduces that.
 */
function stepBunker(ctx: NativeTroopContext, u: Unit, s: NativeUnitStats, at: number) {
  const state = u.native!;
  const kind = unitKindForName(s.bunker) as UnitKind | undefined;
  if (!kind || s.bunkerDecay <= 0) return;
  const start = u.spawnedAt ?? 0;
  if (u.kind === 'siegebarracks') {
    const row = nativeRow('characters', s.name, s.level);
    const first = num(row, 'BunkerTroopCount1'),
      second = num(row, 'BunkerTroopCount2');
    const total = first + second;
    while ((state.released ?? 0) < total && u.hp > 0) {
      const index = state.released ?? 0;
      const due =
        start +
        nativeSeconds(row, 'SpawnIdle') +
        (index < first
          ? 0
          : ((index - first + 1) * Math.max(0, s.bunkerDecay - nativeSeconds(row, 'SpawnIdle'))) /
            (second + 1));
      if (due > at + 1e-9) break;
      const spawnedKind = index < first ? kind : 'wizard';
      spawnNativeUnit(
        ctx,
        spawnedKind,
        ctx.troopLevel(spawnedKind as TroopKind),
        u.x + 0.5,
        u.y + 0.5,
        due,
        u.id,
      );
      state.released = index + 1;
    }
    const from = Math.max(start, state.drainAt ?? start);
    if (at > from) u.hp -= (u.maxHp * (at - from)) / s.bunkerDecay;
    state.drainAt = at;
    return;
  }
  const interval = s.bunkerDecay / (s.bunkerCount + 2);
  while ((state.released ?? 0) < s.bunkerCount && u.hp > 0) {
    const index = state.released ?? 0;
    const due = start + (index + 1) * interval;
    if (due > at + 1e-9) break;
    const p = ringPoint(ctx.battle, u, index, 6, s.bunkerDistance || 1, false);
    spawnNativeUnit(ctx, kind, s.level, p.x, p.y, due, u.id);
    state.released = index + 1;
  }
  const from = Math.max(start, state.drainAt ?? start);
  if (at > from) {
    u.hp -= (u.maxHp * (at - from)) / s.bunkerDecay;
    state.drainAt = at;
  }
  if (u.hp <= 0) u.defeatedAt ??= at;
}

/** Ruin Witch: waits for rubble, vacuums it, winds up and summons one Ruin Knight per pile. */
function stepRuinWitch(
  ctx: NativeTroopContext,
  u: Unit,
  s: NativeUnitStats,
  speed: number,
  dt: number,
) {
  const battle = ctx.battle;
  const state = u.native!;
  const at = battle.elapsed;
  const ruin = (state.ruin ??= { phase: 'seek', until: 0 });
  u.attacking = false;
  if (ruin.phase !== 'seek' && at + 1e-9 < ruin.until) {
    u.attacking = ruin.phase !== 'rest';
    return;
  }
  if (ruin.phase === 'vacuum') {
    ruin.phase = 'windup';
    ruin.until = at + s.summonDelay;
    const kind = unitKindForName(s.summon);
    const pile = battle.buildings.find((b) => b.id === ruin.rubble);
    if (kind && pile) {
      const cx = pile.x + BUILDINGS[pile.kind].size / 2,
        cy = pile.y + BUILDINGS[pile.kind].size / 2;
      const len = distance2D(cx - u.x, cy - u.y) || 1;
      // Once the debris is cleared the knight appears even if the witch falls during the wind-up.
      (battle.nativePendingSpawns ??= []).push({
        at: ruin.until,
        kind,
        level: s.summonLevel,
        x: u.x + ((cx - u.x) / len) * Math.min(0.8, len),
        y: u.y + ((cy - u.y) / len) * Math.min(0.8, len),
        owner: u.id,
      });
      state.summoned = (state.summoned ?? 0) + 1;
    }
    u.attacking = true;
    return;
  }
  if (ruin.phase === 'windup') {
    const limit = s.summonLifetimeLimit || s.summonLimit;
    if (limit > 0 && (state.summoned ?? 0) >= limit && s.diesWhenSpawnLimitReached) {
      u.hp = 0;
      u.defeatedAt = at;
      return;
    }
    ruin.phase = 'rest';
    ruin.until = at + s.summonCooldown;
    return;
  }
  ruin.phase = 'seek';
  const consumed = (battle.consumedRubble ??= []);
  let pile = battle.buildings.find((b) => b.id === ruin.rubble && !consumed.includes(b.id));
  if (!pile) {
    const eaten = new Set(consumed);
    let best = Infinity;
    for (const b of battle.buildings) {
      if (b.hp > 0 || b.kind === 'wall' || isTrap(b.kind) || eaten.has(b.id)) continue;
      const d = distanceTo(u, b);
      if (d < best - 1e-9 || (Math.abs(d - best) <= 1e-9 && pile && b.id < pile.id)) {
        best = d;
        pile = b;
      }
    }
    ruin.rubble = pile?.id;
    u.path = [];
    u.pathAt = 0;
  }
  if (!pile) return;
  if (distanceTo(u, pile) <= 1 + 1e-6) {
    consumed.push(pile.id);
    ruin.phase = 'vacuum';
    ruin.until =
      at + nativeSeconds(nativeRow('characters', s.name, s.level), 'DebrisSummonCompletionTime');
    u.attacking = true;
    return;
  }
  if (!u.path.length || u.pathAt <= 0) {
    u.path = findPath(
      u,
      { x: pile.x, y: pile.y, level: pile.level, kind: pile.kind } as Building,
      ctx.buildings.filter((b) => b.hp > 0),
      1,
      !!ctx.battle.nativeSubtiles,
    );
    u.pathAt = 1.5;
  }
  let travel = speed * dt;
  while (u.path.length && travel > 0) {
    const p = u.path[0],
      len = distance2D(p.x - u.x, p.y - u.y);
    if (len <= travel) {
      u.x = p.x;
      u.y = p.y;
      u.path.shift();
      travel -= len;
    } else {
      moveToward(u, p, travel);
      travel = 0;
    }
  }
}

/** Scheduled arrivals that no longer depend on their creator being alive. */
function stepPendingSpawns(ctx: NativeTroopContext) {
  const battle = ctx.battle;
  if (!battle.nativePendingSpawns?.length) return;
  const due = battle.nativePendingSpawns.filter((spawn) => spawn.at <= battle.elapsed + 1e-9);
  if (!due.length) return;
  battle.nativePendingSpawns = battle.nativePendingSpawns.filter(
    (spawn) => spawn.at > battle.elapsed + 1e-9,
  );
  for (const spawn of due) {
    const unit = spawnNativeUnit(
      ctx,
      spawn.kind as UnitKind,
      spawn.level,
      spawn.x,
      spawn.y,
      spawn.at,
      spawn.owner,
    );
    if (spawn.hp !== undefined) unit.hp = Math.min(unit.maxHp, spawn.hp);
  }
}

function evolve(ctx: NativeTroopContext, u: Unit, s: NativeUnitStats) {
  const kind = unitKindForName(s.evolveTo) as UnitKind | undefined;
  if (!kind) return;
  const fraction = u.maxHp > 0 ? u.hp / u.maxHp : 1;
  const next = nativeUnitStats(kind, s.level);
  u.kind = kind;
  u.level = next.level;
  u.maxHp = next.hp;
  u.hp = Math.max(1, next.hp * fraction);
  u.cooldown = 0;
  u.target = null;
  u.path = [];
  u.pathAt = 0;
  delete u.native!.aura;
  ctx.effect({ type: 'spawn', x: u.x, y: u.y });
}

function stepDamageSpawns(
  ctx: NativeTroopContext,
  u: Unit,
  s: NativeUnitStats,
  at: number,
  death: boolean,
) {
  const row = nativeRow('abilities', s.ability, s.abilityLevel);
  const kind = unitKindForName(text(row, 'SpawnedTroop')) as UnitKind | undefined;
  const total = num(row, 'TroopCount');
  if (!kind || total <= 0) return;
  const state = u.native!;
  const perDamage = num(row, 'SpawnnedTroopsPerDamage') || s.spawnWhenDamaged;
  const due = death
    ? flag(row, 'SpawnRemainingTroopsOnDeath')
      ? total
      : (state.damageSpawns ?? 0)
    : Math.min(total, Math.floor((state.damageTaken ?? 0) / Math.max(1, perDamage)));
  const level = num(row, 'TroopLevel', 1) || 1;
  while ((state.damageSpawns ?? 0) < due) {
    const index = state.damageSpawns ?? 0;
    const p = ringPoint(ctx.battle, u, index, total, s.secondaryDistance || 1, true);
    spawnNativeUnit(ctx, kind, level, p.x, p.y, at, u.id);
    state.damageSpawns = index + 1;
  }
}

function spawnSecondaries(ctx: NativeTroopContext, u: Unit, s: NativeUnitStats, at: number) {
  const kind = unitKindForName(s.secondary) as UnitKind | undefined;
  if (!kind) return;
  for (let i = 0; i < s.secondaryCount; i++) {
    const p = ringPoint(ctx.battle, u, i, s.secondaryCount, s.secondaryDistance, s.secondaryRandom);
    spawnNativeUnit(ctx, kind, s.level, p.x, p.y, at, u.id);
  }
}

/** Native death rules: delayed blasts, secondary units, death spells and remaining spawns. */
export function resolveNativeDeath(ctx: NativeTroopContext, u: Unit) {
  const battle = ctx.battle;
  if (u.native?.merged) return;
  const s = statsFor(battle, u);
  const at = u.defeatedAt ?? battle.elapsed;
  if (s.deathDamage > 0 && !u.ejected)
    (battle.nativeDeaths ??= []).push({
      sourceId: u.id,
      x: u.x,
      y: u.y,
      at: at + s.deathDelay,
      damage: s.deathDamage,
      radius: s.deathRadius,
      air: s.deathHitsAir,
    });
  if (s.secondary && !s.secondaryOnAttack && !(u.ejected && s.noSecondaryWhenEjected) && !u.ejected)
    spawnSecondaries(ctx, u, s, at);
  if (s.ability && !u.ejected) {
    const row = nativeRow('abilities', s.ability, s.abilityLevel);
    if (flag(row, 'ActiveOnDeath') && text(row, 'SelfSpell'))
      castNativeSpell(
        battle,
        text(row, 'SelfSpell'),
        num(row, 'SelfSpellLevel', 1) || 1,
        'attack',
        u.x,
        u.y,
        { at },
      );
    if (text(row, 'SpawnedTroop') && flag(row, 'SpawnRemainingTroopsOnDeath'))
      stepDamageSpawns(ctx, u, s, at, true);
  }
}
export function stepNativeDeaths(ctx: NativeTroopContext) {
  const battle = ctx.battle;
  for (const blast of battle.nativeDeaths ?? []) {
    if (blast.resolved || blast.at > battle.elapsed + 1e-9) continue;
    blast.resolved = true;
    for (const b of battle.buildings)
      if (b.hp > 0 && !isTrap(b.kind) && distanceTo(blast, b) <= blast.radius + 1e-9)
        ctx.damageBuilding(b, blast.damage, blast.at);
    damageDefenders(battle, blast, blast.damage, blast.radius, blast.air ? 'both' : 'ground');
    ctx.effect({
      type: 'blast',
      x: blast.x,
      y: blast.y,
      radius: blast.radius,
      sourceId: blast.sourceId,
    });
  }
  battle.nativeDeaths = battle.nativeDeaths?.filter((blast) => !blast.resolved);
}

/** Healing units with negative DPS: follow and heal the most injured nearby ally. */
function stepNativeHealer(
  ctx: NativeTroopContext,
  u: Unit,
  s: NativeUnitStats,
  heal: number,
  speed: number,
  dt: number,
) {
  const battle = ctx.battle;
  const units = battle.units;
  const ally = (a: Unit) =>
    a.id !== u.id && a.hp > 0 && !a.ejected && (a.spawnedAt ?? 0) <= battle.elapsed + 1e-9;
  let target: Unit | undefined;
  if (u.healTarget !== undefined)
    for (const a of units)
      if (a.id === u.healTarget && ally(a)) {
        target = a;
        break;
      }
  if (!target || target.hp >= target.maxHp) {
    // The first of the old sort by (already full, distance, id): a single pass over the
    // roster keeps the same winner without the filtered copy and the O(n log n) sort.
    target = undefined;
    let bestFull = 1,
      bestDistance = Infinity;
    for (const a of units) {
      if (!ally(a)) continue;
      if (!((s.airTargets || !TROOPS[a.kind].flying) && (s.groundTargets || TROOPS[a.kind].flying)))
        continue;
      const full = Number(a.hp >= a.maxHp);
      if (full > bestFull) continue;
      const d = distance2D(a.x - u.x, a.y - u.y);
      if (full < bestFull || d < bestDistance || (d === bestDistance && a.id < target!.id)) {
        bestFull = full;
        bestDistance = d;
        target = a;
      }
    }
    u.healTarget = target?.id;
  }
  if (!target) {
    u.attacking = false;
    return;
  }
  const distance = distance2D(target.x - u.x, target.y - u.y);
  if (distance > s.range + 1e-9) {
    u.attacking = false;
    moveToward(u, target, Math.min(speed * dt, distance - s.range));
    return;
  }
  u.attacking = true;
  if (u.cooldown > 0) return;
  u.cooldown = s.rate * unitAttackIntervalScale(u, battle.elapsed);
  const hits = [target];
  const bounceReach =
    tiles(nativeRow('projectiles', s.projectile || 'BattleDruidProjectile'), 'MaxBounceDistance') ||
    4.5;
  for (let i = 1; i < Math.max(1, s.bounces + 1) && hits.length <= s.bounces; i++) {
    const last = hits[hits.length - 1];
    // Nearest hurt ally within reach not yet hit, lowest id on a tie (the old sort's first).
    let next: Unit | undefined;
    let best = Infinity;
    for (const a of units) {
      if (!ally(a) || hits.includes(a) || a.hp >= a.maxHp) continue;
      const d = distance2D(a.x - last.x, a.y - last.y);
      if (d > bounceReach) continue;
      if (d < best || (d === best && a.id < next!.id)) {
        best = d;
        next = a;
      }
    }
    if (!next) break;
    hits.push(next);
  }
  for (const ally of hits) {
    const scale = ally.hero ? s.heroMultiplier : 1;
    if (!nativeUnitStats(ally.kind, unitLevel(battle, ally)).immuneToHealing)
      healUnit(battle, ally, heal * scale);
  }
  ctx.effect({
    type: 'hit',
    x: u.x,
    y: u.y,
    toX: target.x,
    toY: target.y,
    sourceId: u.id,
    targetId: target.id,
    color: 0x8dff8a,
  });
}

/** Units that can be seen by defenses this sample: underground movers stay hidden until they attack. */
export function targetableUnit(battle: Battle, u: Unit) {
  if (u.hp <= 0) return false;
  if (!battle.nativeRoster || !u.native) return true;
  if ((u.native.effects?.invisibleUntil ?? 0) > battle.elapsed + 1e-9) return false;
  if (nativeBehavior(battle, u.kind) && statsFor(battle, u).underground && !u.native.surfaced)
    return false;
  return true;
}

export function stepNativeBattle(ctx: NativeTroopContext) {
  const battle = ctx.battle;
  // Clone Spell copies expire silently: no death damage, splits or spells.
  for (const u of battle.units)
    if (
      u.hp > 0 &&
      u.native?.cloneUntil !== undefined &&
      u.native.cloneUntil <= battle.elapsed + 1e-9
    ) {
      u.hp = 0;
      u.spent = true;
      u.defeatedAt = u.native.cloneUntil;
    }
  stepNativeSpells({
    ...ctx,
    spawn: (kind, level, x, y, at, owner) => spawnNativeUnit(ctx, kind, level, x, y, at, owner),
  });
  stepNativeDeaths(ctx);
  stepNativeChains(ctx);
  stepPendingSpawns(ctx);
}
