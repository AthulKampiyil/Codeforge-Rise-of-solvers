import catalog from '../../reference/decorations/catalog.json' with { type: 'json' };
import { MAP_SIZE } from './grid';

/**
 * The decorations the client's Shop sells (reference/decorations, logic/decos.csv): purely
 * ornamental objects bought for Elixir, Gold or Gems, placed anywhere on the map including the
 * outer edge that only obstacles and decorations may use, and stashed back into the Shop to be
 * placed again for free. See docs/DECORATIONS.md.
 */
export interface DecorationDef {
  id: string;
  name: string;
  size: number;
  resource: 'gold' | 'elixir' | 'gems';
  cost: number;
  /** Experience level the Shop asks for. */
  chiefLevel: number;
  /** How many one village may own, placed and stashed together. */
  max: number;
  art: { path: string; width: number; height: number; originX: number; originY: number };
  texture: string;
}
export type DecorationKind = string;
export const DECORATIONS: Record<DecorationKind, DecorationDef> = Object.fromEntries(
  catalog.decorations.map((d) => [d.id, { ...d, texture: `decoration-${d.id}` } as DecorationDef]),
);
/** The Shop's order. */
export const DECORATION_KINDS: readonly DecorationKind[] = catalog.decorations.map((d) => d.id);
/** The client's own Shop tab name and stash dialog. */
export const DECORATION_TEXTS = catalog.texts;
/**
 * Source pixels from an export's origin down to its footprint's centre: the client's plinths and
 * ground patches (statue_base, deco_flowerbox1_base, …) centre about 40 below it.
 */
export const DECORATION_GROUND = 40;
/** World pixels per source pixel, as the native buildings draw. */
export const DECORATION_SCALE = 1.2;

export interface Decoration {
  id: number;
  kind: DecorationKind;
  x: number;
  y: number;
}
/** Bought decorations held in the Shop, by kind. */
export type StashedDecorations = Partial<Record<DecorationKind, number>>;

export function overlapsDecoration(
  decorations: readonly Decoration[],
  x: number,
  y: number,
  size: number,
  ignore?: number,
) {
  return decorations.some(
    (d) =>
      d.id !== ignore &&
      x < d.x + DECORATIONS[d.kind].size &&
      x + size > d.x &&
      y < d.y + DECORATIONS[d.kind].size &&
      y + size > d.y,
  );
}
export const decorationFootprints = (decorations: readonly Decoration[]) =>
  decorations.map((d) => ({ x: d.x, y: d.y, size: DECORATIONS[d.kind].size }));
/** Inside the map: decorations may stand on the edge outside the building area. */
export const insideMap = (kind: DecorationKind, x: number, y: number) =>
  Number.isInteger(x) &&
  Number.isInteger(y) &&
  x >= 0 &&
  y >= 0 &&
  x + DECORATIONS[kind].size <= MAP_SIZE &&
  y + DECORATIONS[kind].size <= MAP_SIZE;
export const ownedDecorations = (
  decorations: readonly Decoration[],
  stashed: StashedDecorations,
  kind: DecorationKind,
) => decorations.filter((d) => d.kind === kind).length + (stashed[kind] ?? 0);

/** Placed decorations: known kinds, unique ids, on the map and clear of one another. */
export function validDecorations(value: unknown): value is Decoration[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<number>();
  for (const [i, d] of value.entries()) {
    if (
      !d ||
      typeof d !== 'object' ||
      !Object.hasOwn(DECORATIONS, d.kind) ||
      !Number.isSafeInteger(d.id) ||
      d.id < 1 ||
      ids.has(d.id) ||
      !insideMap(d.kind, d.x, d.y) ||
      overlapsDecoration(value.slice(0, i), d.x, d.y, DECORATIONS[d.kind].size)
    )
      return false;
    ids.add(d.id);
  }
  return true;
}
export function validStashedDecorations(value: unknown): value is StashedDecorations {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([kind, count]) => Object.hasOwn(DECORATIONS, kind) && Number.isInteger(count) && count >= 1,
    )
  );
}
/** No kind owned beyond its Shop limit, placed and stashed together. */
export const withinDecorationLimits = (
  decorations: readonly Decoration[],
  stashed: StashedDecorations,
) => DECORATION_KINDS.every((k) => ownedDecorations(decorations, stashed, k) <= DECORATIONS[k].max);
