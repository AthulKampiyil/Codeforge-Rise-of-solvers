type Target = {
  active: boolean;
  x: number;
  y: number;
  alpha: number;
  scaleX: number;
  scaleY: number;
  destroy(): void;
};
type Property = 'x' | 'y' | 'alpha' | 'scaleX' | 'scaleY';
export type EffectTween = Partial<Record<Property | 'scale', number>> & {
  targets: Target;
  duration: number;
  delay?: number;
  onComplete: () => void;
};
interface Entry {
  config: EffectTween;
  start: number;
  /** Flat [property, from, to] triples. */
  values: (Property | number)[];
}
const PROPERTIES = ['x', 'y', 'alpha', 'scaleX', 'scaleY'] as const;

/** Linear combat feedback driven explicitly by simulation time, in seconds. */
export class EffectTimeline {
  private entries: Entry[] = [];

  add(config: EffectTween, now: number) {
    const values: Entry['values'] = [];
    for (const key of PROPERTIES) {
      const to = config[key] ?? (key === 'scaleX' || key === 'scaleY' ? config.scale : undefined);
      if (to !== undefined) values.push(key, config.targets[key], to);
    }
    this.entries.push({ config, start: now + (config.delay ?? 0) / 1000, values });
  }

  update(now: number) {
    const entries = this.entries;
    // Entries added by an onComplete during this pass wait for the next update.
    const count = entries.length;
    let kept = 0;
    const done: Entry[] = [];
    for (let i = 0; i < count; i++) {
      const entry = entries[i];
      const { config, start, values } = entry;
      if (!config.targets.active) continue;
      if (now < start) {
        entries[kept++] = entry;
        continue;
      }
      let progress =
        config.duration <= 0 ? 1 : Math.min(1, ((now - start) * 1000) / config.duration);
      if (!(progress >= 0)) progress = 1;
      for (let v = 0; v < values.length; v += 3) {
        const from = values[v + 1] as number,
          to = values[v + 2] as number;
        config.targets[values[v] as Property] = from + (to - from) * progress;
      }
      if (progress === 1) done.push(entry);
      else entries[kept++] = entry;
    }
    // Keep anything appended meanwhile, then compact.
    for (let i = count; i < entries.length; i++) entries[kept++] = entries[i];
    entries.length = kept;
    // Completions run after the list is consistent: an onComplete may add or clear entries.
    for (const entry of done) entry.config.onComplete();
  }

  clear() {
    const entries = this.entries;
    this.entries = [];
    for (const { config } of entries) if (config.targets.active) config.targets.destroy();
  }

  get size() {
    return this.entries.length;
  }
}
