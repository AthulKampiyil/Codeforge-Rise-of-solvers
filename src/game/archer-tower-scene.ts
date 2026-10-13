import type { AudioManager } from './audio';
import {
  ARCHER_TOWER_SOUNDS,
  archerTowerSample,
  archerTowerHandlingCues,
  archerTowerReleaseCues,
  archerTowerHitCues,
  archerTowerDestructionCues,
  type ArcherTowerHandlingEvent,
} from './archer-tower-sounds';
import {
  archerTowerHandlingPoses,
  archerTowerHitPoses,
  archerTowerDestructionPoses,
} from './archer-tower-effects';
import type Phaser from 'phaser';
import type { Battle, Building } from './model';
import { battleTowerArcherPose } from './archer-tower-facing';
import { ARCHER_TOWER_GRAPH, TOWER_ARCHER_GRAPH, archerTowerComposition } from './archer-tower-art';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive, presentationTime } from './presentation-clock';
import { registerCachedSample, type SampleCue } from './sample-audio';
import { guardRender } from './render-guard';
import { NativeLevelPages } from './native-level-pages';
import {
  nativeMatrix,
  nativeVertices,
  type NativeScenePose,
  type NativeMatrix,
} from './native-mesh';
const ROOT: NativeMatrix = [1.2, 0, 0, 0, 1.2, -96];
const transform = (poses: NativeScenePose[]): NativeScenePose[] =>
  poses.map((p) =>
    'group' in p
      ? { ...p, group: transform(p.group) }
      : { ...p, matrix: nativeMatrix(ROOT, p.matrix) },
  );
const towerState = (b: Building) =>
  b.hp <= 0 ? 'ruin' : b.constructing ? 'constructing' : b.upgradeEnd ? 'upgrading' : 'ready';
export function villageArcherTowerPoses(
  b: Building,
  seconds: number,
  battle?: Battle | null,
  reduced = false,
  archer = battleTowerArcherPose(b, battle, seconds, reduced),
) {
  const state = towerState(b);
  const poses = archerTowerComposition(b.level, state, seconds, false, archer, archer);
  return { body: transform(poses.body), residents: transform(poses.residents) };
}
/** Bounds change slowly (aim sector, attack cycle, idle sway): cache by pose
 * signature at 4 Hz instead of rebuilding the full pose every frame. Bar
 * anchors only read the top edge, so quantum staleness is invisible. */
const archerBoundsCache = new Map<string, number[]>();
export function villageArcherTowerBounds(
  b: Building,
  seconds: number,
  battle?: Battle | null,
  reduced = false,
) {
  const state =
    b.hp <= 0 ? 'ruin' : b.constructing ? 'constructing' : b.upgradeEnd ? 'upgrading' : 'ready';
  const pose = battleTowerArcherPose(b, battle, seconds, reduced);
  const key = `${b.level}:${state}:${pose.direction}:${pose.flip ? 1 : 0}:${pose.action}:${Math.floor(seconds * 4)}:${reduced ? 1 : 0}`;
  const hit = archerBoundsCache.get(key);
  if (hit) return hit;
  const poses = villageArcherTowerPoses(b, seconds, battle, reduced),
    bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const pending = [...poses.body, ...poses.residents];
  while (pending.length) {
    const p = pending.pop()!;
    if ('group' in p) {
      pending.push(...p.group);
      continue;
    }
    const v = nativeVertices(p);
    for (let i = 0; i < v.length; i += 4) {
      bounds[0] = Math.min(bounds[0], v[i]);
      bounds[1] = Math.min(bounds[1], v[i + 1]);
      bounds[2] = Math.max(bounds[2], v[i]);
      bounds[3] = Math.max(bounds[3], v[i + 1]);
    }
  }
  if (archerBoundsCache.size > 512) archerBoundsCache.clear();
  archerBoundsCache.set(key, bounds);
  return bounds;
}
/**
 * The tower body and its rooftop Archer are level-paged (scripts/native-pages.mjs): shared
 * pages (base, construction, ruins, hit and destruction effects) and the home village's levels
 * load at boot; any other level loads when a tower of it first draws, behind its fallback
 * sprite. Each Archer variant's pages carry the tower levels it stands on.
 */
