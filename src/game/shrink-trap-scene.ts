import Phaser from 'phaser';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive, presentationTime } from './presentation-clock';
import { SHRINK_TRAP } from './shrink-trap';
import { preloadNativeMeshes } from './native-mesh-scene';
import { SHRINK_ART } from './shrink-trap-art';
import {
  shrinkArtLoaded,
  shrinkGraph,
  SHRINK_SOUNDS,
  shrinkSample,
  shrinkTrapPoses,
  shrinkEffectPoses,
  shrinkSoundCues,
} from './shrink-trap-poses';
import type { Battle, Building } from './model';
import type { AudioManager } from './audio';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';

/** Source rate of the spring animation: the body is a still outside it. */

export function preloadShrinkTraps(scene: Phaser.Scene) {
  scene.load.image(SHRINK_ART.texture, SHRINK_ART.asset);
  preloadNativeMeshes(scene, shrinkGraph(), 'shrink-trap');
  for (const [path, sound] of Object.entries(SHRINK_SOUNDS))
    scene.load.binary(shrinkSample(path), '/' + sound.path);
}
export class ShrinkTrapPresentation {
  readonly bodies = new Map<number, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, 'shrink-trap', 'nativeShrinkEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(SHRINK_SOUNDS))
      registerCachedSample(scene, audio.samples, shrinkSample(path));
  }
  clear() {
    this.fx.clear();
    for (const view of this.bodies.values()) view.destroy();
    this.bodies.clear();
    this.signatures.clear();
  }
  destroy() {
    this.clear();
  }
  render(
    buildings: Building[],
    battle: Battle | null,
    reduced: boolean,
    iso: (x: number, y: number) => { x: number; y: number },
  ) {
    // Nothing draws until the Shrink Trap family (graph first) has loaded.
    if (!shrinkArtLoaded()) return [];
    const graph = shrinkGraph(),
      triggerFps = graph.clips[graph.exports.Shrink_trap_trigger]?.fps ?? 1;
    const bodies = new Set<number>(),
      cues: SampleCue[] = [];
    // Transient springs, bursts and cues play out on the presentation clock after the finish.
    const live = presentationLive(battle);
    const elapsed = battle ? (live ? presentationTime(battle) : battle.elapsed) : 0;
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const trap of buildings) {
      if (trap.npc !== 'shrink-trap') continue;
      bodies.add(trap.id);
      const state = battle?.traps[trap.id];
      const point = iso(trap.x + 1, trap.y + 1);
      let view = this.bodies.get(trap.id);
      if (!view) this.bodies.set(trap.id, (view = new NativeSceneView(this.scene, 'shrink-trap')));
      // Mirrors shrinkTrapPoses: a still armed/unarmed body, plus the spring while it plays.
      const finished = !!battle?.finished && !live;
      const age = state ? Math.max(0, elapsed - state.activatedAt) : 0;
      const spring =
        state && !finished && !reduced && age < SHRINK_TRAP.delay
          ? Math.floor(age * triggerFps + 1e-9)
          : -1;
      const signature = `${state ? 1 : 0}:${spring}:${point.x}:${point.y}:${zoom}`;
      if (this.signatures.get(trap.id) !== signature) {
        this.signatures.set(trap.id, signature);
        view.render(shrinkTrapPoses(state, elapsed, reduced, finished), point.x, point.y, point.y);
        const data = { id: trap.id, activated: !!state };
        for (const object of view.objects) object.setData('nativeShrinkTrap', data);
      }
      if (!battle || !live || !state) continue;
      if (cueAudible(state.activatedAt, elapsed)) cues.push(...shrinkSoundCues(trap.id, state));
      for (const fx of shrinkEffectPoses(trap.id, state, elapsed, point, reduced))
        this.fx.show(fx, { id: trap.id });
    }
    for (const [id, view] of this.bodies)
      if (!bodies.has(id)) {
        view.destroy();
        this.bodies.delete(id);
        this.signatures.delete(id);
      }
    this.fx.sweep();
    return cues;
  }
}
