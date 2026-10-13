import { TROOPS } from './data';
import { heroRow, HERO_UNIT, type HeroKind } from './native-hero-data';
import { nativeUnitStats } from './native-units';
import { tiles } from './native-data';
import { hurtUnit, unitHidden } from './native-status';
import { distance2D } from './distance';
import { findPath, type Battle, type FX } from './model';
import type { HeroDefender } from './defenders';
export interface DefendingHeroSetup {
  kind: HeroKind;
  level: number;
  x: number;
  y: number;
}
export function defendingHero(setup: DefendingHeroSetup, index: number): HeroDefender {
  const stats = nativeUnitStats(HERO_UNIT[setup.kind], setup.level);
  return {
    id: -10000 - index,
    sourceId: -10000 - index,
    kind: 'hero',
    hero: setup.kind,
    level: setup.level,
    home: { x: setup.x, y: setup.y },
    x: setup.x,
    y: setup.y,
    mode: stats.flying ? 'air' : 'ground',
    hp: stats.hp,
    maxHp: stats.hp,
    spawnedAt: 0,
    cooldown: 0,
    target: null,
    path: [],
    pathAt: 0,
    attacking: false,
  };
}
/** Local practice snapshots defenders with their levels; equipment and pets belong to attacks. */
export function stepDefendingHeroes(battle: Battle, dt: number, effect: (fx: FX) => void) {
  for (const d of battle.defenders ?? []) {
    if (d.kind !== 'hero' || d.hp <= 0) continue;
    d.attacking = false;
    if ((d.stunnedUntil ?? 0) > battle.elapsed) continue;
    const stats = nativeUnitStats(HERO_UNIT[d.hero], d.level),
      row = heroRow(d.hero, d.level);
    const alert = tiles(row, 'AlertRadius') || 12,
      leash = tiles(row, 'MaxSearchRadiusForDefender') || 10;
    const eligible = battle.units.filter(
      (u) =>
        u.hp > 0 &&
        !u.ejected &&
        !unitHidden(u, battle.elapsed) &&
        (!TROOPS[u.kind].flying || stats.airTargets) &&
        distance2D(u.x - d.home.x, u.y - d.home.y) <= (d.alerted ? leash : alert),
    );
    const target =
      eligible.find((u) => u.id === d.target) ??
      eligible.sort(
        (a, b) =>
          distance2D(a.x - d.x, a.y - d.y) - distance2D(b.x - d.x, b.y - d.y) || a.id - b.id,
      )[0];
    d.target = target?.id ?? null;
    d.alerted = !!target;
    const point = target ?? d.home,
      distance = distance2D(point.x - d.x, point.y - d.y);
    const poison = d.poison && d.poison.until > battle.elapsed ? d.poison : undefined;
    d.cooldown -= dt * (1 - (poison?.attack ?? 0));
    if (target && distance <= stats.range) {
      d.attacking = true;
      if (d.cooldown <= 0) {
        d.cooldown += stats.rate;
        hurtUnit(battle, target, stats.damage);
        effect({ type: 'hit', x: d.x, y: d.y, toX: target.x, toY: target.y, sourceId: d.id });
      }
      continue;
    }
    if (distance < 0.05) continue;
    d.pathAt -= dt;
    if (d.mode === 'air') d.path = [point];
    else if (d.pathAt <= 0 || !d.path.length) {
      const dummy = { ...battle.buildings[0], x: point.x, y: point.y, kind: 'wall' as const };
      d.path = findPath(
        d,
        dummy,
        battle.buildings.filter((b) => b.hp > 0 && b.kind !== 'wall'),
        target ? stats.range : 0.1,
      );
      d.pathAt = 1;
    }
    let travel = stats.speed * dt * (1 - (poison?.speed ?? 0));
    while (travel > 0 && d.path.length) {
      const p = d.path[0],
        length = distance2D(p.x - d.x, p.y - d.y),
        step = Math.min(length, travel);
      if (length > 0) {
        d.x += ((p.x - d.x) * step) / length;
        d.y += ((p.y - d.y) * step) / length;
      }
      travel -= step;
      if (step >= length) d.path.shift();
      else break;
    }
  }
}
