import source from '../../reference/freeze-trap/combat.json' with { type: 'json' };

const n = (value: string | undefined) => {
  const result = Number(value);
  if (value === undefined || !Number.isFinite(result))
    throw Error('Missing Freeze Trap source field');
  return result;
};
const trap = source.trap as Record<string, string>,
  spell = source.spell as Record<string, string>;

/** Pinned FreezeTrap_SinglePlayer (12000018) and FreezeTrap spell fields in tiles and seconds. */
export const FREEZE_TRAP = {
  level: n(trap.Level),
  trigger: n(trap.TriggerRadius) / 100,
  /** Retained trap field; area membership uses the named spell's radius. */
  damageRadius: n(trap.DamageRadius) / 100,
  duration: n(trap.DurationMS) / 1000,
  minHousing: n(trap.MinTriggerHousingLimit),
  air: trap.AirTrigger === 'TRUE',
  ground: trap.GroundTrigger === 'TRUE',
  /** ActionFrame divided by the 24 fps trigger clip, as for the Shrink Trap. */
  delay: n(trap.ActionFrame) / source.triggerFps,
};
export const FREEZE_SPELL = {
  radius: n(spell.Radius) / 100,
  hitTime: n(spell.HitTimeMS) / 1000,
  hits: n(spell.NumberOfHits),
  /** Freeze at the spell center. */
  freeze: n(spell.FreezeTimeMS) / 1000,
  /** Freeze at the spell radius. */
  outerFreeze: n(spell.FreezeOuterTimeMS) / 1000,
};

/**
 * Local interpretation: the center-to-edge reduction follows the squared distance, the shape
 * of the older public engine reconstruction's AreaFreeze, and ends at FreezeOuterTimeMS.
 */
export function freezeDuration(distance: number) {
  const t = Math.min(1, Math.max(0, distance / FREEZE_SPELL.radius));
  return FREEZE_SPELL.freeze - (FREEZE_SPELL.freeze - FREEZE_SPELL.outerFreeze) * t * t;
}
