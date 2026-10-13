import { distance2D } from './distance';
import { BUILDINGS, TROOPS, isTrap, type BuildingKind, type UnitKind } from './data';
import { damageDefenders, hurtDefender, type Defender } from './defenders';
import {
  flag,
  nativeGlobal,
  nativeRow,
  num,
  seconds,
  text,
  tiles,
  type NativeRow,
} from './native-data';
import { buildingEffects, healUnit, hurtUnit, unitEffects } from './native-status';
import { concealedTesla } from './hidden-tesla';
import { unitKindForName } from './native-units';
import { tornadoPulse } from './native-traps';
import { SPELL_SPEED_SCALE } from './spell-progression';
import type { Battle, Building, FX, Unit } from './model';

/** Buildings immune to storage/Town Hall flags, following the client's building classes. */
const TOWN_HALL_OR_CASTLE = new Set<BuildingKind>(['townhall', 'clancastle']);
const STORAGES = new Set<BuildingKind>(['goldstorage', 'elixirstorage', 'darkstorage']);

export type SpellSide = 'attack' | 'defense';
export interface NativeSpellCast {
  id: number;
  name: string;
  level: number;
  side: SpellSide;
  x: number;
  y: number;
  /** Aura center follows this living attacker. */
  follow?: number;
  /** Unit or building excluded by DoesNotAffectOwner. */
  owner?: number;
  castAt: number;
  firstHit: number;
  hits: number;
  total: number;
  interval: number;
  /** Deterministic sequence for random strike and spawn offsets. */
  seed: number;
  /** Remaining clone/recall housing budget. */
  budget?: number;
  /** Units already affected by once-per-cast effects (anger). */
  touched?: number[];
  /** Summons released so far by skeleton/bat style spells. */
  released?: number;
  summonGroups?: number[];
  ended?: boolean;
}
export interface NativeSpellContext {
  battle: Battle;
  /** `spell` marks spell damage, which cannot trigger defenses that watch attacker hits. */
  damageBuilding(target: Building, amount: number, at: number, spell?: boolean): void;
  effect(fx: FX): void;
  /** Creates a housing-free unit; supplied by the troop context. */
  spawn?(kind: UnitKind, level: number, x: number, y: number, at: number, owner?: number): Unit;
  /** Returns a unit to the deployment bar; supplied by the model. */
  recall?(unit: Unit): void;
}

export const spellRow = (name: string, level: number): NativeRow =>
  nativeRow('spells', name, level);

/** Client timeline: deploy, charge and hit delays precede the first pulse. */
export function castNativeSpell(
  battle: Battle,
  name: string,
  level: number,
  side: SpellSide,
  x: number,
  y: number,
  options: { at?: number; follow?: number; owner?: number; immediate?: boolean } = {},
) {
  const row = spellRow(name, level);
  const at = options.at ?? battle.elapsed;
  const delay = options.immediate
    ? seconds(row, 'HitTimeMS')
    : seconds(row, 'DeployTimeMS') + seconds(row, 'ChargingTimeMS') + seconds(row, 'HitTimeMS');
  battle.nativeSpellSequence = (battle.nativeSpellSequence ?? 0) + 1;
  const cast: NativeSpellCast = {
    id: battle.nativeSpellSequence,
    name,
    level,
    side,
    x,
    y,
    ...(options.follow !== undefined ? { follow: options.follow } : {}),
    ...(options.owner !== undefined ? { owner: options.owner } : {}),
    castAt: at,
    firstHit: at + delay,
    hits: 0,
    total: Math.max(1, num(row, 'NumberOfHits', 1)),
    interval: seconds(row, 'TimeBetweenHitsMS'),
    seed: (Math.imul(battle.seed, 7919) + Math.imul(battle.nativeSpellSequence, 104729)) >>> 0,
    ...(num(row, 'DuplicateHousing') ? { budget: num(row, 'DuplicateHousing') } : {}),
    ...(num(row, 'RecallHousing') ? { budget: num(row, 'RecallHousing') } : {}),
  };
  (battle.nativeSpells ??= []).push(cast);
  return cast;
}

