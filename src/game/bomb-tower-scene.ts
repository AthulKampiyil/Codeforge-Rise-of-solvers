import type { AudioManager } from './audio';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive, presentationProjectiles, presentationTime } from './presentation-clock';
import { guardRender } from './render-guard';
import {
  BOMB_TOWER_PARTICLES,
  BOMB_TOWER_SOUNDS,
  bombTowerSample,
  bombTowerSoundCues,
  bombTowerEffectPoses,
  bombTowerTrailPoses,
  bombTowerHitEffect,
  bombTowerDestroyedEffect,
  bombTowerHandlingCues,
  bombTowerHandlingPoses,
  type BombTowerHandling,
  type BombTowerEffectPose,
} from './bomb-tower-effects';
import Phaser from 'phaser';
import type { Battle, Building } from './model';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { preloadNativeMeshes } from './native-mesh-scene';
import { BOMB_TOWER_ART_LEVELS, bombTowerAsset, bombTowerTexture } from './bomb-tower-art';
import {
  bombTowerArtLoaded,
  bombTowerGraph,
  bomberGraph,
  bomberPose,
  bomberPoses,
  bombTowerPoses,
  bombProjectilePose,
  bombTowerDeathPoses,
  type BombTowerVisualState,
} from './bomb-tower-poses';
import { battleBuilding } from './battle-index';

export function preloadBombTowers(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, bombTowerGraph(), 'bombtower');
  preloadNativeMeshes(scene, bomberGraph(), 'bomber');
  preloadNativeMeshes(scene, BOMB_TOWER_PARTICLES, 'bombtower-effects');
  for (const [path, sound] of Object.entries(BOMB_TOWER_SOUNDS))
    scene.load.binary(bombTowerSample(path), '/' + sound.path);
  // Level one is loaded by the common building catalog.
  for (const level of BOMB_TOWER_ART_LEVELS)
    if (level > 1) scene.load.image(bombTowerTexture(level), bombTowerAsset(level));
}

