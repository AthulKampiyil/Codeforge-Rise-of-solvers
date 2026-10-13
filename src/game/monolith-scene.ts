import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { Building } from './model';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { preloadNativeMeshes } from './native-mesh-scene';
import type { NativeParticlePose } from './native-particles';
import { presentationLive } from './presentation-clock';
import { guardRender } from './render-guard';
import { MONOLITH_ART_LEVELS, monolithAsset, monolithTexture } from './monolith-art';
import {
  MONOLITH_EFFECTS,
  MONOLITH_EMITTERS,
  MONOLITH_GRAPH,
  MONOLITH_SOUNDS,
  monolithBounds,
  monolithFlightPoint,
  monolithPose,
  monolithPoses,
  monolithProjectilePose,
  monolithTimeKey,
  type MonolithVisualState,
} from './monolith-poses';
import { MONOLITH_PROJECTILES, monolithStats } from './monolith-stats';
import type { MonolithProjectile } from './monolith';
import { sourceEffectPlayer } from './spell-tower-effect-player';

const PREFIX = 'monolith-native';
const sample = (path: string) => `monolith-${path.split('/').at(-1)!.replace('.ogg', '')}`;
/** Looping source trail effects re-emit continuously; one birth per 30 fps frame is local. */
const TRAIL_INTERVAL = 1 / 30;
const player = sourceEffectPlayer({
  graph: MONOLITH_GRAPH,
  effects: MONOLITH_EFFECTS,
  emitters: MONOLITH_EMITTERS,
  artScale: 1.2,
  sample,
  prefix: 'monolith',
});

export function preloadMonolith(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, MONOLITH_GRAPH, PREFIX);
  for (const level of MONOLITH_ART_LEVELS)
    scene.load.image(monolithTexture(level), monolithAsset(level));
  for (const [path, sound] of Object.entries(MONOLITH_SOUNDS))
    scene.load.binary(sample(path), '/' + sound.path);
}

const visualState = (b: Building): MonolithVisualState =>
  b.hp <= 0 ? 'ruin' : b.constructing ? 'constructing' : b.upgradeEnd ? 'upgrading' : 'setup';

