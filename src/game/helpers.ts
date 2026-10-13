import catalog from '../../reference/helpers/catalog.json' with { type: 'json' };
import { isSpellKind, TROOP_KEYS, type ResearchKind } from './data';
import { HERO_KINDS, type HeroKind } from './native-hero-data';

/**
 * The Helper Hut's Builder's Apprentice and Lab Assistant, from the pinned client's
 * villager_apprentices.csv (reference/helpers). A rested helper takes one job: for its level's
 * working seconds the job's timer runs `multiplier` extra seconds each second, then the helper
 * rests VILLAGERS_COOLDOWN_TIME, so it works one hour a day. With `repeat` (the client's "Keep
 * assigned until upgrade is complete") it returns to the job each time it has rested. The
 * Alchemist takes no job: once rested she converts one resource into another, instantly, then
 * rests. The Prospector converts ores and is a Gold Pass reward; it is not modelled.
 */
export const HELPER_KINDS = ['builder', 'lab', 'alchemist'] as const;
export type HelperKind = (typeof HELPER_KINDS)[number];
export interface HelperLevel {
  level: number;
  townHall: number;
  /** Extra seconds of job progress per working second. */
  multiplier: number;
  /** Working seconds per assignment. */
  seconds: number;
  /** Gems that buy this level. */
  cost: number;
  /** Converters: the base caps scale by this percentage. */
  capPercent?: number;
  /** Converters: the output is this percentage of the exchanged amount. */
  ratePercent?: number;
}
const ROWS = Object.fromEntries(
  catalog.helpers
    .filter((h) => (HELPER_KINDS as readonly string[]).includes(h.id))
    .map((h) => [h.id, h]),
) as unknown as Record<
  HelperKind,
  {
    name: string;
    info: string;
    levels: HelperLevel[];
    conversion?: { resources: string[]; caps: number[] };
  }
>;
/** Rest after each assignment's work. */
export const HELPER_COOLDOWN_SECONDS = catalog.cooldownSeconds;

export const helperName = (kind: HelperKind) => ROWS[kind].name;
export const helperInfo = (kind: HelperKind) => ROWS[kind].info;
export const helperLevels = (kind: HelperKind): readonly HelperLevel[] => ROWS[kind].levels;
export const helperMaxLevel = (kind: HelperKind) => ROWS[kind].levels.length;
export const helperLevel = (kind: HelperKind, level: number): HelperLevel | undefined =>
  ROWS[kind].levels[level - 1];

export type ConvertResource = 'gold' | 'elixir' | 'dark';
export const CONVERT_RESOURCES: readonly ConvertResource[] = ['gold', 'elixir', 'dark'];
const CLIENT_RESOURCE: Record<ConvertResource, string> = {
  gold: 'Gold',
  elixir: 'Elixir',
  dark: 'DarkElixir',
};
/** The Alchemist's base cap for a resource: 1.5M Gold or Elixir, or 10,000 Dark Elixir. */
const baseCap = (resource: ConvertResource) => {
  const { resources, caps } = ROWS.alchemist.conversion!;
  return caps[resources.indexOf(CLIENT_RESOURCE[resource])];
};
/** The most of `from` one conversion takes at this Alchemist level. */
export const alchemistCap = (level: number, from: ConvertResource) =>
  Math.floor((baseCap(from) * helperLevel('alchemist', level)!.capPercent!) / 100);
/**
 * What `amount` of `from` becomes in `to`: the resources trade at the ratio of their base caps
 * (1:1 between Gold and Elixir, 150:1 against Dark Elixir), plus the level's conversion bonus.
 */
export const alchemistOutput = (
  level: number,
  from: ConvertResource,
  to: ConvertResource,
  amount: number,
) =>
  Math.floor(
    (amount * baseCap(to) * helperLevel('alchemist', level)!.ratePercent!) / (baseCap(from) * 100),
  );

/** What a helper works on, with the level being upgraded so a later job is never mistaken for it. */
export type HelperTarget =
  | { building: number; level: number }
  | { hero: HeroKind; level: number }
  | { research: ResearchKind; level: number };
export interface HelperJob {
  target: HelperTarget;
  /** When today's work began. */
  start: number;
  /** The job's timer has run at the helper's speed up to this time. */
  applied: number;
  /** Return to this job after each rest until it completes. */
  repeat?: boolean;
}
export interface HelperState {
  level: number;
  job?: HelperJob;
  /** Rested at this time; absent once the helper is ready. */
  readyAt?: number;
  /** Seconds of job time saved, for the client's "Total saved time". */
  saved?: number;
}
export type Helpers = Partial<Record<HelperKind, HelperState>>;
/** A running job timer: its end, and a way to bring it forward. */
export interface HelperTimer {
  readonly end: number;
  move(ms: number): void;
}

const workSeconds = (kind: HelperKind, h: HelperState) => helperLevel(kind, h.level)!.seconds;

