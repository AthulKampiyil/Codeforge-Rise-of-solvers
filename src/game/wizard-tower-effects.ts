import raw from '../../reference/wizard-tower/effects.json' with { type: 'json' };
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import { WIZARD_TOWER_ART } from './wizard-tower-art';
import {
  wizardTowerGraph,
  wizardEffectGraph,
  wizardFlightPoint,
  wizardProjectileRow,
} from './wizard-tower-poses';
import { wizardTowerStats } from './wizard-tower-stats';
import type { WizardTowerShot } from './wizard-tower-attack';
import type { SampleCue } from './sample-audio';

type Row = Record<string, string>;
type Point = { x: number; y: number };
export type WizardTowerHandling = 'pickup' | 'place';
export const WIZARD_TOWER_EFFECTS = raw.effects as Record<string, Row[]>;
export const WIZARD_TOWER_EMITTERS = raw.particles as Record<string, Row[]>;
export const WIZARD_TOWER_SOUNDS = raw.sounds;
export type WizardTowerEffectPose = NativeParticlePose & {
  graph: 'wizardtower' | 'wizardtower-effects';
};
let built:
  | Record<'sc/buildings.sc' | 'sc/vfx_character.sc', ReturnType<typeof nativeParticleSampler>>
  | undefined;
/** Built on first use: the graphs arrive with the Wizard Tower art family. */
const samplers = () =>
  (built ??= {
    'sc/buildings.sc': nativeParticleSampler(wizardTowerGraph(), WIZARD_TOWER_ART.scale),
    'sc/vfx_character.sc': nativeParticleSampler(wizardEffectGraph(), WIZARD_TOWER_ART.scale),
  });
const n = (r: Row, key: string) => Number(r[key] ?? 0);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const handlingEffect = (kind: WizardTowerHandling) =>
  kind === 'pickup' ? 'Wizard Tower Pickup' : 'Wizard Tower Placing';
export const wizardTowerSample = (path: string) =>
  `wizardtower-${path.split('/').at(-1)!.replace('.ogg', '')}`;
export const wizardTowerHitEffect = (level: number) => wizardTowerStats(level).hitEffect;
export const wizardTowerAttackEffect = (level: number) => wizardTowerStats(level).attackEffect;

export function wizardTowerSoundCues(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
): SampleCue[] {
  return WIZARD_TOWER_EFFECTS[effect].flatMap((row, i) =>
    !row.Sound
      ? []
      : [
          {
            key: `wizardtower:${id}:${event}:${index}:${i}`,
            sample: wizardTowerSample(row.Sound),
            at: at + n(row, 'SoundDelay') / 1000,
            volume: n(row, 'Volume') / 100,
            pitch:
              mix(n(row, 'MinPitch'), n(row, 'MaxPitch'), visualRandom(id, index, 50000 + i)) / 100,
          },
        ],
  );
}
function sample(
  key: string,
  name: string,
  age: number,
  ground: Point,
  random: (slot: number) => number,
  layer: string,
  reduced: boolean,
): WizardTowerEffectPose | undefined {
  const rows = WIZARD_TOWER_EMITTERS[name],
    swf = rows[0].ParticleSwf as keyof ReturnType<typeof samplers>;
  const sampler = samplers()[swf];
  if (!sampler) throw Error(`Unsupported original Wizard Tower particle source: ${swf}`);
  const pose = sampler(key, name, rows, age, ground, random, layer, reduced);
  return pose
    ? { ...pose, graph: swf === 'sc/buildings.sc' ? 'wizardtower' : 'wizardtower-effects' }
    : undefined;
}
export function wizardTowerEffectPoses(
  id: number,
  event: string,
  index: number,
  effect: string,
  at: number,
  elapsed: number,
  ground: Point,
  reduced: boolean,
): WizardTowerEffectPose[] {
  const result: WizardTowerEffectPose[] = [],
    effectRows = WIZARD_TOWER_EFFECTS[effect];
  for (const [emitterIndex, effectRow] of effectRows.entries()) {
    const name = effectRow.ParticleEmitter;
    if (!name) continue;
    const row = WIZARD_TOWER_EMITTERS[name][0],
      count = n(row, 'ParticleCount');
    const age = elapsed - at - n(effectRow, 'EmitterDelayMs') / 1000;
    if (age < 0 || age >= (n(row, 'EmissionTime') + n(row, 'MaxLife')) / 1000) continue;
    const offsetZ =
      Number(effectRow.OffsetZ ?? effectRows[0].OffsetZ ?? 0) * WIZARD_TOWER_ART.altitudeScale;
    const point = { x: ground.x, y: ground.y - offsetZ };
    for (let i = 0; i < count; i++) {
      const pose = sample(
        `${id}:${event}:${index}:${emitterIndex}:${i}`,
        name,
        age - ((n(row, 'EmissionTime') / 1000) * i) / count,
        point,
        (slot) => visualRandom(id, index, 1000000 + emitterIndex * 1000 + i * 16 + slot),
        effectRows[0].IsoLayer,
        reduced,
      );
      if (pose) {
        pose.depth += offsetZ;
        result.push(pose);
      }
    }
  }
  return result;
}
export const wizardTowerHandlingCues = (
  id: number,
  index: number,
  kind: WizardTowerHandling,
  at: number,
) => wizardTowerSoundCues(id, `home-${kind}`, index, handlingEffect(kind), at);
export const wizardTowerHandlingPoses = (
  id: number,
  index: number,
  kind: WizardTowerHandling,
  at: number,
  elapsed: number,
  ground: Point,
  reduced: boolean,
) =>
  wizardTowerEffectPoses(
    id,
    `home-${kind}`,
    index,
    handlingEffect(kind),
    at,
    elapsed,
    ground,
    reduced,
  );

/** Only sample births still alive; each stays at its original point after impact. */
export function wizardTowerTrailPoses(
  id: number,
  level: number,
  shot: WizardTowerShot,
  elapsed: number,
  iso: (x: number, y: number) => Point,
  airLift: number,
): WizardTowerEffectPose[] {
  const name = wizardProjectileRow(level).ParticleEmitter,
    row = WIZARD_TOWER_EMITTERS[name][0];
  const life = n(row, 'MaxLife') / 1000;
  if (elapsed < shot.at || elapsed >= shot.impact + life) return [];
  const interval = n(row, 'EmissionTime') / 1000 / n(row, 'ParticleCount');
  const projectile = { ...shot, launched: shot.at },
    result: WizardTowerEffectPose[] = [];
  for (
    let i = Math.max(0, Math.ceil((elapsed - life - shot.at) / interval));
    shot.at + i * interval < Math.min(elapsed + 1e-9, shot.impact);
    i++
  ) {
    const at = shot.at + i * interval,
      point = wizardFlightPoint(level, projectile, at, iso, airLift);
    const pose = sample(
      `${id}:trail:${shot.index}:${i}`,
      name,
      elapsed - at,
      point,
      (slot) => visualRandom(id, shot.index, 200000 + i * 16 + slot),
      'Top',
      false,
    );
    if (pose) result.push(pose);
  }
  return result;
}
