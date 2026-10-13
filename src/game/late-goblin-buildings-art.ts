import source from '../../reference/late-goblin-buildings/combat.json' with { type: 'json' };

export type LateGoblinBuildingKind =
  'comm-mast' | 'goblin-hall' | 'goblin-castle' | 'foreboding-cave' | 'goblin-boss-th';
type PreviewKey = keyof typeof source.previews;
/** Original source previews (2 px per native unit) registered at the local 1.2 world scale. */
function registered(key: PreviewKey, texture: string) {
  const { path, bounds, anchor } = source.previews[key];
  const [left, top, right, bottom] = bounds;
  return {
    texture,
    asset: '/' + path,
    width: (right - left) * source.worldScale,
    height: (bottom - top) * source.worldScale,
    originX: (anchor[0] - left) / (right - left),
    originY: (anchor[1] - top) / (bottom - top),
  };
}
/** Registered previews: fallback sprites, HUD portraits and selection sizing. The Goblin Hall
 * preview is level 1; level 2 and the Boss Town Hall share the weapon export `goblin_th02`. */
export const LATE_GOBLIN_BUILDING_ART: Record<
  LateGoblinBuildingKind,
  {
    texture: string;
    asset: string;
    width: number;
    height: number;
    originX: number;
    originY: number;
  }
> = {
  'comm-mast': registered('comm-mast', 'late-goblin-comm-mast'),
  'goblin-hall': registered('goblin-hall-1', 'late-goblin-hall-1'),
  'goblin-castle': registered('goblin-castle', 'late-goblin-castle'),
  'foreboding-cave': registered('foreboding-cave', 'late-goblin-foreboding-cave'),
  'goblin-boss-th': registered('goblin-th02', 'late-goblin-th02'),
};
export const isLateGoblinBuilding = (value: unknown): value is LateGoblinBuildingKind =>
  typeof value === 'string' && Object.hasOwn(LATE_GOBLIN_BUILDING_ART, value);