/** Stateless integer hash; the same cast resolves the same offsets during every replay. */
export function spellRandom(seed: number, index: number) {
  let v = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  v = Math.imul(v ^ (v >>> 16), 0x85ebca6b) >>> 0;
  v = Math.imul(v ^ (v >>> 13), 0xc2b2ae35) >>> 0;
  return ((v ^ (v >>> 16)) >>> 0) / 0x100000000;
}
const randomPoint = (cast: NativeSpellCast, index: number, radius: number) => {
  const angle = spellRandom(cast.seed, index * 2) * Math.PI * 2;
  const reach = Math.sqrt(spellRandom(cast.seed, index * 2 + 1)) * radius;
  return { x: cast.x + Math.cos(angle) * reach, y: cast.y + Math.sin(angle) * reach };
};

export function buildingSpellImmune(row: NativeRow, b: Building) {
  return (
    isTrap(b.kind) ||
    (b.kind === 'wall' && flag(row, 'ImmunityWalls')) ||
    (TOWN_HALL_OR_CASTLE.has(b.kind) && flag(row, 'ImmunityTH_CC')) ||
    (STORAGES.has(b.kind) && flag(row, 'ImmunityStorages')) ||
    (b.kind !== 'wall' &&
      !TOWN_HALL_OR_CASTLE.has(b.kind) &&
      !STORAGES.has(b.kind) &&
      flag(row, 'ImmunityOtherBuildings'))
  );
}
export const footprintDistance = (x: number, y: number, b: Building) => {
  const size = BUILDINGS[b.kind].size;
  return distance2D(Math.max(b.x - x, 0, x - b.x - size), Math.max(b.y - y, 0, y - b.y - size));
};
const isTotem = (u: Unit) => u.kind === 'totem';
const liveAttacker = (u: Unit, at: number) =>
  u.hp > 0 && !u.ejected && !u.native?.recalled && (u.spawnedAt ?? 0) <= at + 1e-9;
/** Stationary units (Furnace, Totem) and spawned units never return to the deployment bar. */
const deployable = (u: Unit) => !!u.hero || u.level === undefined;
const housing = (u: Unit) => (u.hero ? 25 : TROOPS[u.kind].space);

/** Resolve every pulse whose scheduled time has been reached, in cast order. */
export function stepNativeSpells(ctx: NativeSpellContext) {
  const battle = ctx.battle;
  for (const cast of battle.nativeSpells ?? []) {
    if (cast.ended) continue;
    while (cast.hits < cast.total) {
      const at = cast.firstHit + cast.hits * cast.interval;
      if (at > battle.elapsed + 1e-9) break;
      if (cast.follow !== undefined) {
        const owner = battle.units.find((u) => u.id === cast.follow);
        if (
          !owner ||
          owner.hp <= 0 ||
          (battle.nativeHeroPassives && (owner.ejected || owner.native?.recalled))
        ) {
          cast.ended = true;
          break;
        }
        cast.x = owner.x;
        cast.y = owner.y;
      }
      resolvePulse(ctx, cast, at);
      cast.hits++;
    }
    const row = spellRow(cast.name, cast.level);
    stepSpellSummons(ctx, cast, row);
    if (cast.hits >= cast.total && !pendingSummons(cast, row)) cast.ended = true;
  }
  if (battle.nativeSpells?.some((cast) => cast.ended))
    battle.nativeSpells = battle.nativeSpells.filter((cast) => !cast.ended);
}

function resolvePulse(ctx: NativeSpellContext, cast: NativeSpellCast, at: number) {
  const battle = ctx.battle;
  const row = spellRow(cast.name, cast.level);
  const randomRadius = flag(row, 'RandomRadiusAffectsOnlyGfx') ? 0 : tiles(row, 'RandomRadius');
  let x = cast.x,
    y = cast.y;
  if (randomRadius > 0) {
    const p = randomPoint(cast, cast.hits, randomRadius);
    x = p.x;
    y = p.y;
  }
  const radius = tiles(row, 'Radius');
  const inRange = (distance: number) => distance <= radius + 1e-9;
  if (cast.side === 'attack') {
    harmDefense(ctx, cast, row, at, x, y, radius);
    supportAttackers(ctx, cast, row, at, x, y, radius);
    if (flag(row, 'Overgrowth')) overgrow(battle, row, at, x, y, radius);
    if (num(row, 'DuplicateHousing')) cloneUnits(ctx, cast, row, at, radius);
    if (num(row, 'RecallHousing')) recallUnits(ctx, cast, at, radius);
    if (num(row, 'ResurrectHitpointPercentage')) reviveHero(ctx, row, x, y);
    const chain = text(row, 'ChainSpell');
    if (chain && cast.hits === 0)
      castNativeSpell(battle, chain, num(row, 'ChainSpellLevel', 1) || 1, cast.side, x, y, { at });
  } else {
    if (num(row, 'TornadoForce1') > 0) tornadoPulse(battle, cast, row, at, radius);
    else harmAttackers(ctx, cast, row, at, x, y, inRange);
    supportDefense(battle, row, at, x, y, radius);
  }
  if (cast.hits === 0 || randomRadius > 0)
    ctx.effect({ type: 'spell-native', x, y, radius, text: cast.name, sourceId: cast.id });
  // Quake spells (Earthquake, Earthquake Boots) drive the battle-clock fracture graphic.
  if (cast.hits === 0 && num(row, 'BuildingDamagePermil') > 0)
    ctx.effect({ type: 'quake', x, y, radius });
}

