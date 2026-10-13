import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { Building } from './model';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeSceneView, effectSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { NativeMeshView, preloadNativeMeshes } from './native-mesh-scene';
import type { NativeMeshPose } from './native-mesh';
import { presentationLive } from './presentation-clock';
import { guardRender } from './render-guard';
import {
  EAGLE_ARTILLERY_ART_LEVELS,
  eagleArtilleryAsset,
  eagleArtilleryTexture,
} from './eagle-artillery-art';
import {
  EAGLE_ARTILLERY_BASE_GRAPH,
  EAGLE_ARTILLERY_GRAPH,
  eagleArtilleryBasePoses,
  eagleArtilleryBeamFrame,
  eagleArtilleryBeamPoses,
  eagleArtilleryBounds,
  eagleArtilleryPivot,
  eagleArtilleryPoses,
  eagleArtilleryShellPoint,
  eagleArtilleryShellPose,
  eagleArtilleryTurretFrame,
  volleyShellIndex,
  type EagleArtilleryVisualState,
} from './eagle-artillery-poses';
import {
  EAGLE_ARTILLERY_SOUNDS,
  eagleArtilleryEffectPoses,
  eagleArtillerySample,
  eagleArtillerySoundCues,
  eagleArtilleryTrailPoses,
} from './eagle-artillery-effects';
import { EAGLE_ARTILLERY, EAGLE_ARTILLERY_EFFECTS } from './eagle-artillery-stats';

const PREFIX = 'eagle-artillery';
const BASE_PREFIX = 'eagle-artillery-base';
const DATA = 'eagleArtillery';

export function preloadEagleArtillery(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, EAGLE_ARTILLERY_GRAPH, PREFIX);
  preloadNativeMeshes(scene, EAGLE_ARTILLERY_BASE_GRAPH, BASE_PREFIX);
  for (const level of EAGLE_ARTILLERY_ART_LEVELS)
    scene.load.image(eagleArtilleryTexture(level), eagleArtilleryAsset(level));
  for (const [path, sound] of Object.entries(EAGLE_ARTILLERY_SOUNDS))
    scene.load.binary(eagleArtillerySample(path), '/' + sound.path);
}

