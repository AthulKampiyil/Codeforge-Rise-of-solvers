import source from '../../reference/dark-drill/native.json' with { type: 'json' };
import { darkDrillArtLoaded, darkDrillGraph } from './dark-drill-art';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import type { Battle } from './model';
import type { DrillHandlingEvent } from './dark-drill-sounds';
const emitters = Object.fromEntries(
  Object.entries(source.particles).map(([name, rows]) => [
    name,
    rows.map((row) => ({ ...rows[0], ...row }) as Record<string, string>),
  ]),
);
/** Built on first use: the Drill graph arrives with its art family. */
let sampler: ReturnType<typeof nativeParticleSampler> | undefined;
const particle: ReturnType<typeof nativeParticleSampler> = (...args) =>
  (sampler ??= nativeParticleSampler(darkDrillGraph(), 1.2))(...args);

/** Original handling emitters using the shared local particle-motion interpretation. */
export function darkDrillHandlingPoses(
  events: readonly DrillHandlingEvent[],
  elapsed: number,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
): NativeParticlePose[] {
  return drillPoses(events, elapsed, reduced, iso);
}
export function darkDrillDestructionPoses(
  history: Battle['drillDestructions'],
  elapsed: number,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
): NativeParticlePose[] {
  return drillPoses(
    Object.entries(history ?? {}).map(([id, event]) => ({
      ...event,
      id: Number(id),
      index: 0,
      kind: 'destroy' as const,
    })),
    elapsed,
    reduced,
    iso,
  );
}
function drillPoses(
  events: readonly (Omit<DrillHandlingEvent, 'kind'> & { kind: 'pickup' | 'place' | 'destroy' })[],
  elapsed: number,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
): NativeParticlePose[] {
  // No emitters to draw until the Drill's art family (and its graph) has arrived.
  if (reduced || !darkDrillArtLoaded()) return [];
  const result: NativeParticlePose[] = [];
  for (const event of events) {
    const effects = source.effects[
      event.kind === 'destroy'
        ? 'Building Destroyed'
        : event.kind === 'pickup'
          ? 'Dark Elixir Drill Pickup'
          : 'Dark Elixir Drill Place'
    ] as Record<string, string>[];
    effects.forEach((effect, emitterIndex) => {
      const name = effect.ParticleEmitter,
        rows = emitters[name],
        row = rows[0];
      const age = elapsed - event.at - Number(effect.EmitterDelayMs ?? 0) / 1000;
      const duration = Number(row.EmissionTime) / 1000,
        count = Number(row.ParticleCount);
      if (age < 0 || age >= duration + Number(row.MaxLife) / 1000) return;
      for (let i = 0; i < count; i++) {
        const pose = particle(
          `dark-drill:${event.kind === 'destroy' ? 'destroy' : 'handling'}:${event.id}:${event.index}:${emitterIndex}:${i}`,
          name,
          rows,
          age - (duration * i) / count,
          iso(event.x, event.y),
          (slot) =>
            visualRandom(event.id, event.index, 5000000 + emitterIndex * 1000 + i * 16 + slot),
          effect.IsoLayer ?? effects[0].IsoLayer,
          false,
        );
        if (pose) result.push(pose);
      }
    });
  }
  return result;
}
