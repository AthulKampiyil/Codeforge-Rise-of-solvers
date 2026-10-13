import source from '../../reference/inferno/native.json' with { type: 'json' };
import { infernoGraph } from './inferno-graph';
import { nativeScenePoses, type NativeMatrix } from './native-mesh';
import { infernoStats, type InfernoDamageStage } from './inferno-weapon';

export function infernoBeamProfile(level: number, stage: InfernoDamageStage) {
  infernoStats(level);
  const row = source.levels[level - 1] as Record<string, string>;
  const effectName = row[['AttackEffect', 'AttackEffectLv2', 'AttackEffectLv3'][stage]];
  const effect = (source.effects as Record<string, Record<string, string>[]>)[effectName][0];
  const emitter = (source.particles as Record<string, Record<string, string>[]>)[
    effect.ParticleEmitter
  ][0];
  return {
    export: emitter.ParticleExportName,
    startZ: Number(emitter.StartZ),
    fadeIn: Number(emitter.FadeInTime) / 1000,
    sound: effect.Sound,
    volume: Number(effect.Volume) / 100,
    pitch: Number(effect.MinPitch) / 100,
  };
}

/** Linear source-duration acquisition envelope; native easing is not yet verified. */
export function infernoBeamAlpha(level: number, stage: InfernoDamageStage, age: number) {
  if (!Number.isFinite(age)) throw new Error('Invalid Inferno beam age');
  const fadeIn = infernoBeamProfile(level, stage).fadeIn;
  return age <= 0 ? 0 : fadeIn > 0 ? Math.min(1, age / fadeIn) : 1;
}

/** Local endpoint mapping: the source beam artwork runs horizontally over ~48 units. */
export function infernoBeamPoses(
  level: number,
  stage: InfernoDamageStage,
  seconds: number,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const profile = infernoBeamProfile(level, stage);
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(length) || !Number.isFinite(seconds) || seconds < 0)
    throw new Error('Invalid Inferno beam geometry');
  if (length < 0.001) return [];
  const root: NativeMatrix = [
    dx / 48,
    (-dy / length) * 1.2,
    from.x,
    dy / 48,
    (dx / length) * 1.2,
    from.y,
  ];
  return nativeScenePoses(infernoGraph(), profile.export, seconds, {}, root);
}
