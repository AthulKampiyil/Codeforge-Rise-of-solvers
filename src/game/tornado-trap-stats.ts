import source from '../../reference/tornado-trap/combat.json' with { type: 'json' };
import { TROOPS, type UnitKind } from './data';

const n = (value: string | undefined) => {
  const result = Number(value);
  if (value === undefined || !Number.isFinite(result))
    throw Error('Missing Tornado Trap source field');
  return result;
};
const forces = (row: Record<string, string>, prefix: 'TornadoForce' | 'TornadoForceAir') =>
  [1, 2, 3, 4, 5].map((tier) => n(row[`${prefix}${tier}`]));

/**
 * Pinned trap and spell rows for each campaign level (one-based). Distances are tiles
 * (source hundredths), times are seconds and forces keep their native speed unit, which
 * `tornadoDrag` converts like character Speed (hundredths of a tile per second).
 */
export const TORNADO_TRAP_LEVELS = source.trap.map((trap: Record<string, string>, i) => {
  const spell = source.spell[i] as Record<string, string>;
  return {
    level: n(trap.Level),
    trigger: n(trap.TriggerRadius) / 100,
    /** Retained trap field; area membership uses the named spell's radius. */
    damageRadius: n(trap.DamageRadius) / 100,
    duration: n(trap.DurationMS) / 1000,
    minHousing: n(trap.MinTriggerHousingLimit),
    air: trap.AirTrigger === 'TRUE',
    ground: trap.GroundTrigger === 'TRUE',
    /** ActionFrame divided by the triggered clip's 24 fps, as for the Shrink Trap. */
    delay: n(trap.ActionFrame) / source.triggerFps,
    /** Tornado Trap tier artwork: level 3 reuses the level-2 exports. */
    art: trap.ExportName === 'tornado_trap_setup_lvl1' ? 1 : 2,
    radius: n(spell.Radius) / 100,
    hitTime: n(spell.HitTimeMS) / 1000,
    interval: n(spell.TimeBetweenHitsMS) / 1000,
    hits: n(spell.NumberOfHits),
    damage: n(spell.Damage),
    groundForce: forces(spell, 'TornadoForce'),
    airForce: forces(spell, 'TornadoForceAir'),
    /** Degrees per second; the source sign is registered to the art's clockwise swirl. */
    rotation: n(spell.TornadoRotationSpeed),
    towardsCenter: n(spell.TornadoSpeedTowardsCenter),
    innerRadius: n(spell.TornadoInnerRadius) / 100,
    innerPercent: n(spell.TornadoInnerForcePercent),
    outerPercent: n(spell.TornadoOuterForcePercent),
  };
});
export type TornadoTrapLevel = (typeof TORNADO_TRAP_LEVELS)[number];
export const MAX_TORNADO_TRAP_LEVEL = TORNADO_TRAP_LEVELS.length;
export const TORNADO_SIEGE_FORCE_TIER = source.siegeForceTier;

export function tornadoTrapStats(level: number) {
  const stats = TORNADO_TRAP_LEVELS[level - 1];
  if (!stats) throw Error(`Unsupported Tornado Trap level: ${level}`);
  return stats;
}

/**
 * Force tier 1–5: housing space divided by three, rounded up and capped at five.
 * Heroes use the local trap housing value of 25 (tier 5). Source: Clash of Clans Wiki and the
 * 1337wiki copy, see reference/tornado-trap/README.md. Siege Machines (global tier 1) are absent.
 */
export function tornadoForceTier(kind: UnitKind, hero = false) {
  const housing = hero ? 25 : TROOPS[kind].space;
  return Math.min(5, Math.max(1, Math.ceil(housing / 3)));
}

/** Percentage of the tier force at a distance: inner percent inside the inner radius,
 * linearly reaching the outer percent at the spell radius (local interpretation). */
export function tornadoForcePercent(stats: TornadoTrapLevel, distance: number) {
  const t = Math.min(
    1,
    Math.max(0, (distance - stats.innerRadius) / (stats.radius - stats.innerRadius)),
  );
  return stats.innerPercent + (stats.outerPercent - stats.innerPercent) * t;
}

/**
 * Speeds in tiles per second for one caught unit (local interpretation of retained fields).
 * The vortex flow is TornadoSpeedTowardsCenter inward, stopping at the inner radius, plus
 * TornadoRotationSpeed turning at the current radius. The unit follows that flow at no more
 * than its tier force after distance falloff, so heavier units are both pulled and spun less.
 */
export function tornadoDrag(
  stats: TornadoTrapLevel,
  kind: UnitKind,
  hero: boolean,
  distance: number,
) {
  const tier = tornadoForceTier(kind, hero);
  const force = (TROOPS[kind].flying ? stats.airForce : stats.groundForce)[tier - 1];
  const limit = ((force / 100) * tornadoForcePercent(stats, distance)) / 100;
  const inward = distance > stats.innerRadius ? stats.towardsCenter / 100 : 0,
    tangential = (Math.abs(stats.rotation) * Math.PI * distance) / 180;
  const flow = Math.sqrt(inward * inward + tangential * tangential);
  const scale = flow > limit ? limit / flow : 1;
  return { tier, limit, inward: inward * scale, tangential: tangential * scale };
}
