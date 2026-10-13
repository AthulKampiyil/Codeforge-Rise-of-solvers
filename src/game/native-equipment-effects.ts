import { BUILDINGS, TROOPS, isDefense, isTrap } from './data';
import { num, text, seconds, tiles, flag } from './native-data';
import { heroAbilities, type NativeBattleHero, type HeroAbility } from './native-heroes';
import { castNativeSpell } from './native-spells';
import { healUnit, unitEffects } from './native-status';
import { launchProjectile } from './projectiles';
import { damageDefenders } from './defenders';
import { distanceTo, type Unit } from './model';
import { distance2D } from './distance';
import type { NativeTroopContext } from './native-troops';
import { MAP_SIZE } from './grid';

/** Stateful equipment effects are sampled on the deterministic battle clock. */
export function stepEquipmentEffects(ctx: NativeTroopContext, hero: NativeBattleHero, unit: Unit) {
  if (!ctx.battle.nativeContentExpansion) return;
  const battle = ctx.battle,
    at = battle.elapsed,
    state = (hero.charges ??= {});
  for (const ability of heroAbilities(hero)) {
    const row = ability.row;
    if (!ability.passive) continue;
    const damageStep = num(row, 'ActiveAfterTakingDamage');
    if (damageStep > 0) {
      const count = Math.min(
        num(row, 'MaxActivations', Infinity),
        Math.floor((unit.native?.damageTaken ?? 0) / damageStep),
      );
      const key = `damage:${ability.name}`;
      for (let i = state[key] ?? 0; i < count; i++) {
        const spell = text(row, 'SelfSpell');
        if (spell)
          castNativeSpell(battle, spell, num(row, 'SelfSpellLevel', 1), 'attack', unit.x, unit.y, {
            owner: unit.id,
            at,
          });
      }
      state[key] = count;
    }
    const spell = text(row, 'CastSpell');
    if (
      spell &&
      at >=
        (state[`cast:${ability.name}`] ??
          (unit.spawnedAt ?? 0) + seconds(row, 'ActivationCooldown'))
    ) {
      const target = battle.buildings
        .filter((b) => b.hp > 0 && !isTrap(b.kind) && isDefense(b.kind))
        .sort((a, b) => distanceTo(unit, a) - distanceTo(unit, b) || a.id - b.id)[0];
      if (target) {
        castNativeSpell(
          battle,
          spell,
          num(row, 'CastSpellLevel', 1),
          'attack',
          target.x + BUILDINGS[target.kind].size / 2,
          target.y + BUILDINGS[target.kind].size / 2,
          { owner: unit.id, at },
        );
        ctx.effect({
          type: 'hit',
          x: unit.x,
          y: unit.y,
          toX: target.x + BUILDINGS[target.kind].size / 2,
          toY: target.y + BUILDINGS[target.kind].size / 2,
          sourceId: unit.id,
        });
        state[`cast:${ability.name}`] = at + seconds(row, 'ActivationCooldown');
      }
    }
    if (flag(row, 'ReflectsDamage')) {
      const taken = unit.native?.damageTaken ?? 0,
        key = `reflect:${ability.name}`;
      if (taken > (state[`${key}:damage`] ?? 0) && at >= (state[key] ?? 0)) {
        const target = battle.buildings.find(
          (b) => b.hp > 0 && b.id === unit.native?.lastDamageSource,
        );
        if (target && distanceTo(unit, target) <= tiles(row, 'ReflectedRange')) {
          launchProjectile(
            battle,
            {
              weapon: 'native',
              native: {
                name: text(row, 'ReflectProjectile'),
                kind: unit.kind,
                level: unit.level ?? hero.level,
              },
              sourceId: unit.id,
              targetId: target.id,
              targetBuilding: true,
              fromX: unit.x,
              fromY: unit.y,
              x: target.x + BUILDINGS[target.kind].size / 2,
              y: target.y + BUILDINGS[target.kind].size / 2,
              fromAir: !!TROOPS[unit.kind].flying,
              damage: num(row, 'ReflectedDamage'),
            },
            ctx.effect,
          );
          healUnit(battle, unit, num(row, 'HealOnReflect'));
          state[key] = at + seconds(row, 'ReflectCooldownMS');
        }
      }
      state[`${key}:damage`] = taken;
    }
  }
  const fallen = battle.units
    .filter((u) => u.hp <= 0 && !u.summoned && !u.hero)
    .reduce((n, u) => n + TROOPS[u.kind].space, 0);
  const crown = heroAbilities(hero)
    .filter(
      (a) =>
        num(a.row, 'ActiveAfterFriendlyHousingSpaceDied') > 0 &&
        num(a.row, 'ActiveAfterFriendlyHousingSpaceDied') <= fallen,
    )
    .sort(
      (a, b) =>
        num(b.row, 'ActiveAfterFriendlyHousingSpaceDied') -
        num(a.row, 'ActiveAfterFriendlyHousingSpaceDied'),
    )[0];
  if (crown) {
    const percent = num(crown.row, 'PercentHealthIncrease') / 100;
    const previous = state['crown:hp'] ?? 0;
    if (percent > previous) {
      const base = unit.maxHp / (1 + previous),
        added = base * (percent - previous);
      unit.maxHp += added;
      unit.hp += added;
      state['crown:hp'] = percent;
    }
    unitEffects(unit).boost = {
      until: Infinity,
      damage: num(crown.row, 'BoostDamagePercentage') / 100,
      speed: 0,
      attackSpeed: 0,
    };
  }
}
export function startEquipmentDash(ctx: NativeTroopContext, unit: Unit, ability: HeroAbility) {
  if (!ctx.battle.nativeContentExpansion || !flag(ability.row, 'ActAsPenetratingProjectile'))
    return;
  const row = ability.row,
    dx = MAP_SIZE / 2 - unit.x,
    dy = MAP_SIZE / 2 - unit.y,
    // Explicit operation order (see distance.ts): Math.hypot may differ by ulp
    // across browser engines, which desyncs replays.
    length = distance2D(dx, dy) || 1;
  (unit.native ??= {}).dash = {
    dx: dx / length,
    dy: dy / length,
    remaining: num(row, 'MovementOverrideDistance'),
    speed: tiles(row, 'Speed'),
    damage: num(row, 'ActAsPenetratingDamage'),
    radius: tiles(row, 'ActAsPenetratingRadius'),
    hit: [],
  };
}
export function stepEquipmentDash(ctx: NativeTroopContext, unit: Unit, dt: number) {
  const dash = unit.native?.dash;
  if (!dash) return false;
  let travel = Math.min(dash.remaining, dash.speed * dt);
  // Substeps prevent fast dashes tunnelling through small footprints.
  while (travel > 1e-9) {
    const step = Math.min(0.2, travel);
    travel -= step;
    dash.remaining -= step;
    unit.x = Math.max(0, Math.min(MAP_SIZE, unit.x + dash.dx * step));
    unit.y = Math.max(0, Math.min(MAP_SIZE, unit.y + dash.dy * step));
    for (const b of ctx.battle.buildings)
      if (
        b.hp > 0 &&
        !isTrap(b.kind) &&
        !dash.hit.includes(b.id) &&
        distanceTo(unit, b) <= dash.radius
      ) {
        dash.hit.push(b.id);
        ctx.damageBuilding(b, dash.damage, ctx.battle.elapsed);
      }
    for (const d of ctx.battle.defenders ?? [])
      if (
        d.hp > 0 &&
        !dash.hit.includes(d.id) &&
        distance2D(d.x - unit.x, d.y - unit.y) <= dash.radius
      ) {
        dash.hit.push(d.id);
        damageDefenders(ctx.battle, d, dash.damage, 0, 'both');
      }
  }
  unit.attacking = false;
  unit.path = [];
  if (
    dash.remaining <= 1e-9 ||
    unit.x <= 0 ||
    unit.y <= 0 ||
    unit.x >= MAP_SIZE ||
    unit.y >= MAP_SIZE
  )
    delete unit.native!.dash;
  return true;
}
export function monolithArrow(ctx: NativeTroopContext, unit: Unit) {
  if (!ctx.battle.nativeContentExpansion) return undefined;
  const hero = ctx.battle.nativeHeroes?.find((h) => h.unitId === unit.id);
  if (!hero) return undefined;
  const housing = ctx.battle.units
    .filter((u) => !u.summoned && !u.hero)
    .reduce((n, u) => n + TROOPS[u.kind].space, 0);
  return heroAbilities(hero)
    .filter(
      (a) =>
        num(a.row, 'DamagePermilHp') > 0 &&
        (!num(a.row, 'DeactivateAfterHousingSpaceDeployed') ||
          housing < num(a.row, 'DeactivateAfterHousingSpaceDeployed')),
    )
    .sort((a, b) => num(b.row, 'DamagePermilHp') - num(a.row, 'DamagePermilHp'))[0]?.row;
}
