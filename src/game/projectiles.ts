import { archerTowerProjectileRow } from './archer-tower-stats';
import { cannonProjectileRow } from './cannon-stats';
import { recordCannonFlight, recordCannonHit } from './cannon-attack';
import { distance2D } from './distance';
import { recordBombTowerHit } from './bomb-tower-attack';
import { recordWizardTowerHit } from './wizard-tower-attack';
import { BUILDINGS, TROOPS, isTrap } from './data';
import type { Battle, Building, FX, Unit } from './model';
import { healerContribution, HEALER_HERO_SCALE } from './healing';
import { damageDefenders, hurtDefender, type Defender } from './defenders';
import { XBOW_PROJECTILES } from './xbow-stats';
import { WIZARD_TOWER_PROJECTILES } from './wizard-tower-stats';
import { flag, nativeRow, num } from './native-data';
import { hurtUnit } from './native-status';

export type Weapon =
  | 'arrow'
  | 'cannonball'
  | 'rocket'
  | 'fireball'
  | 'bomb'
  | 'towerbomb'
  | 'arcane'
  | 'healing'
  | 'xbowbolt'
  | 'native';
export interface CombatProjectile {
  id: string;
  weapon: Weapon;
  sourceId: number;
  targetId: number;
  targetBuilding: boolean;
  targetDefender?: boolean;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  fromAir?: boolean;
  toAir?: boolean;
  launched: number;
  impact: number;
  damage: number;
  splash?: number;
  /** Native Cannon/Archer Tower/X-Bow level or Wizard Tower projectile tier; X-Bow ammunition sequence. */
  variant?: number;
  sequence?: number;
  /** Actual position of a tracking Cannon shot, tower arrow or X-Bow bolt at the last simulation sample. */
  flight?: { x: number; y: number; at: number };
  /** Version 45+ native roster projectile: client projectile row, shooter kind/level and bounce index. */
  native?: { name: string; kind: string; level: number; bounce?: number };
  /** Version 45+ defense shot rules resolved on impact (bounces, hit spells, %-hitpoint bonus). */
  defense?: NativeDefenseShot;
}
export interface NativeDefenseShot {
  /** Units already struck by this shot and its ricochets. */
  hit: number[];
  air: boolean;
  ground: boolean;
  bounces: number;
  bounceDistance: number;
  /** Fraction kept by each ricochet (0.7 = -30%). */
  bounceFactor: number;
  /** Bonus damage as permil of the target's maximum hitpoints (not boosted by Rage). */
  hpPermil?: number;
  /** Eagle Artillery shockwave outside the main shell radius. */
  shock?: { damage: number; inner: number; outer: number; pushback: number; housing: number };
  /** Ground splash radius (geared-up Mortar). */
  splash?: number;
  /** Splash on the struck unit's layer only (Longshot). */
  layerSplash?: number;
  /** Scattershot fragment cone behind the impact, limited to the struck layer. */
  scatter?: { level: number; angle: number };
  /** Spell released where the shot lands (Spell Tower, Inferno Artillery pools). */
  spell?: { name: string; level: number };
  /** Hero Hunter: poison left on the struck unit. */
  poison?: { level: number; seconds: number };
  /** Cake-A-Pult: a bomb left where the cake lands, hitting both layers after a delay. */
  bomb?: { damage: number; radius: number; delay: number };
}

// Tiles/second. Wizard fireballs and Bomb Tower bombs use client values;
// other weapons retain local tuning. Flight follows battle time, including replays.
const SPEED: Record<Weapon, number> = {
  arrow: 18,
  cannonball: 16,
  rocket: 22,
  fireball: 5,
  bomb: 10,
  towerbomb: 8,
  arcane: WIZARD_TOWER_PROJECTILES[0].speed,
  healing: 12,
  xbowbolt: XBOW_PROJECTILES[0].speed,
  native: 10,
};
const nativeSpeed = (p: Pick<CombatProjectile, 'native'>) =>
  Math.max(0.5, num(nativeRow('projectiles', p.native!.name), 'Speed', 1000) / 100);
