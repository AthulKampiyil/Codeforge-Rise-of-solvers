import type Phaser from 'phaser';
import { nativeMeshTexture, type NativeMeshGraph } from './native-mesh';

export type NativeRow = Readonly<Record<string, string>>;
/** Shared shape of the lazily fetched battle art packs (projectiles, effects, defenses). */
export interface NativeArtPack {
  effects: Record<string, NativeRow[]>;
  emitters: Record<string, NativeRow[]>;
  scenes: Record<string, NativeMeshGraph>;
  skipped?: Record<string, string>;
}

/** `sc/buildings.sc` -> `buildings`; rows that leave the SWF blank default to the building scene. */
export const nativeSceneId = (swf: string | undefined) =>
  (swf || 'sc/buildings.sc').split('/').at(-1)!.replace(/\.sc$/, '');

/** Texture namespace of one scene inside one pack, for NativeSceneView and NativeMeshView. */
export const nativePackPrefix = (path: string, scene: string) => `pack:${path}:${scene}`;

/**
 * Fetches graph.json packs and decodes their cropped source texture pages once per session.
 * A pack is returned only after every texture is registered, so callers can fall back while loading.
 */
export class NativeArtPacks<T extends { scenes: Record<string, NativeMeshGraph> }> {
  private packs = new Map<string, T>();
  private pending = new Set<string>();
  /** Packs whose last request failed, and when (performance.now ms) to request them again. */
  private failed = new Map<string, { attempts: number; retryAt: number }>();
  private alive = true;
  /** Back online: every failed pack is due for another request. */
  private online = () => {
    for (const failure of this.failed.values()) failure.retryAt = 0;
  };
  constructor(private scene: Phaser.Scene) {
    if (typeof window !== 'undefined') window.addEventListener('online', this.online);
  }
  get(path: string): T | undefined {
    const pack = this.packs.get(path);
    if (!pack) void this.load(path);
    return pack;
  }
  /** True while a pack's last request failed; callers keep their drawn fallback meanwhile. */
  unavailable(path: string) {
    return this.failed.has(path);
  }
  private async load(path: string) {
    if (this.pending.has(path)) return;
    // A failed pack is requested again after a bounded backoff (5 s doubling to five minutes).
    const failure = this.failed.get(path);
    if (failure && performance.now() < failure.retryAt) return;
    this.pending.add(path);
    try {
      const response = await fetch('/' + path);
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const pack = (await response.json()) as T;
      await Promise.all(
        Object.entries(pack.scenes).flatMap(([name, graph]) =>
          Object.entries(graph.textures).map(async ([id, texture]) => {
            const key = nativeMeshTexture(nativePackPrefix(path, name), id);
            if (this.scene.textures.exists(key)) return;
            const image = new Image();
            image.src = '/' + texture.path;
            await image.decode();
            if (this.alive && !this.scene.textures.exists(key))
              this.scene.textures.addImage(key, image);
          }),
        ),
      );
      if (this.alive) {
        this.packs.set(path, pack);
        this.failed.delete(path);
      }
    } catch (error) {
      const attempts = (failure?.attempts ?? 0) + 1;
      this.failed.set(path, {
        attempts,
        retryAt: performance.now() + Math.min(300_000, 5000 * 2 ** (attempts - 1)),
      });
      console.error('Native battle artwork', path, error);
    } finally {
      this.pending.delete(path);
    }
  }
  destroy() {
    this.alive = false;
    if (typeof window !== 'undefined') window.removeEventListener('online', this.online);
  }
}
