import { TROOPS } from './data';
import { nonWallBuildings } from './building-lists';
import { distance2D, distanceSquared2D } from './distance';
import {
  garrisonLongShots,
  garrisonPoisonOnHit,
  garrisonStats,
  garrisonStealth,
  garrisonTantrum,
  type GarrisonKind,
  type GarrisonStats,
} from './garrison-kinds';
import type { Defender, GarrisonDefender } from './defenders';
import { isGarrisonDefender } from './defenders';
import { findPath, type Battle, type FX, type Unit } from './model';
import { applyGarrisonFrost, applyGarrisonPoison } from './garrison-status';
import {
  createDeathBolts,
  killPendingSummons,
  spawnSecondaries,
  startChain,
  stepAura,
  stepChain,
  stepDeathBolts,
  stepPush,
  stepSummons,
  type GarrisonChainJump,
} from './garrison-abilities';
// Late campaign Spell Tower Rage (neutral without version 44 late state).
import { lateDefenderStats } from './late-campaign';
import { untargetable } from './spell-effects';

export interface GarrisonAttack {
  at: number;
  x: number;
  y: number;
  targetId: number;
  targetX: number;
  targetY: number;
  /** Version-44 families: stable attack ordinal, projectile row and its resolution. */
  n?: number;
  projectile?: string;
  air?: boolean;
  long?: boolean;
  hitAt?: number;
  hitX?: number;
  hitY?: number;
  hit?: boolean;
  /** Electro Dragon: chain lightning jumps resolved after this hit. */
  chain?: GarrisonChainJump[];
  /** Bowler: the boulder's bounce impact after the first hit. */
  bounceAt?: number;
  bounceX?: number;
  bounceY?: number;
}
/** A tracking projectile that resolves once, even if its shooter has died. */
export interface GarrisonShot {
  n: number;
  projectile: string;
  speed: number;
  targetId: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  flight: { x: number; y: number; at: number };
  launched: number;
  impact: number;
  air: boolean;
  damage: number;
  splash: number;
  /** `DontTrackTarget` rows (Witch) and bounce legs keep a fixed landing point. */
  fixed?: boolean;
  /** Remaining bounce points of a Bowler boulder, in order. */
  bounces?: { x: number; y: number }[];
  /** 0 for the thrown leg, then one per bounce. */
  leg?: number;
}
/** Kinds resolved before version 44 keep their complete, unbounded attack history. */
const LEGACY_KINDS: ReadonlySet<GarrisonKind> = new Set(['dragon', 'balloon']);
/** Presentation needs only recent attacks; older records are pruned deterministically. */
export const GARRISON_ATTACK_HISTORY = 16;

/** The release scheduler supplies the explicit exit point and simulation birth time. */
export function spawnGarrisonDefender(
  battle: Battle,
  kind: GarrisonKind,
  level: number,
  sourceId: number,
  x: number,
  y: number,
  at: number,
): GarrisonDefender {
  const stats = garrisonStats(kind, level);
  const defender: GarrisonDefender = {
    id: Math.min(0, ...(battle.defenders ?? []).map((d) => d.id)) - 1,
    kind,
    level,
    sourceId,
    mode: stats.flying ? 'air' : 'ground',
    x,
    y,
    hp: stats.hp,
    maxHp: stats.hp,
    spawnedAt: at,
    cooldown: 0,
    target: null,
    path: [],
    pathAt: 0,
    attacking: false,
    attacks: [],
  };
  // RoyalGhostAbility (`ActiveAfterPlaceCommand`): read as active from the unit's spawn.
  const stealth = garrisonStealth(stats);
  if (stealth) defender.stealthUntil = at + stealth.duration;
  (battle.defenders ??= []).push(defender);
  return defender;
}

function active(unit: Unit, at: number) {
  return unit.hp > 0 && !unit.ejected && (unit.spawnedAt ?? 0) <= at;
}
const flyingUnit = (unit: Unit) => !!TROOPS[unit.kind].flying;
/** Per-target damage: HeroDamageMultiplier applies to the attacking Hero (the King). */
const damageFor = (unit: Unit, damage: number, stats: GarrisonStats) =>
  unit.hero && stats.heroDamageScale !== 1 ? damage * stats.heroDamageScale : damage;

