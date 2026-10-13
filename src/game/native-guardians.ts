import { nonWallBuildings } from './building-lists';
import { distance2D } from './distance';
import { BUILDINGS, TROOPS } from './data';
import type { Defender, GuardianDefender } from './defenders';
import { knockback } from './native-defenses';
import {
  flag,
  list,
  nativeGlobal,
  nativeLevelCount,
  nativeRow,
  num,
  seconds,
  text,
  tiles,
  type NativeRow,
} from './native-data';
import { castNativeSpell } from './native-spells';
import { hurtUnit, unitHidden } from './native-status';
import { launchProjectile } from './projectiles';
import { SPELL_SPEED_SCALE } from './spell-progression';
import type { NativeTroopContext } from './native-troops';
import { findPath, type Battle, type Building, type Unit } from './model';

/**
 * Town Hall 18 Guardians from client 18.400.21 guardians.csv and characters.csv, following the
 * official wiki (Town Hall/Guardians, Longshot, Smasher, Logger). One Guardian waits on the Town
 * Hall, leaps down when an attacker enters its alert radius (or the Town Hall falls), then fights
 * attackers within its search radius of home. Poison affects Guardians at the client's 30%.
 */
export const GUARDIAN_SOURCE = {
  longshot: 'InfernoArtillery',
  smasher: 'MeleeAreaaaa',
  logger: 'Logger',
} as const;
export type GuardianKind = keyof typeof GUARDIAN_SOURCE;
export const GUARDIAN_KINDS = Object.keys(GUARDIAN_SOURCE) as GuardianKind[];
export const GUARDIAN_NAMES: Record<GuardianKind, string> = {
  longshot: 'Longshot',
  smasher: 'Smasher',
  logger: 'Logger',
};
export const validGuardian = (value: unknown) =>
  value === undefined || GUARDIAN_KINDS.includes(value as GuardianKind);
export const guardianLevels = (kind: GuardianKind) =>
  nativeLevelCount('guardians', GUARDIAN_SOURCE[kind]);

export interface GuardianStats {
  kind: GuardianKind;
  level: number;
  character: string;
  hp: number;
  speed: number;
  range: number;
  interval: number;
  windup: number;
  damage: number;
  splash: number;
  projectile: string;
  alert: number;
  search: number;
  leapTime: number;
  leapDistance: number;
  death: { damage: number; radius: number; delay: number; air: boolean };
  pushback: number;
  pierce?: { radius: number; extra: number };
  deathSpell?: { name: string; level: number };
  homeRage?: { damage: number; speed: number };
}
const guardianRow = (kind: GuardianKind, level: number): NativeRow =>
  nativeRow('guardians', GUARDIAN_SOURCE[kind], level);
export function guardianStats(kind: GuardianKind, level = 1): GuardianStats {
  const row = guardianRow(kind, level);
  const character = text(row, 'CharacterDatas');
  const c = nativeRow('characters', character, num(row, 'CharacterLevels', 1));
  const stats: GuardianStats = {
    kind,
    level,
    character,
    hp: num(c, 'Hitpoints'),
    speed: num(c, 'Speed') / 100,
    range: tiles(c, 'AttackRange'),
    interval: seconds(c, 'AttackSpeed'),
    windup: Math.max(0, seconds(c, 'AttackSpeed') - seconds(c, 'CoolDownOverride')),
    damage: num(c, 'DPS') * seconds(c, 'AttackSpeed'),
    splash: tiles(c, 'DamageRadius'),
    projectile: text(c, 'Projectile'),
    // AlertRadius matches the wiki trigger radii (19/14/15); guardians.csv ActivationRadius is stale.
    alert: tiles(c, 'AlertRadius'),
    search: tiles(c, 'MaxSearchRadiusForDefender'),
    leapTime: seconds(row, 'LeapTimeMS'),
    leapDistance: num(row, 'LeapDistance'),
    death: {
      damage: num(c, 'DieDamage'),
      radius: tiles(c, 'DieDamageRadius'),
      delay: seconds(c, 'DieDamageDelay'),
      air: flag(c, 'DieDamageAffectsAir'),
    },
    pushback: tiles(c, 'Pushback'),
    ...(flag(c, 'PenetratingProjectile')
      ? {
          pierce: {
            radius: tiles(c, 'PenetratingRadius'),
            extra: tiles(c, 'PenetratingExtraRange'),
          },
        }
      : {}),
  };
  for (const name of list(c, 'SpecialAbilities')) {
    const ability = nativeRow('abilities', name, 1);
    if (flag(ability, 'ActiveOnDeath') && text(ability, 'SelfSpell'))
      stats.deathSpell = {
        name: text(ability, 'SelfSpell'),
        level: num(ability, 'SelfSpellLevel', 1),
      };
    if (flag(ability, 'ActivateAfterHomeBuildingDies'))
      stats.homeRage = {
        damage: num(ability, 'BoostDamagePercentage') / 100,
        speed: num(ability, 'SpeedBoost') / 100,
      };
  }
  return stats;
}
/** Builder upgrade from `level` to `level + 1` (upgrade_data.csv GuardianGeneral). */
export function guardianUpgrade(kind: GuardianKind, level: number) {
  if (level >= guardianLevels(kind)) return null;
  const data = text(guardianRow(kind, 1), 'UpgradeData');
  const row = nativeRow('upgrades', data, level);
  return {
    level: level + 1,
    cost: num(row, 'UpgradeCost'),
    seconds:
      num(row, 'UpgradeTimeDays') * 86400 +
      num(row, 'UpgradeTimeHours') * 3600 +
      num(row, 'UpgradeTimeMinutes') * 60 +
      num(row, 'UpgradeTimeSeconds'),
    resource: ({ Gold: 'gold', Elixir: 'elixir', DarkElixir: 'dark' } as const)[
      text(row, 'UpgradeResource') as 'Elixir'
    ],
  };
}
export const guardianPoisonScale = () =>
  nativeGlobal('GUARDIAN_POISON_SPEED_MULTIPLIER', 100) / 100;

