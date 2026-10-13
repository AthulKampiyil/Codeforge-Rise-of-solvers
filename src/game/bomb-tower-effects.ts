import raw from '../../reference/bombtower/effects.json' with { type: 'json' };
import art from '../../reference/bombtower/particle_art.json' with { type: 'json' };
import combat from '../../reference/bombtower/combat.json' with { type: 'json' };
import type { NativeMeshGraph } from './native-mesh';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
export { nativeParticleTravel as bombParticleTravel } from './native-particles';
import { visualRandom } from './visual-random';
import { BOMB_TOWER_ART } from './bomb-tower-art';
import { bombFlightPoint } from './bomb-tower-poses';
import type { BombTowerShot } from './bomb-tower-attack';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
type Point = { x: number; y: number };
export type BombTowerHandling = 'pickup' | 'place';
export const BOMB_TOWER_EFFECTS = raw.effects as Record<string, Row[]>;
export const BOMB_TOWER_EMITTERS = raw.particles as Record<string, Row[]>;
export const BOMB_TOWER_SOUNDS = raw.sounds;
export const BOMB_TOWER_PARTICLES = art as unknown as NativeMeshGraph;
export type BombTowerEffectPose = NativeParticlePose;
const particle = nativeParticleSampler(BOMB_TOWER_PARTICLES, BOMB_TOWER_ART.scale, {
  reducedEmitters: ['bomb_crater', 'bomb_tower_area_edge', 'Super_ground_bomb_area'],
  staticEmitters: { bomb_crater: -42 },
});
const n = (r: Row, k: string) => Number(r[k] ?? 0);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const handlingEffect = (kind: BombTowerHandling) =>
  kind === 'pickup' ? 'Mortar Pickup' : 'Mortar Placing';
export const bombTowerSample = (path: string) =>
  `bombtower-${path.split('/').at(-1)!.replace('.ogg', '')}`;
export const bombTowerHitEffect = (level: number) => combat.levels[level - 1].hitEffect;
export const bombTowerDestroyedEffect = (level: number, armed: boolean) =>
  armed ? combat.levels[level - 1].destroyedEffect : 'Building Destroyed';

/** Preserve explicit spawned effects and their delays; native row/instance selection is unverified. */
function sources(name: string, delay = 0): { name: string; delay: number; rows: Row[] }[] {
  const rows = BOMB_TOWER_EFFECTS[name];
  return [
    { name, delay, rows },
    ...rows.flatMap((r) =>
      r.SpawnEffect ? sources(r.SpawnEffect, delay + n(r, 'SpawnEffectDelay') / 1000) : [],
    ),
  ];
}
export function bombTowerSoundCues(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
): SampleCue[] {
  return sources(effect).flatMap((source, group) =>
    source.rows.flatMap((row, i) =>
      !row.Sound
        ? []
        : [
            {
              key: `bombtower:${id}:${event}:${index}:${group}:${i}`,
              sample: bombTowerSample(row.Sound),
              at: at + source.delay + n(row, 'SoundDelay') / 1000,
              volume: n(row, 'Volume') / 100,
              pitch:
                mix(
                  n(row, 'MinPitch'),
                  n(row, 'MaxPitch'),
                  visualRandom(id, index, 50000 + group * 100 + i),
                ) / 100,
            },
          ],
    ),
  );
}
export const bombTowerHandlingCues = (
  id: number,
  index: number,
  kind: BombTowerHandling,
  at: number,
) => bombTowerSoundCues(id, `home-${kind}`, index, handlingEffect(kind), at);

export function bombTowerEffectPoses(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
  elapsed: number,
  ground: Point,
  reduced: boolean,
): BombTowerEffectPose[] {
  const result: BombTowerEffectPose[] = [];
  for (const [group, source] of sources(effect).entries())
    for (const [emitterIndex, effectRow] of source.rows.entries()) {
      const name = effectRow.ParticleEmitter;
      // The original exposed charge has its own gameplay-fuse registration and lifecycle.
      if (!name || name.startsWith('Bomb Tower Bomb Appear')) continue;
      const rows = BOMB_TOWER_EMITTERS[name],
        row = rows[0],
        count = n(row, 'ParticleCount');
      const age = elapsed - at - source.delay - n(effectRow, 'EmitterDelayMs') / 1000;
      if (age < 0 || age >= (n(row, 'EmissionTime') + n(row, 'MaxLife')) / 1000) continue;
      for (let i = 0; i < count; i++) {
        const key = `${id}:${event}:${index}:${group}:${emitterIndex}:${i}`;
        const pose = particle(
          key,
          name,
          rows,
          age - ((n(row, 'EmissionTime') / 1000) * i) / count,
          ground,
          (slot) =>
            visualRandom(id, index, 1000000 + group * 100000 + emitterIndex * 1000 + i * 16 + slot),
          source.rows[0].IsoLayer,
          reduced,
        );
        if (pose) result.push(pose);
      }
    }
  return result;
}
export const bombTowerHandlingPoses = (
  id: number,
  index: number,
  kind: BombTowerHandling,
  at: number,
  elapsed: number,
  ground: Point,
  reduced: boolean,
) =>
  bombTowerEffectPoses(
    id,
    `home-${kind}`,
    index,
    handlingEffect(kind),
    at,
    elapsed,
    ground,
    reduced,
  );

/** Continuous trail births remain at their sampled flight positions after landing. */
export function bombTowerTrailPoses(
  id: number,
  _level: number,
  shot: BombTowerShot,
  elapsed: number,
  iso: (x: number, y: number) => Point,
): BombTowerEffectPose[] {
  const rows = BOMB_TOWER_EMITTERS.mortar_trail,
    row = rows[0];
  if (elapsed < shot.at || elapsed >= shot.impact + n(row, 'MaxLife') / 1000) return [];
  const interval = n(row, 'EmissionTime') / 1000 / n(row, 'ParticleCount');
  const projectile = { ...shot, launched: shot.at };
  const from = iso(shot.fromX, shot.fromY),
    to = iso(shot.x, shot.y);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const result: BombTowerEffectPose[] = [];
  // Start at the oldest birth that can still be alive, not at the first birth of the flight.
  const life = n(row, 'MaxLife') / 1000;
  for (
    let i = Math.max(0, Math.ceil((elapsed - life - shot.at) / interval));
    shot.at + i * interval < Math.min(elapsed + 1e-9, shot.impact);
    i++
  ) {
    const at = shot.at + i * interval,
      point = bombFlightPoint(projectile, at, iso);
    const pose = particle(
      `${id}:trail:${shot.index}:${i}`,
      'mortar_trail',
      rows,
      elapsed - at,
      point,
      (slot) => visualRandom(id, shot.index, 200000 + i * 10 + slot),
      'Top',
      false,
      angle,
    );
    if (pose) result.push(pose);
  }
  return result;
}