/** Client FixedTravelTime (ms) replaces distance-based flight; DamageDelay follows the landing. */
const nativeFixedFlight = (p: Pick<CombatProjectile, 'native'>) => {
  const row = nativeRow('projectiles', p.native!.name);
  const fixed = num(row, 'FixedTravelTime');
  return fixed > 0 ? (fixed + num(row, 'DamageDelay')) / 1000 : 0;
};
const nativeCannon = (p: Pick<CombatProjectile, 'weapon' | 'variant'>) =>
  p.weapon === 'cannonball' && p.variant !== undefined;
const nativeArcherTower = (p: Pick<CombatProjectile, 'weapon' | 'variant'>) =>
  p.weapon === 'arrow' && p.variant !== undefined;
const archerTowerSpeed = (p: Pick<CombatProjectile, 'variant'>) =>
  Number(archerTowerProjectileRow(p.variant!).Speed) / 100;
const cannonSpeed = (p: Pick<CombatProjectile, 'variant'>) =>
  Number(cannonProjectileRow(p.variant!).Speed) / 100;
function xbowSpeed(p: Pick<CombatProjectile, 'variant'>) {
  const source = XBOW_PROJECTILES[(p.variant ?? 1) - 1];
  if (!source) throw Error('Unsupported native X-Bow projectile');
  return source.speed;
}
function wizardTowerSpeed(p: Pick<CombatProjectile, 'variant'>) {
  const source = WIZARD_TOWER_PROJECTILES[(p.variant ?? 1) - 1];
  if (!source) throw Error('Unsupported native Wizard Tower projectile');
  return source.speed;
}
function buildingAim(p: Pick<CombatProjectile, 'weapon' | 'fromX' | 'fromY'>, b: Building) {
  const size = BUILDINGS[b.kind].size;
  // Bombs drop onto the approached edge of the footprint. Forcing the far
  // center could send a falling bomb upward across a tall building's artwork.
  return p.weapon === 'bomb'
    ? {
        x: Math.max(b.x, Math.min(p.fromX, b.x + size)),
        y: Math.max(b.y, Math.min(p.fromY, b.y + size)),
      }
    : { x: b.x + size / 2, y: b.y + size / 2 };
}
export function launchProjectile(
  battle: Battle,
  shot: Omit<CombatProjectile, 'id' | 'launched' | 'impact'>,
  emit: (fx: FX) => void,
  at = battle.elapsed,
) {
  const duration =
    shot.weapon === 'bomb'
      ? 0.33
      : shot.weapon === 'native' && nativeFixedFlight(shot)
        ? nativeFixedFlight(shot)
        : Math.max(
            nativeCannon(shot) ||
              nativeArcherTower(shot) ||
              shot.weapon === 'healing' ||
              shot.weapon === 'towerbomb' ||
              shot.weapon === 'fireball' ||
              shot.weapon === 'arcane' ||
              shot.weapon === 'xbowbolt'
              ? 0.01
              : 0.12,
            distance2D(shot.x - shot.fromX, shot.y - shot.fromY) /
              (shot.weapon === 'native'
                ? nativeSpeed(shot)
                : nativeCannon(shot)
                  ? cannonSpeed(shot)
                  : nativeArcherTower(shot)
                    ? archerTowerSpeed(shot)
                    : shot.weapon === 'xbowbolt'
                      ? xbowSpeed(shot)
                      : shot.weapon === 'arcane'
                        ? wizardTowerSpeed(shot)
                        : SPEED[shot.weapon]),
          );
  const projectile: CombatProjectile = {
    ...shot,
    id: `${shot.sourceId}:${at}${shot.native?.bounce ? `:${shot.native.bounce}` : ''}${
      // Multi-target defenses release several shots in one instant.
      shot.defense ? `:d${(battle.nativeShotSequence = (battle.nativeShotSequence ?? 0) + 1)}` : ''
    }`,
    launched: at,
    impact: at + duration,
    ...(shot.weapon === 'xbowbolt' || nativeCannon(shot) || nativeArcherTower(shot)
      ? { flight: { x: shot.fromX, y: shot.fromY, at } }
      : {}),
  };
  // Only bombs aim at the footprint, so every other shot skips the O(buildings) lookup.
  const target =
    shot.weapon === 'bomb' && shot.targetBuilding
      ? battle.buildings.find((b) => b.id === shot.targetId)
      : undefined;
  if (target) Object.assign(projectile, buildingAim(shot, target));
  (battle.projectiles ??= []).push(projectile);
  emit(projectileEffect(projectile, 'projectile'));
  return projectile;
}

