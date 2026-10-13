import { hurtUnit, unitTriggersTraps } from './native-status';
import { distance2D } from './distance';
import { BUILDINGS, TROOPS, springCapacity, trapStats } from './data';
import type { Battle, Building, FX, Unit } from './model';
import { PUMPKIN_BOMB } from './pumpkin-bomb';
import { NPC_BUILDINGS } from './npc-buildings';
import { SPRING_AIRTIME } from './trap-stats';
import { SKELETON_TRAP, skeletonCount } from './skeleton-stats';
import { spawnSkeleton } from './defenders';
import { SANTA_TRAP, makeSantaState, stepSanta, type SantaState } from './santa-trap';
import { recordSeekingMineTrail, type SeekingMineFlight } from './seeking-mine-flight';
import { SHRINK_TRAP, makeShrinkState, stepShrink, type ShrinkState } from './shrink-trap';
import { NATIVE_TRAP_SOURCE, fling, nativeTrapValues, stepNativeTrap } from './native-traps';
import { isLateBuilding } from './late-campaign';

/** Battle-only state. A home trap is always armed when a fresh attack starts. */
export interface TrapState {
  activatedAt: number;
  resolved: boolean;
  targetId: number;
  x: number;
  y: number;
  spawned?: number;
  santa?: SantaState;
  mine?: SeekingMineFlight;
  shrink?: ShrinkState;
}

export function springOutcome(housing: number, hp: number, capacity: number, damage: number) {
  const ejected = housing <= capacity || hp <= damage;
  return { ejected, hp: ejected ? 0 : hp - damage };
}

/** Resolve campaign identity before archetype, keeping seasonal traps out of the home catalog. */
export function battleTrapStats(trap: Pick<Building, 'kind' | 'level' | 'npc'>, battle?: Battle) {
  const base = trapStats(trap.kind, trap.level);
  if (base && trap.npc === 'pumpkin-bomb') return { ...base, ...PUMPKIN_BOMB };
  if (base && trap.npc === 'santa-trap') return { ...base, ...SANTA_TRAP };
  if (base && trap.npc === 'shrink-trap') return { ...base, ...SHRINK_TRAP };
  if (
    base &&
    battle?.nativeRoster &&
    !trap.npc &&
    battle.catalog !== 'goblin-v1' &&
    NATIVE_TRAP_SOURCE[trap.kind]
  ) {
    // Version 45: every level's values come from the client rows (Town Hall 9-18 levels included).
    const values = nativeTrapValues(trap.kind, trap.level);
    return {
      ...base,
      damage: values.damage,
      radius: values.radius || base.radius,
      trigger: values.trigger || base.trigger,
      ...(base.springCapacity ? { springCapacity: values.ejectHousing } : {}),
      ...(values.pushback
        ? { pushback: values.pushback, pushbackHousing: values.pushbackHousing }
        : {}),
    };
  }
  return base;
}

/** Native-engine home traps (version 51+): stepped by `stepNativeTrap`, not below. */
const nativeOwnedTrap = (battle: Battle, trap: Building) =>
  !!battle.nativeRoster &&
  !trap.npc &&
  battle.catalog !== 'goblin-v1' &&
  (trap.kind === 'tornadotrap' || trap.kind === 'gigabomb');
/**
 * The buildings stepTraps can act on, in list order, with their battle stats. Everything
 * else (walls, defenses, late family traps) is skipped by the loop without side effects.
 * Stats depend only on the trap row and the battle's catalog flags, so one row per battle
 * replaces a freshly spread object per trap per tick.
 */