/** Harmful effects of an attacker's spell on buildings and defending units. */
function harmDefense(
  ctx: NativeSpellContext,
  cast: NativeSpellCast,
  row: NativeRow,
  at: number,
  x: number,
  y: number,
  radius: number,
) {
  const battle = ctx.battle;
  const damage = num(row, 'Damage');
  const freeze = seconds(row, 'FreezeTimeMS');
  const freezePercent = num(row, 'FreezePercent') / 100;
  const stun = seconds(row, 'StunTimeMS');
  const quakeBuilding = num(row, 'BuildingDamagePermil') / 1000;
  const quakeTroop = num(row, 'TroopDamagePermil') / 1000;
  const poison = num(row, 'PoisonDPS');
  const overgrowth = flag(row, 'Overgrowth');
  if (damage > 0 || (freeze > 0 && !overgrowth) || stun > 0 || quakeBuilding > 0 || poison > 0) {
    for (const b of battle.buildings) {
      if (b.hp <= 0 || buildingSpellImmune(row, b) || concealedTesla(battle, b)) continue;
      if (footprintDistance(x, y, b) > radius + 1e-9) continue;
      if (damage > 0) ctx.damageBuilding(b, damage, at, true);
      // Burning pools (Firemite) carry poison damage without building immunities.
      if (poison > 0) {
        const e = buildingEffects(battle, b);
        const key = `${cast.id}`;
        const exposure = (e.burn ??= {});
        exposure[key] ??= at;
        const tick = cast.interval || 0.4;
        const ramp = flag(row, 'PoisonIncreaseSlowly')
          ? Math.min(1, (at - exposure[key] + tick) / 5)
          : 1;
        ctx.damageBuilding(b, poison * tick * ramp, at, true);
      }
      if (quakeBuilding > 0) quake(ctx, cast, row, b, quakeBuilding, at);
      if (freeze > 0 && !overgrowth) {
        const e = buildingEffects(battle, b);
        if (freezePercent > 0)
          e.chill = { until: Math.max(e.chill?.until ?? 0, at + freeze), percent: freezePercent };
        else {
          e.frozenUntil = Math.max(e.frozenUntil ?? 0, at + freeze);
          battle.defenseStuns[b.id] = Math.max(battle.defenseStuns[b.id] ?? 0, e.frozenUntil);
          delete battle.defenseTargets[b.id];
        }
      }
      if (stun > 0) {
        const e = buildingEffects(battle, b);
        e.stunUntil = Math.max(e.stunUntil ?? 0, at + stun);
        battle.defenseStuns[b.id] = Math.max(battle.defenseStuns[b.id] ?? 0, e.stunUntil);
        delete battle.defenseTargets[b.id];
      }
    }
  }
  if (damage > 0) damageDefenders(battle, { x, y }, damage, radius, 'both');
  for (const d of battle.defenders ?? []) {
    // Defenders still inside their coffin or hut take nothing.
    if (d.hp <= 0 || d.spawnedAt > at + 1e-9) continue;
    if (distance2D(d.x - x, d.y - y) > radius + 1e-9) continue;
    if ((freeze > 0 && !overgrowth) || stun > 0)
      d.stunnedUntil = Math.max(d.stunnedUntil ?? 0, at + Math.max(freeze, stun));
    if (quakeTroop > 0 && d.mode === 'ground') hurtDefender(battle, d, d.maxHp * quakeTroop);
    if (poison > 0) poisonDefender(battle, d, row, at, cast.interval);
  }
}

