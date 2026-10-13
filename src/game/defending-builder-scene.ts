import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { Building } from './model';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { SampleCue } from './sample-audio';
import { NativeSceneView } from './native-scene-view';
import { defendingBuilderLayers } from './defending-builder-poses';

/**
 * Defending Builders in the late campaign scene: the original worker body and its ground shadow,
 * sorted at the projected ground point like ground garrison troops. The worker graph is preloaded
 * with the other character graphs (garrison-scene.ts). No original repair sounds are imported.
 */
export class DefendingBuilderPresentation implements LatePresentation {
  private views = new Map<number, { body: NativeSceneView; shadow: NativeSceneView }>();
  constructor(
    private scene: Phaser.Scene,
    _audio?: AudioManager,
  ) {}
  handles(_building: Building) {
    return false;
  }
  bounds(_building: Building) {
    return undefined;
  }
  render({ battle, reduced, iso }: LateRenderContext): SampleCue[] {
    const wanted = new Set<number>();
    for (const builder of battle?.late?.defendingBuilder?.builders ?? []) {
      const layers = defendingBuilderLayers(builder, battle!, reduced);
      if (!layers) continue;
      wanted.add(builder.id);
      let views = this.views.get(builder.id);
      if (!views) {
        views = {
          body: new NativeSceneView(this.scene, layers.prefix),
          shadow: new NativeSceneView(this.scene, layers.prefix),
        };
        this.views.set(builder.id, views);
      }
      const point = iso(builder.x, builder.y);
      views.shadow.render(layers.shadow, point.x, point.y, point.y + 1.05);
      views.body.render(layers.body, point.x, point.y, point.y + 1.1);
      for (const object of views.body.objects) object.setData('defendingBuilder', builder.id);
    }
    for (const [id, views] of this.views)
      if (!wanted.has(id)) {
        views.body.destroy();
        views.shadow.destroy();
        this.views.delete(id);
      }
    return [];
  }
  clear() {
    for (const views of this.views.values()) {
      views.body.destroy();
      views.shadow.destroy();
    }
    this.views.clear();
  }
  destroy() {
    this.clear();
  }
}