export function projectileEffect(p: CombatProjectile, type: 'projectile' | 'impact'): FX {
  return {
    type,
    projectileId: p.id,
    weapon: p.weapon,
    x: p.fromX,
    y: p.fromY,
    toX: p.x,
    toY: p.y,
    sourceId: p.sourceId,
    targetId: p.targetId,
    targetBuilding: p.targetBuilding,
    targetDefender: p.targetDefender,
    fromAir: p.fromAir,
    toAir: p.toAir,
    radius: p.splash,
  };
}

/** Resolve once even if the shooter died. Direct shots never switch targets. */
export function stepProjectiles(
  battle: Battle,
  damage: (target: Building, power: number, at: number) => void,
  emit: (fx: FX) => void,
  nativeImpact?: (projectile: CombatProjectile) => void,
) {
  const pending: CombatProjectile[] = [];
  // Ricochets launched while resolving impacts join the list after this sample.
  const initial = battle.projectiles?.length ?? 0;
  // Id lookups once per sample instead of a linear scan per projectile.
  // Built on first use: most samples carry no tracking or landing projectile at all.
  // Contents are the lists as they stood when the sample began, exactly as before.
  const lazyIndex = <T extends { id: number }>(list: readonly T[] | undefined) => {
    const items = list ? list.slice() : [];
    let map: Map<number, T> | undefined;
    return {
      get: (id: number) => {
        if (!map) {
          map = new Map();
          for (const item of items) map.set(item.id, item);
        }
        return map.get(id);
      },
    };
  };
  const hasShots = initial > 0;
  const unitById = lazyIndex(hasShots ? battle.units : undefined);
  const buildingById = lazyIndex(hasShots ? battle.buildings : undefined);
  const defenderById = lazyIndex(hasShots ? battle.defenders : undefined);
  const trackableByNative = new Map<string, boolean>();
  // Tracking bolts travel a bounded distance each sample. Moving a target does
  // not teleport the bolt or preserve an arrival deadline at its old position.
  for (const p of battle.projectiles ?? []) {
    if ((p.weapon !== 'xbowbolt' && !nativeCannon(p) && !nativeArcherTower(p)) || !p.flight)
      continue;
    const target = unitById.get(p.targetId);
    if (target && target.hp > 0) {
      p.x = target.x;
      p.y = target.y;
    }
    const distance = distance2D(p.x - p.flight.x, p.y - p.flight.y);
    const speed = nativeCannon(p)
      ? cannonSpeed(p)
      : nativeArcherTower(p)
        ? archerTowerSpeed(p)
        : xbowSpeed(p);
    p.impact = Math.max(p.launched + 0.01, p.flight.at + distance / speed);
    const fraction = distance
      ? Math.min(1, (Math.max(0, battle.elapsed - p.flight.at) * speed) / distance)
      : 1;
    p.flight.x += (p.x - p.flight.x) * fraction;
    p.flight.y += (p.y - p.flight.y) * fraction;
    p.flight.at = Math.min(battle.elapsed, p.impact);
  }
  const shots = battle.projectiles ?? [];
  // Snapshot semantics: ricochets launched mid-sample join after it, even when skipping the sort.
  const ordered = shots.length < 2 ? shots.slice() : [...shots].sort((a, b) => a.impact - b.impact);
  for (const p of ordered) {
    const target = p.targetDefender
      ? defenderById.get(p.targetId)
      : p.targetBuilding
        ? buildingById.get(p.targetId)
        : unitById.get(p.targetId);
    let trackable = true;
    if (p.defense && p.native) {
      let cached = trackableByNative.get(p.native.name);
      if (cached === undefined) {
        cached = !flag(nativeRow('projectiles', p.native.name), 'DontTrackTarget');
        trackableByNative.set(p.native.name, cached);
      }
      trackable = cached;
    }
    if (
      target &&
      target.hp > 0 &&
      p.weapon !== 'healing' &&
      p.weapon !== 'towerbomb' &&
      p.weapon !== 'arcane' &&
      p.weapon !== 'fireball' &&
      trackable
    ) {
      const aim = p.targetBuilding ? buildingAim(p, target as Building) : target;
      p.x = aim.x;
      p.y = aim.y;
    }
    if (p.weapon === 'cannonball') recordCannonFlight(battle, p);
    if (p.impact > battle.elapsed + 1e-9) {
      pending.push(p);
      continue;
    }
    const hitLivingTarget = !!target && target.hp > 0;
    if (p.weapon === 'native') {
      nativeImpact?.(p);
    } else if (p.weapon === 'healing') {
      for (const unit of battle.units)
        if (
          unit.hp > 0 &&
          (unit.spawnedAt ?? 0) <= p.impact + 1e-9 &&
          !TROOPS[unit.kind].flying &&
          distance2D(unit.x - p.x, unit.y - p.y) <= (p.splash ?? 0)
        )
          unit.hp = Math.min(
            unit.maxHp,
            unit.hp +
              p.damage *
                healerContribution(battle, unit, p.sourceId) *
                (unit.hero ? HEALER_HERO_SCALE : 1),
          );
    } else if (p.targetDefender) {
      if (p.splash) {
        damageDefenders(battle, p, p.damage, p.splash, p.toAir ? 'air' : 'ground');
        if (!p.toAir)
          for (const b of battle.buildings) {
            if (b.hp <= 0 || isTrap(b.kind)) continue;
            const size = BUILDINGS[b.kind].size;
            if (
              distance2D(
                Math.max(b.x - p.x, 0, p.x - b.x - size),
                Math.max(b.y - p.y, 0, p.y - b.y - size),
              ) <= p.splash
            )
              damage(b, p.damage, p.impact);
          }
      } else if (target && target.hp > 0) hurtDefender(battle, target as Defender, p.damage);
    } else if (p.targetBuilding) {
      if (target && target.hp > 0) damage(target as Building, p.damage, p.impact);
      if (p.splash) damageDefenders(battle, p, p.damage, p.splash, 'ground');
      if (p.splash)
        for (const b of battle.buildings) {
          if (b.id === p.targetId || b.hp <= 0 || isTrap(b.kind)) continue;
          const size = BUILDINGS[b.kind].size;
          const distance = distance2D(
            Math.max(b.x - p.x, 0, p.x - b.x - size),
            Math.max(b.y - p.y, 0, p.y - b.y - size),
          );
          if (distance <= p.splash) damage(b, p.damage, p.impact);
        }
    } else if (p.splash) {
      for (const u of battle.units)
        if (
          u.hp > 0 &&
          (u.spawnedAt ?? 0) <= p.impact + 1e-9 &&
          !!TROOPS[u.kind].flying === !!p.toAir &&
          distance2D(u.x - p.x, u.y - p.y) <= p.splash &&
          !u.native?.burrowed
        )
          hurtUnit(battle, u, p.damage, p.impact, p.sourceId);
    } else if (
      target &&
      target.hp > 0 &&
      (!('spawnedAt' in target) || (target.spawnedAt ?? 0) <= p.impact + 1e-9)
    )
      hurtUnit(battle, target as Unit, p.damage, p.impact, p.sourceId);
    if (p.weapon === 'xbowbolt') {
      const state = battle.xbows?.[p.sourceId];
      if (state && hitLivingTarget) {
        state.hits.push({ at: p.impact, index: p.sequence! });
        if (state.hits.length > 32) state.hits.shift();
      }
    }
    if (p.weapon === 'cannonball') recordCannonHit(battle, p);
    if (p.weapon === 'towerbomb') recordBombTowerHit(battle, p);
    if (p.weapon === 'arcane') recordWizardTowerHit(battle, p);
    if (battle.nativeArcherTowers && nativeArcherTower(p)) {
      battle.archerTowerHits = (battle.archerTowerHits ?? []).filter(
        (hit) => battle.elapsed - hit.at < 2,
      );
      battle.archerTowerHits.push({
        id: p.id,
        sourceId: p.sourceId,
        level: p.variant!,
        at: p.impact,
        x: p.x,
        y: p.y,
        air: !!p.toAir,
      });
    }
    emit(projectileEffect(p, 'impact'));
  }
  battle.projectiles = [...pending, ...(battle.projectiles ?? []).slice(initial)];
}