/** Earthquakes weaken with each earlier quake on the same building; walls use their own curve. */
function quake(
  ctx: NativeSpellContext,
  cast: NativeSpellCast,
  row: NativeRow,
  b: Building,
  permil: number,
  at: number,
) {
  const e = buildingEffects(ctx.battle, b);
  const key = `${cast.id}`;
  const seen = (e.quakeCasts ??= []);
  if (!seen.includes(key)) {
    seen.push(key);
    e.quakes = (e.quakes ?? 0) + 1;
  }
  const n = seen.indexOf(key) + 1;
  const hits = Math.max(1, num(row, 'NumberOfHits', 1));
  if (b.kind === 'wall') {
    // Earthquake Boots destroy every wall they reach outright (DestroyWalls, official wiki).
    if (flag(row, 'DestroyWalls')) return ctx.damageBuilding(b, b.maxHp, at, true);
    const extra = (num(row, 'PreferredTargetDamageMod', 5) * (n - 1) ** 2) / 100 / hits;
    ctx.damageBuilding(b, b.maxHp * (permil / n + extra), at, true);
  } else ctx.damageBuilding(b, (b.maxHp * permil) / (2 * n - 1), at, true);
}

/** Ramping poison: exposure raises damage toward the level's maximum; slows follow the cloud. */
function poisonDefender(battle: Battle, d: Defender, row: NativeRow, at: number, interval: number) {
  const tick = interval || 0.4;
  const state = (d.poison ??= { since: at, until: at, speed: 0, attack: 0 });
  if (state.until + 6 < at) state.since = at;
  state.until = at + Math.max(seconds(row, 'BoostTimeMS'), tick);
  state.speed = num(row, 'SpeedBoost') / 100;
  state.attack = num(row, 'AttackSpeedBoost') / 100;
  const ramp = flag(row, 'PoisonIncreaseSlowly') ? Math.min(1, (at - state.since + tick) / 5) : 1;
  // Guardians take poison damage and slows at the client's 30% (GUARDIAN_POISON_* globals).
  const scale =
    d.kind === 'guardian' ? nativeGlobal('GUARDIAN_POISON_SPEED_MULTIPLIER', 100) / 100 : 1;
  hurtDefender(battle, d, num(row, 'PoisonDPS') * tick * ramp * scale);
}

