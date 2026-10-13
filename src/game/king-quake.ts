import { distance2D } from './distance';
import { EARTHQUAKE_BOOTS, equipmentBonuses } from './equipment';
import { presentBuilding } from './hidden-tesla';
import { hurtDefender } from './defenders';
import { distanceTo, type Battle, type Building, type FX, type Unit } from './model';

export interface KingQuake {
  x: number;
  y: number;
  start: number;
  pulses: number;
  buildingFraction: number;
  troopFraction: number;
}
export function startKingQuake(battle: Battle, king: Unit) {
  const gear = equipmentBonuses(battle.hero?.equipment);
  if (!gear.quakeBuilding) return;
  (battle.kingQuakes ??= []).push({
    x: king.x,
    y: king.y,
    start: battle.elapsed,
    pulses: 0,
    buildingFraction: gear.quakeBuilding,
    troopFraction: gear.quakeTroop,
  });
}
/** Fixed cast position; each scheduled pulse survives the caster's movement or defeat. */
export function stepKingQuakes(
  battle: Battle,
  damage: (b: Building, n: number, at: number) => void,
  effect: (fx: FX) => void,
) {
  const { radius, pulses, interval, delay } = EARTHQUAKE_BOOTS;
  for (const quake of battle.kingQuakes ?? []) {
    while (quake.pulses < pulses) {
      const at = quake.start + delay + quake.pulses * interval;
      if (at > battle.elapsed + 1e-9) break;
      quake.pulses++;
      for (const building of battle.buildings) {
        // Area pulses reach buildings concealed by late campaign Invisibility.
        if (!presentBuilding(battle, building) || distanceTo(quake, building) > radius) continue;
        damage(
          building,
          building.kind === 'wall' ? building.hp : building.maxHp * quake.buildingFraction,
          at,
        );
      }
      for (const defender of battle.defenders ?? []) {
        if (
          defender.mode !== 'ground' ||
          defender.spawnedAt > at + 1e-9 ||
          defender.hp <= 0 ||
          distance2D(defender.x - quake.x, defender.y - quake.y) > radius
        )
          continue;
        hurtDefender(battle, defender, defender.maxHp * quake.troopFraction);
      }
      effect({ type: 'quake', x: quake.x, y: quake.y, radius });
    }
  }
  battle.kingQuakes = battle.kingQuakes?.filter((quake) => quake.pulses < pulses);
}
