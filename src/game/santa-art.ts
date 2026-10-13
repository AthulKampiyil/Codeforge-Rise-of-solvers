import native from '../../reference/santa-trap/runtime.json' with { type: 'json' };
import type { TrapState } from './traps';
import { SANTA_TRAP, SANTA_SPELL, santaRandom } from './santa-trap';

export type SantaGroup = keyof typeof native.groups;
export const SANTA_GROUPS = native.groups;
export const SANTA_SOUNDS = native.sounds;
export const santaTexture = (group: SantaGroup, page = 0) => `santa-${group}-${page}`;
const trap = native.groups.trap;
/** Visual calibration, shared across every native trap pose. */
export const SANTA_ART = {
  texture: santaTexture('trap'),
  asset: '/assets/effects/santa-native/setup.png',
  width: (trap.width / 2) * 1.5,
  originX: (2 - trap.bounds[0]) / (trap.width / 2),
  originY: (32 - trap.bounds[1]) / (trap.height / 2),
};
function frameAt(group: SantaGroup, clip: string, time: number) {
  const clips = native.groups[group].clips as Record<string, { fps: number; frames: number[] }>;
  const c = clips[clip];
  return c.frames[Math.min(c.frames.length - 1, Math.max(0, Math.floor(time * c.fps + 1e-9)))];
}
export function santaTrapFrame(state: TrapState | undefined, elapsed: number, reduced = false) {
  if (!state) return frameAt('trap', 'setup', 0);
  const age = elapsed - state.activatedAt;
  if (age >= SANTA_TRAP.delay - 1e-9) return frameAt('trap', 'spent', 0);
  return frameAt('trap', reduced ? 'setup' : 'trigger', age);
}
export interface SantaPose {
  key: string;
  group: SantaGroup;
  frame: number;
  matrix: number[];
  alpha: number;
  ground?: boolean;
}
const SCALE = 1.5;
/** Local altitude/projection calibration; native particle-unit conversion is unverified. */
const LIFT = 210;
const affine = (x: number, y: number, scale = 1, angle = 0) => {
  const c = Math.cos(angle) * SCALE * scale,
    s = Math.sin(angle) * SCALE * scale;
  return [c, -s, x, s, c, y];
};
const offset = (x: number, y: number) => [(x - y) * 32, (x + y) * 16];
export function santaFlightFrame(age: number) {
  return Math.min(native.flight.length - 1, Math.max(0, Math.floor(age * native.flightFps + 1e-9)));
}
/** Stateless presentation makes pause, seek and repeated rendering exact. */
export function santaPoses(state: TrapState, elapsed: number, reduced = false): SantaPose[] {
  const santa = state.santa;
  if (!santa) return [];
  const age = elapsed - santa.castAt,
    poses: SantaPose[] = [];
  const add = (
    key: string,
    group: SantaGroup,
    frame: number,
    matrix: number[],
    alpha = 1,
    ground = false,
  ) => {
    if (alpha > 0) poses.push({ key, group, frame, matrix, alpha, ground });
  };
  if (age >= 0 && age < 10 && !reduced) {
    const index = santaFlightFrame(age);
    for (const [i, row] of native.flight[index].entries()) {
      const [frame, a, c, x, b, d, y, alpha] = row;
      add(
        `sleigh-${i}`,
        'sleigh',
        frame,
        [a * SCALE, c * SCALE, x * SCALE, b * SCALE, d * SCALE, y * SCALE - LIFT],
        alpha,
      );
    }
    const [x, y] = native.groups.shadow.offsets[index];
    add(
      'sleigh-shadow',
      'shadow',
      frameAt('shadow', 'flight', age),
      affine(x * SCALE, y * SCALE),
      1,
      true,
    );
  }
  // Native red smoke textures; deterministic local particle projection and fade.
  if (age >= 0 && age < 8) {
    const count = reduced ? 1 : 20;
    for (let i = 0; i < count; i++) {
      const t = age - (reduced ? 0 : (i * 3.9) / 20),
        life = 4 + santaRandom(state.targetId, i);
      if (t < 0 || t >= life) continue;
      const fraction = t / life;
      const x = reduced ? 0 : (santaRandom(state.targetId, i + 30) - 0.5) * 20 - t * 9;
      const y = reduced ? -28 : -t * 25;
      add(
        `smoke-${i}`,
        'particles',
        frameAt('particles', i % 2 ? 'smoke2' : 'smoke1', 0),
        affine(x, y, reduced ? 0.75 : 0.05 + fraction * 1.95),
        Math.min(1, t / 0.15) * (1 - fraction) * 0.6,
      );
    }
  }
  if (!reduced && age >= 0 && age < 1)
    for (let i = 0; i < 33; i++) {
      const life = 0.3 + santaRandom(state.targetId, i + 50) * 0.7;
      if (age >= life) continue;
      const angle = santaRandom(state.targetId, i + 90) * Math.PI * 2,
        speed = 45 + santaRandom(state.targetId, i + 120) * 40;
      add(
        `debris-${i}`,
        'particles',
        frameAt('particles', i % 2 ? 'debris2' : 'debris1', age),
        affine(
          Math.cos(angle) * speed * age,
          Math.sin(angle) * speed * age * 0.5 - 65 * age + 80 * age * age,
          1 - age / life,
          angle + age * 4,
        ),
        1 - age / life,
      );
    }
  for (const [i, strike] of santa.strikes.entries()) {
    const [x, y] = offset(strike.x - state.x, strike.y - state.y);
    const t = elapsed - strike.dropAt,
      duration = strike.hitAt - strike.dropAt;
    if (t >= 0 && t < duration) {
      const f = t / duration;
      const release = native.flight[santaFlightFrame(strike.dropAt - santa.castAt)][1];
      const fromX = release[3] * SCALE,
        fromY = release[6] * SCALE - LIFT;
      add(
        `gift-shadow-${i}`,
        'particles',
        frameAt('particles', 'gift-shadow', t),
        affine(x, y, 0.5 + f * 0.9),
        0.75,
        true,
      );
      add(
        `gift-${i}`,
        'presents',
        frameAt('presents', `gift${(i % 3) + 1}`, reduced ? 1 : t),
        affine(
          reduced ? x : fromX + (x - fromX) * f,
          reduced ? y - 32 : fromY + (y - fromY) * f * f,
          0.9 - f * 0.4,
          reduced ? 0 : f * 0.6,
        ),
      );
    }
  }
  return poses;
}
/** Atlas quad with the complete affine transform, including native shear. */
export function santaQuad(pose: SantaPose) {
  const group = native.groups[pose.group],
    [page, cell] = group.frames[pose.frame];
  const [left, top, right, bottom] = group.bounds;
  const [a, c, x, b, d, y] = pose.matrix;
  const u = (cell % group.columns) / group.columns,
    uw = 1 / group.columns;
  const rows = Math.ceil(group.pages[page].frames / group.columns),
    v = Math.floor(cell / group.columns) / rows,
    vh = 1 / rows;
  const vertices = [
    [left, top, u, v],
    [left, bottom, u, v + vh],
    [right, top, u + uw, v],
    [right, bottom, u + uw, v + vh],
  ].flatMap(([px, py, tu, tv]) => [a * px + c * py + x, b * px + d * py + y, tu, tv]);
  return { texture: santaTexture(pose.group, page), vertices };
}
export function santaSoundCues(state: TrapState, prefix: string) {
  if (!state.santa) return [];
  const { castAt, strikes } = state.santa;
  return [
    { key: `${prefix}:call`, sample: 'santa-call', at: castAt, volume: 0.9, pitch: 0.6 },
    {
      key: `${prefix}:sleigh`,
      sample: 'santa-sleigh',
      at: castAt + SANTA_SPELL.call,
      volume: 0.8,
      pitch: 0.75,
    },
    ...strikes.flatMap((s, i) => [
      { key: `${prefix}:drop:${i}`, sample: 'santa-drop', at: s.dropAt, volume: 0.7, pitch: 1.75 },
      {
        key: `${prefix}:impact:${i}`,
        sample: 'santa-impact',
        at: s.hitAt,
        volume: 0.8,
        pitch: 0.9,
      },
    ]),
  ];
}