const center = (b: Building) => ({
  x: b.x + BUILDINGS[b.kind].size / 2,
  y: b.y + BUILDINGS[b.kind].size / 2,
});
const EPS = 1e-9;
const air = (u: Unit) => !!TROOPS[u.kind].flying;
const live = (u: Unit, at: number) =>
  u.hp > 0 && !u.ejected && (u.spawnedAt ?? 0) <= at + EPS && !unitHidden(u, at);

/** Town Hall 18 in version 45 battles houses its selected Guardian; nothing earlier does. */
export function createGuardian(battle: Battle, th: Building, id: number): GuardianDefender | null {
  if (
    !battle.nativeRoster ||
    battle.catalog === 'goblin-v1' ||
    th.kind !== 'townhall' ||
    th.npc ||
    th.level < 18
  )
    return null;
  const kind = th.guardian ?? 'longshot';
  const stats = guardianStats(kind, th.guardianLevel ?? 1);
  const home = center(th);
  return {
    id,
    kind: 'guardian',
    guardian: kind,
    level: stats.level,
    sourceId: th.id,
    mode: 'ground',
    x: home.x,
    y: home.y,
    hp: stats.hp,
    maxHp: stats.hp,
    // Untargetable until it lands.
    spawnedAt: Number.MAX_SAFE_INTEGER,
    cooldown: 0,
    target: null,
    path: [],
    pathAt: 0,
    attacking: false,
    home,
    phase: 'waiting',
    readyAt: 0,
  };
}

