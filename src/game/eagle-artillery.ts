import { groundCollision, type GroundCollision } from './subtile-path';
import type { LateCombatContext } from './late-campaign';
import type { Battle, Building, Unit } from './model';
import { TROOPS } from './data';
import { MAP_SIZE } from './grid';
import { spellTowerDefenseBoost } from './spell-tower';
import { untargetable } from './spell-effects';
import { nativeOwned } from './native-ownership';
import {
  EAGLE_ARTILLERY,
  NATIVE_TILE,
  eagleArtilleryDeployedHousing,
  eagleArtilleryGroupWeight,
  eagleArtilleryStats,
  eagleArtilleryTroopHousing,
} from './eagle-artillery-stats';

/** Eagle Artillery: activation, group targeting, shell bursts, hit spell, shockwave and pushback.
 * The campaign gate keeps affected villages unavailable until this is true. */
export const EAGLE_ARTILLERY_READY = true;

/** Native logic step (16 ms) and combat tick (every fourth logic step). */
const SUBTICK_MS = 16;
const TICK_SUBTICKS = 4;
/** Local frame: project tiles gain one tile so every attacker keeps a positive native position. */
const NATIVE_OFFSET = 1;
const HISTORY_SECONDS = 18;

export interface EagleArtilleryVolley {
  index: number;
  /** Charge start (the source PreAttack point) and each shell launch, in battle seconds. */
  startedAt: number;
  launches: number[];
  endedAt?: number;
}
export interface EagleArtilleryTowerState {
  level: number;
  ammunition: number;
  /** Remaining wake-up time after the deployed-housing threshold is reached. */
  wakeMs: number;
  /** First tick reaching 25%, 50%, 75% and 100% of WakeUpSpace (presentation stages). */
  stages: number[];
  awakeAt?: number;
  hitMs: number;
  burstMs: number;
  cooldownMs: number;
  /** Target-group search throttle (`m_attackDelay`). */
  searchMs: number;
  group: number[];
  targetId: number | null;
  /** Smoothed target-group position in native units, when a group is selected. */
  reticle: [number, number] | null;
  fired: number;
  volleys: EagleArtilleryVolley[];
  emptyAt?: number;
  destroyedAt?: number;
}
export interface EagleArtilleryShell {
  id: string;
  towerId: number;
  level: number;
  index: number;
  launchedAt: number;
  arrivesAt: number;
  fromX: number;
  fromY: number;
  /** Current destination in tiles; follows the target while it stays inside the tower's range. */
  x: number;
  y: number;
  targetId: number | null;
  air: boolean;
  damage: number;
  spellDamage: number;
  arrivedAt?: number;
  spellAt?: number;
  shockAt?: number;
  spellDone?: true;
}
export interface EagleArtilleryImpact {
  id: string;
  towerId: number;
  level: number;
  index: number;
  at: number;
  x: number;
  y: number;
  air: boolean;
  spellAt: number;
  shockAt: number;
  shockX?: number;
  shockY?: number;
  hits: number;
}
/** Battle-only state, reconstructed from the replay snapshot and simulation clock. */
export interface EagleArtilleryBattleState {
  nextSubtick: number;
  deployed: number;
  towers: Record<number, EagleArtilleryTowerState>;
  shells: EagleArtilleryShell[];
  impacts: EagleArtilleryImpact[];
}
export interface EagleArtilleryPush {
  sourceId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  initMs: number;
  remainingMs: number;
}
/** Per-attacker status owned by this family. */
export interface EagleArtilleryUnitState {
  push?: EagleArtilleryPush;
}

const isArtillery = (b: Building) => b.kind === 'eagleartillery';
/** Attackers are only ever appended, so an incrementally extended id index stays exact. */
const indexes = new WeakMap<Unit[], Map<number, Unit>>();
function unitById(battle: Battle, id: number | null) {
  if (id === null) return undefined;
  let index = indexes.get(battle.units);
  if (!index) indexes.set(battle.units, (index = new Map()));
  if (index.size !== battle.units.length) {
    index.clear();
    for (const u of battle.units) index.set(u.id, u);
  }
  return index.get(id);
}
const native = (tiles: number) => Math.floor((tiles + NATIVE_OFFSET) * NATIVE_TILE);
const tiles = (units: number) => units / NATIVE_TILE - NATIVE_OFFSET;
const center = (b: Building) => {
  const half = EAGLE_ARTILLERY.size / 2;
  return { x: native(b.x + half), y: native(b.y + half) };
};
const flying = (u: Unit) => !u.hero && !!TROOPS[u.kind].flying;
const available = (u: Unit, at: number) =>
  u.hp > 0 && !u.ejected && (u.spawnedAt ?? 0) <= at + 1e-9;

