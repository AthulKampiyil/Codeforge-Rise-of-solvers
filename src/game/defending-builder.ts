import {
  characterLevel,
  defenceTroopLevel,
  REPAIR_GLOBALS,
  sourceFlag,
  sourceNumber,
} from './character-catalog';
import { builderHutActivation } from './builder-hut';
import { BUILDINGS, isTrap } from './data';
import { nonWallBuildings } from './building-lists';
import { distance2D } from './distance';
import { splitTiming } from './garrison-kinds';
import { lateBuildingHidden, lateDefenderStats, type LateCombatContext } from './late-campaign';
import { findPath, distanceTo, type Battle, type Building } from './model';

/**
 * Defending Builder: the character each armed Builder's Hut (source levels 2+) sends out to repair.
 *
 * Source (pinned rows): `Builders Hut` levels 2–4 name `DefenceTroopCharacter=Defending Builder`,
 * `DefenceTroopCount=1` and `DefenceTroopLevel` 1–3 (1-based, as the older
 * LogicDefenceUnitProductionComponent's `SetUpgradeLevel(level - 1)`). The character rows give
 * Speed 250, AttackRange 50, AttackSpeed 750, a negative DPS (-50/-60/-70: HP restored per
 * second), IsJumper, HP 100,000+ and `DeathShowTimeMS=1` with an empty death export. Globals:
 * `HEAL_STACK_PERCENT` 100,100,90,90,70,40,10,0 and `ALLOW_REPAIR_AFTER_DAMAGE_TICKS` 0.
 *
 * Engine (older pinned-generation client, see reference/garrison/README.md):
 * - LogicDefenceUnitProductionComponent.Tick spawns each defence troop on the first battle tick at
 *   `(GetX(), GetY() + height << 8)`: the building's left edge, vertical middle.
 * - LogicHitpointComponent.CauseDamage gives each healer one of eight slots per target (held
 *   1,000 ms after each heal) and scales the heal by `HEAL_STACK_PERCENT[slot]`; a target at 0 HP
 *   is never healed, and hit points are clamped to the maximum.
 *
 * Behavior (public documentation):
 * - [Supercell, Battle Builders](https://supercell.com/en/games/clashofclans/blog/game-updates/battle-builders-2/):
 *   he repairs nearby buildings, cannot be damaged or targeted by attacking troops, stops once his
 *   own hut is destroyed, and a Lightning Spell resets his repair target.
 * - [House of Clashers, Battle Builder](https://houseofclashers.com/home-village/defenses/battle-builder):
 *   repairs only within 4 tiles of his hut; when the hut collapses he runs back and hides.
 * - [Fandom, Builder's Hut](https://clashofclans.fandom.com/wiki/Builder's_Hut) (wikitext): he repairs
 *   any damaged building except Walls while his hut stands, keeps one building until it is
 *   destroyed or fully repaired, defensive Rage raises repair and speed, Invisibility hides
 *   buildings from him, and several Builders on one building lose up to 10% (five Builders).
 * - Local: the most damaged candidate (lowest hit point fraction, then nearest, then ID); the radius
 *   is measured from the hut center to the building footprint; repairs use the split attack timer
 *   (200 ms windup, 550 ms recovery for healing rows).
 */
export const DEFENDING_BUILDER = 'Defending Builder';
export const DEFENDING_BUILDER_REPAIR_RADIUS = 4;
export const DEFENDING_BUILDER_HISTORY = 8;
/** LogicHitpointComponent: eight healer slots, each held 1,000 ms after a heal. */
export const DEFENDING_BUILDER_HEAL_SLOTS = 8;
const HEAL_SLOT_SECONDS = 1;
const HEAL_STACK_PERCENT = REPAIR_GLOBALS.HEAL_STACK_PERCENT;
if (REPAIR_GLOBALS.ALLOW_REPAIR_AFTER_DAMAGE_TICKS !== 0)
  throw Error('Repair delays after damage are not modeled');

