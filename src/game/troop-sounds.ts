import source from '../../reference/troop-sounds/sounds.json' with { type: 'json' };
import type { Battle, Unit } from './model';
import { CUE_HORIZON, cueAudible, type SampleCue } from './sample-audio';
import { unitLevel } from './native-troops';
import { spellRow } from './native-spells';
import { seconds } from './native-data';

/**
 * The attacking troops' own deploy, attack and death sounds, the spells' cast and pulse sounds
 * and the client's Building Destroyed sound (reference/troop-sounds, imported by
 * scripts/import-native-troop-sounds.py). Each effect
 * lists alternative takes; one is chosen per event from the event's key, so a replay picks the
 * same take. See docs/TROOP-SOUNDS.md.
 */
export type TroopSoundEvent = 'deploy' | 'attack' | 'hit' | 'die';
export type SpellSoundEvent = 'preDeploy' | 'deploy' | 'deploy2' | 'charging' | 'hit';
type Named = string | (string | null)[];
type Take = { sound: string; volume: number; minPitch: number; maxPitch: number; delay: number };
const TROOPS = source.troops as Record<
  string,
  { name: string } & Partial<Record<TroopSoundEvent, string | (string | null)[]>>
>;
/** Keyed by the client's spell name. */
const SPELLS = source.spells as Record<
  string,
  { key: string } & Partial<Record<SpellSoundEvent, Named>>
>;
const EFFECTS = source.effects as Record<string, Take[]>;
export const TROOP_SOUNDS = source.sounds;
export const DESTROYED_EFFECT = source.destroyed;
export const troopSample = (path: string) => `troop-${path.split('/').at(-1)}`;
/** A battle-clock jump larger than this (seconds) is a seek, not a frame. */
const SEEK_GAP = 1;

/** An effect named once, or per level (clamped to the levels the source lists). */
function atLevel(named: Named | undefined, level: number) {
  if (!named) return undefined;
  if (typeof named === 'string') return named;
  return named[Math.max(0, Math.min(named.length, Math.floor(level)) - 1)] ?? undefined;
}
/** The sound files behind a record's effects, at any level. */
function files(record: Partial<Record<string, Named>> | undefined, events: readonly string[]) {
  if (!record) return [];
  const names = events.flatMap((event) => {
    const named = record[event];
    return !named ? [] : typeof named === 'string' ? [named] : named.filter((n) => n !== null);
  });
  return [...new Set(names.flatMap((name) => EFFECTS[name].map((take) => take.sound)))];
}
/** The effect a troop plays for an event at its level, if it has one. */
export const troopSoundEffect = (kind: string, level: number, event: TroopSoundEvent) =>
  atLevel(TROOPS[kind]?.[event], level);
/** Every sound file a troop kind can play, at any level. */
export const troopSoundFiles = (kind: string) =>
  files(TROOPS[kind], ['deploy', 'attack', 'hit', 'die']);
/** The effect a spell (by its client name) plays for an event at its level. */
export const spellSoundEffect = (name: string, level: number, event: SpellSoundEvent) =>
  atLevel(SPELLS[name]?.[event], level);
export const spellSoundFiles = (name: string) =>
  files(SPELLS[name], ['preDeploy', 'deploy', 'deploy2', 'charging', 'hit']);
/** Stable selection in [0, 1) for a key, the same after seeks and in replays. */
function fraction(key: string) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  // FNV leaves similar short keys close in the high bits; mix them (MurmurHash3's finalizer).
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
}
/** One take of an effect, with its pitch picked in the effect's range. */
export function effectCue(effect: string, key: string, at: number): SampleCue | undefined {
  const takes = EFFECTS[effect];
  if (!takes?.length) return undefined;
  const take = takes[Math.floor(fraction(key) * takes.length)];
  return {
    key,
    sample: troopSample(take.sound),
    at: at + take.delay,
    volume: take.volume,
    pitch: take.minPitch + (take.maxPitch - take.minPitch) * fraction(`${key}:pitch`),
  };
}
export const troopCue = (
  battle: Battle,
  u: Pick<Unit, 'id' | 'kind' | 'level'>,
  event: TroopSoundEvent,
  key: string,
  at: number,
) => {
  const effect = troopSoundEffect(u.kind, unitLevel(battle, u), event);
  return effect ? effectCue(effect, key, at) : undefined;
};
const spellCue = (name: string, level: number, event: SpellSoundEvent, key: string, at: number) => {
  const effect = spellSoundEffect(name, level, event);
  return effect ? effectCue(effect, key, at) : undefined;
};
/**
 * A cast's sounds on the client's own timeline: the bottle falls when it is cast, lands (and
 * charges) after the row's DeployTimeMS, and each resolved pulse plays the spell's hit.
 */
