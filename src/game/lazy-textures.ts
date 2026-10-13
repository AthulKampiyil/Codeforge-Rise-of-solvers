import type Phaser from 'phaser';

/** Frame size of a sprite sheet; a texture without one is a single image. */
export type SheetFrames = { frameWidth: number; frameHeight: number };

/**
 * Images the scene fetches when something first needs them instead of at boot: per-level
 * fallback sprites a starter village never draws. Callers draw a loaded stand-in meanwhile and
 * restyle when `revision` moves.
 */
export class LazyTextures {
  /** Increments whenever a requested texture arrives. */
  revision = 0;
  private pending = new Map<string, Promise<void>>();
  private retryAt = new Map<string, number>();
  constructor(private scene: Phaser.Scene) {}
  /** Whether `key` is loaded. When it is not, it starts loading from `url`. */
  has(key: string, url: string, sheet?: SheetFrames) {
    if (this.scene.textures.exists(key)) return true;
    void this.request(key, url, sheet);
    return false;
  }
  /** Whether `key` is being fetched here (so a loader batch should leave it out). */
  loading(key: string) {
    return this.pending.has(key);
  }
  /** Loads `key` from `url` unless it is loaded or loading; resolves when it is in (or failed). */
  request(key: string, url: string, sheet?: SheetFrames): Promise<void> {
    if (this.scene.textures.exists(key)) return Promise.resolve();
    const pending = this.pending.get(key);
    if (pending) return pending;
    if ((this.retryAt.get(key) ?? 0) > performance.now()) return Promise.resolve();
    // A loader batch already fetching this image adds it itself; adding it here as well would
    // collide ("Texture key already in use"). Wait for that batch instead.
    const job = (this.queued(key) ? this.loaded(key) : this.fetch(key, url, sheet)).finally(() =>
      this.pending.delete(key),
    );
    this.pending.set(key, job);
    return job;
  }
  private queued(key: string) {
    const load = this.scene.load as unknown as Record<
      'list' | 'inflight' | 'queue',
      Set<{ key: string; type: string }> | null
    >;
    return (['list', 'inflight', 'queue'] as const).some((name) =>
      [...(load[name] ?? [])].some(
        (file) => (file.type === 'image' || file.type === 'spritesheet') && file.key === key,
      ),
    );
  }
  private loaded(key: string) {
    return new Promise<void>((resolve) => {
      const done = () => {
        this.scene.load.off(`filecomplete-image-${key}`, done);
        this.scene.load.off(`filecomplete-spritesheet-${key}`, done);
        this.scene.load.off('complete', done);
        if (this.scene.textures.exists(key)) this.revision++;
        resolve();
      };
      this.scene.load.once(`filecomplete-image-${key}`, done);
      this.scene.load.once(`filecomplete-spritesheet-${key}`, done);
      // A failed file never completes; the batch's end settles the wait either way.
      this.scene.load.once('complete', done);
    });
  }
  private async fetch(key: string, url: string, sheet?: SheetFrames) {
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!this.scene.textures.exists(key)) {
        if (sheet) this.scene.textures.addSpriteSheet(key, image, sheet);
        else this.scene.textures.addImage(key, image);
      }
      this.revision++;
    } catch (error) {
      // A texture that fails is asked for again after five seconds.
      this.retryAt.set(key, performance.now() + 5000);
      console.error('Deferred texture', key, error);
    }
  }
}
