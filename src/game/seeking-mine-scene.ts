import Phaser from 'phaser';
import type { AudioManager } from './audio';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive, presentationTime } from './presentation-clock';
import { guardRender } from './render-guard';
import type { Battle, Building } from './model';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { preloadNativeMeshes } from './native-mesh-scene';
import {
  SEEKING_MINE_ART_FAMILIES,
  seekingMineTexture,
  seekingMinePreview,
} from './seeking-mine-art';
import {
  seekingMineArtLoaded,
  seekingMineGraph,
  seekingMinePoses,
  seekingMineBodyState,
  seekingMineProjectilePose,
  type SeekingMineVisualState,
} from './seeking-mine-poses';
import {
  SEEKING_MINE_SOUNDS,
  seekingMineSample,
  seekingMineSoundCues,
  seekingMineEffectPoses,
  seekingMineTrailPoses,
  seekingMineHandlingEffect,
  type SeekingMineHandling,
} from './seeking-mine-effects';
import { SEEKING_MINE } from './seeking-mine-stats';
import type { NativeParticlePose } from './native-particles';

export function preloadSeekingMines(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, seekingMineGraph(), 'seeking-mine');
  for (const level of SEEKING_MINE_ART_FAMILIES)
    scene.load.image(seekingMineTexture(level), seekingMinePreview(level));
  for (const [path, sound] of Object.entries(SEEKING_MINE_SOUNDS))
    scene.load.binary(seekingMineSample(path), '/' + sound.path);
}

