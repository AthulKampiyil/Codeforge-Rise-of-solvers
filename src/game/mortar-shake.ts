import { MORTAR_EFFECTS } from './mortar-effects';
import { mortarStats } from './mortar-stats';
import type { Battle } from './model';
import { visualRandom } from './visual-random';

/** Source strength, duration and replay flag; local screen projection and 30 Hz noise. */
export function mortarShake(battle: Battle | null, reduced: boolean, replay = false) {
  const offset = { x: 0, y: 0 };
  if (!battle?.started || battle.finished || reduced) return offset;
  let limit = 0;
  for (const [id, history] of Object.entries(battle.mortars ?? {}).sort(
    ([a], [b]) => Number(a) - Number(b),
  )) {
    for (const hit of history.hits) {
      const row = MORTAR_EFFECTS[mortarStats(hit.level).hitEffect][0];
      const duration = Number(row.CameraShakeTimeMS) / 1000;
      const age = battle.elapsed - hit.at;
      if (age <= 0 || age >= duration - 1e-9 || (replay && row.CameraShakeInReplay !== 'TRUE'))
        continue;
      const amplitude = Number(row.CameraShake) * 0.32;
      limit = Math.max(limit, amplitude);
      const phase = age * 30,
        frame = Math.floor(phase),
        t = phase - frame;
      const smooth = t * t * (3 - 2 * t);
      for (const [axis, key] of (['x', 'y'] as const).entries()) {
        const knot = (f: number) =>
          f === 0 ? 0 : visualRandom(Number(id), hit.index, 300000 + f * 2 + axis) * 2 - 1;
        offset[key] +=
          (knot(frame) * (1 - smooth) + knot(frame + 1) * smooth) *
          amplitude *
          (1 - age / duration);
      }
    }
  }
  offset.x = Math.max(-limit, Math.min(limit, offset.x));
  offset.y = Math.max(-limit, Math.min(limit, offset.y));
  return offset;
}
