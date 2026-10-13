import graph from '../../reference/freeze-trap/runtime.json' with { type: 'json' };
import effects from '../../reference/freeze-trap/effects.json' with { type: 'json' };
import { FREEZE_TRAP_ART } from './freeze-trap-art';
import type { FreezeCast } from './freeze-trap';
import { nativeScenePoses, type NativeMatrix, type NativeMeshGraph } from './native-mesh';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import type { SampleCue } from './sample-audio';
import { visualRandom } from './visual-random';

type Row = Record<string, string>;
export const FREEZE_GRAPH = graph as unknown as NativeMeshGraph;
export const FREEZE_EFFECTS = effects.effects as Record<string, Row[]>;
export const FREEZE_EMITTERS = effects.particles as Record<string, Row[]>;
export const FREEZE_SOUNDS = effects.sounds;
export const freezeSample = (path: string) => `freeze-${path.split('/').at(-1)}`;
export const FREEZE_APPEAR = 'Bomb Appear';
export const FREEZE_DEPLOY = ['Freeze deploy lvl1', 'Freeze deploy2 lvl1'] as const;
export { FROZEN_TINT } from './freeze-trap-art';

const { scale, anchorX, anchorY } = FREEZE_TRAP_ART;
const bodyRoot: NativeMatrix = [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale];
const trigger = FREEZE_GRAPH.clips[FREEZE_GRAPH.exports.Freeze_trap_trigger];
export const FREEZE_TRIGGER_DURATION = trigger.timeline.length / trigger.fps;
const sample = nativeParticleSampler(FREEZE_GRAPH, scale, {
  reducedEmitters: ['Freeze_glow_blue_lvl1'],
  staticEmitters: { Freeze_glow_blue_lvl1: 0 },
});

/**
 * Source frame of the rising bottle, or -1 outside its trigger window (the body is static then).
 * Equal frames sample identical art.
 */
export function freezeTrapFrame(
  cast: FreezeCast | undefined,
  elapsed: number,
  reduced = false,
  finished = false,
) {
  const age = cast ? elapsed - cast.activatedAt : 0;
  return cast && !finished && !reduced && age >= 0 && age < FREEZE_TRIGGER_DURATION
    ? Math.floor(age * trigger.fps + 1e-9)
    : -1;
}
/** The compartment stays; the separate bottle rises through its 14 source frames. */
export function freezeTrapPoses(
  cast: FreezeCast | undefined,
  elapsed: number,
  reduced = false,
  finished = false,
) {
  const poses = nativeScenePoses(
    FREEZE_GRAPH,
    cast ? 'Freeze_trap_unarmed' : 'Freeze_trap_armed',
    0,
    {},
    bodyRoot,
  );
  const frame = freezeTrapFrame(cast, elapsed, reduced, finished);
  if (frame >= 0)
    poses.push(
      ...nativeScenePoses(FREEZE_GRAPH, 'Freeze_trap_trigger', frame / trigger.fps, {}, bodyRoot),
    );
  return poses;
}

export function freezeEffectPoses(
  cast: FreezeCast,
  elapsed: number,
  point: { x: number; y: number },
  reduced = false,
): NativeParticlePose[] {
  const result: NativeParticlePose[] = [];
  const id = cast.trapId,
    appearAge = elapsed - cast.activatedAt;
  const reveal = FREEZE_GRAPH.clips[FREEZE_GRAPH.exports.gen_appear_fx];
  if (!reduced && appearAge >= 0 && appearAge < reveal.timeline.length / reveal.fps)
    result.push({
      key: `${id}:appear`,
      emitter: 'gen_appear_fx',
      ...point,
      depth: point.y + 0.1,
      poses: nativeScenePoses(FREEZE_GRAPH, 'gen_appear_fx', appearAge, {}, [
        scale,
        0,
        0,
        0,
        scale,
        0,
      ]),
    });
  for (const [event, effect, at] of [
    ['appear', FREEZE_APPEAR, cast.activatedAt],
    ['deploy', FREEZE_DEPLOY[0], cast.castAt],
    ['deploy2', FREEZE_DEPLOY[1], cast.castAt],
  ] as const) {
    const rows = FREEZE_EFFECTS[effect];
    for (const [emitterIndex, row] of rows.entries()) {
      const name = row.ParticleEmitter;
      if (!name) continue;
      const particles = FREEZE_EMITTERS[name],
        first = particles[0];
      const age = elapsed - at - Number(row.EmitterDelayMs ?? 0) / 1000;
      if (age < 0 || age >= (Number(first.EmissionTime) + Number(first.MaxLife)) / 1000) continue;
      const count = Number(first.ParticleCount);
      const layer = row.IsoLayer ?? rows[0].IsoLayer;
      for (let i = 0; i < count; i++) {
        const pose = sample(
          `${id}:${event}:${emitterIndex}:${i}`,
          name,
          particles,
          age - ((Number(first.EmissionTime) / 1000) * i) / count,
          point,
          (slot) =>
            visualRandom(
              id,
              event === 'appear' ? 0 : event === 'deploy' ? 1 : 2,
              emitterIndex * 1000 + i * 16 + slot,
            ),
          layer,
          reduced,
        );
        // Effect-level Top rows (the second deploy effect) overlay troops.
        if (pose) result.push(layer === 'Top' ? { ...pose, depth: 8000 } : pose);
      }
    }
  }
  return result;
}

export function freezeSoundCues(cast: FreezeCast): SampleCue[] {
  return [
    [FREEZE_APPEAR, cast.activatedAt, 'appear'],
    [FREEZE_DEPLOY[0], cast.castAt, 'deploy'],
    [FREEZE_DEPLOY[1], cast.castAt, 'deploy2'],
  ].flatMap(([effect, at, event]) =>
    FREEZE_EFFECTS[effect as string].flatMap((row, i) =>
      row.Sound
        ? [
            {
              key: `freeze:${cast.trapId}:${event}:${i}`,
              sample: freezeSample(row.Sound),
              at: (at as number) + Number(row.SoundDelay ?? 0) / 1000,
              volume: Number(row.Volume) / 100,
              pitch:
                (Number(row.MinPitch) +
                  (Number(row.MaxPitch) - Number(row.MinPitch)) * visualRandom(cast.trapId, 3, i)) /
                100,
            },
          ]
        : [],
    ),
  );
}
