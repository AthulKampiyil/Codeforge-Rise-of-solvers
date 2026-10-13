import raw from '../../reference/garrison/particles.json' with { type: 'json' };
import art from '../../reference/garrison/particle-art.json' with { type: 'json' };
import type { NativeMeshGraph } from './native-mesh';
import { nativeParticleSampler, type NativeParticlePose } from './native-particles';
import { visualRandom } from './visual-random';
import { GARRISON_SCALE, dragonAttackOffset } from './garrison-poses';
import { garrisonStats } from './garrison-reserve';
import type { Battle } from './model';

type Row = Record<string, string>;
export const GARRISON_EFFECT_GRAPH = art as unknown as NativeMeshGraph;
const effects = raw.effects as Record<string, Row[]>;
// Variant rows share emitter settings; keep the imported records untouched.
const emitters = Object.fromEntries(
  Object.entries(raw.particles).map(([name, rows]) => [
    name,
    rows.map((row) => ({ ...rows[0], ...row }) as Row),
  ]),
);
const number = (row: Row, key: string) => Number(row[key] ?? 0);
const particle = nativeParticleSampler(GARRISON_EFFECT_GRAPH, GARRISON_SCALE, {
  reducedEmitters: ['Ring'],
  signedSpeed: true,
  directionalRadius: true,
  orientTravelToParent: true,
});

/** Seconds after `at` when the last particle of an effect's emitters has expired. */
const horizons = new Map<string, number>();
function effectHorizon(name: string) {
  let horizon = horizons.get(name);
  if (horizon === undefined) {
    horizon = 0;
    for (const effectRow of effects[name] ?? []) {
      const row = effectRow.ParticleEmitter ? emitters[effectRow.ParticleEmitter]?.[0] : undefined;
      if (!row) continue;
      horizon = Math.max(
        horizon,
        (number(effectRow, 'EmitterDelayMs') +
          number(row, 'EmissionTime') +
          number(row, 'MaxLife')) /
          1000,
      );
    }
    if (!Number.isFinite(horizon)) horizon = Infinity;
    horizons.set(name, horizon);
  }
  return horizon;
}

/**
 * Original emitters with the shared local particle projection and deterministic births.
 *
 * `elapsed` is the sampling clock: callers pass the presentation clock so bursts in flight at
 * the finish play out (see presentation-clock.ts). It defaults to `battle.elapsed`.
 */
export function garrisonImpactPoses(
  battle: Battle | null,
  reduced: boolean,
  iso: (x: number, y: number) => { x: number; y: number },
  lift = 46,
  elapsed = battle?.elapsed ?? 0,
): NativeParticlePose[] {
  if (!battle) return [];
  const result: NativeParticlePose[] = [];
  const effect = (
    id: number,
    index: number,
    event: string,
    name: string,
    at: number,
    x: number,
    y: number,
    offset = { x: 0, y: 0 },
    facing = { x: 1, y: 0 },
  ) => {
    // Expired and future events cost nothing: skip them before any projection or key string.
    if (at > elapsed || elapsed - at >= effectHorizon(name)) return;
    const rows = effects[name];
    const point = iso(x, y);
    const origin = { x: point.x + offset.x, y: point.y + offset.y };
    for (const [emitterIndex, effectRow] of rows.entries()) {
      const name = effectRow.ParticleEmitter;
      if (!name) continue;
      const emitter = emitters[name],
        row = emitter[0];
      const age = elapsed - at - number(effectRow, 'EmitterDelayMs') / 1000;
      const duration = number(row, 'EmissionTime') / 1000;
      if (age < 0 || age >= duration + number(row, 'MaxLife') / 1000) continue;
      const count = number(row, 'ParticleCount');
      for (let i = 0; i < count; i++) {
        const pose = particle(
          `garrison:${id}:${event}:${index}:${emitterIndex}:${i}`,
          name,
          emitter,
          age - (duration * i) / count,
          origin,
          (slot) => visualRandom(id, index, 1000000 + emitterIndex * 1000 + i * 16 + slot),
          effectRow.IsoLayer ?? rows[0].IsoLayer,
          reduced,
          Math.atan2((facing.x + facing.y) * 0.16, (facing.x - facing.y) * 0.32),
          Math.atan2(facing.y, facing.x),
        );
        if (pose) result.push(pose);
      }
    }
  };
  for (const defender of battle.defenders ?? []) {
    if (
      defender.kind === 'skeleton' ||
      defender.kind === 'guardian' ||
      defender.kind === 'repairer' ||
      elapsed < defender.spawnedAt
    )
      continue;
    if (defender.kind === 'dragon') {
      const animation = garrisonStats(defender.kind, defender.level).animation;
      // The source detaches the fire origin after start and destroys it on death.
      if (defender.hp > 0)
        for (const [index, attack] of defender.attacks.entries()) {
          // Stable attack ordinal, not the array index: pruning must not rekey
          // live effects or reseed their particles.
          const ordinal = attack.n ?? index;
          const facing = { x: attack.targetX - attack.x, y: attack.targetY - attack.y };
          const offset = dragonAttackOffset(facing.x, facing.y, animation);
          effect(
            defender.id,
            ordinal,
            'attack',
            raw.bindings.dragon.attack,
            attack.at,
            attack.x,
            attack.y,
            { x: offset.x, y: offset.y - lift },
            facing,
          );
        }
      if (defender.defeatedAt !== undefined)
        effect(
          defender.id,
          0,
          'die',
          raw.bindings.dragon.die,
          defender.defeatedAt,
          defender.x,
          defender.y,
          { x: 0, y: -lift },
        );
      continue;
    }
    // Original attack/death particles for the version-44 families remain pending.
    if (defender.kind !== 'balloon') continue;
    for (const [index, attack] of defender.attacks.entries())
      effect(
        defender.id,
        attack.n ?? index,
        'hit',
        raw.bindings.balloon.hit,
        attack.at,
        attack.x,
        attack.y,
      );
    if (defender.defeatedAt !== undefined && defender.deathResolved)
      effect(
        defender.id,
        0,
        'death-damage',
        raw.bindings.balloon.deathDamage,
        defender.defeatedAt + garrisonStats('balloon', defender.level).deathDelay,
        defender.x,
        defender.y,
      );
  }
  return result;
}
