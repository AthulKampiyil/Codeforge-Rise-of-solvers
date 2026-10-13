import source from '../../reference/inferno/native.json' with { type: 'json' };
import type { Battle } from './model';
import { visualRandom } from './visual-random';

export const INFERNO_TRANSITION_SHAKE = (['Dark Tower Up 2', 'Dark Tower Up 3'] as const).map(
  (name) => {
    const row = source.effects[name][0];
    return {
      strength: Number(row.CameraShake),
      duration: Number(row.CameraShakeTimeMS) / 1000,
      replay: row.CameraShakeInReplay === 'TRUE',
    };
  },
);

/** Source strength and duration; the 30 Hz waveform and screen conversion are local. */
export function infernoShake(battle: Battle | null, reduced: boolean, replay = false) {
  const offset = { x: 0, y: 0 };
  if (!battle?.started || battle.finished || reduced) return offset;
  let limit = 0;
  for (const [id, state] of Object.entries(battle.infernos ?? {}).sort(
    ([a], [b]) => Number(a) - Number(b),
  )) {
    for (const event of state.transitions ?? []) {
      const profile = INFERNO_TRANSITION_SHAKE[event.stage - 1];
      const age = battle.elapsed - event.at;
      if (age <= 0 || age >= profile.duration - 1e-9 || (replay && !profile.replay)) continue;
      const amplitude = profile.strength * 0.32;
      limit = Math.max(limit, amplitude);
      const tick = Math.round((event.at * 1000) / 64);
      const phase = age * 30,
        frame = Math.floor(phase),
        t = phase - frame;
      const smooth = t * t * (3 - 2 * t);
      for (const [axis, key] of (['x', 'y'] as const).entries()) {
        const knot = (f: number) =>
          f === 0
            ? 0
            : visualRandom(Number(id), tick, 4000000 + event.slot * 1000 + f * 2 + axis) * 2 - 1;
        offset[key] +=
          (knot(frame) * (1 - smooth) + knot(frame + 1) * smooth) *
          amplitude *
          (1 - age / profile.duration);
      }
    }
  }
  offset.x = Math.max(-limit, Math.min(limit, offset.x));
  offset.y = Math.max(-limit, Math.min(limit, offset.y));
  return offset;
}
