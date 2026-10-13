import Phaser from 'phaser';
import type { AudioManager } from './audio';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive, presentationTime } from './presentation-clock';
import { guardRender } from './render-guard';
import type { Battle, Building } from './model';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { preloadNativeMeshes } from './native-mesh-scene';
import { MORTAR_ART_LEVELS, mortarAsset, mortarTexture } from './mortar-art';
import {
  mortarArtLoaded,
  mortarGraph,
  mortarPose,
  mortarPoses,
  mortarProjectilePose,
} from './mortar-poses';
import { mortarStats } from './mortar-stats';
import {
  MORTAR_SOUNDS,
  mortarSample,
  mortarSoundCues,
  mortarEffectPoses,
  mortarHandlingEffect,
  mortarTrailPoses,
  type MortarHandling,
} from './mortar-effects';

export function preloadMortars(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, mortarGraph(), 'mortar');
  for (const level of MORTAR_ART_LEVELS) scene.load.image(mortarTexture(level), mortarAsset(level));
  for (const [path, sound] of Object.entries(MORTAR_SOUNDS))
    scene.load.binary(mortarSample(path), '/' + sound.path);
}

export class MortarPresentation {
  readonly towers = new Map<number, NativeSceneView>();
  readonly projectiles = new Map<string, NativeSceneView>();
  readonly shadows = new Map<string, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  private homeSequence = 0;
  private homeEffects: {
    id: number;
    index: number;
    kind: MortarHandling;
    at: number;
    x: number;
    y: number;
  }[] = [];
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, 'mortar', 'nativeMortarEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(MORTAR_SOUNDS))
      registerCachedSample(scene, audio.samples, mortarSample(path));
  }
  handling(id: number, kind: MortarHandling | 'cancel', at: number, x: number, y: number) {
    if (kind === 'cancel') this.homeEffects = this.homeEffects.filter((e) => e.id !== id);
    else {
      this.homeEffects.push({ id, index: ++this.homeSequence, kind, at, x, y });
      if (this.homeEffects.length > 16) this.homeEffects.shift();
    }
  }
  clear() {
    this.fx.clear();
    for (const map of [this.towers, this.projectiles, this.shadows]) {
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
  ) {
    // Nothing draws until the Mortar family (graph first) has loaded.
    if (!mortarArtLoaded()) return [];
    const live = presentationLive(battle);
    // After the finish, shells in flight and bursts keep sampling on the presentation clock.
    if (battle) elapsed = presentationTime(battle);
    const wanted = new Set<number>(),
      flying = new Set<string>(),
      cues: SampleCue[] = [];
    const effect = (
      id: number,
      event: string,
      index: number,
      name: string,
      at: number,
      point: { x: number; y: number },
    ) => {
      if (cueAudible(at, elapsed)) cues.push(...mortarSoundCues(id, event, index, name, at));
      for (const fx of mortarEffectPoses(id, event, index, name, at, elapsed, point, reduced))
        this.fx.show(fx);
    };
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const tower of buildings) {
      if (tower.kind !== 'mortar') continue;
      wanted.add(tower.id);
      const p = iso(tower.x + 1.5, tower.y + 1.5),
        pose = mortarPose(tower, battle);
      let view = this.towers.get(tower.id);
      if (!view) this.towers.set(tower.id, (view = new NativeSceneView(this.scene, 'mortar')));
      const signature = `${tower.level}:${pose.state}:${pose.turret}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(tower.id) !== signature) {
        view.render(
          guardRender(`Mortar level ${tower.level}`, () => mortarPoses(tower.level, pose), []),
          p.x,
          p.y,
          p.y + (pose.state === 'ruin' ? -2 : 0),
        );
        for (const object of view.objects)
          object.setData('nativeMortar', { id: tower.id, level: tower.level, ...pose });
        this.signatures.set(tower.id, signature);
      }
      if (battle && live) {
        const history = battle.mortars?.[tower.id];
        for (const shot of history?.shots ?? []) {
          effect(
            tower.id,
            'attack',
            shot.index,
            'Mortar Attack',
            shot.launched,
            iso(shot.fromX, shot.fromY),
          );
          if (!reduced) {
            for (const fx of mortarTrailPoses(shot, elapsed, iso)) this.fx.show(fx);
            if (
              elapsed >= shot.launched &&
              elapsed < shot.impact &&
              !history!.hits.some((hit) => hit.index === shot.index)
            ) {
              const key = `${tower.id}:${shot.index}`,
                p = mortarProjectilePose(shot.level, shot, elapsed, iso);
              flying.add(key);
              let flight = this.projectiles.get(key),
                shadow = this.shadows.get(key);
              if (!flight)
                this.projectiles.set(key, (flight = new NativeSceneView(this.scene, 'mortar')));
              if (!shadow)
                this.shadows.set(key, (shadow = new NativeSceneView(this.scene, 'mortar')));
              flight.render(p.poses, p.x, p.y, 8000);
              shadow.render(p.shadow, p.ground.x, p.ground.y, -869);
              for (const object of flight.objects)
                object.setData('nativeMortarProjectile', {
                  key,
                  level: shot.level,
                  export: p.export,
                  t: p.t,
                });
              for (const object of shadow.objects)
                object.setData('nativeMortarShadow', { key, t: p.t });
            }
          }
        }
        for (const hit of history?.hits ?? [])
          effect(
            tower.id,
            'hit',
            hit.index,
            mortarStats(hit.level).hitEffect,
            hit.at,
            iso(hit.x, hit.y),
          );
        if (history?.destroyedAt !== undefined)
          effect(tower.id, 'destroy', 0, 'Building Destroyed', history.destroyedAt, p);
      }
    }
    if (battle) this.homeEffects = [];
    else {
      this.homeEffects = this.homeEffects.filter((e) => elapsed - e.at < 1 && wanted.has(e.id));
      for (const e of this.homeEffects)
        effect(e.id, `home-${e.kind}`, e.index, mortarHandlingEffect(e.kind), e.at, iso(e.x, e.y));
    }
    for (const [id, view] of this.towers)
      if (!wanted.has(id)) {
        view.destroy();
        this.towers.delete(id);
        this.signatures.delete(id);
      }
    this.fx.sweep();
    for (const map of [this.projectiles, this.shadows])
      for (const [key, view] of map)
        if (!flying.has(key)) {
          view.destroy();
          map.delete(key);
        }
    return cues;
  }
}