/** Retained engine range for character targets: strict minimum, maximum plus half a tile. */
function inRange(tower: Building, u: Unit) {
  const c = center(tower),
    dx = native(u.x) - c.x,
    dy = native(u.y) - c.y,
    d = dx * dx + dy * dy,
    max = EAGLE_ARTILLERY.range + 256;
  return d >= EAGLE_ARTILLERY.minRange * EAGLE_ARTILLERY.minRange && d <= max * max;
}

/** Integer square root matching the retained engine's floor result. */
function isqrt(value: number) {
  if (value <= 0) return 0;
  let r = Math.floor(Math.sqrt(value));
  while (r * r > value) r--;
  while ((r + 1) * (r + 1) <= value) r++;
  return r;
}

export function eagleArtilleryState(battle: Battle) {
  return (battle.late!.eagleArtillery ??= {
    nextSubtick: 0,
    deployed: 0,
    towers: {},
    shells: [],
    impacts: [],
  });
}
function towerState(state: EagleArtilleryBattleState, tower: Building) {
  return (state.towers[tower.id] ??= {
    level: tower.level,
    ammunition: EAGLE_ARTILLERY.ammunition,
    wakeMs: EAGLE_ARTILLERY.wakeUpMs,
    stages: [],
    hitMs: 0,
    burstMs: 0,
    cooldownMs: 0,
    searchMs: 0,
    group: [],
    targetId: null,
    reticle: null,
    fired: 0,
    volleys: [],
  });
}

/** Retained 9.256 building multiplier table for a 5×5 group window. */
const GROUP_CELL = Math.trunc((2 * EAGLE_ARTILLERY.groupRadius) / 5);
const GROUP_WINDOW = Math.trunc((2 * EAGLE_ARTILLERY.groupRadius) / GROUP_CELL);
const GROUP_COUNT =
  Math.trunc(25600 / GROUP_CELL) + (25600 % GROUP_CELL > Math.trunc(GROUP_CELL / 3) ? 1 : 0);
const GROUP_MULTIPLIERS = (() => {
  const radius = EAGLE_ARTILLERY.groupRadius,
    half = GROUP_CELL >> 1,
    tmp1 = Math.trunc((GROUP_WINDOW * GROUP_CELL) / -2),
    tmp2 = tmp1 + half,
    table: number[] = [];
  for (let i = 0; i < GROUP_WINDOW; i++) {
    const tmp = tmp2 + i * GROUP_CELL;
    let offset = tmp;
    if (tmp !== 0) offset = tmp - half;
    if (tmp < 0) offset = tmp + half;
    for (let j = 0, subY = tmp1; j < GROUP_WINDOW; j++, subY += GROUP_CELL) {
      let offset2 = subY + half;
      if (offset2 < 0) offset2 = 2 * half + subY;
      else if (offset2 !== 0) offset2 = subY;
      const value = Math.max(0, radius - isqrt(offset * offset + offset2 * offset2));
      table.push(Math.trunc((100 * value) / radius));
    }
  }
  return table;
})();
const SQRT_20000 = isqrt(20000);

