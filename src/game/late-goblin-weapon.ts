import { TROOPS } from './data';
import { distance2D } from './distance';
import type { Battle, Unit } from './model';

/**
 * Building weapons of the late Goblin campaign (Goblin Hall, Goblin Boss Town Hall and the
 * armed Builder's Hut) run on integer 64-ms combat ticks, like the retained Inferno scheduler.
 * The per-slot hit timer follows the documented older LogicCombatComponent convention: a new
 * target starts at NewTargetAttackDelay (absent = 0), every tick adds 64 ms, and a hit keeps
 * min(timer - AttackSpeed, AttackSpeed). Modern executable timing remains unverified.
 */
export const WEAPON_TICK_MS = 64;
export const weaponTickTime = (tick: number) => (tick * WEAPON_TICK_MS) / 1000;
/** First tick strictly after `seconds`; the battle's first tick is 64 ms after combat starts. */
export const firstWeaponTickAfter = (seconds: number) =>
  Math.floor((Math.max(0, seconds) * 1000) / WEAPON_TICK_MS + 1e-9) + 1;

export interface WeaponSlot {
  targetId: number | null;
  chargeMs: number;
}
export interface WeaponProfile {
  /** Tiles from the footprint center. */
  range: number;
  intervalMs: number;
  air: boolean;
  ground: boolean;
}
export const emptyWeaponSlots = (count: number): WeaponSlot[] =>
  Array.from({ length: count }, () => ({ targetId: null, chargeMs: 0 }));

/** Living attackers the weapon may hit at `at`, nearest first with a stable ID tie break. */
export function weaponCandidates(
  battle: Battle,
  center: { x: number; y: number },
  profile: WeaponProfile,
  at: number,
) {
  // One distance per unit instead of two per comparison; the same values sort the same way.
  const scored: { unit: Unit; dist: number }[] = [];
  for (const unit of battle.units) {
    if (
      unit.hp <= 0 ||
      unit.ejected ||
      (unit.spawnedAt ?? 0) > at + 1e-9 ||
      !(TROOPS[unit.kind].flying ? profile.air : profile.ground)
    )
      continue;
    const dist = distance2D(unit.x - center.x, unit.y - center.y);
    if (dist <= profile.range) scored.push({ unit, dist });
  }
  scored.sort((a, b) => a.dist - b.dist || a.unit.id - b.unit.id);
  return scored.map((entry) => entry.unit);
}

/**
 * One combat tick. Slots keep their targets while still eligible, never share a target, and
 * fill in slot order. `increment` is 64 ms scaled by a defensive attack-rate boost.
 */
export function tickWeaponSlots(
  slots: WeaponSlot[],
  candidates: readonly Unit[],
  increment: number,
  intervalMs: number,
) {
  const eligible = new Set(candidates.map((unit) => unit.id));
  const used = new Set<number>();
  for (const slot of slots)
    if (slot.targetId !== null && eligible.has(slot.targetId) && !used.has(slot.targetId))
      used.add(slot.targetId);
    else {
      slot.targetId = null;
      slot.chargeMs = 0;
    }
  for (const slot of slots) {
    if (slot.targetId !== null) continue;
    const target = candidates.find((unit) => !used.has(unit.id));
    if (!target) break;
    slot.targetId = target.id;
    slot.chargeMs = 0;
    used.add(target.id);
  }
  const fires: { slot: number; target: Unit }[] = [];
  slots.forEach((slot, index) => {
    if (slot.targetId === null) return;
    slot.chargeMs += increment;
    if (slot.chargeMs < intervalMs) return;
    slot.chargeMs = Math.min(slot.chargeMs - intervalMs, intervalMs);
    fires.push({ slot: index, target: candidates.find((unit) => unit.id === slot.targetId)! });
  });
  return fires;
}

export interface LateProjectile {
  id: string;
  sourceId: number;
  index: number;
  slot: number;
  targetId: number;
  toAir: boolean;
  fromX: number;
  fromY: number;
  /** Current destination: the tracked target, or the fixed launch aim of a non-tracking bomb. */
  x: number;
  y: number;
  /** Actual flight position at `flightAt`, retained for tracking projectiles. */
  flightX: number;
  flightY: number;
  flightAt: number;
  launched: number;
  impact: number;
  damage: number;
  /** Tiles per second. */
  speed: number;
  tracking: boolean;
  /** Ground splash radius in tiles; zero is a single-target hit. */
  splash: number;
}
export function launchLateProjectile(
  shot: Omit<LateProjectile, 'id' | 'flightX' | 'flightY' | 'flightAt' | 'impact'>,
): LateProjectile {
  const distance = distance2D(shot.x - shot.fromX, shot.y - shot.fromY);
  return {
    ...shot,
    id: `${shot.sourceId}:${shot.index}`,
    flightX: shot.fromX,
    flightY: shot.fromY,
    flightAt: shot.launched,
    impact: shot.launched + Math.max(0.01, distance / shot.speed),
  };
}

/** Tracking projectiles advance a bounded distance per sample, like source-speed X-Bow bolts. */
function advance(battle: Battle, p: LateProjectile) {
  if (!p.tracking) return;
  const target = battle.units.find((u) => u.id === p.targetId && u.hp > 0 && !u.ejected);
  if (target) {
    p.x = target.x;
    p.y = target.y;
  }
  const distance = distance2D(p.x - p.flightX, p.y - p.flightY);
  p.impact = Math.max(p.launched + 0.01, p.flightAt + distance / p.speed);
  const fraction = distance
    ? Math.min(1, (Math.max(0, battle.elapsed - p.flightAt) * p.speed) / distance)
    : 1;
  p.flightX += (p.x - p.flightX) * fraction;
  p.flightY += (p.y - p.flightY) * fraction;
  p.flightAt = Math.min(battle.elapsed, p.impact);
}

export interface LateProjectileHit {
  projectile: LateProjectile;
  /** Attackers damaged by this impact. */
  struck: Unit[];
}
/** Resolve due projectiles once, in impact order, even if the source building has fallen. */
export function stepLateProjectiles(battle: Battle, projectiles: LateProjectile[]) {
  for (const p of projectiles) advance(battle, p);
  const hits: LateProjectileHit[] = [];
  const pending: LateProjectile[] = [];
  const due = new Set<LateProjectile>();
  for (const p of projectiles)
    if (p.impact <= battle.elapsed + 1e-9) due.add(p);
    else pending.push(p);
  for (const p of [...due].sort(
    (a, b) => a.impact - b.impact || a.sourceId - b.sourceId || a.index - b.index,
  )) {
    const struck: Unit[] = [];
    if (p.splash > 0) {
      for (const unit of battle.units)
        if (
          unit.hp > 0 &&
          !unit.ejected &&
          (unit.spawnedAt ?? 0) <= p.impact + 1e-9 &&
          !!TROOPS[unit.kind].flying === p.toAir &&
          distance2D(unit.x - p.x, unit.y - p.y) <= p.splash
        ) {
          unit.hp -= p.damage;
          struck.push(unit);
        }
    } else {
      const target = battle.units.find(
        (u) =>
          u.id === p.targetId && u.hp > 0 && !u.ejected && (u.spawnedAt ?? 0) <= p.impact + 1e-9,
      );
      if (target) {
        target.hp -= p.damage;
        struck.push(target);
      }
    }
    hits.push({ projectile: p, struck });
  }
  return { pending, hits };
}
