import { distance2D } from './distance';
import { TROOPS } from './data';
import type { Battle, Building, FX } from './model';
import { launchProjectile } from './projectiles';
import { XBOW, xbowProjectile, xbowRange, type XbowState } from './xbow-stats';
import { untargetable } from './spell-effects';

export function xbowState(battle: Battle, tower: Building): XbowState {
  return ((battle.xbows ??= {})[tower.id] ??= {
    ammunition: XBOW.ammunition,
    fired: 0,
    aimX: 1,
    aimY: 0,
    shots: [],
    hits: [],
  });
}

/** The fixed simulation samples eligibility; sustained shot clocks retain the 128 ms interval. */
export function stepXbow(
  battle: Battle,
  tower: Building,
  dt: number,
  damage: number,
  emit: (fx: FX) => void,
) {
  const state = xbowState(battle, tower);
  if (state.ammunition <= 0) {
    delete battle.defenseTargets[tower.id];
    return;
  }
  const center = { x: tower.x + 1.5, y: tower.y + 1.5 };
  const range = xbowRange(tower.xbowMode);
  const targets = battle.units.filter(
    (u) =>
      u.hp > 0 &&
      !untargetable(battle, u) &&
      (u.spawnedAt ?? 0) <= battle.elapsed &&
      (tower.xbowMode === 'both' || !TROOPS[u.kind].flying) &&
      distance2D(u.x - center.x, u.y - center.y) <= range,
  );
  const retained = targets.find((u) => u.id === battle.defenseTargets[tower.id]);
  const target =
    retained ??
    targets.sort(
      (a, b) =>
        distance2D(a.x - center.x, a.y - center.y) - distance2D(b.x - center.x, b.y - center.y),
    )[0];
  const cooling = tower.cooldown > 0;
  tower.cooldown = Math.max(-dt, tower.cooldown - dt);
  if (!target) {
    tower.cooldown = Math.max(0, tower.cooldown);
    delete battle.defenseTargets[tower.id];
    return;
  }
  state.aimX = target.x - center.x;
  state.aimY = target.y - center.y;
  battle.defenseTargets[tower.id] = target.id;
  if (tower.cooldown > 1e-9) return;
  // A newly acquired target was not known to be eligible earlier in this step.
  // Idle time never becomes a backlog of shots against it.
  let at = battle.elapsed + (retained && cooling ? tower.cooldown : 0);
  while (at <= battle.elapsed + 1e-9 && state.ammunition > 0) {
    state.ammunition--;
    state.fired++;
    state.lastShotAt = at;
    state.shots.push({ at, index: state.fired });
    if (state.shots.length > 16) state.shots.shift();
    if (!state.ammunition) state.emptyAt = at;
    launchProjectile(
      battle,
      {
        weapon: 'xbowbolt',
        variant: xbowProjectile(tower.level),
        sequence: state.fired,
        sourceId: tower.id,
        targetId: target.id,
        targetBuilding: false,
        fromX: center.x,
        fromY: center.y,
        x: target.x,
        y: target.y,
        toAir: TROOPS[target.kind].flying,
        damage,
      },
      emit,
      at,
    );
    at += XBOW.interval;
  }
  tower.cooldown = Math.max(0, at - battle.elapsed);
}
