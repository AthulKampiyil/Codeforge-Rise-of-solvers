import {
  nativeScenePoses,
  type NativeMatrix,
  type NativeMeshGraph,
  type NativeScenePose,
} from './native-mesh';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { nativeSceneId, type NativeArtPack, type NativeRow } from './native-art-pack';
import { visualRandom } from './visual-random';

/** Local village projection shared by the native defense renderers (see docs in the art indexes). */
export const NATIVE_ART_SCALE = 1.2;
export const NATIVE_ALTITUDE = 0.8;
type Point = { x: number; y: number };

/** One effects.csv record played at a battle time. Screen points are already projected. */
/** A sampled particle or timeline with the pack scene that owns its textures. */
export type NativeEffectPose = NativeParticlePose & { scene: string };

export interface NativeEffectEvent {
  key: string;
  effect: string;
  at: number;
  /** Projected ground point of the effect origin. */
  ground: Point;
  /** Additional screen lift of the origin (rooftops, air units). */
  lift?: number;
  /** Map direction for OrientToParent / HorizontalAngle emitters. */
  facing?: Point;
  /** Targeted and Beam rows: projected end point, already lifted. */
  target?: Point;
  /** Looping rows keep emitting until this battle time. */
  until?: number;
  /** Object-layer depth override, e.g. air effects above every rooftop. */
  depth?: number;
}

