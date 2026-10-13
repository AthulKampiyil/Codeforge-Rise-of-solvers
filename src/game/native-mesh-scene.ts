import Phaser from 'phaser';
import { nativeBlendMode } from './native-blend';
import { PART_DEPTH_STEP } from './unit-depth';
import {
  configureNativeTriangleRendering,
  NATIVE_ADDITIVE_TINT_MODE,
  NATIVE_COLOR_TINT_MODE,
} from './quad-renderer';
import { nativeSceneStats } from './native-scene-flatten';
import {
  nativeMeshTexture,
  nativeTriangles,
  type NativeMeshGraph,
  type NativeMeshPose,
  type NativeScenePose,
} from './native-mesh';
// NativeMeshPose is also the identity a drawn mesh remembers (NativeMesh.nativePose).

export { nativeMeshTexture };

export function preloadNativeMeshes(scene: Phaser.Scene, graph: NativeMeshGraph, prefix: string) {
  for (const [id, texture] of Object.entries(graph.textures))
    scene.load.image(nativeMeshTexture(prefix, id), '/' + texture.path);
}

/**
 * Source multiply/add colors run on the GPU (NATIVE_COLOR_TINT_MODE: tint = multiply, tint2 =
 * add) whenever no texel can saturate (multiply + add <= 1 per channel). The source applies the
 * color per texel before bilinear filtering, so saturating colors (and colors outside 0..1) bake
 * the texels their leaf samples instead; see tintedTexture. LRU order of baked textures (bytes).
 */
const TINT_ORDER = new Map<string, number>();
/** Baked textures are texel copies: budget bytes, not texture count. */
const MAX_TINTED_BYTES = 32 << 20;
let tintedBytesTotal = 0;
/** Baked colors quantize to byte steps (source colors are 8-bit) so keys stay bounded. */
const TINT_STEP = 255;
/**
 * Meshes a tinted texture is drawing right now. A mesh holds the `Frame` itself, not its key,
 * so removing a texture still on screen leaves that frame without a source and the triangle
 * batcher throws reading its `glTexture` — which ends the frame, and with it the game loop.
 */
const TINT_REFS = new Map<string, number>();
const isTinted = (key: string) => key.includes(':color:');
let tintTextures: Phaser.Textures.TextureManager | undefined;
export function retainTint(key: string) {
  if (isTinted(key)) TINT_REFS.set(key, (TINT_REFS.get(key) ?? 0) + 1);
}
export function releaseTint(key: string) {
  if (!isTinted(key)) return;
  const left = (TINT_REFS.get(key) ?? 0) - 1;
  if (left > 0) TINT_REFS.set(key, left);
  else {
    TINT_REFS.delete(key);
    evictTints();
  }
}
/** Drops least recently used unreferenced pages while over budget. */
function evictTints(keep?: string) {
  if (tintedBytesTotal <= MAX_TINTED_BYTES || !tintTextures) return;
  for (const [key, bytes] of TINT_ORDER) {
    if (tintedBytesTotal <= MAX_TINTED_BYTES) break;
    if (key === keep || TINT_REFS.has(key)) continue;
    if (tintTextures.exists(key)) tintTextures.remove(key);
    tintedBytesTotal -= bytes;
    TINT_ORDER.delete(key);
  }
}
const q = (v: number) => Math.round(v * TINT_STEP) / TINT_STEP;

/** Texel region (top-down image pixels) a leaf samples, with a bilinear guard margin. */
interface TintRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
}
const regions = new WeakMap<readonly number[], TintRegion>();
function leafRegion(vertices: readonly number[], pageWidth: number, pageHeight: number) {
  let region = regions.get(vertices);
  if (region && region.pageWidth === pageWidth && region.pageHeight === pageHeight) return region;
  let u0 = Infinity,
    v0 = Infinity,
    u1 = -Infinity,
    v1 = -Infinity;
  for (let i = 0; i < vertices.length; i += 4) {
    u0 = Math.min(u0, vertices[i + 2]);
    u1 = Math.max(u1, vertices[i + 2]);
    v0 = Math.min(v0, vertices[i + 3]);
    v1 = Math.max(v1, vertices[i + 3]);
  }
  const x = Math.max(0, Math.floor(u0 * pageWidth) - 2),
    y = Math.max(0, Math.floor(v0 * pageHeight) - 2);
  region = {
    x,
    y,
    width: Math.max(1, Math.min(pageWidth, Math.ceil(u1 * pageWidth) + 2) - x),
    height: Math.max(1, Math.min(pageHeight, Math.ceil(v1 * pageHeight) + 2) - y),
    pageWidth,
    pageHeight,
  };
  regions.set(vertices, region);
  return region;
}

