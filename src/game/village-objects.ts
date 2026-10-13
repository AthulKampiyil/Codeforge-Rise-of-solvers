import catalog from '../../reference/village-objects/catalog.json' with { type: 'json' };
import { BUILD_MIN } from './grid';

/**
 * The client's village objects (reference/village-objects, logic/village_objects.csv): fixed
 * scenery beside the field that opens a feature when tapped. The Trader's camp opens Weekly
 * Deals from Town Hall 6 and the Super Troop building the Super Troop boosts from Town Hall 11.
 * See docs/VILLAGE-OBJECTS.md.
 */
export type VillageFeature = keyof typeof catalog.features;
export type VillageObjectState = 'idle' | 'active';
export interface VillageObjectArt {
  path: string;
  width: number;
  height: number;
  originX: number;
  originY: number;
  texture: string;
}
export interface VillageObjectDef {
  id: string;
  feature: VillageFeature;
  /** What a tap opens. */
  opens: 'trader' | 'super-troops';
  /** The registration point, in this game's tile coordinates. */
  x: number;
  y: number;
  art: Record<'idle', VillageObjectArt> & Partial<Record<VillageObjectState, VillageObjectArt>>;
}
type CatalogArt = Omit<VillageObjectArt, 'texture'>;
/** World pixels per source pixel, as the native buildings and decorations draw. */
export const VILLAGE_OBJECT_SCALE = 1.2;
/** The client's feature titles, descriptions and the Town Hall each arrives at. */
export const VILLAGE_FEATURES: Record<
  VillageFeature,
  { name: string; info: string; townhall: number }
> = catalog.features;
/**
 * The client places these by tile in its own coordinates, whose field starts at 0; this
 * game's starts at BUILD_MIN.
 */
export const VILLAGE_OBJECTS: readonly VillageObjectDef[] = catalog.objects.map((o) => ({
  id: o.id,
  feature: o.feature as VillageFeature,
  opens: o.opens as VillageObjectDef['opens'],
  x: o.tileX + BUILD_MIN,
  y: o.tileY + BUILD_MIN,
  art: {
    idle: { ...(o.art.idle as CatalogArt), texture: `village-object-${o.id}` },
    ...('active' in o.art && o.art.active
      ? { active: { ...(o.art.active as CatalogArt), texture: `village-object-${o.id}-active` } }
      : {}),
  },
}));

/** The objects a village of this Town Hall shows. */
export const villageObjects = (townhall: number) =>
  VILLAGE_OBJECTS.filter((o) => townhall >= VILLAGE_FEATURES[o.feature].townhall);

/**
 * The tiles each object stands on: a square as many tiles across as its art is wide (a tile is
 * 64 world pixels across), centred on its registration point and widened to whole tiles. The
 * client gives these objects no footprint; this one keeps decorations and regrowing obstacles
 * off the map's edge where the Trader's pots and the Trader stand.
 */
export function villageObjectFootprint(o: VillageObjectDef) {
  const across = Math.ceil((o.art.idle.width * VILLAGE_OBJECT_SCALE) / 64),
    x = Math.floor(o.x - across / 2),
    y = Math.floor(o.y - across / 2);
  return {
    x,
    y,
    size: Math.max(Math.ceil(o.x + across / 2) - x, Math.ceil(o.y + across / 2) - y),
  };
}
export const villageObjectFootprints = (townhall: number) =>
  villageObjects(townhall).map(villageObjectFootprint);
