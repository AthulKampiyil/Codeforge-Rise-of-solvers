import { BOMB_TOWER_EFFECTS } from './bomb-tower-effects';
import type { Battle } from './model';
import { visualRandom } from './visual-random';
const row = BOMB_TOWER_EFFECTS['Bomb Tower Explode'][0];
export const BOMB_TOWER_SHAKE = {
  strength: Number(row.CameraShake),
  duration: Number(row.CameraShakeTimeMS) / 1000,
  replay: row.CameraShakeInReplay === 'TRUE',
};
/** One local impulse per resolved explosion; spawned ground effect shares that impulse. */
export function bombTowerShake(battle: Battle | null, reduced: boolean, replay = false) {
  const offset = { x: 0, y: 0 },
    { strength, duration } = BOMB_TOWER_SHAKE;
  if (!battle?.started || battle.finished || reduced || (replay && !BOMB_TOWER_SHAKE.replay))
    return offset;
  const amplitude = strength * 0.32;
  for (const bomb of Object.values(battle.deathBombs ?? {}).sort(
    (a, b) => a.sourceId - b.sourceId,
  )) {
    if (!bomb.resolved || bomb.cancelled) continue;
    const age = battle.elapsed - bomb.impact;
    if (age <= 0 || age >= duration - 1e-9) continue;
    const phase = age * 30,
      frame = Math.floor(phase),
      t = phase - frame,
      smooth = t * t * (3 - 2 * t);
    for (const [axis, key] of (['x', 'y'] as const).entries()) {
      const knot = (f: number) =>
        f === 0 ? 0 : visualRandom(bomb.sourceId, 0, 300000 + f * 2 + axis) * 2 - 1;
      offset[key] +=
        (knot(frame) * (1 - smooth) + knot(frame + 1) * smooth) * amplitude * (1 - age / duration);
    }
  }
  offset.x = Math.max(-amplitude, Math.min(amplitude, offset.x));
  offset.y = Math.max(-amplitude, Math.min(amplitude, offset.y));
  return offset;
}