/** Guardian step: leap, target, move, attack, enrage and death effects. */
export function stepGuardian(ctx: NativeTroopContext, g: GuardianDefender, dt: number) {
  const battle = ctx.battle;
  const at = battle.elapsed;
  const stats = guardianStats(g.guardian, g.level);
  g.attacking = false;
  if (g.hp <= 0) {
    if (g.deathResolved || g.defeatedAt === undefined) return;
    if (at + EPS < g.defeatedAt + stats.death.delay) return;
    g.deathResolved = true;
    const when = g.defeatedAt + stats.death.delay;
    if (stats.death.damage > 0) {
      for (const u of battle.units)
        if (
          live(u, when) &&
          (stats.death.air || !air(u)) &&
          distance2D(u.x - g.x, u.y - g.y) <= stats.death.radius + EPS
        )
          hurtUnit(battle, u, stats.death.damage, when);
      ctx.effect({ type: 'blast', x: g.x, y: g.y, radius: stats.death.radius, color: 0xff7a3c });
    }
    if (stats.deathSpell)
      castNativeSpell(battle, stats.deathSpell.name, stats.deathSpell.level, 'defense', g.x, g.y, {
        at: when,
      });
    return;
  }
  const th = battle.buildings.find((b) => b.id === g.sourceId);
  if (g.phase === 'waiting') {
    let trigger: Unit | undefined;
    let best = Infinity;
    let bestId = Infinity;
    for (const u of battle.units) {
      if (!live(u, at)) continue;
      const dist = distance2D(u.x - g.home.x, u.y - g.home.y);
      if (dist > stats.alert + EPS) continue;
      if (dist < best || (dist === best && u.id < bestId)) {
        best = dist;
        bestId = u.id;
        trigger = u;
      }
    }
    if (!trigger && th && th.hp > 0) return;
    const toward = trigger ?? { x: g.home.x, y: g.home.y + 1 };
    const dx = toward.x - g.home.x,
      dy = toward.y - g.home.y,
      d = distance2D(dx, dy) || 1;
    const reach = (th ? BUILDINGS[th.kind].size / 2 : 0) + stats.leapDistance / 2;
    g.phase = 'leaping';
    g.leap = {
      from: { ...g.home },
      to: { x: g.home.x + (dx / d) * reach, y: g.home.y + (dy / d) * reach },
      at,
    };
    g.spawnedAt = at + stats.leapTime;
    return;
  }
  if (g.phase === 'leaping') {
    const leap = g.leap!;
    const t = Math.min(1, (at - leap.at) / Math.max(EPS, stats.leapTime));
    g.x = leap.from.x + (leap.to.x - leap.from.x) * t;
    g.y = leap.from.y + (leap.to.y - leap.from.y) * t;
    if (t < 1) return;
    g.phase = 'fighting';
    g.alerted = true;
  }
  // Smasher's Sore Loser: enraged for the rest of the battle once its Town Hall is destroyed.
  if (stats.homeRage && th && th.hp <= 0 && !g.enraged) g.enraged = true;
  const stun = g.stunnedUntil ?? 0;
  const activeDt = Math.min(dt, Math.max(0, at - stun));
  if (activeDt <= 0) return;
  const poison = g.poison && g.poison.until > at ? g.poison : undefined;
  const scale = guardianPoisonScale();
  const boost = g.boost && g.boost.until > at ? g.boost : undefined;
  const damageScale =
    Math.max(1 + (g.enraged ? stats.homeRage!.damage : 0), 1 + (boost?.damage ?? 0)) *
    (poison ? 1 : 1);
  const speed =
    (stats.speed + Math.max(g.enraged ? stats.homeRage!.speed : 0, boost?.speed ?? 0)) *
    (poison ? Math.max(0, 1 + poison.speed * scale) : 1);
  const tempo = poison ? Math.max(0.05, 1 + poison.attack * scale) : 1;
  // Sticky target while it stays in search range; otherwise closest by distance then id.
  let sticky: Unit | undefined;
  let best: Unit | undefined;
  let bestDist = Infinity;
  let bestTargetId = Infinity;
  for (const u of battle.units) {
    if (!live(u, at)) continue;
    if (distance2D(u.x - g.home.x, u.y - g.home.y) > stats.search + EPS) continue;
    if (u.id === g.target) {
      sticky = u;
      break;
    }
    const dist = distance2D(u.x - g.x, u.y - g.y);
    if (dist < bestDist || (dist === bestDist && u.id < bestTargetId)) {
      bestDist = dist;
      bestTargetId = u.id;
      best = u;
    }
  }
  const target = sticky ?? best;
  if (!sticky) {
    // Retarget only on loss; a retained sticky keeps its path.
    g.target = target?.id ?? null;
    g.path = [];
    g.pathAt = 0;
    delete g.releaseAt;
  }
  g.pathAt -= activeDt;
  if (!target) {
    // Return home and wait there.
    const d = distance2D(g.home.x - g.x, g.home.y - g.y);
    if (d > 0.6) moveToward(battle, g, g.home, speed, activeDt);
    return;
  }
  const distance = distance2D(target.x - g.x, target.y - g.y);
  if (distance > stats.range + EPS) {
    delete g.releaseAt;
    moveToward(battle, g, target, speed, activeDt, stats.range);
    return;
  }
  g.attacking = true;
  g.clock = (g.clock ?? 0) + activeDt * tempo;
  g.releaseAt ??= Math.max(g.readyAt, g.clock + stats.windup);
  if (g.releaseAt > g.clock + EPS) return;
  g.readyAt = g.releaseAt + stats.interval;
  g.releaseAt = g.readyAt;
  attack(ctx, g, stats, target, stats.damage * damageScale, at);
}