function castCues(
  cues: SampleCue[],
  elapsed: number,
  cast: { key: string; name: string; level: number; at: number },
  hits?: { first: number; interval: number; count: number },
) {
  const { key, name, level, at } = cast;
  if (!SPELLS[name]) return;
  const landed = at + seconds(spellRow(name, level), 'DeployTimeMS');
  const push = (event: SpellSoundEvent, when: number, suffix = '') => {
    if (when > elapsed || !cueAudible(when, elapsed)) return;
    const cue = spellCue(name, level, event, `${key}:${event}${suffix}`, when);
    if (cue) cues.push(cue);
  };
  push('preDeploy', at);
  push('deploy', landed);
  push('deploy2', landed);
  push('charging', landed);
  if (!hits?.count) return;
  // Only pulses that can still be heard: a long Healing Spell pulses dozens of times.
  const step = Math.max(hits.interval, 1e-3);
  for (
    let i = Math.max(0, Math.ceil((elapsed - CUE_HORIZON - hits.first) / step));
    i < hits.count;
    i++
  )
    push('hit', hits.first + i * hits.interval, `:${i}`);
}
/**
 * Attacks and destroyed buildings are not kept in the battle state; the scene records them as
 * their combat events arrive (live or replayed) and this log turns them into cues until they
 * have played out. A seek or a new battle starts the log afresh.
 */
export class BattleSoundLog {
  private battle: Battle | null = null;
  private last = 0;
  private events: SampleCue[] = [];
  private legacy: { key: string; name: string; level: number; at: number }[] = [];
  /**
   * Native casts by id. A battle drops a cast once it ends, while its last pulse may still be
   * sounding, so the log keeps each cast's timeline until it has played out.
   */
  private casts = new Map<
    number,
    {
      name: string;
      level: number;
      at: number;
      first: number;
      interval: number;
      total: number;
      count: number;
    }
  >();
  /**
   * When each unit was first seen, for deploys: a deployed troop carries no time of its own.
   * Units already on the field when the log starts or after a seek count as seen silently.
   */
  private seen = new Map<number, number>();
  private sync(battle: Battle) {
    const jumped = battle.elapsed < this.last || battle.elapsed - this.last > SEEK_GAP;
    if (battle !== this.battle || jumped) {
      this.events.length = 0;
      this.legacy.length = 0;
      this.casts.clear();
      this.seen.clear();
      for (const u of battle.units) this.seen.set(u.id, -Infinity);
    }
    this.battle = battle;
    this.last = battle.elapsed;
  }
  /** When a unit arrived: its own spawn time, or the first frame that showed it. */
  arrived(battle: Battle, u: Unit) {
    if (u.spawnedAt !== undefined) return u.spawnedAt;
    let at = this.seen.get(u.id);
    if (at === undefined) this.seen.set(u.id, (at = battle.elapsed));
    return at;
  }
  /**
   * A troop's attack (its swing or launch) or hit (the impact on its target), at the moment
   * the combat event was reported.
   */
  attack(battle: Battle, u: Unit, event: 'attack' | 'hit' = 'attack') {
    this.sync(battle);
    const cue = troopCue(
      battle,
      u,
      event,
      `troop:${u.id}:${event}:${battle.elapsed}`,
      battle.elapsed,
    );
    if (cue) this.events.push(cue);
  }
  /**
   * A spell cast in a battle without native cast records (older replays): its fall and landing.
   * Native battles read their casts from the battle instead.
   */
  spell(battle: Battle, name: string, level: number, x: number, y: number) {
    this.sync(battle);
    if (battle.nativeContentExpansion) return;
    this.legacy.push({ key: `spell:${x}:${y}:${battle.elapsed}`, name, level, at: battle.elapsed });
  }
  /** Follows the battle's native casts: new ones join, live ones update their pulses. */
  private noteCasts(battle: Battle) {
    const live = new Set<number>();
    for (const cast of battle.nativeSpells ?? []) {
      live.add(cast.id);
      const known = this.casts.get(cast.id);
      if (known) known.count = cast.hits;
      else if (SPELLS[cast.name])
        this.casts.set(cast.id, {
          name: cast.name,
          level: cast.level,
          at: cast.castAt,
          first: cast.firstHit,
          interval: cast.interval,
          total: cast.total,
          count: cast.hits,
        });
    }
    // A cast that has ended resolved every pulse due by now, up to its total.
    for (const [id, cast] of this.casts)
      if (!live.has(id) && cast.count < cast.total && battle.elapsed >= cast.first)
        cast.count = Math.min(
          cast.total,
          Math.floor((battle.elapsed - cast.first) / Math.max(cast.interval, 1e-3) + 1e-9) + 1,
        );
  }
  /** A destroyed building, at its tile. */
  destroyed(battle: Battle, x: number, y: number) {
    this.sync(battle);
    const cue = effectCue(DESTROYED_EFFECT, `destroyed:${x}:${y}`, battle.elapsed);
    if (cue) this.events.push(cue);
  }
  cues(battle: Battle | null): SampleCue[] {
    if (!battle) {
      this.events.length = 0;
      this.legacy.length = 0;
      this.casts.clear();
      this.seen.clear();
      this.battle = null;
      return [];
    }
    this.sync(battle);
    // Drop what has played out; the list stays short however long the battle runs.
    if (this.events.length && !cueAudible(this.events[0].at, battle.elapsed))
      this.events = this.events.filter((cue) => cueAudible(cue.at, battle.elapsed));
    this.noteCasts(battle);
    if (!this.legacy.length && !this.casts.size) return this.events;
    const elapsed = battle.elapsed;
    this.legacy = this.legacy.filter((cast) => cueAudible(cast.at, elapsed));
    const cues = [...this.events];
    for (const cast of this.legacy) castCues(cues, elapsed, cast);
    for (const [id, cast] of this.casts) {
      const last = cast.count ? cast.first + (cast.count - 1) * cast.interval : cast.at;
      // The landing follows the cast by well under a second; keep a cast while either can sound.
      if (!cueAudible(Math.max(last, cast.at + 1), elapsed)) {
        this.casts.delete(id);
        continue;
      }
      castCues(
        cues,
        elapsed,
        { key: `spell:${id}`, name: cast.name, level: cast.level, at: cast.at },
        { first: cast.first, interval: cast.interval, count: cast.count },
      );
    }
    return cues;
  }
}

