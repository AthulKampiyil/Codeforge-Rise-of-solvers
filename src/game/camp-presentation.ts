import { OBSTACLES, type Obstacle } from './obstacles';
import { campCapacity } from './camp-stats';
import { MAP_SIZE } from './grid';
import { BUILDINGS, isTrap, TROOPS, TROOP_KEYS, type TroopKind } from './data';
import type { Army, Building } from './model';

type Point = { x: number; y: number };
export type CampActor = {
  id: string;
  kind: TroopKind;
  campId: number;
  route: Point[];
  phase: number;
  offsetX: number;
  offsetY: number;
};
// Preserve the visible roster of old saves that could prepare 660 one-space troops.
// This is a rendering safety limit, not camp capacity or a training allowance.
export const MAX_CAMP_ACTORS = 660;

export function campPlan(
  army: Army,
  buildings: Building[],
  obstacles: readonly Obstacle[] = [],
): CampActor[] {
  const camps = buildings.filter((b) => b.kind === 'camp' && !b.constructing);
  if (!camps.length || !TROOP_KEYS.some((k) => army[k] > 0)) return [];
  const occupied = new Set<string>();
  for (const b of buildings) {
    if (isTrap(b.kind)) continue;
    // A completed camp is an open gathering area around its central 2×2 pit.
    // Construction scaffolding and other buildings still block their full area.
    const inset = b.kind === 'camp' && !b.constructing ? 1 : 0;
    for (let x = b.x + inset; x < b.x + BUILDINGS[b.kind].size - inset; x++)
      for (let y = b.y + inset; y < b.y + BUILDINGS[b.kind].size - inset; y++)
        occupied.add(`${x},${y}`);
  }
  for (const o of obstacles)
    for (let x = o.x; x < o.x + OBSTACLES[o.kind].size; x++)
      for (let y = o.y; y < o.y + OBSTACLES[o.kind].size; y++) occupied.add(`${x},${y}`);
  const free: Point[] = [];
  for (let y = 1; y < MAP_SIZE - 1; y++)
    for (let x = 1; x < MAP_SIZE - 1; x++)
      if (!occupied.has(`${x},${y}`)) free.push({ x: x + 0.5, y: y + 0.5 });
  const routes = camps.map((camp) => {
    const cx = camp.x + BUILDINGS.camp.size / 2,
      cy = camp.y + BUILDINGS.camp.size / 2;
    const candidates = free.filter((p) => Math.hypot(p.x - cx, p.y - cy) <= 2.6);
    // A tightly packed camp can muster on its nearest clear tile.
    if (!candidates.length && free.length)
      candidates.push(
        [...free].sort(
          (a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy),
        )[0],
      );
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy) || a.y - b.y || a.x - b.x,
    );
    const has = (p: Point) => candidates.some((q) => q.x === p.x && q.y === p.y);
    return candidates.map((p) => {
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ]) {
        const q = { x: p.x + dx, y: p.y + dy };
        const r = { x: q.x - dy, y: q.y + dx };
        const s = { x: p.x - dy, y: p.y + dx };
        if (has(q) && has(r) && has(s)) return [p, q, r, s];
      }
      const neighbor = candidates.find((q) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y) === 1);
      return neighbor ? [p, neighbor] : [p];
    });
  });
  if (!routes.some((r) => r.length)) return [];
  const load = camps.map(() => 0),
    slots = camps.map(() => 0);
  const result: CampActor[] = [];
  // Round robin guarantees every prepared kind is represented even in oversized imports.
  const count = TROOP_KEYS.map((k) => Math.max(0, Math.floor(army[k] || 0)));
  for (
    let ordinal = 0;
    result.length < MAX_CAMP_ACTORS && count.some((n) => n > ordinal);
    ordinal++
  ) {
    for (let k = 0; k < TROOP_KEYS.length && result.length < MAX_CAMP_ACTORS; k++) {
      if (count[k] <= ordinal) continue;
      const kind = TROOP_KEYS[k];
      let camp = -1;
      for (let i = 0; i < camps.length; i++)
        if (
          routes[i].length &&
          (camp < 0 ||
            load[i] / campCapacity(camps[i].level) < load[camp] / campCapacity(camps[camp].level))
        )
          camp = i;
      const slot = slots[camp]++;
      load[camp] += TROOPS[kind].space;
      result.push({
        id: `${kind}:${ordinal}`,
        kind,
        campId: camps[camp].id,
        route: routes[camp][slot % routes[camp].length],
        phase: ordinal * 0.618 + k * 0.371,
        offsetX: (((slot * 7) % 11) - 5) * 0.025,
        offsetY: (((slot * 3) % 11) - 5) * 0.025,
      });
    }
  }
  return result;
}

export function campPose(actor: CampActor, seconds: number) {
  const route = actor.route;
  const travel = seconds * TROOPS[actor.kind].speed * 0.55 + actor.phase;
  const block = travel % (route.length * 1.45);
  const index = Math.floor(block / 1.45),
    fraction = block % 1.45;
  const from = route[index],
    to = route[(index + 1) % route.length];
  const progress = Math.min(1, fraction);
  return {
    x: from.x + (to.x - from.x) * progress + actor.offsetX,
    y: from.y + (to.y - from.y) * progress + actor.offsetY,
    facing: Math.sign(to.x - from.x - (to.y - from.y)),
    moving: route.length > 1 && fraction < 1,
  };
}
