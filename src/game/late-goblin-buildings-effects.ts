import raw from '../../reference/late-goblin-buildings/effects.json' with { type: 'json' };
import type { NativeMeshGraph } from './native-mesh';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import type { SampleCue } from './sample-audio';
import { LATE_GOBLIN_GRAPH, goblinBombFlightPoint } from './late-goblin-buildings-poses';
import { LATE_GOBLIN_SOURCE } from './late-goblin-buildings-stats';
import type { LateProjectile } from './late-goblin-weapon';

type Row = Record<string, string>;
type Point = { x: number; y: number };
const n = (row: Row, key: string) => Number(row[key] ?? 0);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Original effect rows: every emitter row, sound, delay and pitch range is retained. Particle
 * motion uses the shared documented local sampler; seeks reconstruct from event timestamps.
 */
export function nativeEffectPlayer(
  graph: NativeMeshGraph,
  data: { effects: Record<string, Row[]>; particles: Record<string, Row[]> },
  sample: (path: string) => string,
  prefix: string,
  options: Parameters<typeof nativeParticleSampler>[2],
) {
  const particle = nativeParticleSampler(graph, LATE_GOBLIN_SOURCE.worldScale, options);
  const cues = (
    id: number,
    event: string,
    index: number,
    effect: string,
    at: number,
  ): SampleCue[] =>
    data.effects[effect].flatMap((row, i) =>
      !row.Sound
        ? []
        : [
            {
              key: `${prefix}:${id}:${event}:${index}:${i}`,
              sample: sample(row.Sound),
              at: at + n(row, 'SoundDelay') / 1000,
              volume: n(row, 'Volume') / 100,
              pitch:
                mix(n(row, 'MinPitch'), n(row, 'MaxPitch'), visualRandom(id, index, 50000 + i)) /
                100,
            },
          ],
    );
  const poses = (
    id: number,
    event: string,
    index: number,
    effect: string,
    at: number,
    elapsed: number,
    ground: Point,
    reduced: boolean,
  ): NativeParticlePose[] => {
    const result: NativeParticlePose[] = [];
    const rows = data.effects[effect];
    for (const [emitterIndex, effectRow] of rows.entries()) {
      const name = effectRow.ParticleEmitter;
      if (!name) continue;
      const emitter = data.particles[name],
        row = emitter[0],
        count = n(row, 'ParticleCount');
      const age = elapsed - at - n(effectRow, 'EmitterDelayMs') / 1000;
      if (age < 0 || age >= (n(row, 'EmissionTime') + n(row, 'MaxLife')) / 1000) continue;
      for (let i = 0; i < count; i++) {
        const pose = particle(
          `${prefix}:${id}:${event}:${index}:${emitterIndex}:${i}`,
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
  };
  return { cues, poses, particle, emitters: data.particles };
}

export const LATE_GOBLIN_EFFECTS = raw.effects as Record<string, Row[]>;
export const LATE_GOBLIN_SOUNDS = raw.sounds;
export const lateGoblinSample = (path: string) =>
  `late-goblin-${path.split('/').at(-1)!.replace('.ogg', '')}`;
export const LATE_GOBLIN_EFFECT_PLAYER = nativeEffectPlayer(
  LATE_GOBLIN_GRAPH,
  raw as { effects: Record<string, Row[]>; particles: Record<string, Row[]> },
  lateGoblinSample,
  'late-goblin',
  { reducedEmitters: ['bomb_tower_area_edge'] },
);

/** Continuous Bomb Tower Ammo1 trail births stay where they were emitted after the bomb lands. */
export function goblinBombTrailPoses(
  shot: Pick<LateProjectile, 'fromX' | 'fromY' | 'x' | 'y' | 'launched' | 'impact'> & {
    sourceId: number;
    index: number;
  },
  elapsed: number,
  iso: (x: number, y: number) => Point,
): NativeParticlePose[] {
  const rows = LATE_GOBLIN_EFFECT_PLAYER.emitters.mortar_trail,
    row = rows[0];
  const life = Math.max(n(row, 'MinLife'), n(row, 'MaxLife')) / 1000;
  if (elapsed < shot.launched || elapsed >= shot.impact + life) return [];
  const interval = n(row, 'EmissionTime') / 1000 / n(row, 'ParticleCount');
  const from = iso(shot.fromX, shot.fromY),
    to = iso(shot.x, shot.y);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const result: NativeParticlePose[] = [];
  // Births older than the longest particle life are gone: start at the first live one.
  for (
    let i = Math.max(0, Math.ceil((elapsed - life - shot.launched) / interval - 1e-9));
    shot.launched + i * interval < Math.min(elapsed + 1e-9, shot.impact);
    i++
  ) {
    const at = shot.launched + i * interval,
      point = goblinBombFlightPoint(shot, at, iso);
    const pose = LATE_GOBLIN_EFFECT_PLAYER.particle(
      `late-goblin:${shot.sourceId}:trail:${shot.index}:${i}`,
      'mortar_trail',
      rows,
      elapsed - at,
      point,
      (slot) => visualRandom(shot.sourceId, shot.index, 200000 + i * 10 + slot),
      'Top',
      false,
      angle,
    );
    if (pose) result.push(pose);
  }
  return result;
}