/** Parsed numeric columns per (static) row; NaN marks blank or non-numeric cells. */
const numbers = new WeakMap<NativeRow, Map<string, number>>();
const n = (row: NativeRow | undefined, key: string, fallback = 0) => {
  if (!row) return fallback;
  let parsed = numbers.get(row);
  if (!parsed) numbers.set(row, (parsed = new Map()));
  let value = parsed.get(key);
  if (value === undefined) {
    const raw = row[key];
    const number = Number(raw);
    value = raw === undefined || raw === '' || !Number.isFinite(number) ? NaN : number;
    parsed.set(key, value);
  }
  return value !== value ? fallback : value;
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Stable 32-bit identity for visual randomness; never touches the combat RNG. */
export function nativeEffectSeed(key: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** Continuation rows only declare changed columns; everything but emitter/export identity inherits. */
const effectRows = new WeakMap<readonly NativeRow[], NativeRow[]>();
export function nativeEffectRow(rows: readonly NativeRow[], index: number): NativeRow {
  let merged = effectRows.get(rows);
  if (!merged) effectRows.set(rows, (merged = []));
  return (merged[index] ??= mergeEffectRow(rows, index));
}
function mergeEffectRow(rows: readonly NativeRow[], index: number): NativeRow {
  const own = rows[index];
  const inherited = { ...rows[0], ...own };
  for (const key of [
    'ParticleEmitter',
    'AltParticleEmitter',
    'EmitterDelayMs',
    'SWF',
    'ExportName',
  ])
    if (own[key] === undefined) delete (inherited as Record<string, string>)[key];
  return inherited;
}

const boundsCache = new WeakMap<
  NativeMeshGraph,
  Map<number, [number, number, number, number] | null>
>();
/** Conservative source-space bounds over every placement of a display object. */
export function nativeGraphBounds(graph: NativeMeshGraph, id: number) {
  let cache = boundsCache.get(graph);
  if (!cache) boundsCache.set(graph, (cache = new Map()));
  if (cache.has(id)) return cache.get(id)!;
  cache.set(id, null);
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  const add = (x: number, y: number) => {
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  };
  const shapes = graph.shapes[id];
  if (shapes) for (const [, v] of shapes) for (let i = 0; i < v.length; i += 4) add(v[i], v[i + 1]);
  else {
    const clip = graph.clips[id];
    const seen = new Set<string>();
    for (const frame of clip?.frames ?? [])
      for (const [slot, transform] of frame) {
        const key = `${slot}:${transform}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const child = nativeGraphBounds(graph, clip.children[slot]);
        if (!child) continue;
        const [a, c, x, b, d, y] = graph.matrices[transform];
        for (const [px, py] of [
          [child[0], child[1]],
          [child[2], child[1]],
          [child[0], child[3]],
          [child[2], child[3]],
        ])
          add(a * px + c * py + x, b * px + d * py + y);
      }
  }
  const result: [number, number, number, number] | null =
    left === Infinity ? null : [left, top, right, bottom];
  cache.set(id, result);
  return result;
}

/** Timeline duration of an export in seconds (at least one frame). */
export function nativeClipDuration(graph: NativeMeshGraph, name: string) {
  const clip = graph.clips[graph.exports[name]];
  return clip ? clip.timeline.length / clip.fps : 1 / 24;
}

const samplers = new WeakMap<
  NativeMeshGraph,
  Map<number, ReturnType<typeof nativeParticleSampler>>
>();
function sampler(graph: NativeMeshGraph, scale: number) {
  let byScale = samplers.get(graph);
  if (!byScale) samplers.set(graph, (byScale = new Map()));
  let result = byScale.get(scale);
  if (!result)
    byScale.set(
      scale,
      (result = nativeParticleSampler(graph, scale, {
        altitudeScale: NATIVE_ALTITUDE,
        orientTravelToParent: true,
      })),
    );
  return result;
}

function layerDepth(layer: string | undefined, ground: Point, override?: number) {
  if (layer === 'Ground' || layer === 'Bottom') return -870;
  if (layer === 'Top') return 8000;
  return override ?? ground.y + 2;
}

/** Stretch Targeted/Beam art along its source x extent between two projected points. */
function stretchedParticle(
  graph: NativeMeshGraph,
  config: NativeRow,
  name: string,
  age: number,
  life: number,
  from: Point,
  to: Point,
  scale: number,
  random: (slot: number) => number,
): NativeScenePose[] {
  const id = graph.exports[name];
  const bounds = id === undefined ? null : nativeGraphBounds(graph, id);
  const dx = to.x - from.x,
    dy = to.y - from.y,
    length = Math.hypot(dx, dy);
  if (!bounds || length < 1e-3) return [];
  const phase = clamp(age / Math.max(1e-6, life));
  const width =
    (((scale * mix(n(config, 'StartScale', 100), n(config, 'EndScale', 100), phase)) / 100) *
      mix(n(config, 'ScaleRandomMin', 100), n(config, 'ScaleRandomMax', 100), random(2))) /
    100;
  const along = length / Math.max(1, bounds[2] - bounds[0]);
  const ux = dx / length,
    uy = dy / length;
  const root: NativeMatrix = [
    ux * along,
    -uy * width,
    -ux * along * bounds[0],
    uy * along,
    ux * width,
    -uy * along * bounds[0],
  ];
  const seconds =
    config.ScaleTimeline === 'TRUE' ? phase * nativeClipDuration(graph, name) : Math.max(0, age);
  let alpha = n(config, 'Alpha', 100) / 100;
  const fadeOut = n(config, 'ParticleFadeOutTime') / 1000 || n(config, 'FadeOutTime') / 1000;
  if (fadeOut) alpha *= clamp((life - age) / fadeOut);
  const fadeIn = n(config, 'FadeInTime') / 1000;
  if (fadeIn) alpha *= clamp(age / fadeIn);
  if (alpha <= 0) return [];
  const poses = nativeScenePoses(graph, name, seconds, {}, root);
  if (config.AdditiveBlend === 'TRUE')
    return [
      {
        key: `${name}:beam`,
        group: poses,
        blend: 8,
        multiply: [1, 1, 1, alpha],
        add: [0, 0, 0, 0],
      },
    ];
  return alpha === 1 ? poses : withAlpha(poses, alpha);
}

/** Variant rows inherit the emitter's first row; merged once per (emitter, variant). */
const variants = new WeakMap<readonly NativeRow[], NativeRow[]>();
function emitterVariant(emitter: readonly NativeRow[], index: number): NativeRow {
  let merged = variants.get(emitter);
  if (!merged) variants.set(emitter, (merged = []));
  return (merged[index] ??= { ...emitter[0], ...(emitter[index] ?? emitter[0]) });
}

const withAlpha = (poses: NativeScenePose[], alpha: number): NativeScenePose[] =>
  poses.map((p) => ({
    ...p,
    multiply: [p.multiply[0], p.multiply[1], p.multiply[2], p.multiply[3] * alpha],
  }));

/** Particle birth ages at `age` since emission start; looping rows keep emitting until `stop`. */
export function nativeBirths(
  emitter: NativeRow,
  age: number,
  looping: boolean,
  stop = Infinity,
): { index: number; age: number }[] {
  const count = Math.max(1, Math.floor(n(emitter, 'ParticleCount', 1)));
  const emission = n(emitter, 'EmissionTime') / 1000;
  const maxLife = Math.max(n(emitter, 'MaxLife'), n(emitter, 'MinLife')) / 1000;
  const result: { index: number; age: number }[] = [];
  if (age < 0) return result;
  if (!looping) {
    for (let i = 0; i < count; i++) {
      const born = (emission * i) / count;
      if (age - born >= 0 && age - born < maxLife + 1e-9)
        result.push({ index: i, age: age - born });
    }
    return result;
  }
  const step = emission > 0 ? emission / count : Math.max(maxLife, 0.05);
  const first = Math.max(0, Math.ceil((age - maxLife) / step - 1e-9));
  const last = Math.floor(Math.min(age, stop) / step + 1e-9);
  for (let i = Math.max(first, last - 256); i <= last; i++) {
    const born = i * step;
    if (age - born >= 0 && age - born < maxLife) result.push({ index: i, age: age - born });
  }
  return result;
}

/**
 * Samples one effect record from its pack: timeline exports and every declared particle emitter.
 * Emission, life, scale, fades and motion follow the shared source-particle interpretation.
 */
export function nativeEffectPoses(
  pack: NativeArtPack,
  event: NativeEffectEvent,
  elapsed: number,
  reduced: boolean,
): NativeEffectPose[] {
  const rows = pack.effects[event.effect];
  if (!rows) return [];
  const seed = nativeEffectSeed(event.key);
  const result: NativeEffectPose[] = [];
  const facing = event.facing ?? { x: 1, y: 0 };
  const parentAngle = Math.atan2((facing.x + facing.y) * 0.16, (facing.x - facing.y) * 0.32);
  const parentMapAngle = Math.atan2(facing.y, facing.x);
  for (const index of rows.keys()) {
    const row = nativeEffectRow(rows, index);
    const scale = (NATIVE_ART_SCALE * n(row, 'Scale', 100)) / 100;
    const ox = n(row, 'OffsetX'),
      oy = n(row, 'OffsetY');
    const origin = {
      x: event.ground.x + (ox - oy) * 0.32,
      y:
        event.ground.y + (ox + oy) * 0.16 - (event.lift ?? 0) - n(row, 'OffsetZ') * NATIVE_ALTITUDE,
    };
    const looping = row.Looping === 'TRUE' && event.until !== undefined;
    const delay = n(row, 'EmitterDelayMs') / 1000;
    const age = elapsed - event.at - delay;
    if (age < 0) continue;
    if (row.SWF && row.ExportName) {
      const graph = pack.scenes[nativeSceneId(row.SWF)];
      if (graph?.exports[row.ExportName] !== undefined) {
        const duration = nativeClipDuration(graph, row.ExportName);
        if (looping ? elapsed <= event.until! : age < duration) {
          result.push({
            key: `${event.key}:${index}:timeline`,
            scene: nativeSceneId(row.SWF),
            emitter: row.ExportName,
            poses: nativeScenePoses(
              graph,
              row.ExportName,
              reduced ? 0 : looping ? age % duration : age,
              {},
              [scale, 0, 0, 0, scale, 0],
            ),
            x: origin.x,
            y: origin.y,
            depth: layerDepth(row.IsoLayer, event.ground, event.depth),
          });
        }
      }
    }
    const name = row.ParticleEmitter;
    const emitter = name ? pack.emitters[name] : undefined;
    if (!name || !emitter) continue;
    const stop = looping ? event.until! - event.at - delay : Infinity;
    const stretched = (row.Targeted === 'TRUE' || row.Beam === 'TRUE') && event.target;
    // Stopped looping rows fade out their live particles instead of cutting them.
    const fade =
      (n(emitter[0], 'FadeOutTime') || n(emitter[0], 'ParticleFadeOutTime') || 150) / 1000;
    const after = looping ? elapsed - event.until! : 0;
    if (after > fade) continue;
    const ending = after > 0 ? 1 - after / fade : 1;
    for (const birth of nativeBirths(emitter[0], age, looping, stop)) {
      const random = (slot: number) => visualRandom(seed, birth.index, index * 1000 + slot);
      const config = emitterVariant(emitter, Math.floor(random(1) * emitter.length));
      const graph = pack.scenes[nativeSceneId(config.ParticleSwf)];
      const exportName = config.ParticleExportName;
      if (!graph || graph.exports[exportName] === undefined) continue;
      if (stretched) {
        const life = mix(n(config, 'MinLife'), n(config, 'MaxLife'), random(0)) / 1000;
        if (birth.age >= life) continue;
        const from = { x: origin.x, y: origin.y - n(config, 'StartZ') * NATIVE_ALTITUDE };
        const to = {
          x: event.target!.x,
          y: event.target!.y - n(config, 'TargetedEndZ') * NATIVE_ALTITUDE,
        };
        const poses = stretchedParticle(
          graph,
          config,
          exportName,
          birth.age,
          life,
          { x: 0, y: 0 },
          { x: to.x - from.x, y: to.y - from.y },
          scale,
          random,
        );
        if (poses.length)
          result.push({
            key: `${event.key}:${index}:${birth.index}`,
            scene: nativeSceneId(config.ParticleSwf),
            emitter: name,
            poses: ending < 1 ? withAlpha(poses, ending) : poses,
            x: from.x,
            y: from.y,
            depth: layerDepth(row.IsoLayer, event.ground, event.depth),
          });
        continue;
      }
      const pose = sampler(graph, scale)(
        `${event.key}:${index}:${birth.index}`,
        name,
        [config],
        birth.age,
        origin,
        random,
        row.IsoLayer ?? config.IsoLayer ?? 'Object',
        reduced,
        parentAngle,
        parentMapAngle,
      );
      if (!pose) continue;
      if (row.IsoLayer !== 'Ground' && row.IsoLayer !== 'Top' && config.IsIsoParticle !== 'TRUE')
        pose.depth = layerDepth(row.IsoLayer, event.ground, event.depth);
      if (ending < 1) pose.poses = withAlpha(pose.poses, ending);
      result.push({ ...pose, scene: nativeSceneId(config.ParticleSwf) });
    }
  }
  return result;
}

/** Longest time an effect record can keep drawing after it starts (non-looping rows). */
const durations = new WeakMap<NativeArtPack, Map<string, number>>();
export function nativeEffectDuration(pack: NativeArtPack, effect: string) {
  let cache = durations.get(pack);
  if (!cache) durations.set(pack, (cache = new Map()));
  let duration = cache.get(effect);
  if (duration === undefined) cache.set(effect, (duration = effectDuration(pack, effect)));
  return duration;
}
function effectDuration(pack: NativeArtPack, effect: string) {
  let longest = 0;
  const rows = pack.effects[effect] ?? [];
  for (const index of rows.keys()) {
    const row = nativeEffectRow(rows, index);
    const delay = n(row, 'EmitterDelayMs') / 1000;
    if (row.SWF && row.ExportName) {
      const graph = pack.scenes[nativeSceneId(row.SWF)];
      if (graph?.exports[row.ExportName] !== undefined)
        longest = Math.max(longest, delay + nativeClipDuration(graph, row.ExportName));
    }
    const emitter = row.ParticleEmitter ? pack.emitters[row.ParticleEmitter] : undefined;
    if (emitter)
      longest = Math.max(
        longest,
        delay +
          (n(emitter[0], 'EmissionTime') +
            Math.max(n(emitter[0], 'MaxLife'), n(emitter[0], 'MinLife'))) /
            1000,
      );
  }
  // Persistent beam emitters declare near-infinite lives; their callers stop them explicitly.
  return Math.min(longest, 30);
}

/** Trail births along a flight: each birth keeps the projected point where it was emitted. */
export function nativeTrailPoses(
  pack: NativeArtPack,
  emitterName: string,
  key: string,
  births: readonly { index: number; at: number; ground: Point }[],
  elapsed: number,
  reduced: boolean,
  facing: Point = { x: 1, y: 0 },
  depth?: number,
): NativeEffectPose[] {
  const emitter = pack.emitters[emitterName];
  if (!emitter || reduced) return [];
  const seed = nativeEffectSeed(key);
  const parentAngle = Math.atan2((facing.x + facing.y) * 0.16, (facing.x - facing.y) * 0.32);
  const result: NativeEffectPose[] = [];
  for (const birth of births) {
    const random = (slot: number) => visualRandom(seed, birth.index, slot);
    const config = emitterVariant(emitter, Math.floor(random(1) * emitter.length));
    const graph = pack.scenes[nativeSceneId(config.ParticleSwf)];
    if (!graph || graph.exports[config.ParticleExportName] === undefined) continue;
    const pose = sampler(graph, NATIVE_ART_SCALE)(
      `${key}:${birth.index}`,
      emitterName,
      [config],
      elapsed - birth.at,
      birth.ground,
      random,
      config.IsoLayer ?? 'Object',
      false,
      parentAngle,
      Math.atan2(facing.y, facing.x),
    );
    if (!pose) continue;
    if (depth !== undefined && config.IsoLayer !== 'Top') pose.depth = depth;
    result.push({ ...pose, scene: nativeSceneId(config.ParticleSwf) });
  }
  return result;
}

/** Birth schedule of a trail emitter between launch and the end of flight. */
export function nativeTrailBirths(
  emitter: NativeRow,
  launched: number,
  end: number,
  elapsed: number,
) {
  const count = Math.max(1, n(emitter, 'ParticleCount', 1));
  const emission = n(emitter, 'EmissionTime') / 1000;
  const life = Math.max(n(emitter, 'MaxLife'), n(emitter, 'MinLife')) / 1000;
  const step = emission > 0 ? emission / count : Infinity;
  const result: { index: number; at: number }[] = [];
  const stop = Math.min(end, elapsed);
  if (step === Infinity) {
    for (let i = 0; i < count; i++)
      if (launched <= elapsed && elapsed - launched < life) result.push({ index: i, at: launched });
    return result;
  }
  // Never schedule more than ~16 births per tile of flight frame budget: keep the newest alive ones.
  const interval = Math.max(step, 1 / 60);
  const first = Math.max(0, Math.ceil((elapsed - life - launched) / interval - 1e-9));
  const last = Math.floor((stop - launched) / interval + 1e-9);
  for (let i = Math.max(first, last - 96); i <= last; i++)
    result.push({ index: i, at: launched + i * interval });
  return result;
}
