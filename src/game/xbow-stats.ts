import source from '../../reference/xbow/combat.json' with { type: 'json' };

export type XbowMode = 'ground' | 'both';
export const validXbowMode = (v: unknown): v is XbowMode | undefined =>
  v === undefined || v === 'ground' || v === 'both';
export const XBOW_LEVELS = source.levels;
export const XBOW = {
  interval: source.intervalMs / 1000,
  ammunition: source.ammunition,
  groundRange: source.groundRange / 100,
  bothRange: source.groundAirRange / 100,
} as const;
export const XBOW_PROJECTILES = source.projectiles.map((p) => ({
  ...p,
  speed: p.speed / 100,
}));
export const xbowRange = (mode: XbowMode = 'ground') =>
  mode === 'both' ? XBOW.bothRange : XBOW.groundRange;
export const xbowDamage = (level: number) =>
  (XBOW_LEVELS[level - 1].dps * source.intervalMs) / 1000;
export const xbowProjectile = (level: number) => XBOW_LEVELS[level - 1].projectile;
export interface XbowState {
  ammunition: number;
  fired: number;
  aimX: number;
  aimY: number;
  lastShotAt?: number;
  emptyAt?: number;
  /** Exact recent shot clocks for native audio; older samples have finished. */
  shots: { at: number; index: number }[];
  hits: { at: number; index: number }[];
}
