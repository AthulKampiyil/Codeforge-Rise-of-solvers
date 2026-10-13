import type { Battle } from './model';
import { archerTowerSource } from './archer-tower-art';
import { visualRandom } from './visual-random';
import source from '../../reference/archer-tower/sounds.json' with { type: 'json' };
import { cueAudible, type SampleCue } from './sample-audio';
export const ARCHER_TOWER_SOUNDS = source.sounds;
export const archerTowerSample = (path: string) => `archer-tower-${path.split('/').at(-1)}`;
export interface ArcherTowerHandlingEvent {
  id: number;
  index: number;
  kind: 'pickup' | 'place';
  at: number;
  x: number;
  y: number;
}
export function archerTowerHandlingCues(events: readonly ArcherTowerHandlingEvent[]): SampleCue[] {
  return events.map((event) => {
    const row =
      source.effects[event.kind === 'pickup' ? 'Tower Turret Pickup' : 'Tower Turret Placing'][0];
    if (!row.Sound) throw new Error('Missing original Archer Tower handling sound');
    return {
      key: `archer-tower:handling:${event.id}:${event.index}`,
      sample: archerTowerSample(row.Sound),
      at: event.at + Number(row.SoundDelay) / 1000,
      volume: Number(row.Volume) / 100,
      pitch: Number(row.MinPitch) / 100,
    };
  });
}

/**
 * Local deterministic selection among source variants; never consumes combat randomness.
 * `elapsed` is the presentation clock: when given, cues keep playing out after the finish.
 */
export function archerTowerReleaseCues(battle?: Battle | null, elapsed?: number): SampleCue[] {
  if (!battle?.nativeArcherTowers || (battle.finished && elapsed === undefined)) return [];
  const now = elapsed ?? battle.elapsed;
  return (battle.archerTowerReleases ?? []).flatMap((shot) => {
    if (now - shot.at >= 2) return [];
    const effect = archerTowerSource(shot.level).AttackEffect;
    const rows = (source.effects as unknown as Record<string, Record<string, string>[]>)[effect];
    const variants = rows.filter((row) => row.Sound);
    const seed = Math.round(shot.at * 1000000);
    const row = variants[Math.floor(visualRandom(shot.id, seed, 6100000) * variants.length)];
    const inherited = { ...rows[0], ...row };
    return [
      {
        key: `archer-tower:release:${shot.id}:${shot.at}`,
        sample: archerTowerSample(inherited.Sound),
        at: shot.at + Number(inherited.SoundDelay) / 1000,
        volume: Number(inherited.Volume) / 100,
        pitch:
          (Number(inherited.MinPitch) +
            (Number(inherited.MaxPitch) - Number(inherited.MinPitch)) *
              visualRandom(shot.id, seed, 6100001)) /
          100,
      },
    ];
  });
}

export function archerTowerHitCues(battle?: Battle | null, elapsed?: number): SampleCue[] {
  if (!battle?.nativeArcherTowers || (battle.finished && elapsed === undefined)) return [];
  const now = elapsed ?? battle.elapsed;
  return (battle.archerTowerHits ?? []).flatMap((hit) => {
    if (now - hit.at >= 2) return [];
    const effect = archerTowerSource(hit.level).HitEffect;
    const row = (source.effects as unknown as Record<string, Record<string, string>[]>)[effect][0];
    return [
      {
        key: `archer-tower:hit:${hit.id}`,
        sample: archerTowerSample(row.Sound),
        at: hit.at + Number(row.SoundDelay) / 1000,
        volume: Number(row.Volume) / 100,
        pitch:
          (Number(row.MinPitch) +
            (Number(row.MaxPitch) - Number(row.MinPitch)) *
              visualRandom(hit.sourceId, Math.round(hit.at * 1000000), 6200000)) /
          100,
      },
    ];
  });
}

export function archerTowerDestructionCues(battle?: Battle | null, elapsed?: number): SampleCue[] {
  if (!battle?.nativeArcherTowers || (battle.finished && elapsed === undefined)) return [];
  const now = elapsed ?? battle.elapsed;
  return Object.entries(battle.archerTowerDestructions ?? {}).flatMap(([id, event]) => {
    if (!cueAudible(event.at, now)) return [];
    const row = source.effects['Building Destroyed'][0];
    if (!row.Sound) throw new Error('Missing original Archer Tower destruction sound');
    return {
      key: `archer-tower:destroy:${id}`,
      sample: archerTowerSample(row.Sound),
      at: event.at + Number(row.SoundDelay) / 1000,
      volume: Number(row.Volume) / 100,
      pitch:
        (Number(row.MinPitch) +
          (Number(row.MaxPitch) - Number(row.MinPitch)) * visualRandom(Number(id), 0, 6400000)) /
        100,
    };
  });
}
