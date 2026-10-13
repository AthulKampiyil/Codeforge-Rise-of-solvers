import { distance2D } from './distance';
import { BUILDINGS, TROOPS, type BuildingKind } from './data';
import { MAP_SIZE } from './grid';
import { flag, nativeGlobal, nativeRow, num, seconds, text, tiles } from './native-data';
import { castNativeSpell, type NativeSpellCast } from './native-spells';
import { hurtUnit, unitTriggersTraps } from './native-status';
import type { Battle, Building, FX, Unit } from './model';

/**
 * Version 45+ trap rules from client 18.400.21 traps.csv. Legacy traps keep their original
 * trigger flow; only their level values (damage, radius, spring capacity, skeleton count)
 * come from these rows so Town Hall 9-18 levels are no longer empty.
 */
export const NATIVE_TRAP_SOURCE: Partial<Record<BuildingKind, string>> = {
  bomb: 'Bomb',
  giantbomb: 'Giant Bomb',
  airbomb: 'Air Bomb',
  springtrap: 'Spring Trap',
  seekingairmine: 'Seeking Air Mine',
  skeletontrap: 'Skeleton Trap',
  tornadotrap: 'Tornado Trap',
  gigabomb: 'Giga Bomb',
};
export const trapRow = (kind: BuildingKind, level: number) =>
  nativeRow('traps', NATIVE_TRAP_SOURCE[kind]!, level);

export function nativeTrapValues(kind: BuildingKind, level: number) {
  const row = trapRow(kind, level);
  return {
    damage: num(row, 'Damage'),
    radius: tiles(row, 'DamageRadius'),
    trigger: tiles(row, 'TriggerRadius'),
    minHousing: num(row, 'MinTriggerHousingLimit'),
    ejectHousing: num(row, 'EjectHousingLimit'),
    spawns: num(row, 'NumSpawns'),
    pushback: tiles(row, 'Pushback'),
    pushbackHousing: num(row, 'PushbackHousingLimit'),
    throwDistance: tiles(row, 'RadialThrowDistance'),
    throwRadius: tiles(row, 'RadialThrowRadius'),
    heroReduction: num(row, 'HeroDamageReductionPercent') / 100,
    spell: text(row, 'Spell'),
    duration: seconds(row, 'DurationMS'),
    visible: flag(row, 'Visible'),
    air: flag(row, 'AirTrigger'),
    ground: flag(row, 'GroundTrigger'),
  };
}

const housing = (u: Unit) => (u.hero ? 25 : TROOPS[u.kind].space);
const center = (b: Building) => ({
  x: b.x + BUILDINGS[b.kind].size / 2,
  y: b.y + BUILDINGS[b.kind].size / 2,
});
const live = (u: Unit, at: number) =>
  u.hp > 0 && !u.ejected && (u.spawnedAt ?? 0) <= at + 1e-9 && !u.native?.recalled;

/** Giga Bomb stays on the map for attackers; other traps hide until triggered. */
export const alwaysVisibleTrap = (battle: Battle, b: Building) =>
  !!battle.nativeRoster && !b.npc && b.kind === 'gigabomb' && battle.catalog !== 'goblin-v1';

/**
 * Tornado Trap and Giga Bomb. Returns true when battle state changed.
 * Tornado: any ground or air unit inside the trigger radius starts the Tornado Trap spell.
 * Giga Bomb: the combined housing inside the trigger radius must reach MinTriggerHousingLimit.
 */
export function stepNativeTrap(battle: Battle, trap: Building, effect: (fx: FX) => void): boolean {
  const values = nativeTrapValues(trap.kind, trap.level);
  const c = center(trap);
  const at = battle.elapsed;
  let state = battle.traps[trap.id];
  if (state?.resolved) return false;
  const eligible = (u: Unit) =>
    live(u, at) &&
    unitTriggersTraps(u) &&
    (TROOPS[u.kind].flying ? values.air : values.ground) &&
    distance2D(u.x - c.x, u.y - c.y) <= values.trigger + 1e-9;
  if (!state) {
    let total = 0;
    let firstId: number | undefined;
    let count = 0;
    for (const u of battle.units) {
      if (!eligible(u)) continue;
      count++;
      total += housing(u);
      if (firstId === undefined || u.id < firstId) firstId = u.id;
    }
    const needed = trap.kind === 'gigabomb' ? values.minHousing : 1;
    if (!count || total < needed) return false;
    state = battle.traps[trap.id] = {
      activatedAt: at,
      resolved: false,
      targetId: firstId!,
      ...c,
    };
    effect({
      type: 'trap',
      sourceId: trap.id,
      ...c,
      text: BUILDINGS[trap.kind].name,
      color: trap.kind === 'gigabomb' ? 0xff5a2a : 0xbfe6ff,
    });
    if (trap.kind === 'tornadotrap') {
      castNativeSpell(battle, values.spell, trap.level, 'defense', c.x, c.y, { at });
      state.resolved = true;
    }
    return true;
  }
  if (trap.kind !== 'gigabomb') return false;
  const delay = BUILDINGS.gigabomb.trap!.delay;
  if (at + 1e-9 < state.activatedAt + delay) return false;
  state.resolved = true;
  const when = state.activatedAt + delay;
  for (const u of battle.units) {
    if (!live(u, when) || u.native?.burrowed) continue;
    const d = distance2D(u.x - c.x, u.y - c.y);
    if (d > values.radius + 1e-9) continue;
    hurtUnit(battle, u, values.damage, when, undefined, true);
    if (d <= values.throwRadius + 1e-9 && !u.native?.siege && u.hp > 0)
      fling(battle, u, c.x, c.y, values.throwDistance);
    u.target = null;
    u.path = [];
    u.pathAt = 0;
  }
  effect({ type: 'blast', x: c.x, y: c.y, radius: values.radius, color: 0xff5a2a, major: true });
  return true;
}