/** Weighted target-group search of the retained engine (`RefreshTargetGroups`). */
function refreshGroup(battle: Battle, tower: Building, s: EagleArtilleryTowerState, at: number) {
  s.group = [];
  const weights = new Array<number>(GROUP_COUNT * GROUP_COUNT).fill(0);
  const candidates = battle.units.filter(
    (u) => available(u, at) && !untargetable(battle, u) && inRange(tower, u),
  );
  let max = 0;
  for (const u of candidates) {
    const gx = Math.trunc(native(u.x) / GROUP_CELL),
      gy = Math.trunc(native(u.y) / GROUP_CELL);
    if (native(u.x) < 0 || native(u.y) < 0 || gx >= GROUP_COUNT || gy >= GROUP_COUNT) continue;
    const offset = gx + GROUP_COUNT * gy;
    weights[offset] += eagleArtilleryGroupWeight(u.kind, !!u.hero);
    max = Math.max(max, weights[offset]);
  }
  if (max === 0) return;
  const c = center(tower),
    tmp1 = Math.trunc((GROUP_WINDOW * GROUP_CELL) / -2),
    count = GROUP_COUNT - GROUP_WINDOW;
  let best = 0,
    bestX = 0,
    bestY = 0;
  for (let i = 0; i <= count; i++) {
    const offset = tmp1 - i * GROUP_CELL;
    for (let j = 0; j <= count; j++) {
      let weighted = 0;
      for (let k = 0; k < GROUP_WINDOW; k++)
        for (let l = 0; l < GROUP_WINDOW; l++)
          weighted +=
            weights[j + (i + k) * GROUP_COUNT + l] * GROUP_MULTIPLIERS[k * GROUP_WINDOW + l];
      if (best < weighted * 1000) {
        const offset2 = tmp1 - j * GROUP_CELL;
        const d = isqrt((offset2 + c.x) ** 2 + (offset + c.y) ** 2) >> 8;
        const a = Math.trunc((1000 * (SQRT_20000 - d)) / SQRT_20000);
        weighted *= Math.trunc((a * a) / 1000);
        if (weighted < 1) weighted = 1;
      }
      if (best < weighted) {
        best = weighted;
        bestX = j;
        bestY = i;
      }
    }
  }
  const minX = bestX * GROUP_CELL,
    maxX = minX + GROUP_WINDOW * GROUP_CELL,
    minY = bestY * GROUP_CELL,
    maxY = minY + GROUP_WINDOW * GROUP_CELL;
  for (const u of candidates) {
    const x = native(u.x),
      y = native(u.y);
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) s.group.push(u.id);
  }
  selectTarget(battle, tower, s);
}

/** Heaviest group member, nearest on ties; the reticle snaps to it (`UpdateSelectedTargetGroup`). */
function selectTarget(battle: Battle, tower: Building, s: EagleArtilleryTowerState) {
  const c = center(tower);
  let chosen: Unit | undefined,
    weight = 0,
    distance = 0;
  for (const id of s.group) {
    const u = unitById(battle, id);
    if (!u || u.hp <= 0) continue;
    const w = eagleArtilleryGroupWeight(u.kind, !!u.hero),
      dx = native(u.x) - c.x,
      dy = native(u.y) - c.y,
      d = dx * dx + dy * dy;
    if (w > weight) {
      chosen = u;
      weight = w;
      distance = d;
    } else if (w === weight && d < distance) {
      chosen = u;
      distance = d;
    }
  }
  if (!chosen) return false;
  s.targetId = chosen.id;
  s.reticle = [native(chosen.x), native(chosen.y)];
  return true;
}

function subtickGroup(battle: Battle, tower: Building, s: EagleArtilleryTowerState) {
  if (!s.group.length) return;
  const previous = s.reticle;
  if (s.hitMs <= EAGLE_ARTILLERY.chargeMs) selectTarget(battle, tower, s);
  if (!previous || !s.reticle) return;
  const dx = s.reticle[0] - previous[0],
    dy = s.reticle[1] - previous[1],
    length = isqrt(dx * dx + dy * dy);
  if (length <= 2 * EAGLE_ARTILLERY.groupRadius && length > 30)
    s.reticle = [
      previous[0] + Math.trunc((dx * 30) / length),
      previous[1] + Math.trunc((dy * 30) / length),
    ];
}

function resetTower(s: EagleArtilleryTowerState, at: number) {
  s.hitMs = 0;
  s.burstMs = 0;
  s.group = [];
  s.targetId = null;
  s.reticle = null;
  endVolley(s, at);
}
/** Presentation boundary: a burst completed, or its charge/burst was abandoned. */
function endVolley(s: EagleArtilleryTowerState, at: number) {
  const volley = s.volleys.at(-1);
  if (volley && volley.endedAt === undefined) volley.endedAt = at;
}

