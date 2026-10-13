import raw from '../../reference/seeking-mine/effects.json' with { type: 'json' };
import { nativeScenePoses } from './native-mesh';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { seekingMineGraph, seekingMineClip, seekingMineFlightPoint } from './seeking-mine-poses';
import { SEEKING_MINE_ART } from './seeking-mine-art';
import { visualRandom } from './visual-random';
import type { SampleCue } from './sample-audio';
import type { TrapState } from './traps';

type Row = Record<string, string>;
type Point = { x: number; y: number };
export const SEEKING_MINE_EFFECTS = raw.effects as Record<string, Row[]>;
export const SEEKING_MINE_EMITTERS = raw.particles as Record<string, Row[]>;
export const SEEKING_MINE_SOUNDS = raw.sounds;
export const seekingMineSample = (path: string) =>
  `seeking-mine-${path.split('/').at(-1)!.replace('.ogg', '')}`;
const n = (row: Row, key: string) => Number(row[key] ?? 0);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// Local 100-unit air height maps to the village's 46-pixel troop lift.
let sampler: ReturnType<typeof nativeParticleSampler> | undefined;
/** Built on first use: the graph arrives with the Seeking Air Mine art family. */
const particle: ReturnType<typeof nativeParticleSampler> = (...args) =>
  (sampler ??= nativeParticleSampler(seekingMineGraph(), SEEKING_MINE_ART.scale, {
    altitudeScale: 0.46,
  }))(...args);
export type SeekingMineHandling = 'pickup' | 'place';
export const seekingMineHandlingEffect = (kind: SeekingMineHandling) =>
  kind === 'pickup' ? 'Generic Pick Up' : 'Generic Placing';

export function seekingMineSoundCues(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
): SampleCue[] {
  return SEEKING_MINE_EFFECTS[effect].flatMap((row, i) =>
    !row.Sound
      ? []
      : [
          {
            key: `seeking-mine:${id}:${event}:${index}:${i}`,
            sample: seekingMineSample(row.Sound),
            at: at + n(row, 'SoundDelay') / 1000,
            volume: n(row, 'Volume') / 100,
            pitch:
              mix(n(row, 'MinPitch'), n(row, 'MaxPitch'), visualRandom(id, index, 50000 + i)) / 100,
          },
        ],
  );
}

/** Source rows/lifetimes with bounded looping births; native SpawnLimit semantics remain unverified. */
export function seekingMineEffectPoses(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
  elapsed: number,
  ground: Point,
  reduced: boolean,
): NativeParticlePose[] {
  if (reduced || elapsed < at) return [];
  const rows = SEEKING_MINE_EFFECTS[effect],
    result: NativeParticlePose[] = [];
  for (const [emitterIndex, effectRow] of rows.entries()) {
    const age = elapsed - at - n(effectRow, 'EmitterDelayMs') / 1000;
    if (effectRow.ExportName) {
      const name = effectRow.ExportName,
        clip = seekingMineClip(name),
        scale = (SEEKING_MINE_ART.scale * n(effectRow, 'Scale')) / 100;
      if (age >= 0 && age < clip.timeline.length / clip.fps) {
        const poses = nativeScenePoses(seekingMineGraph(), name, age, {}, [
          scale,
          0,
          0,
          0,
          scale,
          0,
        ]);
        if (poses.length)
          result.push({
            key: `${id}:${event}:${index}:clip:${emitterIndex}`,
            emitter: `clip:${name}`,
            poses,
            ...ground,
            depth: ground.y + 0.01,
          });
      }
    }
    const name = effectRow.ParticleEmitter;
    if (!name || age < 0) continue;
    const emitter = SEEKING_MINE_EMITTERS[name],
      row = emitter[0],
      count = n(row, 'ParticleCount'),
      emission = n(row, 'EmissionTime') / 1000,
      life = n(row, 'MaxLife') / 1000;
    const interval = emission / count,
      looping = rows[0].Looping === 'TRUE' && interval > 0;
    // A one-shot emitter is over once its last birth outlived the longest particle life.
    if (!looping && age >= emission + life) continue;
    const first = looping ? Math.max(0, Math.floor((age - life) / interval) + 1) : 0;
    const last = looping ? Math.floor(age / interval + 1e-9) + 1 : count;
    // Treat the source limit as a per-emitter active-instance cap; never resample expired history.
    const cap = n(rows[0], 'SpawnLimit') || count;
    for (let i = Math.max(first, looping ? last - cap : 0); i < last; i++) {
      const pose = particle(
        `${id}:${event}:${index}:${emitterIndex}:${i}`,
        name,
        emitter,
        age - i * interval,
        ground,
        (slot) => visualRandom(id, index, 1000000 + emitterIndex * 100000 + i * 16 + slot),
        rows[0].IsoLayer,
        false,
      );
      if (pose) result.push(pose);
    }
  }
  return result;
}

export function seekingMineTrailPoses(
  id: number,
  state: TrapState,
  elapsed: number,
  iso: (x: number, y: number) => Point,
  airLift: number,
): NativeParticlePose[] {
  const result: NativeParticlePose[] = [],
    trail = state.mine?.trail ?? [],
    life = n(SEEKING_MINE_EMITTERS.large_airTrap_redSmoke[0], 'MaxLife') / 1000;
  // Births are recorded in time order: skip the expired head before building any point.
  let first = trail.length;
  while (first > 0 && elapsed - trail[first - 1].at < life) first--;
  for (let i = first; i < trail.length; i++) {
    const p = trail[i];
    const point = seekingMineFlightPoint(p.x, p.y, p.at - state.activatedAt, iso, airLift);
    const pose = particle(
      `${id}:trail:${p.index}`,
      'large_airTrap_redSmoke',
      SEEKING_MINE_EMITTERS.large_airTrap_redSmoke,
      elapsed - p.at,
      point,
      (slot) => visualRandom(id, p.index, 200000 + slot),
      'Top',
      false,
      Math.atan2(p.direction.y, p.direction.x),
    );
    if (pose) result.push(pose);
  }
  return result;
}
