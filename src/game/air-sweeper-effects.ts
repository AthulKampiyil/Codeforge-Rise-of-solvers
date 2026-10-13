import raw from '../../reference/air-sweeper/effects.json' with { type: 'json' };
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import { sweeperGraph } from './air-sweeper-poses';
import { SWEEPER_ART } from './air-control-art';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
export type SweeperHandling = 'pickup' | 'place';
export const SWEEPER_EFFECTS = raw.effects as Record<string, Row[]>;
export const SWEEPER_EMITTERS = raw.particles as Record<string, Row[]>;
export const SWEEPER_SOUNDS = raw.sounds;
export const sweeperSample = (path: string) =>
  `airsweeper-${path.split('/').at(-1)!.replace('.ogg', '')}`;
export const sweeperHandlingEffect = (kind: SweeperHandling) =>
  kind === 'pickup' ? 'Wind Machine Pickup' : 'Wind Machine Place';
const n = (row: Row, key: string) => Number(row[key] ?? 0);
let sampler: ReturnType<typeof nativeParticleSampler> | undefined;
/** Built on first use: the graph arrives with the Air Sweeper art family. */
const particle: ReturnType<typeof nativeParticleSampler> = (...args) =>
  (sampler ??= nativeParticleSampler(sweeperGraph(), SWEEPER_ART.scale))(...args);

export function sweeperSoundCues(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
): SampleCue[] {
  return SWEEPER_EFFECTS[effect].flatMap((row, i) =>
    !row.Sound
      ? []
      : [
          {
            key: `airsweeper:${id}:${event}:${index}:${i}`,
            sample: sweeperSample(row.Sound),
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
/** Original emitter parameters with the shared documented local particle projection. */
export function sweeperEffectPoses(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
  elapsed: number,
  ground: { x: number; y: number },
  reduced: boolean,
): NativeParticlePose[] {
  if (reduced) return [];
  const result: NativeParticlePose[] = [],
    rows = SWEEPER_EFFECTS[effect];
  for (const [emitterIndex, effectRow] of rows.entries()) {
    const name = effectRow.ParticleEmitter;
    if (!name) continue;
    const emitter = SWEEPER_EMITTERS[name],
      row = emitter[0],
      count = n(row, 'ParticleCount');
    const age = elapsed - at - n(effectRow, 'EmitterDelayMs') / 1000;
    if (age < 0 || age >= (n(row, 'EmissionTime') + n(row, 'MaxLife')) / 1000) continue;
    for (let i = 0; i < count; i++) {
      const pose = particle(
        `${id}:${event}:${index}:${emitterIndex}:${i}`,
        name,
        emitter,
        age - ((n(row, 'EmissionTime') / 1000) * i) / count,
        ground,
        (slot) => visualRandom(id, index, 1000000 + emitterIndex * 1000 + i * 16 + slot),
        effectRow.IsoLayer ?? rows[0].IsoLayer,
        false,
      );
      if (pose) result.push(pose);
    }
  }
  return result;
}
