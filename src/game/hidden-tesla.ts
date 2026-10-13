import { buildingHidden } from './native-status';
import { distance2D } from './distance';
import { BUILDINGS, TROOPS, isTrap } from './data';
import type { Battle, Building, FX, Unit } from './model';
import { TESLA } from './tesla-stats';
import { lateBuildingHidden } from './late-campaign';

/** Public client data: 600 hundredths of a tile; destruction threshold 50. */
export const TESLA_TRIGGER = TESLA.trigger;
export const TESLA_REVEAL_PERCENT = 50;

export function concealedTesla(battle: Battle, building: Building) {
  return (
    building.kind === 'tesla' &&
    !building.constructing &&
    !building.upgradeEnd &&
    battle.revealedTeslas?.[building.id] === undefined
  );
}

export function targetableBuilding(battle: Battle, building: Building) {
  return (
    building.hp > 0 &&
    !isTrap(building.kind) &&
    !concealedTesla(battle, building) &&
    !lateBuildingHidden(battle, building) &&
    // Overgrowth roots a building and Spell Tower Invisibility covers one (version 51+).
    !buildingHidden(battle, building)
  );
}
/** Late campaign Invisibility only blocks targeting: a concealed defense still fires and area
 * effects still reach it; a buried Tesla does neither. Identical to `targetableBuilding`
 * whenever no late campaign state exists. */
export function presentBuilding(battle: Battle, building: Building) {
  return building.hp > 0 && !isTrap(building.kind) && !concealedTesla(battle, building);
}

/** A Tesla stays up for the rest of this attack. Reveal invalidates offensive routes. */
export function revealTeslas(
  battle: Battle,
  effect: (fx: FX) => void,
  /**
   * Units that would divert onto a revealed tower (defense-preferring troops).
   * Only those, units standing on / routed through a revealed footprint, and
   * units targeting one repath: everyone else keeps target and path, so one
   * reveal no longer piles every ground unit onto the per-tick A* budget at
   * once. Absent keeps the historical reset-everything behavior.
   */
  diverts?: (u: Unit) => boolean,
) {
  let changed = false;
  const revealed: Building[] = [];
  for (const tower of battle.buildings) {
    if (tower.hp <= 0 || !concealedTesla(battle, tower)) continue;
    const x = tower.x + BUILDINGS.tesla.size / 2,
      y = tower.y + BUILDINGS.tesla.size / 2;
    if (
      battle.destruction <= TESLA_REVEAL_PERCENT &&
      !battle.units.some((u) => u.hp > 0 && distance2D(u.x - x, u.y - y) <= TESLA_TRIGGER)
    )
      continue;
    (battle.revealedTeslas ??= {})[tower.id] = battle.elapsed;
    revealed.push(tower);
    changed = true;
    effect({ type: 'tesla-reveal', sourceId: tower.id, x, y });
  }
  if (changed)
    for (const unit of battle.units) {
      if (unit.hp <= 0 || TROOPS[unit.kind].healer) continue;
      const targeted =
        typeof unit.target === 'number' && revealed.some((t) => t.id === unit.target);
      const touches =
        !targeted &&
        revealed.some((t) => {
          const size = BUILDINGS[t.kind].size;
          const near = (x: number, y: number) =>
            x > t.x - 1 && x < t.x + size + 1 && y > t.y - 1 && y < t.y + size + 1;
          return near(unit.x, unit.y) || unit.path.some((p) => near(p.x, p.y));
        });
      if (!targeted && !touches && !(diverts?.(unit) ?? true)) continue;
      unit.target = null;
      unit.path = [];
      unit.pathAt = 0;
      unit.attacking = false;
    }
  return changed;
}