export function defendingBuilderStats(level: number) {
  const row = characterLevel(DEFENDING_BUILDER, level);
  if (!row) throw Error(`Unsupported Defending Builder level ${level}`);
  const timing = splitTiming(row);
  return {
    level,
    animation: String(row.Animation),
    hp: sourceNumber(row, 'Hitpoints'),
    speed: sourceNumber(row, 'Speed') / 100,
    range: sourceNumber(row, 'AttackRange') / 100,
    rate: timing.period,
    firstRepair: timing.firstHit,
    recovery: timing.recovery,
    /** HP restored per repair: -DPS * AttackSpeed. */
    repair: (-sourceNumber(row, 'DPS') * sourceNumber(row, 'AttackSpeed')) / 1000,
    repairPerSecond: -sourceNumber(row, 'DPS'),
    jumper: sourceFlag(row, 'IsJumper'),
    deathShowTime: sourceNumber(row, 'DeathShowTimeMS') / 1000,
  };
}
/** The Defending Builder level an armed Builder's Hut level sends out, or undefined when unarmed. */
export function hutBuilderLevel(hutLevel: number) {
  try {
    const row = defenceTroopLevel('Builders Hut', hutLevel);
    return row.DefenceTroopCharacter === DEFENDING_BUILDER
      ? Number(row.DefenceTroopLevel)
      : undefined;
  } catch {
    return undefined;
  }
}

export interface DefendingBuilderRepair {
  n: number;
  at: number;
  targetId: number;
  amount: number;
  /** Healer slot on the target; `HEAL_STACK_PERCENT[slot]` scaled this repair. */
  slot: number;
}
export interface DefendingBuilder {
  /** Positive; garrison defenders use negative IDs, so Spell Tower defender records never collide. */
  id: number;
  hutId: number;
  level: number;
  x: number;
  y: number;
  spawnedAt: number;
  target: number | null;
  path: { x: number; y: number }[];
  pathAt: number;
  cooldown: number;
  recovery: number;
  engaged?: boolean;
  repairing: boolean;
  repairCount: number;
  repairs: DefendingBuilderRepair[];
  /** The hut was destroyed: he walks back and hides at `hiddenAt`. */
  retreating?: boolean;
  hiddenAt?: number;
}
export interface DefendingBuilderHealSlot {
  id: number;
  until: number;
}
/** Battle-only state, reconstructed from the replay snapshot and simulation clock. */
export interface DefendingBuilderBattleState {
  builders: DefendingBuilder[];
  /** Healer slots per repaired building ID (LogicHitpointComponent healing IDs and times). */
  slots: Record<number, DefendingBuilderHealSlot[]>;
  /** Lowest hit points each repaired building reached before a repair: loot is never returned. */
  lowest: Record<number, number>;
}

const EPSILON = 1e-9;
const hutCenter = (hut: Building) => {
  const size = BUILDINGS[hut.kind].size;
  return { x: hut.x + size / 2, y: hut.y + size / 2 };
};

function builderState(battle: Battle) {
  if (!battle.late) throw Error('Defending Builders need version-44 late campaign state');
  return (battle.late.defendingBuilder ??= { builders: [], slots: {}, lowest: {} });
}

/** Spawn one Defending Builder for `hut` at battle time `at` (needs version-44 late state). */
export function spawnDefendingBuilder(battle: Battle, hut: Building, at: number): DefendingBuilder {
  const level = hutBuilderLevel(hut.level);
  if (hut.kind !== 'builder' || hut.npc || level === undefined)
    throw Error("Defending Builders come only from armed Builder's Huts");
  const state = builderState(battle);
  const size = BUILDINGS[hut.kind].size;
  const builder: DefendingBuilder = {
    id: state.builders.length + 1,
    hutId: hut.id,
    level,
    x: hut.x,
    y: hut.y + size / 2,
    spawnedAt: at,
    target: null,
    path: [],
    pathAt: 0,
    cooldown: 0,
    recovery: 0,
    repairing: false,
    repairCount: 0,
    repairs: [],
  };
  state.builders.push(builder);
  return builder;
}

/** Damaged, standing, visible non-Wall buildings are repairable. */
const repairable = (battle: Battle, b: Building) =>
  b.hp > 0 &&
  b.hp < b.maxHp &&
  b.kind !== 'wall' &&
  !isTrap(b.kind) &&
  !lateBuildingHidden(battle, b);

/** Repairable buildings within the repair radius of the hut, most damaged first. */
export function defendingBuilderCandidates(battle: Battle, builder: DefendingBuilder) {
  const hut = battle.buildings.find((b) => b.id === builder.hutId);
  if (!hut) return [];
  const center = hutCenter(hut);
  const maxHp = (b: Building) => b.maxHp || 1;
  return battle.buildings
    .filter(
      (b) =>
        repairable(battle, b) && distanceTo(center, b) <= DEFENDING_BUILDER_REPAIR_RADIUS + EPSILON,
    )
    .sort(
      (a, b) =>
        a.hp / maxHp(a) - b.hp / maxHp(b) ||
        distanceTo(builder, a) - distanceTo(builder, b) ||
        a.id - b.id,
    );
}

/** Buildings by id for the battle's list (first entry wins, like `find`). */
const buildingIndexes = new WeakMap<
  readonly Building[],
  { length: number; byId: Map<number, Building> }
