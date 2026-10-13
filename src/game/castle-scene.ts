import type Phaser from 'phaser';
import type { Building } from './model';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { guardRender } from './render-guard';
import { preloadNativeMeshes } from './native-mesh-scene';
import { CASTLE_LEVELS, castleAsset, castleTexture } from './castle-art';
import { castleArtLoaded, castleGraph, castlePoses } from './castle-graph';

export function preloadCastles(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, castleGraph(), 'clancastle');
  for (const row of CASTLE_LEVELS)
    scene.load.image(castleTexture(row.level), castleAsset(row.level));
}
export class CastlePresentation {
  readonly castles = new Map<number, NativeSceneView>();
  /** Castle poses are stills (frame zero): redraw only when one of these inputs changes. */
  private signatures = new Map<number, string>();
  constructor(private scene: Phaser.Scene) {}
  clear() {
    for (const view of this.castles.values()) view.destroy();
    this.castles.clear();
    this.signatures.clear();
  }
  render(buildings: Building[], iso: (x: number, y: number) => { x: number; y: number }) {
    // Nothing draws until the Clan Castle family (graph first) has loaded.
    if (!castleArtLoaded()) return;
    const wanted = new Set<number>();
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const building of buildings) {
      // The Goblin Castle NPC keeps its own body/foundation/ruin in the late Goblin family.
      if (building.kind !== 'clancastle' || building.npc === 'goblin-castle') continue;
      wanted.add(building.id);
      let view = this.castles.get(building.id);
      if (!view)
        this.castles.set(building.id, (view = new NativeSceneView(this.scene, 'clancastle')));
      const point = iso(building.x + 1.5, building.y + 1.5);
      const state =
        building.hp <= 0
          ? 'ruin'
          : building.constructing
            ? 'constructing'
            : building.upgradeEnd
              ? 'upgrading'
              : 'guard';
      const signature = `${building.level}:${state}:${point.x}:${point.y}:${zoom}`;
      if (this.signatures.get(building.id) === signature) continue;
      this.signatures.set(building.id, signature);
      view.render(
        guardRender(
          `clan castle level ${building.level}`,
          () => castlePoses(building.level, state),
          [],
        ),
        point.x,
        point.y,
        point.y,
      );
      for (const object of view.objects)
        if (object.getData('nativeCastle') !== building.id)
          object.setData('nativeCastle', building.id);
    }
    for (const [id, view] of this.castles)
      if (!wanted.has(id)) {
        view.destroy();
        this.castles.delete(id);
        this.signatures.delete(id);
      }
  }
}
