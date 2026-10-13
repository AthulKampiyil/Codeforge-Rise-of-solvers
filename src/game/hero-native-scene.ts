import type Phaser from 'phaser';
import { BUILDINGS, TROOPS } from './data';
import { HERO_UNIT, PET_UNIT } from './native-hero-data';
import { heroStatsFor } from './native-heroes';
import { heroAttackInterval } from './native-hero-abilities';
import { unitAttackIntervalScale } from './native-status';
import type { Battle, Unit } from './model';
import type { Defender } from './defenders';
import { buildingIndex, defenderIndex, unitIndex } from './battle-index';
import { isShrunk } from './shrink-trap';
import { unitDepth } from './unit-depth';
import { UnitMotionTracker } from './unit-motion';
import { TINT_MULTIPLY, unitAnimationClock, unitStatusTint } from './unit-status-tint';

/** One hero, pet or guardian drawn this frame; references the sim object, never copies it. */
interface Actor {
  /** Unit id, or the defender id for guardians and defending heroes. */
  id: number;
  /** Motion/state key: unit ids as-is, defender ids mapped below zero (separate id spaces). */
  track: number;
  unit?: Unit;
  defender?: Defender;
  key: string;
  flying: boolean;
}
const actorPool: Actor[] = [];

export interface BakedFrame {
  image: string;
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
}
export interface BakedState {
  fps: number;
  loop: boolean;
  frames: BakedFrame[][];
}
interface Atlas {
  states: Record<string, BakedState>;
  scale?: number;
  normalizedAttack?: boolean;
}
/** Hero keys remain stable for prefetch/replays; only their presentation pack changes. */
export const heroArtDirectory = (key: string) => {
  const hero = key.startsWith('heroes-native/') ? key.slice('heroes-native/'.length) : '';
  if (hero === 'king') return '/assets/characters/king-v1';
  if (['queen', 'warden', 'champion', 'prince', 'duke'].includes(hero))
    return `/assets/characters/hero-redesign-v1/${hero}`;
  return `/assets/${key}`;
};
const KEYS: Record<string, string> = Object.fromEntries(
  [...Object.entries(HERO_UNIT), ...Object.entries(PET_UNIT)].map(([key, unit]) => [unit, key]),
);
/** The baker's direction order is screen E, SE, S, SW, W, NW, N, NE. */
export const bakedDirection = (dx: number, dy: number) =>
  ((Math.round(Math.atan2((dx + dy) / 2, dx - dy) / (Math.PI / 4)) % 8) + 8) % 8;
export function bakedFrame(state: BakedState, direction: number, seconds: number) {
  const frames = state.frames[direction % state.frames.length];
  const index = Math.max(0, Math.floor(seconds * state.fps));
  return frames[state.loop ? index % frames.length : Math.min(index, frames.length - 1)];
}