/** Friendly effects of an attacker's spell on attacking units. */
function supportAttackers(
  ctx: NativeSpellContext,
  cast: NativeSpellCast,
  row: NativeRow,
  at: number,
  x: number,
  y: number,
  radius: number,
) {
  const battle = ctx.battle;
  const damage = num(row, 'Damage');
  const heroScale = num(row, 'HeroDamageMultiplier', 100) / 100;
  const boostTime = seconds(row, 'BoostTimeMS');
  const poison = num(row, 'PoisonDPS') > 0;
  const jump = seconds(row, 'JumpBoostMS');
  const invisible = seconds(row, 'InvisibilityTime');
  const shieldTime = seconds(row, 'ShieldTime');
  const extraPermil = num(row, 'ExtraHealthPermil');
  const immortal = seconds(row, 'ImmortalTime');
  const given = text(row, 'GiveSpecialAbility');
  const overgrowth = flag(row, 'Overgrowth');
  const groundOnly =
    text(row, 'TargetInfoString').includes('TYPE_GROUND') &&
    !text(row, 'TargetInfoString').includes('AIR');
  const freezeFriendly = given === 'IceBlockSpell' ? seconds(row, 'FreezeTimeMS') : 0;
  if (!(
    damage < 0 ||
    (boostTime > 0 && !poison && given !== 'AngrySpellAnger') ||
    jump ||
    (invisible && !overgrowth) ||
    (shieldTime && !overgrowth) ||
    extraPermil ||
    immortal ||
    given
  ))
    return;
  for (const u of battle.units) {
    if (!liveAttacker(u, at) || isTotem(u)) continue;
    if (u.native?.siege && flag(row, 'ImmunitySiegeMachines')) continue;
    if (flag(row, 'DoesNotAffectOwner') && u.id === cast.owner) continue;
    if (distance2D(u.x - x, u.y - y) > radius + 1e-9) continue;
    const flying = !!TROOPS[u.kind].flying;
    if (damage < 0 && !(groundOnly && flying) && !u.native?.noHealing)
      healUnit(battle, u, -damage * (u.hero ? heroScale : 1));
    if (boostTime > 0 && !poison && given !== 'AngrySpellAnger') {
      const scale = u.hero ? 0.5 : 1;
      const speed = (num(row, 'SpeedBoost') / SPELL_SPEED_SCALE) * scale;
      const boostDamage = (num(row, 'DamageBoostPercent') / 100) * scale;
      const e = unitEffects(u);
      const old = e.boost;
      // Rage-like boosts never stack; each component keeps the strongest active source.
      e.boost =
        old && old.until > at + 1e-9
          ? {
              until: Math.max(old.until, at + boostTime),
              speed: Math.max(old.speed, speed),
              damage: Math.max(old.damage, boostDamage),
              attackSpeed: Math.max(old.attackSpeed, num(row, 'AttackSpeedBoost') / 100),
            }
          : {
              until: at + boostTime,
              speed,
              damage: boostDamage,
              attackSpeed: num(row, 'AttackSpeedBoost') / 100,
            };
    }
    if (jump && !flying) {
      const e = unitEffects(u);
      e.jumpUntil = Math.max(e.jumpUntil ?? 0, at + jump);
    }
    if (invisible && !overgrowth) {
      const e = unitEffects(u);
      e.invisibleUntil = Math.max(e.invisibleUntil ?? 0, at + invisible);
    }
    if (shieldTime && !overgrowth) {
      const e = unitEffects(u);
      const percent = num(row, 'ShieldProtectionPercent') / 100;
      e.shield =
        e.shield && e.shield.until > at + 1e-9 && e.shield.percent > percent
          ? e.shield
          : { until: at + shieldTime, percent };
    }
    if (extraPermil > 0) {
      const e = unitEffects(u);
      const cap = num(row, 'ExtraHealthMax');
      const amount = Math.min(cap > 0 ? cap : Infinity, (u.maxHp * extraPermil) / 1000);
      const until = at + (cast.interval || 0.3) + 1e-6;
      const previous = e.extraHp && e.extraHp.until >= at - 1e-9 ? e.extraHp : undefined;
      if (battle.nativeHeroPassives) {
        // Overlapping life auras use the strongest live source. Refreshing the
        // radius must neither replenish consumed health nor stack two auras.
        const sources = Object.fromEntries(
          Object.entries(previous?.sources ?? {}).filter(([, source]) => source.until >= at - 1e-9),
        );
        sources[cast.id] = { until, capacity: amount };
        const capacity = Math.max(...Object.values(sources).map((source) => source.capacity));
        e.extraHp = {
          sources,
          capacity,
          until: Math.max(...Object.values(sources).map((source) => source.until)),
          amount: previous
            ? Math.max(0, previous.amount + capacity - (previous.capacity ?? capacity))
            : capacity,
        };
      } else e.extraHp = { until, amount: previous ? Math.max(previous.amount, amount) : amount };
    }
    if (immortal) {
      const e = unitEffects(u);
      e.immortalUntil = Math.max(e.immortalUntil ?? 0, at + immortal);
    }
    if (given === 'IceBlockSpell' && !u.native?.burrowed) {
      const ability = nativeRow('abilities', given, num(row, 'GivenSpecialAbilityLevel', 1) || 1);
      const e = unitEffects(u);
      e.frozenUntil = Math.max(e.frozenUntil ?? 0, at + freezeFriendly);
      const percent = num(ability, 'ShieldProtectionPercent') / 100;
      e.shield = {
        until: Math.max(e.shield?.until ?? 0, at + freezeFriendly),
        percent: Math.max(percent, e.shield && e.shield.until > at ? e.shield.percent : 0),
      };
    }
    if (given === 'AngrySpellAnger') {
      if (cast.touched?.includes(u.id)) continue;
      (cast.touched ??= []).push(u.id);
      const ability = nativeRow('abilities', given, num(row, 'GivenSpecialAbilityLevel', 1) || 1);
      const state = (u.native ??= {});
      state.angryUntil = at + seconds(ability, 'DeactivateAfterTime');
      u.target = null;
      u.path = [];
      u.pathAt = 0;
    }
  }
}