>();
function buildingById(battle: Battle, id: number | null) {
  const list = battle.buildings;
  let index = buildingIndexes.get(list);
  if (!index || index.length !== list.length) {
    const byId = new Map<number, Building>();
    for (const b of list) if (!byId.has(b.id)) byId.set(b.id, b);
    index = { length: list.length, byId };
    buildingIndexes.set(list, index);
  }
  return id === null ? undefined : index.byId.get(id);
}
/** First of `defendingBuilderCandidates` in one scan: the same order, no filtered copy. */
function bestRepairCandidate(battle: Battle, builder: DefendingBuilder, hut: Building) {
  const center = hutCenter(hut);
  let best: Building | undefined;
  let bestRatio = 0,
    bestDistance = 0;
  for (const b of battle.buildings) {
    if (!repairable(battle, b) || distanceTo(center, b) > DEFENDING_BUILDER_REPAIR_RADIUS + EPSILON)
      continue;
    const ratio = b.hp / (b.maxHp || 1);
    const distance = distanceTo(builder, b);
    if (
      best === undefined ||
      ratio < bestRatio ||
      (ratio === bestRatio &&
        (distance < bestDistance || (distance === bestDistance && b.id < best.id)))
    ) {
      best = b;
      bestRatio = ratio;
      bestDistance = distance;
    }
  }
  return best;
}
/** LogicHitpointComponent.CauseDamage healer slot selection for one heal at `at`. */
export function defendingBuilderHealSlot(
  state: DefendingBuilderBattleState,
  targetId: number,
  healerId: number,
  at: number,
) {
  const slots = (state.slots[targetId] ??= Array.from(
    { length: DEFENDING_BUILDER_HEAL_SLOTS },
    () => ({ id: 0, until: 0 }),
  ));
  let previous = -1,
    free = -1;
  for (let i = 0; i < DEFENDING_BUILDER_HEAL_SLOTS; i++) {
    const active = slots[i].until > at + EPSILON;
    // The component tick clears the IDs of expired slots.
    if (active && slots[i].id === healerId) previous = i;
    else if (free === -1 && !active) free = i;
  }
  const hold = { id: healerId, until: at + HEAL_SLOT_SECONDS };
  if (previous !== -1 && free !== -1 && free < previous) {
    slots[free] = hold;
    slots[previous] = { id: 0, until: 0 };
    return free;
  }
  if (previous === -1) {
    if (free === -1) return DEFENDING_BUILDER_HEAL_SLOTS;
    slots[free] = hold;
    return free;
  }
  slots[previous] = hold;
  return previous;
}
export const healStackPercent = (slot: number) =>
  HEAL_STACK_PERCENT[Math.min(slot, HEAL_STACK_PERCENT.length - 1)];

function walk(
  builder: DefendingBuilder,
  battle: Battle,
  goal: Building | { x: number; y: number },
  range: number,
  speed: number,
  dt: number,
) {
  if (!builder.path.length || builder.pathAt <= 0) {
    // IsJumper: walls never block him; other buildings do.
    builder.path = findPath(
      builder,
      goal,
      nonWallBuildings(battle),
      range,
      !!battle.nativeSubtiles,
    );
    builder.pathAt = 0.3;
  }
  let travel = speed * dt;
  while (builder.path.length && travel > 0) {
    const next = builder.path[0];
    const dx = next.x - builder.x,
      dy = next.y - builder.y,
      length = distance2D(dx, dy);
    if (length <= travel) {
      builder.x = next.x;
      builder.y = next.y;
      builder.path.shift();
      travel -= length;
    } else {
      builder.x += (dx / length) * travel;
      builder.y += (dy / length) * travel;
      break;
    }
  }
}

export function stepDefendingBuilders(battle: Battle, dt: number) {
  const state = battle.late?.defendingBuilder;
  if (!state) return;
  for (const builder of state.builders) stepBuilder(battle, state, builder, dt);
}

