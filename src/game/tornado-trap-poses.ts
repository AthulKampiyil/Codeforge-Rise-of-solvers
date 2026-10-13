import graph from '../../reference/tornado-trap/runtime.json' with { type: 'json' };
import vfxGraph from '../../reference/tornado-trap/vfx-runtime.json' with { type: 'json' };
import effects from '../../reference/tornado-trap/effects.json' with { type: 'json' };
import { nativeScenePoses, type NativeMatrix, type NativeMeshGraph } from './native-mesh';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import type { SampleCue } from './sample-audio';
import { TORNADO_TRAP_ART, tornadoTrapTier } from './tornado-trap-art';
import type { TornadoVortex } from './tornado-trap';
import { visualRandom } from './visual-random';

type Row = Record<string, string>;
export const TORNADO_GRAPH = graph as unknown as NativeMeshGraph;
export const TORNADO_VFX_GRAPH = vfxGraph as unknown as NativeMeshGraph;
export const TORNADO_EFFECTS = effects.effects as Record<string, Row[]>;
export const TORNADO_EMITTERS = effects.particles as Record<string, Row[]>;
export const TORNADO_SOUNDS = effects.sounds;
export const tornadoSample = (path: string) => `tornado-${path.split('/').at(-1)}`;
export const TORNADO_APPEAR = 'Shrink Trap Appear';
export const TORNADO_DEPLOY = 'ps_trap_tornadoTrap';
/** Depths below every y-sorted object; the pulled troops and buildings draw above them. */
export const TORNADO_DEPTH = {
  shadow: -870,
  whirl: -869.6,
  wind: -869.4,
  model: -869.2,
  top: 8000,
};

const { scale, anchorX, anchorY } = TORNADO_TRAP_ART;
const bodyRoot: NativeMatrix = [scale, 0, -anchorX * scale, 0, scale, -anchorY * scale];
const TRIGGER_FPS = 24;
/** The triggered clip's `Attack` label; frames before it are the `Init` reveal. */
const ATTACK_FRAME = 9;
const clipLength = (name: string) =>
  TORNADO_GRAPH.clips[TORNADO_GRAPH.exports[name]].timeline.length;
const worldSample = nativeParticleSampler(TORNADO_GRAPH, scale);
const vfxSample = nativeParticleSampler(TORNADO_VFX_GRAPH, scale, {
  reducedEmitters: ['e_trap_TornadoTrap_Wind'],
  staticEmitters: { e_trap_TornadoTrap_Wind: 0 },
});

/** Loop index for idle source bodies; the battle clock keeps replay seeks exact. */
const loop = (name: string, elapsed: number) =>
  (Math.floor(Math.max(0, elapsed) * TRIGGER_FPS + 1e-9) % clipLength(name)) / TRIGGER_FPS;

export interface TornadoBodyPose {
  export: string;
  poses: ReturnType<typeof nativeScenePoses>;
  /** Triggered whirls lie on the ground; setup and spent boxes sort with buildings. */
  ground: boolean;
}
/**
 * The body export and its quantized source time (a 24 fps frame): equal results sample identical
 * art, so the scene re-renders only when the source frame changes.
 */
export function tornadoBodyFrame(
  level: number,
  vortex: TornadoVortex | undefined,
  elapsed: number,
  reduced = false,
  finished = false,
): Omit<TornadoBodyPose, 'poses'> & { time: number } {
  const tier = tornadoTrapTier(level);
  if (!vortex) {
    const name = `tornado_trap_setup_lvl${tier}`;
    return { export: name, time: reduced ? 0 : loop(name, elapsed), ground: false };
  }
  const age = elapsed - vortex.activatedAt;
  if (!finished && !reduced && age >= 0 && elapsed < vortex.endAt) {
    const name = `tornado_trap_lvl${tier}`,
      length = clipLength(name);
    let frame = Math.floor(age * TRIGGER_FPS + 1e-9);
    if (frame >= ATTACK_FRAME)
      frame = ATTACK_FRAME + ((frame - ATTACK_FRAME) % (length - ATTACK_FRAME));
    return { export: name, time: frame / TRIGGER_FPS, ground: true };
  }
  const name = `tornado_trap_unarmed_lvl${tier}`;
  return { export: name, time: reduced ? 0 : loop(name, elapsed), ground: false };
}
export function tornadoBodyPose(
  level: number,
  vortex: TornadoVortex | undefined,
  elapsed: number,
  reduced = false,
  finished = false,
): TornadoBodyPose {
  const frame = tornadoBodyFrame(level, vortex, elapsed, reduced, finished);
  return {
    export: frame.export,
    poses: nativeScenePoses(TORNADO_GRAPH, frame.export, frame.time, {}, bodyRoot),
    ground: frame.ground,
  };
}

