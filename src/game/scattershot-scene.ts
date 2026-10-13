import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { Building } from './model';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { preloadNativeMeshes } from './native-mesh-scene';
import { presentationLive } from './presentation-clock';
import { guardRender } from './render-guard';
import { SCATTERSHOT_ART_LEVELS, scattershotAsset, scattershotTexture } from './scattershot-art';
import {
  SCATTERSHOT_GRAPH,
  scattershotBounds,
  scattershotConePoses,
  scattershotPoses,
  scattershotProjectilePoint,
  scattershotProjectilePose,
  scattershotTurret,
  type ScattershotVisualState,
} from './scattershot-poses';
import {
  SCATTERSHOT_SOUNDS,
  scattershotEffectPoses,
  scattershotSample,
  scattershotSoundCues,
  scattershotTrailPoses,
} from './scattershot-effects';
import {
  SCATTERSHOT,
  SCATTERSHOT_EFFECTS,
  SCATTERSHOT_NATIVE_TILE,
  scattershotStats,
} from './scattershot-stats';
import type { ScattershotProjectile } from './scattershot';

const PREFIX = 'scattershot';
const DATA = 'scattershot';
/** Rock speed in tiles per second: `stepUnits` native units per 16 ms simulation subtick. */
const ROCK_SPEED = SCATTERSHOT.stepUnits / SCATTERSHOT_NATIVE_TILE / 0.016;

/**
 * The rock as presented: its simulated position while the battle runs; after the finish (the
 * simulation no longer steps it) it keeps flying toward its target at the source speed, and is
 * gone once it would have arrived.
 */
function presentedRock(p: ScattershotProjectile, overrun: number) {
  if (overrun <= 0) return p;
  const dx = p.targetX - p.x,
    dy = p.targetY - p.y,
    remaining = Math.hypot(dx, dy),
    step = overrun * ROCK_SPEED;
  if (step >= remaining) return undefined;
  return { ...p, x: p.x + (dx / remaining) * step, y: p.y + (dy / remaining) * step };
}

export function preloadScattershot(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, SCATTERSHOT_GRAPH, PREFIX);
  for (const level of SCATTERSHOT_ART_LEVELS)
    scene.load.image(scattershotTexture(level), scattershotAsset(level));
  for (const [path, sound] of Object.entries(SCATTERSHOT_SOUNDS))
    scene.load.binary(scattershotSample(path), '/' + sound.path);
}

