import { TROOPS } from './data';
import { distance2D } from './distance';
import { MAP_SIZE } from './grid';
import { groundCollision, type GroundCollision } from './subtile-path';
import {
  garrisonAura,
  garrisonDeathSpell,
  garrisonSecondaryLevel,
  garrisonStats,
  garrisonSummonLevel,
  spawnedGarrisonKind,
  type GarrisonKind,
  type GarrisonStats,
} from './garrison-kinds';
import type { Defender, GarrisonDefender } from './defenders';
import { isGarrisonDefender } from './defenders';
import type { Battle, Unit } from './model';

/**
 * Source mechanics of the later campaign garrison families. References are to the pinned older
 * public engine reconstruction [bns34/Supercell.Magic-my-turn@52c5953](https://github.com/bns34/Supercell.Magic-my-turn/tree/52c5953f5e5802c64ac36e53d5599f8700976085)
 * (client 9.256.x); see reference/garrison/README.md for every interpretation and its limits.
 */

type Spawn = (
  battle: Battle,
  kind: GarrisonKind,
  level: number,
  sourceId: number,
  x: number,
  y: number,
  at: number,
) => GarrisonDefender;

/** Internal engine units per tile (`tile << 9`). */
const UNITS = 512;
const EPSILON = 1e-9;

// LogicMath.SIN_TABLE: sin(0..90 degrees) scaled by 1024. Integer angles keep spawn geometry
// identical in every JavaScript engine (no floating-point trigonometry in the simulation).
const SIN_TABLE = [
  0x0000, 0x0012, 0x0024, 0x0036, 0x0047, 0x0059, 0x006b, 0x007d, 0x008f, 0x00a0, 0x00b2, 0x00c3,
  0x00d5, 0x00e6, 0x00f8, 0x0109, 0x011a, 0x012b, 0x013c, 0x014d, 0x015e, 0x016f, 0x0180, 0x0190,
  0x01a0, 0x01b1, 0x01c1, 0x01d1, 0x01e1, 0x01f0, 0x0200, 0x020f, 0x021f, 0x022e, 0x023d, 0x024b,
  0x025a, 0x0268, 0x0276, 0x0284, 0x0292, 0x02a0, 0x02ad, 0x02ba, 0x02c7, 0x02d4, 0x02e1, 0x02ed,
  0x02f9, 0x0305, 0x0310, 0x031c, 0x0327, 0x0332, 0x033c, 0x0347, 0x0351, 0x035b, 0x0364, 0x036e,
  0x0377, 0x0380, 0x0388, 0x0390, 0x0398, 0x03a0, 0x03a7, 0x03af, 0x03b5, 0x03bc, 0x03c2, 0x03c8,
  0x03ce, 0x03d3, 0x03d8, 0x03dd, 0x03e2, 0x03e6, 0x03ea, 0x03ed, 0x03f0, 0x03f3, 0x03f6, 0x03f8,
  0x03fa, 0x03fc, 0x03fe, 0x03ff, 0x03ff, 0x0400, 0x0400,
];
const normalize360 = (angle: number) => ((angle % 360) + 360) % 360;
export function sourceSin(degrees: number) {
  let angle = normalize360(degrees);
  const sign = angle < 180 ? 1 : -1;
  if (angle >= 180) angle -= 180;
  if (angle > 90) angle = 180 - angle;
  // `+ 0` keeps sin(180) a positive zero, as the integer source has no negative zero.
  return sign * SIN_TABLE[angle] + 0;
}
export const sourceCos = (degrees: number) => sourceSin(degrees + 90);

/** LogicRandom: the 13/17/5 xorshift on 32-bit integers, `Rand(max)` in [0, max). */
export function sourceRandom(seed: number) {
  let state = seed | 0;
  return (max: number) => {
    if (max <= 0) return 0;
    let value = state === 0 ? -1 : state;
    const shifted = value ^ (value << 13);
    const mixed = shifted ^ (shifted >> 17);
    value = mixed ^ (mixed << 5);
    state = value;
    // C# negation of int.MinValue wraps to itself; `% max` then stays negative.
    if (value < 0) value = -value | 0;
    return value % max;
  };
}
/** LogicGameObject.Rand(rnd): a stateless 14/16/5 xorshift of `seed + rnd`, masked positive. */
export function sourceObjectRand(seed: number, rnd: number) {
  let value = (seed + rnd) | 0;
  if (value === 0) value = -1;
  const shifted = value ^ (value << 14);
  const mixed = shifted ^ (shifted >> 16);
  return (mixed ^ (mixed << 5)) & 0x7fffffff;
}