function hit(
  battle: Battle,
  tower: Building,
  s: EagleArtilleryTowerState,
  state: EagleArtilleryBattleState,
  at: number,
) {
  if (s.ammunition <= 0) return;
  const candidate = unitById(battle, s.targetId);
  const target = candidate && candidate.hp > 0 ? candidate : undefined;
  if (!target && !s.reticle) return;
  // Spell Tower Rage scales defense damage; neutral without an active cast.
  const boost = spellTowerDefenseBoost(battle, tower);
  const stats = eagleArtilleryStats(tower.level);
  const c = center(tower);
  const index = ++s.fired;
  state.shells.push({
    id: `${tower.id}:${index}`,
    towerId: tower.id,
    level: tower.level,
    index,
    launchedAt: at,
    arrivesAt: at + EAGLE_ARTILLERY.travelMs / 1000,
    fromX: tiles(c.x),
    fromY: tiles(c.y),
    x: target ? target.x : tiles(s.reticle![0]),
    y: target ? target.y : tiles(s.reticle![1]),
    targetId: target?.id ?? null,
    air: target ? flying(target) : false,
    damage: stats.damage * boost.damage,
    spellDamage: stats.spellDamage * boost.damage,
  });
  s.volleys.at(-1)?.launches.push(at);
  s.ammunition--;
  if (!s.ammunition) s.emptyAt = at;
}

function tick(
  battle: Battle,
  tower: Building,
  s: EagleArtilleryTowerState,
  state: EagleArtilleryBattleState,
  at: number,
) {
  const frozen = (battle.defenseStuns[tower.id] ?? 0) > at + 1e-9;
  if (tower.hp <= 0 || s.ammunition <= 0 || frozen || tower.constructing || tower.upgradeEnd) {
    resetTower(s, at);
    return;
  }
  const deployed = state.deployed;
  for (let stage = s.stages.length; stage < 4; stage++)
    if (deployed * 4 >= EAGLE_ARTILLERY.wakeUpSpace * (stage + 1)) s.stages.push(at);
    else break;
  if (deployed < EAGLE_ARTILLERY.wakeUpSpace) return;
  s.wakeMs = Math.max(s.wakeMs - 64, 0);
  if (s.wakeMs > 0) return;
  s.awakeAt ??= at;
  // RefreshTarget: a new weighted group only between bursts, after cooldown and search delay.
  if (s.burstMs === 0 && !s.group.length && s.cooldownMs <= 0 && s.searchMs === 0) {
    refreshGroup(battle, tower, s, at);
    s.searchMs = 500;
    s.hitMs = 0;
  }
  const boost = spellTowerDefenseBoost(battle, tower);
  const step = Math.trunc((Math.round((boost.rate - 1) * 100) * 64 + 6400) / 100);
  s.searchMs = Math.max(s.searchMs - 64, 0);
  s.cooldownMs = Math.max(s.cooldownMs - step, 0);
  // Characters stay members after leaving range; only removed (defeated) units leave the group.
  s.group = s.group.filter((id) => {
    const u = unitById(battle, id);
    return !!u && available(u, at);
  });
  if (s.targetId !== null && !s.group.includes(s.targetId)) s.targetId = null;
  if (s.group.length || s.burstMs > 0 || s.hitMs >= EAGLE_ARTILLERY.chargeMs) {
    if (s.cooldownMs !== 0) return;
    if (s.hitMs < 64) {
      endVolley(s, at);
      s.volleys = [...s.volleys.slice(-3), { index: s.fired, startedAt: at, launches: [] }];
    }
    s.hitMs += step;
    if (s.hitMs < EAGLE_ARTILLERY.chargeMs) return;
    s.hitMs = EAGLE_ARTILLERY.chargeMs;
    const delay = EAGLE_ARTILLERY.burstDelayMs;
    const previous = Math.trunc((delay + s.burstMs - 1) / delay);
    s.burstMs += step;
    const burst = Math.trunc((delay + s.burstMs - 1) / delay);
    if (burst <= previous) return;
    hit(battle, tower, s, state, at);
    if (burst !== EAGLE_ARTILLERY.burstCount) return;
    s.cooldownMs = EAGLE_ARTILLERY.cooldownMs;
    s.hitMs = Math.min(s.hitMs - EAGLE_ARTILLERY.chargeMs, EAGLE_ARTILLERY.chargeMs);
    s.burstMs = 0;
    s.group = [];
    s.targetId = null;
    s.reticle = null;
    endVolley(s, at);
  } else {
    s.hitMs = 0;
    if (s.burstMs !== 0) s.cooldownMs = EAGLE_ARTILLERY.cooldownMs;
    s.burstMs = 0;
    s.reticle = null;
    endVolley(s, at);
  }
}

/** Ground collision for pushback, matching the crowd-separation rule. */
function solidTiles(battle: Battle) {
  return groundCollision(battle, battle.buildings);
}
const passable = (solid: GroundCollision, x: number, y: number) =>
  x >= 0 && y >= 0 && x < MAP_SIZE && y < MAP_SIZE && !solid.solid(x, y);

