import type Phaser from 'phaser';

type Offset = { x: number; y: number };

/**
 * Add simulation-driven motion at Phaser's camera transform stage, before its inverse is built.
 *
 * Offsets are world units: the translation lands after the zoom in the view matrix, so a shake
 * looks the same on 1x, 2x and 3x displays. (Phaser's own `camera.shake` scales its offset by
 * the backing-buffer width and the zoom, then the matrix scales it by the zoom again, which made
 * shakes 4x stronger on 2x screens and 9x on 3x screens.)
 */
export class CameraShakeLayer {
  private readonly original: () => void;
  private readonly render: () => void;
  private impulses: { start: number; duration: number; amplitude: number }[] = [];
  constructor(
    private camera: Phaser.Cameras.Scene2D.Camera,
    sample: () => Offset,
    private now: () => number = () => performance.now(),
  ) {
    const effect = camera.shakeEffect;
    this.original = effect.preRender;
    this.render = () => {
      this.original.call(effect);
      const sampled = sample();
      const offset = this.withImpulses(sampled);
      camera.getViewMatrix(true).translate(offset.x, offset.y);
    };
    effect.preRender = this.render;
  }
  /**
   * A short random jitter of `amplitude` world pixels for `duration` ms, tapering to rest.
   * Presentation only: it never touches the simulation.
   */
  shake(duration: number, amplitude: number) {
    if (duration <= 0 || amplitude <= 0) return;
    if (this.impulses.length >= 8) this.impulses.shift();
    this.impulses.push({ start: this.now(), duration, amplitude });
  }
  private result: Offset = { x: 0, y: 0 };
  private withImpulses(base: Offset): Offset {
    if (!this.impulses.length) return base;
    const time = this.now();
    let x = base.x,
      y = base.y,
      limit = Math.max(Math.abs(base.x), Math.abs(base.y));
    this.impulses = this.impulses.filter((i) => time - i.start < i.duration);
    for (const impulse of this.impulses) {
      const strength = impulse.amplitude * (1 - (time - impulse.start) / impulse.duration);
      x += (Math.random() * 2 - 1) * strength;
      y += (Math.random() * 2 - 1) * strength;
      limit = Math.max(limit, impulse.amplitude);
    }
    // Overlapping shakes stay within the strongest one instead of adding up.
    this.result.x = Math.max(-limit, Math.min(limit, x));
    this.result.y = Math.max(-limit, Math.min(limit, y));
    return this.result;
  }
  clear() {
    this.impulses.length = 0;
  }
  destroy() {
    this.clear();
    if (this.camera.shakeEffect.preRender === this.render)
      this.camera.shakeEffect.preRender = this.original;
  }
}

/**
 * Sums shake sources and clamps the total to the strongest single source, so five sources
 * firing together cannot shake five times as hard.
 */
export function combineShakes(sources: readonly Offset[], out: Offset = { x: 0, y: 0 }) {
  let x = 0,
    y = 0,
    limitX = 0,
    limitY = 0;
  for (const s of sources) {
    x += s.x;
    y += s.y;
    limitX = Math.max(limitX, Math.abs(s.x));
    limitY = Math.max(limitY, Math.abs(s.y));
  }
  out.x = Math.max(-limitX, Math.min(limitX, x));
  out.y = Math.max(-limitY, Math.min(limitY, y));
  return out;
}
