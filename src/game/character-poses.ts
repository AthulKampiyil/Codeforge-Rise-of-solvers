import { animationBlock } from './character-catalog';
import { characterArt, characterArtLoaded, commonDeathArt } from './character-art';
import { garrisonStats } from './garrison-kinds';
import {
  nativeMatrix,
  nativeScenePoses,
  nativeVertices,
  type NativeMatrix,
  type NativeScenePose,
} from './native-mesh';
import { visualRandom } from './visual-random';
import type { GarrisonDefender } from './defenders';
import type { Battle } from './model';
import { unitIndex } from './battle-index';

/** Local world size; all source vertices, colors and nested timelines remain unchanged. */
export const CHARACTER_SCALE = 0.6;
type Row = Record<string, string>;
const DEATH_EXPORT = 'barbarian_death_1';

/** Named rows start a state; following unnamed rows are weighted variants of that state. */
export function animationStates(animation: string) {
  const states: Record<string, Row[]> = {};
  let current = '';
  for (const row of animationBlock(animation).rows) {
    if (row.Name) current = row.Name;
    (states[current] ??= []).push(row);
  }
  return states;
}
const statesCache = new Map<string, Record<string, Row[]>>();
const statesFor = (animation: string) => {
  let states = statesCache.get(animation);
  if (!states) statesCache.set(animation, (states = animationStates(animation)));
  return states;
};

/**
 * Three original views with horizontal reflection for the other screen side. Buckets are a
 * local interpretation: up-right (1), right (2) and down-right (3) split at ±22.5 degrees of
 * the projected screen direction.
 */
export function characterFacing(dx: number, dy: number) {
  const screenX = dx - dy,
    screenY = (dx + dy) / 2;
  const mirror: 1 | -1 = screenX < 0 ? -1 : 1;
  const slope = screenY / Math.max(1e-9, Math.abs(screenX));
  const view = slope < -0.41421356237309503 ? 1 : slope > 0.41421356237309503 ? 3 : 2;
  return { view: view as 1 | 2 | 3, mirror };
}
export const rowExport = (row: Row, view: number) =>
  row.HasDirections === 'TRUE' ? `${row.ExportName}_${view}` : row.ExportName;
/** Animation `Scale` is a percentage of the character's local world scale. */
export const rowScale = (row: Row) =>
  row.Scale ? (CHARACTER_SCALE * Number(row.Scale)) / 100 : CHARACTER_SCALE;

function variant(rows: Row[], id: number, ordinal: number) {
  if (rows.length === 1) return rows[0];
  const weights = rows.map((row) => Number(row.VariationWeight || 1));
  let pick = visualRandom(id, ordinal, 0x5a17) * weights.reduce((a, b) => a + b, 0);
  for (const [index, weight] of weights.entries()) if ((pick -= weight) < 0) return rows[index];
  return rows.at(-1)!;
}
function clipFor(animation: string, row: Row, view: number) {
  const art = row.SWF ? characterArt(animation) : commonDeathArt();
  const graph = art.graph;
  const id = graph.exports[row.SWF ? rowExport(row, view) : DEATH_EXPORT];
  if (id === undefined) throw Error(`Missing native export ${row.ExportName}`);
  return graph.clips[id];
}

/**
 * Non-looping attack rows lead into the damage event: the source ActionFrame (interpreted as
 * one-based) coincides with the recorded attack. The windup follows the combat cooldown, so
 * stuns freeze it and disengagement cancels it; after an attack the clip plays through its
 * remaining frames. When the action frame is the final frame, it is held for one source frame.
 */
