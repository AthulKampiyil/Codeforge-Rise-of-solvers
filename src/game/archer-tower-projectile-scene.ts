import type Phaser from 'phaser';
import type { Battle } from './model';
import type { CombatProjectile } from './projectiles';
import {
  ARCHER_TOWER_PROJECTILE_GRAPH,
  archerTowerProjectilePose,
} from './archer-tower-projectile';
import { preloadNativeMeshes } from './native-mesh-scene';
import { NativeSceneView } from './native-scene-view';
import { presentationLive, presentationProjectiles, presentationTime } from './presentation-clock';
const PREFIX = 'archer-tower-projectile';
export function preloadArcherTowerProjectiles(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, ARCHER_TOWER_PROJECTILE_GRAPH, PREFIX);
}
export class ArcherTowerProjectiles {
  readonly views = new Map<string, NativeSceneView>();
  constructor(private scene: Phaser.Scene) {}
  clear() {
    for (const view of this.views.values()) view.destroy();
    this.views.clear();
  }
  render(
    battle: Battle | null,
    reduced: boolean,
    iso: (x: number, y: number) => { x: number; y: number },
    targetHeight: (p: CombatProjectile) => number,
  ) {
    const wanted = new Set<string>();
    // Arrows in flight when the battle ends keep flying on the presentation clock.
    if (battle && presentationLive(battle) && !reduced) {
      const elapsed = presentationTime(battle);
      for (const p of presentationProjectiles(battle)) {
        if (p.weapon !== 'arrow' || p.variant === undefined || !p.flight) continue;
        const pose = archerTowerProjectilePose(p, elapsed, iso, targetHeight(p));
        wanted.add(p.id);
        let view = this.views.get(p.id);
        if (!view) {
          view = new NativeSceneView(this.scene, PREFIX);
          // Every arrow is a new view: its trail colors (within 0..1) ride on the drawn buffer
          // as a GPU tint. The float filter pass resized a pooled drawing context per arrow,
          // and each resize created a framebuffer whose completeness check stalls the GPU.
          view.gpuGroupColor = true;
          this.views.set(p.id, view);
        }
        view.render(pose.poses, pose.x, pose.y, 8000);
        for (const object of view.objects) {
          const data = object.getData('nativeTowerArrow');
          if (data?.id === p.id) Object.assign(data, { export: pose.export, x: pose.x, y: pose.y });
          else
            object.setData('nativeTowerArrow', {
              id: p.id,
              level: p.variant,
              export: pose.export,
              x: pose.x,
              y: pose.y,
            });
        }
      }
    }
    for (const [id, view] of this.views)
      if (!wanted.has(id)) {
        view.destroy();
        this.views.delete(id);
      }
  }
}