/** A positive per-object identity standing in for the source global ID (local, deterministic). */
const objectId = (defender: { id: number }) => -defender.id;
/** Spawn angle in integer degrees: `59 * globalId % 360 + 360 * i / count` (CheckSpawning). */
export const spawnAngle = (defender: { id: number }, index: number, count: number) =>
  ((59 * objectId(defender)) % 360) + Math.trunc((360 * index) / count);

/**
 * GetNearestPassablePosition within 3 tiles (1536 units): the point itself when free, otherwise
 * the nearest free half-tile center (ties by row, then column). Collision is the battle's ground
 * collision: client sub-tiles in version-44 native battles, whole tiles elsewhere.
 */
export function nearestPassable(collision: GroundCollision, x: number, y: number) {
  const free = (px: number, py: number) =>
    px >= 0 && py >= 0 && px < MAP_SIZE && py < MAP_SIZE && !collision.solid(px, py);
  if (free(x, y)) return { x, y };
  let best: { x: number; y: number; d: number } | undefined;
  for (let sy = Math.floor(y * 2) - 6; sy <= Math.floor(y * 2) + 6; sy++)
    for (let sx = Math.floor(x * 2) - 6; sx <= Math.floor(x * 2) + 6; sx++) {
      const cx = (sx + 0.5) / 2,
        cy = (sy + 0.5) / 2;
      const d = distance2D(cx - x, cy - y);
      if (d > 3 || !free(cx, cy)) continue;
      if (!best || d < best.d - EPSILON) best = { x: cx, y: cy, d };
    }
  return best;
}

export interface GarrisonPush {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  at: number;
  duration: number;
  /** Ground pushes stop where the path first enters a building (fraction of the full vector). */
  limit: number;
}
/** LogicMovementSystem.UpdatePushBack: `start + (1 - (t/T)^2) * (end - start)`, t remaining. */
export function pushFraction(push: GarrisonPush, at: number) {
  const progress = Math.min(1, Math.max(0, (at - push.at) / push.duration));
  return Math.min(push.limit, 1 - (1 - progress) * (1 - progress));
}
function makePush(
  collision: GroundCollision,
  from: { x: number; y: number },
  vector: { x: number; y: number },
  at: number,
  duration: number,
  flying: boolean,
): GarrisonPush {
  let limit = 1;
  if (!flying) {
    // Sample the push line at 1/32 tile; the unit keeps its last passable position.
    const length = distance2D(vector.x, vector.y);
    const samples = Math.max(1, Math.ceil(length * 32));
    for (let i = 1; i <= samples; i++) {
      const f = i / samples;
      const px = from.x + vector.x * f,
        py = from.y + vector.y * f;
      if (px < 0 || py < 0 || px >= MAP_SIZE || py >= MAP_SIZE || collision.solid(px, py)) {
        limit = (i - 1) / samples;
        break;
      }
    }
  }
  return {
    fromX: from.x,
    fromY: from.y,
    toX: from.x + vector.x,
    toY: from.y + vector.y,
    at,
    duration,
    limit,
  };
}
/**
 * True while a spawned unit is still being pushed out; it does not act meanwhile. The step that
 * crosses the push end snaps to the final push position once; afterwards the unit moves freely.
 */
export function stepPush(defender: GarrisonDefender, at: number, dt: number) {
  const push = defender.push;
  const end = push ? push.at + push.duration : 0;
  if (!push || at - dt >= end - EPSILON) return false;
  const fraction = pushFraction(push, at);
  defender.x = push.fromX + (push.toX - push.fromX) * fraction;
  defender.y = push.fromY + (push.toY - push.fromY) * fraction;
  return at + EPSILON < end;
}

/**
 * CheckSpawning for secondary troops and summons. Positions: flyers start at the parent plus the
 * rotated `SecondarySpawnOffset`; ground units at the nearest passable point. Each is pushed along
 * `angle` by `SecondarySpawnDist` (randomized to [d/2, 3d/2) with LogicRandom(globalId) when
 * `RandomizeSecSpawnDist`), over `2d / (3 * PushbackSpeed)` ms (d in internal units).
 */