export function characterAttackTime(
  defender: GarrisonDefender,
  elapsed: number,
  animation: string,
  view: number,
  reduced = false,
) {
  if (reduced) return null;
  const rows = statesFor(animation).attack;
  if (!rows || rows[0].Looping === 'TRUE') return null;
  const last = defender.attacks.at(-1);
  const since = last ? elapsed - last.at : Infinity;
  const pick = (ordinal: number) => {
    const row = variant(rows, defender.id, ordinal);
    const clip = clipFor(animation, row, view);
    const frames = clip.timeline.length;
    const action = Math.min(frames - 1, Math.max(0, Number(row.ActionFrame || 1) - 1));
    return { row, clip, frames, action, actionTime: action / clip.fps };
  };
  const windupOrdinal = defender.attackCount ?? defender.attacks.length;
  const lastOrdinal = last?.n ?? defender.attacks.length - 1;
  const follow = last ? pick(lastOrdinal) : undefined;
  const windup = pick(windupOrdinal);
  const windupActive = !!defender.engaged && defender.cooldown <= windup.actionTime;
  const following =
    !!follow && since >= 0 && since < (follow.frames - follow.action) / follow.clip.fps;
  const finalFrameHold = !!follow && follow.action === follow.frames - 1;
  if (following && (finalFrameHold || !windupActive))
    return {
      row: follow!.row,
      time: finalFrameHold ? follow!.actionTime : follow!.actionTime + since,
    };
  if (!windupActive) return null;
  return { row: windup.row, time: Math.max(0, windup.actionTime - defender.cooldown) };
}

/**
 * Later-family state rows: a summoned unit plays its non-looping `spawn` row while it is pushed
 * out and waits out SpawnIdle (Skeleton), clamped to the last frame; a Witch plays `attack2`
 * (summon) from the recorded summon event through its clip. Starting the summon row at the
 * event is a local alignment (its ActionFrame 22 is 0.7 s into a 30-fps clip).
 */
function spawnOrSummonRow(
  defender: GarrisonDefender,
  elapsed: number,
  animation: string,
  states: Record<string, Row[]>,
  view: number,
  reduced: boolean,
) {
  const spawn = states.spawn?.[0];
  if (spawn && defender.idleUntil !== undefined && elapsed < defender.idleUntil) {
    const clip = clipFor(animation, spawn, view);
    const last = (clip.timeline.length - 1) / clip.fps;
    return {
      row: spawn,
      time: reduced ? last : Math.min(last, Math.max(0, elapsed - defender.spawnedAt)),
    };
  }
  const summon = states.attack2?.[0];
  const event = defender.summon?.events.at(-1);
  if (summon && event && !reduced) {
    const clip = clipFor(animation, summon, view);
    const since = elapsed - event.at;
    if (since >= 0 && since < clip.timeline.length / clip.fps) return { row: summon, time: since };
  }
  return null;
}

export interface CharacterPose {
  /** Graph texture prefix and graph for the scene view. */
  prefix: string;
  poses: NativeScenePose[];
  shadows: readonly number[];
}

function heading(defender: GarrisonDefender, battle: Battle, flying: boolean) {
  const target = defender.target === null ? undefined : unitIndex(battle).get(defender.target);
  const last = defender.attacks.at(-1);
  const point = !flying && !defender.attacking && defender.path[0] ? defender.path[0] : target;
  return {
    dx: (point?.x ?? last?.targetX ?? defender.x + 1) - defender.x,
    dy: (point?.y ?? last?.targetY ?? defender.y) - defender.y,
  };
}

