import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { LatePresentation, LateRenderContext } from './late-campaign-scene';
import type { Building } from './model';
import { cueAudible, registerCachedSample, type SampleCue } from './sample-audio';
import { NativeSceneView, quantizedDensity } from './native-scene-view';
import { NativeEffectViews } from './native-effect-views';
import { presentationLive } from './presentation-clock';
import { guardRender } from './render-guard';
import { preloadNativeMeshes } from './native-mesh-scene';
import type { NativeParticlePose } from './native-particles';
import {
  SPELL_TOWER_ART_LEVELS,
  SPELL_TOWER_ART_WEAPONS,
  spellTowerAsset,
  spellTowerTexture,
} from './spell-tower-art';
import {
  SPELL_TOWER_EFFECTS,
  SPELL_TOWER_EMITTERS,
  SPELL_TOWER_GRAPH,
  SPELL_TOWER_SOUNDS,
  spellBottleFlightPoint,
  spellBottlePose,
  spellTowerBounds,
  spellTowerFrame,
  spellTowerPoses,
  spellTowerTimeKey,
  type SpellTowerVisualState,
} from './spell-tower-poses';
import { SPELL_TOWER, spellTowerStats } from './spell-tower-stats';
import { sourceEffectPlayer } from './spell-tower-effect-player';
import type { SpellTowerWeapon } from './late-campaign';

const PREFIX = 'spell-tower-native';
const sample = (path: string) => `spell-tower-${path.split('/').at(-1)!.replace('.ogg', '')}`;
/** Range markers stay visible, static and unfaded under reduced motion. */
const player = sourceEffectPlayer({
  graph: SPELL_TOWER_GRAPH,
  effects: SPELL_TOWER_EFFECTS,
  emitters: SPELL_TOWER_EMITTERS,
  artScale: 1.2,
  sample,
  prefix: 'spell-tower',
  reducedEmitters: ['rage_rangeRing3', 'Toxic_rangeRing1', 'invisibility_lvl6_ring2'],
});
/** Landing effects of each weapon's cast: the bottle break and the spell's deploy effects. */
const castEffects = new Map<SpellTowerWeapon, { name: string; end: number }[]>();
function landingEffects(weapon: SpellTowerWeapon) {
  let result = castEffects.get(weapon);
  if (!result) {
    const row = SPELL_TOWER[weapon];
    result = [row.projectile.destroyedEffect, row.spell.deployEffect, row.spell.deployEffect2]
      .filter((name): name is string => !!name)
      .map((name) => ({ name, end: player.duration(name) + 0.05 }));
    castEffects.set(weapon, result);
  }
  return result;
}

export function preloadSpellTower(scene: Phaser.Scene) {
  preloadNativeMeshes(scene, SPELL_TOWER_GRAPH, PREFIX);
  for (const level of SPELL_TOWER_ART_LEVELS)
    for (const weapon of SPELL_TOWER_ART_WEAPONS)
      scene.load.image(spellTowerTexture(level, weapon), spellTowerAsset(level, weapon));
  for (const [path, sound] of Object.entries(SPELL_TOWER_SOUNDS))
    scene.load.binary(sample(path), '/' + sound.path);
}

const visualState = (b: Building): SpellTowerVisualState =>
  b.hp <= 0 ? 'ruin' : b.constructing ? 'constructing' : b.upgradeEnd ? 'upgrading' : 'setup';