/** Overgrowth roots every non-wall building in range: disabled, untargetable and immune. */
function overgrow(
  battle: Battle,
  row: NativeRow,
  at: number,
  x: number,
  y: number,
  radius: number,
) {
  const duration = seconds(row, 'ShieldTime') || seconds(row, 'FreezeTimeMS');
  for (const b of battle.buildings) {
    if (
      b.hp <= 0 ||
      b.kind === 'wall' ||
      isTrap(b.kind) ||
      footprintDistance(x, y, b) > radius + 1e-9
    )
      continue;
    const e = buildingEffects(battle, b);
    e.overgrownUntil = Math.max(e.overgrownUntil ?? 0, at + duration);
    battle.defenseStuns[b.id] = Math.max(battle.defenseStuns[b.id] ?? 0, e.overgrownUntil);
    delete battle.defenseTargets[b.id];
  }
  for (const u of battle.units)
    if (u.target !== null && battle.buildingEffects?.[u.target]?.overgrownUntil) {
      u.target = null;
      u.path = [];
      u.pathAt = 0;
    }
}

/** One copy per eligible unit each pulse, earliest deployment first, within the housing budget. */
function cloneUnits(
  ctx: NativeSpellContext,
  cast: NativeSpellCast,
  row: NativeRow,
  at: number,
  radius: number,
) {
  if (!ctx.spawn || (cast.budget ?? 0) <= 0) return;
  const lifetime = seconds(row, 'DuplicateLifetime');
  const inside = ctx.battle.units
    .filter(
      (u) =>
        liveAttacker(u, at) &&
        !u.hero &&
        !isTotem(u) &&
        !u.native?.siege &&
        distance2D(u.x - cast.x, u.y - cast.y) <= radius + 1e-9,
    )
    .sort((a, b) => (a.spawnedAt ?? 0) - (b.spawnedAt ?? 0) || a.id - b.id);
  for (const source of inside) {
    const space = housing(source);
    if (space > (cast.budget ?? 0)) continue;
    cast.budget! -= space;
    const p = randomPoint(cast, 1000 + cast.hits * 17 + source.id, radius);
    const copy = ctx.spawn(
      source.kind,
      source.level ??
        ctx.battle.troopLevels?.[source.kind as keyof NonNullable<Battle['troopLevels']>] ??
        1,
      p.x,
      p.y,
      at,
      source.native?.owner,
    );
    copy.summoned = true;
    copy.native = { ...copy.native, cloneUntil: at + lifetime };
    if (source.level === undefined) delete copy.level;
  }
}

/** Recall prefers heroes, then the largest housing, then the earliest deployment. */
function recallUnits(ctx: NativeSpellContext, cast: NativeSpellCast, at: number, radius: number) {
  if (!ctx.recall) return;
  const candidates = ctx.battle.units
    .filter(
      (u) =>
        liveAttacker(u, at) &&
        deployable(u) &&
        !isTotem(u) &&
        !u.native?.siege &&
        !u.native?.cloneUntil &&
        distance2D(u.x - cast.x, u.y - cast.y) <= radius + 1e-9,
    )
    .sort(
      (a, b) =>
        Number(!!b.hero) - Number(!!a.hero) ||
        housing(b) - housing(a) ||
        (a.spawnedAt ?? 0) - (b.spawnedAt ?? 0) ||
        a.id - b.id,
    );
  for (const u of candidates) {
    const space = housing(u);
    if (space > (cast.budget ?? 0)) continue;
    cast.budget! -= space;
    ctx.recall(u);
  }
}

function reviveHero(ctx: NativeSpellContext, row: NativeRow, x: number, y: number) {
  const reach = tiles(row, 'TargetingRadius');
  const fallen = ctx.battle.units
    .filter(
      (u) => u.hero && u.hp <= 0 && !u.ejected && distance2D(u.x - x, u.y - y) <= reach + 1e-9,
    )
    .sort((a, b) => distance2D(a.x - x, a.y - y) - distance2D(b.x - x, b.y - y) || a.id - b.id)[0];
  if (!fallen) return;
  fallen.hp = (fallen.maxHp * num(row, 'ResurrectHitpointPercentage')) / 100;
  fallen.spent = false;
  delete fallen.defeatedAt;
  fallen.target = null;
  fallen.path = [];
  fallen.pathAt = 0;
  ctx.effect({ type: 'spawn', x: fallen.x, y: fallen.y });
}