function spawnWave(
  battle: Battle,
  parent: GarrisonDefender,
  kind: GarrisonKind,
  level: number,
  count: number,
  distance: number,
  randomize: boolean,
  offset: number,
  at: number,
  summon: boolean,
  spawn: Spawn,
) {
  const stats = garrisonStats(kind, level);
  const random = sourceRandom(objectId(parent));
  const spawned: GarrisonDefender[] = [];
  const collision = groundCollision(battle, battle.buildings);
  for (let i = 0; i < count; i++) {
    const angle = spawnAngle(parent, i, count);
    let start: { x: number; y: number } | undefined;
    if (stats.flying) {
      const units = Math.trunc((Math.round(offset * 100) << 9) / 100);
      start = {
        x: parent.x + Math.trunc((units * sourceCos(angle)) / 1024) / UNITS,
        y: parent.y + Math.trunc((units * sourceSin(angle)) / 1024) / UNITS,
      };
    } else start = nearestPassable(collision, parent.x, parent.y);
    if (!start) continue;
    const unit = spawn(battle, kind, level, parent.sourceId, start.x, start.y, at);
    unit.parentId = parent.id;
    let units = Math.trunc((Math.round(distance * 100) << 9) / 100);
    if (units > 0) {
      if (randomize) units = random(units) + (units >>> 1);
      const vector = {
        x: Math.trunc((units * sourceCos(angle)) / 1024) / UNITS,
        y: Math.trunc((units * sourceSin(angle)) / 1024) / UNITS,
      };
      const speed = stats.pushbackSpeed > 0 ? stats.pushbackSpeed : 1;
      const duration = Math.trunc((2 * units) / (3 * speed)) / 1000;
      if (duration > 0) unit.push = makePush(collision, start, vector, at, duration, stats.flying);
      // Summons wait out the push (SetSpawnTime), then SpawnIdle (at least 10 ms).
      if (summon) unit.idleUntil = at + duration + Math.max(0.01, stats.spawnIdle);
    }
    spawned.push(unit);
  }
  return spawned;
}

/** Golem and Lava Hound death: the secondary troop wave, once, at the moment of death. */
export function spawnSecondaries(
  battle: Battle,
  parent: GarrisonDefender,
  stats: GarrisonStats,
  spawn: Spawn,
) {
  if (!stats.secondary || parent.split || parent.defeatedAt === undefined) return;
  parent.split = true;
  const kind = spawnedGarrisonKind(stats.secondary.character);
  const level = garrisonSecondaryLevel(stats);
  if (!kind || level === undefined)
    throw Error(`Unsupported secondary troop: ${stats.secondary.character}`);
  spawnWave(
    battle,
    parent,
    kind,
    level,
    stats.secondary.count,
    stats.secondary.distance,
    stats.secondary.randomize,
    stats.secondary.offset,
    parent.defeatedAt,
    false,
    spawn,
  );
}

export interface GarrisonSummonState {
  /** LogicCombatComponent summon timer (seconds), counting down; starts at SummonCooldown / 4. */
  timer: number;
  /** The window below SummonTime already produced a wave. */
  used: boolean;
  /** Summon attack delay (`SummonCooldown / 6`): no targeting or attacks until then. */
  delayUntil: number;
  /** Living summons created by this Witch, in creation order. */
  ids: number[];
  /** Summon events for presentation (stable ordinals). */
  events: { n: number; at: number; count: number }[];
}
export const GARRISON_SUMMON_HISTORY = 4;

/**
 * Witch summoning. The older combat component starts the timer at `SummonCooldown / 4`, resets it
 * to `SummonCooldown` when it reaches zero and summons while it is below `SummonCooldown / 8`
 * (the pinned `SummonTime`, 875 ms) and a target exists: up to `SummonTroopCount`, never more
 * than `SummonLimit` living summons. At the limit the timer restarts at once.
 */
export function stepSummons(
  battle: Battle,
  witch: GarrisonDefender,
  stats: GarrisonStats,
  dt: number,
  hasTarget: boolean,
  spawn: Spawn,
) {
  const source = stats.summon;
  if (!source) return;
  const state = (witch.summon ??= {
    timer: source.cooldown / 4,
    used: false,
    delayUntil: 0,
    ids: [],
    events: [],
  });
  const living = new Set<number>();
  for (const d of battle.defenders ?? []) if (d.hp > 0) living.add(d.id);
  state.ids = state.ids.filter((id) => living.has(id));
  state.timer = Math.max(0, state.timer - dt);
  if (state.timer <= EPSILON) {
    state.timer = source.cooldown;
    state.used = false;
  }
  if (state.used || state.timer >= source.time - EPSILON || !hasTarget) return;
  if (state.ids.length >= source.limit) {
    state.timer = 0;
    return;
  }
  const kind = spawnedGarrisonKind(source.character);
  const level = garrisonSummonLevel(stats);
  if (!kind || level === undefined) throw Error(`Unsupported summon: ${source.character}`);
  const count = Math.min(source.count, source.limit - state.ids.length);
  const wave = spawnWave(
    battle,
    witch,
    kind,
    level,
    count,
    source.distance,
    false,
    0,
    battle.elapsed,
    true,
    spawn,
  );
  state.ids.push(...wave.map((d) => d.id));
  state.used = true;
  state.delayUntil = battle.elapsed + source.cooldown / 6;
  const n = (state.events.at(-1)?.n ?? -1) + 1;
  state.events.push({ n, at: battle.elapsed, count: wave.length });
  if (state.events.length > GARRISON_SUMMON_HISTORY) state.events.shift();
}
/** CheckSummons: when the Witch dies, summons still being pushed out die with her. */
export function killPendingSummons(battle: Battle, witch: GarrisonDefender) {
  for (const id of witch.summon?.ids ?? []) {
    const summon = (battle.defenders ?? []).find((d) => d.id === id);
    if (!summon || !isGarrisonDefender(summon) || summon.hp <= 0 || !summon.push) continue;
    if (battle.elapsed + EPSILON >= summon.push.at + summon.push.duration) continue;
    summon.hp = 0;
    summon.defeatedAt = battle.elapsed;
    summon.attacking = false;
  }
}