/** State-driven original character poses: identical after replay seeks and reconstruction. */
export function characterPose(
  defender: GarrisonDefender,
  battle: Battle,
  reduced = false,
): CharacterPose | null {
  if (battle.elapsed < defender.spawnedAt) return null;
  const stats = garrisonStats(defender.kind, defender.level);
  const animation = stats.animation;
  const art = characterArt(animation);
  const states = statesFor(animation);
  if (defender.hp <= 0) {
    const row = states.die[0];
    const death = row.SWF ? art : commonDeathArt();
    // Directional die rows in the character's own file (Electro Dragon) keep the last facing.
    const directional = !!row.SWF && row.HasDirections === 'TRUE';
    const dieFacing = directional
      ? (({ dx, dy }) => characterFacing(dx, dy))(heading(defender, battle, stats.flying))
      : { view: 1 as const, mirror: 1 as const };
    const clip = clipFor(animation, row, dieFacing.view);
    const last = (clip.timeline.length - 1) / clip.fps;
    // Terminal source frames are empty; living poses return after backward reconstruction.
    const time = reduced
      ? last
      : Math.min(last, Math.max(0, battle.elapsed - (defender.defeatedAt ?? battle.elapsed)));
    const scale = rowScale(row);
    return {
      prefix: death.prefix,
      shadows: death.shadows,
      poses: nativeScenePoses(
        death.graph,
        row.SWF ? rowExport(row, dieFacing.view) : DEATH_EXPORT,
        time,
        {},
        [scale * dieFacing.mirror, 0, 0, 0, scale, 0],
      ),
    };
  }
  const age = Math.max(0, battle.elapsed - defender.spawnedAt);
  const { dx, dy } = heading(defender, battle, stats.flying);
  const facing = characterFacing(dx, dy);
  const special = spawnOrSummonRow(
    defender,
    battle.elapsed,
    animation,
    states,
    facing.view,
    reduced,
  );
  const attack = special
    ? null
    : characterAttackTime(defender, battle.elapsed, animation, facing.view, reduced);
  const found = defender.target === null ? undefined : unitIndex(battle).get(defender.target);
  const target = found && found.hp > 0 ? found : undefined;
  // A concealed Royal Ghost walks straight to its target without a path.
  const concealed = (defender.stealthUntil ?? 0) > battle.elapsed;
  const moving =
    !defender.attacking && !!target && (stats.flying || defender.path.length > 0 || concealed);
  const row = special
    ? special.row
    : attack
      ? attack.row
      : (defender.attacking && states.attack?.[0].Looping === 'TRUE'
          ? states.attack
          : moving
            ? states.walk
            : states.idle)[0];
  const time = special ? special.time : attack ? attack.time : reduced ? 0 : age;
  const mirror = row.HasDirections === 'TRUE' ? facing.mirror : 1;
  const scale = rowScale(row);
  const root: NativeMatrix = [scale * mirror, 0, 0, 0, scale, 0];
  return {
    prefix: art.prefix,
    shadows: art.shadows,
    poses: nativeScenePoses(art.graph, rowExport(row, facing.view), time, {}, root),
  };
}

const barHeights = new Map<string, number>();
/**
 * Local health-bar height above the ground point (before air lift): the top of the idle row's
 * front view at frame zero. No Flight Zone keeps its established Dragon/Balloon offsets.
 */
export function characterBarHeight(animation: string) {
  if (animation === 'Dragon7') return 94;
  if (animation === 'Balloon Goblin8') return 115;
  // Before the graphs arrive, a typical troop's height.
  if (!characterArtLoaded()) return 60;
  let height = barHeights.get(animation);
  if (height !== undefined) return height;
  const row = statesFor(animation).idle[0];
  const poses = nativeScenePoses(characterArt(animation).graph, rowExport(row, 3), 0, {}, [
    rowScale(row),
    0,
    0,
    0,
    rowScale(row),
    0,
  ]);
  let top = 0;
  const visit = (items: NativeScenePose[]) => {
    for (const item of items) {
      if ('group' in item) visit(item.group);
      else
        for (const [i, v] of nativeVertices(item).entries())
          if (i % 4 === 1) top = Math.min(top, v);
    }
  };
  visit(poses);
  barHeights.set(animation, (height = Math.round(-top) + 3));
  return height;
}

/** An original empty locator (for example `attack_pivot`) with the body's view, mirror and scale. */
export function characterLocator(
  animation: string,
  exportName: string,
  mirror: number,
  scale: number,
  name = 'attack_pivot',
  frame = 0,
) {
  const graph = characterArt(animation).graph;
  const clip = graph.clips[graph.exports[exportName]];
  const slot = clip.names.indexOf(name);
  const placement = clip.frames[clip.timeline[frame % clip.timeline.length]].find(
    (p) => p[0] === slot,
  );
  if (slot < 0 || !placement) return undefined;
  const matrix = nativeMatrix([scale * mirror, 0, 0, 0, scale, 0], graph.matrices[placement[1]]);
  return { x: matrix[2], y: matrix[5] };
}
