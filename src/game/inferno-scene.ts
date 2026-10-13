import { INFERNO_SOUNDS, infernoSample } from './inferno-sounds';
import type { AudioManager } from './audio';
import { infernoImpactPoses } from './inferno-effects';
import { TROOPS } from './data';
import { infernoBeamAlpha, infernoBeamPoses, infernoBeamProfile } from './inferno-beam';
import { infernoDamageStage, infernoStats } from './inferno-weapon';
import type Phaser from 'phaser';
import type { Battle, Building } from './model';
import { NativeSceneView, effectSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { preloadNativeMeshes } from './native-mesh-scene';
import { INFERNO_ROOT, infernoAsset, infernoTexture } from './inferno-art';
import { infernoArtLoaded, infernoGraph, infernoPoses } from './inferno-graph';
import { battleUnit } from './battle-index';
import { registerCachedSample } from './sample-audio';
import { presentationLive, presentationTime } from './presentation-clock';
import { guardRender } from './render-guard';

/** Beams span the map between tower and troop: draw them in the effect band, under labels. */
const BEAM_DEPTH = 8000;

export function preloadInfernos(scene: Phaser.Scene) {
  for (const [path, sound] of Object.entries(INFERNO_SOUNDS))
    scene.load.binary(infernoSample(path), '/' + sound.path);
  preloadNativeMeshes(scene, infernoGraph(), 'inferno');
  for (let level = 1; level <= 12; level++)
    for (const mode of ['single', 'multi'] as const)
      scene.load.image(infernoTexture(level, mode), infernoAsset(level, mode));
}

/** Distinct source clip rates of a level's tower exports (24 and/or 30 fps). */
const levelRates = new Map<number, number[]>();
function infernoRates(level: number) {
  let rates = levelRates.get(level);
  if (!rates) {
    const set = new Set<number>();
    for (const name of Object.values(infernoStats(level).art as Record<string, unknown>)) {
      if (typeof name !== 'string') continue;
      const id = infernoGraph().exports[name];
      const clip = id === undefined ? undefined : infernoGraph().clips[id];
      if (clip) set.add(clip.fps);
    }
    levelRates.set(level, (rates = [...set].sort()));
  }
  return rates;
}

export class InfernoPresentation {
  private fx: NativeEffectViews;
  /** Live impact/transition particle views by key (pooled; see NativeEffectViews). */
  readonly impacts: Map<string, NativeSceneView>;
  readonly beams = new Map<string, NativeSceneView>();
  readonly views = new Map<number, NativeSceneView>();
  private signatures = new Map<number, string>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, 'inferno', 'nativeInfernoImpact');
    this.impacts = this.fx.views;
    for (const path of Object.keys(INFERNO_SOUNDS))
      registerCachedSample(scene, audio.samples, infernoSample(path));
  }
  clear() {
    this.fx.clear();
    for (const view of this.beams.values()) view.destroy();
    this.beams.clear();
    for (const view of this.views.values()) view.destroy();
    this.views.clear();
    this.signatures.clear();
  }
  render(
    buildings: Building[],
    seconds: number,
    battle: Battle | null,
    reduced: boolean,
    iso: (x: number, y: number) => { x: number; y: number },
  ) {
    // Nothing draws until the Inferno family (graph first) has loaded.
    if (!infernoArtLoaded()) return;
    // Hit and transition bursts play out on the presentation clock after the finish.
    if (battle && presentationLive(battle))
      for (const pose of infernoImpactPoses(battle, reduced, iso, presentationTime(battle)))
        this.fx.show(pose);
    this.fx.sweep();
    const wanted = new Set<number>();
    const wantedBeams = new Set<string>();
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const building of buildings) {
      if (building.kind !== 'inferno') continue;
      wanted.add(building.id);
      let view = this.views.get(building.id);
      if (!view) {
        view = new NativeSceneView(this.scene, 'inferno');
        // Beam and body colors sit within 0..1: as a GPU tint they need no filter pass, whose
        // pooled framebuffer (created per beam size, dropped when idle) stalled whole frames.
        view.gpuGroupColor = true;
        // A tower body is over a hundred leaves, most sharing one draw state: draw them merged.
        view.mergeLeaves = true;
        this.views.set(building.id, view);
      }
      const point = iso(building.x + 1, building.y + 1);
      const state =
        building.hp <= 0
          ? 'ruin'
          : building.constructing
            ? 'constructing'
            : building.upgradeEnd
              ? 'upgrading'
              : (battle?.infernos?.[building.id]?.ammunition ??
                    (battle?.nativeInfernoAmmo ? building.infernoAmmo : undefined)) === 0
                ? 'empty'
                : 'active';
      const mode = building.infernoMode ?? 'single';
      // Source frames of the tower's clips: the body only changes when one of them advances.
      const frames = guardRender(
        `inferno level ${building.level}`,
        () => infernoRates(building.level).map((fps) => Math.floor(seconds * fps + 1e-9)),
        [],
      ).join(',');
      const signature = `${building.level}:${mode}:${state}:${frames}:${point.x}:${point.y}:${zoom}`;
      if (this.signatures.get(building.id) !== signature) {
        const poses = guardRender(
          `inferno level ${building.level}`,
          () => infernoPoses(building.level, mode, state, seconds, INFERNO_ROOT),
          [],
        );
        view.render(poses, point.x, point.y, point.y);
        for (const object of view.objects) {
          if (object.getData('nativeInferno') !== building.id)
            object.setData('nativeInferno', building.id);
          if (object.getData('nativeInfernoState') !== state)
            object.setData('nativeInfernoState', state);
        }
        this.signatures.set(building.id, signature);
      }
      const combat = battle?.infernos?.[building.id];
      // Beams are a sustained attack loop: they stop with the battle.
      if (
        state !== 'active' ||
        battle?.finished ||
        !combat ||
        (battle!.defenseStuns[building.id] ?? 0) >= battle!.elapsed
      )
        continue;
      combat.scheduler.slots.forEach((slot, index) => {
        const target = battleUnit(battle!, slot.targetId);
        if (!target || target.hp <= 0 || target.ejected) return;
        const key = `${building.id}:${index}`;
        const drawn = guardRender(
          `inferno beam level ${building.level}`,
          () => {
            const stage = infernoDamageStage(combat.scheduler.mode, slot.lockedMs, building.level);
            const profile = infernoBeamProfile(building.level, stage);
            const end = iso(target.x, target.y);
            const from = { x: point.x, y: point.y - profile.startZ * 1.2 };
            const to = { x: end.x, y: end.y - (TROOPS[target.kind].flying ? 46 : 0) };
            // The slot clock includes its acquisition tick; interpolate only the render
            // remainder. Keeping this derived from combat state makes pause/seek independent
            // of view creation.
            const acquiredAt = (combat.nextTick - 1 - slot.lockedMs / 64) * 0.064;
            return {
              alpha: infernoBeamAlpha(building.level, stage, battle!.elapsed - acquiredAt),
              poses: infernoBeamPoses(building.level, stage, seconds, from, to),
            };
          },
          null,
        );
        if (!drawn) return;
        wantedBeams.add(key);
        let beam = this.beams.get(key);
        if (!beam) this.beams.set(key, (beam = effectSceneView(this.scene, 'inferno')));
        beam.render(drawn.poses, 0, 0, BEAM_DEPTH, drawn.alpha);
      });
    }
    for (const [key, view] of this.beams)
      if (!wantedBeams.has(key)) {
        view.destroy();
        this.beams.delete(key);
      }
    for (const [id, view] of this.views)
      if (!wanted.has(id)) {
        view.destroy();
        this.views.delete(id);
        this.signatures.delete(id);
      }
  }
}
