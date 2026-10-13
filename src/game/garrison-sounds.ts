import source from '../../reference/garrison/sounds.json' with { type: 'json' };
import type { Battle } from './model';
import { cueAudible, type SampleCue } from './sample-audio';
import { garrisonStats } from './garrison-reserve';

export const GARRISON_SOUNDS = source.sounds;
export const garrisonSample = (path: string) => `garrison-${path.split('/').at(-1)}`;
/** Stable local pitch selection within each original effect's range, including after seeks. */
function fraction(key: string) {
  let seed = 2166136261;
  for (const c of key) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
  return (seed >>> 0) / 0xffffffff;
}
/** Longest source SoundDelay (seconds): an event this much past the horizon is inaudible. */
const MAX_DELAY = Math.max(
  0,
  ...Object.values(source.effects).flatMap((rows) =>
    (rows as Record<string, string>[]).map((row) => Number(row.SoundDelay) / 1000 || 0),
  ),
);
export function garrisonSoundCues(battle: Battle | null): SampleCue[] {
  const cues: SampleCue[] = [];
  const elapsed = battle?.elapsed ?? 0;
  // Called every frame over each defender's whole attack history: skip old events before any
  // key string, pitch hash or cue object is built.
  const audible = (at: number) => cueAudible(at + MAX_DELAY, elapsed);
  const effect = (name: string, key: string, at: number) => {
    const rows = source.effects[name as keyof typeof source.effects] as Record<string, string>[];
    for (const [index, row] of rows.entries()) {
      if (!row.Sound) continue;
      const id = `${key}:${index}`;
      const min = Number(row.MinPitch),
        max = Number(row.MaxPitch);
      cues.push({
        key: id,
        sample: garrisonSample(row.Sound),
        at: at + Number(row.SoundDelay) / 1000,
        volume: Number(row.Volume) / 100,
        pitch: (min + (max - min) * fraction(id)) / 100,
      });
    }
  };
  for (const defender of battle?.defenders ?? []) {
    if (
      defender.kind === 'skeleton' ||
      defender.kind === 'guardian' ||
      defender.kind === 'repairer' ||
      defender.kind === 'hero'
    )
      continue;
    // Dragon levels share the Dragon effect rows; later families' original sounds are pending.
    const binding = (
      source.bindings as Partial<Record<string, (typeof source.bindings)['dragon']>>
    )[defender.kind];
    if (!binding) continue;
    const key = `garrison:${defender.id}`;
    if (audible(defender.spawnedAt)) effect(binding.deploy, `${key}:deploy`, defender.spawnedAt);
    for (const [index, attack] of defender.attacks.entries()) {
      if (!audible(attack.at)) continue;
      // Stable attack ordinal, not the array index: pruning must not rekey cues.
      const ordinal = attack.n ?? index;
      effect(binding.attack, `${key}:attack:${ordinal}`, attack.at);
      effect(binding.hit, `${key}:hit:${ordinal}`, attack.at);
    }
    if (defender.defeatedAt !== undefined) {
      if (audible(defender.defeatedAt)) effect(binding.die, `${key}:die`, defender.defeatedAt);
      if (defender.kind === 'balloon' && defender.deathResolved) {
        const at = defender.defeatedAt + garrisonStats(defender.kind, defender.level).deathDelay;
        if (audible(at)) effect(source.bindings.balloon.deathDamage, `${key}:death-damage`, at);
      }
    }
  }
  return cues;
}
