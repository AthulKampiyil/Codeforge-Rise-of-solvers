import raw from '../../reference/eagle-artillery/effects.json' with { type: 'json' };
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import { EAGLE_ARTILLERY_GRAPH } from './eagle-artillery-poses';
import { EAGLE_ARTILLERY_ART } from './eagle-artillery-art';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
export const EAGLE_ARTILLERY_EFFECT_ROWS = raw.effects as Record<string, Row[]>;
export const EAGLE_ARTILLERY_EMITTERS = raw.particles as Record<string, Row[]>;
export const EAGLE_ARTILLERY_SOUNDS = raw.sounds as Record<string, { path: string; sha256: string }>;
export const eagleArtillerySample = (path: string) =>
  `eagle-artillery-${path.split('/').at(-1)!.replace('.ogg', '')}`;
const n = (row: Row, key: string) => Number(row[key] ?? 0);
const particle = nativeParticleSampler(EAGLE_ARTILLERY_GRAPH, EAGLE_ARTILLERY_ART.scale, {
  reducedEmitters: ['doom_crater'],
  staticEmitters: { doom_crater: 0 },
  altitudeScale: EAGLE_ARTILLERY_ART.altitudeScale,
});

export function eagleArtillerySoundCues(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
): SampleCue[] {
  return EAGLE_ARTILLERY_EFFECT_ROWS[effect].flatMap((row, i) =>
    !row.Sound || !EAGLE_ARTILLERY_SOUNDS[row.Sound]
      ? []
      : [
          {
            key: `eagle-artillery:${id}:${event}:${index}:${i}`,
            sample: eagleArtillerySample(row.Sound),
            at: at + n(row, 'SoundDelay') / 1000,
            volume: n(row, 'Volume') / 100,
            pitch:
              (n(row, 'MinPitch') +
                (n(row, 'MaxPitch') - n(row, 'MinPitch')) * visualRandom(id, index, 50000 + i)) /
              100,
          },
        ],
  );
}

/** Original emitter rows with the shared documented local particle projection. */
export function eagleArtilleryEffectPoses(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
  elapsed: number,
  ground: { x: number; y: number },
  reduced: boolean,
): NativeParticlePose[] {
  const result: NativeParticlePose[] = [],
    rows = EAGLE_ARTILLERY_EFFECT_ROWS[effect];
  for (const [emitterIndex, effectRow] of rows.entries()) {
    const name = effectRow.ParticleEmitter;
    if (!name) continue;
    const emitter = EAGLE_ARTILLERY_EMITTERS[name],
      row = emitter[0],
      count = n(row, 'ParticleCount');
    const rawAge = elapsed - at - n(effectRow, 'EmitterDelayMs') / 1000;
    if (rawAge < -1e-9) continue;
    const age = Math.max(0, rawAge);
    if (age >= (n(row, 'EmissionTime') + n(row, 'MaxLife')) / 1000) continue;
    for (let i = 0; i < count; i++) {
      const pose = particle(
        `${id}:${event}:${index}:${emitterIndex}:${i}`,
        name,
        emitter,
        age - ((n(row, 'EmissionTime') / 1000) * i) / count,
        ground,
        (slot) => visualRandom(id, index, 1000000 + emitterIndex * 1000 + i * 16 + slot),
        effectRow.IsoLayer ?? rows[0].IsoLayer,
        reduced,
      );
      if (pose) result.push(pose);
    }
  }
  return result;
}

/**
 * Source trail births (doom_trail_emitter) along the presented shell path. The emitter is an iso
 * particle; while airborne it is drawn on the top layer instead of the ground decal layer.
 */
export function eagleArtilleryTrailPoses(
  id: number,
  index: number,
  launchedAt: number,
  arrivesAt: number,
  elapsed: number,
  point: (at: number) => { x: number; y: number },
  reduced: boolean,
): NativeParticlePose[] {
  if (reduced) return [];
  const name = EAGLE_ARTILLERY_EFFECT_ROWS['Artillery Trail'][0].ParticleEmitter,
    rows = EAGLE_ARTILLERY_EMITTERS[name],
    row = rows[0];
  const life = n(row, 'MaxLife') / 1000,
    interval = n(row, 'EmissionTime') / 1000 / n(row, 'ParticleCount');
  if (elapsed < launchedAt || elapsed >= arrivesAt + life) return [];
  const result: NativeParticlePose[] = [];
  for (
    let i = Math.max(0, Math.ceil((elapsed - life - launchedAt) / interval));
    launchedAt + i * interval < Math.min(elapsed + 1e-9, arrivesAt);
    i++
  ) {
    const at = launchedAt + i * interval;
    const pose = particle(
      `${id}:trail:${index}:${i}`,
      name,
      rows,
      elapsed - at,
      point(at),
      (slot) => visualRandom(id, index, 200000 + i * 16 + slot),
      'Top',
      false,
    );
    if (pose) result.push({ ...pose, depth: 8000 });
  }
  return result;
}
