import type Phaser from 'phaser';
import { NativeSceneView, effectSceneView } from './native-scene-view';
import type { NativeParticlePose } from './native-particles';

/** Parked views kept per layer for reuse; beyond this they are destroyed. */
const SPARE_LIMIT = 48;

/**
 * Keyed transient effect views (particles, trail births) with a reuse pool.
 *
 * Particles live a fraction of a second, and each used to get a fresh NativeSceneView (meshes,
 * blend buffers, a context-loss listener) that was destroyed when it expired. A retired view is
 * parked hidden instead and handed to the next particle: particles of the same emitter share
 * leaf keys, so its meshes and group buffers are reused as they are.
 *
 * `views` holds only the live effects (key → view), so callers and specs that read an
 * `effects` map keep working. Call `show` for every live particle during a frame, then `sweep`.
 */
export class NativeEffectViews {
  readonly views = new Map<string, NativeSceneView>();
  private spare: { prefix: string; view: NativeSceneView }[] = [];
  private prefixes = new WeakMap<NativeSceneView, string>();
  private shown = new Set<string>();
  private data = new Map<string, unknown>();
  constructor(
    private scene: Phaser.Scene,
    private prefix: string,
    /** `setData` name carrying `{ key, emitter, ...extra }` on every object of the effect. */
    private dataName: string,
  ) {}
  private acquire(prefix: string) {
    // Views are prefix-bound (texture keys); only reuse views of the same art.
    const index = this.spare.findIndex((entry) => entry.prefix === prefix);
    if (index >= 0) return this.spare.splice(index, 1)[0].view;
    const view = effectSceneView(this.scene, prefix);
    this.prefixes.set(view, prefix);
    return view;
  }
  private park(view: NativeSceneView) {
    if (this.spare.length >= SPARE_LIMIT) {
      view.destroy();
      return;
    }
    // Parked objects stay on the display list: hide them and drop their effect tag so
    // display-list scans only find live effects.
    for (const object of view.objects) {
      if (object.visible) object.setVisible(false);
      object.data?.remove(this.dataName);
    }
    this.spare.push({ prefix: this.prefixes.get(view) ?? this.prefix, view });
  }
  /** Renders one particle; `extra` fields join `{ key, emitter }` in its object data. */
  show(
    fx: Pick<NativeParticlePose, 'key' | 'emitter' | 'poses' | 'x' | 'y' | 'depth'>,
    extra?: Record<string, unknown>,
    prefix = this.prefix,
  ) {
    this.shown.add(fx.key);
    let view = this.views.get(fx.key);
    if (!view) this.views.set(fx.key, (view = this.acquire(prefix)));
    view.render(fx.poses, fx.x, fx.y, fx.depth);
    // One data object per effect key, attached only to objects that do not carry it yet.
    let value = this.data.get(fx.key);
    if (!value) this.data.set(fx.key, (value = { key: fx.key, emitter: fx.emitter, ...extra }));
    for (const object of view.objects)
      if (object.getData(this.dataName) !== value) object.setData(this.dataName, value);
  }
  /** True when `show` ran for this key since the last sweep. */
  has(key: string) {
    return this.shown.has(key);
  }
  /** Parks every effect that was not shown since the previous sweep. */
  sweep() {
    for (const [key, view] of this.views)
      if (!this.shown.has(key)) {
        this.views.delete(key);
        this.data.delete(key);
        this.park(view);
      }
    this.shown.clear();
  }
  clear() {
    for (const view of this.views.values()) view.destroy();
    for (const { view } of this.spare) view.destroy();
    this.views.clear();
    this.spare = [];
    this.shown.clear();
    this.data.clear();
  }
}
