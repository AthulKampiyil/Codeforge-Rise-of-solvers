import { BUILDINGS, type BuildingKind } from './data';
import { BUILD_MAX, BUILD_MIN, MAP_SIZE } from './grid';

/**
 * Shareable layout codes, this game's take on the original's "Copy Layout" links: the positions
 * of every building by kind, so another village can map them onto its own buildings.
 *
 *   1.<town hall>.<kind>:<xy><xy>….<kind>:<xy>…
 *
 * Each coordinate is one character of the URL-safe base-64 alphabet (the field is 48 tiles).
 * Building modes (an X-Bow's target, an Inferno's mode) stay as each village has them.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VERSION = '1';
type Placed = { kind: BuildingKind; x: number; y: number };
export interface SharedLayout {
  townhall: number;
  positions: Partial<Record<BuildingKind, { x: number; y: number }[]>>;
}

export function encodeLayout(townhall: number, buildings: readonly Placed[]) {
  const groups = new Map<BuildingKind, string>();
  for (const b of buildings) {
    if (!Number.isInteger(b.x) || !Number.isInteger(b.y)) continue;
    groups.set(b.kind, (groups.get(b.kind) ?? '') + ALPHABET[b.x] + ALPHABET[b.y]);
  }
  return [VERSION, String(townhall), ...[...groups].map(([kind, xy]) => `${kind}:${xy}`)].join('.');
}

/** The layout a code describes, or null when it is damaged or does not fit the field. */
export function decodeLayout(code: string): SharedLayout | null {
  const [version, townhall, ...groups] = code.trim().split('.');
  const th = Number(townhall);
  if (version !== VERSION || !Number.isInteger(th) || th < 1 || th > 99) return null;
  const positions: SharedLayout['positions'] = {};
  const placed: Placed[] = [];
  for (const group of groups) {
    const [kind, xy, extra] = group.split(':');
    if (extra !== undefined || !(kind in BUILDINGS) || !xy || xy.length % 2) return null;
    const list = (positions[kind as BuildingKind] ??= []);
    const size = BUILDINGS[kind as BuildingKind].size;
    for (let i = 0; i < xy.length; i += 2) {
      const x = ALPHABET.indexOf(xy[i]),
        y = ALPHABET.indexOf(xy[i + 1]);
      if (x < 0 || y < 0 || x + size > MAP_SIZE || y + size > MAP_SIZE) return null;
      list.push({ x, y });
      placed.push({ kind: kind as BuildingKind, x, y });
    }
  }
  if (!placed.length || overlapping(placed)) return null;
  return { townhall: th, positions };
}

const overlaps = (a: Placed, b: Placed) =>
  a.x < b.x + BUILDINGS[b.kind].size &&
  a.x + BUILDINGS[a.kind].size > b.x &&
  a.y < b.y + BUILDINGS[b.kind].size &&
  a.y + BUILDINGS[a.kind].size > b.y;
function overlapping(placed: readonly Placed[]) {
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++) if (overlaps(placed[i], placed[j])) return true;
  return false;
}

/**
 * Maps a shared layout onto a village: each kind's buildings, in id order, take that kind's
 * shared places in order. Buildings the layout has no place for (the village has more of a
 * kind, or the code a different set) are set aside on the first free tiles, scanning the field
 * from its top corner, clear of obstacles; the original moves them to its layout storage.
 */
export function fitLayout(
  shared: SharedLayout,
  buildings: readonly { id: number; kind: BuildingKind; x: number; y: number }[],
  blocked: (x: number, y: number, size: number) => boolean,
) {
  const slots: { id: number; x: number; y: number }[] = [];
  const taken = new Uint8Array(MAP_SIZE * MAP_SIZE);
  const free = (x: number, y: number, size: number) => {
    for (let j = y; j < y + size; j++)
      for (let i = x; i < x + size; i++) if (taken[j * MAP_SIZE + i]) return false;
    return true;
  };
  const take = (id: number, x: number, y: number, size: number) => {
    for (let j = y; j < y + size; j++)
      for (let i = x; i < x + size; i++) taken[j * MAP_SIZE + i] = 1;
    slots.push({ id, x, y });
  };
  const rest: (typeof buildings)[number][] = [];
  const byKind = new Map<BuildingKind, (typeof buildings)[number][]>();
  for (const b of [...buildings].sort((a, b) => a.id - b.id))
    byKind.set(b.kind, [...(byKind.get(b.kind) ?? []), b]);
  for (const [kind, list] of byKind) {
    const places = shared.positions[kind] ?? [],
      size = BUILDINGS[kind].size;
    list.forEach((b, i) => {
      const at = places[i];
      if (at && !blocked(at.x, at.y, size)) take(b.id, at.x, at.y, size);
      else rest.push(b);
    });
  }
  // Largest first, so a big building still finds a gap among the walls.
  rest.sort((a, b) => BUILDINGS[b.kind].size - BUILDINGS[a.kind].size || a.id - b.id);
  for (const b of rest) {
    const size = BUILDINGS[b.kind].size;
    let found = false;
    search: for (let y = BUILD_MIN; y + size <= BUILD_MAX; y++)
      for (let x = BUILD_MIN; x + size <= BUILD_MAX; x++)
        if (free(x, y, size) && !blocked(x, y, size)) {
          take(b.id, x, y, size);
          found = true;
          break search;
        }
    if (!found) return null;
  }
  return { slots, setAside: rest.length };
}

/** The layout code in a link (`#layout=…` or `?layout=…`), if it carries one. */
export function layoutFromLink(link: string) {
  const match = /[#?&]layout=([^&#\s]+)/.exec(link);
  return match ? decodeURIComponent(match[1]) : null;
}
export const layoutLink = (origin: string, code: string) =>
  `${origin}/#layout=${encodeURIComponent(code)}`;
