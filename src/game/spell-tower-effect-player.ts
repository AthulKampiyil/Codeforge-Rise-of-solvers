import { nativeVertices, type NativeMeshGraph, type NativeScenePose } from './native-mesh';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
type Point = { x: number; y: number };
const n = (row: Row | undefined, key: string, fallback = 0) =>
  row?.[key] === undefined ? fallback : Number(row[key]);
const TIMED = ['MinLife', 'MaxLife', 'EmissionTime', 'ParticleFadeOutTime', 'FadeInTime', 'FadeOutTime'];

/** Transformed vertex bounds of sampled poses, without a renderer. */
export function sourcePoseBounds(
  poses: readonly NativeScenePose[],
): [number, number, number, number] | undefined {
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  const visit = (items: readonly NativeScenePose[]) => {
    for (const pose of items) {
      if ('group' in pose) {
        visit(pose.group);
        continue;
      }
      const v = nativeVertices(pose);
      for (let i = 0; i < v.length; i += 4) {
        left = Math.min(left, v[i]);
        right = Math.max(right, v[i]);
        top = Math.min(top, v[i + 1]);
        bottom = Math.max(bottom, v[i + 1]);
      }
    }
  };
  visit(poses);
  return left === Infinity ? undefined : [left, top, right, bottom];
}

/** A single-leaf additive group composites identically as one additive leaf; avoid a buffer. */
export function flattenSingleLeafGroups(poses: NativeScenePose[]): NativeScenePose[] {
  return poses.map((pose) => {
    if (!('group' in pose) || pose.group.length !== 1 || 'group' in pose.group[0]) return pose;
    const leaf = pose.group[0];
    if (leaf.blend !== 0 || pose.add.some((v) => v !== 0)) return pose;
    return {
      ...leaf,
      key: pose.key,
      blend: pose.blend,
      multiply: leaf.multiply.map((v, i) => v * pose.multiply[i]),
      add: leaf.add.map((v, i) => v * pose.multiply[i]),
    };
  });
}

/**
 * Plays original effect rows: every emitter with its delay, source particle ranges and the
 * effect's `Scale` (art size) and `LifeTimeScale` (a percentage applied to particle lifetime,
 * emission and fade timings — a local interpretation of the field name). Sounds use the
 * row's delay, volume and pitch range with stable visual randomness.
 */