/** Lazy loads baked atlases; existing sprites stay visible until all textures are ready. */
export class HeroNativePresentation {
  private packs = new Map<string, Atlas>();
  private pending = new Set<string>();
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  /** Per actor (keyed by `Actor.track`): baked direction, drawn state and its start clock. */
  private positions = new Map<number, { direction: number; state: string; since: number }>();
  private motion = new UnitMotionTracker();
  private seen = new Set<number>();
  private wanted = new Set<number>();
  private alive = true;
  constructor(private scene: Phaser.Scene) {}
  /** Prefetch hero/pet atlases for the carried army; retries on failure. */
  prefetch(keys: Iterable<string>) {
    for (const key of keys) {
      if (!this.packs.has(key)) void this.load(key);
    }
  }
  private async load(key: string) {
    if (this.pending.has(key) || this.packs.has(key)) return;
    this.pending.add(key);
    try {
      const directory = heroArtDirectory(key);
      const response = await fetch(`${directory}/atlas.json`);
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const pack = (await response.json()) as Atlas;
      const images = new Set(
        Object.values(pack.states).flatMap((s) => s.frames.flat().map((f) => f.image)),
      );
      await Promise.all(
        [...images].map(async (file) => {
          const texture = `baked:${key}/${file}`;
          if (this.scene.textures.exists(texture)) return;
          const image = new Image();
          image.src = `${directory}/${file}`;
          await image.decode();
          if (!this.alive) return;
          const loaded = this.scene.textures.exists(texture)
            ? this.scene.textures.get(texture)
            : this.scene.textures.addImage(texture, image);
          if (!loaded) throw Error(`Could not load ${texture}`);
          for (const state of Object.values(pack.states))
            for (const frame of state.frames.flat()) {
              const name = `${frame.x}:${frame.y}:${frame.w}:${frame.h}`;
              if (frame.image === file && !loaded.has(name))
                loaded.add(name, 0, frame.x, frame.y, frame.w, frame.h);
            }
        }),
      );
      if (this.alive) this.packs.set(key, pack);
    } catch (error) {
      console.error('Baked character animation', key, error);
    } finally {
      this.pending.delete(key);
    }
  }
  clear() {
    for (const sprite of this.sprites.values()) sprite.destroy();
    this.sprites.clear();
    this.positions.clear();
    this.motion.clear();
  }
  /**
   * Drop decoded atlases (and their GPU textures) for keys outside `keep`.
   * Baked atlas pages are megabytes each and otherwise accumulate forever.
   */
  releaseExcept(keep?: ReadonlySet<string>) {
    for (const [key, pack] of this.packs) {
      if (keep?.has(key)) continue;
      const files = new Set(
        Object.values(pack.states).flatMap((s) => s.frames.flat().map((f) => f.image)),
      );
      for (const file of files) {
        const texture = `baked:${key}/${file}`;
        if (this.scene.textures.exists(texture)) this.scene.textures.remove(texture);
      }
      this.packs.delete(key);
    }
  }
  destroy() {
    this.alive = false;
    this.clear();
  }
  /** Whether this hero/pet sprite drew this frame (scene.ts skips its fallback marker). */
  drewUnit(id: number) {
    return !!this.sprites.get(id)?.visible;
  }
  render(
    battle: Battle | null,
    reduced: boolean,
    iso: (x: number, y: number) => { x: number; y: number },
    lift: number,
    units: Map<number, Phaser.GameObjects.Image>,
    defenders: Map<number, Phaser.GameObjects.Image>,
  ) {
    const wanted = this.wanted;
    const seen = this.seen;
    wanted.clear();
    seen.clear();
    // Collect actors without copying units; most battles have none, so skip everything else.
    let count = 0;
    if (battle) {
      for (const u of battle.units) {
        const key = KEYS[u.kind] ?? (u.hero ? 'king' : undefined);
        if (!key || u.ejected || u.native?.recalled || (u.spawnedAt ?? 0) > battle.elapsed)
          continue;
        const actor = (actorPool[count++] ??= { id: 0, track: 0, key: '', flying: false });
        actor.id = actor.track = u.id;
        actor.unit = u;
        actor.defender = undefined;
        actor.key = `heroes-native/${key}`;
        actor.flying = !!TROOPS[u.kind].flying;
      }
      for (const d of battle.defenders ?? []) {
        if (d.kind !== 'guardian' && d.kind !== 'hero') continue;
        const actor = (actorPool[count++] ??= { id: 0, track: 0, key: '', flying: false });
        actor.id = d.id;
        actor.track = -1 - d.id;
        actor.unit = undefined;
        actor.defender = d;
        actor.key =
          d.kind === 'hero' ? `heroes-native/${d.hero}` : `guardians-native/${d.guardian}`;
        actor.flying = d.mode === 'air';
      }
    }
    if (count && battle) this.draw(battle, count, reduced, iso, lift, units, defenders);
    for (const [id, sprite] of this.sprites)
      if (!wanted.has(id)) {
        sprite.destroy();
        this.sprites.delete(id);
      }
    // Forget actors that left the battle (state and motion history).
    for (const track of this.positions.keys()) if (!seen.has(track)) this.positions.delete(track);
    this.motion.prune(seen);
    for (let i = 0; i < count; i++) {
      actorPool[i].unit = undefined;
      actorPool[i].defender = undefined;
    }
  }
  private draw(
    battle: Battle,
    count: number,
    reduced: boolean,
    iso: (x: number, y: number) => { x: number; y: number },
    lift: number,
    units: Map<number, Phaser.GameObjects.Image>,
    defenders: Map<number, Phaser.GameObjects.Image>,
  ) {
    const cam = (
      this.scene as unknown as {
        cameras?: {
          main?: {
            worldView?: { centerX: number; centerY: number; width: number; height: number };
          };
        };
      }
    ).cameras?.main;
    const view = cam?.worldView;
    const cx = view?.centerX ?? 0;
    const cy = view?.centerY ?? 0;
    const hw = (view?.width ?? 0) / 2;
    const hh = (view?.height ?? 0) / 2;
    const elapsed = battle.elapsed;
    for (let i = 0; i < count; i++) {
      const actor = actorPool[i];
      const u = actor.unit,
        d = actor.defender;
      const body = (u ?? d)!;
      this.seen.add(actor.track);
      const fallback = u ? units.get(actor.id) : defenders.get(actor.id);
      const point = iso(body.x, body.y);
      // Cull before atlas work; the cheap fallback sprite stays visible.
      if (view && (Math.abs(point.x - cx) > hw + 320 || Math.abs(point.y - cy) > hh + 320)) {
        fallback?.setVisible(true);
        continue;
      }
      const pack = this.packs.get(actor.key);
      if (!pack) {
        void this.load(actor.key);
        continue;
      }
      // Walk/idle follows simulation steps (20 Hz), not rendered frames.
      const motion = this.motion.update(
        actor.track,
        body.x,
        body.y,
        elapsed,
        !body.attacking && body.path.length > 0,
      );
      const moving = !body.attacking && motion.moving;
      const old = this.positions.get(actor.track);
      let heading: { x: number; y: number } | undefined;
      if (body.attacking) {
        if (u) {
          const enemy =
            typeof u.defenderTarget === 'number'
              ? defenderIndex(battle).get(u.defenderTarget)
              : undefined;
          const target =
            typeof u.target === 'number' ? buildingIndex(battle).get(u.target) : undefined;
          heading =
            enemy ??
            (target
              ? {
                  x: target.x + BUILDINGS[target.kind].size / 2,
                  y: target.y + BUILDINGS[target.kind].size / 2,
                }
              : undefined);
        } else if (typeof d!.target === 'number') heading = unitIndex(battle).get(d!.target);
      }
      const direction = heading
        ? bakedDirection(heading.x - body.x, heading.y - body.y)
        : moving && motion.heading
          ? bakedDirection(motion.dx, motion.dy)
          : (old?.direction ?? 2);
      const stateName =
        body.hp <= 0
          ? 'die'
          : reduced && pack.normalizedAttack
            ? 'idle'
            : d?.kind === 'guardian' && d.phase === 'leaping'
              ? 'jump'
              : body.attacking
                ? 'attack'
                : moving
                  ? 'walk'
                  : 'idle';
      // Animation clock: shrink and late campaign freezes hold a unit's frame.
      const clock = u ? unitAnimationClock(u, elapsed) : elapsed;
      // `since` survives frames without a sim step: only a real state change restarts a clip.
      const since = old?.state === stateName ? old.since : clock;
      if (old) {
        old.direction = direction;
        old.state = stateName;
        old.since = since;
      } else this.positions.set(actor.track, { direction, state: stateName, since });
      const state =
        pack.states[(actor.flying ? 'alt_' : '') + stateName] ??
        pack.states[stateName] ??
        pack.states.idle;
      if (!state) continue;
      const deathAge = elapsed - (body.defeatedAt ?? elapsed);
      fallback?.setVisible(false);
      if (body.hp <= 0 && deathAge > 1.5) continue;
      const rate = u ? this.rate(battle, u) : 1;
      let seconds = reduced
        ? 0
        : body.hp <= 0
          ? deathAge
          : body.attacking && d?.kind !== 'guardian'
            ? Math.max(0, rate - body.cooldown)
            : clock - since;
      if (pack.normalizedAttack && body.attacking && body.hp > 0) seconds /= Math.max(0.01, rate);
      const frame = bakedFrame(state, direction, seconds);
      const texture = `baked:${actor.key}/${frame.image}`,
        name = `${frame.x}:${frame.y}:${frame.w}:${frame.h}`;
      // Guard every frame selection with a texture lookup: a miss would draw
      // the entire baked atlas page.
      if (!this.scene.textures.exists(texture)) continue;
      if (!this.scene.textures.get(texture).has(name)) continue;
      let sprite = this.sprites.get(actor.track);
      if (!sprite) {
        sprite = this.scene.add.image(0, 0, texture, name).setData('nativeHero', actor.id);
        this.sprites.set(actor.track, sprite);
      }
      const scale = u && isShrunk(u, elapsed) ? 0.5 : 1;
      const invisible = !!u && (u.native?.effects?.invisibleUntil ?? 0) > elapsed;
      // Unique per-actor depth, like troops (ids of units and defenders are separate spaces).
      const wantDepth = unitDepth(point.y, actor.id, actor.flying, 1.2);
      if (sprite.texture.key !== texture || sprite.frame.name !== name)
        sprite.setTexture(texture, name);
      sprite
        .setOrigin(frame.anchorX / frame.w, frame.anchorY / frame.h)
        .setPosition(point.x, point.y - (actor.flying ? lift : 0))
        .setScale((pack.scale ?? 0.6) * scale)
        .setAlpha(body.hp <= 0 ? Math.max(0, 1 - deathAge / 1.5) : invisible ? 0.35 : 1);
      // Status tints in the fallback sprite's order (freeze, poison, rage, boosts, rampage).
      const status = u && u.hp > 0 ? unitStatusTint(u, battle, true) : undefined;
      if (status) {
        if (sprite.tintTopLeft !== status.color) sprite.setTint(status.color);
        if (sprite.tintMode !== status.mode) sprite.setTintMode(status.mode);
      } else if (sprite.tintTopLeft !== 0xffffff || sprite.tintMode !== TINT_MULTIPLY)
        sprite.clearTint();
      if (sprite.depth !== wantDepth) sprite.setDepth(wantDepth);
      this.wanted.add(actor.track);
    }
  }
  /** Attack interval the unit's cooldown was reset to (hero stats and status scaling). */
  private rate(battle: Battle, u: Unit) {
    const hero = battle.nativeHeroes?.find((entry) => entry.unitId === u.id);
    return hero
      ? heroAttackInterval(u, battle.elapsed, heroStatsFor(hero, battle.townhall ?? 18).rate) *
          unitAttackIntervalScale(u, battle.elapsed)
      : TROOPS[u.kind].rate;
  }
}