/** State-driven presentation; rendering reads battle histories so replay seeks stay exact. */
export class ScattershotPresentation implements LatePresentation {
  private bodies = new Map<number, NativeSceneView>();
  /** Rocks, shadows and shard cones: one view per key, one data object each updated in place. */
  private flights = new Map<string, { view: NativeSceneView; data?: Record<string, unknown> }>();
  /** Particle effects (pooled; see NativeEffectViews). */
  private fx: NativeEffectViews;
  private signatures = new Map<number, string>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, PREFIX, DATA);
    for (const path of Object.keys(SCATTERSHOT_SOUNDS))
      registerCachedSample(scene, audio.samples, scattershotSample(path));
  }
  /** True once this family renders the building itself (the fallback sprite is hidden). */
  handles(b: Building) {
    return b.kind === 'scattershot';
  }
  bounds(b: Building): readonly [number, number, number, number] | undefined {
    return this.handles(b)
      ? guardRender<readonly [number, number, number, number] | undefined>(
          `scattershot level ${b.level}`,
          () => scattershotBounds(b.level),
          undefined,
        )
      : undefined;
  }
  render(context: LateRenderContext): SampleCue[] {
    const { battle, elapsed, reduced, iso, airLift } = context;
    const cues: SampleCue[] = [],
      wanted = new Set<number>(),
      flying = new Set<string>();
    const state = battle?.late?.scattershot;
    // Transient effects and rocks play on the presentation clock through the finish grace; the
    // turret holds the simulation clock so it stops with the battle.
    const live = presentationLive(battle);
    const bodyTime = battle ? battle.elapsed : elapsed;
    const show = (
      key: string,
      poses: Parameters<NativeSceneView['render']>[0],
      x: number,
      y: number,
      depth: number,
      data?: Record<string, unknown>,
    ) => {
      flying.add(key);
      let flight = this.flights.get(key);
      if (!flight)
        this.flights.set(key, (flight = { view: new NativeSceneView(this.scene, PREFIX) }));
      flight.view.render(poses, x, y, depth);
      if (!data) return;
      if (flight.data) Object.assign(flight.data, data);
      else flight.data = data;
      for (const object of flight.view.objects)
        if (object.getData(DATA) !== flight.data) object.setData(DATA, flight.data);
    };
    const effect = (
      id: number,
      event: string,
      index: number,
      name: string,
      at: number,
      point: { x: number; y: number },
      facing?: { x: number; y: number },
      air = false,
    ) => {
      if (!live) return;
      if (cueAudible(at, elapsed)) cues.push(...scattershotSoundCues(id, event, index, name, at));
      for (const fx of scattershotEffectPoses(
        id,
        event,
        index,
        name,
        at,
        elapsed,
        point,
        reduced,
        facing,
      )) {
        // Bursts raised onto a flying troop sort in front of it, not at its ground depth.
        if (air) fx.depth = 8000;
        this.fx.show(fx, { effect: name });
      }
    };
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    for (const b of context.buildings) {
      if (!this.handles(b)) continue;
      wanted.add(b.id);
      const p = iso(b.x + SCATTERSHOT.size / 2, b.y + SCATTERSHOT.size / 2);
      const tower = state?.towers[b.id];
      const visual: ScattershotVisualState =
        b.hp <= 0 ? 'ruin' : b.constructing || b.upgradeEnd ? 'upgrading' : 'active';
      const key = `scattershot level ${b.level}`;
      const turret =
        visual === 'ruin'
          ? 0
          : guardRender(key, () => scattershotTurret(tower, b.level, bodyTime, reduced), 0);
      let body = this.bodies.get(b.id);
      if (!body) this.bodies.set(b.id, (body = new NativeSceneView(this.scene, PREFIX)));
      const ammunition = tower?.ammunition ?? SCATTERSHOT.ammunition;
      const signature = `${b.level}:${visual}:${turret}:${b.constructing ? 1 : 0}:${ammunition}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(b.id) !== signature) {
        body.render(
          guardRender(key, () => scattershotPoses(b.level, visual, turret), []),
          p.x,
          p.y,
          p.y + (visual === 'ruin' ? -2 : 0),
          b.constructing ? 0.58 : 1,
        );
        const data = { id: b.id, level: b.level, state: visual, turret, ammunition };
        for (const object of body.objects) object.setData(DATA, data);
        this.signatures.set(b.id, signature);
      }
      if (!battle || !tower || !live) continue;
      if (tower.destroyedAt !== undefined)
        effect(b.id, 'destroy', 0, SCATTERSHOT_EFFECTS.destroy, tower.destroyedAt, p);
      for (const shot of tower.shots)
        effect(b.id, 'attack', shot.index, SCATTERSHOT_EFFECTS.attack, shot.at, p, {
          x: shot.dirX,
          y: shot.dirY,
        });
    }
    if (battle && state && live) {
      for (const impact of state.impacts) {
        const apex = iso(impact.x, impact.y);
        const ground = impact.air ? { x: apex.x, y: apex.y - airLift } : apex;
        const facing = { x: impact.dirX, y: impact.dirY };
        effect(
          impact.towerId,
          'hit',
          impact.index,
          SCATTERSHOT_EFFECTS.hit,
          impact.spellAt,
          ground,
          facing,
          impact.air,
        );
        if (!reduced) {
          const cone = scattershotConePoses(impact.dirX, impact.dirY, elapsed - impact.spellAt);
          if (cone.length)
            show(`cone:${impact.id}`, cone, ground.x, ground.y, 8000, { cone: impact.id });
        }
      }
      if (!reduced) {
        const overrun = battle.finished ? elapsed - battle.elapsed : 0;
        for (const rock of state.projectiles) {
          if (rock.arrivedAt !== undefined || elapsed <= rock.launchedAt + 1e-9) continue;
          const p = presentedRock(rock, overrun);
          if (!p) continue;
          const pose = guardRender(
            `scattershot level ${p.level}`,
            () => scattershotProjectilePose(p, iso, airLift, elapsed),
            undefined,
          );
          if (!pose) continue;
          // Above flying units (7500) like every other projectile type.
          show(`projectile:${p.id}`, pose.poses, pose.x, pose.y, 7700, {
            projectile: p.id,
            u: pose.u,
          });
          show(`shadow:${p.id}`, pose.shadow, pose.ground.x, pose.ground.y, -869);
          const span = Math.max(1e-6, elapsed - p.launchedAt);
          const trail = scattershotTrailPoses(
            p.towerId,
            p.index,
            scattershotStats(p.level).trailEmitter,
            p.launchedAt,
            elapsed,
            (at) => {
              const f = Math.max(0, Math.min(1, (at - p.launchedAt) / span));
              return scattershotProjectilePoint(
                {
                  fromX: p.fromX,
                  fromY: p.fromY,
                  x: p.fromX + (p.x - p.fromX) * f,
                  y: p.fromY + (p.y - p.fromY) * f,
                  targetX: p.targetX,
                  targetY: p.targetY,
                  air: p.air,
                },
                iso,
                airLift,
              );
            },
            reduced,
          );
          for (const fx of trail) this.fx.show(fx);
        }
      }
    }
    for (const [id, view] of this.bodies)
      if (!wanted.has(id)) {
        view.destroy();
        this.bodies.delete(id);
        this.signatures.delete(id);
      }
    for (const [key, flight] of this.flights)
      if (!flying.has(key)) {
        flight.view.destroy();
        this.flights.delete(key);
      }
    this.fx.sweep();
    return cues;
  }
  clear() {
    this.fx.clear();
    for (const view of this.bodies.values()) view.destroy();
    for (const flight of this.flights.values()) flight.view.destroy();
    this.bodies.clear();
    this.flights.clear();
    this.signatures.clear();
  }
  destroy() {
    this.clear();
  }
}
