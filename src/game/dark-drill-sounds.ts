import { visualRandom } from './visual-random';
import source from '../../reference/dark-drill/sounds.json' with { type: 'json' };
import type { SampleCue } from './sample-audio';
export const DARK_DRILL_SOUNDS = source.sounds;
export const darkDrillSample = (path: string) => `dark-drill-${path.split('/').at(-1)}`;
export interface DrillHandlingEvent {
  id: number;
  index: number;
  kind: 'pickup' | 'place';
  at: number;
  x: number;
  y: number;
}
export function darkDrillHandlingCues(events: readonly DrillHandlingEvent[]): SampleCue[] {
  return events.map((event) => {
    const row =
      source.effects[
        event.kind === 'pickup' ? 'Dark Elixir Drill Pickup' : 'Dark Elixir Drill Place'
      ][0];
    return {
      key: `dark-drill:handling:${event.id}:${event.index}`,
      sample: darkDrillSample(row.Sound),
      at: event.at + Number(row.SoundDelay) / 1000,
      volume: Number(row.Volume) / 100,
      pitch: Number(row.MinPitch) / 100,
    };
  });
}

export function darkDrillDestructionCues(
  history: import('./model').Battle['drillDestructions'],
): SampleCue[] {
  const row = source.effects['Building Destroyed'][0];
  if (!row.Sound) throw new Error('Missing original Drill destruction sound');
  const sample = darkDrillSample(row.Sound);
  return Object.entries(history ?? {}).map(([id, event]) => ({
    key: `dark-drill:destroy:${id}`,
    sample,
    at: event.at + Number(row.SoundDelay) / 1000,
    volume: Number(row.Volume) / 100,
    pitch:
      (Number(row.MinPitch) +
        visualRandom(Number(id), 0, 6000000) * (Number(row.MaxPitch) - Number(row.MinPitch))) /
      100,
  }));
}
