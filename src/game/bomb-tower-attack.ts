import type { Battle, Building } from './model';
import type { CombatProjectile } from './projectiles';

export interface BombTowerShot {
  index: number;
  id: string;
  at: number;
  impact: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
}
export interface BombTowerHit {
  index: number;
  at: number;
  x: number;
  y: number;
}
export interface BombTowerAttackState {
  fired: number;
  destroyedAt?: number;
  shots: BombTowerShot[];
  hits: BombTowerHit[];
}
const stateFor = (battle: Battle, id: number) =>
  ((battle.bombTowers ??= {})[id] ??= { fired: 0, shots: [], hits: [] });

/** Bounded, derived visual history. Never consumes combat randomness. */
export function recordBombTowerShot(battle: Battle, tower: Building, shot: CombatProjectile) {
  const state = stateFor(battle, tower.id);
  state.shots.push({
    index: ++state.fired,
    id: shot.id,
    at: shot.launched,
    impact: shot.impact,
    fromX: shot.fromX,
    fromY: shot.fromY,
    x: shot.x,
    y: shot.y,
  });
  if (state.shots.length > 16) state.shots.shift();
}
export function recordBombTowerHit(battle: Battle, projectile: CombatProjectile) {
  const state = battle.bombTowers?.[projectile.sourceId];
  const shot = state?.shots.find((v) => v.id === projectile.id);
  if (!state || !shot) return;
  state.hits.push({ index: shot.index, at: projectile.impact, x: projectile.x, y: projectile.y });
  if (state.hits.length > 16) state.hits.shift();
}
export function recordBombTowerDestroyed(battle: Battle, tower: Building, at: number) {
  stateFor(battle, tower.id).destroyedAt ??= at;
}
