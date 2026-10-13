import Phaser from 'phaser';
import type { Battle } from './model';
import type { AudioManager } from './audio';
import { registerCachedSample, type SampleCue } from './sample-audio';
import { presentationLive, presentationTime } from './presentation-clock';
import {
  SANTA_GROUPS,
  SANTA_SOUNDS,
  santaTexture,
  santaPoses,
  santaQuad,
  santaSoundCues,
} from './santa-art';
import { SANTA_SPELL } from './santa-trap';

export function preloadSanta(scene: Phaser.Scene) {
  for (const [name, group] of Object.entries(SANTA_GROUPS))
    for (const [page, info] of group.pages.entries()) {
      scene.load.spritesheet(
        santaTexture(name as keyof typeof SANTA_GROUPS, page),
        '/' + info.path,
        { frameWidth: group.width, frameHeight: group.height, endFrame: info.frames - 1 },
      );
    }
  for (const [name, sound] of Object.entries(SANTA_SOUNDS))
    scene.load.binary(`santa-${name}`, '/' + sound.path);
}
/** Retained meshes preserve the source's affine shear without baking duplicate frames. */
export class SantaPresentation {
  meshes = new Map<string, Phaser.GameObjects.Mesh2D>();
  private marks: Phaser.GameObjects.Graphics;
  private flashes: Phaser.GameObjects.Graphics;
  private stopAudio = () => this.audio.samples.stop();
  constructor(
    private scene: Phaser.Scene,
    private audio: AudioManager,
  ) {
    this.marks = scene.add.graphics().setDepth(-849);
    this.flashes = scene.add.graphics().setDepth(6900);
    scene.events.on(Phaser.Scenes.Events.PAUSE, this.stopAudio);
    this.bindAudio();
  }
  /** Heavy art bundles in after boot; sounds bind when the binaries arrive. */
  bindAudio() {
    for (const name of Object.keys(SANTA_SOUNDS))
      registerCachedSample(this.scene, this.audio.samples, `santa-${name}`);
  }
  /** Heavy textures arrive after boot; the fallback sprite covers until then. */
  artReady = false;
  /** True while the craters/flash graphics hold anything (skips clearing empty graphics). */
  private marked = false;
  clear() {
    for (const mesh of this.meshes.values()) mesh.destroy();
    this.meshes.clear();
    this.marks.clear();
    this.flashes.clear();
    this.audio.samples.stop();
  }
  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.stopAudio);
    this.clear();
    this.marks.destroy();
    this.flashes.destroy();
  }
  /**
   * Draws Santa's Surprise and plays every family's cues. `additionalCues` is the frame's merged
   * cue list from the other presentations; it is extended in place, not copied. Sound never
   * waits for the heavy Santa art: until it arrives only the Santa meshes and marks are skipped.
   */
  render(
    battle: Battle | null,
    reduced: boolean,
    playing: boolean,
    speed: number,
    iso: (x: number, y: number) => { x: number; y: number },
    additionalCues: SampleCue[] = [],
    homeTime = 0,
  ) {
    const wanted = new Set<string>(),
      cues = additionalCues,
      live = presentationLive(battle),
      elapsed = battle ? presentationTime(battle) : homeTime;
    if (this.marked) {
      this.marks.clear();
      this.flashes.clear();
      this.marked = false;
    }
    if (battle && live)
      for (const [id, state] of Object.entries(battle.traps)) {
        if (!state.santa) continue;
        const p = iso(state.x, state.y);
        cues.push(...santaSoundCues(state, id));
        if (!this.artReady) continue;
        for (const pose of santaPoses(state, elapsed, reduced)) {
          const key = `${id}:${pose.key}`,
            quad = santaQuad(pose);
          wanted.add(key);
          let mesh = this.meshes.get(key);
          if (!mesh) {
            // BL, TL, BR, TR matches the established quad batching topology.
            const indices = [1, 0, 3, 0, 0, 3, 2, 0];
            // Native atlases use top-down image coordinates; Mesh2D expects GL UVs.
            mesh = this.scene.add
              .mesh2d(p.x, p.y, quad.texture, quad.vertices, indices, true)
              .setOrigin(0, 0);
            mesh.indicesOrdered = indices;
            mesh.useOrderedIndices = true;
            mesh.setData('santa', pose.key);
            this.meshes.set(key, mesh);
          }
          mesh.vertices = quad.vertices;
          // The raised sleigh flies above the air band (7500-7590), below effects (8000).
          const depth = pose.ground ? -848 : 7650 + p.y * 0.01;
          mesh.setTexture(quad.texture).setPosition(p.x, p.y).setAlpha(pose.alpha);
          if (mesh.depth !== depth) mesh.setDepth(depth);
        }
        for (const strike of state.santa.strikes) {
          const age = elapsed - strike.hitAt;
          if (age < 0 || age > 8) continue;
          this.marked = true;
          const hit = iso(strike.x, strike.y);
          // Ground craters and flash are local effects; native explosion particles remain to reconstruct.
          this.marks.fillStyle(0x3a2818, 0.28 * (1 - age / 8)).fillEllipse(hit.x, hit.y, 36, 18);
          if (age < 0.45) {
            const f = age / 0.45,
              width = SANTA_SPELL.radius * 90.5 * (0.25 + f * 0.75);
            this.flashes
              .fillStyle(0xffe7a1, (reduced ? 0.18 : 0.65) * (1 - f))
              .fillEllipse(hit.x, hit.y - 10, width, width * 0.5);
            this.flashes
              .lineStyle(3, 0xff9c48, (reduced ? 0.2 : 0.85) * (1 - f))
              .strokeEllipse(hit.x, hit.y - 10, width, width * 0.5);
          }
        }
      }
    for (const [key, mesh] of this.meshes)
      if (!wanted.has(key)) {
        mesh.destroy();
        this.meshes.delete(key);
      }
    // After the finish, one-shot sounds already started play out on the presentation clock;
    // loops stop with the battle.
    const heard = battle?.finished ? cues.filter((cue) => !cue.loop) : cues;
    this.audio.samples.sync(
      heard,
      elapsed,
      speed,
      (!battle || live) && playing && !this.scene.sys.isPaused() && this.audio.enabled,
    );
  }
}
