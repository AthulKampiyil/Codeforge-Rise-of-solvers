import { distance2D } from './distance';
import type { Battle, Building, FX } from './model';
import { TROOPS } from './data';
import { ARCHER_TOWER } from './archer-tower-stats';
import { towerArcherAttackTiming } from './archer-tower-art';
import { launchProjectile, type CombatProjectile } from './projectiles';
import { untargetable } from './spell-effects';
export interface ArcherTowerWindup {
  readyAt: number;
  pending?: { targetId: number; startedAt: number; releaseAt: number };
}
export function recordArcherTowerShot(b: Battle, tower: Building, p: CombatProjectile) {
  (b.archerTowerShots ??= {})[tower.id] = { at: p.launched, x: p.x, y: p.y };
  b.archerTowerReleases = (b.archerTowerReleases ?? []).filter((shot) => p.launched - shot.at < 2);
  b.archerTowerReleases.push({ id: tower.id, level: tower.level, at: p.launched });
}
/** Version-42 local scheduling policy: full initial draw, fixed release cadence,
 * cancel draws on target loss/stun and restart after recovery. Native executable delay is unverified.
 */
export function stepArcherTower(
  b: Battle,
  tower: Building,
  dt: number,
  enabled: boolean,
  damage: number,
  emit: (fx: FX) => void,
) {
  const state = (b.archerTowerWindups![tower.id] ??= {
    readyAt: b.elapsed + Math.max(0, tower.cooldown),
  });
  const active = Math.min(dt, Math.max(0, b.elapsed - (b.defenseStuns[tower.id] ?? 0)));
  if (!enabled || tower.constructing || tower.upgradeEnd || active < dt) {
    delete state.pending;
    state.readyAt += dt - active;
    tower.cooldown = Math.max(0, state.readyAt - b.elapsed);
    return;
  }
  const x = tower.x + 1.5,
    y = tower.y + 1.5;
  const targets = b.units.filter(
    (u) => u.hp > 0 && !untargetable(b, u) && distance2D(u.x - x, u.y - y) <= ARCHER_TOWER.range,
  );
  const target =
    targets.find((u) => u.id === b.defenseTargets[tower.id]) ??
    targets.sort((a, c) => distance2D(a.x - x, a.y - y) - distance2D(c.x - x, c.y - y))[0];
  if (!target) {
    delete state.pending;
    tower.cooldown = Math.max(0, state.readyAt - b.elapsed);
    return;
  }
  b.defenseTargets[tower.id] = target.id;
  const windup = towerArcherAttackTiming(tower.level).release;
  if (!state.pending || state.pending.targetId !== target.id) {
    const startedAt = Math.max(b.elapsed, state.readyAt - windup);
    state.pending = { targetId: target.id, startedAt, releaseAt: startedAt + windup };
  }
  const pending = state.pending;
  tower.cooldown = Math.max(0, pending.releaseAt - b.elapsed);
  if (pending.releaseAt > b.elapsed + 1e-9) return;
  const p = launchProjectile(
    b,
    {
      weapon: 'arrow',
      variant: tower.level,
      sourceId: tower.id,
      targetId: target.id,
      targetBuilding: false,
      fromX: x,
      fromY: y,
      x: target.x,
      y: target.y,
      toAir: TROOPS[target.kind].flying,
      damage,
    },
    emit,
    pending.releaseAt,
  );
  recordArcherTowerShot(b, tower, p);
  state.readyAt = pending.releaseAt + ARCHER_TOWER.interval;
  // Reserve the next draw now, so fixed-step boundaries do not stretch the source cadence.
  state.pending = {
    targetId: target.id,
    startedAt: state.readyAt - windup,
    releaseAt: state.readyAt,
  };
  tower.cooldown = Math.max(0, state.readyAt - b.elapsed);
}
