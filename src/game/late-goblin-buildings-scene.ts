import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { Building } from './model';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { BUILDINGS } from './data';
import { preloadNativeMeshes } from './native-mesh-scene';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import type { NativeParticlePose } from './native-particles';
import { presentationLive } from './presentation-clock';
import { guardRender } from './render-guard';
import { LATE_GOBLIN_BUILDING_ART } from './late-goblin-buildings-art';
import {
  LATE_GOBLIN_ARROW_GRAPH,
  LATE_GOBLIN_GRAPH,
  goblinArrowPose,
  goblinBombPose,
  lateGoblinBasePoses,
  lateGoblinBodyPoses,
  lateGoblinBounds,
  lateGoblinPose,
  presentedLateFlight,
} from './late-goblin-buildings-poses';
import {
  GOBLIN_WEAPONS,
  goblinBuildingArt,
  isLateGoblinIdentity,
  type LateGoblinIdentity,
} from './late-goblin-buildings-stats';
import {
  LATE_GOBLIN_EFFECT_PLAYER,
  LATE_GOBLIN_SOUNDS,
  goblinBombTrailPoses,
  lateGoblinSample,
} from './late-goblin-buildings-effects';

const PREFIX = 'late-goblin';
const ARROW_PREFIX = 'late-goblin-arrow';
/** Ground shadows sort under every y-sorted object, like the Bomb Tower and Seeking Mine ones. */
const SHADOW_DEPTH = -869;

export function preloadLateGoblinBuildings(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, LATE_GOBLIN_GRAPH, PREFIX);
  preloadNativeMeshes(scene, LATE_GOBLIN_ARROW_GRAPH, ARROW_PREFIX);
  for (const art of Object.values(LATE_GOBLIN_BUILDING_ART))
    scene.load.image(art.texture, art.asset);
  for (const [path, sound] of Object.entries(LATE_GOBLIN_SOUNDS))
    scene.load.binary(lateGoblinSample(path), '/' + sound.path);
}

