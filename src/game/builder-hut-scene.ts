import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { Battle, Building } from './model';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { BUILDINGS } from './data';
import { preloadNativeMeshes } from './native-mesh-scene';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive } from './presentation-clock';
import { guardRender } from './render-guard';
import { armedBuilderHut } from './builder-hut';
import { builderHutAsset, builderHutTexture, BUILDER_HUT_ART_LEVELS } from './builder-hut-art';
import {
  BUILDER_HUT_GRAPH,
  builderHutBasePoses,
  builderHutBodyPoses,
  builderHutBounds,
  builderHutMuzzleHeight,
  builderHutNailPose,
  builderHutPose,
} from './builder-hut-poses';
import { presentedLateFlight } from './late-goblin-buildings-poses';
import { BUILDER_HUT_SOURCE, builderHutLevel, builderHutWeapon } from './builder-hut-stats';
import {
  BUILDER_HUT_EFFECT_PLAYER,
  BUILDER_HUT_SOUNDS,
  builderHutSample,
} from './builder-hut-effects';
import { battleBuilding } from './battle-index';

const PREFIX = 'builder-hut';

export function preloadBuilderHut(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, BUILDER_HUT_GRAPH, PREFIX);
  for (const level of BUILDER_HUT_ART_LEVELS)
    scene.load.image(builderHutTexture(level), builderHutAsset(level));
  for (const [path, sound] of Object.entries(BUILDER_HUT_SOUNDS))
    scene.load.binary(builderHutSample(path), '/' + sound.path);
}