/** Home defenders jump their own walls (ENABLE_DEFENDING_ALLIANCE_TROOP_JUMP). */
function followPath(defender: GarrisonDefender, speed: number, dt: number) {
  let travel = speed * dt;
  while (defender.path.length && travel > 0) {
    const next = defender.path[0],
      dx = next.x - defender.x,
      dy = next.y - defender.y,
      length = distance2D(dx, dy);
    if (length <= travel) {
      defender.x = next.x;
      defender.y = next.y;
      defender.path.shift();
      travel -= length;
    } else {
      defender.x += (dx / length) * travel;
      defender.y += (dy / length) * travel;
      break;
    }
  }
}

function recordAttack(defender: GarrisonDefender, attack: GarrisonAttack) {
  (defender.attacks ??= []).push(attack);
  // All families cap at recent history; ordinals (attackCount / attack.n) stay
  // stable so replays, chains and shot lookups keep working.
  if (defender.attacks.length > GARRISON_ATTACK_HISTORY)
    defender.attacks.splice(0, defender.attacks.length - GARRISON_ATTACK_HISTORY);
}

/** Apply one resolved hit on the selected layer; single-target hits never touch bystanders. */
function resolveHit(
  battle: Battle,
  defender: GarrisonDefender,
  stats: GarrisonStats,
  target: Unit | undefined,
  center: { x: number; y: number },
  air: boolean,
  damage: number,
  at: number,
) {
  if (stats.splash > 0) {
    for (const unit of battle.units)
      if (
        active(unit, at) &&
        flyingUnit(unit) === air &&
        (air ? stats.airTargets : stats.groundTargets) &&
        distance2D(unit.x - center.x, unit.y - center.y) <= stats.splash
      )
        unit.hp = Math.max(0, unit.hp - damageFor(unit, damage, stats));
  } else if (target && active(target, at))
    target.hp = Math.max(0, target.hp - damageFor(target, damage, stats));
  const poison = garrisonPoisonOnHit(stats);
  if (poison && target && target.hp > 0 && (!air || poison.affectsAir))
    applyGarrisonPoison(battle, target, poison, defender.id, at);
  // Royal Ghost: FrostOnHit slows the struck attacker.
  if (stats.frost && target && target.hp > 0 && active(target, at))
    applyGarrisonFrost(battle, target, stats.frost, defender.id, at);
}

function stepShots(battle: Battle, defender: GarrisonDefender, effect: (fx: FX) => void) {
  if (!defender.shots?.length) return;
  const stats = garrisonStats(defender.kind, defender.level);
  const pending: GarrisonShot[] = [];
  for (const shot of defender.shots) {
    const target = battle.units.find((u) => u.id === shot.targetId && u.hp > 0 && !u.ejected);
    if (target && !shot.fixed) {
      shot.x = target.x;
      shot.y = target.y;
    }
    const distance = distance2D(shot.x - shot.flight.x, shot.y - shot.flight.y);
    shot.impact = Math.max(shot.launched + 0.01, shot.flight.at + distance / shot.speed);
    const fraction = distance
      ? Math.min(1, (Math.max(0, battle.elapsed - shot.flight.at) * shot.speed) / distance)
      : 1;
    shot.flight.x += (shot.x - shot.flight.x) * fraction;
    shot.flight.y += (shot.y - shot.flight.y) * fraction;
    shot.flight.at = Math.min(battle.elapsed, shot.impact);
    if (shot.impact > battle.elapsed + 1e-9) {
      pending.push(shot);
      continue;
    }
    const hit = !!target;
    const leg = shot.leg ?? 0;
    // A bounce leg has no target of its own: its splash resolves at the fixed bounce point.
    resolveHit(
      battle,
      defender,
      stats,
      leg ? undefined : target,
      shot,
      shot.air,
      shot.damage,
      shot.impact,
    );
    const record = defender.attacks.find((a) => a.n === shot.n);
    if (record && !leg)
      Object.assign(record, { hitAt: shot.impact, hitX: shot.x, hitY: shot.y, hit });
    else if (record)
      Object.assign(record, { bounceAt: shot.impact, bounceX: shot.x, bounceY: shot.y });
    effect({
      type: 'hit',
      sourceDefender: true,
      sourceId: defender.id,
      targetId: shot.targetId,
      x: shot.fromX,
      y: shot.fromY,
      toX: shot.x,
      toY: shot.y,
      fromAir: stats.flying,
      toAir: shot.air,
    });
    const bounce = shot.bounces?.shift();
    if (bounce) {
      // The boulder continues from its impact to the next fixed bounce point at the same speed.
      Object.assign(shot, {
        leg: leg + 1,
        fixed: true,
        targetId: -1,
        fromX: shot.x,
        fromY: shot.y,
        x: bounce.x,
        y: bounce.y,
        flight: { x: shot.x, y: shot.y, at: shot.impact },
        launched: shot.impact,
      });
      pending.push(shot);
    }
  }
  defender.shots = pending;
}