export class BombTowerPresentation {
  readonly towers = new Map<number, NativeSceneView>();
  readonly defenders = new Map<number, NativeSceneView>();
  readonly bombs = new Map<number, NativeSceneView>();
  readonly projectiles = new Map<string, NativeSceneView>();
  readonly shadows = new Map<string, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<string, string>();
  private homeSequence = 0;
  private homeEffects: {
    id: number;
    index: number;
    kind: BombTowerHandling;
    at: number;
    x: number;
    y: number;
  }[] = [];
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, 'bombtower-effects', 'nativeBombTowerEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(BOMB_TOWER_SOUNDS))
      registerCachedSample(scene, audio.samples, bombTowerSample(path));
  }
  handling(id: number, kind: BombTowerHandling | 'cancel', at: number, x: number, y: number) {
    if (kind === 'cancel') this.homeEffects = this.homeEffects.filter((v) => v.id !== id);
    else {
      this.homeEffects.push({ id, index: ++this.homeSequence, kind, at, x, y });
      if (this.homeEffects.length > 16) this.homeEffects.shift();
    }
  }
  clear() {
    for (const map of [this.towers, this.defenders, this.bombs, this.projectiles, this.shadows]) {
      for (const view of map.values()) view.destroy();
      map.clear();
    }
    this.fx.clear();
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
    // Nothing draws until the Bomb Tower family (graphs first) has loaded.
    if (!bombTowerArtLoaded()) return [];
    const live = presentationLive(battle);
    // After the finish, bombs in flight and blasts keep sampling on the presentation clock.
    if (battle) elapsed = presentationTime(battle);
    const wanted = new Set<number>(),
      defending = new Set<number>(),
      bombing = new Set<number>(),
      flying = new Set<string>();
    const cues: SampleCue[] = [];
    const drawEffects = (poses: BombTowerEffectPose[]) => {
      for (const fx of poses) this.fx.show(fx);
    };
    const sound = (id: number, event: string, index: number, effect: string, at: number) => {
      if (cueAudible(at, elapsed)) cues.push(...bombTowerSoundCues(id, event, index, effect, at));
    };
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const tower of buildings) {
      if (tower.kind !== 'bombtower') continue;
      wanted.add(tower.id);
      const p = iso(tower.x + 1.5, tower.y + 1.5);
      const state: BombTowerVisualState =
        tower.hp <= 0
          ? 'ruin'
          : tower.constructing
            ? 'constructing'
            : tower.upgradeEnd
              ? 'upgrading'
              : 'setup';
      let view = this.towers.get(tower.id);
      if (!view) this.towers.set(tower.id, (view = new NativeSceneView(this.scene, 'bombtower')));
      const key = `tower:${tower.id}`,
        signature = `${tower.level}:${state}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(key) !== signature) {
        view.render(
          guardRender(
            `Bomb Tower level ${tower.level}`,
            () => bombTowerPoses(tower.level, state),
            [],
          ),
          p.x,
          p.y,
          p.y + (state === 'ruin' ? -2 : 0),
        );
        for (const object of view.objects)
          object.setData('nativeBombTower', { id: tower.id, state, level: tower.level });
        this.signatures.set(key, signature);
      }
      if (state === 'setup' || state === 'upgrading') {
        defending.add(tower.id);
        const pose = bomberPose(tower, battle, elapsed, reduced);
        let actor = this.defenders.get(tower.id);
        if (!actor)
          this.defenders.set(tower.id, (actor = new NativeSceneView(this.scene, 'bomber')));
        const key = `defender:${tower.id}`,
          signature = `${tower.level}:${pose.action}:${pose.direction}:${pose.flip}:${Math.floor(pose.time * 24 + 1e-9)}:${p.x}:${p.y}:${reduced}:${zoom}`;
        if (this.signatures.get(key) !== signature) {
          actor.render(bomberPoses(tower.level, pose, reduced), p.x, p.y, p.y + 0.1);
          for (const object of actor.objects)
            object.setData('nativeBomber', { id: tower.id, ...pose });
          this.signatures.set(key, signature);
        }
      }
      const bomb = battle?.deathBombs?.[tower.id];
      if (bomb && !bomb.resolved && !bomb.cancelled && !battle!.finished) {
        bombing.add(tower.id);
        let charge = this.bombs.get(tower.id);
        if (!charge)
          this.bombs.set(tower.id, (charge = new NativeSceneView(this.scene, 'bombtower')));
        const age = Math.max(0, elapsed - bomb.armedAt);
        const key = `bomb:${tower.id}`,
          signature = `${tower.level}:${Math.floor((reduced ? 0 : age) * 30 + 1e-9)}:${p.x}:${p.y}:${zoom}`;
        if (this.signatures.get(key) !== signature) {
          charge.render(bombTowerDeathPoses(tower.level, age, reduced), p.x, p.y, p.y + 0.5);
          for (const object of charge.objects) object.setData('nativeDeathBomb', { id: tower.id });
          this.signatures.set(key, signature);
        }
      }
      if (battle && live) {
        const state = battle.bombTowers?.[tower.id];
        for (const shot of state?.shots ?? []) {
          sound(tower.id, 'throw', shot.index, 'Bomb Tower Throw Start', shot.at);
          if (!reduced) drawEffects(bombTowerTrailPoses(tower.id, tower.level, shot, elapsed, iso));
        }
        for (const hit of state?.hits ?? []) {
          const effect = bombTowerHitEffect(tower.level);
          sound(tower.id, 'hit', hit.index, effect, hit.at);
          drawEffects(
            bombTowerEffectPoses(
              tower.id,
              'hit',
              hit.index,
              effect,
              hit.at,
              elapsed,
              iso(hit.x, hit.y),
              reduced,
            ),
          );
        }
        if (state?.destroyedAt !== undefined) {
          const effect = bombTowerDestroyedEffect(tower.level, !!bomb);
          sound(tower.id, 'destroy', 0, effect, state.destroyedAt);
          drawEffects(
            bombTowerEffectPoses(
              tower.id,
              'destroy',
              0,
              effect,
              state.destroyedAt,
              elapsed,
              p,
              reduced,
            ),
          );
        }
        if (bomb?.resolved && !bomb.cancelled) {
          sound(tower.id, 'explode', 0, 'Bomb Tower Explode', bomb.impact);
          drawEffects(
            bombTowerEffectPoses(
              tower.id,
              'explode',
              0,
              'Bomb Tower Explode',
              bomb.impact,
              elapsed,
              iso(bomb.x, bomb.y),
              reduced,
            ),
          );
        }
      }
    }
    if (battle) this.homeEffects = [];
    else {
      this.homeEffects = this.homeEffects.filter((v) => elapsed - v.at < 1 && wanted.has(v.id));
      for (const event of this.homeEffects) {
        cues.push(...bombTowerHandlingCues(event.id, event.index, event.kind, event.at));
        drawEffects(
          bombTowerHandlingPoses(
            event.id,
            event.index,
            event.kind,
            event.at,
            elapsed,
            iso(event.x, event.y),
            reduced,
          ),
        );
      }
    }
    if (battle && live && !reduced)
      for (const shot of presentationProjectiles(battle)) {
        if (shot.weapon !== 'towerbomb') continue;
        const tower = battleBuilding(battle, shot.sourceId);
        if (!tower) continue;
        flying.add(shot.id);
        const pose = bombProjectilePose(tower.level, shot, elapsed, iso);
        let view = this.projectiles.get(shot.id),
          shadow = this.shadows.get(shot.id);
        if (!view)
          this.projectiles.set(shot.id, (view = new NativeSceneView(this.scene, 'bombtower')));
        if (!shadow)
          this.shadows.set(shot.id, (shadow = new NativeSceneView(this.scene, 'bombtower')));
        view.render(pose.poses, pose.x, pose.y, 8000);
        // Ground shadows always draw under buildings like every other
        // projectile shadow; a y-sorted shadow would paint over buildings
        // standing further up-screen.
        shadow.render(pose.shadow, pose.ground.x, pose.ground.y, -869);
        for (const object of view.objects) {
          const data = object.getData('nativeBombProjectile');
          if (data?.id === shot.id) data.progress = pose.t;
          else object.setData('nativeBombProjectile', { id: shot.id, progress: pose.t });
        }
      }
    for (const [map, ids, prefix] of [
      [this.towers, wanted, 'tower'],
      [this.defenders, defending, 'defender'],
      [this.bombs, bombing, 'bomb'],
    ] as const)
      for (const [id, view] of map)
        if (!ids.has(id)) {
          view.destroy();
          map.delete(id);
          this.signatures.delete(`${prefix}:${id}`);
        }
    this.fx.sweep();
    for (const map of [this.projectiles, this.shadows])
      for (const [id, view] of map)
        if (!flying.has(id)) {
          view.destroy();
          map.delete(id);
        }
    return cues;
  }
}
