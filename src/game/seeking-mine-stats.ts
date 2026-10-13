import source from '../../reference/seeking-mine/combat.json' with { type: 'json' };

/** Eight pinned levels; home availability and upgrade ceilings are separate. */
export const SEEKING_MINE_LEVELS = source.levels;
export const seekingMineStats = (level: number) => SEEKING_MINE_LEVELS[level - 1];
export const SEEKING_MINE = {
  speed: source.projectiles.LargeDarkElixirBalloon.speed / 100,
  minHousing: source.minHousing,
  trigger: source.triggerRadius / 100,
  radius: source.damageRadius / 100,
  // The SC clip supplies 24 fps. Native executable handoff semantics are unverified.
  delay: source.actionFrame / source.triggerFps,
} as const;