/** Friendly flying units that end a Baby Dragon's Tantrum. */
function flyingAlly(defender: Defender, other: Defender, at: number) {
  if (other === defender || other.hp <= 0) return false;
  if (other.kind === 'skeleton') return other.mode === 'air';
  if (!isGarrisonDefender(other)) return other.mode === 'air';
  return other.spawnedAt <= at && garrisonStats(other.kind, other.level).flying;
}

/** New defender branch only: archived Skeleton state and ordering remain unchanged. */
export function stepGarrisonDefender(
  battle: Battle,
  defender: Defender,
  dt: number,
  effect: (fx: FX) => void,
) {
  if (
    defender.kind === 'skeleton' ||
    defender.kind === 'guardian' ||
    defender.kind === 'repairer' ||
    defender.kind === 'hero'
  )
    return;
  const stats = lateDefenderStats(battle, defender, garrisonStats(defender.kind, defender.level));
  stepShots(battle, defender, effect);
  // Later families: effects already in progress resolve even if the defender dies or is stunned.
  if (stats.chain) stepChain(battle, defender, stats);
  if (defender.bolts) stepDeathBolts(battle, defender, stats);
  if (stats.aura) stepAura(battle, defender, stats);
  defender.attacking = false;
  if (defender.hp <= 0) {
    if (defender.defeatedAt !== undefined) {
      if (stats.secondary) spawnSecondaries(battle, defender, stats, spawnGarrisonDefender);
      if (stats.summon) killPendingSummons(battle, defender);
      if (stats.ability && !defender.bolts) {
        createDeathBolts(battle, defender, stats);
        if (defender.bolts) stepDeathBolts(battle, defender, stats);
      }
    }
    if (
      stats.deathDamage &&
      defender.defeatedAt !== undefined &&
      !defender.deathResolved &&
      battle.elapsed + 1e-9 >= defender.defeatedAt + stats.deathDelay
    ) {
      defender.deathResolved = true;
      for (const unit of battle.units)
        if (
          active(unit, defender.defeatedAt + stats.deathDelay) &&
          !TROOPS[unit.kind].flying &&
          distance2D(unit.x - defender.x, unit.y - defender.y) <= stats.deathRadius
        )
          unit.hp = Math.max(0, unit.hp - stats.deathDamage);
      effect({
        type: 'hit',
        sourceDefender: true,
        sourceId: defender.id,
        x: defender.x,
        y: defender.y,
        toX: defender.x,
        toY: defender.y,
        fromAir: true,
        toAir: false,
      });
    }
    return;
  }
  // Secondary troops and summons are pushed out first; summons then wait out SpawnIdle.
  if (
    defender.push &&
    battle.elapsed >= defender.spawnedAt &&
    stepPush(defender, battle.elapsed, dt)
  )
    return;
  const activeDt = Math.min(
    dt,
    Math.max(
      0,
      battle.elapsed -
        Math.max(
          defender.spawnedAt,
          defender.stunnedUntil ?? 0,
          defender.push ? defender.push.at + defender.push.duration : 0,
          defender.idleUntil ?? 0,
        ),
    ),
  );
  if (activeDt <= 0) return;
  const tantrum = garrisonTantrum(stats);
  if (tantrum)
    defender.tantrum = !(battle.defenders ?? []).some(
      (other) =>
        flyingAlly(defender, other, battle.elapsed) &&
        distance2D(other.x - defender.x, other.y - defender.y) <= tantrum.radius,
    );
  const raged = !!(tantrum && defender.tantrum);
  // Attack speed boosts advance the attack timer faster, as in the older engine's hit timer.
  const attackDt = raged ? activeDt * tantrum!.attackScale : activeDt;
  if (stats.split) defender.recovery = Math.max(0, (defender.recovery ?? 0) - attackDt);
  if (stats.summon) {
    // The summon check reads the target held going into this step (a 50 ms local offset).
    stepSummons(battle, defender, stats, attackDt, defender.target !== null, spawnGarrisonDefender);
    if (battle.elapsed + 1e-9 < defender.summon!.delayUntil) {
      // Summon attack delay: the Witch drops her target and neither moves nor attacks.
      defender.target = null;
      delete defender.engaged;
      defender.path = [];
      defender.cooldown = Math.max(0, defender.cooldown - attackDt);
      return;
    }
  }
  const stealth = garrisonStealth(stats);
  const concealed = !!stealth && (defender.stealthUntil ?? 0) > battle.elapsed;
  const long = garrisonLongShots(stats);
  const longShot = !!long && (defender.longShots ?? 0) < long.count;
  const range = longShot ? long!.range : stats.range;
  if (!stats.flying) defender.pathAt -= activeDt;
  const eligible = battle.units.filter(
    (unit) =>
      active(unit, battle.elapsed) &&
      !untargetable(battle, unit) &&
      (TROOPS[unit.kind].flying ? stats.airTargets : stats.groundTargets),
  );
  // PreferHeroes (Headhunter) restricts the candidate pool to Heroes whenever one is valid.
  const heroes = stats.preferHeroes ? eligible.filter((unit) => unit.hero) : [];
  const pool = heroes.length ? heroes : eligible;
  // The nearest unit, lowest id first on a tie: the same pick as sorting by (distance, id) and
  // taking the first, without the O(n log n) sort per defender per tick.
  let target = pool.find((unit) => unit.id === defender.target);
  if (!target) {
    let best = Infinity;
    for (const unit of pool) {
      const d = distanceSquared2D(unit.x - defender.x, unit.y - defender.y);
      if (d < best || (d === best && unit.id < target!.id)) {
        best = d;
        target = unit;
      }
    }
  }
  defender.cooldown = Math.max(0, defender.cooldown - attackDt);
  if (!target) {
    defender.target = null;
    delete defender.engaged;
    if (!stats.flying) defender.path = [];
    return;
  }
  if (defender.target !== target.id) {
    defender.target = target.id;
    delete defender.engaged;
    if (!stats.flying) {
      defender.path = [];
      defender.pathAt = 0;
    }
  }
  const distance = distance2D(target.x - defender.x, target.y - defender.y);
  // Split-timing families use the older LogicCombatComponent.IsInRange tolerance for character
  // targets (AttackRange + 256 units, half a tile) and approach to GetAttackDist (range - 1/16
  // tile, at least 1/16), so a slightly drifting target does not reset a long windup.
  const reach = stats.split ? range + 0.5 : range;
  const approach = stats.split ? Math.max(1 / 16, range - 1 / 16) : range;
  // The older hit timer resets on leaving range only while it is still zero: once a split
  // family's windup runs (engaged, recovery over), it completes on the same target while chasing.
  const committed = stats.split && !!defender.engaged && (defender.recovery ?? 0) <= 1e-9;
  if (distance > reach + 1e-6) {
    if (!committed) delete defender.engaged;
    // A concealed Royal Ghost ignores obstacles (walls and buildings) and walks straight.
    if (stats.flying || (concealed && stealth!.ignoreObstacles)) {
      const travel = Math.min(stats.speed * activeDt, distance - approach);
      defender.x += ((target.x - defender.x) / distance) * travel;
      defender.y += ((target.y - defender.y) / distance) * travel;
      if (!stats.flying) defender.path = [];
    } else {
      if (!defender.path.length || defender.pathAt <= 0) {
        defender.path = findPath(
          defender,
          target,
          nonWallBuildings(battle),
          approach,
          !!battle.nativeSubtiles,
        );
        defender.pathAt = 0.3;
      }
      followPath(defender, stats.speed, activeDt);
    }
    if (!committed || defender.cooldown > 1e-9) return;
  } else {
    if (!defender.engaged) {
      defender.engaged = true;
      // Split timing: any post-hit recovery still running precedes the new target's windup.
      defender.cooldown = Math.max(
        0,
        (stats.split ? (defender.recovery ?? 0) : 0) + stats.firstAttackDelay - attackDt,
      );
    }
    defender.attacking = true;
    if (!stats.flying) defender.path = [];
    if (defender.cooldown > 1e-9) return;
  }
  defender.cooldown = stats.rate;
  if (stats.split) defender.recovery = stats.recovery;
  defender.alerted = true;
  const air = !!TROOPS[target.kind].flying;
  const damage = raged ? stats.damage * tantrum!.damageScale : stats.damage;
  if (LEGACY_KINDS.has(defender.kind)) {
    const n = defender.attackCount ?? 0;
    defender.attackCount = n + 1;
    recordAttack(defender, {
      at: battle.elapsed,
      x: defender.x,
      y: defender.y,
      targetId: target.id,
      targetX: target.x,
      targetY: target.y,
      n,
    });
    const center = stats.selfAsAoeCenter ? defender : target;
    for (const unit of eligible)
      if (
        !!TROOPS[unit.kind].flying === !!TROOPS[target.kind].flying &&
        distance2D(unit.x - center.x, unit.y - center.y) <= stats.splash
      )
        unit.hp = Math.max(0, unit.hp - damage);
  } else {
    const n = defender.attackCount ?? 0;
    defender.attackCount = n + 1;
    const projectile = longShot ? long!.projectile : stats.projectile;
    if (longShot) defender.longShots = (defender.longShots ?? 0) + 1;
    recordAttack(defender, {
      at: battle.elapsed,
      x: defender.x,
      y: defender.y,
      targetId: target.id,
      targetX: target.x,
      targetY: target.y,
      n,
      air,
      ...(projectile ? { projectile } : {}),
      ...(longShot ? { long: true } : {}),
      ...(stats.chain ? { chain: [] } : {}),
    });
    if (projectile) {
      const shot: GarrisonShot = {
        n,
        projectile,
        speed: longShot ? long!.projectileSpeed : stats.projectileSpeed,
        targetId: target.id,
        fromX: defender.x,
        fromY: defender.y,
        x: target.x,
        y: target.y,
        flight: { x: defender.x, y: defender.y, at: battle.elapsed },
        launched: battle.elapsed,
        impact: battle.elapsed,
        air,
        damage,
        splash: stats.splash,
      };
      if (stats.projectileFixed) shot.fixed = true;
      const bounce = stats.bounce;
      const length = distance2D(target.x - defender.x, target.y - defender.y);
      if (bounce && bounce.impacts > 1 && length > 0) {
        // Bounce points continue along the throw from the target's launch position (older
        // LogicCombatComponent chain shooting); `ProjectileBounces` is read as total impacts.
        const ux = (target.x - defender.x) / length,
          uy = (target.y - defender.y) / length;
        shot.bounces = Array.from({ length: bounce.impacts - 1 }, (_, j) => ({
          x: target.x + ux * bounce.spacing * (j + 1),
          y: target.y + uy * bounce.spacing * (j + 1),
        }));
        shot.leg = 0;
      }
      (defender.shots ??= []).push(shot);
      return;
    }
    resolveHit(
      battle,
      defender,
      stats,
      target,
      stats.selfAsAoeCenter ? defender : target,
      air,
      damage,
      battle.elapsed,
    );
    const record = defender.attacks.at(-1)!;
    Object.assign(record, { hitAt: battle.elapsed, hitX: target.x, hitY: target.y, hit: true });
    if (stats.chain) startChain(defender, stats, n, target, damage, battle.elapsed);
  }
  effect({
    type: 'hit',
    sourceDefender: true,
    sourceId: defender.id,
    targetId: target.id,
    x: defender.x,
    y: defender.y,
    toX: target.x,
    toY: target.y,
    fromAir: stats.flying,
    toAir: air,
  });
}
