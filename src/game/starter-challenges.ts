import catalog from '../../reference/starter-challenges/catalog.json' with { type: 'json' };
import type { BuildingKind } from './data';
import { SOURCE_NAME } from './townhall-catalog';
import { TROOP_SOURCE } from './native-units';

/**
 * The client's Starter Challenges (logic/starter_pass*.csv, imported by
 * scripts/import-native-starter-challenges.py): 60 challenges for Town Halls 2 to 6 whose
 * points unlock 26 reward tiers, until the Town Hall reaches 7. See docs/STARTER-CHALLENGES.md.
 */
export type StarterChallenge = (typeof catalog.challenges)[number] & {
  quantity2?: number;
  subject?: string;
};
export type StarterTier = (typeof catalog.tiers)[number] & {
  reward: { kind: 'gold' | 'elixir' | 'gems' | 'item'; item?: string; amount: number };
};
export const STARTER_CHALLENGES = catalog.challenges as StarterChallenge[];
export const STARTER_TIERS = catalog.tiers as StarterTier[];
export const STARTER_TITLE = catalog.title;
export const STARTER_END_TEXT = catalog.endText;
/** Reaching this Town Hall ends the Starter Challenges and grants every unclaimed tier. */
export const STARTER_END_TOWN_HALL = catalog.endTownHall;
export const STARTER_MAX_POINTS = STARTER_TIERS.at(-1)!.score;

/**
 * Task types this offline village cannot count: clans and their donations, and stars timed
 * within a battle's first minute (battles keep no star times).
 */
const UNAVAILABLE: Record<string, string> = {
  HaveClan: 'Needs a clan',
  RequestDonations: 'Needs a clan',
  DonateTroopCapacity: 'Needs a clan',
  DonateSpellCapacity: 'Needs a clan',
  GetHomeStarsUnderTimeLimit: 'Battles keep no star times',
};
/** Why a challenge cannot be completed here, or undefined when it can. */
export const challengeUnavailable = (c: StarterChallenge) => UNAVAILABLE[c.type];

const BUILDINGS_BY_NAME = Object.fromEntries(
  Object.entries(SOURCE_NAME).map(([kind, name]) => [name, kind]),
) as Record<string, BuildingKind>;
const TROOPS_BY_NAME = Object.fromEntries(
  Object.entries(TROOP_SOURCE).map(([kind, name]) => [name, kind]),
) as Record<string, string>;
/** The village building kind a challenge names, if it names one. */
export const challengeBuilding = (c: StarterChallenge) =>
  c.subject ? BUILDINGS_BY_NAME[c.subject] : undefined;
/** The troop key a challenge names, if it names one. */
export const challengeTroop = (c: StarterChallenge) =>
  c.subject ? TROOPS_BY_NAME[c.subject] : undefined;

export interface StarterState {
  /** Progress of counted (and best-per-battle) challenges, by id. */
  counts: Record<string, number>;
  /** Claimed tier indices. */
  claimed: number[];
  /** Set once the Town Hall reached the end level and every tier was granted. */
  ended?: boolean;
}
export const emptyStarter = (): StarterState => ({ counts: {}, claimed: [] });
const IDS = new Set(STARTER_CHALLENGES.map((c) => c.id));
export const validStarter = (value: unknown): value is StarterState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Partial<StarterState>;
  return (
    !!v.counts &&
    typeof v.counts === 'object' &&
    !Array.isArray(v.counts) &&
    Object.entries(v.counts).every(
      ([id, n]) => IDS.has(id) && Number.isSafeInteger(n) && (n as number) >= 0,
    ) &&
    Array.isArray(v.claimed) &&
    new Set(v.claimed).size === v.claimed.length &&
    v.claimed.every((i) => Number.isInteger(i) && i >= 0 && i < STARTER_TIERS.length) &&
    (v.ended === undefined || typeof v.ended === 'boolean')
  );
};

/** One event a counted challenge may advance on. */
export interface StarterEvent {
  type: string;
  amount: number;
  /** The building, troop or resource it concerns (client name). */
  subject?: string;
  /** For WinStarsUsingTroop: how many of each troop the battle deployed. */
  deployed?: Record<string, number>;
}
/** What an event adds to a challenge's progress, or 0 when it does not apply. */
export function eventProgress(c: StarterChallenge, e: StarterEvent) {
  if (c.type !== e.type || challengeUnavailable(c)) return 0;
  if (c.type === 'WinStarsUsingTroop') {
    const troop = challengeTroop(c);
    return troop && (e.deployed?.[troop] ?? 0) >= (c.quantity2 ?? 1) ? e.amount : 0;
  }
  if (c.subject && c.subject !== e.subject) return 0;
  return e.amount;
}
