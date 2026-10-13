import Phaser from 'phaser';
import type { Battle, Building } from './model';
import type { AudioManager } from './audio';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { presentationLive, presentationProjectiles, presentationTime } from './presentation-clock';
import { quantizedDensity } from './native-scene-view';
import { nativeFrameIndex } from './native-frame';
import { guardRender } from './render-guard';
import { NativeMeshView, preloadNativeMeshes } from './native-mesh-scene';
import { nativeMeshPoses, type NativeMatrix } from './native-mesh';
import { xbowGraph, xbowSounds, xbowPoses } from './xbow-poses';
import { XBOW_ART, xbowAsset, xbowExport, xbowTexture, xbowDirection } from './xbow-art';
import { XBOW, XBOW_LEVELS, XBOW_PROJECTILES } from './xbow-stats';

type Point = { x: number; y: number };
const sample = (path: string) => `xbow-${path.split('/').at(-1)!.replace('.ogg', '')}`;

export function preloadXbows(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, xbowGraph(), 'xbow');
  for (const { level } of XBOW_LEVELS)
    for (const mode of ['ground', 'both'] as const)
      scene.load.image(xbowTexture(level, mode), xbowAsset(level, mode));
  for (const [path, sound] of Object.entries(xbowSounds()))
    scene.load.binary(sample(path), '/' + sound.path);
}

