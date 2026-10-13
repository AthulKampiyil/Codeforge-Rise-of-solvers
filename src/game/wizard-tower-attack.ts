import type { Battle, Building } from './model';
import type { CombatProjectile } from './projectiles';

export interface WizardTowerShot {
  index: number;
  id: string;
  at: number;
  impact: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  toAir: boolean;
}
export interface WizardTowerHit {
  index: number;
  at: number;
  x: number;
  y: number;
  toAir: boolean;
}
export interface WizardTowerAttackState {
  fired: number;
  destroyedAt?: number;
  shots: WizardTowerShot[];
  hits: WizardTowerHit[];
}
const stateFor = (battle: Battle, id: number) =>
  ((battle.wizardTowers ??= {})[id] ??= { fired: 0, shots: [], hits: [] });

/** Bounded presentation history, reconstructed from actual shots without consuming randomness. */
export function recordWizardTowerShot(battle: Battle, tower: Building, shot: CombatProjectile) {
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
    toAir: !!shot.toAir,
  });
  if (state.shots.length > 16) state.shots.shift();
}
export function recordWizardTowerHit(battle: Battle, projectile: CombatProjectile) {
  const state = battle.wizardTowers?.[projectile.sourceId];
  const shot = state?.shots.find((v) => v.id === projectile.id);
  if (!state || !shot) return;
  state.hits.push({
    index: shot.index,
    at: projectile.impact,
    x: projectile.x,
    y: projectile.y,
    toAir: !!projectile.toAir,
  });
  if (state.hits.length > 16) state.hits.shift();
}
export function recordWizardTowerDestroyed(battle: Battle, tower: Building, at: number) {
  stateFor(battle, tower.id).destroyedAt ??= at;
}
