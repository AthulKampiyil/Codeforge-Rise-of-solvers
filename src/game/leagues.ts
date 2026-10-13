import catalog from '../../reference/leagues/catalog.json' with { type: 'json' };
import type { OreKind } from './equipment';
import type { Resource } from './data';

/** Pinned client 18.400.21 league bands and Star Bonus. See reference/leagues/README.md. */
export const LEAGUES = catalog.leagues;
export type League = (typeof LEAGUES)[number];
export type StarBonusReward = Record<Resource | OreKind, number>;
/** Five stars buy the bonus and it returns a day later, both from the client's own globals. */
export const STAR_BONUS_STARS = catalog.starBonus.stars;
export const STAR_BONUS_COOLDOWN = catalog.starBonus.cooldownMinutes * 60_000;

/** The league a trophy count sits in. The bands are contiguous and start at zero. */
export function leagueFor(trophies: number): League {
  const count = Math.max(0, Math.floor(trophies) || 0);
  for (const league of LEAGUES) if (count <= league.until) return league;
  return LEAGUES[LEAGUES.length - 1];
}
export const starBonusReward = (trophies: number): StarBonusReward =>
  leagueFor(trophies).reward as StarBonusReward;

export interface StarBonus {
  /** Stars banked toward the next bonus; the original lets them overflow past five. */
  stars: number;
  /** When the bonus can next be taken. Zero until one has been taken at all. */
  readyAt: number;
  /** Until when a Town Hall upgrade multiplies the bonus; absent when it never has. */
  boostUntil?: number;
}
export const emptyStarBonus = (): StarBonus => ({ stars: 0, readyAt: 0 });
export const validStarBonus = (value: unknown): value is StarBonus => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const bonus = value as Record<string, unknown>;
  return (
    Number.isInteger(bonus.stars) &&
    (bonus.stars as number) >= 0 &&
    (bonus.stars as number) <= 10000 &&
    Number.isFinite(bonus.readyAt) &&
    (bonus.readyAt as number) >= 0 &&
    (bonus.boostUntil === undefined ||
      (Number.isFinite(bonus.boostUntil) && (bonus.boostUntil as number) >= 0))
  );
};

/**
 * A Town Hall upgrade to level 4 or higher multiplies the Star Bonus (the client's
 * TH_UPGRADE_STAR_BONUS_BOOST_MULTIPLIER) for its level's `StarBonusBoostHours`.
 */
export const TOWN_HALL_BOOST_MULTIPLIER = catalog.townHallBoostMultiplier;
export const townHallBoostHours = (townhall: number) =>
  catalog.treasury[Math.floor(townhall) - 1]?.boostHours ?? 0;

/** The Clan Castle's Treasury: where the Star Bonus is banked until it is collected. */
export const TREASURY_RESOURCES = ['gold', 'elixir', 'dark'] as const;
export type TreasuryResource = (typeof TREASURY_RESOURCES)[number];
export type Treasury = Record<TreasuryResource, number>;
export const emptyTreasury = (): Treasury => ({ gold: 0, elixir: 0, dark: 0 });
/** What a Town Hall's Treasury holds outside a clan (the client's `TreasuryWar*` columns). */
export function treasuryCapacity(townhall: number): Treasury {
  const tiers = catalog.treasury,
    row = tiers[Math.min(tiers.length, Math.max(1, Math.floor(townhall) || 1)) - 1];
  return { gold: row.gold, elixir: row.elixir, dark: row.dark };
}
export const validTreasury = (value: unknown): value is Treasury => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const held = value as Record<string, unknown>;
  return (
    Object.keys(held).length === TREASURY_RESOURCES.length &&
    TREASURY_RESOURCES.every((k) => Number.isSafeInteger(held[k]) && (held[k] as number) >= 0)
  );
};
