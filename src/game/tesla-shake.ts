import raw from '../../reference/tesla/effects.json' with { type: 'json' };
import type { Battle } from './model';
import { teslaVariation } from './tesla-attack';

const row = raw.effects['Tesla Appear'][0];
export const TESLA_REVEAL_SHAKE = {
  strength: Number(row.CameraShake),
  duration: Number(row.CameraShakeTimeMS) / 1000,
  replay: row.CameraShakeInReplay === 'TRUE',
};

/** Source timing/strength; local waveform and world-unit conversion, not native engine evidence. */
export function teslaRevealShake(
  battle: Pick<Battle, 'elapsed' | 'started' | 'finished' | 'revealedTeslas'> | null,
  reduced: boolean,
  replay = false,
): { x: number; y: number } {
  const offset = { x: 0, y: 0 };
  const { strength, duration } = TESLA_REVEAL_SHAKE;
  if (!battle?.started || battle.finished || reduced || (replay && !TESLA_REVEAL_SHAKE.replay))
    return offset;
  const amplitude = strength * 0.32;
  for (const [id, at] of Object.entries(battle.revealedTeslas ?? {}).sort(
    ([a], [b]) => Number(a) - Number(b),
  )) {
    const age = battle.elapsed - at;
    if (age <= 0 || age >= duration - 1e-9) continue;
    // Interpolate independent 30 Hz knots, starting at rest and tapering to rest.
    // Sampling is pure: it never advances the combat RNG or accumulates camera drift.
    const phase = age * 30,
      frame = Math.floor(phase),
      t = phase - frame,
      smooth = t * t * (3 - 2 * t);
    for (const [axis, key] of (['x', 'y'] as const).entries()) {
      const knot = (f: number) =>
        f === 0 ? 0 : teslaVariation(Number(id), 0, 10000 + f * 2 + axis) * 2 - 1;
      offset[key] +=
        (knot(frame) * (1 - smooth) + knot(frame + 1) * smooth) * amplitude * (1 - age / duration);
    }
  }
  // A mass reveal remains bounded even when several independent impulses coincide.
  offset.x = Math.max(-amplitude, Math.min(amplitude, offset.x));
  offset.y = Math.max(-amplitude, Math.min(amplitude, offset.y));
  return offset;
}