/** Particle depth: source Top rows overlay everything; ground effects and iso rows stay flat. */
function depth(emitter: string, row: Row, pose: NativeParticlePose) {
  if (row.IsoLayer === 'Top') return TORNADO_DEPTH.top;
  if (emitter === 'e_trap_TornadoTrap_Shadow') return TORNADO_DEPTH.shadow;
  if (emitter === 'e_trap_TornadoTrap_Model') return TORNADO_DEPTH.model;
  if (emitter === 'Grass') return pose.depth;
  return TORNADO_DEPTH.wind;
}

export function tornadoEffectPoses(
  vortex: TornadoVortex,
  elapsed: number,
  point: { x: number; y: number },
  reduced = false,
): NativeParticlePose[] {
  const result: NativeParticlePose[] = [];
  const id = vortex.trapId,
    appearAge = elapsed - vortex.activatedAt;
  const reveal = TORNADO_GRAPH.clips[TORNADO_GRAPH.exports.gen_appear_fx];
  if (!reduced && appearAge >= 0 && appearAge < reveal.timeline.length / reveal.fps)
    result.push({
      key: `${id}:appear`,
      emitter: 'gen_appear_fx',
      ...point,
      depth: point.y + 0.1,
      poses: nativeScenePoses(TORNADO_GRAPH, 'gen_appear_fx', appearAge, {}, [
        scale,
        0,
        0,
        0,
        scale,
        0,
      ]),
    });
  for (const [event, effect, at, sample] of [
    ['appear', TORNADO_APPEAR, vortex.activatedAt, worldSample],
    ['deploy', TORNADO_DEPLOY, vortex.castAt, vfxSample],
  ] as const) {
    const rows = TORNADO_EFFECTS[effect];
    for (const [emitterIndex, row] of rows.entries()) {
      const name = row.ParticleEmitter;
      if (!name) continue;
      const particles = TORNADO_EMITTERS[name],
        first = particles[0];
      const age = elapsed - at - Number(row.EmitterDelayMs ?? 0) / 1000;
      if (age < 0 || age >= (Number(first.EmissionTime) + Number(first.MaxLife)) / 1000) continue;
      const count = Number(first.ParticleCount);
      for (let i = 0; i < count; i++) {
        const pose = sample(
          `${id}:${event}:${emitterIndex}:${i}`,
          name,
          particles,
          age - ((Number(first.EmissionTime) / 1000) * i) / count,
          point,
          (slot) =>
            visualRandom(id, event === 'deploy' ? 1 : 0, emitterIndex * 1000 + i * 16 + slot),
          row.IsoLayer ?? rows[0].IsoLayer,
          reduced,
        );
        if (pose) result.push({ ...pose, depth: depth(name, first, pose) });
      }
    }
  }
  return result;
}

export function tornadoSoundCues(vortex: TornadoVortex): SampleCue[] {
  return [
    [TORNADO_APPEAR, vortex.activatedAt, 'appear'],
    [TORNADO_DEPLOY, vortex.castAt, 'deploy'],
  ].flatMap(([effect, at, event]) =>
    TORNADO_EFFECTS[effect as string].flatMap((row, i) =>
      row.Sound
        ? [
            {
              key: `tornado:${vortex.trapId}:${event}:${i}`,
              sample: tornadoSample(row.Sound),
              at: (at as number) + Number(row.SoundDelay ?? 0) / 1000,
              volume: Number(row.Volume) / 100,
              // Source pitch range; a stable visual draw keeps seeks and replays identical.
              pitch:
                (Number(row.MinPitch) +
                  (Number(row.MaxPitch) - Number(row.MinPitch)) *
                    visualRandom(vortex.trapId, 2, i)) /
                100,
            },
          ]
        : [],
    ),
  );
}