interface TrapIndex {
  buildings: Building[];
  length: number;
  traps: { trap: Building; stats: ReturnType<typeof battleTrapStats> | null }[];
}
const trapIndexes = new WeakMap<Battle, TrapIndex>();
function trapIndex(battle: Battle): TrapIndex {
  const known = trapIndexes.get(battle);
  if (known && known.buildings === battle.buildings && known.length === battle.buildings.length)
    return known;
  const traps: TrapIndex['traps'] = [];
  for (const trap of battle.buildings) {
    if (nativeOwnedTrap(battle, trap)) traps.push({ trap, stats: null });
    else if (!isLateBuilding(trap)) {
      const stats = battleTrapStats(trap, battle);
      if (stats) traps.push({ trap, stats });
    }
  }
  const index = { buildings: battle.buildings, length: battle.buildings.length, traps };
  trapIndexes.set(battle, index);
  return index;
}
export function stepTraps(battle: Battle, dt: number, effect: (fx: FX) => void) {
  if (battle.finished) return false;
  let changed = false;
  // Id lookup over the units present when the phase began (built on first use: most ticks
  // have no armed homing, air or spring trap to resolve).
  const unitsAtStart = battle.units,
    unitCount = unitsAtStart.length;
  let units: Map<number, Unit> | undefined;
  const unitById = (id: number) => {
    if (!units) {
      units = new Map();
      for (let i = 0; i < unitCount; i++) units.set(unitsAtStart[i].id, unitsAtStart[i]);
    }
    return units.get(id);
  };
  // Unit position grid for trigger searches: every unresolved trap scans for units
  // in its trigger circle each tick. Refs are shared so eligibility stays live;
  // only positions can go stale. In-phase movers (bomb fling, native tornado
  // pulls) clear it so later traps rebuild from live positions.
  const CELL = 4;
  // Numeric cell keys; units stay within a few tiles of the 48-tile map.
  const cellKey = (cx: number, cy: number) => (cx + 1024) * 4096 + (cy + 1024);
  let grid: Map<number, Unit[]> | null = null;
  const ensureGrid = () => {
    if (grid) return grid;
    grid = new Map();
    for (const u of battle.units) {
      const key = cellKey(Math.floor(u.x / CELL), Math.floor(u.y / CELL));
      let list = grid.get(key);
      if (!list) grid.set(key, (list = []));
      list.push(u);
    }
    return grid;
  };
  const nearUnits = (x: number, y: number, r: number): Unit[] => {
    const g = ensureGrid();
    const out: Unit[] = [];
    for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++)
      for (let cy = Math.floor((y - r) / CELL); cy <= Math.floor((y + r) / CELL); cy++) {
        const list = g.get(cellKey(cx, cy));
        if (list) for (const u of list) out.push(u);
      }
    return out;
  };
  for (const { trap, stats } of trapIndex(battle).traps) {
    // From version 51 the native engine owns the Town Hall 11+ traps at home. A campaign
    // layout's own traps stay with the late family that has always stepped them.
    if (stats === null) {
      if (!trap.constructing && !trap.upgradeEnd) {
        if (stepNativeTrap(battle, trap, effect)) {
          changed = true;
          // A tornado pull moves units mid-loop; later traps rebuild from live positions.
          grid = null;
        }
      }
      continue;
    }
    // Late campaign traps trigger in their own family phase (never indexed).
    let state = battle.traps[trap.id];
    if (trap.constructing || trap.upgradeEnd || state?.resolved) continue;
    const d = stats!;
    const mode = trap.kind === 'skeletontrap' ? (trap.skeletonMode ?? 'ground') : d.targets;
    const center = {
      x: trap.x + BUILDINGS[trap.kind].size / 2,
      y: trap.y + BUILDINGS[trap.kind].size / 2,
    };
    const eligible = (u: Unit) =>
      u.hp > 0 &&
      unitTriggersTraps(u) &&
      (trap.npc !== 'shrink-trap' || (!u.ejected && (u.spawnedAt ?? 0) <= battle.elapsed)) &&
      (u.hero ? 25 : TROOPS[u.kind].space) >= (d.minHousing ?? 0) &&
      (!d.springCapacity || (u.springUntil ?? 0) <= battle.elapsed) &&
      (mode === 'both' || !!TROOPS[u.kind].flying === (mode === 'air'));
    if (!state) {
      // Min-scan with the old sort's winner (spring housing, distance, id).
      let pick: Unit | undefined;
      let pickSpace = -Infinity;
      let pickDist = Infinity;
      for (const u of nearUnits(center.x, center.y, d.trigger)) {
        if (!eligible(u)) continue;
        const dist = distance2D(u.x - center.x, u.y - center.y);
        if (dist > d.trigger) continue;
        const space = u.hero ? 25 : TROOPS[u.kind].space;
        const lead = d.springCapacity ? space - pickSpace : 0;
        if (
          pick === undefined ||
          lead > 0 ||
          (lead === 0 && (dist < pickDist || (dist === pickDist && u.id < (pick as Unit).id)))
        ) {
          pick = u;
          pickSpace = space;
          pickDist = dist;
        }
      }
      const target = pick;
      if (!target) continue;
      state = battle.traps[trap.id] = {
        activatedAt: battle.elapsed,
        resolved: false,
        targetId: target.id,
        ...center,
      };
      if (trap.npc === 'santa-trap') state.santa = makeSantaState(state, trap.id, battle.seed);
      if (trap.npc === 'shrink-trap') state.shrink = makeShrinkState(state);
      if (d.homingSpeed) state.mine = { trail: [], nextTrail: 0 };
      // Springs resolve immediately and provide their own label and sound below.
      if (!d.springCapacity && trap.npc !== 'santa-trap' && trap.npc !== 'shrink-trap')
        effect({
          type: 'trap',
          sourceId: trap.id,
          ...center,
          text: trap.npc ? NPC_BUILDINGS[trap.npc].name : BUILDINGS[trap.kind].name,
          color: mode === 'air' ? 0xff746c : 0xffd175,
        });
      changed = true;
    }
    if (state.santa) {
      changed = stepSanta(battle, state) || changed;
      continue;
    }
    if (state.shrink) {
      changed = stepShrink(battle, state) || changed;
      continue;
    }
    if (trap.kind === 'skeletontrap') {
      const count =
        battle.nativeRoster && !trap.npc && battle.catalog !== 'goblin-v1'
          ? nativeTrapValues('skeletontrap', trap.level).spawns
          : skeletonCount(trap.level);
      while ((state.spawned ?? 0) < count) {
        const index = state.spawned ?? 0,
          at = state.activatedAt + SKELETON_TRAP.firstSpawn + index * SKELETON_TRAP.spawnInterval;
        if (at > battle.elapsed + 1e-9) break;
        spawnSkeleton(battle, trap, at, index);
        state.spawned = index + 1;
        changed = true;
      }
      if (state.spawned === count) state.resolved = true;
      continue;
    }
    if (d.homingSpeed) {
      const flight = (state.mine ??= { trail: [], nextTrail: 0 });
      // A mine follows one live air target; loss of that target consumes the shot.
      const homing = unitById(state.targetId);
      const target = homing && eligible(homing) ? homing : undefined;
      if (!target) {
        state.resolved = true;
        flight.resolvedAt = battle.elapsed;
        flight.hit = false;
        changed = true;
        continue;
      }
      const flightDt = Math.min(dt, Math.max(0, battle.elapsed - state.activatedAt - d.delay));
      if (flightDt <= 0) continue;
      const x = target.x - state.x,
        y = target.y - state.y;
      const distance = distance2D(x, y),
        travel = d.homingSpeed * flightDt;
      const from = { x: state.x, y: state.y },
        start = battle.elapsed - flightDt;
      if (distance > travel + 1e-9) {
        state.x += (x / distance) * travel;
        state.y += (y / distance) * travel;
        recordSeekingMineTrail(
          flight,
          state.activatedAt + d.delay,
          start,
          battle.elapsed,
          battle.elapsed,
          from,
          state,
          false,
        );
        continue;
      }
      state.x = target.x;
      state.y = target.y;
      flight.resolvedAt = start + distance / d.homingSpeed;
      flight.hit = true;
      recordSeekingMineTrail(
        flight,
        state.activatedAt + d.delay,
        start,
        flight.resolvedAt,
        battle.elapsed,
        from,
        state,
        true,
      );
      hurtUnit(battle, target, d.damage, battle.elapsed, undefined, true);
      state.resolved = true;
      changed = true;
      effect({
        type: 'blast',
        sourceId: trap.id,
        x: state.x,
        y: state.y,
        radius: 0.6,
        toAir: true,
        color: 0xff3c46,
      });
      continue;
    }
    if (d.targets === 'air') {
      if (battle.elapsed + 1e-9 < state.activatedAt + d.delay) continue;
      const target = unitById(state.targetId);
      if (target) {
        const remaining = Math.max(dt, state.activatedAt + d.delay - battle.elapsed + dt);
        const fraction = Math.min(1, dt / remaining);
        state.x += (target.x - state.x) * fraction;
        state.y += (target.y - state.y) * fraction;
      }
    }
    if (battle.elapsed + 1e-9 < state.activatedAt + d.delay) continue;
    state.resolved = true;
    changed = true;
    const power = d.damage;
    if (d.springCapacity) {
      const springing = unitById(state.targetId);
      const target = springing && eligible(springing) ? springing : undefined;
      if (!target) continue;
      const outcome = target.hero
        ? { ejected: false, hp: Math.max(0, target.hp - power * 0.5) }
        : springOutcome(TROOPS[target.kind].space, target.hp, springCapacity(trap.level), power);
      target.hp = outcome.hp;
      target.ejected = outcome.ejected;
      if (outcome.ejected)
        target.spent = true; // No death bomb from a troop flung out of the village.
      else {
        target.springUntil = battle.elapsed + SPRING_AIRTIME;
        target.attacking = false;
        target.path = [];
        target.pathAt = 0;
      }
      effect({ type: 'spring', x: target.x, y: target.y });
    } else {
      for (const u of battle.units)
        if (eligible(u) && distance2D(u.x - state.x, u.y - state.y) <= d.radius) {
          hurtUnit(battle, u, power, battle.elapsed, undefined, true);
          // Version 45: bombs push small troops (Pushback / PushbackHousingLimit).
          if (
            'pushback' in d &&
            d.pushback &&
            u.hp > 0 &&
            (u.hero ? 25 : TROOPS[u.kind].space) <=
              ((d as { pushbackHousing?: number }).pushbackHousing ?? 0)
          ) {
            fling(battle, u, state.x, state.y, d.pushback as number);
            grid = null; // Positions moved: later trigger searches rebuild.
          }
        }
      effect({
        type: 'blast',
        x: state.x,
        y: state.y,
        radius: d.radius,
        toAir: d.targets === 'air',
        color: d.targets === 'air' ? 0xff7065 : 0xff9a3c,
      });
    }
  }
  return changed;
}
