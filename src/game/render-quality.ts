/** Sustained frame pressure lowers only canvas density; CSS layout and world zoom stay fixed. */
export class RenderQuality {
  scale = 1;
  /** The frame interval the loop aims for; a frame cap lengthens it. */
  private interval = 1000 / 60;
  private previous = 0;
  private elapsed = 0;
  private frames = 0;
  private slow = 0;
  private fastFor = 0;
  private settleUntil = 0;

  reset(now: number) {
    this.previous = now;
    this.elapsed = this.frames = this.slow = this.fastFor = 0;
    this.settleUntil = now + 5000;
  }

  /**
   * Returns true only when a new backbuffer size is needed. Ignore loading, pauses and gaps.
   * `interval` is the loop's target frame time: a deliberate cap (the idle village's) restarts
   * the measurement at its own pace instead of reading as load.
   */
  sample(now: number, enabled: boolean, density: number, interval = 1000 / 60) {
    if (interval !== this.interval) {
      this.interval = interval;
      this.reset(now);
      return false;
    }
    const delta = now - this.previous;
    this.previous = now;
    if (!enabled || delta <= 0 || delta > 250) {
      this.reset(now);
      return false;
    }
    if (now < this.settleUntil) return false;
    // 24 ms slow and 18 ms fast at 60 FPS, in proportion under a cap.
    const pace = this.interval / (1000 / 60);
    this.elapsed += delta;
    this.frames++;
    if (delta > 24 * pace) this.slow++;
    if (this.elapsed < 2000) return false;
    const average = this.elapsed / this.frames;
    const pressured = this.slow / this.frames > 0.6;
    this.fastFor = average < 18 * pace ? this.fastFor + this.elapsed : 0;
    const minimum = Math.min(1, 1 / Math.max(1, density));
    const next = pressured
      ? Math.max(minimum, this.scale - 0.25)
      : this.fastFor >= 15000
        ? Math.min(1, this.scale + 0.25)
        : this.scale;
    this.elapsed = this.frames = this.slow = 0;
    if (next === this.scale) return false;
    this.scale = next;
    this.reset(now);
    return true;
  }
}
