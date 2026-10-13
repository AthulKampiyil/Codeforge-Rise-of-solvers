import goblinLevels from '../../reference/goblin-buildings/levels.json' with { type: 'json' };
import { GOBLIN_BUILDING_ART, goblinBuildingAsset, isGoblinBuilding } from './goblin-building-art';
import type { BuildingKind } from './data';
import { PUMPKIN_ART } from './pumpkin-bomb';
import { SANTA_ART } from './santa-art';
import { SHRINK_ART } from './shrink-trap-art';
import { FREEZE_TRAP_ART, freezeTrapAsset, freezeTrapTexture } from './freeze-trap-art';
import { GHOST_TRAP_ART, ghostTrapAsset, ghostTrapTexture } from './ghost-trap-art';
import { LATE_GOBLIN_BUILDING_ART, isLateGoblinBuilding } from './late-goblin-buildings-art';

/** Native campaign identities, independent of the player's upgrade catalog.
 * `kind` is the engine archetype; `npc` retains the exact enemy identity in replays.
 * Source: public client 18.400.21 building/trap tables, pinned in reference/.
 */
export const NPC_BUILDINGS = {
  'shrink-trap': {
    globalId: 12000017,
    kind: 'giantbomb',
    name: 'Shrink Trap',
    hp: [1],
    texture: SHRINK_ART.texture,
    size: 2,
  },
  'santa-trap': {
    globalId: 12000007,
    kind: 'bomb',
    name: 'Santa Strike',
    hp: [1],
    texture: SANTA_ART.texture,
    size: 1,
  },
  'pumpkin-bomb': {
    globalId: 12000003,
    kind: 'bomb',
    name: 'Pumpkin Bomb',
    hp: [1],
    texture: PUMPKIN_ART.texture,
    size: 1,
  },
  'goblin-townhall': {
    globalId: 1000001,
    kind: 'townhall',
    name: 'Goblin Town Hall',
    hp: goblinLevels['goblin-townhall'].levels.map((v) => v.hp),
    texture: GOBLIN_BUILDING_ART['goblin-townhall'].texture,
    size: 4,
  },
  'goblin-hut': {
    globalId: 1000018,
    kind: 'builder',
    name: 'Goblin Hut',
    hp: [250],
    texture: GOBLIN_BUILDING_ART['goblin-hut'].texture,
    size: 2,
  },
  'tutorial-cannon': {
    globalId: 1000060,
    kind: 'cannon',
    name: 'Cannon',
    hp: [250],
    texture: 'cannon',
    size: 3,
  },
  // Late single-player identities (client villages 62–90). Levels are one-based.
  'freeze-trap': {
    globalId: 12000018,
    kind: 'giantbomb',
    name: 'Goblin Freeze Trap',
    hp: [1],
    texture: freezeTrapTexture(1),
    size: 2,
  },
  'ghost-trap': {
    globalId: 12000019,
    kind: 'bomb',
    name: 'Ghost Trap',
    hp: [1],
    texture: ghostTrapTexture(1),
    size: 1,
  },
  'comm-mast': {
    globalId: 1000016,
    kind: 'builder',
    name: 'Communications Mast',
    hp: [250],
    texture: LATE_GOBLIN_BUILDING_ART['comm-mast'].texture,
    size: 2,
  },
  'goblin-hall': {
    globalId: 1000017,
    kind: 'townhall',
    name: 'Goblin Hall',
    hp: [750, 7500],
    texture: LATE_GOBLIN_BUILDING_ART['goblin-hall'].texture,
    size: 4,
  },
  'goblin-castle': {
    globalId: 1000061,
    kind: 'clancastle',
    name: 'Goblin Castle',
    hp: [4000],
    texture: LATE_GOBLIN_BUILDING_ART['goblin-castle'].texture,
    size: 3,
  },
  'foreboding-cave': {
    globalId: 1000062,
    kind: 'camp',
    name: 'Foreboding Cave',
    hp: [25000],
    texture: LATE_GOBLIN_BUILDING_ART['foreboding-cave'].texture,
    size: 4,
  },
  'goblin-boss-th': {
    globalId: 1000069,
    kind: 'townhall',
    name: 'Goblin Hall',
    hp: [50000],
    texture: LATE_GOBLIN_BUILDING_ART['goblin-boss-th'].texture,
    size: 4,
  },
} as const;
export type NpcBuildingKind = keyof typeof NPC_BUILDINGS;
export const npcMaxLevel = (value: unknown) =>
  typeof value === 'string' && Object.hasOwn(NPC_BUILDINGS, value)
    ? NPC_BUILDINGS[value as NpcBuildingKind].hp.length
    : undefined;
export function validNpcBuilding(value: unknown, kind: BuildingKind, level: number) {
  if (value === undefined) return true;
  if (typeof value !== 'string' || !Object.hasOwn(NPC_BUILDINGS, value)) return false;
  const d = NPC_BUILDINGS[value as NpcBuildingKind];
  return d.kind === kind && Number.isInteger(level) && level >= 1 && level <= d.hp.length;
}
/** Native DamagePerSecond=2, AttackSpeed=800 ms; the player Cannon has 7 DPS. */
export const TUTORIAL_CANNON_DAMAGE = 2 * 0.8;
export const npcAsset = (npc: NpcBuildingKind) =>
  isLateGoblinBuilding(npc)
    ? LATE_GOBLIN_BUILDING_ART[npc].asset
    : npc === 'freeze-trap'
      ? freezeTrapAsset(1)
      : npc === 'ghost-trap'
        ? ghostTrapAsset(1)
        : npc === 'shrink-trap'
          ? SHRINK_ART.asset
          : isGoblinBuilding(npc)
            ? goblinBuildingAsset(npc)
            : npc === 'santa-trap'
              ? SANTA_ART.asset
              : npc === 'pumpkin-bomb'
                ? PUMPKIN_ART.asset
                : '/assets/buildings/cannon.webp';
/** Registered native Goblin previews share their live clip's anchor and scale. */
export const npcArt = (npc: NpcBuildingKind) =>
  isLateGoblinBuilding(npc)
    ? LATE_GOBLIN_BUILDING_ART[npc]
    : npc === 'freeze-trap'
      ? { ...FREEZE_TRAP_ART, texture: freezeTrapTexture(1) }
      : npc === 'ghost-trap'
        ? { ...GHOST_TRAP_ART, texture: ghostTrapTexture(1) }
        : npc === 'shrink-trap'
          ? SHRINK_ART
          : isGoblinBuilding(npc)
            ? GOBLIN_BUILDING_ART[npc]
            : npc === 'santa-trap'
              ? SANTA_ART
              : npc === 'pumpkin-bomb'
                ? PUMPKIN_ART
                : undefined;
