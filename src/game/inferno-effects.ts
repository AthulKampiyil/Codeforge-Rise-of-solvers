import source from '../../reference/inferno/native.json' with { type: 'json' };
import { infernoGraph } from './inferno-graph';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import type { Battle } from './model';

type Row = Record<string, string>;
const effects = source.effects['Dark Tower Hit'] as Row[];
const emitters = Object.fromEntries(
  Object.entries(source.particles).map(([name, rows]) => [
    name,
    rows.map((row) => ({ ...rows[0], ...row }) as Row),
  ]),
);
let sampler: ReturnType<typeof nativeParticleSampler> | undefined;
/** Built on first use: the graph arrives with the Inferno art family. */
const particle: ReturnType<typeof nativeParticleSampler> = (...args) =>
  (sampler ??= nativeParticleSampler(infernoGraph(), 1.2))(...args);
const lifetime = (effect: Row) => {
  const row = emitters[effect.ParticleEmitter][0];
  return (
    Number(effect.EmitterDelayMs ?? 0) / 1000 +
    Number(row.EmissionTime) / 1000 +
    Number(row.MaxLife) / 1000
  );
};
/** Seconds after which a hit's emitters are all past their last particle. */
const finite = (value: number) => (Number.isFinite(value) ? value : Infinity);
const hitHorizon = finite(Math.max(...effects.map(lifetime)));
/** Upper bound for the stage transition emitters (their emission plus longest life). */
const transitionHorizon = finite(
  Math.max(
    ...['DarkRay Up2', 'DarkRay Up3'].flatMap((name) =>
      emitters[name].map((row) => (Number(row.EmissionTime || 0) + Number(row.MaxLife)) / 1000),
    ),
  ),
);

/**
 * Detached source hit emitters, seeded by immutable pulse tick and beam slot.
 *
 * `elapsed` is the presentation clock (see presentation-clock.ts): given, bursts keep sampling
 * after the finish and the caller decides when the grace window ends. Omitted, it is
 * `battle.elapsed` and a finished battle shows nothing.
 */
export function infernoImpactPoses(
  battle: Battle | null,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
  elapsed?: number,
): NativeParticlePose[] {
  if (!battle || reduced || (elapsed === undefined && battle.finished)) return [];
  const now = elapsed ?? battle.elapsed;
  const result: NativeParticlePose[] = [];
  for (const [id, state] of Object.entries(battle.infernos ?? {}))
    for (const hit of state.hits) {
      if (hit.at > now || now - hit.at > hitHorizon) continue;
      const tick = Math.round((hit.at * 1000) / 64);
      const point = iso(hit.targetX, hit.targetY);
      const origin = { x: point.x, y: point.y - (hit.toAir ? 46 : 0) };
      effects.forEach((effect, emitterIndex) => {
        const name = effect.ParticleEmitter;
        const rows = emitters[name],
          row = rows[0];
        const age = now - hit.at - Number(effect.EmitterDelayMs ?? 0) / 1000;
        const duration = Number(row.EmissionTime) / 1000;
        if (age < 0 || age >= duration + Number(row.MaxLife) / 1000) return;
        const count = Number(row.ParticleCount);
        for (let i = 0; i < count; i++) {
          const pose = particle(
            `inferno:${id}:${tick}:${hit.slot}:${emitterIndex}:${i}`,
            name,
            rows,
            age - (duration * i) / count,
            origin,
            (randomSlot) =>
              visualRandom(
                Number(id),
                tick,
                hit.slot * 100000 + emitterIndex * 1000 + i * 16 + randomSlot,
              ),
            effect.IsoLayer ?? effects[0].IsoLayer,
            false,
          );
          if (pose) result.push(pose);
        }
      });
    }
  for (const [id, state] of Object.entries(battle.infernos ?? {}))
    for (const event of state.transitions ?? []) {
      if (event.at > now || now - event.at > transitionHorizon) continue;
      const name = event.stage === 1 ? 'DarkRay Up2' : 'DarkRay Up3';
      const tick = Math.round((event.at * 1000) / 64);
      const pose = particle(
        `inferno:${id}:transition:${tick}:${event.slot}`,
        name,
        emitters[name],
        now - event.at,
        iso(event.x, event.y),
        (slot) => visualRandom(Number(id), tick, 2000000 + event.slot * 16 + slot),
        'Objects',
        false,
      );
      if (pose) result.push(pose);
    }
  return result;
}
