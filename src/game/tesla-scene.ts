import Phaser from 'phaser';
import type { Battle, Building } from './model';
import type { AudioManager } from './audio';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { presentationLive, presentationTime } from './presentation-clock';
import { guardRender } from './render-guard';
import { NativeMeshView, preloadNativeMeshes } from './native-mesh-scene';
import { nativeMeshPoses } from './native-mesh';
import {
  teslaArtLoaded,
  teslaGraph,
  teslaSounds,
  teslaPoses,
  teslaMuzzleY,
  type TeslaVisualState,
} from './tesla-poses';
import {
  teslaAttackPoses,
  teslaAttackCues,
  teslaRevealPoses,
  teslaSample,
  teslaHandlingCue,
  teslaHandlingPoses,
  type TeslaHandling,
} from './tesla-effect-poses';
import { TROOPS } from './data';
import { troopArt } from './troop-art';
import { KING_ART } from './king-art';
import { TESLA_ART, TESLA_ART_LEVELS, teslaAsset, teslaTexture } from './tesla-art';
import { battleUnit } from './battle-index';

const APPEAR_SAMPLE = 'tesla-appear';
const sounds = () => (teslaArtLoaded() ? Object.entries(teslaSounds()) : []);
const sample = (path: string) => (path.includes('appear') ? APPEAR_SAMPLE : teslaSample(path));
export function preloadTeslas(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, teslaGraph(), 'tesla');
  for (const level of TESLA_ART_LEVELS) scene.load.image(teslaTexture(level), teslaAsset(level));
  for (const [path, sound] of sounds()) scene.load.binary(sample(path), '/' + sound.path);
}