export function sourceEffectPlayer(options: {
  graph: NativeMeshGraph;
  effects: Record<string, Row[]>;
  emitters: Record<string, Row[]>;
  artScale: number;
  sample: (path: string) => string;
  prefix: string;
  reducedEmitters?: readonly string[];
  altitudeScale?: number;
}) {
  const { graph, effects, emitters, artScale, altitudeScale = 0.8 } = options;
  const samplers = new Map<number, ReturnType<typeof nativeParticleSampler>>();
  const scaled = new Map<string, Row[]>();
  // `ScaleTimeline` spans an export's animation. Several static one-frame exports hold their
  // animation in a descendant clip; its longest descendant timeline is the effective span.
  const timelineDurations: Record<string, number> = {};
  for (const rows of Object.values(emitters))
    for (const row of rows) {
      const name = row.ParticleExportName;
      const id = name === undefined ? undefined : graph.exports[name];
      if (id === undefined || !graph.clips[id] || graph.clips[id].timeline.length > 1) continue;
      let longest = 0;
      const pending = [id],
        seen = new Set<number>();
      while (pending.length) {
        const clip = graph.clips[pending.pop()!];
        if (!clip) continue;
        longest = Math.max(longest, clip.timeline.length / clip.fps);
        for (const child of clip.children)
          if (!seen.has(child)) {
            seen.add(child);
            pending.push(child);
          }
      }
      if (longest > 1 / graph.clips[id].fps) timelineDurations[name!] = longest;
    }
  const sampler = (scale: number) => {
    let result = samplers.get(scale);
    if (!result)
      samplers.set(
        scale,
        (result = nativeParticleSampler(graph, artScale * scale, {
          reducedEmitters: options.reducedEmitters,
          staticEmitters: Object.fromEntries((options.reducedEmitters ?? []).map((e) => [e, 0])),
          altitudeScale,
          timelineDurations,
        })),
      );
    return result;
  };
  const rows = (emitter: string, lifetime: number) => {
    const key = `${emitter}:${lifetime}`;
    let result = scaled.get(key);
    if (!result) {
      const source = emitters[emitter];
      if (!source) throw Error(`Missing original particle emitter: ${emitter}`);
      result =
        lifetime === 1
          ? source
          : source.map((row) =>
              Object.fromEntries(
                Object.entries(row).map(([k, v]) => [
                  k,
                  TIMED.includes(k) ? String(Number(v) * lifetime) : v,
                ]),
              ),
            );
      scaled.set(key, result);
    }
    return result;
  };
  function duration(effect: string) {
    let end = 0;
    const effectRows = effects[effect] ?? [];
    const lifetime = n(effectRows[0], 'LifeTimeScale', 100) / 100;
    for (const row of effectRows) {
      if (!row.ParticleEmitter) continue;
      const first = rows(row.ParticleEmitter, lifetime)[0];
      end = Math.max(
        end,
        (n(row, 'EmitterDelayMs') + n(first, 'EmissionTime') + n(first, 'MaxLife')) / 1000,
      );
    }
    return end;
  }
  function poses(
    key: string,
    effect: string,
    at: number,
    elapsed: number,
    ground: Point,
    seed: number,
    index: number,
    reduced: boolean,
    layer?: string,
  ): NativeParticlePose[] {
    const effectRows = effects[effect];
    if (!effectRows) throw Error(`Missing original effect: ${effect}`);
    const head = effectRows[0];
    const scale = n(head, 'Scale', 100) / 100,
      lifetime = n(head, 'LifeTimeScale', 100) / 100;
    const offsetZ = n(head, 'OffsetZ') * altitudeScale;
    const point = { x: ground.x, y: ground.y - offsetZ };
    const result: NativeParticlePose[] = [];
    for (const [emitterIndex, row] of effectRows.entries()) {
      if (!row.ParticleEmitter) continue;
      const particles = rows(row.ParticleEmitter, lifetime),
        first = particles[0];
      const age = elapsed - at - n(row, 'EmitterDelayMs') / 1000;
      if (age < 0 || age >= (n(first, 'EmissionTime') + n(first, 'MaxLife')) / 1000) continue;
      const count = n(first, 'ParticleCount');
      for (let i = 0; i < count; i++) {
        const pose = sampler(scale)(
          `${key}:${emitterIndex}:${i}`,
          row.ParticleEmitter,
          particles,
          age - ((n(first, 'EmissionTime') / 1000) * i) / count,
          point,
          (slot) => visualRandom(seed, index, 1000000 + emitterIndex * 1000 + i * 16 + slot),
          layer ?? head.IsoLayer,
          reduced,
        );
        if (!pose) continue;
        pose.poses = flattenSingleLeafGroups(pose.poses);
        result.push(pose);
      }
    }
    return result;
  }
  function cues(key: string, effect: string, at: number, seed: number, index: number): SampleCue[] {
    return (effects[effect] ?? []).flatMap((row, i) =>
      !row.Sound
        ? []
        : [
            {
              key: `${options.prefix}:${key}:${i}`,
              sample: options.sample(row.Sound),
              at: at + n(row, 'SoundDelay') / 1000,
              volume: n(row, 'Volume', 100) / 100,
              pitch:
                (n(row, 'MinPitch', 100) +
                  (n(row, 'MaxPitch', 100) - n(row, 'MinPitch', 100)) *
                    visualRandom(seed, index, 50000 + i)) /
                100,
              ...(row.Looping === 'TRUE' ? { loop: true } : {}),
            },
          ],
    );
  }
  /**
   * Emitter particles born along a moving source; each keeps its birth point. A looping source
   * effect re-emits every `interval` until `end`; otherwise one source emission cycle
   * (`ParticleCount` births across `EmissionTime`) is played from `birth`.
   */
  function trail(
    key: string,
    emitter: string,
    birth: number,
    end: number,
    interval: number | undefined,
    elapsed: number,
    position: (at: number) => Point,
    seed: number,
    index: number,
    depth: number,
    reduced: boolean,
  ): NativeParticlePose[] {
    const particles = rows(emitter, 1),
      first = particles[0];
    const life = n(first, 'MaxLife') / 1000;
    if (reduced || elapsed < birth || elapsed >= end + life) return [];
    const count = n(first, 'ParticleCount'),
      spacing = interval ?? n(first, 'EmissionTime') / 1000 / Math.max(1, count);
    const result: NativeParticlePose[] = [];
    for (
      let i = Math.max(0, Math.ceil((elapsed - life - birth) / Math.max(spacing, 1e-6) - 1e-9));
      (interval !== undefined || i < count) && birth + i * spacing < Math.min(elapsed + 1e-9, end);
      i++
    ) {
      const at = birth + i * spacing;
      const pose = sampler(1)(
        `${key}:${i}`,
        emitter,
        particles,
        elapsed - at,
        position(at),
        (slot) => visualRandom(seed, index, 200000 + i * 16 + slot),
        'Top',
        false,
      );
      if (!pose) continue;
      pose.poses = flattenSingleLeafGroups(pose.poses);
      pose.depth = depth;
      result.push(pose);
    }
    return result;
  }
  return { poses, cues, duration, trail };
}
