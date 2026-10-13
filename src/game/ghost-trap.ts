import { trapSpawnerLevel } from './character-catalog';
import { BUILDINGS, TROOPS } from './data';
import { distance2D } from './distance';
import { nearestPassable, sourceCos, sourceSin } from './garrison-abilities';
import { groundCollision } from './subtile-path';
import { spawnGarrisonDefender } from './garrison-combat';
import { characterLevel } from './character-catalog';
import { spawnedGarrisonKind } from './garrison-kinds';
import type { LateCombatContext } from './late-campaign';
import type { Battle, Building, Unit } from './model';

/** Ghost Trap: a campaign Skeleton Trap variant that releases a defending Royal Ghost
 * (reference/garrison/README.md). The campaign gate keeps affected villages unavailable until this is true. */
export const GHOST_TRAP_READY = true;

/** Pinned `Ghost Trap` row (traps.csv 12000019, one level). Times in seconds, distances in tiles. */
export function ghostTrapSource() {
  const row = trapSpawnerLevel('Ghost Trap', 1);
  const spawnLevel = Number(row.SpawnLvl);
  const character = row.SpawnedCharGround;
  // SpawnLvl is 1-based: the Skeleton Trap's level 5 names SpawnLvl 2 of two Trap Skeleton rows.
  const visualLevel = Number(characterLevel(character, spawnLevel)?.VisualLevel ?? NaN);
  return {
    trigger: Number(row.TriggerRadius) / 100,
    ground: row.GroundTrigger === 'TRUE',
    air: row.AirTrigger === 'TRUE',
    minHousing: Number(row.MinTriggerHousingLimit),
    character,
    kind: spawnedGarrisonKind(character),
    level: visualLevel,
    spawns: Number(row.NumSpawns),
    firstSpawn: Number(row.SpawnInitialDelayMs) / 1000,
    interval: Number(row.TimeBetweenSpawnsMs) / 1000,
    actionFrame: Number(row.ActionFrame),
    exports: {
      armed: row.ExportName,
      triggered: row.ExportNameTriggered,
      broken: row.ExportNameBroken,
    },
  };
}
const SOURCE = ghostTrapSource();
if (!SOURCE.kind || !Number.isInteger(SOURCE.level)) throw Error('Unsupported Ghost Trap spawn');
/** The older LogicTrap spawn: `SetSpawnTime(200)` then the character's SpawnIdle (at least 10 ms). */
const SPAWN_TIME = 0.2;
const SPAWN_IDLE = 0.01;

export interface GhostTrapActivation {
  trapId: number;
  activatedAt: number;
  /** Defender IDs of the spawned Royal Ghosts, in spawn order. */
  spawned: number[];
}
/** Battle-only state, reconstructed from the replay snapshot and simulation clock. */
export interface GhostTrapBattleState {
  traps: Record<number, GhostTrapActivation>;
}
/** Per-attacker status owned by this family (none: the Royal Ghost's frost lives in garrison status). */
export type GhostTrapUnitState = Record<string, never>;

const EPSILON = 1e-9;
const eligible = (u: Unit, at: number) =>
  u.hp > 0 &&
  !u.ejected &&
  (u.spawnedAt ?? 0) <= at &&
  (u.hero ? 25 : TROOPS[u.kind].space) >= SOURCE.minHousing &&
  (TROOPS[u.kind].flying ? SOURCE.air : SOURCE.ground);

export function stepGhostTrap(context: LateCombatContext) {
  const { battle, phase } = context;
  if (battle.finished || phase !== 'traps') return;
  for (const trap of battle.buildings) {
    if (trap.npc !== 'ghost-trap' || trap.constructing || trap.upgradeEnd) continue;
    const center = {
      x: trap.x + BUILDINGS[trap.kind].size / 2,
      y: trap.y + BUILDINGS[trap.kind].size / 2,
    };
    const state = battle.late!.ghostTrap?.traps[trap.id];
    if (!state && !battle.traps[trap.id]) {
      const nearby = battle.units.filter(
        (u) =>
          eligible(u, battle.elapsed) &&
          distance2D(u.x - center.x, u.y - center.y) <= SOURCE.trigger,
      );
      if (!nearby.length) continue;
      nearby.sort(
        (a, b) =>
          distance2D(a.x - center.x, a.y - center.y) - distance2D(b.x - center.x, b.y - center.y) ||
          a.id - b.id,
      );
      battle.traps[trap.id] = {
        activatedAt: battle.elapsed,
        resolved: false,
        targetId: nearby[0].id,
        ...center,
        spawned: 0,
      };
      (battle.late!.ghostTrap ??= { traps: {} }).traps[trap.id] = {
        trapId: trap.id,
        activatedAt: battle.elapsed,
        spawned: [],
      };
    }
    spawnDue(battle, trap, center);
  }
}

/**
 * Spawn times follow the Skeleton Trap convention: SpawnInitialDelayMs, then TimeBetweenSpawnsMs.
 * Positions follow the older LogicTrap.SpawnUnit: 0.75 tiles (384 units) from the trap center at
 * `360 * i / NumSpawns + 59 * remaining % 360` degrees, via the integer sine table.
 */
function spawnDue(battle: Battle, trap: Building, center: { x: number; y: number }) {
  const state = battle.late?.ghostTrap?.traps[trap.id];
  const record = battle.traps[trap.id];
  if (!state || !record) return;
  while (state.spawned.length < SOURCE.spawns) {
    const index = state.spawned.length;
    const at = state.activatedAt + SOURCE.firstSpawn + index * SOURCE.interval;
    if (at > battle.elapsed + EPSILON) break;
    const remaining = SOURCE.spawns - index;
    const angle = Math.trunc((360 * index) / SOURCE.spawns) + ((59 * remaining) % 360);
    const point = nearestPassable(
      groundCollision(battle, battle.buildings),
      center.x + Math.trunc((384 * sourceCos(angle)) / 1024) / 512,
      center.y + Math.trunc((384 * sourceSin(angle)) / 1024) / 512,
    );
    if (!point) {
      // No passable point within three tiles: the older SpawnUnit skips this spawn (ID 0).
      state.spawned.push(0);
      record.spawned = state.spawned.length;
      continue;
    }
    const ghost = spawnGarrisonDefender(
      battle,
      SOURCE.kind!,
      SOURCE.level,
      trap.id,
      point.x,
      point.y,
      at,
    );
    ghost.idleUntil = at + SPAWN_TIME + SPAWN_IDLE;
    state.spawned.push(ghost.id);
    record.spawned = state.spawned.length;
  }
  if (state.spawned.length >= SOURCE.spawns) record.resolved = true;
}

/** Spawned ghosts are ordinary defenders; the trap itself never blocks a result. */
export function ghostTrapPending(battle: Battle) {
  void battle;
  return false;
}
/** Traps have no destructible body. */
export function ghostTrapDestroyed(context: LateCombatContext, building: Building, at: number) {
  void context;
  void building;
  void at;
}