export class SeekingMinePresentation {
  readonly mines = new Map<number, NativeSceneView>();
  readonly projectiles = new Map<number, NativeSceneView>();
  readonly shadows = new Map<number, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  private homeSequence = 0;
  private homeEffects: {
    id: number;
    index: number;
    kind: SeekingMineHandling;
    at: number;
    x: number;
    y: number;
  }[] = [];
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, 'seeking-mine', 'nativeSeekingMineEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(SEEKING_MINE_SOUNDS))
      registerCachedSample(scene, audio.samples, seekingMineSample(path));
  }
  handling(id: number, kind: SeekingMineHandling | 'cancel', at: number, x: number, y: number) {
    if (kind === 'cancel') this.homeEffects = this.homeEffects.filter((e) => e.id !== id);
    else {
      this.homeEffects.push({ id, index: ++this.homeSequence, kind, at, x, y });
      if (this.homeEffects.length > 16) this.homeEffects.shift();
    }
  }
  clear() {
    this.fx.clear();
    for (const map of [this.mines, this.projectiles, this.shadows]) {
      for (const view of map.values()) view.destroy();
      map.clear();
    }
    this.signatures.clear();
    this.homeEffects = [];
  }
  destroy() {
    this.clear();
  }
  render(
    buildings: Building[],
    battle: Battle | null,
    elapsed: number,
    reduced: boolean,
    iso: (x: number, y: number) => { x: number; y: number },
    airLift: number,
  ) {
    // Nothing draws until the Seeking Air Mine family (graph first) has loaded.
    if (!seekingMineArtLoaded()) return [];
    const live = presentationLive(battle);
    // After the finish, mines in flight and blasts keep sampling on the presentation clock.
    if (battle) elapsed = presentationTime(battle);
    const wanted = new Set<number>(),
      flying = new Set<number>(),
      cues: SampleCue[] = [];
    const drawEffects = (poses: NativeParticlePose[]) => {
      for (const fx of poses) this.fx.show(fx);
    };
    const effect = (
      id: number,
      event: string,
      index: number,
      name: string,
      at: number,
      point: { x: number; y: number },
    ) => {
      if (cueAudible(at, elapsed)) cues.push(...seekingMineSoundCues(id, event, index, name, at));
      drawEffects(seekingMineEffectPoses(id, event, index, name, at, elapsed, point, reduced));
    };
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const mine of buildings) {
      if (mine.kind !== 'seekingairmine') continue;
      wanted.add(mine.id);
      const p = iso(mine.x + 0.5, mine.y + 0.5),
        trap = battle?.traps[mine.id];
      const pose = seekingMineBodyState(trap, elapsed, reduced, !!battle?.finished);
      const state: SeekingMineVisualState =
        mine.hp <= 0
          ? 'ruin'
          : mine.constructing
            ? 'constructing'
            : mine.upgradeEnd
              ? 'upgrading'
              : pose.state;
      let view = this.mines.get(mine.id);
      if (!view) this.mines.set(mine.id, (view = new NativeSceneView(this.scene, 'seeking-mine')));
      const signature = `${mine.level}:${state}:${Math.floor(pose.time * 24 + 1e-9)}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(mine.id) !== signature) {
        view.render(
          guardRender(
            `Seeking Air Mine level ${mine.level}`,
            () => seekingMinePoses(mine.level, state, pose.time),
            [],
          ),
          p.x,
          p.y,
          p.y,
        );
        for (const object of view.objects)
          object.setData('nativeSeekingMine', {
            id: mine.id,
            level: mine.level,
            state,
            time: pose.time,
          });
        this.signatures.set(mine.id, signature);
      }
      if (!battle || !live || !trap) continue;
      // A concealed trap becomes visible when activated; both original reveal effects belong here.
      effect(mine.id, 'appear', 0, 'Bomb Appear', trap.activatedAt, p);
      effect(mine.id, 'trigger', 0, 'Small AirTrap', trap.activatedAt, p);
      const brokenAt = Math.min(
        trap.activatedAt + SEEKING_MINE.delay,
        trap.mine?.resolvedAt ?? Infinity,
      );
      effect(mine.id, 'broken', 0, 'Trap broken', brokenAt, p);
      if (trap.mine?.hit && trap.mine.resolvedAt !== undefined)
        effect(
          mine.id,
          'impact',
          0,
          'Large AirTrap Explosion',
          trap.mine.resolvedAt,
          iso(trap.x, trap.y),
        );
      if (!reduced) drawEffects(seekingMineTrailPoses(mine.id, trap, elapsed, iso, airLift));
      if (trap.resolved || reduced) continue;
      const flight = seekingMineProjectilePose(mine.level, trap, elapsed, iso, airLift);
      if (!flight.poses.length) continue;
      flying.add(mine.id);
      let projectile = this.projectiles.get(mine.id),
        shadow = this.shadows.get(mine.id);
      if (!projectile)
        this.projectiles.set(
          mine.id,
          (projectile = new NativeSceneView(this.scene, 'seeking-mine')),
        );
      if (!shadow)
        this.shadows.set(mine.id, (shadow = new NativeSceneView(this.scene, 'seeking-mine')));
      projectile.render(flight.poses, flight.x, flight.y, 7999);
      // Ground shadows always draw under buildings like every other
      // projectile shadow; a y-sorted shadow would paint over buildings
      // standing further up-screen.
      shadow.render(flight.shadow, flight.ground.x, flight.ground.y, -869);
      for (const object of projectile.objects)
        object.setData('nativeSeekingMineProjectile', {
          id: mine.id,
          level: mine.level,
          time: flight.time,
          export: flight.export,
        });
    }
    if (battle) this.homeEffects = [];
    else {
      this.homeEffects = this.homeEffects.filter((e) => elapsed - e.at < 1 && wanted.has(e.id));
      for (const e of this.homeEffects)
        effect(
          e.id,
          `home-${e.kind}`,
          e.index,
          seekingMineHandlingEffect(e.kind),
          e.at,
          iso(e.x, e.y),
        );
    }
    for (const [id, view] of this.mines)
      if (!wanted.has(id)) {
        view.destroy();
        this.mines.delete(id);
        this.signatures.delete(id);
      }
    for (const map of [this.projectiles, this.shadows])
      for (const [id, view] of map)
        if (!flying.has(id)) {
          view.destroy();
          map.delete(id);
        }
    this.fx.sweep();
    return cues;
  }
}