/** Stable per-unit jitter in [0, 127], replacing the native object RNG without shared state. */
function jitter(unitId: number, shell: string, slot: number) {
  let n = unitId * 0x9e3779b1 + slot * 0x85ebca77;
  for (const char of shell) n = Math.imul(n ^ char.charCodeAt(0), 0x27d4eb2d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x2c1b3c6d);
  n ^= n >>> 12;
  return (n >>> 0) & 0x7f;
}

/** Retained `AreaDamage`: strict radius, one layer (or both), pushback for light non-heroes. */
function areaDamage(
  battle: Battle,
  shell: EagleArtilleryShell,
  x: number,
  y: number,
  radius: number,
  damage: number,
  layer: 'air' | 'ground' | 'both',
  at: number,
  pushback: boolean,
) {
  const cx = native(x),
    cy = native(y);
  let hits = 0;
  for (const u of battle.units) {
    if (!available(u, at)) continue;
    if (layer !== 'both' && flying(u) !== (layer === 'air')) continue;
    const dx = cx - native(u.x),
      dy = cy - native(u.y);
    if (dx * dx + dy * dy >= radius * radius) continue;
    hits++;
    u.hp = Math.max(0, u.hp - damage);
    if (u.hp <= 0) u.defeatedAt ??= at;
    if (!pushback || u.hp <= 0 || u.hero || u.late?.eagleArtillery?.push) continue;
    const housing = eagleArtilleryTroopHousing(u.kind);
    if (housing > EAGLE_ARTILLERY.pushbackHousingLimit) continue;
    const force = Math.trunc(
      Math.trunc((Math.min(Math.floor(damage * 100), 5000) * 256) / 5000) / housing,
    );
    if (force <= 0) continue;
    let px = -dx,
      py = -dy;
    if (px === 0 && py === 0) {
      px = Math.round((shell.x - shell.fromX) * NATIVE_TILE);
      py = Math.round((shell.y - shell.fromY) * NATIVE_TILE);
      if (px === 0 && py === 0) px = 1;
    }
    const length = isqrt(px * px + py * py) || 1;
    const nx = Math.trunc((px * 512) / length) + jitter(u.id, shell.id, 1) - 63,
      ny = Math.trunc((py * 512) / length) + jitter(u.id, shell.id, 2) - 63;
    const duration = (1000 * force) >> 8;
    const sx = native(u.x),
      sy = native(u.y);
    ((u.late ??= {}).eagleArtillery ??= {}).push = {
      sourceId: shell.id,
      startX: sx,
      startY: sy,
      endX: sx + Math.floor((2 * force * nx) / 256),
      endY: sy + Math.floor((2 * force * ny) / 256),
      initMs: duration,
      remainingMs: duration,
    };
    // Local path model: displaced ground troops plan again from their pushed position.
    u.path = [];
    u.pathAt = 0;
  }
  return hits;
}

/** Retained `UpdatePushBack`: quadratic ease; ground pushes stop at solid tiles. */
function stepPushes(battle: Battle, solid: () => GroundCollision) {
  for (const u of battle.units) {
    const push = u.late?.eagleArtillery?.push;
    if (!push) continue;
    if (u.hp <= 0) {
      delete u.late!.eagleArtillery!.push;
      continue;
    }
    const start = Math.trunc((push.remainingMs * push.remainingMs) / push.initMs),
      end = push.initMs - start;
    const x = Math.trunc((start * push.startX + end * push.endX) / push.initMs),
      y = Math.trunc((start * push.startY + end * push.endY) / push.initMs);
    if (flying(u) || passable(solid(), tiles(x), tiles(y))) {
      u.x = Math.max(0, Math.min(MAP_SIZE, tiles(x)));
      u.y = Math.max(0, Math.min(MAP_SIZE, tiles(y)));
    } else {
      push.startX = push.endX = native(u.x);
      push.startY = push.endY = native(u.y);
    }
    push.remainingMs = Math.max(push.remainingMs - SUBTICK_MS, 0);
    if (push.remainingMs === 0) delete u.late!.eagleArtillery!.push;
  }
}

