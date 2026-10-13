import type Phaser from 'phaser';
import type { AudioManager } from './audio';
import type { Battle, Building } from './model';
import type { SampleCue } from './sample-audio';
import { presentationTime } from './presentation-clock';
import { BuilderHutPresentation, preloadBuilderHut } from './builder-hut-scene';
import { DefendingBuilderPresentation } from './defending-builder-scene';
import { EagleArtilleryPresentation, preloadEagleArtillery } from './eagle-artillery-scene';
import { FreezeTrapPresentation, preloadFreezeTrap } from './freeze-trap-scene';
import { GhostTrapPresentation, preloadGhostTrap } from './ghost-trap-scene';
import {
  LateGoblinBuildingsPresentation,
  preloadLateGoblinBuildings,
} from './late-goblin-buildings-scene';
import { MonolithPresentation, preloadMonolith } from './monolith-scene';
import { ScattershotPresentation, preloadScattershot } from './scattershot-scene';
import { SpellTowerPresentation, preloadSpellTower } from './spell-tower-scene';
import { TornadoTrapPresentation, preloadTornadoTrap } from './tornado-trap-scene';

export interface LateRenderContext {
  /** Buildings currently visible to the player (concealed traps are excluded). */
  buildings: Building[];
  battle: Battle | null;
  /**
   * Battle time (the presentation clock: it runs on for a short grace after the finish),
   * or the home render clock outside battle.
   */
  elapsed: number;
  reduced: boolean;
  iso: (x: number, y: number) => { x: number; y: number };
  airLift: number;
}
export interface LatePresentation {
  handles(building: Building): boolean;
  /** Registered source bounds relative to the building's ground center. */
  bounds(building: Building): readonly [number, number, number, number] | undefined;
  render(context: LateRenderContext): SampleCue[];
  clear(): void;
  destroy(): void;
}

export function preloadLateCampaign(scene: Phaser.Scene) {
  preloadSpellTower(scene);
  preloadTornadoTrap(scene);
  preloadFreezeTrap(scene);
  preloadGhostTrap(scene);
  preloadEagleArtillery(scene);
  preloadScattershot(scene);
  preloadMonolith(scene);
  preloadLateGoblinBuildings(scene);
  preloadBuilderHut(scene);
}

/** One scene entry point for every late single-player campaign family. */
export class LateCampaignPresentation {
  private families: LatePresentation[];
  constructor(scene: Phaser.Scene, audio: AudioManager) {
    this.families = [
      new SpellTowerPresentation(scene, audio),
      new TornadoTrapPresentation(scene, audio),
      new FreezeTrapPresentation(scene, audio),
      new GhostTrapPresentation(scene, audio),
      new EagleArtilleryPresentation(scene, audio),
      new ScattershotPresentation(scene, audio),
      new MonolithPresentation(scene, audio),
      new LateGoblinBuildingsPresentation(scene, audio),
      new BuilderHutPresentation(scene, audio),
      new DefendingBuilderPresentation(scene, audio),
    ];
  }
  handles(building: Building) {
    return this.families.some((family) => family.handles(building));
  }
  bounds(building: Building) {
    for (const family of this.families)
      if (family.handles(building)) return family.bounds(building);
    return undefined;
  }
  render(context: LateRenderContext) {
    // Transient effects play out on the presentation clock after the battle finishes.
    if (context.battle) context = { ...context, elapsed: presentationTime(context.battle) };
    return this.families.flatMap((family) => family.render(context));
  }
  clear() {
    for (const family of this.families) family.clear();
  }
  destroy() {
    for (const family of this.families) family.destroy();
  }
}
