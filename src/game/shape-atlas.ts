import Phaser from 'phaser';

/** A vector shape baked once into a shared canvas page. */
export interface BakedShape {
  key: string;
  frame: string;
  /** Anchor inside the frame, as Phaser origins. */
  originX: number;
  originY: number;
  /** Texture pixels per world pixel; draw at `scale / resolution`. */
  resolution: number;
}

interface Page {
  key: string;
  texture: Phaser.Textures.CanvasTexture;
  x: number;
  y: number;
  row: number;
}

/**
 * Bakes Graphics drawings into shared canvas pages, so per-frame art is textured quads that
 * batch together instead of Graphics paths Phaser re-triangulates (earcut) every frame.
 * Shapes are drawn at `resolution` texture pixels per world pixel to stay sharp when zoomed in.
 * Canvas pages survive WebGL context loss (Phaser re-uploads them from their canvas).
 */
export class ShapeAtlas {
  private shapes = new Map<string, BakedShape>();
  private pages: Page[] = [];
  private painter?: Phaser.GameObjects.Graphics;
  constructor(
    private scene: Phaser.Scene,
    private prefix = 'baked-shapes',
    private size = 1024,
    private resolution = 3,
  ) {}

  has(name: string) {
    return this.shapes.has(name);
  }

  /**
   * Returns the named shape, baking it on first use. `left, top, width, height` bound the
   * drawing in world pixels around its anchor (0, 0); `draw` paints it in those coordinates.
   */
  shape(
    name: string,
    left: number,
    top: number,
    width: number,
    height: number,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ): BakedShape {
    const existing = this.shapes.get(name);
    if (existing) return existing;
    // Large shapes bake at a lower density so they still fit one page.
    const resolution = Math.min(
      this.resolution,
      (this.size - 4) / Math.max(1, width),
      (this.size - 4) / Math.max(1, height),
    );
    const w = Math.ceil(width * resolution) + 2,
      h = Math.ceil(height * resolution) + 2;
    const page = this.allocate(w, h);
    const g = (this.painter ??= this.scene.make.graphics({}, false));
    g.clear();
    g.save();
    // One transparent texel of padding on every side keeps linear filtering from bleeding.
    g.translateCanvas(page.x + 1 - left * resolution, page.y + 1 - top * resolution);
    g.scaleCanvas(resolution, resolution);
    draw(g);
    g.restore();
    g.generateTexture(page.texture.getSourceImage() as HTMLCanvasElement, this.size, this.size);
    g.clear();
    page.texture.add(name, 0, page.x, page.y, w, h);
    this.markDirty(page);
    page.x += w;
    page.row = Math.max(page.row, h);
    const shape = {
      key: page.key,
      frame: name,
      originX: (1 - left * resolution) / w,
      originY: (1 - top * resolution) / h,
      resolution,
    };
    this.shapes.set(name, shape);
    return shape;
  }

  /**
   * Uploads a changed page once, just before the frame renders. Refreshing after every bake
   * re-uploaded the whole page (4 MB at 1024²) per new shape: the first battle bakes dozens of
   * wall links in one sync, which was dozens of full-page uploads in a single frame.
   */
  private dirty = new Set<Page>();
  private markDirty(page: Page) {
    if (!this.dirty.size)
      this.scene.game.events.once(Phaser.Core.Events.PRE_RENDER, this.flush, this);
    this.dirty.add(page);
  }
  private flush() {
    for (const page of this.dirty) if (this.scene.textures.exists(page.key)) page.texture.refresh();
    this.dirty.clear();
  }

  private allocate(w: number, h: number) {
    let page = this.pages.at(-1);
    if (page && page.x + w > this.size) {
      page.x = 0;
      page.y += page.row;
      page.row = 0;
    }
    if (!page || page.y + h > this.size) {
      const key = `${this.prefix}-${this.pages.length}`;
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      const texture = this.scene.textures.createCanvas(key, this.size, this.size)!;
      page = { key, texture, x: 0, y: 0, row: 0 };
      this.pages.push(page);
    }
    return page;
  }

  destroy() {
    this.scene.game.events.off(Phaser.Core.Events.PRE_RENDER, this.flush, this);
    this.dirty.clear();
    this.painter?.destroy();
    this.painter = undefined;
    for (const page of this.pages)
      if (this.scene.textures.exists(page.key)) this.scene.textures.remove(page.key);
    this.pages = [];
    this.shapes.clear();
  }
}

/** Places a baked shape on an image: frame, anchor and world scale. */
export function applyShape(
  image: Phaser.GameObjects.Image,
  shape: BakedShape,
  scaleX = 1,
  scaleY = scaleX,
) {
  if (image.texture.key !== shape.key || image.frame.name !== shape.frame)
    image.setTexture(shape.key, shape.frame);
  if (image.originX !== shape.originX || image.originY !== shape.originY)
    image.setOrigin(shape.originX, shape.originY);
  const sx = scaleX / shape.resolution,
    sy = scaleY / shape.resolution;
  if (image.scaleX !== sx || image.scaleY !== sy) image.setScale(sx, sy);
  return image;
}

/**
 * A per-frame pool of baked-shape images at one depth: `begin`, `put` each shape drawn this
 * frame, `end` hides the leftovers. Replaces Graphics layers that were cleared and refilled with
 * ellipses and circles every frame.
 */
export class ShapePool {
  private items: Phaser.GameObjects.Image[] = [];
  private used = 0;
  constructor(
    private scene: Phaser.Scene,
    private depth: number,
  ) {}
  begin() {
    this.used = 0;
  }
  put(
    shape: BakedShape,
    x: number,
    y: number,
    scaleX = 1,
    scaleY = scaleX,
    tint = 0xffffff,
    alpha = 1,
  ) {
    let image = this.items[this.used];
    // Scene transitions may destroy pooled objects behind the pool's back.
    if (!image || !image.scene) {
      image = this.scene.add.image(x, y, shape.key, shape.frame).setDepth(this.depth);
      this.items[this.used] = image;
    }
    this.used++;
    applyShape(image, shape, scaleX, scaleY);
    if (image.x !== x || image.y !== y) image.setPosition(x, y);
    if (image.tintTopLeft !== tint) image.setTint(tint);
    if (image.alpha !== alpha) image.setAlpha(alpha);
    if (!image.visible) image.setVisible(true);
    return image;
  }
  end() {
    for (let i = this.used; i < this.items.length; i++) {
      const image = this.items[i];
      if (image.scene && image.visible) image.setVisible(false);
    }
    // Let a spike (hundreds of flyers) shrink back once it is over.
    if (this.items.length > 64 && this.used < this.items.length / 4) {
      for (const image of this.items.splice(Math.max(64, this.used * 2))) image.destroy();
    }
  }
  /** Objects owned by the pool, so scene sweeps can leave them alone. */
  owns(object: unknown) {
    return this.items.includes(object as Phaser.GameObjects.Image);
  }
  clear() {
    for (const image of this.items) image.destroy();
    this.items = [];
    this.used = 0;
  }
}