function stepBuilder(
  battle: Battle,
  state: DefendingBuilderBattleState,
  builder: DefendingBuilder,
  dt: number,
) {
  if (builder.hiddenAt !== undefined) return;
  const activeDt = Math.min(dt, Math.max(0, battle.elapsed - builder.spawnedAt));
  if (activeDt <= 0) return;
  const stats = defendingBuilderStats(builder.level);
  // Defensive Rage raises the health restored by each repair and his movement speed.
  const boosted = lateDefenderStats(
    battle,
    { id: builder.id, kind: DEFENDING_BUILDER },
    { damage: stats.repair, speed: stats.speed },
  );
  builder.repairing = false;
  builder.pathAt -= activeDt;
  builder.cooldown = Math.max(0, builder.cooldown - activeDt);
  builder.recovery = Math.max(0, builder.recovery - activeDt);
  const hut = buildingById(battle, builder.hutId);
  if (!hut || hut.hp <= 0) {
    // His hut is gone: he stops repairing, returns to it and hides.
    builder.target = null;
    delete builder.engaged;
    if (!builder.retreating) {
      builder.retreating = true;
      builder.path = [];
      builder.pathAt = 0;
    }
    // The destroyed hut no longer blocks paths; he walks to its footprint and disappears there.
    if (!hut || distanceTo(builder, hut) <= stats.range + EPSILON) {
      builder.hiddenAt = battle.elapsed;
      return;
    }
    walk(builder, battle, hut, stats.range, boosted.speed, activeDt);
    if (distanceTo(builder, hut) <= stats.range + EPSILON || !builder.path.length)
      builder.hiddenAt = battle.elapsed;
    return;
  }
  let target = buildingById(battle, builder.target);
  // Keep one target until it is fully repaired, destroyed or hidden.
  if (!target || !repairable(battle, target)) {
    target = bestRepairCandidate(battle, builder, hut);
    if (builder.target !== (target?.id ?? null)) {
      builder.target = target?.id ?? null;
      delete builder.engaged;
      builder.path = [];
      builder.pathAt = 0;
    }
  }
  if (!target) return;
  if (distanceTo(builder, target) > stats.range + 1e-6) {
    delete builder.engaged;
    walk(builder, battle, target, stats.range, boosted.speed, activeDt);
    return;
  }
  builder.path = [];
  builder.repairing = true;
  if (!builder.engaged) {
    builder.engaged = true;
    builder.cooldown = Math.max(0, builder.recovery + stats.firstRepair - activeDt);
  }
  if (builder.cooldown > EPSILON) return;
  builder.cooldown = stats.rate;
  builder.recovery = stats.recovery;
  const slot = defendingBuilderHealSlot(state, target.id, builder.id, battle.elapsed);
  state.lowest[target.id] = Math.min(state.lowest[target.id] ?? target.hp, target.hp);
  const amount = Math.min(
    (boosted.damage * healStackPercent(slot)) / 100,
    target.maxHp - target.hp,
  );
  target.hp += amount;
  builder.repairs.push({
    n: builder.repairCount++,
    at: battle.elapsed,
    targetId: target.id,
    amount,
    slot,
  });
  if (builder.repairs.length > DEFENDING_BUILDER_HISTORY) builder.repairs.shift();
}

/**
 * Late-family step: each armed campaign Builder's Hut (`builderHutActivation`) sends out its
 * Builder on the first battle tick, as LogicDefenceUnitProductionComponent does. Campaign
 * battles start simulating at the first deployment or spell, which is also when the huts wake.
 */
export function stepDefendingBuilder(context: LateCombatContext) {
  const { battle, dt, phase } = context;
  if (phase !== 'defenses' || !battle.late) return;
  if (!battle.late.defendingBuilder) {
    const huts = battle.buildings.filter((b) => builderHutActivation(battle, b));
    if (!huts.length) return;
    const at = Math.max(0, battle.elapsed - dt);
    for (const hut of huts) spawnDefendingBuilder(battle, hut, at);
  }
  stepDefendingBuilders(battle, dt);
}
/** Builders never hold the battle open. */
export function defendingBuilderPending(_battle: Battle) {
  return false;
}
/** A destroyed hut is observed on the Builder's next step (he stops, retreats and hides). */
export function defendingBuilderDestroyed(
  _context: LateCombatContext,
  _building: Building,
  _at: number,
) {}
/** Attacker Lightning resets the repair target of every Builder inside the strike. */
export function defendingBuilderLightning(battle: Battle, x: number, y: number, radius: number) {
  for (const builder of battle.late?.defendingBuilder?.builders ?? []) {
    if (builder.hiddenAt !== undefined || builder.retreating) continue;
    if (builder.spawnedAt > battle.elapsed || distance2D(builder.x - x, builder.y - y) > radius)
      continue;
    builder.target = null;
    builder.repairing = false;
    delete builder.engaged;
    builder.path = [];
    builder.pathAt = 0;
  }
}
/** Hit points that count toward loot: the lowest a repaired building reached. */
export function defendingBuilderLootHp(battle: Battle, building: Building) {
  const lowest = battle.late?.defendingBuilder?.lowest[building.id];
  return lowest === undefined ? building.hp : Math.min(building.hp, lowest);
}
