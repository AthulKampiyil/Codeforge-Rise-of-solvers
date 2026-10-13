import { darkDrillHandlingPoses, darkDrillDestructionPoses } from './dark-drill-effects';
import type { AudioManager } from './audio';
import {
  DARK_DRILL_SOUNDS,
  darkDrillSample,
  darkDrillHandlingCues,
  darkDrillDestructionCues,
  type DrillHandlingEvent,
} from './dark-drill-sounds';
import type Phaser from 'phaser';
import type { Building, Battle } from './model';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { preloadNativeMeshes } from './native-mesh-scene';
import { darkDrillArtLoaded, darkDrillGraph, darkDrillBuildingPoses } from './dark-drill-art';
import { darkDrillStats } from './dark-drill-stats';
import { registerCachedSample } from './sample-audio';
import { presentationLive, presentationTime } from './presentation-clock';
import { guardRender } from './render-guard';

/** Placement ghost: above home camp flyers (6500), below the air band (7500). */
const PREVIEW_DEPTH = 6601;

/**
 * Redraw key for a drill body. Mirrors `darkDrillBuildingPoses`: only the working state
 * animates (the `ExportName` clip on the body clock); every other state is a still pose.
 */
function drillSignature(building: Building, seconds: number) {
  const { art, production } = darkDrillStats(building.level);
  const capacity = production.capacity;
  const state =
    building.hp <= 0
      ? 'ruin'
      : building.constructing
        ? 'constructing'
        : building.upgradeEnd
          ? 'upgrading'
          : building.stored >= capacity
            ? 'idle'
            : 'working';
  const reservoir = Math.min(99, Math.floor((Math.max(0, building.stored) / capacity) * 100));
  let frame = 0;
  if (state === 'working') {
    const graph = darkDrillGraph();
    const id = graph.exports[art.ExportName];
    const fps = (id === undefined ? undefined : graph.clips[id]?.fps) ?? 1;
    frame = Math.floor(Math.max(0, seconds) * fps + 1e-9);
  }
  return `${building.level}:${state}:${reservoir}:${frame}`;
}

export function preloadDarkDrills(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, darkDrillGraph(), 'darkdrill');
  for (const [path, sound] of Object.entries(DARK_DRILL_SOUNDS))
    scene.load.binary(darkDrillSample(path), '/' + sound.path);
}
export class DarkDrillPresentation {
  ghost?: NativeSceneView;
  preview(building: Building | undefined, x = 0, y = 0, valid = true) {
    // The placement ghost waits for the Drill's graph; its family is loading meanwhile.
    if (!building || !darkDrillArtLoaded()) {
      this.ghost?.destroy();
      this.ghost = undefined;
      return;
    }
    const poses = guardRender(
      `dark drill preview level ${building.level}`,
      () =>
        darkDrillBuildingPoses(building, 0).map((pose) => {
          if ('group' in pose) throw new Error('Unexpected Drill preview blend group');
          return valid
            ? pose
            : {
                ...pose,
                multiply: pose.multiply.map(
                  (value, i) => value * (i === 1 || i === 2 ? 0x72 / 255 : 1),
                ),
              };
        }),
      [],
    );
    this.ghost ??= new NativeSceneView(this.scene, 'darkdrill');
    this.ghost.render(poses, x, y, PREVIEW_DEPTH, 0.72);
  }
  private fx: NativeEffectViews;
  /** Live particle views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  readonly drills = new Map<number, NativeSceneView>();
  private signatures = new Map<number, string>();
  private homeSequence = 0;
  private homeEvents: DrillHandlingEvent[] = [];
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, 'darkdrill', 'nativeDrillEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(DARK_DRILL_SOUNDS))
      registerCachedSample(scene, audio.samples, darkDrillSample(path));
  }
  /**
   * The battle that owns `history`. The scene passes only `battle.drillDestructions` (and the
   * frozen `battle.elapsed`), so the presentation clock looks the battle up on the scene's model.
   */
  private battleFor(history: Battle['drillDestructions']): Battle | undefined {
    if (!history) return undefined;
    const battle = (this.scene as unknown as { model?: { battle?: Battle | null } }).model?.battle;
    return battle?.drillDestructions === history ? battle : undefined;
  }
  handling(id: number, kind: 'pickup' | 'place' | 'cancel', at: number, x: number, y: number) {
    if (kind === 'cancel') this.homeEvents = this.homeEvents.filter((event) => event.id !== id);
    else {
      this.homeEvents.push({ id, index: ++this.homeSequence, kind, at, x, y });
      if (this.homeEvents.length > 16) this.homeEvents.shift();
    }
  }
  clear() {
    this.preview(undefined);
    this.homeEvents = [];
    this.fx.clear();
    for (const view of this.drills.values()) view.destroy();
    this.drills.clear();
    this.signatures.clear();
  }
  render(
    buildings: Building[],
    seconds: number,
    iso: (x: number, y: number) => { x: number; y: number },
    soundTime = seconds,
    reduced = false,
    destructionHistory?: Battle['drillDestructions'],
  ) {
    const wanted = new Set<number>();
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const building of buildings) {
      // Until the family's graph arrives the fallback sprite stands in for the native body.
      if (building.kind !== 'darkdrill' || !darkDrillArtLoaded()) continue;
      wanted.add(building.id);
      let view = this.drills.get(building.id);
      if (!view)
        this.drills.set(building.id, (view = new NativeSceneView(this.scene, 'darkdrill')));
      const point = iso(building.x + 1.5, building.y + 1.5);
      const key = `dark drill level ${building.level}`;
      const signature = `${guardRender(key, () => drillSignature(building, seconds), 'unsupported')}:${point.x}:${point.y}:${zoom}`;
      if (this.signatures.get(building.id) === signature) continue;
      this.signatures.set(building.id, signature);
      view.render(
        guardRender(key, () => darkDrillBuildingPoses(building, seconds), []),
        point.x,
        point.y,
        point.y,
      );
      for (const object of view.objects)
        if (object.getData('nativeDrill') !== building.id)
          object.setData('nativeDrill', building.id);
    }
    for (const [id, view] of this.drills)
      if (!wanted.has(id)) {
        view.destroy();
        this.drills.delete(id);
        this.signatures.delete(id);
      }
    this.homeEvents = this.homeEvents.filter((event) => soundTime - event.at < 5);
    for (const pose of darkDrillHandlingPoses(this.homeEvents, soundTime, reduced, iso))
      this.fx.show(pose);
    // Destruction bursts follow the presentation clock: the last drill often falls on the
    // finishing tick, and its debris plays out for the grace window instead of freezing.
    const battle = this.battleFor(destructionHistory);
    if (!battle || presentationLive(battle))
      for (const pose of darkDrillDestructionPoses(
        destructionHistory,
        battle ? presentationTime(battle) : soundTime,
        reduced,
        iso,
      ))
        this.fx.show(pose);
    this.fx.sweep();
    return [
      ...darkDrillHandlingCues(this.homeEvents),
      ...darkDrillDestructionCues(destructionHistory),
    ];
  }
}