const active = (unit: Unit, at: number) =>
  unit.hp > 0 && !unit.ejected && (unit.spawnedAt ?? 0) <= at;
const canHit = (unit: Unit, stats: GarrisonStats) =>
  TROOPS[unit.kind].flying ? stats.airTargets : stats.groundTargets;

export interface GarrisonChainJump {
  targetId: number;
  at: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  air: boolean;
  damage: number;
}
export interface GarrisonChain {
  /** Attack ordinal the chain belongs to. */
  n: number;
  next: number;
  depth: number;
  damage: number;
  prevId: number;
  x: number;
  y: number;
  hit: number[];
}
/**
 * Chain lightning after a direct Electro Dragon hit: every `ChainAttackDelay` the bolt jumps to the
 * nearest attacker it has not struck within `ChainAttackDistance` of the previous target, until
 * `ChainAttackDepth` targets were hit. Each jump deals `ChainAttackDamageReductionPercent` less than
 * the previous hit (compounding, per public descriptions). Ties by attacker ID are local.
 */
export function startChain(
  defender: GarrisonDefender,
  stats: GarrisonStats,
  n: number,
  target: Unit,
  damage: number,
  at: number,
) {
  if (!stats.chain || stats.chain.depth <= 1) return;
  defender.chain = {
    n,
    next: at + stats.chain.delay,
    depth: 1,
    damage: damage * (1 - stats.chain.reduction),
    prevId: target.id,
    x: target.x,
    y: target.y,
    hit: [target.id],
  };
}
export function stepChain(battle: Battle, defender: GarrisonDefender, stats: GarrisonStats) {
  const chain = defender.chain;
  if (!chain || !stats.chain) return [];
  const jumps: GarrisonChainJump[] = [];
  while (chain.next <= battle.elapsed + EPSILON) {
    const previous = battle.units.find((u) => u.id === chain.prevId && active(u, chain.next));
    const from = previous ? { x: previous.x, y: previous.y } : { x: chain.x, y: chain.y };
    let best: Unit | undefined,
      bestDistance = Infinity;
    for (const unit of battle.units) {
      if (!active(unit, chain.next) || !canHit(unit, stats) || chain.hit.includes(unit.id))
        continue;
      const d = distance2D(unit.x - from.x, unit.y - from.y);
      if (d > stats.chain.distance + EPSILON) continue;
      if (
        d < bestDistance - EPSILON ||
        (Math.abs(d - bestDistance) <= EPSILON && unit.id < best!.id)
      ) {
        best = unit;
        bestDistance = d;
      }
    }
    if (!best) {
      delete defender.chain;
      break;
    }
    const air = !!TROOPS[best.kind].flying;
    best.hp = Math.max(0, best.hp - chain.damage);
    const jump = {
      targetId: best.id,
      at: chain.next,
      fromX: from.x,
      fromY: from.y,
      x: best.x,
      y: best.y,
      air,
      damage: chain.damage,
    };
    jumps.push(jump);
    defender.attacks.find((a) => a.n === chain.n)?.chain?.push(jump);
    chain.hit.push(best.id);
    chain.prevId = best.id;
    chain.x = best.x;
    chain.y = best.y;
    chain.depth++;
    chain.damage *= 1 - stats.chain.reduction;
    chain.next += stats.chain.delay;
    if (chain.depth >= stats.chain.depth) {
      delete defender.chain;
      break;
    }
  }
  return jumps;
}

export interface GarrisonBolt {
  at: number;
  x: number;
  y: number;
  done: boolean;
}
/**
 * LogicSpell.CalculateRandomOffset for hit `count`: square offsets within `RandomRadius`, retried
 * until they differ from the previous candidate by more than a third of the radius. The seed is a
 * local deterministic stand-in for the spell object's seed.
 */
