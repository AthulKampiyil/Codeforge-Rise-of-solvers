import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { Building } from './model';
import { preloadNativeMeshes } from './native-mesh-scene';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive } from './presentation-clock';
import { guardRender } from './render-guard';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { TORNADO_TRAP_ART, tornadoTrapAsset, tornadoTrapTexture } from './tornado-trap-art';
import {
  TORNADO_DEPTH,
  TORNADO_GRAPH,
  TORNADO_SOUNDS,
  TORNADO_VFX_GRAPH,
  tornadoBodyFrame,
  tornadoBodyPose,
  tornadoEffectPoses,
  tornadoSample,
  tornadoSoundCues,
} from './tornado-trap-poses';

const PREFIX = 'tornado-trap',
  VFX_PREFIX = 'tornado-trap-vfx';

export function preloadTornadoTrap(scene: Phaser.Scene) {
  for (const level of [1, 2]) scene.load.image(tornadoTrapTexture(level), tornadoTrapAsset(level));
  preloadNativeMeshes(scene, TORNADO_GRAPH, PREFIX);
  preloadNativeMeshes(scene, TORNADO_VFX_GRAPH, VFX_PREFIX);
  for (const [path, sound] of Object.entries(TORNADO_SOUNDS))
    scene.load.binary(tornadoSample(path), '/' + sound.path);
}

/** State-driven presentation; rendering reads battle histories so replay seeks stay exact. */
export class TornadoTrapPresentation implements LatePresentation {
  readonly bodies = new Map<number, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, VFX_PREFIX, 'nativeTornadoEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(TORNADO_SOUNDS))
      registerCachedSample(scene, audio.samples, tornadoSample(path));
  }
  /** Every Tornado Trap body is drawn from the retained source graph. */
  handles(b: Building) {
    return b.kind === 'tornadotrap';
  }
  bounds(b: Building): readonly [number, number, number, number] | undefined {
    if (!this.handles(b)) return undefined;
    const { scale, anchorX, anchorY, bounds } = TORNADO_TRAP_ART;
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
      const vortex = battle?.late?.tornadoTrap?.vortices[trap.id];
      const point = iso(trap.x + 0.5, trap.y + 0.5);
      const key = `tornado trap level ${trap.level}`;
      // The 24 fps source loop is sampled at display rate: redraw only on a new source frame.
      const frame = guardRender(
        key,
        () => tornadoBodyFrame(trap.level, vortex, bodyTime, reduced, battle?.finished),
        undefined,
      );
      let view = this.bodies.get(trap.id);
      if (!view) this.bodies.set(trap.id, (view = new NativeSceneView(this.scene, PREFIX)));
      const signature = frame
        ? `${frame.export}:${frame.time}:${frame.ground}:${point.x}:${point.y}:${zoom}`
        : '';
      if (frame && this.signatures.get(trap.id) !== signature) {
        const body = guardRender(
          key,
          () => tornadoBodyPose(trap.level, vortex, bodyTime, reduced, battle?.finished),
          undefined,
        );
        view.render(
          body?.poses ?? [],
          point.x,
          point.y,
          frame.ground ? TORNADO_DEPTH.whirl : point.y,
        );
        const data = { id: trap.id, export: frame.export };
        for (const object of view.objects) object.setData('nativeTornadoTrap', data);
        this.signatures.set(trap.id, signature);
      }
      if (!battle || !live || !vortex) continue;
      if (cueAudible(Math.max(vortex.activatedAt, vortex.castAt), elapsed))
        cues.push(...tornadoSoundCues(vortex));
      for (const fx of tornadoEffectPoses(vortex, elapsed, point, reduced))
        this.fx.show(
          fx,
          { id: trap.id },
          fx.emitter === 'gen_appear_fx' || fx.emitter === 'Grass' ? PREFIX : VFX_PREFIX,
        );
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