/** State-driven presentation; rendering reads battle histories so replay seeks stay exact. */
export class MonolithPresentation implements LatePresentation {
  readonly towers = new Map<number, NativeSceneView>();
  readonly projectiles = new Map<string, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  private projectileData = new Map<string, { id: string; progress: number; export: string }>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, PREFIX, 'nativeMonolithEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(MONOLITH_SOUNDS))
      registerCachedSample(scene, audio.samples, sample(path));
  }
  /** True once this family renders the building itself (the fallback sprite is hidden). */
  handles(b: Building) {
    return b.kind === 'monolith';
  }
  bounds(b: Building): readonly [number, number, number, number] | undefined {
    return b.kind === 'monolith'
      ? guardRender<readonly [number, number, number, number] | undefined>(
          `monolith level ${b.level}`,
          () => monolithBounds(b.level, visualState(b)),
          undefined,
        )
      : undefined;
  }
  render(context: LateRenderContext): SampleCue[] {
    const { battle, elapsed, reduced, iso, airLift } = context;
    const wanted = new Set<number>(),
      flying = new Set<string>(),
      cues: SampleCue[] = [];
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    const draw = (poses: NativeParticlePose[], tag: string) => {
      for (const fx of poses) this.fx.show(fx, { tag });
    };
    // Transient effects and orbs play on the presentation clock through the finish grace; the
    // turret and the targeting loop hold the simulation clock and stop with the battle.
    const live = presentationLive(battle);
    const bodyTime = battle ? battle.elapsed : elapsed;
    const family = battle?.late?.monolith;
    const inFlight = new Map<string, MonolithProjectile>();
    for (const q of family?.projectiles ?? [])
      if (!inFlight.has(`${q.sourceId}:${q.index}`)) inFlight.set(`${q.sourceId}:${q.index}`, q);
    for (const tower of context.buildings) {
      if (tower.kind !== 'monolith') continue;
      wanted.add(tower.id);
      const p = iso(tower.x + 1.5, tower.y + 1.5);
      const state = visualState(tower);
      const record = family?.towers[tower.id];
      const key = `monolith level ${tower.level}`;
      const pose = guardRender(
        key,
        () => monolithPose(tower, record, battle, bodyTime, reduced),
        undefined,
      );
      const ruinAge = record?.destroyedAt !== undefined ? elapsed - record.destroyedAt : Infinity;
      let view = this.towers.get(tower.id);
      if (!view) this.towers.set(tower.id, (view = new NativeSceneView(this.scene, PREFIX)));
      if (pose) {
        const time = guardRender(
          key,
          () => monolithTimeKey(tower.level, state, pose.seconds, ruinAge),
          0,
        );
        const signature = `${tower.level}:${state}:${pose.direction}:${pose.attack}:${pose.variant}:${time}:${p.x}:${p.y}:${zoom}`;
        if (this.signatures.get(tower.id) !== signature) {
          view.render(
            guardRender(key, () => monolithPoses(tower.level, state, pose, ruinAge), []),
            p.x,
            p.y,
            p.y + (state === 'ruin' ? -2 : 0),
          );
          const data = { id: tower.id, state, ...pose };
          for (const object of view.objects) object.setData('nativeMonolith', data);
          this.signatures.set(tower.id, signature);
        }
      }
      if (!battle || !live || !record) continue;
      const row = guardRender(key, () => monolithStats(tower.level), undefined);
      if (!row) continue;
      // The targeting loop stops with the battle; one-shot cues play through the grace.
      if (
        !battle.finished &&
        record.targetId !== null &&
        record.engagedAt !== undefined &&
        tower.hp > 0
      )
        cues.push(
          ...player.cues(
            `${tower.id}:engaged:${record.engagedAt}`,
            row.attackEffect,
            record.engagedAt,
            tower.id,
            0,
          ),
        );
      const hits = new Map(record.hits.map((h) => [h.index, h]));
      for (const shot of record.shots) {
        const projectile = MONOLITH_PROJECTILES[shot.variant - 1];
        if (cueAudible(shot.at, elapsed))
          cues.push(
            ...player.cues(
              `${tower.id}:shot:${shot.index}`,
              projectile.spawnEffect,
              shot.at,
              tower.id,
              shot.index,
            ),
          );
        const hit = hits.get(shot.index);
        const flight = inFlight.get(`${tower.id}:${shot.index}`);
        const path =
          flight ??
          (hit
            ? {
                fromX: shot.fromX,
                fromY: shot.fromY,
                x: hit.x,
                y: hit.y,
                launched: shot.at,
                impact: hit.at,
                toAir: hit.toAir,
                variant: shot.variant,
                flight: { x: shot.fromX, y: shot.fromY, at: shot.at },
              }
            : undefined);
        if (!path) continue;
        const trailRows = MONOLITH_EFFECTS[projectile.trailEffect] ?? [];
        // Trail births follow the straight source path from the release point.
        const straight = { ...path, flight: { x: path.fromX, y: path.fromY, at: path.launched } };
        for (const [i, trailRow] of trailRows.entries())
          if (trailRow.ParticleEmitter)
            draw(
              player.trail(
                `${tower.id}:trail:${shot.index}:${i}`,
                trailRow.ParticleEmitter,
                shot.at,
                path.impact,
                TRAIL_INTERVAL,
                elapsed,
                (at) => monolithFlightPoint(straight, at, iso, airLift),
                tower.id,
                shot.index * 8 + i,
                7999,
                reduced,
              ),
              'trail',
            );
      }
      for (const hit of record.hits) {
        const projectile = MONOLITH_PROJECTILES[hit.variant - 1];
        const ground = iso(hit.x, hit.y);
        const point = { x: ground.x, y: ground.y - 16 - (hit.toAir ? airLift : 0) };
        for (const effect of hit.struck
          ? [projectile.destroyedEffect, row.hitEffect]
          : [projectile.destroyedEffect]) {
          if (cueAudible(hit.at, elapsed))
            cues.push(
              ...player.cues(
                `${tower.id}:hit:${hit.index}:${effect}`,
                effect,
                hit.at,
                tower.id,
                hit.index,
              ),
            );
          const poses = player.poses(
            `${tower.id}:hit:${hit.index}:${effect}`,
            effect,
            hit.at,
            elapsed,
            point,
            tower.id,
            hit.index,
            reduced,
          );
          for (const pose of poses) if (hit.toAir) pose.depth = 8000;
          draw(poses, 'hit');
        }
      }
      if (record.destroyedAt !== undefined) {
        if (cueAudible(record.destroyedAt, elapsed))
          cues.push(
            ...player.cues(
              `${tower.id}:destroyed`,
              row.destroyEffect,
              record.destroyedAt,
              tower.id,
              0,
            ),
          );
        draw(
          player.poses(
            `${tower.id}:destroyed`,
            row.destroyEffect,
            record.destroyedAt,
            elapsed,
            p,
            tower.id,
            0,
            reduced,
          ),
          'destroy',
        );
      }
    }
    if (battle && live && !reduced)
      for (const shot of family?.projectiles ?? []) {
        // After the finish the simulation no longer lands orbs: stop them at impact.
        if (battle.finished && elapsed >= shot.impact) continue;
        flying.add(shot.id);
        const pose = monolithProjectilePose(shot, elapsed, iso, airLift);
        let view = this.projectiles.get(shot.id);
        if (!view) this.projectiles.set(shot.id, (view = new NativeSceneView(this.scene, PREFIX)));
        view.render(pose.poses, pose.x, pose.y, 8000);
        // One data object per orb, updated in place.
        let data = this.projectileData.get(shot.id);
        if (!data)
          this.projectileData.set(
            shot.id,
            (data = { id: shot.id, progress: pose.t, export: pose.export }),
          );
        data.progress = pose.t;
        for (const object of view.objects)
          if (object.getData('nativeMonolithProjectile') !== data)
            object.setData('nativeMonolithProjectile', data);
      }
    for (const [id, view] of this.towers)
      if (!wanted.has(id)) {
        view.destroy();
        this.towers.delete(id);
        this.signatures.delete(id);
      }
    for (const [key, view] of this.projectiles)
      if (!flying.has(key)) {
        view.destroy();
        this.projectiles.delete(key);
        this.projectileData.delete(key);
      }
    this.fx.sweep();
    return cues;
  }
  clear() {
    this.fx.clear();
    for (const map of [this.towers, this.projectiles]) {
      for (const view of map.values()) view.destroy();
      map.clear();
    }
    this.signatures.clear();
    this.projectileData.clear();
  }
  destroy() {
    this.clear();
  }
}