export function preloadVillageArcherTowers(scene: Phaser.Scene, levels: Iterable<number> = []) {
  const wanted = [...levels];
  NativeLevelPages.preload(scene, ARCHER_TOWER_GRAPH, 'archer-tower-body', wanted);
  NativeLevelPages.preload(scene, TOWER_ARCHER_GRAPH, 'archer-tower-resident', wanted);
  for (const [path, sound] of Object.entries(ARCHER_TOWER_SOUNDS))
    scene.load.binary(archerTowerSample(path), '/' + sound.path);
}
export class VillageArcherTowers {
  ghost?: { body: NativeSceneView; resident: NativeSceneView };
  /** Draws the placement preview natively; false when its level's pages are not in yet. */
  preview(building: Building | undefined, x = 0, y = 0, valid = true) {
    if (!building || !this.drawsLevel(building.level)) {
      this.ghost?.body.destroy();
      this.ghost?.resident.destroy();
      this.ghost = undefined;
      return false;
    }
    this.ghost ??= {
      body: new NativeSceneView(this.scene, 'archer-tower-body'),
      resident: new NativeSceneView(this.scene, 'archer-tower-resident'),
    };
    const poses = villageArcherTowerPoses(building, 0);
    const tint = (items: NativeScenePose[]) =>
      valid
        ? items
        : items.map((p) => ({
            ...p,
            multiply: p.multiply.map((value, i) => value * (i === 1 || i === 2 ? 0x72 / 255 : 1)),
            add: p.add.map((value, i) => value * (i === 1 || i === 2 ? 0x72 / 255 : 1)),
          }));
    // Above home-village flyers (6500), like the other placement previews.
    this.ghost.body.render(tint(poses.body), x, y, 6601, 0.72);
    this.ghost.resident.render(tint(poses.residents), x, y, 6601.01, 0.72);
    return true;
  }
  readonly views = new Map<number, { body: NativeSceneView; resident: NativeSceneView }>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  private homeSequence = 0;
  private homeEvents: ArcherTowerHandlingEvent[] = [];
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, 'archer-tower-body', 'nativeArcherTowerEffect');
    this.effects = this.fx.views;
    this.pages = new NativeLevelPages(scene, ARCHER_TOWER_GRAPH, 'archer-tower-body');
    this.residents = new NativeLevelPages(scene, TOWER_ARCHER_GRAPH, 'archer-tower-resident');
    for (const path of Object.keys(ARCHER_TOWER_SOUNDS))
      registerCachedSample(scene, audio.samples, archerTowerSample(path));
  }
  private pages: NativeLevelPages;
  private residents: NativeLevelPages;
  /** Increments whenever a level's pages arrive, so the scene restyles fallback sprites. */
  get artRevision() {
    return this.pages.revision + this.residents.revision;
  }
  /** Whether a tower of this level draws natively now; missing pages start loading. */
  drawsLevel(level: number) {
    const body = this.pages.has(level);
    return this.residents.has(level) && body;
  }
  /** Loads these levels' pages now (a new battle's towers while scouting); resolves when in. */
  prefetchLevels(levels: Iterable<number>) {
    const wanted = [...levels];
    return Promise.all([this.pages.prefetch(wanted), this.residents.prefetch(wanted)]).then(
      () => undefined,
    );
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
    this.signatures.clear();
    for (const pair of this.views.values()) {
      pair.body.destroy();
      pair.resident.destroy();
    }
    this.views.clear();
  }
  render(
    buildings: Building[],
    seconds: number,
    iso: (x: number, y: number) => { x: number; y: number },
    soundTime = seconds,
    reduced = false,
    battle?: Battle | null,
    airLift = 46,
  ): SampleCue[] {
    const live = presentationLive(battle);
    // After the finish, hit and destruction bursts play out on the presentation clock.
    const effectTime = battle && live ? presentationTime(battle) : undefined;
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    const wanted = new Set<number>();
    for (const b of buildings) {
      // Until its level's pages arrive, the scene shows the tower's fallback sprite.
      if (b.kind !== 'archertower' || !this.drawsLevel(b.level)) continue;
      wanted.add(b.id);
      let pair = this.views.get(b.id);
      if (!pair)
        this.views.set(
          b.id,
          (pair = {
            body: new NativeSceneView(this.scene, 'archer-tower-body'),
            resident: new NativeSceneView(this.scene, 'archer-tower-resident'),
          }),
        );
      const p = iso(b.x + 1.5, b.y + 1.5),
        archer = battleTowerArcherPose(b, battle, seconds, reduced);
      // Body clips run at 24 or 30 fps (nested 30 fps clips inside 24 fps parents), the
      // rooftop Archer at 24: redraw on those source frames only.
      const frame = (t: number, fps: number) => Math.floor(t * fps + 1e-9);
      const signature = `${b.level}:${towerState(b)}:${archer.direction}:${archer.flip}:${archer.action}:${frame(archer.time, 24)}:${frame(seconds, 24)}:${frame(seconds, 30)}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(b.id) === signature) continue;
      this.signatures.set(b.id, signature);
      const poses = guardRender(
        `Archer Tower level ${b.level}`,
        () => villageArcherTowerPoses(b, seconds, battle, reduced, archer),
        { body: [], residents: [] },
      );
      pair.body.render(poses.body, p.x, p.y, p.y);
      pair.resident.render(poses.residents, p.x, p.y, p.y + 0.01);
      const data = { id: b.id, ...archer };
      for (const object of pair.resident.objects) object.setData('nativeTowerArcher', data);
    }
    for (const [id, pair] of this.views)
      if (!wanted.has(id)) {
        pair.body.destroy();
        pair.resident.destroy();
        this.views.delete(id);
        this.signatures.delete(id);
      }
    this.homeEvents = this.homeEvents.filter((event) => soundTime - event.at < 5);
    for (const pose of archerTowerHandlingPoses(this.homeEvents, soundTime, reduced, iso))
      this.fx.show(pose);
    if (effectTime !== undefined) {
      for (const pose of archerTowerHitPoses(battle, reduced, iso, airLift, effectTime))
        this.fx.show(pose);
      for (const pose of archerTowerDestructionPoses(battle, reduced, iso, effectTime))
        this.fx.show(pose);
    }
    this.fx.sweep();
    const cues = archerTowerHandlingCues(this.homeEvents);
    if (effectTime !== undefined)
      cues.push(
        ...archerTowerReleaseCues(battle, effectTime),
        ...archerTowerHitCues(battle, effectTime),
        ...archerTowerDestructionCues(battle, effectTime),
      );
    return cues;
  }
}
