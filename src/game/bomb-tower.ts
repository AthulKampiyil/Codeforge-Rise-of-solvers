import { hurtUnit } from './native-status';
import { distance2D } from './distance';
import { TROOPS } from './data';
import type { Battle, Building, FX } from './model';
import { BOMB_TOWER, bombTowerStats } from './bomb-tower-stats';

/** Public client values. See docs/BOMB-TOWER.md for sources and timing assumptions. */
export { BOMB_TOWER } from './bomb-tower-stats';
export const bombTowerDeathDamage = (level: number) => bombTowerStats(level).deathDamage;
export interface DeathBomb {
  sourceId: number;
  x: number;
  y: number;
  armedAt: number;
  impact: number;
  damage: number;
  resolved: boolean;
  cancelled?: boolean;
}

export function primeDeathBomb(
  battle: Battle,
  tower: Building,
  power: number,
  at = battle.elapsed,
) {
  if (
    tower.kind !== 'bombtower' ||
    tower.constructing ||
    tower.upgradeEnd ||
    battle.deathBombs?.[tower.id]
  )
    return;
  (battle.deathBombs ??= {})[tower.id] = {
    sourceId: tower.id,
    x: tower.x + 1.5,
    y: tower.y + 1.5,
    armedAt: at,
    impact: at + BOMB_TOWER.deathDelay,
    damage: power,
    resolved: false,
  };
}

export function stepDeathBombs(battle: Battle, effect: (fx: FX) => void) {
  if (battle.finished) return;
  for (const bomb of Object.values(battle.deathBombs ?? {}).sort(
    (a, b) => a.impact - b.impact || a.sourceId - b.sourceId,
  )) {
    if (bomb.resolved || bomb.cancelled || bomb.impact > battle.elapsed + 1e-9) continue;
    bomb.resolved = true;
    for (const unit of battle.units)
      if (
        unit.hp > 0 &&
        (unit.spawnedAt ?? 0) <= bomb.impact + 1e-9 &&
        !TROOPS[unit.kind].flying &&
        distance2D(unit.x - bomb.x, unit.y - bomb.y) <= BOMB_TOWER.deathRadius
      )
        hurtUnit(battle, unit, bomb.damage, bomb.impact);
    effect({
      type: 'blast',
      weapon: 'towerbomb',
      sourceId: bomb.sourceId,
      x: bomb.x,
      y: bomb.y,
      radius: BOMB_TOWER.deathRadius,
    });
  }
}
