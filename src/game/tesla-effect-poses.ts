import raw from '../../reference/tesla/effects.json' with { type: 'json' };
import { nativeScenePoses, type NativeMatrix, type NativeScenePose } from './native-mesh';
import { teslaGraph } from './tesla-poses';
import { TESLA_ART } from './tesla-art';
import { teslaStats } from './tesla-stats';
import { teslaVariation, type TeslaShot } from './tesla-attack';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
export const TESLA_EFFECTS = raw.effects as Record<string, Row[]>;
export const TESLA_EMITTERS = raw.particles as Record<string, Row[]>;
type Point = { x: number; y: number };
export type TeslaHandling = 'pickup' | 'place';
const handlingEffect = (kind: TeslaHandling) =>
  kind === 'pickup' ? 'Tesla Pickup' : 'Tesla Placing';
export function teslaHandlingCue(
  id: number,
  index: number,
  kind: TeslaHandling,
  at: number,
): SampleCue {
  const row = TESLA_EFFECTS[handlingEffect(kind)][0];
  return {
    key: `tesla:home:${id}:${index}`,
    sample: teslaSample(row.Sound),
    at: at + n(row, 'SoundDelay') / 1000,
    volume: n(row, 'Volume') / 100,
    pitch: n(row, 'MinPitch') / 100,
  };
}
export interface TeslaEffectPose {
  key: string;
  role: 'arc' | 'coil' | 'hit' | 'grass';
  poses: NativeScenePose[];
  x: number;
  y: number;
  /** Grass sorts by its projected ground position while altitude lifts its artwork. */
  depth?: number;
}
const n = (row: Row, field: string) => Number(row[field] ?? 0);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const teslaSample = (path: string) => `tesla-${path.split('/').at(-1)!.replace('.ogg', '')}`;

/** Sound rows are treated as alternatives; native row selection/RNG is unverified. */
export function teslaAttackCues(id: number, level: number, shot: TeslaShot): SampleCue[] {
  return [teslaStats(level).attackEffect, 'Tesla Hit'].flatMap((name, group) => {
    const rows = TESLA_EFFECTS[name].filter((r) => r.Sound);
    if (!rows.length) return [];
    const row = rows[Math.floor(teslaVariation(id, shot.index, 9000 + group) * rows.length)];
    return [
      {
        key: `tesla:${id}:${group ? 'hit' : 'shot'}:${shot.index}`,
        sample: teslaSample(row.Sound),
        at: shot.at + n(row, 'SoundDelay') / 1000,
        volume: n(row, 'Volume') / 100,
        pitch:
          mix(
            n(row, 'MinPitch'),
            n(row, 'MaxPitch'),
            teslaVariation(id, shot.index, 9010 + group),
          ) / 100,
      },
    ];
  });
}

function particlePoses(
  name: string,
  age: number,
  life: number,
  row: Row,
  variant: Row,
  root: NativeMatrix,
): NativeScenePose[] {
  const clip = teslaGraph().clips[teslaGraph().exports[name]];
  // Scaled timelines span the complete nested clip (the arc wrapper is one frame).
  let frames = clip.timeline.length,
    fps = clip.fps;
  if (frames === 1 && clip.children.length === 1) {
    const child = teslaGraph().clips[clip.children[0]];
    if (child) {
      frames = child.timeline.length;
      fps = child.fps;
    }
  }
  const seconds = row.ScaleTimeline === 'TRUE' ? ((age / life) * frames) / fps : age;
  const fade = n(row, 'ParticleFadeOutTime') / 1000;
  const alpha = (n(row, 'Alpha') / 100) * (fade ? clamp((life - age) / fade) : 1);
  const poses = nativeScenePoses(teslaGraph(), name, seconds, {}, root);
  if (!poses.length || alpha <= 0) return [];
  if (variant.AdditiveBlend === 'TRUE') {
    if (poses.length === 1 && !('group' in poses[0]))
      return [
        {
          ...poses[0],
          blend: 8,
          multiply: [...poses[0].multiply.slice(0, 3), poses[0].multiply[3] * alpha],
        },
      ];
    return [
      {
        key: `${name}:particle`,
        group: poses,
        blend: 8,
        multiply: [1, 1, 1, alpha],
        add: [0, 0, 0, 0],
      },
    ];
  }
  return poses.map((p) => ({ ...p, multiply: [...p.multiply.slice(0, 3), p.multiply[3] * alpha] }));
}

/** Source art/counts/ranges, with a deterministic local emitter and world projection. */
export function teslaAttackPoses(
  id: number,
  level: number,
  shot: TeslaShot,
  elapsed: number,
  from: Point,
  target: Point,
  impact: Point,
  ground: Point = from,
): TeslaEffectPose[] {
  const config = teslaStats(level);
  const sources: [string, TeslaEffectPose['role']][] = [
    [config.attackEffect, 'arc'],
    ...(config.secondaryEffect ? [[config.secondaryEffect, 'coil'] as [string, 'coil']] : []),
    ['Tesla Hit', 'hit'],
  ];
  return effectPoses(id, shot, elapsed, sources, from, target, impact, ground);
}

/** Original emergence grass shares the attack emitter's deterministic source sampling. */
export function teslaRevealPoses(id: number, at: number, elapsed: number, ground: Point) {
  return effectPoses(
    id,
    { index: 0, at },
    elapsed,
    [['Tesla Appear', 'grass']],
    ground,
    ground,
    ground,
    ground,
  );
}

