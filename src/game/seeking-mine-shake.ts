import { SEEKING_MINE_EFFECTS } from './seeking-mine-effects';
import type { Battle } from './model';
import { visualRandom } from './visual-random';
const row = SEEKING_MINE_EFFECTS['Large AirTrap Explosion'][0];
export const SEEKING_MINE_SHAKE = {
  strength: Number(row.CameraShake),
  duration: Number(row.CameraShakeTimeMS) / 1000,
  replay: row.CameraShakeInReplay === 'TRUE',
};
/** Local camera displacement for the source's 500 ms explosion impulse. */
export function seekingMineShake(battle: Battle | null, reduced: boolean, replay = false) {
  const offset = { x: 0, y: 0 },
    { strength, duration } = SEEKING_MINE_SHAKE,
    amplitude = strength * 0.32;
  if (!battle?.started || battle.finished || reduced || (replay && !SEEKING_MINE_SHAKE.replay))
    return offset;
  for (const [id, state] of Object.entries(battle.traps)) {
    if (!state.mine?.hit || state.mine.resolvedAt === undefined) continue;
    const age = battle.elapsed - state.mine.resolvedAt;
    if (age <= 0 || age >= duration - 1e-9) continue;
    const phase = age * 30,
      frame = Math.floor(phase),
      t = phase - frame,
      smooth = t * t * (3 - 2 * t);
    for (const [axis, key] of (['x', 'y'] as const).entries()) {
      const knot = (f: number) =>
        f === 0 ? 0 : visualRandom(Number(id), 0, 300000 + f * 2 + axis) * 2 - 1;
      offset[key] +=
        (knot(frame) * (1 - smooth) + knot(frame + 1) * smooth) * amplitude * (1 - age / duration);
    }
  }
  offset.x = Math.max(-amplitude, Math.min(amplitude, offset.x));
  offset.y = Math.max(-amplitude, Math.min(amplitude, offset.y));
  return offset;
}