/**
 * Bakes the leaf's source color into a copy of only the texels it samples (plus a guard band),
 * keyed by page, region and byte-quantized color, so animated colors reuse a bounded set of small
 * textures instead of re-baking whole 8-64 MB pages. The caller remaps UVs into the region.
 */
/**
 * CPU copies of the source pages bakes read, least recently used first. Reading a region back
 * from a canvas makes the browser decode the whole source image again (a software canvas
 * rasterizes lazily), so every bake of a page paid for decoding all of it. Pages over PAGE_LIMIT
 * are cropped asynchronously instead (regionCrop).
 */
const SOURCE_PIXELS = new Map<string, { image: CanvasImageSource; data: ImageData }>();
const SOURCE_BUDGET = 32 << 20;
const PAGE_LIMIT = 4 << 20;
let sourceBytes = 0;
function sourcePixels(key: string, image: HTMLImageElement): ImageData | undefined {
  const cached = SOURCE_PIXELS.get(key);
  if (cached && cached.image === image) {
    SOURCE_PIXELS.delete(key);
    SOURCE_PIXELS.set(key, cached);
    return cached.data;
  }
  if (cached) {
    SOURCE_PIXELS.delete(key);
    sourceBytes -= cached.data.data.length;
  }
  const bytes = image.width * image.height * 4;
  if (!bytes || bytes > PAGE_LIMIT) return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return undefined;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height);
  SOURCE_PIXELS.set(key, { image, data });
  sourceBytes += bytes;
  for (const [oldest, entry] of SOURCE_PIXELS) {
    if (sourceBytes <= SOURCE_BUDGET) break;
    SOURCE_PIXELS.delete(oldest);
    sourceBytes -= entry.data.data.length;
  }
  return data;
}
/** Region crops of large pages by page and region: a bitmap once decoded, null while pending. */
const REGION_CROPS = new Map<string, ImageBitmap | null>();
const MAX_REGION_CROPS = 64;
function regionCrop(key: string, image: HTMLImageElement, region: TintRegion) {
  const cropKey = `${key}:${region.x},${region.y},${region.width},${region.height}`;
  const crop = REGION_CROPS.get(cropKey);
  if (crop) return crop;
  if (crop === null || typeof createImageBitmap !== 'function') return undefined;
  REGION_CROPS.set(cropKey, null);
  // From a Blob the browser decodes off the main thread; from the <img> itself Chrome decodes
  // synchronously. The file is already in the HTTP cache.
  fetch(image.currentSrc || image.src)
    .then((response) => response.blob())
    .then((blob) => createImageBitmap(blob, region.x, region.y, region.width, region.height))
    .then(
      (bitmap) => {
        REGION_CROPS.set(cropKey, bitmap);
        for (const [oldest, entry] of REGION_CROPS) {
          if (REGION_CROPS.size <= MAX_REGION_CROPS) break;
          REGION_CROPS.delete(oldest);
          entry?.close();
        }
      },
      () => REGION_CROPS.delete(cropKey),
    );
  return undefined;
}
function tintedTexture(
  scene: Phaser.Scene,
  original: string,
  pose: NativeMeshPose,
  /** False to only look the bake up: a miss returns undefined instead of baking now. */
  bake = true,
): { key: string; region: TintRegion } | undefined {
  const image = scene.textures.get(original).getSourceImage() as HTMLImageElement;
  const region = leafRegion(pose.vertices, image.width, image.height);
  const m = pose.multiply,
    a = pose.add;
  const mul0 = q(m[0]),
    mul1 = q(m[1]),
    mul2 = q(m[2]),
    add0 = q(a[0]),
    add1 = q(a[1]),
    add2 = q(a[2]);
  const key =
    original +
    ':color:' +
    region.x +
    ',' +
    region.y +
    ',' +
    region.width +
    ',' +
    region.height +
    ':' +
    mul0 +
    ',' +
    mul1 +
    ',' +
    mul2 +
    ',' +
    add0 +
    ',' +
    add1 +
    ',' +
    add2;
  const bytes = TINT_ORDER.get(key);
  if (bytes !== undefined && scene.textures.exists(key)) {
    // Refresh LRU order on hit.
    TINT_ORDER.delete(key);
    TINT_ORDER.set(key, bytes);
    return { key, region };
  }
  if (!bake) return undefined;
  const started = performance.now();
  const source = sourcePixels(original, image);
  // A page too large to keep a CPU copy of is cropped off the main thread first: a synchronous
  // read-back decodes the whole page (700 ms for a 2552x4056 Cannon page under a phone-class
  // CPU). Until the crop is ready the leaf clamps on the GPU, as it does past the bake budget.
  let crop: ImageBitmap | undefined;
  if (!source) {
    crop = regionCrop(original, image, region);
    if (!crop) return undefined;
  }
  tintTextures = scene.textures;
  nativeSceneStats.bakes++;
  const canvas = document.createElement('canvas');
  canvas.width = region.width;
  canvas.height = region.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw Error('Native color transform needs a 2D canvas');
  let pixels: ImageData;
  if (source) {
    // Crop the cached page: the same texels a region draw and read-back would return.
    pixels = ctx.createImageData(region.width, region.height);
    const rowBytes = region.width * 4;
    for (let row = 0; row < region.height; row++) {
      const from = ((region.y + row) * source.width + region.x) * 4;
      pixels.data.set(source.data.subarray(from, from + rowBytes), row * rowBytes);
    }
  } else {
    ctx.drawImage(crop!, 0, 0);
    pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  const data = pixels.data;
  const mul = [mul0, mul1, mul2],
    add = [add0 * 255, add1 * 255, add2 * 255];
  for (let i = 0; i < data.length; i += 4)
    for (let c = 0; c < 3; c++)
      data[i + c] = Math.round(Math.min(255, Math.max(0, data[i + c] * mul[c] + add[c])));
  ctx.putImageData(pixels, 0, 0);
  scene.textures.addCanvas(key, canvas);
  const size = canvas.width * canvas.height * 4;
  TINT_ORDER.set(key, size);
  tintedBytesTotal += size;
  // Evict only what nothing is drawing; a texture in use waits for its meshes to let it go.
  evictTints(key);
  bakeSpent += performance.now() - started;
  return { key, region };
}

/**
 * Texel bakes a frame may spend under a bake budget (canvas draw, readback and texture upload
 * each stall the frame): past it, a saturating leaf clamps on the GPU until a later frame bakes
 * it. The budget resets with the game loop's frame counter.
 */
const BAKE_BUDGET_MS = 1.5;
let bakeFrame = -1;
let bakeSpent = 0;
function bakeAllowed(scene: Phaser.Scene) {
  const frame = (scene.game as { loop?: { frame?: number } }).loop?.frame;
  if (frame === undefined) return true;
  if (frame !== bakeFrame) {
    bakeFrame = frame;
    bakeSpent = 0;
  }
  return bakeSpent < BAKE_BUDGET_MS;
}

/** Merged-run triangle lists by the runs' vertex counts (strips, one texture source). */
const mergedTriangleCache = new Map<string, number[]>();
function mergedTriangles(poses: readonly NativeScenePose[], start: number, end: number) {
  let key = '';
  for (let i = start; i < end; i++) key += (poses[i] as NativeMeshPose).vertices.length / 4 + ',';
  let cached = mergedTriangleCache.get(key);
  if (!cached) {
    if (mergedTriangleCache.size >= 4096) mergedTriangleCache.clear();
    cached = [];
    let base = 0;
    for (let i = start; i < end; i++) {
      const count = (poses[i] as NativeMeshPose).vertices.length / 4;
      for (let t = 0; t < count - 2; t++)
        cached.push(base + (t % 2 ? t + 1 : t), base + (t % 2 ? t : t + 1), base + t + 2, 0);
      base += count;
    }
    mergedTriangleCache.set(key, cached);
  }
  return cached;
}

// Per-leaf draw state of the poses being rendered, resolved before runs are formed.
let sLeaf: boolean[] = [];
let sTexture: string[] = [];
let sTint: number[] = [];
let sTint2: number[] = [];
let sMode: number[] = [];
let sBlend: number[] = [];
let sAlpha: number[] = [];
let sRegion: (TintRegion | undefined)[] = [];
let sPending: boolean[] = [];

const white = (m: readonly number[]) => m[0] === 1 && m[1] === 1 && m[2] === 1;
const unit = (v: number) => v >= 0 && v <= 1;
const byte = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
const rgb = (c: readonly number[]) => (byte(c[0]) << 16) | (byte(c[1]) << 8) | byte(c[2]);

type NativeMesh = Phaser.GameObjects.Mesh2D & {
  tint: number;
  tint2: number;
  tintMode: number;
  blendMode: unknown;
  /** Render pass that last used this mesh; stale meshes are released. */
  nativeStamp: number;
  /** The pose object last drawn: the same shared sample again needs only position and depth. */
  nativePose?: NativeMeshPose;
  /** Base color and blend of that pose, restored each frame before status tints combine with it. */
  nativeTint: number;
  nativeTint2: number;
  nativeTintMode: number;
  nativeBlend: number;
  /** The real additive blend slot, for a status tint mode that must replace the additive tint. */
  nativeAdditiveBlend?: number;
  /** Last pose and length of the merged run this mesh draws (a lone leaf: itself, 1). */
  nativeRunLast?: NativeMeshPose;
  nativeRunLength: number;
  /** Drawn with a GPU clamp while its texel bake waited for budget: re-render when it lands. */
  nativePending?: boolean;
};
/**
 * Parked meshes are interchangeable across views: one pool per scene bounds the hidden objects
 * left on the display list, while a detached (group content) view keeps a few of its own.
 */
const sceneSpares = new WeakMap<Phaser.Scene, NativeMesh[]>();
const SCENE_SPARE_LIMIT = 1024;

/** Retained polygon meshes follow the caller's battle/replay clock, with no tweens. */
/** Parked meshes kept per view; animation swaps a handful of leaf keys per frame at most. */
const SPARE_LIMIT = 6;

export class NativeMeshView {
  readonly meshes = new Map<string, Phaser.GameObjects.Mesh2D>();
  /**
   * The mesh drawn for each pose index of the last render: the run head's mesh at its index,
   * undefined for merged followers and groups. Lets the scene view find a leaf's object
   * without a string-keyed lookup per leaf per frame.
   */
  readonly runMeshes: (Phaser.GameObjects.Mesh2D | undefined)[] = [];
  private spare: NativeMesh[] = [];
  private textureKeys: string[] = [];
  private stamp = 0;
  private renderer: Phaser.Renderer.WebGL.WebGLRenderer;
  /**
   * Scene-attached additive leaves draw through the additive tint mode in the normal blend state
   * (exact on the opaque backbuffer). Detached leaves compose into transparent buffers, whose
   * alpha the real additive mode must keep, so they keep it.
   */
  private additiveTint: boolean;
  /**
   * Apply saturating leaf colors as a GPU tint (clamped after filtering) instead of baking the
   * sampled texels: a per-color-step canvas bake and texture upload otherwise stalls the frame
   * whenever many units flash at once. Off by default, where source fidelity wins.
   */
  gpuSaturate = false;
  /**
   * Draw consecutive leaves that share a texture, color, blend and alpha as one mesh: their
   * strips concatenate in order, so the pixels are the same, and a unit of a dozen parts costs
   * the display list (sort, cull, render step) one or two objects instead of a dozen.
   */
  mergeLeaves = false;
  /** Defer texel bakes past the frame's bake budget (see BAKE_BUDGET_MS). */
  bakeBudget = false;
  constructor(
    private scene: Phaser.Scene,
    private prefix: string,
    /** Detached meshes are drawn by an owner (a group buffer), never by the scene display list. */
    private detached = false,
  ) {
    this.renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    this.additiveTint = configureNativeTriangleRendering(this.renderer) && !detached;
  }
  private baseTexture(id: number) {
    return (this.textureKeys[id] ??= nativeMeshTexture(this.prefix, id));
  }
  render(
    poses: readonly NativeScenePose[],
    x: number,
    y: number,
    depth: number,
    alpha = 1,
    /**
     * False when the caller assigns final depths itself (NativeSceneView orders
     * leaves among blend groups, a different order than the leaf list here):
     * skips a depth write that would be overwritten one line later.
     */
    assignDepth = true,
  ) {
    // Group poses are skipped: NativeSceneView passes its full list and composites groups itself.
    const stamp = ++this.stamp;
    const n = poses.length;
    if (sLeaf.length < n) {
      sLeaf = new Array(n);
      sTexture = new Array(n);
      sTint = new Array(n);
      sTint2 = new Array(n);
      sMode = new Array(n);
      sBlend = new Array(n);
      sAlpha = new Array(n);
      sRegion = new Array(n);
      sPending = new Array(n);
    }
    // Pass 1: each leaf's draw state (texture, tint, mode, blend, alpha).
    for (let order = 0; order < n; order++) {
      const pose = poses[order];
      if ('group' in pose) {
        sLeaf[order] = false;
        continue;
      }
      sLeaf[order] = true;
      const m = pose.multiply,
        a = pose.add;
      const identityMul = white(m);
      const hasAdd = a[0] !== 0 || a[1] !== 0 || a[2] !== 0;
      let texture = this.baseTexture(pose.texture);
      let tint = 0xffffff,
        tint2 = 0,
        mode = 0;
      const additive = pose.blend === 8 && this.additiveTint;
      if (additive) mode = NATIVE_ADDITIVE_TINT_MODE;
      let region: TintRegion | undefined;
      let pending = false;
      if (!identityMul || hasAdd) {
        const unitRange =
          unit(m[0]) && unit(m[1]) && unit(m[2]) && unit(a[0]) && unit(a[1]) && unit(a[2]);
        if (
          // A folded group color applies after filtering, exactly as its group buffer's would.
          pose.folded ||
          (this.gpuSaturate && unitRange) ||
          (unit(m[0]) &&
            unit(m[1]) &&
            unit(m[2]) &&
            a[0] >= 0 &&
            a[1] >= 0 &&
            a[2] >= 0 &&
            // No texel can saturate, so transforming after bilinear filtering equals before.
            m[0] + a[0] <= 1 &&
            m[1] + a[1] <= 1 &&
            m[2] + a[2] <= 1)
        ) {
          tint = rgb(m);
          if (hasAdd) {
            tint2 = rgb(a);
            if (!additive) mode = NATIVE_COLOR_TINT_MODE;
          }
        } else {
          // Saturating colors clamp per texel before filtering: bake just those texels. Under a
          // bake budget, a color the GPU can carry clamps there until a later frame bakes it.
          const baked = tintedTexture(
            this.scene,
            texture,
            pose,
            !this.bakeBudget || !unitRange || bakeAllowed(this.scene),
          );
          if (baked) {
            texture = baked.key;
            region = baked.region;
          } else {
            pending = true;
            tint = rgb(m);
            tint2 = rgb(a);
            if (!additive) mode = NATIVE_COLOR_TINT_MODE;
          }
        }
      }
      sTexture[order] = texture;
      sTint[order] = tint;
      sTint2[order] = tint2;
      sMode[order] = mode;
      sBlend[order] =
        pose.blend === 0 || additive
          ? Phaser.BlendModes.NORMAL
          : nativeBlendMode(this.renderer, pose.blend);
      sAlpha[order] = m[3];
      sRegion[order] = region;
      sPending[order] = pending;
    }
    // Pass 2: runs of consecutive leaves with one draw state, each drawn by one mesh under the
    // first leaf's key (every run is one leaf long unless leaves merge).
    const merge = this.mergeLeaves;
    const runMeshes = this.runMeshes;
    runMeshes.length = n;
    let drawn = 0;
    let order = 0;
    while (order < n) {
      if (!sLeaf[order]) {
        runMeshes[order] = undefined;
        order++;
        continue;
      }
      const first = poses[order] as NativeMeshPose;
      let end = order + 1;
      if (merge)
        while (
          end < n &&
          sLeaf[end] &&
          sTexture[end] === sTexture[order] &&
          sTint[end] === sTint[order] &&
          sTint2[end] === sTint2[order] &&
          sMode[end] === sMode[order] &&
          sBlend[end] === sBlend[order] &&
          sAlpha[end] === sAlpha[order]
        )
          end++;
      const length = end - order;
      const last = poses[end - 1] as NativeMeshPose;
      const texture = sTexture[order],
        tint = sTint[order],
        tint2 = sTint2[order],
        mode = sMode[order],
        wantBlend = sBlend[order],
        pending = sPending[order];
      const wantAlpha = alpha * sAlpha[order];
      const wantDepth = depth + order * PART_DEPTH_STEP;
      drawn++;
      for (let i = order + 1; i < end; i++) runMeshes[i] = undefined;
      let mesh = this.meshes.get(first.key) as NativeMesh | undefined;
      runMeshes[order] = mesh;
      if (
        mesh &&
        mesh.nativePose === first &&
        mesh.nativeRunLast === last &&
        mesh.nativeRunLength === length &&
        !(mesh.nativePending && !pending) &&
        // A flag flip (GPU clamp vs bake) changes the draw state of an unchanged pose.
        mesh.nativeTint === tint &&
        mesh.nativeTint2 === tint2 &&
        mesh.nativeTintMode === mode &&
        mesh.nativeBlend === wantBlend &&
        mesh.texture.key === texture
      ) {
        // The same shared sample as last render: vertices, texture, blend and color are
        // unchanged, so only the origin, depth and alpha can differ (and the base tint is
        // restored under whatever a status tint combined into it).
        mesh.nativeStamp = stamp;
        if (mesh.tint !== mesh.nativeTint) mesh.tint = mesh.nativeTint;
        if (mesh.tint2 !== mesh.nativeTint2) mesh.tint2 = mesh.nativeTint2;
        if (mesh.tintMode !== mesh.nativeTintMode) mesh.tintMode = mesh.nativeTintMode;
        if (mesh.blendMode !== mesh.nativeBlend) mesh.setBlendMode(mesh.nativeBlend);
        if (mesh.x !== x || mesh.y !== y) mesh.setPosition(x, y);
        if (assignDepth && mesh.depth !== wantDepth) mesh.setDepth(wantDepth);
        if (mesh.alpha !== wantAlpha) mesh.setAlpha(wantAlpha);
        if (!mesh.visible) mesh.setVisible(true);
        order = end;
        continue;
      }
      let total = 0;
      for (let i = order; i < end; i++) total += (poses[i] as NativeMeshPose).vertices.length;
      // A leaf key that vanished a few frames ago left a parked mesh: reuse it instead of
      // constructing a new one (and later destroying it: an O(n) display-list splice each).
      const recycled = mesh ? undefined : this.takeSpare();
      const holder = mesh ?? recycled;
      let vertices: number[];
      if (!holder) {
        vertices = new Array<number>(total);
      } else {
        vertices = holder.vertices as number[];
        if (vertices.length !== total) vertices = new Array<number>(total);
      }
      // Written in place: the triangle batcher streams every vertex each frame regardless.
      let at = 0;
      for (let i = order; i < end; i++) {
        const pose = poses[i] as NativeMeshPose;
        const src = pose.vertices,
          mat = pose.matrix;
        const ma = mat[0],
          mc = mat[1],
          mx = mat[2],
          mb = mat[3],
          md = mat[4],
          my = mat[5];
        const region = sRegion[i];
        for (let j = 0; j < src.length; j += 4) {
          const sx = src[j],
            sy = src[j + 1];
          vertices[at + j] = ma * sx + mc * sy + mx;
          vertices[at + j + 1] = mb * sx + md * sy + my;
          if (region) {
            vertices[at + j + 2] = (src[j + 2] * region.pageWidth - region.x) / region.width;
            vertices[at + j + 3] = (src[j + 3] * region.pageHeight - region.y) / region.height;
          } else {
            vertices[at + j + 2] = src[j + 2];
            vertices[at + j + 3] = src[j + 3];
          }
        }
        at += src.length;
      }
      const indices = length === 1 ? nativeTriangles(vertices) : mergedTriangles(poses, order, end);
      if (recycled) {
        mesh = recycled;
        runMeshes[order] = mesh;
        if (mesh.vertices !== vertices) mesh.vertices = vertices;
        if (mesh.indices !== indices) mesh.indices = indices;
        // Always rebind: a parked mesh may hold a baked page evicted while it sat idle.
        mesh.setTexture(texture);
        retainTint(texture);
        this.meshes.set(first.key, mesh);
      } else if (!mesh) {
        mesh = new Phaser.GameObjects.Mesh2D(
          this.scene,
          x,
          y,
          texture,
          vertices,
          indices,
          true,
        ) as NativeMesh;
        mesh.setOrigin(0, 0).setRenderAsTriangles(true);
        if (!this.detached) this.scene.add.existing(mesh);
        this.meshes.set(first.key, mesh);
        runMeshes[order] = mesh;
        retainTint(texture);
      } else {
        if (mesh.vertices !== vertices) mesh.vertices = vertices;
        if (mesh.indices !== indices) mesh.indices = indices;
        if (mesh.texture.key !== texture) {
          releaseTint(mesh.texture.key);
          retainTint(texture);
          mesh.setTexture(texture);
        }
      }
      mesh.nativeStamp = stamp;
      mesh.nativePose = first;
      mesh.nativeRunLast = last;
      mesh.nativeRunLength = length;
      mesh.nativePending = pending;
      mesh.nativeTint = tint;
      mesh.nativeTint2 = tint2;
      mesh.nativeTintMode = mode;
      if (mesh.tint !== tint) mesh.tint = tint;
      if (mesh.tint2 !== tint2) mesh.tint2 = tint2;
      if (mesh.tintMode !== mode) mesh.tintMode = mode;
      if (mesh.x !== x || mesh.y !== y) mesh.setPosition(x, y);
      if (assignDepth && mesh.depth !== wantDepth) mesh.setDepth(wantDepth);
      if (mesh.alpha !== wantAlpha) mesh.setAlpha(wantAlpha);
      if (mesh.blendMode !== wantBlend) mesh.setBlendMode(wantBlend);
      mesh.nativeBlend = wantBlend;
      if (mode === NATIVE_ADDITIVE_TINT_MODE)
        mesh.nativeAdditiveBlend = nativeBlendMode(this.renderer, 8);
      if (!mesh.visible) mesh.setVisible(true);
      order = end;
    }
    if (drawn !== this.meshes.size)
      for (const [key, mesh] of this.meshes)
        if ((mesh as NativeMesh).nativeStamp !== stamp) {
          releaseTint(mesh.texture.key);
          this.meshes.delete(key);
          this.park(mesh as NativeMesh);
        }
  }
  /** Hidden spares stay on the display list (no splice) until a new leaf key needs one. */
  private park(mesh: NativeMesh) {
    mesh.nativePose = undefined;
    // A recycled mesh may serve another view: drop the tags its last owner attached.
    mesh.data?.reset();
    let pool = this.spare;
    let limit = SPARE_LIMIT;
    if (!this.detached) {
      pool = sceneSpares.get(this.scene) ?? [];
      if (!pool.length) sceneSpares.set(this.scene, pool);
      limit = SCENE_SPARE_LIMIT;
    }
    if (pool.length >= limit) {
      mesh.destroy();
      return;
    }
    if (mesh.visible) mesh.setVisible(false);
    pool.push(mesh);
  }
  private takeSpare(): NativeMesh | undefined {
    if (this.detached) return this.spare.pop();
    const pool = sceneSpares.get(this.scene);
    while (pool?.length) {
      const mesh = pool.pop()!;
      // Skip meshes the scene has since destroyed (shutdown sweeps the display list).
      if (mesh.scene === this.scene && mesh.displayList) return mesh;
    }
    return undefined;
  }
  /**
   * Hand every mesh to the spare pool instead of destroying it: a view that ends (an off-screen
   * unit, a landed shot, a finished particle) costs no display-list splice, and the next view
   * of any art takes the parked meshes back. Group content views (detached) still destroy.
   */
  retire() {
    for (const mesh of this.meshes.values()) {
      releaseTint(mesh.texture.key);
      this.park(mesh as NativeMesh);
    }
    this.meshes.clear();
  }
  clear() {
    for (const mesh of this.meshes.values()) {
      releaseTint(mesh.texture.key);
      mesh.destroy();
    }
    this.meshes.clear();
    for (const mesh of this.spare) mesh.destroy();
    this.spare.length = 0;
  }
  destroy() {
    this.clear();
  }
}
