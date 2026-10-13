import Phaser from 'phaser';
import { pruneFilterPool, type NativeGroupColor } from './native-group-color';

type Renderer = Phaser.Renderer.WebGL.WebGLRenderer;
type TextureWrapper = Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper;

/**
 * One offscreen blend-group buffer. Its allocation only grows (in coarse buckets), so moving or
 * animating content reuses the same GPU texture; the visible part is a crop of `width`x`height`.
 */
export interface NativeGroupBuffer {
  image: Phaser.GameObjects.RenderTexture;
  /** Allocated texture size; content never exceeds it. */
  width: number;
  height: number;
  /** Lazily attached color filter, kept with the buffer across pool reuse (inactive when idle). */
  color?: NativeGroupColor;
  /** Pool bookkeeping: game time the buffer was last released. */
  releasedAt: number;
  /** Visible crop last applied to `image`. */
  cropWidth: number;
  cropHeight: number;
}

/**
 * Phaser 4.2.1's DynamicTexture lets its TextureSource allocate a GL texture, then replaces
 * `source.glTexture` with its drawing context's texture without deleting the first one. Every
 * RenderTexture therefore leaked one texture. Capture and delete that orphan here. Group buffers
 * also skip the stencil renderbuffer the game config enables for the ground mask: they never draw
 * masked content, and the renderbuffer doubled VRAM and forced a framebuffer completeness check.
 */
export function createGroupBuffer(scene: Phaser.Scene, width: number, height: number) {
  const renderer = scene.game.renderer as Renderer;
  const created: TextureWrapper[] = [];
  const original = renderer.createTextureFromSource;
  const config = renderer.config as { stencil: boolean };
  const stencil = config.stencil;
  renderer.createTextureFromSource = function (
    this: Renderer,
    ...args: Parameters<Renderer['createTextureFromSource']>
  ) {
    const texture = original.apply(this, args);
    if (args[0] === null && texture) created.push(texture);
    return texture;
  } as Renderer['createTextureFromSource'];
  config.stencil = false;
  let image: Phaser.GameObjects.RenderTexture;
  try {
    image = new Phaser.GameObjects.RenderTexture(scene, 0, 0, width, height);
  } finally {
    renderer.createTextureFromSource = original;
    config.stencil = stencil;
  }
  const live = image.texture.source[0]?.glTexture;
  for (const texture of created) if (texture !== live) renderer.deleteTexture(texture);
  image.setOrigin(0, 0);
  return image;
}

/** Even, never a power of two (no REPEAT wrap or mipmaps), 32px buckets. */
const bucket = (size: number) => Math.ceil(Math.max(1, size - 2) / 32) * 32 + 2;
/** Free buffers are destroyed after this long unused, or when the free set exceeds the byte cap. */
const IDLE_MS = 2500;
const FREE_BYTES = 48 << 20;

class GroupBufferPool {
  private free: NativeGroupBuffer[] = [];
  private freeBytes = 0;
  private sweepAt = 0;
  constructor(private scene: Phaser.Scene) {
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.sweep, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }
  private now() {
    return this.scene.game.loop.time;
  }
  /**
   * Smallest free buffer that fits without wasting more than 4x the bucketed area. Buffers that
   * carry a color filter (`colored`) are only reused as color sources, never as plain buffers.
   */
  acquire(width: number, height: number, colored = false): NativeGroupBuffer {
    const w = bucket(width),
      h = bucket(height);
    let best = -1,
      bestArea = Infinity;
    for (let i = 0; i < this.free.length; i++) {
      const b = this.free[i];
      const area = b.width * b.height;
      if (
        !!b.color === colored &&
        b.width >= width &&
        b.height >= height &&
        area <= w * h * 4 &&
        area < bestArea
      ) {
        best = i;
        bestArea = area;
      }
    }
    if (best >= 0) {
      const buffer = this.free[best];
      this.free[best] = this.free[this.free.length - 1];
      this.free.pop();
      this.freeBytes -= buffer.width * buffer.height * 4;
      return buffer;
    }
    const maxSize = (this.scene.game.renderer as Renderer).getMaxTextureSize();
    const allocW = Math.min(w, maxSize - (maxSize % 2)),
      allocH = Math.min(h, maxSize - (maxSize % 2));
    return {
      image: createGroupBuffer(this.scene, allocW, allocH),
      width: allocW,
      height: allocH,
      releasedAt: 0,
      cropWidth: 0,
      cropHeight: 0,
    };
  }
  /** Grows a buffer in place (same wrapper; the GPU storage is reallocated, contents cleared). */
  resize(buffer: NativeGroupBuffer, width: number, height: number) {
    const maxSize = (this.scene.game.renderer as Renderer).getMaxTextureSize();
    const w = Math.min(bucket(width), maxSize - (maxSize % 2)),
      h = Math.min(bucket(height), maxSize - (maxSize % 2));
    if (w === buffer.width && h === buffer.height) return;
    buffer.image.resize(w, h);
    buffer.width = w;
    buffer.height = h;
    buffer.cropWidth = buffer.cropHeight = 0;
  }
  /** Destroys every idle buffer now (tests and scene teardown). */
  flush() {
    this.trim(Infinity);
  }
  release(buffer: NativeGroupBuffer) {
    const image = buffer.image;
    if (!image.scene) return;
    if (image.displayList) image.removeFromDisplayList();
    if (buffer.color) buffer.color.active = false;
    image.setVisible(false);
    buffer.releasedAt = this.now();
    this.free.push(buffer);
    this.freeBytes += buffer.width * buffer.height * 4;
    if (this.freeBytes > FREE_BYTES) this.trim(0);
  }
  private sweep() {
    const now = this.now();
    if (now < this.sweepAt) return;
    this.sweepAt = now + 500;
    this.trim(now - IDLE_MS);
    pruneFilterPool(this.scene.game.renderer as Renderer);
  }
  /** Destroys buffers released before `before`, then oldest ones while over the byte cap. */
  private trim(before: number) {
    if (!this.free.length) return;
    this.free.sort((a, b) => a.releasedAt - b.releasedAt);
    let drop = 0;
    let bytes = this.freeBytes;
    while (drop < this.free.length && (this.free[drop].releasedAt < before || bytes > FREE_BYTES)) {
      bytes -= this.free[drop].width * this.free[drop].height * 4;
      drop++;
    }
    for (let i = 0; i < drop; i++) this.free[i].image.destroy();
    this.free.splice(0, drop);
    this.freeBytes = bytes;
  }
  get size() {
    return this.free.length;
  }
  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.sweep, this);
    for (const buffer of this.free) if (buffer.image.scene) buffer.image.destroy();
    this.free = [];
    this.freeBytes = 0;
    pools.delete(this.scene);
  }
}

const pools = new Map<Phaser.Scene, GroupBufferPool>();
export function groupBufferPool(scene: Phaser.Scene) {
  let pool = pools.get(scene);
  if (!pool) pools.set(scene, (pool = new GroupBufferPool(scene)));
  return pool;
}

/** Destroys a scene's idle pooled group buffers immediately (tests, low-memory hooks). */
export function flushGroupBuffers(scene: Phaser.Scene) {
  pools.get(scene)?.flush();
}
