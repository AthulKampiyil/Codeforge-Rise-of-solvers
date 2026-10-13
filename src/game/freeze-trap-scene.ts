import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import { FREEZE_TRAP_ART, freezeTrapAsset, freezeTrapTexture } from './freeze-trap-art';
import {
  FREEZE_GRAPH,
  FREEZE_SOUNDS,
  freezeEffectPoses,
  freezeSample,
  freezeSoundCues,
  freezeTrapFrame,
  freezeTrapPoses,
} from './freeze-trap-poses';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { Building } from './model';
import { preloadNativeMeshes } from './native-mesh-scene';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive } from './presentation-clock';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';

const PREFIX = 'freeze-trap';

export function preloadFreezeTrap(scene: Phaser.Scene) {
  scene.load.image(freezeTrapTexture(1), freezeTrapAsset(1));
  preloadNativeMeshes(scene, FREEZE_GRAPH, PREFIX);
  for (const [path, sound] of Object.entries(FREEZE_SOUNDS))
    scene.load.binary(freezeSample(path), '/' + sound.path);
}

/** State-driven presentation; rendering reads battle histories so replay seeks stay exact. */
export class FreezeTrapPresentation implements LatePresentation {
  readonly bodies = new Map<number, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, PREFIX, 'nativeFreezeEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(FREEZE_SOUNDS))
      registerCachedSample(scene, audio.samples, freezeSample(path));
  }
  /** Every Goblin Freeze Trap body is drawn from the retained source graph. */
  handles(b: Building) {
    return b.npc === 'freeze-trap';
  }
  bounds(b: Building): readonly [number, number, number, number] | undefined {
    if (!this.handles(b)) return undefined;
    const { scale, anchorX, anchorY, bounds } = FREEZE_TRAP_ART;
    return [
      (bounds[0] - anchorX) * scale,
      (bounds[1] - anchorY) * scale,
      (bounds[2] - anchorX) * scale,
      (bounds[3] - anchorY) * scale,
    ];
  }
  render({ buildings, battle, elapsed, reduced, iso }: LateRenderContext): SampleCue[] {
    const bodies = new Set<number>(),
      cues: SampleCue[] = [];
    // Effects play on the presentation clock through the finish grace; bodies hold battle time.
    const live = presentationLive(battle);
    const bodyTime = battle ? battle.elapsed : elapsed;
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const trap of buildings) {
      if (!this.handles(trap)) continue;
      bodies.add(trap.id);
      const cast = battle?.late?.freezeTrap?.casts[trap.id];
      const point = iso(trap.x + 1, trap.y + 1);
      let view = this.bodies.get(trap.id);
      if (!view) this.bodies.set(trap.id, (view = new NativeSceneView(this.scene, PREFIX)));
      // Static outside the trigger window; the bottle redraws once per source frame.
      const frame = freezeTrapFrame(cast, bodyTime, reduced, battle?.finished);
      const signature = `${!!cast}:${frame}:${point.x}:${point.y}:${zoom}`;
      if (this.signatures.get(trap.id) !== signature) {
        view.render(
          freezeTrapPoses(cast, bodyTime, reduced, battle?.finished),
          point.x,
          point.y,
          point.y,
        );
        const data = { id: trap.id, activated: !!cast };
        for (const object of view.objects) object.setData('nativeFreezeTrap', data);
        this.signatures.set(trap.id, signature);
      }
      if (!battle || !live || !cast) continue;
      if (cueAudible(Math.max(cast.activatedAt, cast.castAt), elapsed))
        cues.push(...freezeSoundCues(cast));
      for (const fx of freezeEffectPoses(cast, elapsed, point, reduced))
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
  clear() {
    this.fx.clear();
    for (const view of this.bodies.values()) view.destroy();
    this.bodies.clear();
    this.signatures.clear();
  }
  destroy() {
    this.clear();
  }
}
