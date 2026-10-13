import raw from '../../reference/mortar/effects.json' with { type: 'json' };
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import { mortarGraph, mortarFlightPoint } from './mortar-poses';
import { mortarProjectileRow } from './mortar-stats';
import type { MortarShot } from './mortar-attack';
import { MORTAR_ART } from './mortar-art';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
export type MortarHandling = 'pickup' | 'place';
export const MORTAR_EFFECTS = raw.effects as Record<string, Row[]>;
export const MORTAR_EMITTERS = raw.particles as Record<string, Row[]>;
export const MORTAR_SOUNDS = raw.sounds;
export const mortarSample = (path: string) =>
  `mortar-${path.split('/').at(-1)!.replace('.ogg', '')}`;
export const mortarHandlingEffect = (kind: MortarHandling) =>
  kind === 'pickup' ? 'Mortar Pickup' : 'Mortar Placing';
const n = (row: Row, key: string) => Number(row[key] ?? 0);
let sampler: ReturnType<typeof nativeParticleSampler> | undefined;
const particle = (...args: Parameters<ReturnType<typeof nativeParticleSampler>>) =>
  (sampler ??= nativeParticleSampler(mortarGraph(), MORTAR_ART.scale, {
    reducedEmitters: ['Ring', 'bomb_crater_small'],
    staticEmitters: { bomb_crater_small: -42 },
    altitudeScale: MORTAR_ART.altitudeScale,
  }))(...args);

export function mortarSoundCues(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
): SampleCue[] {
  return MORTAR_EFFECTS[effect].flatMap((row, i) =>
    !row.Sound
      ? []
      : [
          {
            key: `mortar:${id}:${event}:${index}:${i}`,
            sample: mortarSample(row.Sound),
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
export function mortarEffectPoses(
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
    rows = MORTAR_EFFECTS[effect];
  for (const [emitterIndex, effectRow] of rows.entries()) {
    const name = effectRow.ParticleEmitter;
    if (!name) continue;
    const emitter = MORTAR_EMITTERS[name],
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

/** Reconstruct only live trail births, preserving their original point after landing. */
export function mortarTrailPoses(
  shot: MortarShot,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
): NativeParticlePose[] {
  const name = mortarProjectileRow(shot.level).ParticleEmitter,
    rows = MORTAR_EMITTERS[name],
    row = rows[0];
  const life = n(row, 'MaxLife') / 1000;
  if (elapsed < shot.launched || elapsed >= shot.impact + life) return [];
  const interval = n(row, 'EmissionTime') / 1000 / n(row, 'ParticleCount');
  const result: NativeParticlePose[] = [];
  for (
    let i = Math.max(0, Math.ceil((elapsed - life - shot.launched) / interval));
    shot.launched + i * interval < Math.min(elapsed + 1e-9, shot.impact);
    i++
  ) {
    const at = shot.launched + i * interval,
      point = mortarFlightPoint(shot.level, shot, at, iso);
    const pose = particle(
      `${shot.sourceId}:trail:${shot.index}:${i}`,
      name,
      rows,
      elapsed - at,
      point,
      (slot) => visualRandom(shot.sourceId, shot.index, 200000 + i * 16 + slot),
      'Top',
      false,
    );
    if (pose) result.push(pose);
  }
  return result;
}
