/**
 * Walk/idle state for presentation layers that only see positions.
 *
 * The simulation steps at a fixed 20 Hz without interpolation, so at 60 fps two of every three
 * rendered frames see no position change. Comparing positions frame to frame therefore flickers
 * between walk and idle. This tracker compares positions only when the battle clock has
 * advanced, and treats a unit as moving for a short grace window after its last displacement:
 * a paused replay (clock frozen) holds the current state, and seeks restart the history.
 */
export const MOTION_GRACE = 0.12;
const EPSILON = 1e-5;

interface MotionRecord {
  x: number;
  y: number;
  /** Battle time of the last sample that saw the clock advance. */
  at: number;
  /** Battle time of the last observed displacement. */
  movedAt: number;
  /** Last nonzero displacement, the unit's travel heading. */
  dx: number;
  dy: number;
}

export interface MotionSample {
  moving: boolean;
  /** Last nonzero displacement (map space); `{1, 0}` before the unit has ever moved. */
  dx: number;
  dy: number;
  /** False until the unit has been seen to move. */
  heading: boolean;
}

export class UnitMotionTracker {
  private records = new Map<number, MotionRecord>();
  private sample: MotionSample = { moving: false, dx: 1, dy: 0, heading: false };
  /**
   * Stable moving state and heading of one unit at battle time `elapsed`. `hint` seeds the state
   * the first time a unit is seen (e.g. it has a path), before any displacement is observed.
   * The returned object is reused between calls; copy fields out before the next call.
   */
  update(id: number, x: number, y: number, elapsed: number, hint = false): MotionSample {
    let r = this.records.get(id);
    if (!r) {
      r = { x, y, at: elapsed, movedAt: hint ? elapsed : -Infinity, dx: NaN, dy: NaN };
      this.records.set(id, r);
    } else if (elapsed !== r.at) {
      // A backward seek restarts the history; the jump itself still reads as a move.
      if (elapsed < r.at) r.movedAt = -Infinity;
      const dx = x - r.x,
        dy = y - r.y;
      if (Math.abs(dx) + Math.abs(dy) > EPSILON) {
        r.movedAt = elapsed;
        r.dx = dx;
        r.dy = dy;
      }
      r.x = x;
      r.y = y;
      r.at = elapsed;
    }
    const s = this.sample;
    s.moving = elapsed - r.movedAt <= MOTION_GRACE;
    s.heading = !Number.isNaN(r.dx);
    s.dx = s.heading ? r.dx : 1;
    s.dy = s.heading ? r.dy : 0;
    return s;
  }
  has(id: number) {
    return this.records.has(id);
  }
  delete(id: number) {
    this.records.delete(id);
  }
  /** Drop records whose ids are not in `keep`. */
  prune(keep: ReadonlySet<number>) {
    for (const id of this.records.keys()) if (!keep.has(id)) this.records.delete(id);
  }
  clear() {
    this.records.clear();
  }
  get size() {
    return this.records.size;
  }
}

/**
 * Deterministic per-unit phase offset (seconds, in [0, span)) so troops of one kind do not walk
 * in lockstep. Pure function of the id: identical across replays and seeks.
 */
export function unitAnimationPhase(id: number, span = 2) {
  const h = Math.imul((id | 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return ((h % 1000) / 1000) * span;
}
