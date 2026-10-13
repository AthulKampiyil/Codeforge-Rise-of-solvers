import type Phaser from 'phaser';
import { nativeMeshTexture, type NativeMeshGraph } from './native-mesh';

/**
 * Level pages of a graph bundled into the code (scripts/native-pages.mjs): each page names the
 * levels that draw it, and untagged pages serve every level. Untagged pages and the levels a
 * caller names load with the scene's loader; any other level loads when first asked for.
 */
export class NativeLevelPages {
  /** Levels whose pages are uploaded, loads in flight, and when a failed level may retry. */
  private ready = new Set<number>();
  private loads = new Map<number, Promise<void>>();
  private retryAt = new Map<number, number>();
  /** Increments whenever a level's pages arrive, so callers can restyle their fallbacks. */
  revision = 0;
  constructor(
    private scene: Phaser.Scene,
    private graph: NativeMeshGraph,
    private prefix: string,
  ) {}
  /** Queues the untagged pages and these levels' pages on the scene's loader. */
  static preload(
    scene: Phaser.Scene,
    graph: NativeMeshGraph,
    prefix: string,
    levels: Iterable<number> = [],
  ) {
    const wanted = new Set(levels);
    for (const [id, texture] of Object.entries(graph.textures))
      if (!texture.levels || texture.levels.some((level) => wanted.has(level)))
        scene.load.image(nativeMeshTexture(prefix, id), '/' + texture.path);
  }
  private missing(level: number) {
    return Object.entries(this.graph.textures).filter(
      ([id, t]) =>
        t.levels?.includes(level) &&
        !this.scene.textures.exists(nativeMeshTexture(this.prefix, id)),
    );
  }
  /** Whether this level's pages are in. When they are not, they start loading. */
  has(level: number) {
    if (this.ready.has(level)) return true;
    const missing = this.missing(level);
    if (!missing.length) {
      this.ready.add(level);
      return true;
    }
    void this.load(level, missing);
    return false;
  }
  /** Loads these levels' pages now; resolves when they are in (or have failed). */
  prefetch(levels: Iterable<number>) {
    return Promise.all(
      [...new Set(levels)].map((level) => {
        const missing = this.missing(level);
        return missing.length ? this.load(level, missing) : undefined;
      }),
    ).then(() => undefined);
  }
  private load(level: number, textures: ReturnType<NativeLevelPages['missing']>) {
    const pending = this.loads.get(level);
    if (pending) return pending;
    if ((this.retryAt.get(level) ?? 0) > performance.now()) return Promise.resolve();
    const job = this.fetch(level, textures).finally(() => this.loads.delete(level));
    this.loads.set(level, job);
    return job;
  }
  private async fetch(level: number, textures: ReturnType<NativeLevelPages['missing']>) {
    try {
      const images = await Promise.all(
        textures.map(async ([id, texture]) => {
          const image = new Image();
          image.src = '/' + texture.path;
          await image.decode();
          return [nativeMeshTexture(this.prefix, id), image] as const;
        }),
      );
      for (const [key, image] of images)
        if (!this.scene.textures.exists(key)) this.scene.textures.addImage(key, image);
      this.ready.add(level);
      this.revision++;
    } catch (error) {
      // A page that fails is asked for again after five seconds.
      this.retryAt.set(level, performance.now() + 5000);
      console.error(`Native ${this.prefix} artwork`, level, error);
    }
  }
}