/** When today's work ends, or undefined when the helper has no job. */
export const helperWorkEnd = (kind: HelperKind, h: HelperState) =>
  h.job ? h.job.start + workSeconds(kind, h) * 1000 : undefined;
/** Working now: the job's work window is still open. */
export const helperWorking = (kind: HelperKind, h: HelperState | undefined) =>
  !!h?.job && h.job.applied < helperWorkEnd(kind, h)!;
export const helperReady = (h: HelperState | undefined, now: number) =>
  !!h && (h.readyAt ?? 0) <= now;

/** Sends a rested helper to work on `target` from `now`. */
export function startHelperJob(
  kind: HelperKind,
  h: HelperState,
  target: HelperTarget,
  now: number,
  repeat = false,
) {
  h.job = { target, start: now, applied: now, ...(repeat ? { repeat: true } : {}) };
  h.readyAt = now + (workSeconds(kind, h) + HELPER_COOLDOWN_SECONDS) * 1000;
}

/**
 * Runs one helper up to `now`: its job's timer runs (1 + multiplier)× while it works, and a
 * recurring job resumes each time it has rested. Offline time is applied the same way, day by
 * day. Returns 'progress' when only a timer moved, 'state' when the job changed and 'ready' when
 * the helper has rested.
 */
export function advanceHelper(
  kind: HelperKind,
  h: HelperState,
  now: number,
  timerOf: (target: HelperTarget) => HelperTimer | undefined,
): 'progress' | 'state' | 'ready' | undefined {
  let result: 'progress' | 'state' | 'ready' | undefined;
  for (let day = 0; h.job && day < 1000; day++) {
    const job = h.job;
    const { multiplier, seconds } = helperLevel(kind, h.level)!;
    const workEnd = job.start + seconds * 1000;
    const timer = timerOf(job.target);
    if (timer && job.applied < workEnd && timer.end > job.applied) {
      const until = Math.min(now, workEnd);
      if (until > job.applied) {
        // The job finishes at x where end - multiplier·(x - applied) = x.
        const done = timer.end - multiplier * (until - job.applied) <= until;
        const stop = done
          ? Math.min(until, Math.ceil((timer.end + multiplier * job.applied) / (1 + multiplier)))
          : until;
        const saved = done ? timer.end - stop : multiplier * (until - job.applied);
        timer.move(saved);
        h.saved = (h.saved ?? 0) + saved / 1000;
        // A finished job ends today's work: the helper stops and rests.
        job.applied = done ? workEnd : until;
        result ??= 'progress';
      }
      if (job.applied < workEnd) return result;
    }
    // Today's work is over. A recurring job waits for the rest to end while its timer runs.
    const at = Math.min(now, h.readyAt ?? now);
    if (job.repeat && timer && timer.end > at) {
      if ((h.readyAt ?? now) > now) return result;
      startHelperJob(kind, h, job.target, at, true);
      result = 'state';
      continue;
    }
    delete h.job;
    result = 'state';
  }
  if (!h.job && h.readyAt !== undefined && h.readyAt <= now) {
    delete h.readyAt;
    result = 'ready';
  }
  return result;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const validTarget = (t: unknown): t is HelperTarget => {
  if (!t || typeof t !== 'object' || Array.isArray(t)) return false;
  const v = t as Record<string, unknown>;
  const keys = Object.keys(v).sort().join();
  if (!Number.isInteger(v.level) || (v.level as number) < 0) return false;
  if (keys === 'building,level') return Number.isSafeInteger(v.building);
  if (keys === 'hero,level') return HERO_KINDS.includes(v.hero as HeroKind);
  if (keys === 'level,research')
    return (
      typeof v.research === 'string' &&
      (isSpellKind(v.research) || (TROOP_KEYS as readonly string[]).includes(v.research))
    );
  return false;
};
export function validHelpers(value: unknown): value is Helpers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([kind, raw]) => {
    if (!(HELPER_KINDS as readonly string[]).includes(kind)) return false;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
    const h = raw as HelperState;
    if (!Number.isInteger(h.level) || h.level < 1 || h.level > helperMaxLevel(kind as HelperKind))
      return false;
    if (h.readyAt !== undefined && !finite(h.readyAt)) return false;
    if (h.saved !== undefined && (!finite(h.saved) || h.saved < 0)) return false;
    if (h.job === undefined) return true;
    // The Alchemist converts; she never holds a job.
    if (kind === 'alchemist') return false;
    const job = h.job;
    const end = job?.start + workSeconds(kind as HelperKind, h) * 1000;
    return (
      !!job &&
      typeof job === 'object' &&
      validTarget(job.target) &&
      finite(job.start) &&
      finite(job.applied) &&
      job.applied >= job.start &&
      job.applied <= end &&
      (job.repeat === undefined || job.repeat === true) &&
      finite(h.readyAt)
    );
  });
}
