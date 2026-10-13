import Phaser from 'phaser';
import type { Building } from './model';
import { NativeMeshView, preloadNativeMeshes } from './native-mesh-scene';
import {
  GOBLIN_BUILDING_GRAPH,
  goblinBuildingPoses,
  goblinBasePoses,
} from './goblin-building-poses';
import { GOBLIN_BUILDING_ART, goblinBuildingAsset, isGoblinBuilding } from './goblin-building-art';

export function preloadGoblinBuildings(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, GOBLIN_BUILDING_GRAPH, 'goblin-building');
  for (const kind of ['goblin-townhall', 'goblin-hut'] as const)
    scene.load.image(GOBLIN_BUILDING_ART[kind].texture, goblinBuildingAsset(kind));
  for (const art of Object.values(GOBLIN_BUILDING_ART))
    scene.load.image(art.base, `/assets/buildings/goblin-native/${art.base}.png`);
}
export class GoblinBuildingPresentation {
  readonly buildings = new Map<number, NativeMeshView>();
  readonly bases = new Map<number, NativeMeshView>();
  private signatures = new Map<number, string>();
  private baseSignatures = new Map<number, string>();
  constructor(private scene: Phaser.Scene) {}
  clear() {
    for (const view of [...this.buildings.values(), ...this.bases.values()]) view.destroy();
    this.buildings.clear();
    this.bases.clear();
    this.signatures.clear();
    this.baseSignatures.clear();
  }
  destroy() {
    this.clear();
  }
  render(
    buildings: Building[],
    elapsed: number,
    reduced: boolean,
    iso: (x: number, y: number) => { x: number; y: number },
  ) {
    const wanted = new Set<number>(),
      alive = new Set<number>();
    for (const b of buildings) {
      if (!isGoblinBuilding(b.npc)) continue;
      wanted.add(b.id);
      const kind = b.npc,
        art = GOBLIN_BUILDING_ART[kind],
        p = iso(b.x + art.size / 2, b.y + art.size / 2);
      let base = this.bases.get(b.id);
      if (!base) {
        base = new NativeMeshView(this.scene, 'goblin-building');
        this.bases.set(b.id, base);
      }
      const baseSignature = `${kind}:${p.x}:${p.y}`;
      if (this.baseSignatures.get(b.id) !== baseSignature) {
        base.render(goblinBasePoses(kind), p.x, p.y, -880);
        this.baseSignatures.set(b.id, baseSignature);
      }
      if (b.hp <= 0) continue;
      alive.add(b.id);
      let view = this.buildings.get(b.id);
      if (!view) {
        view = new NativeMeshView(this.scene, 'goblin-building');
        this.buildings.set(b.id, view);
      }
      const frame =
        kind === 'goblin-townhall' && !reduced ? Math.floor(elapsed * 24 + 1e-9) % 24 : 0;
      const signature = `${baseSignature}:${b.level}:${frame}`;
      if (this.signatures.get(b.id) === signature) continue;
      this.signatures.set(b.id, signature);
      view.render(goblinBuildingPoses(kind, reduced ? 0 : elapsed), p.x, p.y, p.y);
      for (const mesh of view.meshes.values())
        mesh.setData('goblinBuilding', { id: b.id, kind, level: b.level });
    }
    for (const [id, view] of this.buildings)
      if (!alive.has(id)) {
        view.destroy();
        this.buildings.delete(id);
        this.signatures.delete(id);
      }
    for (const [id, view] of this.bases)
      if (!wanted.has(id)) {
        view.destroy();
        this.bases.delete(id);
        this.baseSignatures.delete(id);
      }
  }
}