function stepShells(battle: Battle, state: EagleArtilleryBattleState, at: number) {
  for (const shell of state.shells) {
    if (shell.arrivedAt === undefined) {
      const tower = battle.buildings.find((b) => b.id === shell.towerId);
      const target = unitById(battle, shell.targetId);
      if (target && available(target, at) && tower && tower.hp > 0 && inRange(tower, target)) {
        shell.x = target.x;
        shell.y = target.y;
      } else shell.targetId = null;
      if (at + 1e-9 >= shell.arrivesAt) {
        // TargetReached: the hit spell acts on its first logic step; the shockwave after DamageDelay.
        shell.arrivedAt = at;
        const later = Math.max(
          0,
          Math.ceil((EAGLE_ARTILLERY.damageDelayMs - SUBTICK_MS) / SUBTICK_MS),
        );
        shell.spellAt = at + (SUBTICK_MS + EAGLE_ARTILLERY.spellHitTimeMs) / 1000;
        shell.shockAt = at + (later * SUBTICK_MS) / 1000;
        state.impacts.push({
          id: shell.id,
          towerId: shell.towerId,
          level: shell.level,
          index: shell.index,
          at,
          x: shell.x,
          y: shell.y,
          air: shell.air,
          spellAt: shell.spellAt,
          shockAt: shell.shockAt,
          hits: 0,
        });
      }
      continue;
    }
    const impact = state.impacts.find((row) => row.id === shell.id)!;
    if (!shell.spellDone && at + 1e-9 >= shell.spellAt!) {
      shell.spellDone = true;
      impact.hits += areaDamage(
        battle,
        shell,
        impact.x,
        impact.y,
        EAGLE_ARTILLERY.spellRadius,
        shell.spellDamage,
        'both',
        at,
        false,
      );
    }
    if (at + 1e-9 >= shell.shockAt!) {
      const target = unitById(battle, shell.targetId);
      const x = target && target.hp > 0 ? target.x : impact.x,
        y = target && target.hp > 0 ? target.y : impact.y;
      impact.shockX = x;
      impact.shockY = y;
      impact.hits += areaDamage(
        battle,
        shell,
        x,
        y,
        EAGLE_ARTILLERY.damageRadius,
        shell.damage,
        shell.air ? 'air' : 'ground',
        at,
        EAGLE_ARTILLERY.pushback > 0,
      );
      shell.spellDone = true;
      shell.arrivesAt = -1;
    }
  }
  state.shells = state.shells.filter((shell) => shell.arrivesAt !== -1);
}

export function stepEagleArtillery(context: LateCombatContext) {
  const { battle, phase } = context;
  if (phase !== 'defenses' || !battle.late) return;
  const towers = battle.buildings.filter((b) => isArtillery(b) && !nativeOwned(battle, b));
  if (!towers.length && !battle.late.eagleArtillery) return;
  const state = eagleArtilleryState(battle);
  for (const tower of towers) towerState(state, tower);
  let solid: GroundCollision | undefined;
  const solids = () => (solid ??= solidTiles(battle));
  while ((state.nextSubtick * SUBTICK_MS) / 1000 <= battle.elapsed + 1e-9) {
    const at = (state.nextSubtick * SUBTICK_MS) / 1000;
    stepPushes(battle, solids);
    stepShells(battle, state, at);
    for (const tower of towers)
      if (tower.hp > 0) subtickGroup(battle, tower, state.towers[tower.id]);
    if (state.nextSubtick % TICK_SUBTICKS === 0) {
      state.deployed = eagleArtilleryDeployedHousing(battle);
      for (const tower of towers) tick(battle, tower, state.towers[tower.id], state, at);
    }
    state.nextSubtick++;
    solid = undefined;
  }
  state.impacts = state.impacts.filter((row) => row.at >= battle.elapsed - HISTORY_SECONDS);
}
/** True while this family still has an unresolved effect that must finish before results. */
export function eagleArtilleryPending(battle: Battle) {
  return !!battle.late?.eagleArtillery?.shells.length;
}
export function eagleArtilleryDestroyed(
  context: LateCombatContext,
  building: Building,
  at: number,
) {
  const state = context.battle.late?.eagleArtillery;
  if (!state || !isArtillery(building)) return;
  const tower = state.towers[building.id];
  if (tower) {
    tower.destroyedAt ??= at;
    endVolley(tower, at);
  }
  // Released shells lose their launcher reference and land at the last tracked position.
  for (const shell of state.shells)
    if (shell.towerId === building.id && shell.arrivedAt === undefined) shell.targetId = null;
}
/** Pushed attackers follow the pushback instead of moving or attacking on their own. */
export function eagleArtilleryHolds(battle: Battle, unit: Unit) {
  return !!battle.late && !!unit.late?.eagleArtillery?.push;
}