/** State-driven presentation; rendering reads battle histories so replay seeks stay exact. */
export class SpellTowerPresentation implements LatePresentation {
  readonly towers = new Map<number, NativeSceneView>();
  readonly bottles = new Map<number, NativeSceneView>();
  private fx: NativeEffectViews;
  /** Live effect views by key (pooled; see NativeEffectViews). */
  readonly effects: Map<string, NativeSceneView>;
  private signatures = new Map<number, string>();
  private bottleData = new Map<number, { cast: number; weapon: string; progress: number }>();
  constructor(
    private scene: Phaser.Scene,
    audio: AudioManager,
  ) {
    this.fx = new NativeEffectViews(scene, PREFIX, 'nativeSpellTowerEffect');
    this.effects = this.fx.views;
    for (const path of Object.keys(SPELL_TOWER_SOUNDS))
      registerCachedSample(scene, audio.samples, sample(path));
  }
  /** True once this family renders the building itself (the fallback sprite is hidden). */
  handles(b: Building) {
    return b.kind === 'spelltower';
  }
  bounds(b: Building): readonly [number, number, number, number] | undefined {
    return b.kind === 'spelltower'
      ? guardRender(
          `spell tower level ${b.level}`,
          () => spellTowerBounds(b.level, b.spellTowerWeapon ?? 'rage', visualState(b)),
          undefined,
        )
      : undefined;
  }
  render(context: LateRenderContext): SampleCue[] {
    const { battle, elapsed, reduced, iso } = context;
    // Transient effects run on the presentation clock (`elapsed`) through the finish grace;
    // tower bodies hold the simulation clock so they stop with the battle.
    const live = presentationLive(battle);
    const bodyTime = battle ? battle.elapsed : elapsed;
    const wanted = new Set<number>(),
      flying = new Set<number>(),
      cues: SampleCue[] = [];
    const camera = this.scene.cameras.main;
    const zoom = quantizedDensity(Math.max(1, camera.zoomX, camera.zoomY));
    const draw = (poses: NativeParticlePose[], tag: string) => {
      for (const fx of poses) this.fx.show(fx, { tag });
    };
    const family = battle?.late?.spellTower;
    for (const tower of context.buildings) {
      if (tower.kind !== 'spelltower') continue;
      wanted.add(tower.id);
      const weapon = tower.spellTowerWeapon ?? 'rage';
      const p = iso(tower.x + 1, tower.y + 1);
      const state = visualState(tower);
      const record = family?.towers[tower.id];
      const frame = spellTowerFrame(tower, record, bodyTime, reduced);
      const seconds = reduced ? 0 : bodyTime;
      const ruinAge = record?.destroyedAt !== undefined ? elapsed - record.destroyedAt : Infinity;
      let view = this.towers.get(tower.id);
      if (!view) this.towers.set(tower.id, (view = new NativeSceneView(this.scene, PREFIX)));
      const key = `spell tower level ${tower.level}`;
      // The time term is the source frame of each animated export only; idle bodies are static.
      const time = guardRender(
        key,
        () => spellTowerTimeKey(tower.level, weapon, state, seconds, ruinAge),
        '',
      );
      const signature = `${tower.level}:${weapon}:${state}:${frame}:${time}:${p.x}:${p.y}:${zoom}`;
      if (this.signatures.get(tower.id) !== signature) {
        view.render(
          guardRender(
            key,
            () => spellTowerPoses(tower.level, weapon, state, frame, seconds, ruinAge),
            [],
          ),
          p.x,
          p.y,
          p.y + (state === 'ruin' ? -2 : 0),
        );
        const data = { id: tower.id, weapon, state, frame };
        for (const object of view.objects) object.setData('nativeSpellTower', data);
        this.signatures.set(tower.id, signature);
      }
      if (battle && live && record?.destroyedAt !== undefined) {
        const effect = guardRender(key, () => spellTowerStats(tower.level).destroyEffect, '');
        if (effect) {
          if (cueAudible(record.destroyedAt, elapsed))
            cues.push(
              ...player.cues(`${tower.id}:destroyed`, effect, record.destroyedAt, tower.id, 0),
            );
          draw(
            player.poses(
              `${tower.id}:destroyed`,
              effect,
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
    }
    if (battle && live && family)
      for (const entry of family.casts) {
        if (elapsed < entry.at) continue;
        const weapon = SPELL_TOWER[entry.weapon];
        const seed = entry.sourceId * 7 + entry.index;
        if (elapsed < entry.deployAt && !reduced) {
          flying.add(entry.index);
          const pose = spellBottlePose(entry, elapsed, iso);
          let view = this.bottles.get(entry.index);
          if (!view)
            this.bottles.set(entry.index, (view = new NativeSceneView(this.scene, PREFIX)));
          view.render(pose.poses, pose.x, pose.y, pose.depth);
          // One data object per bottle, updated in place.
          let data = this.bottleData.get(entry.index);
          if (!data)
            this.bottleData.set(
              entry.index,
              (data = { cast: entry.index, weapon: entry.weapon, progress: pose.t }),
            );
          data.progress = pose.t;
          for (const object of view.objects)
            if (object.getData('nativeSpellBottle') !== data)
              object.setData('nativeSpellBottle', data);
        }
        if (weapon.projectile.particleEmitter)
          draw(
            player.trail(
              `cast:${entry.index}:trail`,
              weapon.projectile.particleEmitter,
              entry.at,
              entry.deployAt,
              undefined,
              elapsed,
              (at) => spellBottleFlightPoint(entry, at, iso),
              seed,
              0,
              8000,
              reduced,
            ),
            'bottle-trail',
          );
        const center = iso(entry.x, entry.y);
        for (const { name, end } of landingEffects(entry.weapon)) {
          if (elapsed >= entry.deployAt + end) continue;
          if (cueAudible(entry.deployAt, elapsed))
            cues.push(...player.cues(`cast:${entry.index}:${name}`, name, entry.deployAt, seed, 1));
          draw(
            player.poses(
              `cast:${entry.index}:${name}`,
              name,
              entry.deployAt,
              elapsed,
              center,
              seed,
              1,
              reduced,
            ),
            entry.weapon,
          );
        }
      }
    for (const [id, view] of this.towers)
      if (!wanted.has(id)) {
        view.destroy();
        this.towers.delete(id);
        this.signatures.delete(id);
      }
    for (const [key, view] of this.bottles)
      if (!flying.has(key)) {
        view.destroy();
        this.bottles.delete(key);
        this.bottleData.delete(key);
      }
    this.fx.sweep();
    return cues;
  }
  clear() {
    this.fx.clear();
    for (const map of [this.towers, this.bottles]) {
      for (const view of map.values()) view.destroy();
      map.clear();
    }
    this.signatures.clear();
    this.bottleData.clear();
  }
  destroy() {
    this.clear();
  }
}
