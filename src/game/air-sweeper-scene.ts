import Phaser from 'phaser';
import type { AudioManager } from './audio';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive, presentationTime } from './presentation-clock';
import { guardRender } from './render-guard';
import type { Battle, Building } from './model';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { preloadNativeMeshes } from './native-mesh-scene';
import { SWEEPER_ART_LEVELS, sweeperAsset, sweeperTexture } from './air-control-art';
import { sweeperArtLoaded, sweeperGraph, sweeperPose, sweeperPoses } from './air-sweeper-poses';
import {
  SWEEPER_SOUNDS,
  sweeperSample,
  sweeperSoundCues,
  sweeperEffectPoses,
  sweeperHandlingEffect,
  type SweeperHandling,
} from './air-sweeper-effects';

export function preloadSweepers(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, sweeperGraph(), 'airsweeper');
  for (const level of SWEEPER_ART_LEVELS)
    for (let direction = 0; direction < 8; direction++)
      scene.load.image(sweeperTexture(level, direction), sweeperAsset(level, direction));
  for (const [path, sound] of Object.entries(SWEEPER_SOUNDS))
    scene.load.binary(sweeperSample(path), '/' + sound.path);
}

export class SweeperPresentation {
  readonly towers = new Map<number, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  private homeSequence = 0;
  private homeEffects: {
    id: number;
    index: number;
    kind: SweeperHandling;
    at: number;
    x: number;
    y: number;
  }[] = [];
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, 'airsweeper', 'nativeSweeperEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(SWEEPER_SOUNDS))
      registerCachedSample(scene, audio.samples, sweeperSample(path));
  }
  handling(id: number, kind: SweeperHandling | 'cancel', at: number, x: number, y: number) {
    if (kind === 'cancel') this.homeEffects = this.homeEffects.filter((e) => e.id !== id);
    else {
      this.homeEffects.push({ id, index: ++this.homeSequence, kind, at, x, y });
      if (this.homeEffects.length > 16) this.homeEffects.shift();
    }
  }
  clear() {
    this.fx.clear();
    for (const map of [this.towers]) {
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
    // Nothing draws until the Air Sweeper family (graph first) has loaded.
    if (!sweeperArtLoaded()) return [];
    const live = presentationLive(battle);
    // After the finish, transient effects keep sampling on the presentation clock.
    if (battle) elapsed = presentationTime(battle);
    const wanted = new Set<number>(),
      cues: SampleCue[] = [];
    const effect = (
      id: number,
      event: string,
      index: number,
      name: string,
      at: number,
      point: { x: number; y: number },
    ) => {
      if (cueAudible(at, elapsed)) cues.push(...sweeperSoundCues(id, event, index, name, at));
      for (const fx of sweeperEffectPoses(id, event, index, name, at, elapsed, point, reduced))
        this.fx.show(fx);
    };
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const tower of buildings) {
      if (tower.kind !== 'airsweeper') continue;
      wanted.add(tower.id);
      const p = iso(tower.x + 1, tower.y + 1),
        pose = sweeperPose(tower, battle, elapsed, reduced);
      let view = this.towers.get(tower.id);
      if (!view) this.towers.set(tower.id, (view = new NativeSceneView(this.scene, 'airsweeper')));
      const signature = `${tower.level}:${pose.state}:${pose.turret}:${pose.sector}:${pose.loading}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(tower.id) !== signature) {
        view.render(
          guardRender(
            `Air Sweeper level ${tower.level}`,
            () => sweeperPoses(tower.level, pose),
            [],
          ),
          p.x,
          p.y,
          p.y + (pose.state === 'ruin' ? -2 : 0),
        );
        for (const object of view.objects)
          object.setData('nativeSweeper', { id: tower.id, level: tower.level, ...pose });
        this.signatures.set(tower.id, signature);
      }
      if (battle && live) {
        const history = battle.airSweepers?.[tower.id];
        for (const shot of history?.shots ?? [])
          effect(
            tower.id,
            'attack',
            shot.index,
            'Wind Machine Attack',
            shot.at,
            iso(shot.x, shot.y),
          );
        if (history?.destroyedAt !== undefined)
          effect(tower.id, 'destroy', 0, 'Building Destroyed', history.destroyedAt, p);
      }
    }
    if (battle) this.homeEffects = [];
    else {
      this.homeEffects = this.homeEffects.filter((e) => elapsed - e.at < 1 && wanted.has(e.id));
      for (const e of this.homeEffects)
        effect(e.id, `home-${e.kind}`, e.index, sweeperHandlingEffect(e.kind), e.at, iso(e.x, e.y));
    }
    for (const [id, view] of this.towers)
      if (!wanted.has(id)) {
        view.destroy();
        this.towers.delete(id);
        this.signatures.delete(id);
      }
    this.fx.sweep();
    return cues;
  }
}