/** Skeleton/Bat spells: a first group at the first hit, the remainder evenly over the spawn time. */
function stepSpellSummons(ctx: NativeSpellContext, cast: NativeSpellCast, row: NativeRow) {
  const names = text(row, 'SummonTroop').split(';');
  if (names.length > 1) {
    cast.summonGroups ??= names.map(() => 0);
    names.forEach((name, i) => {
      const groupRow: Record<string, string> = { ...row, SummonTroop: name };
      for (const key of [
        'UnitsToSpawn',
        'SpawnUpgradeLevel',
        'SpawnDuration',
        'SpawnFirstGroupSize',
      ])
        groupRow[key] = text(row, key).split(';')[i] ?? text(row, key).split(';')[0];
      const group = { ...cast, released: cast.summonGroups![i] };
      stepSpellSummons(ctx, group, groupRow);
      cast.summonGroups![i] = group.released ?? 0;
    });
    cast.released = cast.summonGroups.reduce((sum, n) => sum + n, 0);
    return;
  }
  const troop = text(row, 'SummonTroop');
  const count = num(row, 'UnitsToSpawn');
  if (!troop || !count || !ctx.spawn || cast.hits === 0) return;
  const kind = unitKindForName(troop) as UnitKind | undefined;
  if (!kind) return;
  const first = Math.min(count, num(row, 'SpawnFirstGroupSize') || count);
  const duration = seconds(row, 'SpawnDuration');
  const radius = tiles(row, 'Radius') + tiles(row, 'RandomRadius');
  while ((cast.released ?? 0) < count) {
    const index = cast.released ?? 0;
    const due =
      index < first || count === first || duration <= 0
        ? cast.firstHit
        : cast.firstHit + ((index - first + 1) * duration) / (count - first);
    if (due > ctx.battle.elapsed + 1e-9) break;
    const p = randomPoint(cast, 5000 + index, radius);
    ctx.spawn(kind, num(row, 'SpawnUpgradeLevel', 1) || 1, p.x, p.y, due);
    cast.released = index + 1;
  }
}
const pendingSummons = (cast: NativeSpellCast, row: NativeRow) =>
  !!text(row, 'SummonTroop') &&
  (cast.released ?? 0) <
    text(row, 'UnitsToSpawn')
      .split(';')
      .reduce((sum, n) => sum + Number(n || 0), 0);

/** Harmful effects of a defensive spell (Spell Tower, Town Hall weapons) on attackers. */
function harmAttackers(
  ctx: NativeSpellContext,
  cast: NativeSpellCast,
  row: NativeRow,
  at: number,
  x: number,
  y: number,
  inRange: (distance: number) => boolean,
) {
  const battle = ctx.battle;
  const damage = num(row, 'Damage');
  const heroScale = num(row, 'HeroDamageMultiplier', 100) / 100;
  const freeze = seconds(row, 'FreezeTimeMS');
  const freezePercent = num(row, 'FreezePercent') / 100;
  const poison = num(row, 'PoisonDPS');
  const quake = num(row, 'TroopDamagePermil') / 1000;
  const interval = seconds(row, 'TimeBetweenHitsMS') || 0.4;
  const groundOnly =
    text(row, 'TargetInfoString').includes('TYPE_GROUND') &&
    !text(row, 'TargetInfoString').includes('AIR');
  for (const u of battle.units) {
    if (!liveAttacker(u, at) || u.native?.burrowed) continue;
    if (u.native?.siege && flag(row, 'ImmunitySiegeMachines')) continue;
    const flying = !!TROOPS[u.kind].flying;
    if (poison > 0 && flying && !flag(row, 'PoisonAffectAir')) continue;
    if (groundOnly && flying) continue;
    if (!inRange(distance2D(u.x - x, u.y - y))) continue;
    const scale = u.hero ? heroScale : 1;
    if (damage > 0) hurtUnit(battle, u, damage * scale, at);
    if (quake > 0) {
      // Repeated Spell Tower quakes on one unit deal 1/(2n-1) of the damage (official wiki).
      const e = unitEffects(u);
      const seen = (e.quakeCasts ??= []);
      if (!seen.includes(cast.id)) seen.push(cast.id);
      const n = seen.indexOf(cast.id) + 1;
      hurtUnit(battle, u, (u.maxHp * quake) / (2 * n - 1), at);
    }
    if (poison > 0) {
      const e = unitEffects(u);
      const since = e.poison && e.poison.until + 6 >= at ? e.poison.since : at;
      // Overlapping clouds never stack: the unit takes poison for the time since its last tick.
      const last = e.poison?.tickAt;
      const exposure = last !== undefined && last > at - interval ? at - last : interval;
      e.poison = {
        until: at + Math.max(seconds(row, 'BoostTimeMS'), interval),
        speed: Math.min(
          e.poison && e.poison.until > at ? e.poison.speed : 0,
          num(row, 'SpeedBoost') / 100,
        ),
        attackSpeed: Math.min(
          e.poison && e.poison.until > at ? e.poison.attackSpeed : 0,
          num(row, 'AttackSpeedBoost') / 100,
        ),
        dps: Math.max(poison, e.poison && e.poison.until > at ? e.poison.dps : 0),
        since,
        tickAt: at,
      };
      const ramp = flag(row, 'PoisonIncreaseSlowly') ? Math.min(1, (at - since + interval) / 5) : 1;
      if (exposure > 0) hurtUnit(battle, u, poison * exposure * ramp * scale, at);
    }
    if (freeze > 0) {
      const e = unitEffects(u);
      if (freezePercent > 0)
        e.chill = { until: Math.max(e.chill?.until ?? 0, at + freeze), percent: freezePercent };
      else e.frozenUntil = Math.max(e.frozenUntil ?? 0, at + freeze);
    }
  }
}