export class TeslaPresentation {
  readonly towers = new Map<number, NativeSceneView>();
  readonly reveals = new Map<number, NativeMeshView>();
  readonly attacks = new Map<string, NativeSceneView>();
  readonly grass = new Map<string, NativeSceneView>();
  private signatures = new Map<number, string>();
  private homeSequence = 0;
  private homeEffects: {
    id: number;
    index: number;
    kind: TeslaHandling;
    at: number;
    x: number;
    y: number;
  }[] = [];
  handling(id: number, kind: TeslaHandling | 'cancel', at: number, x: number, y: number) {
    if (kind === 'cancel') this.homeEffects = this.homeEffects.filter((event) => event.id !== id);
    else {
      this.homeEffects.push({ id, index: ++this.homeSequence, kind, at, x, y });
      if (this.homeEffects.length > 16) this.homeEffects.shift();
    }
  }
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    for (const [path] of sounds()) registerCachedSample(scene, audio.samples, sample(path));
  }
  clear() {
    for (const view of [
      ...this.towers.values(),
      ...this.reveals.values(),
      ...this.attacks.values(),
      ...this.grass.values(),
    ])
      view.destroy();
    this.towers.clear();
    this.reveals.clear();
    this.attacks.clear();
    this.grass.clear();
    this.signatures.clear();
    this.homeEffects = [];
  }
  destroy() {
    this.clear();
  }
  render(
    buildings: Building[],
    battle: Battle | null,
    elapsed: number,
    reduced: boolean,
    iso: (x: number, y: number) => { x: number; y: number },
    airLift = 46,
  ): SampleCue[] {
    // Nothing draws until the Tesla family (graph first) has loaded.
    if (!teslaArtLoaded()) return [];
    const live = presentationLive(battle);
    // After the finish, arcs and bursts already started play out on the presentation clock.
    if (battle) elapsed = presentationTime(battle);
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    const wanted = new Set<number>(),
      revealing = new Set<number>(),
      attacking = new Set<string>(),
      scattering = new Set<string>();
    const cues: SampleCue[] = [];
    const revealClip = teslaGraph().clips[teslaGraph().exports.tesla_appear_fx];
    const duration = revealClip.timeline.length / revealClip.fps;
    for (const tower of buildings) {
      if (tower.kind !== 'tesla') continue;
      wanted.add(tower.id);
      const at = battle?.revealedTeslas?.[tower.id];
      const state: TeslaVisualState =
        tower.hp <= 0
          ? 'ruin'
          : tower.constructing
            ? 'constructing'
            : tower.upgradeEnd
              ? 'upgrading'
              : at !== undefined
                ? 'reveal'
                : 'setup';
      const age = at === undefined ? elapsed : Math.max(0, elapsed - at);
      const p = iso(tower.x + 1, tower.y + 1);
      let view = this.towers.get(tower.id);
      if (!view) {
        view = new NativeSceneView(this.scene, 'tesla');
        this.towers.set(tower.id, view);
      }
      const frame =
        !reduced && (state === 'setup' || state === 'reveal') ? Math.floor(age * 24 + 1e-9) : 0;
      const signature = `${tower.level}:${state}:${frame}:${reduced}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(tower.id) !== signature) {
        view.render(
          guardRender(
            `Tesla level ${tower.level}`,
            () => teslaPoses(tower.level, state, age, reduced),
            [],
          ),
          p.x,
          p.y,
          p.y + (state === 'ruin' ? -2 : 0),
        );
        for (const object of view.objects)
          object.setData('nativeTesla', { id: tower.id, level: tower.level, state });
        this.signatures.set(tower.id, signature);
      }
      if (battle && live)
        for (const shot of battle.teslas?.[tower.id]?.shots ?? []) {
          if (cueAudible(shot.at, elapsed))
            cues.push(...teslaAttackCues(tower.id, tower.level, shot));
          if (reduced || elapsed - shot.at > 1) continue;
          const target = battleUnit(battle, shot.targetId);
          const end = iso(target?.x ?? shot.x, target?.y ?? shot.y);
          const impact = iso(shot.x, shot.y);
          const lift =
            (shot.targetHero
              ? KING_ART.width
              : TROOPS[shot.targetKind].width * troopArt(shot.targetKind).displayScale) *
              0.45 +
            (shot.toAir ? airLift : 0);
          end.y -= lift;
          impact.y -= lift;
          const sourceTime = Math.min(elapsed, battle.teslas?.[tower.id]?.destroyedAt ?? elapsed);
          const from = {
            x: p.x,
            y: p.y + teslaMuzzleY(tower.level, at === undefined ? Infinity : sourceTime - at),
          };
          for (const effect of teslaAttackPoses(
            tower.id,
            tower.level,
            shot,
            elapsed,
            from,
            end,
            impact,
            p,
          )) {
            attacking.add(effect.key);
            let fx = this.attacks.get(effect.key);
            if (!fx) {
              fx = new NativeSceneView(this.scene, 'tesla');
              this.attacks.set(effect.key, fx);
            }
            fx.render(effect.poses, effect.x, effect.y, 8000);
            for (const object of fx.objects) {
              if (object.getData('nativeTeslaEffect')?.shot !== shot.index)
                object.setData('nativeTeslaEffect', {
                  id: tower.id,
                  shot: shot.index,
                  role: effect.role,
                });
              // The arc end follows its (moving) target: refresh the endpoints in place.
              if (effect.role === 'arc') {
                const zap = object.getData('teslaZap');
                if (zap) Object.assign(zap, { from, to: end });
                else object.setData('teslaZap', { from, to: end });
              }
            }
          }
        }
      if (at !== undefined && battle && live) {
        if (cueAudible(at, elapsed))
          cues.push({
            key: `tesla:${tower.id}:appear`,
            sample: APPEAR_SAMPLE,
            at,
            volume: 0.7,
            pitch: 1,
          });
        if (!reduced)
          for (const effect of teslaRevealPoses(tower.id, at, elapsed, p)) {
            scattering.add(effect.key);
            let grass = this.grass.get(effect.key);
            if (!grass) {
              grass = new NativeSceneView(this.scene, 'tesla');
              this.grass.set(effect.key, grass);
            }
            grass.render(effect.poses, effect.x, effect.y, effect.depth!);
            for (const object of grass.objects)
              if (!object.getData('nativeTeslaGrass'))
                object.setData('nativeTeslaGrass', { id: tower.id });
          }
        if (!reduced && age < duration) {
          revealing.add(tower.id);
          let reveal = this.reveals.get(tower.id);
          if (!reveal) {
            reveal = new NativeMeshView(this.scene, 'tesla');
            this.reveals.set(tower.id, reveal);
          }
          const s = TESLA_ART.scale;
          reveal.render(
            nativeMeshPoses(teslaGraph(), 'tesla_appear_fx', age, {}, [s, 0, 0, 0, s, 0]),
            p.x,
            p.y,
            p.y - 0.01,
          );
        }
      }
    }
    if (battle) this.homeEffects = [];
    else {
      this.homeEffects = this.homeEffects.filter(
        (event) => elapsed - event.at < 1 && wanted.has(event.id),
      );
      for (const event of this.homeEffects) {
        cues.push(teslaHandlingCue(event.id, event.index, event.kind, event.at));
        if (reduced) continue;
        for (const effect of teslaHandlingPoses(
          event.id,
          event.index,
          event.kind,
          event.at,
          elapsed,
          iso(event.x, event.y),
        )) {
          const key = `home:${event.index}:${effect.key}`;
          scattering.add(key);
          let grass = this.grass.get(key);
          if (!grass) {
            grass = new NativeSceneView(this.scene, 'tesla');
            this.grass.set(key, grass);
          }
          grass.render(effect.poses, effect.x, effect.y, effect.depth!);
          for (const object of grass.objects)
            if (!object.getData('nativeTeslaGrass'))
              object.setData('nativeTeslaGrass', { id: event.id, kind: event.kind });
        }
      }
    }
    for (const [id, view] of this.towers)
      if (!wanted.has(id)) {
        view.destroy();
        this.towers.delete(id);
        this.signatures.delete(id);
      }
    for (const [id, view] of this.reveals)
      if (!revealing.has(id)) {
        view.destroy();
        this.reveals.delete(id);
      }
    for (const [key, view] of this.attacks)
      if (!attacking.has(key)) {
        view.destroy();
        this.attacks.delete(key);
      }
    for (const [key, view] of this.grass)
      if (!scattering.has(key)) {
        view.destroy();
        this.grass.delete(key);
      }
    return cues;
  }
}
