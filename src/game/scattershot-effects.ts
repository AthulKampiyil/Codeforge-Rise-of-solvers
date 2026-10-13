import raw from '../../reference/scattershot/effects.json' with { type: 'json' };
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import { SCATTERSHOT_GRAPH } from './scattershot-poses';
import { SCATTERSHOT_ART } from './scattershot-art';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
export const SCATTERSHOT_EFFECT_ROWS = raw.effects as Record<string, Row[]>;
export const SCATTERSHOT_EMITTERS = raw.particles as Record<string, Row[]>;
export const SCATTERSHOT_SOUNDS = raw.sounds as Record<string, { path: string; sha256: string }>;
export const scattershotSample = (path: string) =>
  `scattershot-${path.split('/').at(-1)!.replace('.ogg', '')}`;
const n = (row: Row, key: string) => Number(row[key] ?? 0);
const particle = nativeParticleSampler(SCATTERSHOT_GRAPH, SCATTERSHOT_ART.scale, {
  reducedEmitters: [],
  signedSpeed: true,
  directionalRadius: true,
  orientTravelToParent: true,
  altitudeScale: SCATTERSHOT_ART.altitudeScale,
});

export function scattershotSoundCues(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
): SampleCue[] {
  return SCATTERSHOT_EFFECT_ROWS[effect].flatMap((row, i) =>
    !row.Sound || !SCATTERSHOT_SOUNDS[row.Sound]
      ? []
      : [
          {
            key: `scattershot:${id}:${event}:${index}:${i}`,
            sample: scattershotSample(row.Sound),
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

/** Original emitter rows; OrientToParent emitters follow the throw or shard-cone direction. */
export function scattershotEffectPoses(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
  elapsed: number,
  ground: { x: number; y: number },
  reduced: boolean,
  facing = { x: 1, y: 0 },
): NativeParticlePose[] {
  const result: NativeParticlePose[] = [],
    rows = SCATTERSHOT_EFFECT_ROWS[effect];
  for (const [emitterIndex, effectRow] of rows.entries()) {
    const name = effectRow.ParticleEmitter;
    if (!name || !SCATTERSHOT_EMITTERS[name]) continue;
    const emitter = SCATTERSHOT_EMITTERS[name],
      row = emitter[0],
      count = n(row, 'ParticleCount');
    if (row.ParticleSwf && row.ParticleSwf !== 'sc/buildings.sc') continue;
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
        Math.atan2((facing.x + facing.y) * 0.16, (facing.x - facing.y) * 0.32),
        Math.atan2(facing.y, facing.x),
      );
      if (pose) result.push(pose);
    }
  }
  return result;
}

/** Source trail births along the simulated flight; the level-7 vfx_env trail is not imported. */
export function scattershotTrailPoses(
  id: number,
  index: number,
  emitterName: string,
  launchedAt: number,
  elapsed: number,
  point: (at: number) => { x: number; y: number } | undefined,
  reduced: boolean,
): NativeParticlePose[] {
  const rows = SCATTERSHOT_EMITTERS[emitterName];
  if (reduced || !rows || rows[0].ParticleSwf !== 'sc/buildings.sc') return [];
  const row = rows[0],
    life = n(row, 'MaxLife') / 1000,
    interval = n(row, 'EmissionTime') / 1000 / n(row, 'ParticleCount');
  const result: NativeParticlePose[] = [];
  for (
    let i = Math.max(0, Math.ceil((elapsed - life - launchedAt) / interval));
    launchedAt + i * interval < elapsed + 1e-9;
    i++
  ) {
    const at = launchedAt + i * interval,
      where = point(at);
    if (!where) continue;
    const pose = particle(
      `${id}:trail:${index}:${i}`,
      emitterName,
      rows,
      elapsed - at,
      where,
      (slot) => visualRandom(id, index, 200000 + i * 16 + slot),
      'Top',
      false,
    );
    if (pose) result.push({ ...pose, depth: 7900 });
  }
  return result;
}
