import source from '../../reference/archer-tower/native.json' with { type: 'json' };
import type { Battle } from './model';
import { ARCHER_TOWER_GRAPH, archerTowerSource } from './archer-tower-art';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import type { ArcherTowerHandlingEvent } from './archer-tower-sounds';
const emitters = Object.fromEntries(
  Object.entries(source.particles).map(([name, rows]) => [
    name,
    rows.map((row) => ({ ...rows[0], ...row }) as Record<string, string>),
  ]),
);
const particle = nativeParticleSampler(ARCHER_TOWER_GRAPH, 1.2);

/** Original handling emitters using the shared local particle-motion interpretation. */
export function archerTowerHandlingPoses(
  events: readonly ArcherTowerHandlingEvent[],
  elapsed: number,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
): NativeParticlePose[] {
  if (reduced) return [];
  const result: NativeParticlePose[] = [];
  for (const event of events) {
    const effects = source.effects[
      event.kind === 'pickup' ? 'Tower Turret Pickup' : 'Tower Turret Placing'
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
          `archer-tower:handling:${event.id}:${event.index}:${emitterIndex}:${i}`,
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

/** Captured hit emitters with the shared local target-height and particle-motion projection. */
function archerTowerEventPoses(
  kind: 'hit' | 'destroy',
  battle: Battle | null | undefined,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
  airLift = 46,
  elapsed?: number,
): NativeParticlePose[] {
  // Without an explicit presentation time a finished battle shows nothing (the caller owns the
  // after-finish grace; see presentation-clock).
  if (!battle?.nativeArcherTowers || (battle.finished && elapsed === undefined) || reduced)
    return [];
  const now = elapsed ?? battle.elapsed;
  const result: NativeParticlePose[] = [];
  const events =
    kind === 'hit'
      ? (battle.archerTowerHits ?? [])
      : Object.entries(battle.archerTowerDestructions ?? {}).map(([id, event]) => ({
          ...event,
          id,
          sourceId: Number(id),
          air: false,
        }));
  for (const hit of events) {
    const effects = (source.effects as unknown as Record<string, Record<string, string>[]>)[
      archerTowerSource(hit.level)[kind === 'hit' ? 'HitEffect' : 'DestroyEffect']
    ];
    const point = iso(hit.x, hit.y);
    const lift = kind === 'hit' ? 16 : 0;
    const ground = { x: point.x, y: point.y - lift - (hit.air ? airLift : 0) };
    effects.forEach((effect, emitterIndex) => {
      const name = effect.ParticleEmitter;
      if (!name) return;
      const rows = emitters[name],
        row = rows[0];
      const age = now - hit.at - Number(effect.EmitterDelayMs ?? 0) / 1000;
      const duration = Number(row.EmissionTime) / 1000,
        count = Number(row.ParticleCount);
      if (age < 0 || age >= duration + Number(row.MaxLife) / 1000) return;
      for (let i = 0; i < count; i++) {
        const pose = particle(
          `archer-tower:${kind}:${hit.id}:${emitterIndex}:${i}`,
          name,
          rows,
          age - (duration * i) / count,
          ground,
          (slot) =>
            visualRandom(
              hit.sourceId,
              Math.round(hit.at * 1000000),
              (kind === 'hit' ? 6300000 : 6400000) + emitterIndex * 1000 + i * 16 + slot,
            ),
          effect.IsoLayer ?? effects[0].IsoLayer,
          false,
        );
        if (pose) {
          pose.depth = hit.air ? 8000 : pose.depth + lift;
          result.push(pose);
        }
      }
    });
  }
  return result;
}

export function archerTowerHitPoses(
  battle: Battle | null | undefined,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
  airLift = 46,
  elapsed?: number,
) {
  return archerTowerEventPoses('hit', battle, reduced, iso, airLift, elapsed);
}
export function archerTowerDestructionPoses(
  battle: Battle | null | undefined,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
  elapsed?: number,
) {
  return archerTowerEventPoses('destroy', battle, reduced, iso, 46, elapsed);
}
