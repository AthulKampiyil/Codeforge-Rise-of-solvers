import native from '../../reference/pumpkin-bomb/native.json' with { type: 'json' };
import type { TrapState } from './traps';

const clip = native.clips.bomp_trap_halloween;
const nativeWidth = native.atlas.width / native.atlas.pixelsPerNativeUnit;
const nativeHeight = native.atlas.height / native.atlas.pixelsPerNativeUnit;
/** Source facts and timing interpretation are retained in reference/pumpkin-bomb. */
export const PUMPKIN_BOMB = {
  damage: +native.trap.Damage,
  trigger: +native.trap.TriggerRadius / 100,
  radius: +native.trap.DamageRadius / 100,
  targets: 'ground' as const,
  minHousing: 0,
  // Inference: native ActionFrame / clip fps. Native counter semantics are unverified.
  delay: +native.trap.ActionFrame / clip.fps,
};
export const PUMPKIN_ART = {
  texture: 'pumpkin-bomb-native',
  asset: `/${native.atlas.path}`,
  frameWidth: native.atlas.width,
  frameHeight: native.atlas.height,
  // Visual calibration: native ground contact (-3, 26), 1.5 world pixels/native pixel.
  // This aligns the shadow/contact point, retaining every frame's source displacement.
  width: nativeWidth * 1.5,
  originX: (-3 - native.atlas.bounds[0]) / nativeWidth,
  originY: (26 - native.atlas.bounds[1]) / nativeHeight,
};

export function pumpkinFrame(state: TrapState | undefined, elapsed: number, reducedMotion = false) {
  if (!state || state.resolved) return 0; // Native broken export uses the setup sprite.
  const age = Math.max(0, elapsed - state.activatedAt);
  if (reducedMotion) return age < 19 / clip.fps ? 0 : clip.firstFrame + clip.count - 1;
  // Hold the last frame until the independently timed damage event; never loop the reveal.
  return clip.firstFrame + Math.min(clip.count - 1, Math.floor(age * clip.fps + 1e-9));
}
