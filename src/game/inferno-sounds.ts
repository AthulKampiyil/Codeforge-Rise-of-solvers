import source from '../../reference/inferno/sounds.json' with { type: 'json' };
import { infernoBeamProfile } from './inferno-beam';
import { infernoDamageStage, infernoStats } from './inferno-weapon';
import { cueAudible, type SampleCue } from './sample-audio';
import { presentationLive, presentationTime } from './presentation-clock';
import { guardRender } from './render-guard';
import type { Battle } from './model';
import { battleUnit } from './battle-index';
export const INFERNO_SOUNDS = source.sounds;
export const infernoSample = (path: string) => `inferno-${path.split('/').at(-1)}`;

/** One local loop voice per tower, avoiding stacked identical multi-beam samples. */
export function infernoSoundCues(battle: Battle | null): SampleCue[] {
  // One-shot stage transitions ring out through the presentation grace; the beam loops stop
  // with the battle.
  if (!battle || !presentationLive(battle)) return [];
  const cues: SampleCue[] = [];
  const now = presentationTime(battle);
  for (const [id, state] of Object.entries(battle.infernos ?? {}))
    for (const event of state.transitions ?? []) {
      const effect = source.effects[event.stage === 1 ? 'Dark Tower Up 2' : 'Dark Tower Up 3'][0];
      const at = event.at + Number(effect.SoundDelay) / 1000;
      if (!cueAudible(at, now)) continue;
      cues.push({
        key: `inferno:${id}:transition:${event.at}:${event.slot}`,
        sample: infernoSample(effect.Sound),
        at,
        volume: Number(effect.Volume) / 100,
        pitch: Number(effect.MinPitch) / 100,
      });
    }
  if (battle.finished) return cues;
  for (const tower of battle.buildings) {
    if (
      tower.kind !== 'inferno' ||
      tower.hp <= 0 ||
      tower.constructing ||
      tower.upgradeEnd ||
      (battle.defenseStuns[tower.id] ?? 0) >= battle.elapsed
    )
      continue;
    const state = battle.infernos?.[tower.id];
    const slot = state?.scheduler.slots.find((slot) => {
      const unit = battleUnit(battle, slot.targetId);
      return !!unit && unit.hp > 0 && !unit.ejected;
    });
    if (!slot || !state) continue;
    // Called every frame from the scene: an unsupported level stays silent instead of throwing.
    const cue = guardRender(
      `inferno sound level ${tower.level}`,
      (): SampleCue => {
        const stage = infernoDamageStage(state.scheduler.mode, slot.lockedMs, tower.level);
        const profile = infernoBeamProfile(tower.level, stage);
        const acquiredTick = state.nextTick - 1 - slot.lockedMs / 64;
        const stageTicks = [
          0,
          ...infernoStats(tower.level).weapon.switchTimesMs.map((ms) => Math.ceil(ms / 64)),
        ];
        return {
          key: `inferno:${tower.id}:loop:${acquiredTick}:${stage}`,
          sample: infernoSample(profile.sound),
          at: (acquiredTick + stageTicks[stage]) * 0.064,
          volume: profile.volume,
          pitch: profile.pitch,
          loop: true,
        };
      },
      null,
    );
    if (cue) cues.push(cue);
  }
  return cues;
}
