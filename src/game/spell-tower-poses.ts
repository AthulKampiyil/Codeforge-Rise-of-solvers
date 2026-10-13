import runtime from '../../reference/spell-tower/runtime.json' with { type: 'json' };
import type { SpellTowerWeapon } from './late-campaign';
import type { Building } from './model';
import {
  nativeScenePoses,
  type NativeMatrix,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';
import { sourcePoseBounds } from './spell-tower-effect-player';
import { SPELL_TOWER_ART } from './spell-tower-art';
import { SPELL_TOWER, spellTowerStats } from './spell-tower-stats';
import type { SpellTowerCast, SpellTowerTowerState } from './spell-tower';

export const SPELL_TOWER_GRAPH = runtime as unknown as NativeMeshGraph;
export const SPELL_TOWER_EFFECTS = runtime.effects as Record<string, Record<string, string>[]>;
export const SPELL_TOWER_EMITTERS = runtime.particles as Record<string, Record<string, string>[]>;
export const SPELL_TOWER_SOUNDS = runtime.sounds as Record<
  string,
  { path: string; sha256: string }
>;
export type SpellTowerVisualState = 'setup' | 'constructing' | 'upgrading' | 'ruin';
const { scale, anchorX, anchorY } = SPELL_TOWER_ART;
/** Local registration shared with the Inferno's `dark_tower_base`: 64 px above the 2×2 center. */
export const SPELL_TOWER_ROOT: NativeMatrix = [
  scale,
  0,
  -anchorX * scale,
  0,
  scale,
  -anchorY * scale,
];
/** Local altitude projection of source heights, as used by other native towers. */
export const SPELL_TOWER_ALTITUDE = 0.8;
const clip = (name: string) => SPELL_TOWER_GRAPH.clips[SPELL_TOWER_GRAPH.exports[name]];

/**
 * Source `turret_load` labels drive the body: `idle` while loaded; the 30-frame attack segment
 * ends at the release; the load segment spans the source reload (`CoolDownOverride`). The load
 * clips were authored for earlier 50/60/40-second reloads, so the segment is proportionally
 * scaled to the pinned reload — a local interpretation keeping "loaded" and "ready" identical.
 */
export function spellTowerFrame(
  tower: Building,
  state: SpellTowerTowerState | undefined,
  elapsed: number,
  reduced: boolean,
) {
  const weapon = SPELL_TOWER[tower.spellTowerWeapon ?? 'rage'];
  const labels = weapon.stateLabels;
  if (!state || tower.hp <= 0) return labels.idle;
  if (state.lastCastAt !== undefined && elapsed < state.readyAt) {
    if (reduced) return labels.load_start;
    const progress = Math.max(
      0,
      Math.min(1, (elapsed - state.lastCastAt) / Math.max(1e-9, state.readyAt - state.lastCastAt)),
    );
    return labels.load_start + Math.floor(progress * (labels.load_end - labels.load_start) + 1e-9);
  }
  if (!reduced && state.targetId !== null && state.windup > 0) {
    const frames = labels.attack_end - labels.attack_start + 1;
    const lead = weapon.windup - frames / 30;
    if (state.windup >= lead)
      return Math.min(
        labels.attack_end,
        labels.attack_start + Math.floor((state.windup - lead) * 30 + 1e-9),
      );
  }
  return labels.idle;
}

export function spellTowerPoses(
  level: number,
  weapon: SpellTowerWeapon,
  state: SpellTowerVisualState,
  frame: number,
  seconds: number,
  ruinAge = Infinity,
): NativeScenePose[] {
  const row = spellTowerStats(level);
  const sample = (name: string, time: number, controls: Record<string, number | false> = {}) =>
    nativeScenePoses(SPELL_TOWER_GRAPH, name, time, controls, SPELL_TOWER_ROOT);
  if (state === 'ruin') {
    const ruin = clip(row.ruin);
    return sample(row.ruin, Math.min(Math.max(0, ruinAge), (ruin.timeline.length - 1) / ruin.fps));
  }
  const base = sample(row.base, 0);
  if (state === 'constructing') return [...base, ...sample(row.construction, seconds)];
  return [
    ...base,
    ...sample(SPELL_TOWER[weapon].exports[level - 1], seconds, { turret_load: frame }),
    ...(state === 'upgrading' ? sample(row.buildAnim, seconds) : []),
  ];
}
/**
 * True when an export's sampled art changes over time: some clip in its tree has more than one
 * distinct frame. Root slots named in `controlled` are skipped: a control pins their phase.
 */
const animatesCache = new Map<string, boolean>();
function exportAnimates(name: string, controlled: readonly string[] = []) {
  const key = `${name}:${controlled.join(',')}`;
  let result = animatesCache.get(key);
  if (result === undefined) {
    result = false;
    const root = SPELL_TOWER_GRAPH.exports[name];
    const pending = [root],
      seen = new Set<number>();
    while (pending.length && !result) {
      const id = pending.pop()!;
      const node = SPELL_TOWER_GRAPH.clips[id];
      if (!node || seen.has(id)) continue;
      seen.add(id);
      // A timeline repeating one frame holds its placements; only nested clips can move then.
      if (node.timeline.some((frame) => frame !== node.timeline[0])) result = true;
      for (const [slot, child] of node.children.entries())
        if (id !== root || !controlled.includes(node.names[slot])) pending.push(child);
    }
    animatesCache.set(key, result);
  }
  return result;
}
const frameOf = (name: string, seconds: number) =>
  Math.floor(Math.max(0, seconds) * clip(name).fps + 1e-9);
/**
 * What `spellTowerPoses` output depends on besides level, weapon, state and turret frame: the
 * source frame of each animated export (none for the static idle body). Equal keys sample
 * identical art, so the scene skips re-rendering.
 */
export function spellTowerTimeKey(
  level: number,
  weapon: SpellTowerWeapon,
  state: SpellTowerVisualState,
  seconds: number,
  ruinAge = Infinity,
) {
  const row = spellTowerStats(level);
  if (state === 'ruin') {
    const ruin = clip(row.ruin);
    return String(
      frameOf(row.ruin, Math.min(Math.max(0, ruinAge), (ruin.timeline.length - 1) / ruin.fps)),
    );
  }
  if (state === 'constructing')
    return String(exportAnimates(row.construction) ? frameOf(row.construction, seconds) : 0);
  const body = SPELL_TOWER[weapon].exports[level - 1];
  const upgrade = state === 'upgrading' && exportAnimates(row.buildAnim);
  return `${exportAnimates(body, ['turret_load']) ? frameOf(body, seconds) : 0},${upgrade ? frameOf(row.buildAnim, seconds) : 0}`;
}
const boundsCache = new Map<string, [number, number, number, number]>();
export function spellTowerBounds(
  level: number,
  weapon: SpellTowerWeapon,
  state: SpellTowerVisualState = 'setup',
) {
  const key = `${level}:${weapon}:${state}`;
  let bounds = boundsCache.get(key);
  if (!bounds) {
    bounds = sourcePoseBounds(
      spellTowerPoses(level, weapon, state, SPELL_TOWER[weapon].stateLabels.idle, 0),
    ) ?? [-60, -130, 60, 30];
    boundsCache.set(key, bounds);
  }
  return bounds;
}

/** Fixed `FixedTravelTime` flight point with a local parabolic arc of `BallisticHeight`. */
export function spellBottleFlightPoint(
  entry: SpellTowerCast,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
) {
  const projectile = SPELL_TOWER[entry.weapon].projectile;
  const t = Math.max(
    0,
    Math.min(1, (elapsed - entry.at) / Math.max(1e-9, entry.deployAt - entry.at)),
  );
  const ground = iso(
    entry.fromX + (entry.x - entry.fromX) * t,
    entry.fromY + (entry.y - entry.fromY) * t,
  );
  const lift =
    projectile.startHeight * SPELL_TOWER_ALTITUDE * (1 - t) +
    4 * projectile.ballisticHeight * SPELL_TOWER_ALTITUDE * t * (1 - t);
  return { t, x: ground.x, y: ground.y - lift, groundY: ground.y };
}

/** The bottle art at its `spellBottleFlightPoint`. */
export function spellBottlePose(
  entry: SpellTowerCast,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
) {
  const projectile = SPELL_TOWER[entry.weapon].projectile;
  const { t, x, y, groundY } = spellBottleFlightPoint(entry, elapsed, iso);
  return {
    t,
    x,
    y,
    depth: projectile.useTopLayer ? 8000 : groundY + 1,
    export: projectile.export,
    poses: nativeScenePoses(
      SPELL_TOWER_GRAPH,
      projectile.export,
      Math.max(0, elapsed - entry.at),
      {},
      [scale, 0, 0, 0, scale, 0],
    ),
  };
}
