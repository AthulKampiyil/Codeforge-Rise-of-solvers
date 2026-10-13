import { NATIVE_CAMPAIGN, nativeCampaignIssues } from './native-campaign';

/**
 * Ladder matches: this project's own stand-in for multiplayer, so trophies and leagues can
 * move in a village with no server. Nothing here comes from the client. An opponent is a
 * native Goblin or Challenge layout near the attacker's Town Hall, given a trophy count near
 * the attacker's; the offer shrinks against weaker opponents and grows against stronger
 * ones. Stars pay thirds of the win, and a zero-star attack loses the stake. There is no
 * loot, and campaign stars and inventory are untouched.
 */
export interface LadderMatch {
  /** The opponent's invented trophy count. */
  opponent: number;
  /** Trophies for three stars. */
  win: number;
  /** Trophies lost with no stars. */
  loss: number;
}

/** Opponents sit within this many trophies of the attacker. */
export const LADDER_SPREAD = 100;
export const LADDER_MAX_WIN = 59;
export const LADDER_MAX_LOSS = 39;
/** The largest trophy count a ladder match will offer against. */
export const LADDER_MAX_TROPHIES = 100_000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** What a match against `opponent` trophies offers an attacker holding `trophies`. */
export function ladderOffer(trophies: number, opponent: number): LadderMatch {
  const gap = opponent - trophies;
  return {
    opponent,
    win: clamp(Math.round(30 + gap / 12), 1, LADDER_MAX_WIN),
    loss: clamp(Math.round(20 - gap / 12), 1, LADDER_MAX_LOSS),
  };
}

/** The trophy change for finishing a match with `stars`. */
export const ladderTrophies = (match: LadderMatch, stars: number) =>
  stars > 0 ? Math.round((match.win * Math.min(3, stars)) / 3) : -match.loss;

/** A small integer hash, so the same seed always finds the same opponent. */
function mix(seed: number) {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

let playable: number[] | null = null;
/** Native Goblin and Challenge villages that fight completely; fan-made ones are left out. */
function ladderVillages() {
  return (playable ??= NATIVE_CAMPAIGN.flatMap((stage, index) =>
    (stage.family ?? 'goblin') !== 'forged' &&
    stage.recommendedTownHall !== null &&
    !nativeCampaignIssues(index).length
      ? [index]
      : [],
  ));
}

/** The opponent for match number `seed`: its village index and the offer it carries. */
export function ladderOpponent(seed: number, townhall: number, trophies: number) {
  const villages = ladderVillages();
  const distance = (index: number) =>
    Math.abs((NATIVE_CAMPAIGN[index].recommendedTownHall ?? 0) - townhall);
  const nearest = Math.min(...villages.map(distance));
  const pool = villages.filter((index) => distance(index) <= nearest + 1);
  const roll = mix(seed);
  const index = pool[roll % pool.length];
  const spread = (Math.floor(roll / pool.length) % (2 * LADDER_SPREAD + 1)) - LADDER_SPREAD;
  const opponent = clamp(trophies + spread, 0, LADDER_MAX_TROPHIES);
  return { index, match: ladderOffer(trophies, opponent) };
}

const integer = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

export const validLadderMatch = (value: unknown): value is LadderMatch => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const match = value as Record<string, unknown>;
  return (
    integer(match.opponent, 0, LADDER_MAX_TROPHIES) &&
    integer(match.win, 1, LADDER_MAX_WIN) &&
    integer(match.loss, 1, LADDER_MAX_LOSS)
  );
};
