export type WallMaterial = 'wood' | 'rubble' | 'stone' | 'iron' | 'gold' | 'crystal' | 'obsidian';
export type WallArt = {
  level: number;
  material: WallMaterial;
  height: number;
  linkHeight: number;
  face: number;
  shade: number;
  top: number;
  edge: number;
};
const WALL_ART: WallArt[] = [
  {
    level: 1,
    material: 'wood',
    height: 43,
    linkHeight: 21,
    face: 0x9e692c,
    shade: 0x6c421d,
    top: 0xe5b757,
    edge: 0x513317,
  },
  {
    level: 2,
    material: 'rubble',
    height: 39,
    linkHeight: 20,
    face: 0x928578,
    shade: 0x6e655d,
    top: 0xbeb0a0,
    edge: 0x514b45,
  },
  {
    level: 3,
    material: 'stone',
    height: 41,
    linkHeight: 22,
    face: 0x9e9588,
    shade: 0x777166,
    top: 0xc5b9a7,
    edge: 0x655e53,
  },
  {
    level: 4,
    material: 'iron',
    height: 43,
    linkHeight: 24,
    face: 0x4d4c48,
    shade: 0x303431,
    top: 0x89867b,
    edge: 0x222724,
  },
  {
    level: 5,
    material: 'gold',
    height: 44,
    linkHeight: 25,
    face: 0xd89d20,
    shade: 0x9e6912,
    top: 0xffdf6b,
    edge: 0x8c5c15,
  },
  {
    level: 6,
    material: 'crystal',
    height: 47,
    linkHeight: 26,
    face: 0xbb10c5,
    shade: 0x7e078f,
    top: 0xf364f4,
    edge: 0x68066d,
  },
  {
    level: 7,
    material: 'crystal',
    height: 49,
    linkHeight: 28,
    face: 0x632694,
    shade: 0x38115e,
    top: 0xa15bdd,
    edge: 0x2b1044,
  },
  {
    level: 8,
    material: 'obsidian',
    height: 47,
    linkHeight: 26,
    face: 0x363b3c,
    shade: 0x1f2629,
    top: 0x737777,
    edge: 0x171d20,
  },
];
/** The playable catalog supports levels 1–8; imported higher levels use the last available artwork. */
export const wallArt = (level: number): WallArt =>
  WALL_ART[Math.min(8, Math.max(1, Math.floor(level) || 1)) - 1];
export const wallTexture = (level: number) => `wall-level-${wallArt(level).level}`;
export const wallAsset = (level: number) =>
  `/assets/environment/walls-v1/level-${wallArt(level).level}.webp`;
export const WALL_ART_LEVELS = WALL_ART.map((a) => a.level);