/** Native clips and samples use simulation time; calibrated world projection is local. */
export class XbowPresentation {
  readonly towers = new Map<number, NativeMeshView>();
  readonly bolts = new Map<string, NativeMeshView>();
  readonly shadows = new Map<string, NativeMeshView>();
  private signatures = new Map<number, string>();
  constructor(
    private scene: Phaser.Scene,
    private audio: AudioManager,
  ) {
    this.bindAudio();
  }
  /** Heavy art bundles in after boot; sounds bind when the binaries arrive. */
  bindAudio() {
    for (const path of Object.keys(xbowSounds()))
      registerCachedSample(this.scene, this.audio.samples, sample(path));
  }
  /** Heavy textures arrive after boot; the fallback sprite covers until then. */
  artReady = false;
  clear() {
    for (const view of [...this.towers.values(), ...this.bolts.values(), ...this.shadows.values()])
      view.destroy();
    this.towers.clear();
    this.bolts.clear();
    this.shadows.clear();
    this.signatures.clear();
  }
  destroy() {
    this.clear();
  }
  render(
    buildings: Building[],
    battle: Battle | null,
    elapsed: number,
    reduced: boolean,
    iso: (x: number, y: number) => Point,
    airLift: number,
  ): SampleCue[] {
    const live = presentationLive(battle);
    // After the finish, bolts in flight and one-shot sounds play out on the presentation clock.
    if (battle) elapsed = presentationTime(battle);
    const cues = this.cues(battle, elapsed);
    // Sound cues never depend on the heavy art; only the meshes wait for it.
    if (!this.artReady) return cues;
    const wanted = new Set<number>(),
      flights = new Set<string>();
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const tower of buildings) {
      if (tower.kind !== 'xbow' || tower.hp <= 0) continue;
      wanted.add(tower.id);
      let view = this.towers.get(tower.id);
      if (!view) {
        view = new NativeMeshView(this.scene, 'xbow');
        this.towers.set(tower.id, view);
      }
      const state = battle?.xbows?.[tower.id];
      const direction = state ? xbowDirection(state.aimX, state.aimY) : 0;
      const ammunition = state?.ammunition ?? XBOW.ammunition;
      const p = iso(tower.x + 1.5, tower.y + 1.5);
      const mode = tower.xbowMode ?? 'ground',
        upgrading = !!tower.upgradeEnd || !!tower.constructing,
        seconds = reduced ? 0 : elapsed;
      // The turret clip only changes on its own source frames: redraw on those, not per frame.
      const frame = guardRender(
        `X-Bow level ${tower.level}`,
        () => nativeFrameIndex(xbowGraph(), xbowExport(tower.level, mode, upgrading), seconds),
        -1,
      );
      if (frame < 0) continue;
      const signature = `${tower.level}:${mode}:${upgrading}:${!!tower.constructing}:${direction}:${ammunition > 0}:${frame}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(tower.id) === signature) continue;
      this.signatures.set(tower.id, signature);
      view.render(
        xbowPoses(tower.level, mode, direction, seconds, ammunition, upgrading),
        p.x,
        p.y,
        p.y,
        tower.constructing ? 0.58 : 1,
      );
      const data = { id: tower.id, direction, ammunition };
      for (const mesh of view.meshes.values()) mesh.setData('xbow', data);
    }
    if (battle && live && !reduced)
      for (const p of presentationProjectiles(battle)) {
        if (p.weapon !== 'xbowbolt') continue;
        flights.add(p.id);
        let view = this.bolts.get(p.id);
        if (!view) {
          view = new NativeMeshView(this.scene, 'xbow');
          this.bolts.set(p.id, view);
        }
        const source = XBOW_PROJECTILES[p.variant! - 1];
        const age = Math.max(0, elapsed - p.launched);
        const progress = Math.min(1, age / Math.max(0.01, p.impact - p.launched));
        const flight = p.flight ?? { x: p.fromX, y: p.fromY, at: p.launched };
        const distance = Math.hypot(p.x - flight.x, p.y - flight.y);
        const f = distance
          ? Math.min(1, (Math.max(0, elapsed - flight.at) * source.speed) / distance)
          : 1;
        const ground = iso(flight.x + (p.x - flight.x) * f, flight.y + (p.y - flight.y) * f);
        const from = iso(p.fromX, p.fromY),
          to = iso(p.x, p.y);
        const length = Math.hypot(p.x - p.fromX, p.y - p.fromY) || 1;
        const forward = iso(
          p.fromX + (0.85 * (p.x - p.fromX)) / length,
          p.fromY + (0.85 * (p.y - p.fromY)) / length,
        );
        // Art registration and vertical projection are calibrated separately from tile-space physics.
        const muzzleLift = source.height * 0.8,
          hitLift = 18 + (p.toAir ? airLift : 0);
        const x = ground.x + (forward.x - from.x) * (1 - progress);
        const y =
          ground.y +
          (forward.y - from.y) * (1 - progress) -
          muzzleLift * (1 - progress) -
          hitLift * progress;
        const angle = Math.atan2(to.y - hitLift - y, to.x - x) - Math.PI / 2;
        const c = Math.cos(angle) * XBOW_ART.scale,
          s = Math.sin(angle) * XBOW_ART.scale;
        const root: NativeMatrix = [c, -s, 0, s, c, 0];
        let shadowView = this.shadows.get(p.id);
        if (!shadowView) {
          shadowView = new NativeMeshView(this.scene, 'xbow');
          this.shadows.set(p.id, shadowView);
        }
        const shadow = nativeMeshPoses(
          xbowGraph(),
          'bolt_projectile_shadow',
          age,
          {},
          [0.6, 0, 0, 0, 0.6, 0],
        );
        shadowView.render(shadow, ground.x, ground.y, -839);
        const poses = nativeMeshPoses(xbowGraph(), source.export, age, {}, root);
        // Above flying units (7500) like every other projectile type.
        view.render(poses, x, y, 7700);
        for (const mesh of view.meshes.values())
          if (mesh.getData('xbowBolt') !== p.id) mesh.setData('xbowBolt', p.id);
      }
    for (const [id, view] of this.towers)
      if (!wanted.has(id)) {
        view.destroy();
        this.towers.delete(id);
        this.signatures.delete(id);
      }
    for (const [id, view] of this.bolts)
      if (!flights.has(id)) {
        view.destroy();
        this.bolts.delete(id);
      }
    for (const [id, view] of this.shadows)
      if (!flights.has(id)) {
        view.destroy();
        this.shadows.delete(id);
      }
    return cues;
  }
  /** One-shot cues for shots, hits and the empty clack that can still be heard. */
  private cues(battle: Battle | null, elapsed: number) {
    const cues: SampleCue[] = [];
    if (battle && presentationLive(battle))
      for (const [id, state] of Object.entries(battle.xbows ?? {})) {
        // Stable variation keeps the source pitch range identical through replay seeks.
        const pitch = (index: number) =>
          1.1 + (((Number(id) * 31 + index * 17) >>> 0) % 101) / 1000;
        for (const shot of state.shots)
          if (cueAudible(shot.at, elapsed))
            cues.push({
              key: `xbow:${id}:shot:${shot.index}`,
              sample: 'xbow-bow_attack',
              at: shot.at,
              volume: 0.7,
              pitch: pitch(shot.index),
            });
        for (const hit of state.hits)
          if (cueAudible(hit.at, elapsed))
            cues.push({
              key: `xbow:${id}:hit:${hit.index}`,
              sample: 'xbow-generic_hit_01',
              at: hit.at,
              volume: 0.3,
              pitch: pitch(hit.index) - 0.15,
            });
        if (state.emptyAt !== undefined)
          cues.push({
            key: `xbow:${id}:empty`,
            sample: 'xbow-bow_out_of_ammo',
            at: state.emptyAt,
            volume: 0.8,
            pitch: 1.1,
          });
      }
    return cues;
  }
}