export function teslaHandlingPoses(
  id: number,
  index: number,
  kind: TeslaHandling,
  at: number,
  elapsed: number,
  ground: Point,
) {
  return effectPoses(
    id,
    { index, at },
    elapsed,
    [[handlingEffect(kind), 'grass']],
    ground,
    ground,
    ground,
    ground,
  );
}

function effectPoses(
  id: number,
  shot: Pick<TeslaShot, 'index' | 'at'>,
  elapsed: number,
  sources: [string, TeslaEffectPose['role']][],
  from: Point,
  target: Point,
  impact: Point,
  ground: Point,
): TeslaEffectPose[] {
  const age = elapsed - shot.at;
  if (age < 0 || age > 1) return [];
  const result: TeslaEffectPose[] = [];
  for (const [group, [effect, role]] of sources.entries()) {
    const emitters = TESLA_EFFECTS[effect].filter((r) => r.ParticleEmitter);
    for (const [emitter, effectRow] of emitters.entries()) {
      const rows = TESLA_EMITTERS[effectRow.ParticleEmitter],
        row = rows[0];
      const count = n(row, 'ParticleCount');
      for (let i = 0; i < count; i++) {
        const slot = group * 1000 + emitter * 100 + i * 10;
        const random = (offset: number) => teslaVariation(id, shot.index, slot + offset);
        const born =
          n(effectRow, 'EmitterDelayMs') / 1000 + ((n(row, 'EmissionTime') / 1000) * i) / count;
        const t = age - born;
        const life = mix(n(row, 'MinLife'), n(row, 'MaxLife'), random(0)) / 1000;
        if (t < 0 || t >= life) continue;
        const variant = rows[Math.floor(random(1) * rows.length)];
        const exportName = variant.ParticleExportName;
        const scale =
          ((mix(n(row, 'StartScale'), n(row, 'EndScale'), clamp(t / life)) / 100) *
            mix(n(row, 'ScaleRandomMin'), n(row, 'ScaleRandomMax'), random(2))) /
          100;
        let root: NativeMatrix, point: Point, depth: number | undefined;
        if (role === 'arc') {
          // The source arc occupies x=0..128. Stretch its longitudinal axis
          // between endpoints; the source frames provide the electrical shape.
          const dx = target.x - from.x,
            dy = target.y - from.y,
            length = Math.hypot(dx, dy);
          if (length < 1e-6) continue;
          const width = TESLA_ART.scale * scale;
          root = [dx / 128, (-dy / length) * width, 0, dy / 128, (dx / length) * width, 0];
          point = from;
        } else if (role === 'coil') {
          const s = TESLA_ART.scale * scale;
          root = [s, 0, 0, 0, s, 0];
          point = {
            x: ground.x + (n(row, 'StartX') - n(row, 'StartY')) * 0.32,
            y: ground.y + (n(row, 'StartX') + n(row, 'StartY')) * 0.16 - n(row, 'StartZ') * 0.8,
          };
        } else {
          // Local isometric projection: horizontal source units are 1/100 tile;
          // altitude is 0.8 screen units, shared with native projectile calibration.
          const angle =
            (mix(n(row, 'MinHorizAngle'), n(row, 'MaxHorizAngle'), random(3)) * Math.PI) / 180;
          const vertical =
            (mix(n(row, 'MinVertAngle'), n(row, 'MaxVertAngle'), random(4)) * Math.PI) / 180;
          const speed = mix(n(row, 'MinSpeed'), n(row, 'MaxSpeed'), random(5));
          const radius = mix(n(row, 'StartRadiusMin'), n(row, 'StartRadiusMax'), random(6));
          const radiusAngle = random(7) * Math.PI * 2;
          const distance = speed * Math.cos(vertical) * t;
          const x = n(row, 'StartX') + Math.cos(radiusAngle) * radius + Math.cos(angle) * distance;
          const y = n(row, 'StartY') + Math.sin(radiusAngle) * radius + Math.sin(angle) * distance;
          const gravity = n(row, 'Gravity'),
            vz = speed * Math.sin(vertical),
            z0 = n(row, 'StartZ');
          let z = z0 + vz * t - (gravity * t * t) / 2;
          if (row.BounceFromGround === 'TRUE' && z < 0 && gravity > 0) {
            // One damped bounce then settle; native collision restitution is not in the CSV.
            const hit = (vz + Math.sqrt(vz * vz + 2 * gravity * z0)) / gravity;
            const after = t - hit,
              rebound = (gravity * hit - vz) * 0.35;
            z = Math.max(0, rebound * after - (gravity * after * after) / 2);
          }
          const rotation =
            ((mix(n(row, 'StartAngleMin'), n(row, 'StartAngleMax'), random(8)) +
              mix(n(row, 'MinRotate'), n(row, 'MaxRotate'), random(9)) * t) *
              Math.PI) /
            180;
          const s = TESLA_ART.scale * scale,
            c = Math.cos(rotation) * s,
            sn = Math.sin(rotation) * s;
          root = [c, -sn, 0, sn, c, 0];
          point = { x: impact.x + (x - y) * 0.32, y: impact.y + (x + y) * 0.16 - z * 0.8 };
          if (role === 'grass') depth = impact.y + (x + y) * 0.16;
        }
        const poses = particlePoses(exportName, t, life, row, variant, root);
        if (poses.length)
          result.push({
            key: `${id}:${shot.index}:${group}:${emitter}:${i}`,
            role,
            poses,
            ...point,
            ...(depth === undefined ? {} : { depth }),
          });
      }
    }
  }
  return result;
}