/** State-driven presentation; rendering reads battle histories so replay seeks stay exact. */
export class EagleArtilleryPresentation implements LatePresentation {
  private bodies = new Map<number, NativeSceneView>();
  private bases = new Map<number, NativeMeshView>();
  /** Beams and shells: one view per key, with one data object each updated in place. */
  private flights = new Map<string, { view: NativeSceneView; data: Record<string, unknown> }>();
  /** Particle effects (pooled; see NativeEffectViews). */
  private fx: NativeEffectViews;
  private signatures = new Map<number, string>();
  private baseSignatures = new Map<number, string>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, PREFIX, DATA);
    for (const path of Object.keys(EAGLE_ARTILLERY_SOUNDS))
      registerCachedSample(scene, audio.samples, eagleArtillerySample(path));
  }
  /** True once this family renders the building itself (the fallback sprite is hidden). */
  handles(b: Building) {
    return b.kind === 'eagleartillery';
  }
  bounds(b: Building): readonly [number, number, number, number] | undefined {
    return this.handles(b)
      ? guardRender<readonly [number, number, number, number] | undefined>(
          `eagle artillery level ${b.level}`,
          () => eagleArtilleryBounds(b.level),
          undefined,
        )
      : undefined;
  }
  render(context: LateRenderContext): SampleCue[] {
    const { battle, elapsed, reduced, iso, airLift } = context;
    const cues: SampleCue[] = [],
      wanted = new Set<number>(),
      flying = new Set<string>();
    const state = battle?.late?.eagleArtillery;
    // Transient effects, beams and shells play on the presentation clock through the finish
    // grace; the turret holds the simulation clock so it stops with the battle.
    const live = presentationLive(battle);
    const bodyTime = battle ? battle.elapsed : elapsed;
    const show = (
      key: string,
      poses: Parameters<NativeSceneView['render']>[0],
      x: number,
      y: number,
      depth: number,
      data: Record<string, unknown>,
    ) => {
      flying.add(key);
      let flight = this.flights.get(key);
      if (!flight)
        this.flights.set(key, (flight = { view: effectSceneView(this.scene, PREFIX), data: {} }));
      flight.view.render(poses, x, y, depth);
      Object.assign(flight.data, data);
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
      air = false,
    ) => {
      if (!live) return;
      if (cueAudible(at, elapsed))
        cues.push(...eagleArtillerySoundCues(id, event, index, name, at));
      for (const fx of eagleArtilleryEffectPoses(
        id,
        event,
        index,
        name,
        at,
        elapsed,
        point,
        reduced,
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
      const p = iso(b.x + EAGLE_ARTILLERY.size / 2, b.y + EAGLE_ARTILLERY.size / 2);
      const tower = state?.towers[b.id];
      const visual: EagleArtilleryVisualState =
        b.hp <= 0 ? 'ruin' : b.constructing || b.upgradeEnd ? 'upgrading' : 'active';
      const key = `eagle artillery level ${b.level}`;
      const frame =
        visual === 'active'
          ? guardRender(key, () => eagleArtilleryTurretFrame(b.level, tower, bodyTime, reduced), 0)
          : 0;
      let base = this.bases.get(b.id);
      if (!base) this.bases.set(b.id, (base = new NativeMeshView(this.scene, BASE_PREFIX)));
      // The base is one static export: redraw only when it appears, moves or falls.
      const baseSignature = visual === 'ruin' ? 'ruin' : `${p.x}:${p.y}`;
      if (this.baseSignatures.get(b.id) !== baseSignature) {
        if (visual === 'ruin') base.clear();
        else base.render(eagleArtilleryBasePoses() as NativeMeshPose[], p.x, p.y, -880);
        this.baseSignatures.set(b.id, baseSignature);
      }
      let body = this.bodies.get(b.id);
      if (!body) {
        body = new NativeSceneView(this.scene, PREFIX);
        // Glow colors sit within 0..1: a GPU tint instead of a filter framebuffer per group.
        body.gpuGroupColor = true;
        this.bodies.set(b.id, body);
      }
      const ammunition = tower?.ammunition ?? EAGLE_ARTILLERY.ammunition,
        awake = tower?.awakeAt !== undefined;
      const signature = `${b.level}:${visual}:${frame}:${b.constructing ? 1 : 0}:${ammunition}:${awake}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(b.id) !== signature) {
        body.render(
          guardRender(key, () => eagleArtilleryPoses(b.level, visual, frame), []),
          p.x,
          p.y,
          p.y + (visual === 'ruin' ? -2 : 0),
          b.constructing ? 0.58 : 1,
        );
        const data = { id: b.id, level: b.level, state: visual, frame, ammunition, awake };
        for (const object of body.objects) object.setData(DATA, data);
        this.signatures.set(b.id, signature);
      }
      if (!battle || !tower || !live) continue;
      if (tower.destroyedAt !== undefined)
        effect(b.id, 'destroy', 0, EAGLE_ARTILLERY_EFFECTS.destroy, tower.destroyedAt, p);
      if (tower.emptyAt !== undefined)
        effect(b.id, 'empty', 0, EAGLE_ARTILLERY_EFFECTS.noAmmo, tower.emptyAt, p);
      const pivot = guardRender(key, () => eagleArtilleryPivot(b.level, frame), { x: 0, y: -96 });
      for (const volley of tower.volleys) {
        effect(
          b.id,
          'preattack',
          volley.index,
          EAGLE_ARTILLERY_EFFECTS.preAttack,
          volley.startedAt,
          p,
        );
        for (const [i, at] of volley.launches.entries())
          effect(
            b.id,
            'attack',
            volleyShellIndex(volley, i),
            EAGLE_ARTILLERY_EFFECTS.attack,
            at,
            p,
          );
        if (reduced) continue;
        // Beam up: from the barrel pivot until the burst ends; beam down: the reticle until landing.
        const upFrame = eagleArtilleryBeamFrame(
          'ExportNameBeamStart',
          volley.startedAt,
          volley.endedAt,
          elapsed,
        );
        if (upFrame !== undefined && b.hp > 0)
          show(
            `beam-up:${b.id}:${volley.index}`,
            eagleArtilleryBeamPoses('ExportNameBeamStart', upFrame),
            p.x + pivot.x,
            p.y + pivot.y,
            p.y + 0.5,
            { beam: 'up', frame: upFrame },
          );
        const inVolley = (s: { towerId: number; index: number }) =>
          s.towerId === b.id &&
          s.index > volley.index &&
          s.index <= volley.index + volley.launches.length;
        const shells = state!.shells.filter(inVolley);
        const impacts = state!.impacts.filter(inVolley);
        const landing = volley.launches.length
          ? shells.length
            ? undefined
            : impacts.at(-1)?.at
          : volley.endedAt;
        const current = volley === tower.volleys.at(-1) && tower.reticle;
        const target = current
          ? { x: tower.reticle![0] / 512 - 1, y: tower.reticle![1] / 512 - 1 }
          : (shells.at(-1) ?? impacts.at(-1));
        const downFrame = eagleArtilleryBeamFrame(
          'ExportNameBeamEnd',
          volley.startedAt,
          landing,
          elapsed,
        );
        if (downFrame !== undefined && target) {
          const g = iso(target.x, target.y);
          show(
            `beam-down:${b.id}:${volley.index}`,
            eagleArtilleryBeamPoses('ExportNameBeamEnd', downFrame),
            g.x,
            g.y,
            g.y + 1,
            { beam: 'down', frame: downFrame },
          );
        }
      }
    }
    if (battle && state && live) {
      for (const impact of state.impacts) {
        const ground = iso(impact.x, impact.y);
        effect(impact.towerId, 'hit', impact.index, EAGLE_ARTILLERY_EFFECTS.hit, impact.at, ground);
        effect(
          impact.towerId,
          'spell',
          impact.index,
          EAGLE_ARTILLERY_EFFECTS.spellHit,
          impact.spellAt,
          impact.air ? { x: ground.x, y: ground.y - airLift } : ground,
          impact.air,
        );
      }
      if (!reduced)
        for (const shell of state.shells) {
          if (shell.arrivedAt !== undefined || elapsed + 1e-9 < shell.launchedAt) continue;
          // After the finish the simulation no longer lands shells: stop them at arrival.
          if (battle.finished && elapsed >= shell.arrivesAt) continue;
          const pivot = wanted.has(shell.towerId)
            ? guardRender(
                `eagle artillery level ${shell.level}`,
                () =>
                  eagleArtilleryPivot(
                    shell.level,
                    eagleArtilleryTurretFrame(shell.level, state.towers[shell.towerId], elapsed),
                  ),
                { x: 0, y: -96 },
              )
            : { x: 0, y: -96 };
          const pose = eagleArtilleryShellPose(shell, elapsed, iso, pivot, airLift);
          show(`shell:${shell.id}`, pose.poses, pose.x, pose.y, 8000, {
            shell: shell.id,
            u: pose.u,
          });
          for (const fx of eagleArtilleryTrailPoses(
            shell.towerId,
            shell.index,
            shell.launchedAt,
            shell.arrivesAt,
            elapsed,
            (at) => eagleArtilleryShellPoint(shell, at, iso, pivot, airLift),
            reduced,
          ))
            this.fx.show(fx);
        }
    }
    for (const [id, view] of this.bodies)
      if (!wanted.has(id)) {
        view.destroy();
        this.bodies.delete(id);
        this.signatures.delete(id);
      }
    for (const [id, view] of this.bases)
      if (!wanted.has(id)) {
        view.destroy();
        this.bases.delete(id);
        this.baseSignatures.delete(id);
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
    for (const view of this.bases.values()) view.destroy();
    this.bodies.clear();
    this.bases.clear();
    this.flights.clear();
    this.signatures.clear();
    this.baseSignatures.clear();
  }
  destroy() {
    this.clear();
  }
}
