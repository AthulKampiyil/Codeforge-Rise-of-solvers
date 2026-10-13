import raw from '../../reference/cannon/effects.json' with { type: 'json' };
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import { CANNON_GRAPH, cannonFlightPoint } from './cannon-poses';
import { cannonProjectileRow } from './cannon-stats';
import type { CannonShot } from './cannon-attack';
import { CANNON_ART } from './cannon-art';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
export type CannonHandling = 'pickup' | 'place';
export const CANNON_EFFECTS = raw.effects as Record<string, Row[]>;
export const CANNON_EMITTERS = raw.particles as Record<string, Row[]>;
export const CANNON_SOUNDS = raw.sounds;
export const cannonSample = (path: string) =>
  `cannon-${path.split('/').at(-1)!.replace('.ogg', '')}`;
export const cannonHandlingEffect = (kind: CannonHandling) =>
  kind === 'pickup' ? 'Basic Turret Pickup' : 'Basic Turret Placing';
const n = (row: Row, key: string) => Number(row[key] ?? 0);
const particle = nativeParticleSampler(CANNON_GRAPH, CANNON_ART.scale, {
  reducedEmitters: ['DefenceHit'],
  signedSpeed: true,
  directionalRadius: true,
  orientTravelToParent: true,
  altitudeScale: CANNON_ART.altitudeScale,
});

export function cannonSoundCues(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
): SampleCue[] {
  return CANNON_EFFECTS[effect].flatMap((row, i) =>
    !row.Sound
      ? []
      : [
          {
            key: `cannon:${id}:${event}:${index}:${i}`,
            sample: cannonSample(row.Sound),
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
export function cannonEffectPoses(
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
    rows = CANNON_EFFECTS[effect];
  for (const [emitterIndex, effectRow] of rows.entries()) {
    const name = effectRow.ParticleEmitter;
    if (!name) continue;
    const emitter = CANNON_EMITTERS[name],
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
        Math.atan2((facing.x + facing.y) * 0.16, (facing.x - facing.y) * 0.32),
        Math.atan2(facing.y, facing.x),
      );
      if (pose) result.push(pose);
    }
  }
  return result;
}

/** Source births follow the recorded physical path and remain in place after impact. */
export function cannonTrailPoses(
  shot: CannonShot,
  elapsed: number,
  iso: (x: number, y: number) => { x: number; y: number },
): NativeParticlePose[] {
  const name = cannonProjectileRow(shot.level).ParticleEmitter;
  if (!name) return [];
  const rows = CANNON_EMITTERS[name],
    result: NativeParticlePose[] = [],
    life = n(rows[0], 'MaxLife') / 1000;
  // Births are recorded in time order. Walk back from the newest and stop at the first one
  // past the longest particle life: expired births build no key, point or random closure.
  let first = shot.trail.length;
  while (first > 0 && elapsed - shot.trail[first - 1].at < life) first--;
  for (let i = first; i < shot.trail.length; i++) {
    const birth = shot.trail[i];
    if (birth.at > elapsed) break;
    const pose = particle(
      `${shot.sourceId}:trail:${shot.index}:${birth.index}`,
      name,
      rows,
      elapsed - birth.at,
      cannonFlightPoint(shot, birth, iso),
      (slot) => visualRandom(shot.sourceId, shot.index, 200000 + birth.index * 16 + slot),
      'Top',
      false,
    );
    if (pose) result.push(pose);
  }
  return result;
}