function moveToward(
  battle: Battle,
  g: GuardianDefender,
  goal: { x: number; y: number },
  speed: number,
  dt: number,
  range = 0.5,
) {
  if (!g.path.length || g.pathAt <= 0) {
    // Guardians cross their own walls like other home defenders.
    g.path = findPath(g, goal, nonWallBuildings(battle), range);
    g.pathAt = 0.3;
  }
  let travel = speed * dt;
  while (g.path.length && travel > 0) {
    const next = g.path[0],
      dx = next.x - g.x,
      dy = next.y - g.y,
      len = distance2D(dx, dy);
    if (len <= travel) {
      g.x = next.x;
      g.y = next.y;
      g.path.shift();
      travel -= len;
    } else {
      g.x += (dx / len) * travel;
      g.y += (dy / len) * travel;
      break;
    }
  }
}

function attack(
  ctx: NativeTroopContext,
  g: GuardianDefender,
  stats: GuardianStats,
  target: Unit,
  damage: number,
  at: number,
) {
  const battle = ctx.battle;
  if (stats.pierce) {
    // Logger: the log rolls through every unit on its path and past the target, pushing them back.
    const dx = target.x - g.x,
      dy = target.y - g.y,
      d = distance2D(dx, dy) || 1;
    const sequence = (battle.nativeShotSequence = (battle.nativeShotSequence ?? 0) + 1);
    (battle.nativePiercing ??= []).push({
      id: `${g.id}:${sequence}`,
      sourceId: g.id,
      fromX: g.x,
      fromY: g.y,
      dirX: dx / d,
      dirY: dy / d,
      length: d + stats.pierce.extra,
      speed: num(nativeRow('projectiles', stats.projectile), 'Speed', 420) / 100,
      launched: at,
      travelled: 0,
      radius: stats.pierce.radius,
      hits: Number.MAX_SAFE_INTEGER,
      damage,
      hit: [],
      pushback: stats.pushback,
    });
    return;
  }
  if (!stats.projectile) {
    // Smasher: melee swing with splash that reaches ground and air units.
    for (const u of battle.units)
      if (
        live(u, at) &&
        (u.id === target.id || distance2D(u.x - target.x, u.y - target.y) <= stats.splash + EPS)
      )
        hurtUnit(battle, u, damage, at);
    ctx.effect({
      type: 'hit',
      sourceDefender: true,
      sourceId: g.id,
      targetId: target.id,
      x: g.x,
      y: g.y,
      toX: target.x,
      toY: target.y,
    });
    return;
  }
  // Longshot: explosive bolt; splash damages only the struck unit's layer.
  launchProjectile(
    battle,
    {
      weapon: 'native',
      native: { name: stats.projectile, kind: 'guardian', level: g.level },
      defense: {
        hit: [],
        air: true,
        ground: true,
        bounces: 0,
        bounceDistance: 0,
        bounceFactor: 1,
        layerSplash: stats.splash,
      },
      sourceId: g.id,
      targetId: target.id,
      targetBuilding: false,
      fromX: g.x,
      fromY: g.y,
      x: target.x,
      y: target.y,
      toAir: air(target),
      damage,
    },
    ctx.effect,
    at,
  );
}

/** Pushes struck units for Logger logs; called by the piercing-shot resolver. */
export function pushFromLog(
  ctx: NativeTroopContext,
  u: Unit,
  dirX: number,
  dirY: number,
  distance: number,
) {
  if (distance <= 0 || u.native?.siege) return;
  knockback(ctx, u, u.x - dirX, u.y - dirY, distance);
}

export const isGuardian = (d: Defender): d is GuardianDefender => d.kind === 'guardian';
export const guardianRageSpeed = (speedBoost: number) => speedBoost / SPELL_SPEED_SCALE;

/** Places the Town Hall 18 Guardian on the first version 45 battle step. */
export function stepGuardians(ctx: NativeTroopContext, dt: number) {
  const battle = ctx.battle;
  if (!battle.nativeRoster || battle.catalog === 'goblin-v1') return;
  if (!battle.guardiansPlaced) {
    battle.guardiansPlaced = true;
    for (const th of battle.buildings) {
      const guardian = createGuardian(battle, th, -1000 - th.id);
      if (guardian) (battle.defenders ??= []).push(guardian);
    }
  }
  for (const d of battle.defenders ?? []) if (isGuardian(d)) stepGuardian(ctx, d, dt);
}
