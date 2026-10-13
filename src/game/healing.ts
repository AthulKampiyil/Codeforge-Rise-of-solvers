import { distance2D, distanceSquared2D } from './distance';
import { TROOPS } from './data';
import type { Battle, Unit } from './model';
import { launchProjectile } from './projectiles';
import type { FX } from './model';

/** Supercell's HEAL_STACK_PERCENT and Healer records; see docs/LATE-TROOPS.md. */
export const HEALER_STACK = [1, 1, 0.9, 0.9, 0.7, 0.4, 0.1, 0] as const;
export const HEALER_HERO_SCALE = 0.55;
export const HEALER_RADIUS = 1.5;
const HEALER_RADIUS_SQ = HEALER_RADIUS * HEALER_RADIUS;
const groundAlly = (u: Unit) => u.hp > 0 && !TROOPS[u.kind].flying;
const distance = (a: Unit, b: Unit) => distance2D(a.x - b.x, a.y - b.y);
const distanceSq = (a: Unit, b: Unit) => distanceSquared2D(a.x - b.x, a.y - b.y);

/** Choose before movement so healers in the same update see the same group. */
export function prepareHealerTargets(battle: Battle) {
  // Early-return when no healers are on the field: avoids O(units²) clustering.
  if (!battle.units.some((u) => TROOPS[u.kind].healer && u.hp > 0)) return;
  const allies = battle.units.filter(groundAlly);
  if (!allies.length) return;
  const allyIds = new Set(allies.map((u) => u.id));
  // Cluster housing is only read when a healer picks a new target, and only for allies that
  // would win the pick: compute it lazily per ally from a spatial hash built on first use.
  // Housing space is always an integer, so differently-ordered sums match exactly.
  const CELL = HEALER_RADIUS;
  let cells: Map<number, Unit[]> | undefined;
  const clusterSpace = new Map<number, number>();
  const clusterOf = (target: Unit) => {
    const known = clusterSpace.get(target.id);
    if (known !== undefined) return known;
    if (!cells) {
      cells = new Map();
      for (const u of allies) {
        const key = Math.floor(u.x / CELL) * 4096 + Math.floor(u.y / CELL);
        const bucket = cells.get(key);
        if (bucket) bucket.push(u);
        else cells.set(key, [u]);
      }
    }
    const cx = Math.floor(target.x / CELL),
      cy = Math.floor(target.y / CELL);
    let space = 0;
    for (let gx = cx - 1; gx <= cx + 1; gx++)
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const bucket = cells.get(gx * 4096 + gy);
        if (!bucket) continue;
        for (const u of bucket)
          if (distanceSquared2D(u.x - target.x, u.y - target.y) <= HEALER_RADIUS_SQ)
            space += TROOPS[u.kind].space;
      }
    clusterSpace.set(target.id, space);
    return space;
  };
  for (const healer of battle.units) {
    if (!TROOPS[healer.kind].healer || healer.hp <= 0) continue;
    if (allyIds.has(healer.healTarget ?? -1)) continue;
    // Min-scan with the old sort's winner (distance + injury penalty, then id). The cluster
    // filter does not depend on the pick so far, so it runs only for would-be winners.
    let pick: Unit | undefined;
    let pickScore = Infinity;
    for (const target of allies) {
      const score = distance(healer, target) + (target.hp < target.maxHp ? 0 : 0.75);
      if (!(
        pick === undefined ||
        score < pickScore ||
        (score === pickScore && target.id < pick.id)
      ))
        continue;
      if (!target.hero && clusterOf(target) <= 2) continue;
      pick = target;
      pickScore = score;
    }
    healer.healTarget = pick?.id;
    healer.target = null;
    healer.path = [];
  }
}

export function stepHealer(
  battle: Battle,
  healer: Unit,
  stats: { speed: number; range: number; rate: number; heal?: number },
  dt: number,
  emit: (fx: FX) => void,
) {
  const target = battle.units.find((u) => u.id === healer.healTarget && groundAlly(u));
  if (!target) return;
  const range = distance(healer, target);
  if (range > stats.range + 1e-9) {
    const move = Math.min(stats.speed * dt, range - stats.range);
    healer.x += ((target.x - healer.x) / range) * move;
    healer.y += ((target.y - healer.y) / range) * move;
    return;
  }
  healer.attacking = true;
  if (healer.cooldown > 0) return;
  healer.cooldown = stats.rate;
  launchProjectile(
    battle,
    {
      weapon: 'healing',
      sourceId: healer.id,
      targetId: target.id,
      targetBuilding: false,
      fromX: healer.x,
      fromY: healer.y,
      x: target.x,
      y: target.y,
      fromAir: true,
      damage: stats.heal ?? 0,
      splash: HEALER_RADIUS,
    },
    emit,
  );
}

/** Unit lookup cached per battle tick: contributions run once per healed unit per pulse. */
const contributionCache = new WeakMap<
  Battle,
  { tick: number; count: number; byId: Map<number, Unit> }
>();
/** Stable source order applies the native marginal stacking curve to each recipient. */
export function healerContribution(battle: Battle, recipient: Unit, sourceId: number) {
  let cached = contributionCache.get(battle);
  if (!cached || cached.tick !== battle.elapsed || cached.count !== battle.units.length) {
    const byId = new Map<number, Unit>();
    for (const u of battle.units) byId.set(u.id, u);
    cached = { tick: battle.elapsed, count: battle.units.length, byId };
    contributionCache.set(battle, cached);
  }
  const byId = cached.byId;
  const sources = new Set([sourceId]);
  for (const healer of battle.units) {
    if (!TROOPS[healer.kind].healer || healer.hp <= 0) continue;
    const target = byId.get(healer.healTarget ?? -1);
    if (!target || !groundAlly(target)) continue;
    const healerRange = TROOPS.healer.range + 1e-9;
    if (
      target &&
      distanceSq(healer, target) <= healerRange * healerRange &&
      distanceSq(target, recipient) <= HEALER_RADIUS_SQ
    )
      sources.add(healer.id);
  }
  // A launched pulse remains a contributor if its source dies before landing.
  for (const shot of battle.projectiles ?? [])
    if (
      shot.weapon === 'healing' &&
      distance2D(shot.x - recipient.x, shot.y - recipient.y) <= HEALER_RADIUS
    )
      sources.add(shot.sourceId);
  const rank = [...sources].sort((a, b) => a - b).indexOf(sourceId);
  return HEALER_STACK[Math.min(rank, HEALER_STACK.length - 1)];
}
