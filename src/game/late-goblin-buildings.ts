import { BUILDINGS, TROOPS } from './data';
import type { LateCombatContext } from './late-campaign';
import type { Battle, Building } from './model';
import { spellTowerDefenseBoost } from './spell-tower';
import {
  goblinWeaponFor,
  HIDDEN_BUILDING_APPEAR_PERCENT,
  isLateGoblinIdentity,
  type GoblinWeaponKind,
} from './late-goblin-buildings-stats';
import {
  emptyWeaponSlots,
  firstWeaponTickAfter,
  launchLateProjectile,
  stepLateProjectiles,
  tickWeaponSlots,
  weaponCandidates,
  weaponTickTime,
  WEAPON_TICK_MS,
  type LateProjectile,
  type WeaponSlot,
} from './late-goblin-weapon';

/** Communications Mast, Goblin Hall (including its level-2 weapon), Goblin Castle,
 * Foreboding Cave and the Goblin Boss Town Hall with its weapon.
 * The campaign gate keeps affected villages unavailable until this is true. */
export const LATE_GOBLIN_BUILDINGS_READY = true;

export interface GoblinShot {
  index: number;
  slot: number;
  at: number;
  impact: number;
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  targetId: number;
  toAir: boolean;
}
export interface GoblinHit {
  index: number;
  at: number;
  x: number;
  y: number;
  toAir: boolean;
  struck: number;
}
export interface GoblinWeaponState {
  kind: GoblinWeaponKind;
  /** Activation: damage, >50% destruction (Goblin Hall) or combat start (Boss Town Hall). */
  activatedAt?: number;
  /** Activation plus CombatActivationDelay; also when the Defense building class is added. */
  readyAt?: number;
  nextTick: number;
  slots: WeaponSlot[];
  fired: number;
  /** Recent shots/hits for presentation and audio; retired on the battle clock. */
  shots: GoblinShot[];
  hits: GoblinHit[];
}
/** Battle-only state, reconstructed from the replay snapshot and simulation clock. */
export interface LateGoblinBuildingsBattleState {
  weapons: Record<number, GoblinWeaponState>;
  projectiles: LateProjectile[];
  destroyed: Record<number, number>;
}
/** These buildings apply no per-attacker status. */
export type LateGoblinBuildingsUnitState = Record<string, never>;

const HISTORY_SECONDS = 5;
const center = (b: Building) => ({
  x: b.x + BUILDINGS[b.kind].size / 2,
  y: b.y + BUILDINGS[b.kind].size / 2,
});
function stateFor(battle: Battle) {
  const late = battle.late;
  if (!late) return undefined;
  if (!late.goblinBuildings && !battle.buildings.some((b) => isLateGoblinIdentity(b.npc)))
    return undefined;
  return (late.goblinBuildings ??= { weapons: {}, projectiles: [], destroyed: {} });
}

function stepWeapons(battle: Battle, dt: number, state: LateGoblinBuildingsBattleState) {
  for (const building of battle.buildings) {
    const weapon = goblinWeaponFor(building);
    if (!weapon) continue;
    const s = (state.weapons[building.id] ??= {
      kind: weapon.kind,
      nextTick: firstWeaponTickAfter(battle.elapsed - dt),
      slots: emptyWeaponSlots(weapon.slots),
      fired: 0,
      shots: [],
      hits: [],
      // Without ActivateCombatOnDamageTaken or ActivateAfterSeconds the Boss weapon is
      // active from the start of combat, still subject to its CombatActivationDelay.
      ...(weapon.activateOnDamage ? {} : { activatedAt: 0, readyAt: weapon.activationDelay }),
    });
    if (
      s.activatedAt === undefined &&
      building.hp > 0 &&
      (building.hp < building.maxHp || battle.destruction > HIDDEN_BUILDING_APPEAR_PERCENT)
    ) {
      s.activatedAt = battle.elapsed;
      s.readyAt = battle.elapsed + weapon.activationDelay;
    }
    const from = center(building);
    while (weaponTickTime(s.nextTick) <= battle.elapsed + 1e-9) {
      const at = weaponTickTime(s.nextTick++);
      if (building.hp <= 0) {
        for (const slot of s.slots) Object.assign(slot, { targetId: null, chargeMs: 0 });
        continue;
      }
      if (s.readyAt === undefined || at < s.readyAt - 1e-9) continue;
      const boost = spellTowerDefenseBoost(battle, building, at);
      const candidates = weaponCandidates(battle, from, weapon, at);
      for (const { slot, target } of tickWeaponSlots(
        s.slots,
        candidates,
        WEAPON_TICK_MS * boost.rate,
        weapon.intervalMs,
      )) {
        const toAir = !!TROOPS[target.kind].flying;
        const projectile = launchLateProjectile({
          sourceId: building.id,
          index: ++s.fired,
          slot,
          targetId: target.id,
          toAir,
          fromX: from.x,
          fromY: from.y,
          x: target.x,
          y: target.y,
          launched: at,
          damage: boost.damage === 1 ? weapon.damage : weapon.damage * boost.damage,
          speed: weapon.projectileSpeed,
          tracking: weapon.tracking,
          splash: weapon.splash,
        });
        state.projectiles.push(projectile);
        s.shots.push({
          index: projectile.index,
          slot,
          at,
          impact: projectile.impact,
          fromX: from.x,
          fromY: from.y,
          x: target.x,
          y: target.y,
          targetId: target.id,
          toAir,
        });
      }
    }
    s.shots = s.shots.filter((shot) => shot.at >= battle.elapsed - HISTORY_SECONDS);
    s.hits = s.hits.filter((hit) => hit.at >= battle.elapsed - HISTORY_SECONDS);
  }
}

export function stepLateGoblinBuildings(context: LateCombatContext) {
  const { battle, phase } = context;
  if (phase !== 'projectiles' && phase !== 'defenses') return;
  const state = stateFor(battle);
  if (!state) return;
  if (phase === 'defenses') {
    stepWeapons(battle, context.dt, state);
    return;
  }
  const { pending, hits } = stepLateProjectiles(battle, state.projectiles);
  state.projectiles = pending;
  for (const { projectile: p, struck } of hits) {
    const weapon = state.weapons[p.sourceId];
    // Tracking arrows that lose their target land without a hit effect; bombs always explode.
    if (!weapon || (p.splash === 0 && !struck.length)) continue;
    weapon.hits.push({
      index: p.index,
      at: p.impact,
      x: p.x,
      y: p.y,
      toAir: p.toAir,
      struck: struck.length,
    });
  }
}
/** True while this family still has an unresolved effect that must finish before results. */
export function lateGoblinBuildingsPending(battle: Battle) {
  return (battle.late?.goblinBuildings?.projectiles.length ?? 0) > 0;
}
export function lateGoblinBuildingsDestroyed(
  context: LateCombatContext,
  building: Building,
  at: number,
) {
  if (!isLateGoblinIdentity(building.npc)) return;
  const state = stateFor(context.battle);
  if (!state) return;
  state.destroyed[building.id] ??= at;
  const weapon = state.weapons[building.id];
  if (weapon) for (const slot of weapon.slots) Object.assign(slot, { targetId: null, chargeMs: 0 });
}
/** ActivatedCombatAddBuildingClass=Defense: an active hall weapon attracts defense-targeting troops. */
export function lateGoblinBuildingsDefenseClass(battle: Battle, building: Building) {
  const weapon = battle.late?.goblinBuildings?.weapons[building.id];
  return (
    !!weapon &&
    building.hp > 0 &&
    weapon.readyAt !== undefined &&
    weapon.readyAt <= battle.elapsed + 1e-9
  );
}