/** Deploys and deaths, read from the units themselves, plus the logged attacks and ruins. */
export function troopSoundCues(battle: Battle | null, log: BattleSoundLog): SampleCue[] {
  const logged = log.cues(battle);
  if (!battle) return logged;
  const cues: SampleCue[] = [];
  const elapsed = battle.elapsed;
  for (const u of battle.units) {
    // Units another unit, spell or ability summons arrive without a deploy call.
    const arrived = u.summoned ? -Infinity : log.arrived(battle, u);
    if (cueAudible(arrived, elapsed)) {
      const cue = troopCue(battle, u, 'deploy', `troop:${u.id}:deploy`, arrived);
      if (cue) cues.push(cue);
    }
    if (u.defeatedAt !== undefined && cueAudible(u.defeatedAt, elapsed)) {
      const cue = troopCue(battle, u, 'die', `troop:${u.id}:die`, u.defeatedAt);
      if (cue) cues.push(cue);
    }
  }
  for (const cue of logged) cues.push(cue);
  return cues;
}

/**
 * Fetches a troop kind's sounds the first time a battle needs them (about 30 KB a troop), so
 * neither boot nor a battle without that troop downloads them.
 */
export class TroopSoundLoader {
  private requested = new Set<string>();
  private kinds = new Set<string>();
  constructor(private register: (name: string, data: ArrayBuffer) => void) {}
  /**
   * Starts loading what these troop kinds, these spells (client names) and the
   * destroyed-building effect need.
   */
  need(kinds: Iterable<string>, spells: Iterable<string> = []) {
    for (const kind of kinds) {
      if (this.kinds.has(kind)) continue;
      this.kinds.add(kind);
      for (const path of troopSoundFiles(kind)) this.fetch(path);
    }
    for (const name of spells) {
      if (this.kinds.has(`spell:${name}`)) continue;
      this.kinds.add(`spell:${name}`);
      for (const path of spellSoundFiles(name)) this.fetch(path);
    }
    for (const take of EFFECTS[DESTROYED_EFFECT]) this.fetch(take.sound);
  }
  private fetch(path: string) {
    if (this.requested.has(path) || typeof fetch === 'undefined') return;
    this.requested.add(path);
    const sound = TROOP_SOUNDS[path as keyof typeof TROOP_SOUNDS];
    void fetch('/' + sound.path)
      .then((response) => {
        if (!response.ok) throw Error(`${sound.path}: ${response.status}`);
        return response.arrayBuffer();
      })
      .then(
        (data) => this.register(troopSample(path), data),
        // A failed download is asked for again the next time a battle needs it.
        () => {
          this.requested.delete(path);
          for (const kind of this.kinds) {
            const paths = kind.startsWith('spell:')
              ? spellSoundFiles(kind.slice(6))
              : troopSoundFiles(kind);
            if (paths.includes(path)) this.kinds.delete(kind);
          }
        },
      );
  }
}
