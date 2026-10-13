import { hurtUnit } from './native-status';
import type { Battle, Building, MortarShell, FX } from './model';
import { TROOPS } from './data';
import { distance2D } from './distance';
import { MORTAR, mortarProjectileRow } from './mortar-stats';

export interface MortarShot extends MortarShell {
  index: number;
  level: number;
}
export interface MortarHit {
  index: number;
  level: number;
  at: number;
  x: number;
  y: number;
}
export interface MortarAttackState {
  fired: number;
  shots: MortarShot[];
  hits: MortarHit[];
  destroyedAt?: number;
}
const stateFor = (battle: Battle, id: number) =>
  ((battle.mortars ??= {})[id] ??= { fired: 0, shots: [], hits: [] });

/** Source speed converted to tiles/second, following the other native projectiles.
 * Version-34 recordings retain their original fixed flight and damage boundaries. */
export function launchMortarShell(
  battle: Battle,
  tower: Building,
  target: { x: number; y: number },
  damage: number,
  emit: (fx: FX) => void,
) {
  const fromX = tower.x + 1.5,
    fromY = tower.y + 1.5;
  const duration = battle.legacyMortarFlight
    ? 1.15
    : distance2D(target.x - fromX, target.y - fromY) /
      (Number(mortarProjectileRow(tower.level).Speed) / 100);
  const shell: MortarShell = {
    sourceId: tower.id,
    fromX,
    fromY,
    x: target.x,
    y: target.y,
    launched: battle.elapsed,
    impact: battle.elapsed + Math.max(0.01, duration),
    damage,
    radius: MORTAR.splash,
  };
  battle.shells.push(shell);
  const state = stateFor(battle, tower.id);
  state.shots.push({ ...shell, index: ++state.fired, level: tower.level });
  if (state.shots.length > 16) state.shots.shift();
  emit({ type: 'mortar-fire', sourceId: tower.id, x: fromX, y: fromY });
  return shell;
}

/** Resolve the saved landing location once, including misses and destroyed launchers. */
export function stepMortarShells(battle: Battle, emit: (fx: FX) => void) {
  for (const shell of [...battle.shells].sort((a, b) => a.impact - b.impact)) {
    if (shell.impact > battle.elapsed + 1e-9) continue;
    for (const unit of battle.units)
      if (
        unit.hp > 0 &&
        !TROOPS[unit.kind].flying &&
        (unit.spawnedAt ?? 0) <= shell.impact + 1e-9 &&
        distance2D(unit.x - shell.x, unit.y - shell.y) <= shell.radius
      )
        hurtUnit(battle, unit, shell.damage, shell.impact);
    const state = battle.mortars?.[shell.sourceId];
    const shot = state?.shots.find((v) => v.launched === shell.launched);
    if (state && shot) {
      state.hits.push({
        index: shot.index,
        level: shot.level,
        at: shell.impact,
        x: shell.x,
        y: shell.y,
      });
      if (state.hits.length > 16) state.hits.shift();
    }
    emit({
      type: 'blast',
      sourceId: shell.sourceId,
      x: shell.x,
      y: shell.y,
      radius: shell.radius,
      weapon: 'cannonball',
    });
  }
  battle.shells = battle.shells.filter((shell) => shell.impact > battle.elapsed + 1e-9);
}
export function recordMortarDestroyed(battle: Battle, tower: Building, at: number) {
  stateFor(battle, tower.id).destroyedAt ??= at;
}