/** State-driven presentation; rendering reads battle histories so replay seeks stay exact. */
export class LateGoblinBuildingsPresentation implements LatePresentation {
  readonly bases = new Map<number, NativeSceneView>();
  readonly bodies = new Map<number, NativeSceneView>();
  readonly projectiles = new Map<string, NativeSceneView>();
  readonly shadows = new Map<string, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<string, string>();
  /** One data object per projectile, updated in place. */
  private projectileData = new Map<string, { id: string; progress: number }>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, PREFIX, 'lateGoblinEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(LATE_GOBLIN_SOUNDS))
      registerCachedSample(scene, audio.samples, lateGoblinSample(path));
  }
  /** True once this family renders the building itself (the fallback sprite is hidden). */
  handles(b: Building) {
    return isLateGoblinIdentity(b.npc);
  }
  bounds(b: Building): readonly [number, number, number, number] | undefined {
    return isLateGoblinIdentity(b.npc)
      ? guardRender<readonly [number, number, number, number] | undefined>(
          `${b.npc} level ${b.level}`,
          () => lateGoblinBounds(b),
          undefined,
        )
      : undefined;
  }
  private view<K>(map: Map<K, NativeSceneView>, key: K, prefix = PREFIX) {
    let view = map.get(key);
    if (!view) map.set(key, (view = new NativeSceneView(this.scene, prefix)));
    return view;
  }
  private tag(view: NativeSceneView, name: string, id: string, progress: number) {
    let data = this.projectileData.get(id);
    if (!data) this.projectileData.set(id, (data = { id, progress }));
    data.progress = progress;
    for (const object of view.objects)
      if (object.getData(name) !== data) object.setData(name, data);
  }
  render(context: LateRenderContext): SampleCue[] {
    const { battle, elapsed, reduced, iso, airLift } = context;
    const wanted = new Set<number>(),
      flying = new Set<string>(),
      cues: SampleCue[] = [];
    // Transient effects and projectiles play on the presentation clock through the finish
    // grace; building bodies hold the simulation clock so they stop with the battle.
    const live = presentationLive(battle);
    const bodyTime = battle ? battle.elapsed : elapsed;
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    const drawEffects = (poses: NativeParticlePose[], air = false) => {
      for (const fx of poses) {
        // Bursts raised onto a flying troop sort in front of it, not at its ground depth.
        if (air) fx.depth = 8000;
        this.fx.show(fx);
      }
    };
    const effect = (
      id: number,
      event: string,
      index: number,
      name: string,
      at: number,
      point: { x: number; y: number },
      air = false,
    ) => {
      if (cueAudible(at, elapsed))
        cues.push(...LATE_GOBLIN_EFFECT_PLAYER.cues(id, event, index, name, at));
      drawEffects(
        LATE_GOBLIN_EFFECT_PLAYER.poses(id, event, index, name, at, elapsed, point, reduced),
        air,
      );
    };
    for (const b of context.buildings) {
      if (!isLateGoblinIdentity(b.npc)) continue;
      wanted.add(b.id);
      const npc: LateGoblinIdentity = b.npc;
      const size = BUILDINGS[b.kind].size,
        p = iso(b.x + size / 2, b.y + size / 2);
      const key = `${npc} level ${b.level}`;
      const pose = guardRender(key, () => lateGoblinPose(b, battle, bodyTime, reduced), undefined);
      if (!pose) continue;
      const place = `${p.x}:${p.y}:${zoom}`;
      const baseKey = `base:${b.id}`,
        baseSignature = `${npc}:${b.level}:${pose.state}:${place}`;
      if (this.signatures.get(baseKey) !== baseSignature) {
        this.view(this.bases, b.id).render(
          guardRender(key, () => lateGoblinBasePoses(pose), []),
          p.x,
          p.y,
          -880,
        );
        this.signatures.set(baseKey, baseSignature);
      }
      const bodyKey = `body:${b.id}`,
        bodySignature = `${baseSignature}:${pose.frame}:${pose.flag}`;
      if (this.signatures.get(bodyKey) !== bodySignature) {
        const view = this.view(this.bodies, b.id);
        view.render(
          guardRender(key, () => lateGoblinBodyPoses(pose), []),
          p.x,
          p.y,
          p.y + (pose.state === 'ruin' ? -2 : 0),
        );
        const data = { id: b.id, npc, level: b.level, state: pose.state, frame: pose.frame };
        for (const object of view.objects) object.setData('lateGoblinBuilding', data);
        this.signatures.set(bodyKey, bodySignature);
      }
      if (!battle || !live) continue;
      const state = battle.late?.goblinBuildings;
      const destroyedAt = state?.destroyed[b.id];
      if (destroyedAt !== undefined) {
        const art = guardRender(key, () => goblinBuildingArt(npc, b.level), undefined);
        if (art) effect(b.id, 'destroy', 0, art.destroyEffect, destroyedAt, p);
      }
      const weapon = state?.weapons[b.id];
      if (!weapon) continue;
      const source = GOBLIN_WEAPONS[weapon.kind].source;
      if (weapon.activatedAt !== undefined && source.activationEffect)
        effect(b.id, 'activate', 0, source.activationEffect, weapon.activatedAt, p);
      for (const shot of weapon.shots) {
        if (cueAudible(shot.at, elapsed))
          cues.push(
            ...LATE_GOBLIN_EFFECT_PLAYER.cues(
              b.id,
              'attack',
              shot.index,
              source.attackEffect,
              shot.at,
            ),
          );
        if (weapon.kind === 'goblin-boss-th' && !reduced)
          drawEffects(
            goblinBombTrailPoses({ ...shot, sourceId: b.id, launched: shot.at }, elapsed, iso),
          );
      }
      for (const hit of weapon.hits) {
        const ground = iso(hit.x, hit.y);
        effect(
          b.id,
          'hit',
          hit.index,
          source.hitEffect,
          hit.at,
          { x: ground.x, y: ground.y - (hit.toAir ? airLift : 0) },
          hit.toAir,
        );
      }
    }
    if (battle && live && !reduced)
      for (const flight of battle.late?.goblinBuildings?.projectiles ?? []) {
        const weapon = battle.late!.goblinBuildings!.weapons[flight.sourceId];
        if (!weapon || elapsed < flight.launched) continue;
        // After the finish the simulation no longer steps or lands projectiles.
        const shot = battle.finished ? presentedLateFlight(flight, elapsed) : flight;
        if (!shot) continue;
        flying.add(shot.id);
        if (weapon.kind === 'goblin-hall') {
          const pose = goblinArrowPose(shot, elapsed, iso, shot.toAir ? airLift + 8 : 16);
          const view = this.view(this.projectiles, shot.id, ARROW_PREFIX);
          view.render(pose.poses, pose.x, pose.y, 8000);
          this.tag(view, 'lateGoblinArrow', shot.id, pose.progress);
        } else {
          const pose = goblinBombPose(shot, elapsed, iso);
          const view = this.view(this.projectiles, shot.id);
          view.render(pose.poses, pose.x, pose.y, 8000);
          this.view(this.shadows, shot.id).render(
            pose.shadow,
            pose.ground.x,
            pose.ground.y,
            SHADOW_DEPTH,
          );
          this.tag(view, 'lateGoblinBomb', shot.id, pose.t);
        }
      }
    for (const [map, keep] of [
      [this.bases, wanted],
      [this.bodies, wanted],
    ] as const)
      for (const [id, view] of map)
        if (!keep.has(id)) {
          view.destroy();
          map.delete(id);
          this.signatures.delete(`${map === this.bases ? 'base' : 'body'}:${id}`);
        }
    for (const map of [this.projectiles, this.shadows])
      for (const [key, view] of map)
        if (!flying.has(key)) {
          view.destroy();
          map.delete(key);
          this.projectileData.delete(key);
        }
    this.fx.sweep();
    return cues;
  }
  clear() {
    this.fx.clear();
    for (const map of [this.bases, this.bodies, this.projectiles, this.shadows]) {
      for (const view of map.values()) view.destroy();
      map.clear();
    }
    this.signatures.clear();
    this.projectileData.clear();
  }
  destroy() {
    this.clear();
  }
}
