export const GOBLIN_BUILDING_ART = {
  'goblin-townhall': {
    texture: 'goblin-townhall-native',
    export: 'goblin_townhall_lvl1',
    base: 'goblin_townhall_base',
    scale: 1.2,
    anchorX: 0,
    anchorY: 80,
    width: 240,
    height: 216,
    originX: 0.5,
    originY: 110 / 180,
    // Ground decals are registered independently to the local four-tile diamond.
    baseBounds: [-112.5, -15.85, 111.25, 178.95],
    size: 4,
  },
  'goblin-hut': {
    texture: 'goblin-hut-native',
    export: 'goblin_hut_lvl1',
    base: 'goblin_hut_base',
    scale: 1.2,
    anchorX: 0,
    anchorY: 40,
    width: 168,
    height: 156,
    originX: 0.5,
    originY: 70 / 130,
    baseBounds: [-64.45, 2.55, 53.3, 82.55],
    size: 2,
  },
} as const;
export type GoblinBuildingKind = keyof typeof GOBLIN_BUILDING_ART;
export const isGoblinBuilding = (value: unknown): value is GoblinBuildingKind =>
  typeof value === 'string' && Object.hasOwn(GOBLIN_BUILDING_ART, value);
export const goblinBuildingAsset = (kind: GoblinBuildingKind) =>
  `/assets/buildings/goblin-native/${GOBLIN_BUILDING_ART[kind].export}.png`;
