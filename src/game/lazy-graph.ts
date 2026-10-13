/**
 * A render graph fetched with its art family instead of shipping in the startup bundle. The
 * JSON sits behind a dynamic import, so the bundler gives it a chunk of its own; the family's
 * `prepare` step awaits it before any texture is queued or any pose is sampled.
 */
export class LazyGraph<T> {
  private value?: T;
  private loading?: Promise<T>;
  constructor(
    private name: string,
    private importer: () => Promise<{ default: unknown }>,
  ) {}
  get loaded() {
    return this.value !== undefined;
  }
  /** The graph; callers check `loaded` (or run after `load`) first. */
  get(): T {
    if (this.value === undefined) throw new Error(`${this.name} art is not loaded yet`);
    return this.value;
  }
  /** Fetches the graph once; a failed fetch can be retried by calling again. */
  load(): Promise<T> {
    this.loading ??= this.importer().then(
      (module) => (this.value = module.default as T),
      (error) => {
        this.loading = undefined;
        throw error;
      },
    );
    return this.loading;
  }
}

/** A family's art box as bounds about its anchor, for picking before its graph arrives. */
export const artBoxBounds = (art: {
  width: number;
  height: number;
  originX: number;
  originY: number;
}): [number, number, number, number] => {
  const left = -art.originX * art.width,
    top = -art.originY * art.height;
  return [left, top, left + art.width, top + art.height];
};