/** Friendly effects of a defensive spell on buildings (Spell Tower Rage, Invisibility). */
function supportDefense(
  battle: Battle,
  row: NativeRow,
  at: number,
  x: number,
  y: number,
  radius: number,
) {
  const boost = num(row, 'BuildingDamageBoostPercent') / 100;
  const invisible = seconds(row, 'InvisibilityTime');
  // Defensive Rage boosts Guardians at full strength (official wiki).
  const unitBoost = num(row, 'DamageBoostPercent') / 100;
  if (unitBoost > 0)
    for (const d of battle.defenders ?? [])
      if (d.kind === 'guardian' && d.hp > 0 && distance2D(d.x - x, d.y - y) <= radius + 1e-9)
        d.boost = {
          until: Math.max(d.boost?.until ?? 0, at + seconds(row, 'BoostTimeMS')),
          damage: unitBoost,
          speed: num(row, 'SpeedBoost') / SPELL_SPEED_SCALE,
        };
  if (!boost && !invisible) return;
  for (const b of battle.buildings) {
    if (
      b.hp <= 0 ||
      b.kind === 'wall' ||
      isTrap(b.kind) ||
      footprintDistance(x, y, b) > radius + 1e-9
    )
      continue;
    const e = buildingEffects(battle, b);
    if (boost)
      e.boost = {
        until: Math.max(e.boost?.until ?? 0, at + seconds(row, 'BoostTimeMS')),
        damage: boost,
      };
    if (invisible) e.invisibleUntil = Math.max(e.invisibleUntil ?? 0, at + invisible);
  }
}

export const spellEndTime = (cast: NativeSpellCast) =>
  cast.firstHit + Math.max(0, cast.total - 1) * cast.interval;
/** Walls inside an active Jump Spell are passable for every ground attacker. */
export function jumpWalls(battle: Battle) {
  const walls = new Set<number>();
  for (const cast of battle.nativeSpells ?? []) {
    const row = spellRow(cast.name, cast.level);
    const linger = seconds(row, 'JumpBoostMS');
    if (!linger || cast.side !== 'attack' || cast.firstHit > battle.elapsed + 1e-9) continue;
    if (spellEndTime(cast) + linger < battle.elapsed - 1e-9) continue;
    const radius = tiles(row, 'Radius');
    for (const b of battle.buildings)
      if (
        b.kind === 'wall' &&
        b.hp > 0 &&
        distance2D(b.x + 0.5 - cast.x, b.y + 0.5 - cast.y) <= radius + 1e-9
      )
        walls.add(b.id);
  }
  return walls;
}

/** A cast that will still damage buildings or release attackers. */
export function nativeSpellCanStillFight(cast: NativeSpellCast) {
  if (cast.ended || cast.side !== 'attack' || cast.follow !== undefined) return false;
  const row = spellRow(cast.name, cast.level);
  return (
    (cast.hits < cast.total &&
      (num(row, 'Damage') > 0 ||
        num(row, 'BuildingDamagePermil') > 0 ||
        num(row, 'PoisonDPS') > 0)) ||
    pendingSummons(cast, row) ||
    (!!text(row, 'ChainSpell') && cast.hits === 0)
  );
}