export function spellRandomOffset(seed: number, count: number, radiusTiles: number) {
  const radius = Math.trunc((Math.round(radiusTiles * 100) << 9) / 100);
  let x = 0,
    y = 0;
  if (radius <= 0) return { x: 0, y: 0 };
  for (let i = 0; i < count; i++) {
    const prevX = x,
      prevY = y;
    let yPosSeed = 7 * count + 9,
      xEnableSeed = 5 * count + 3,
      yEnableSeed = 11 * count + 32;
    for (let j = 0; j < 100; j++) {
      x =
        (sourceObjectRand(seed, count + j) % radius) *
        (2 * (sourceObjectRand(seed, xEnableSeed) & 1) - 1);
      y =
        (sourceObjectRand(seed, yPosSeed) % radius) *
        (2 * (sourceObjectRand(seed, yEnableSeed) & 1) - 1);
      if (Math.abs(prevY - prevX + x - y) > Math.trunc(radius / 3)) break;
      yPosSeed += 7;
      xEnableSeed += 4;
      yEnableSeed += 15;
    }
  }
  return { x: x / UNITS, y: y / UNITS };
}
/** Electro Dragon death: its `SelfSpell` bolts at the death position (created once). */
export function createDeathBolts(battle: Battle, defender: GarrisonDefender, stats: GarrisonStats) {
  const spell = garrisonDeathSpell(stats);
  if (!spell || defender.bolts || defender.defeatedAt === undefined) return;
  const seed = (Math.imul(battle.seed | 0, 31) + defender.id) | 0;
  defender.bolts = Array.from({ length: spell.hits }, (_, k) => {
    const offset = spell.randomOnlyGfx
      ? { x: 0, y: 0 }
      : spellRandomOffset(seed, k, spell.randomRadius);
    return {
      at: defender.defeatedAt! + spell.firstHit + k * spell.interval,
      x: defender.x + offset.x,
      y: defender.y + offset.y,
      done: false,
    };
  });
}
/** Resolve due bolts on both layers (AreaDamage target type 2); Heroes use the spell multiplier. */
export function stepDeathBolts(battle: Battle, defender: GarrisonDefender, stats: GarrisonStats) {
  const spell = garrisonDeathSpell(stats);
  const resolved: GarrisonBolt[] = [];
  if (!spell || !defender.bolts) return resolved;
  for (const bolt of defender.bolts) {
    if (bolt.done || bolt.at > battle.elapsed + EPSILON) continue;
    bolt.done = true;
    resolved.push(bolt);
    for (const unit of battle.units)
      if (active(unit, bolt.at) && distance2D(unit.x - bolt.x, unit.y - bolt.y) <= spell.radius)
        unit.hp = Math.max(
          0,
          unit.hp - (unit.hero ? spell.damage * spell.heroDamageScale : spell.damage),
        );
  }
  return resolved;
}

/**
 * Electro Titan aura: the older engine keeps the aura spell centered on the living character and
 * strikes every `TimeBetweenHitsMS` after `HitTimeMS`, independent of the character's attacks and
 * stuns. Defending, it damages attacking troops on both layers; Heroes take the spell multiplier.
 */
export function stepAura(battle: Battle, defender: GarrisonDefender, stats: GarrisonStats) {
  const aura = garrisonAura(stats);
  if (!aura) return 0;
  const end = defender.hp > 0 ? battle.elapsed : (defender.defeatedAt ?? battle.elapsed) - EPSILON;
  let pulses = 0;
  for (;;) {
    const index = defender.auraHits ?? 0;
    const at = defender.spawnedAt + aura.firstHit + index * aura.interval;
    if (index >= aura.hits || at > end + EPSILON) break;
    defender.auraHits = index + 1;
    pulses++;
    for (const unit of battle.units)
      if (active(unit, at) && distance2D(unit.x - defender.x, unit.y - defender.y) <= aura.radius)
        unit.hp = Math.max(
          0,
          unit.hp - (unit.hero ? aura.damage * aura.heroDamageScale : aura.damage),
        );
  }
  return pulses;
}

/** Attackers may select a defender only once it acts visibly: born, not spawning, not concealed. */
export function garrisonDefenderTargetable(battle: Battle, defender: Defender) {
  if (!isGarrisonDefender(defender)) return true;
  return (
    defender.spawnedAt <= battle.elapsed &&
    !((defender.idleUntil ?? 0) > battle.elapsed) &&
    !((defender.stealthUntil ?? 0) > battle.elapsed)
  );
}