/** State-driven presentation; rendering reads battle histories so replay seeks stay exact. */
export class BuilderHutPresentation implements LatePresentation {
  readonly bases = new Map<number, NativeSceneView>();
  readonly bodies = new Map<number, NativeSceneView>();
  readonly nails = new Map<string, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<string, string>();
  /** One data object per nail, updated in place. */
  private nailData = new Map<string, { id: string; progress: number; export: string }>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, PREFIX, 'builderHutEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(BUILDER_HUT_SOUNDS))
      registerCachedSample(scene, audio.samples, builderHutSample(path));
  }
  /** Campaign huts in version-44 late battles use original art; home huts keep their own sprite. */
  private battle(): Battle | null {
    return (
      (this.scene as Phaser.Scene & { model?: { battle: Battle | null } }).model?.battle ?? null
    );
  }
  /** True once this family renders the building itself (the fallback sprite is hidden). */
  handles(b: Building) {
    return armedBuilderHut(this.battle(), b);
  }
  bounds(b: Building): readonly [number, number, number, number] | undefined {
    return this.handles(b)
      ? guardRender<readonly [number, number, number, number] | undefined>(
          `builder hut level ${b.level}`,
          () => builderHutBounds(b),
          undefined,
        )
      : undefined;
  }
  private view<K>(map: Map<K, NativeSceneView>, key: K) {
    let view = map.get(key);
    if (!view) map.set(key, (view = new NativeSceneView(this.scene, PREFIX)));
    return view;
  }
  render(context: LateRenderContext): SampleCue[] {
    const { battle, elapsed, reduced, iso, airLift } = context;
    const wanted = new Set<number>(),
      flying = new Set<string>(),
      cues: SampleCue[] = [];
    // Transient effects and nails play on the presentation clock through the finish grace;
    // hut bodies hold the simulation clock so they stop with the battle.
    const live = presentationLive(battle);
    const bodyTime = battle ? battle.elapsed : elapsed;
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
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
        cues.push(...BUILDER_HUT_EFFECT_PLAYER.cues(id, event, index, name, at));
      for (const fx of BUILDER_HUT_EFFECT_PLAYER.poses(
        id,
        event,
        index,
        name,
        at,
        elapsed,
        point,
        reduced,
      )) {
        // Bursts raised onto a flying troop sort in front of it, not at its ground depth.
        if (air) fx.depth = 8000;
        this.fx.show(fx);
      }
    };
    for (const b of context.buildings) {
      if (!armedBuilderHut(battle, b)) continue;
      wanted.add(b.id);
      const size = BUILDINGS.builder.size,
        p = iso(b.x + size / 2, b.y + size / 2);
      const key = `builder hut level ${b.level}`;
      const pose = guardRender(key, () => builderHutPose(b, battle, bodyTime, reduced), undefined);
      if (!pose) continue;
      const place = `${p.x}:${p.y}:${zoom}`;
      const baseKey = `base:${b.id}`,
        baseSignature = `${b.level}:${pose.state === 'ruin'}:${place}`;
      if (this.signatures.get(baseKey) !== baseSignature) {
        this.view(this.bases, b.id).render(
          guardRender(key, () => builderHutBasePoses(pose), []),
          p.x,
          p.y,
          -880,
        );
        this.signatures.set(baseKey, baseSignature);
      }
      const bodyKey = `body:${b.id}`,
        bodySignature = `${b.level}:${pose.state}:${pose.root}:${pose.load}:${pose.turret}:${pose.ruin}:${place}`;
      if (this.signatures.get(bodyKey) !== bodySignature) {
        const view = this.view(this.bodies, b.id);
        view.render(
          guardRender(key, () => builderHutBodyPoses(pose), []),
          p.x,
          p.y,
          p.y + (pose.state === 'ruin' ? -2 : 0),
        );
        const data = { id: b.id, ...pose };
        for (const object of view.objects) object.setData('builderHut', data);
        this.signatures.set(bodyKey, bodySignature);
      }
      if (!battle || !live) continue;
      const state = battle.late?.builderHut;
      const destroyedAt = state?.destroyed[b.id];
      if (destroyedAt !== undefined) {
        const destroyEffect = guardRender(key, () => builderHutLevel(b.level).destroyEffect, '');
        if (destroyEffect) effect(b.id, 'destroy', 0, destroyEffect, destroyedAt, p);
      }
      const hut = state?.huts[b.id];
      const weapon = guardRender(key, () => builderHutWeapon(b.level), undefined);
      if (!hut || !weapon) continue;
      const muzzle = { x: p.x, y: p.y - builderHutMuzzleHeight(b.level) };
      for (const shot of hut.shots)
        effect(b.id, 'attack', shot.index, BUILDER_HUT_SOURCE.weapon.attackEffect, shot.at, muzzle);
      for (const hit of hut.hits) {
        const ground = iso(hit.x, hit.y);
        effect(
          b.id,
          'hit',
          hit.index,
          BUILDER_HUT_SOURCE.weapon.hitEffect,
          hit.at,
          { x: ground.x, y: ground.y - (hit.toAir ? airLift : 0) },
          hit.toAir,
        );
      }
    }
    if (battle && live && !reduced)
      for (const flight of battle.late?.builderHut?.projectiles ?? []) {
        const hut = battleBuilding(battle, flight.sourceId);
        if (!hut || elapsed < flight.launched) continue;
        if (
          !guardRender(
            `builder hut level ${hut.level}`,
            () => builderHutWeapon(hut.level),
            undefined,
          )
        )
          continue;
        // After the finish the simulation no longer steps or lands nails.
        const shot = battle.finished ? presentedLateFlight(flight, elapsed) : flight;
        if (!shot) continue;
        flying.add(shot.id);
        const pose = builderHutNailPose(
          shot,
          hut.level,
          elapsed,
          iso,
          shot.toAir ? airLift + 8 : 16,
        );
        const view = this.view(this.nails, shot.id);
        view.render(pose.poses, pose.x, pose.y, 8000);
        let data = this.nailData.get(shot.id);
        if (!data)
          this.nailData.set(
            shot.id,
            (data = { id: shot.id, progress: pose.progress, export: pose.export }),
          );
        data.progress = pose.progress;
        for (const object of view.objects)
          if (object.getData('builderHutNail') !== data) object.setData('builderHutNail', data);
      }
    for (const [map, prefix] of [
      [this.bases, 'base'],
      [this.bodies, 'body'],
    ] as const)
      for (const [id, view] of map)
        if (!wanted.has(id)) {
          view.destroy();
          map.delete(id);
          this.signatures.delete(`${prefix}:${id}`);
        }
    for (const [key, view] of this.nails)
      if (!flying.has(key)) {
        view.destroy();
        this.nails.delete(key);
        this.nailData.delete(key);
      }
    this.fx.sweep();
    return cues;
  }
  clear() {
    this.fx.clear();
    for (const map of [this.bases, this.bodies, this.nails]) {
      for (const view of map.values()) view.destroy();
      map.clear();
    }
    this.signatures.clear();
    this.nailData.clear();
  }
  destroy() {
    this.clear();
  }
}