/** Radial throw: ground units stop before solid footprints; flyers travel freely. */
export function fling(battle: Battle, u: Unit, x: number, y: number, distance: number) {
  const dx = u.x - x,
    dy = u.y - y,
    d = distance2D(dx, dy);
  const nx = d > 1e-9 ? dx / d : 1,
    ny = d > 1e-9 ? dy / d : 0;
  const flying = !!TROOPS[u.kind].flying;
  // Solid footprints once per throw; the unit's own motion does not move buildings.
  const solids: { x0: number; x1: number; y0: number; y1: number }[] = [];
  if (!flying)
    for (const b of battle.buildings) {
      if (b.hp <= 0 || BUILDINGS[b.kind].trap) continue;
      const size = BUILDINGS[b.kind].size;
      solids.push({ x0: b.x, x1: b.x + size, y0: b.y, y1: b.y + size });
    }
  let travel = 0;
  while (travel + 0.1 <= distance + 1e-9) {
    const px = u.x + nx * (travel + 0.1),
      py = u.y + ny * (travel + 0.1);
    if (px < 0.5 || py < 0.5 || px > MAP_SIZE - 0.5 || py > MAP_SIZE - 0.5) break;
    let blocked = false;
    for (const s of solids) {
      if (px > s.x0 && px < s.x1 && py > s.y0 && py < s.y1) {
        blocked = true;
        break;
      }
    }
    if (blocked) break;
    travel += 0.1;
  }
  if (travel <= 1e-9) return;
  const time = 0.3;
  u.airPush = { x: (nx * travel) / time, y: (ny * travel) / time, remaining: time };
}

/**
 * Tornado pulse. Each unit's weight class is housing / 3 rounded up (max 5); heroes and pets are
 * class 5 and siege machines use TORNADO_SIEGE_FORCE_TIER. TornadoForceN (ground) and
 * TornadoForceAirN are read as pull speeds in hundredths of a tile per second, applied at 100%
 * inside TornadoInnerRadius and TornadoOuterForcePercent outside it; TornadoRotationSpeed
 * (degrees per second) swirls units around the center. Underground units take damage only.
 */
export function tornadoPulse(
  battle: Battle,
  cast: NativeSpellCast,
  row: Readonly<Record<string, string>>,
  at: number,
  radius: number,
) {
  const interval = cast.interval || 0.128;
  const inner = tiles(row, 'TornadoInnerRadius');
  const siegeTier = nativeGlobal('TORNADO_SIEGE_FORCE_TIER', 1);
  // Solid footprints once per pulse; buildings do not move mid-pulse.
  const solids: { x0: number; x1: number; y0: number; y1: number }[] = [];
  for (const b of battle.buildings) {
    if (b.hp <= 0 || BUILDINGS[b.kind].trap || b.kind === 'wall') continue;
    const size = BUILDINGS[b.kind].size;
    solids.push({ x0: b.x, x1: b.x + size, y0: b.y, y1: b.y + size });
  }
  for (const u of battle.units) {
    if (!live(u, at)) continue;
    const dx = u.x - cast.x,
      dy = u.y - cast.y,
      d = distance2D(dx, dy);
    if (d > radius + 1e-9) continue;
    if (num(row, 'Damage') > 0) hurtUnit(battle, u, num(row, 'Damage'), at, undefined, true);
    if (u.native?.burrowed || u.hp <= 0 || d < 1e-6) continue;
    const tier = u.native?.siege
      ? siegeTier
      : u.hero
        ? 5
        : Math.max(1, Math.min(5, Math.ceil(housing(u) / 3)));
    const flying = !!TROOPS[u.kind].flying;
    const force = num(row, `${flying ? 'TornadoForceAir' : 'TornadoForce'}${tier}`) / 100;
    const scale =
      (d <= inner
        ? num(row, 'TornadoInnerForcePercent', 100)
        : num(row, 'TornadoOuterForcePercent', 100)) / 100;
    const pull = Math.min(
      d,
      force * scale * interval * (num(row, 'TornadoSpeedTowardsCenter', 100) / 100),
    );
    // Rational (Cayley) rotation by tan(half angle) ≈ half the turned arc, like
    // tornadoCarryPoint: only correctly rounded arithmetic and square roots run,
    // so replays agree across browser engines whose sin/cos/atan2 may differ.
    const half = (((num(row, 'TornadoRotationSpeed') * Math.PI) / 180) * interval * scale) / 2,
      denominator = 1 + half * half;
    const cos = (1 - half * half) / denominator,
      sin = (2 * half) / denominator;
    const nd = d - pull,
      spin = nd / d;
    const tx = cast.x + (dx * cos - dy * sin) * spin,
      ty = cast.y + (dx * sin + dy * cos) * spin;
    if (!flying) {
      let blocked = false;
      for (const s of solids) {
        if (tx > s.x0 && tx < s.x1 && ty > s.y0 && ty < s.y1) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
    }
    u.x = tx;
    u.y = ty;
    u.path = [];
    u.pathAt = 0;
  }
}
