import Phaser from 'phaser';
import { NativeMeshView } from './native-mesh-scene';
import { nativeBlendMode, nativeMultiplyModes } from './native-blend';
import { NativeGroupColor } from './native-group-color';
import { PART_DEPTH_STEP } from './unit-depth';
import { groupBufferPool, type NativeGroupBuffer } from './native-group-buffer';
import {
  configureNativeQuadColor,
  NATIVE_ADDITIVE_TINT_MODE,
  NATIVE_COLOR_TINT_MODE,
} from './quad-renderer';
import {
  colorless,
  flattenDisjointGroups,
  inUnitRange,
  nativeSceneStats,
} from './native-scene-flatten';
import {
  includeNativeVertices,
  nativeMatrix,
  type NativeGroupPose,
  type NativeMatrix,
  type NativeScenePose,
} from './native-mesh';

type NativeObject = Phaser.GameObjects.Mesh2D | Phaser.GameObjects.Image;
type Renderer = Phaser.Renderer.WebGL.WebGLRenderer;

/**
 * Quantize density up to half steps: zoom gestures reuse isolated blend buffers, and a buffer is
 * never rendered below the display density (zoom 1.24 renders at 1.5, not a blurry 1.0).
 */
export function quantizedDensity(density: number) {
  return Math.max(1, Math.ceil(density * 2 - 1e-6) / 2);
}

// Numeric signature of everything baked into an isolated buffer: leaf keys (which select the
// vertex strips), textures, blends, transforms and colors, including nested groups' colors,
// blends and alpha. Two independent 32-bit hashes combine into one 53-bit number.
const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);
let h1 = 0,
  h2 = 0;
const word = (v: number) => {
  h1 = Math.imul(h1 ^ v, 0x01000193);
  h2 = Math.imul(h2 ^ v, 0x5bd1e995);
  h2 ^= h2 >>> 15;
};
const num = (v: number) => {
  f64[0] = v;
  word(u32[0]);
  word(u32[1]);
};
const str = (s: string) => {
  for (let i = 0; i < s.length; i++) word(s.charCodeAt(i));
  word(0x2f2f);
};
const numbers = (list: readonly number[], count: number) => {
  for (let i = 0; i < count; i++) num(list[i]);
};
function hashPoses(poses: readonly NativeScenePose[]) {
  for (let i = 0; i < poses.length; i++) {
    const p = poses[i];
    if ('group' in p) {
      word(0x4747);
      str(p.key);
      word(p.blend);
      numbers(p.multiply, 4);
      numbers(p.add, 4);
      hashPoses(p.group);
      word(0x3b3b);
    } else {
      word(0x4c4c);
      str(p.key);
      word(p.texture);
      word(p.blend);
      numbers(p.matrix, 6);
      numbers(p.multiply, 4);
      numbers(p.add, 4);
    }
  }
}
function groupSignature(pose: NativeGroupPose, density: number, colored: boolean): number {
  h1 = 0x811c9dc5;
  h2 = 0x9747b28c;
  num(density);
  // Group multiply/add are baked into colored buffers; alpha, blend and position are image state.
  if (colored) {
    numbers(pose.multiply, 3);
    numbers(pose.add, 3);
  } else word(0x5757);
  hashPoses(pose.group);
  return (h1 >>> 0) * 0x200000 + ((h2 >>> 0) & 0x1fffff);
}

const scratchBounds = [0, 0, 0, 0];
function includeBounds(poses: readonly NativeScenePose[], bounds: number[]) {
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];
    if ('group' in pose) includeBounds(pose.group, bounds);
    else includeNativeVertices(pose, bounds);
  }
}

export function nativeSceneBounds(
  poses: readonly NativeScenePose[],
): [number, number, number, number] | undefined {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  includeBounds(poses, bounds);
  return bounds[0] === Infinity ? undefined : [bounds[0], bounds[1], bounds[2], bounds[3]];
}

function transformed(poses: readonly NativeScenePose[], matrix: NativeMatrix): NativeScenePose[] {
  return poses.map((pose) =>
    'group' in pose
      ? { ...pose, group: transformed(pose.group, matrix) }
      : { ...pose, matrix: nativeMatrix(matrix, pose.matrix) },
  );
}

const IDENTITY_COLOR = [1, 1, 1, 1],
  NO_ADD = [0, 0, 0, 0];
const byte = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255);
const rgb = (c: readonly number[]) => (byte(c[0]) << 16) | (byte(c[1]) << 8) | byte(c[2]);
type ColoredImage = Phaser.GameObjects.Image & {
  tint2TopLeft: number;
  tint2TopRight: number;
  tint2BottomLeft: number;
  tint2BottomRight: number;
  tintMode: number;
  /** Carries a group color in its tint (status tints combine with it, as on leaf meshes). */
  nativeColored?: boolean;
  /** The real additive blend slot, for a status tint mode that must replace the additive tint. */
  nativeAdditiveBlend?: number;
};
/** Group multiply/add as the quad renderer's native color tint on the drawn buffer image. */
function setGroupColor(image: Phaser.GameObjects.Image, tint: number, tint2: number, mode: number) {
  const colored = image as ColoredImage;
  colored.nativeColored = tint !== 0xffffff || tint2 !== 0;
  if (colored.tint !== tint) colored.setTint(tint);
  if (colored.tint2TopLeft !== tint2)
    colored.tint2TopLeft =
      colored.tint2TopRight =
      colored.tint2BottomLeft =
      colored.tint2BottomRight =
        tint2;
  if (colored.tintMode !== mode) colored.setTintMode(mode);
}

/**
 * Single-leaf group flattening and multiply-leaf isolation, once per shared pose list: shared
 * samples are immutable, so the result is cached by list identity (like
 * flattenDisjointGroups), which also keeps the pose objects stable for the mesh fast path.
 */
const preparedCache = new WeakMap<readonly NativeScenePose[], readonly NativeScenePose[]>();
function prepared(poses: readonly NativeScenePose[]) {
  const cached = preparedCache.get(poses);
  if (cached) return cached;
  const out = isolateMultiplyLeaves(flattenSingleLeafGroups(poses));
  preparedCache.set(poses, out);
  return out;
}
/** Direct multiply leaves also need isolation before the two destination passes. */
function isolateMultiplyLeaves(poses: readonly NativeScenePose[]): readonly NativeScenePose[] {
  let found = false;
  for (let i = 0; i < poses.length && !found; i++) {
    const p = poses[i];
    found = !('group' in p) && p.blend === 3;
  }
  if (!found) return poses;
  return poses.map((p) =>
    !('group' in p) && p.blend === 3
      ? {
          key: p.key,
          blend: 3,
          multiply: p.multiply,
          add: p.add,
          group: [{ ...p, blend: 0, multiply: IDENTITY_COLOR, add: NO_ADD }],
        }
      : p,
  );
}

/**
 * A screen/additive group holding one colorless-composited leaf needs no buffer: the leaf lands
 * on a cleared buffer unchanged (normal, screen and additive all reduce to the source there), so
 * compositing that buffer equals drawing the leaf with the group's blend and folded alpha. Group
 * multiply is folded only when it has no color (the group color would clamp after the leaf's).
 */
export function flattenSingleLeafGroups(
  poses: readonly NativeScenePose[],
): readonly NativeScenePose[] {
  let result: NativeScenePose[] | undefined;
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];
    if (
      !('group' in pose) ||
      pose.blend === 3 ||
      pose.group.length !== 1 ||
      'group' in pose.group[0] ||
      pose.group[0].blend === 3 ||
      !colorless(pose)
    )
      continue;
    const leaf = pose.group[0];
    result ??= poses.slice();
    result[i] = {
      key: pose.key,
      texture: leaf.texture,
      vertices: leaf.vertices,
      matrix: leaf.matrix,
      multiply: [
        leaf.multiply[0],
        leaf.multiply[1],
        leaf.multiply[2],
        leaf.multiply[3] * pose.multiply[3],
      ],
      add: leaf.add,
      blend: pose.blend,
    };
  }
  return result ?? poses;
}

/** Frames a shrinkable buffer must stay under a quarter used before it is swapped for a smaller one. */
const SHRINK_FRAMES = 120;
/** Renders a vanished group stays parked (hidden, buffer and meshes kept) before release. */
const PARK_FRAMES = 30;

interface GroupEntry {
  /** Composited buffer the scene (or an enclosing group) draws. */
  buffer?: NativeGroupBuffer;
  /** The drawn group image (`buffer.image`), kept for callers of the earlier API. */
  image?: Phaser.GameObjects.RenderTexture;
  /** Colored groups: children compose here first, then paint `buffer` through the color filter. */
  source?: NativeGroupBuffer;
  content: NativeSceneView;
  multiplyImage?: Phaser.GameObjects.Image;
  /** Crop (width * 65536 + height) last applied to multiplyImage. */
  multiplyCrop: number;
  signature: number;
  stamp: number;
  density: number;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Consecutive frames the buffer was more than 4x the content area. */
  oversized: number;
  multiply: number[];
  add: number[];
  /** The group pose object last hashed at `lastDensity`: the same object again is the same signature. */
  lastPose?: NativeGroupPose;
  lastDensity: number;
}

// One context-loss listener pair per renderer serves every live top-level view.
const liveViews = new Map<Renderer, Set<NativeSceneView>>();
function onContextLost(this: Renderer) {
  // Phaser 4.2.1 otherwise deletes stale handles in the restored context.
  // Filters also use pooled framebuffers outside the views' own textures.
  // Every handle belongs to the lost context and is already invalidated;
  // retain the wrappers/attachment descriptions so Phaser can recreate them.
  for (const framebuffer of this.glFramebufferWrappers) framebuffer.webGLFramebuffer = null;
}
function onContextRestored(this: Renderer) {
  // Restored buffers are empty: repaint every live group from its retained content now, since a
  // caller may never call render() again while its own signature stays unchanged.
  for (const view of liveViews.get(this) ?? []) view.repaint();
}
function track(renderer: Renderer, view: NativeSceneView) {
  let views = liveViews.get(renderer);
  if (!views) {
    liveViews.set(renderer, (views = new Set()));
    renderer.on(Phaser.Renderer.Events.LOSE_WEBGL, onContextLost, renderer);
    renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL, onContextRestored, renderer);
  }
  views.add(view);
}
function untrack(renderer: Renderer, view: NativeSceneView) {
  const views = liveViews.get(renderer);
  if (!views?.delete(view) || views.size) return;
  liveViews.delete(renderer);
  renderer.off(Phaser.Renderer.Events.LOSE_WEBGL, onContextLost, renderer);
  renderer.off(Phaser.Renderer.Events.RESTORE_WEBGL, onContextRestored, renderer);
}

/**
 * A view for transient combat effects: beams, bursts, trails and projectiles.
 *
 * These carry their group colors as the quad renderer's GPU tint instead of a float filter pass.
 * The filter costs a second offscreen buffer the size of the effect and a pooled drawing context
 * per group per frame, and a beam that spans the base is a buffer of several hundred pixels a
 * side; an effect has no source-pixel comparison to hold it to the float path, and the two agree
 * within half a step per channel. Building bodies keep the plain view (and the filter).
 */
export function effectSceneView(scene: Phaser.Scene, prefix: string) {
  const view = new NativeSceneView(scene, prefix);
  view.gpuGroupColor = true;
  // A blinking burst keeps its buffer parked between appearances instead of giving it back and
  // painting a new one. Its groups stay groups (specs count them across context restoration).
  view.parkGroups = true;
  view.mergeLeaves = true;
  // No bake budget here: an effect's mesh set must be the same whether a color bakes on its
  // first frame or later (replay-seek specs compare the two), and a burst rarely saturates.
  return view;
}

/** Retains native polygons and composites native blend groups in separate GPU buffers. */
export class NativeSceneView {
  private leaves: NativeMeshView;
  private renderer: Renderer;
  private stamp = 0;
  private tracked = false;
  readonly groups = new Map<string, GroupEntry>();
  /** Drawn objects in final order, rebuilt by every render(). */
  objects: NativeObject[] = [];
  /** Draw disjoint screen/additive groups as plain leaves (see flattenDisjointGroups). */
  flattenDisjoint = false;
  /** Keep a vanished group's buffer and content parked for PARK_FRAMES renders (animated units). */
  parkGroups = false;
  /**
   * Carry group colors as an 8-bit GPU tint on the drawn buffer instead of a float-precision
   * filter pass (which takes a pooled framebuffer per group per frame). Within half a step per
   * channel of the filter; on by the troop presentation, off where source pixels are compared.
   */
  gpuGroupColor = false;
  /** Clamp saturating leaf colors on the GPU instead of baking texel copies (see NativeMeshView). */
  get gpuSaturate() {
    return this.leaves.gpuSaturate;
  }
  set gpuSaturate(value: boolean) {
    if (this.leaves.gpuSaturate === value) return;
    this.leaves.gpuSaturate = value;
    // Group content views copy the flag when they are created; a flip must reach them too.
    for (const entry of this.groups.values()) entry.content.gpuSaturate = value;
  }
  /** Draw consecutive same-state leaves as one mesh (see NativeMeshView.mergeLeaves). */
  get mergeLeaves() {
    return this.leaves.mergeLeaves;
  }
  set mergeLeaves(value: boolean) {
    this.leaves.mergeLeaves = value;
  }
  /** Defer texel bakes past the frame's bake budget (see NativeMeshView.bakeBudget). */
  get bakeBudget() {
    return this.leaves.bakeBudget;
  }
  set bakeBudget(value: boolean) {
    this.leaves.bakeBudget = value;
  }
  /** The quad shader carries group colors, so colored groups need no filter pass. */
  private gpuColor: boolean;
  constructor(
    private scene: Phaser.Scene,
    private prefix: string,
    private detached = false,
  ) {
    this.renderer = scene.game.renderer as Renderer;
    this.gpuColor = configureNativeQuadColor(this.renderer);
    this.leaves = new NativeMeshView(scene, prefix, detached);
    if (!detached) {
      track(this.renderer, this);
      this.tracked = true;
    }
  }
  /** Force isolated buffers to repaint on the next render. */
  invalidate() {
    for (const entry of this.groups.values()) {
      entry.signature = NaN;
      entry.content.invalidate();
    }
  }
  /** Repaints every isolated buffer from retained content, innermost first. */
  repaint() {
    for (const entry of this.groups.values()) {
      entry.content.repaint();
      this.paint(entry);
    }
  }
  get meshes() {
    return this.leaves.meshes;
  }
  render(
    poses: readonly NativeScenePose[],
    x: number,
    y: number,
    depth: number,
    alpha = 1,
    density = Math.max(1, this.scene.cameras.main.zoomX, this.scene.cameras.main.zoomY),
  ) {
    density = quantizedDensity(density);
    // Views drawing shared samples (flattenDisjoint) keep the flattened list per sample, so
    // the pose objects stay stable for the mesh fast path. Other callers build fresh poses
    // per frame: caching by those would only feed the collector a weak key per render.
    if (this.flattenDisjoint) poses = prepared(flattenDisjointGroups(poses));
    else poses = isolateMultiplyLeaves(flattenSingleLeafGroups(poses));
    // Final depths are assigned below in full pose order (leaves interleaved
    // with blend groups), not in leaf-list order.
    this.leaves.render(poses, x, y, depth, alpha, false);
    const objects = this.objects;
    objects.length = 0;
    const stamp = ++this.stamp;
    nativeSceneStats.renders++;
    if (this.groups.size) {
      // Release vanished groups first, so new groups can reuse their pooled buffers.
      let wanted = 0;
      for (let i = 0; i < poses.length; i++) {
        const pose = poses[i];
        const entry = 'group' in pose ? this.groups.get(pose.key) : undefined;
        if (entry) {
          entry.stamp = stamp;
          wanted++;
        }
      }
      if (wanted !== this.groups.size)
        for (const [key, entry] of this.groups)
          if (entry.stamp !== stamp) {
            // A blinking group keeps its buffer and content meshes parked for a while: releasing
            // and rebuilding them a frame later costs a full paint and mesh churn.
            if (this.parkGroups && stamp - entry.stamp <= PARK_FRAMES) {
              const image = entry.buffer?.image;
              if (image?.visible) image.setVisible(false);
              if (entry.multiplyImage?.visible) entry.multiplyImage.setVisible(false);
            } else {
              this.release(entry);
              this.groups.delete(key);
            }
          }
    }
    for (let order = 0; order < poses.length; order++) {
      const pose = poses[order];
      const wantDepth = depth + order * PART_DEPTH_STEP;
      let object: NativeObject;
      let entry: GroupEntry | undefined;
      if ('group' in pose) {
        nativeSceneStats.groups++;
        if (nativeSceneStats.skipGroups) continue;
        entry = this.renderGroup(pose, x, y, alpha, density, stamp);
        if (!entry) {
          // Nothing to draw (no vertices): give its buffer back.
          const empty = this.groups.get(pose.key);
          if (empty) {
            this.release(empty);
            this.groups.delete(pose.key);
          }
          continue;
        }
        object = entry.buffer!.image;
      } else {
        // A leaf merged into an earlier run has no mesh of its own.
        const mesh = this.leaves.runMeshes[order];
        if (!mesh) continue;
        object = mesh;
      }
      // Guard depth writes: any assignment queues a full stable sort of the display list.
      if (object.depth !== wantDepth) object.setDepth(wantDepth);
      if (!object.visible) object.setVisible(true);
      objects.push(object);
      if (entry?.multiplyImage) {
        const second = entry.multiplyImage;
        const wantSecondDepth = wantDepth + PART_DEPTH_STEP / 2;
        if (second.depth !== wantSecondDepth) second.setDepth(wantSecondDepth);
        if (!second.visible) second.setVisible(true);
        objects.push(second);
      }
    }
  }
  private renderGroup(
    pose: NativeGroupPose,
    x: number,
    y: number,
    alpha: number,
    density: number,
    stamp: number,
  ): GroupEntry | undefined {
    const colored = !colorless(pose);
    // Group colors within 0..1 ride on the drawn image as a GPU tint; the filter pass (and its
    // second buffer) stays only for other colors and for renderers without the tint branch.
    const filtered = colored && !(this.gpuGroupColor && this.gpuColor && inUnitRange(pose));
    let entry = this.groups.get(pose.key);
    if (entry && entry.oversized > SHRINK_FRAMES) {
      entry.signature = NaN;
      entry.lastPose = undefined;
    }
    // A shared sample drawn again at the same density hashes to the same signature: skip it.
    const unchanged = !!entry && entry.lastPose === pose && entry.lastDensity === density;
    const signature = unchanged ? entry!.signature : groupSignature(pose, density, filtered);
    if (!entry || entry.signature !== signature) {
      const bounds = scratchBounds;
      bounds[0] = bounds[1] = Infinity;
      bounds[2] = bounds[3] = -Infinity;
      includeBounds(pose.group, bounds);
      if (bounds[0] === Infinity) return undefined;
      // Keep the buffer within the GPU's texture limit: an oversized framebuffer fails its
      // completeness check and Phaser throws out of the game loop.
      const limit = this.renderer.getMaxTextureSize() - 8;
      const span = Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1], 1e-6);
      const d = Math.min(density, limit / span);
      // Pixel-aligned edges and a transparent guard texel avoid clipping the
      // source strips. Buffers follow physical camera zoom, including retina.
      const left = Math.floor(bounds[0] * d) - 1,
        top = Math.floor(bounds[1] * d) - 1;
      const width = Math.ceil(bounds[2] * d) - left + 1,
        height = Math.ceil(bounds[3] * d) - top + 1;
      if (!entry) {
        const content = new NativeSceneView(this.scene, this.prefix, true);
        // Nested groups draw the way this view's do: a colored group inside an effect otherwise
        // took the filter pass (and a pooled framebuffer) its parent had opted out of.
        content.gpuGroupColor = this.gpuGroupColor;
        content.flattenDisjoint = this.flattenDisjoint;
        content.parkGroups = this.parkGroups;
        content.mergeLeaves = this.mergeLeaves;
        content.bakeBudget = this.bakeBudget;
        content.gpuSaturate = this.gpuSaturate;
        entry = {
          content,
          multiplyCrop: 0,
          signature: NaN,
          stamp,
          density: d,
          left,
          top,
          width,
          height,
          oversized: 0,
          multiply: [1, 1, 1],
          add: [0, 0, 0],
          lastDensity: NaN,
        };
        this.groups.set(pose.key, entry);
      }
      Object.assign(entry, { density: d, left, top, width, height });
      for (let i = 0; i < 3; i++) {
        entry.multiply[i] = pose.multiply[i];
        entry.add[i] = pose.add[i];
      }
      this.allocate(entry, filtered);
      entry.content.render(transformed(pose.group, [d, 0, -left, 0, d, -top]), 0, 0, 0, 1, 1);
      this.paint(entry);
      entry.signature = signature;
    }
    entry.lastPose = pose;
    entry.lastDensity = density;
    entry.stamp = stamp;
    const buffer = entry.buffer!;
    entry.oversized =
      buffer.width * buffer.height > 4 * entry.width * entry.height ? entry.oversized + 1 : 0;
    const image = buffer.image;
    const tint = colored && !filtered ? rgb(pose.multiply) : 0xffffff;
    const tint2 = colored && !filtered ? rgb(pose.add) : 0;
    // A scene-drawn additive group image uses the additive tint mode in the normal blend state
    // (see NATIVE_ADDITIVE_TINT_MODE); nested ones compose into transparent buffers and keep the
    // real mode.
    const additive = pose.blend === 8 && this.gpuColor && !this.detached;
    setGroupColor(
      image,
      tint,
      tint2,
      additive ? NATIVE_ADDITIVE_TINT_MODE : NATIVE_COLOR_TINT_MODE,
    );
    if (additive) (image as ColoredImage).nativeAdditiveBlend = nativeBlendMode(this.renderer, 8);
    const blend = additive
      ? Phaser.BlendModes.NORMAL
      : pose.blend === 3
        ? nativeMultiplyModes(this.renderer)[0]
        : nativeBlendMode(this.renderer, pose.blend);
    if (image.blendMode !== blend) image.setBlendMode(blend);
    let wantX = x + entry.left / entry.density,
      wantY = y + entry.top / entry.density;
    if (!this.detached) {
      // Snap the buffer to the device-pixel grid so its texels map 1:1 at matching zoom.
      const camera = this.scene.cameras.main;
      const zx = camera.zoomX,
        zy = camera.zoomY;
      const ox = camera.width * camera.originX,
        oy = camera.height * camera.originY;
      wantX = (Math.round(ox + (wantX - camera.scrollX - ox) * zx) - ox) / zx + camera.scrollX + ox;
      wantY = (Math.round(oy + (wantY - camera.scrollY - oy) * zy) - oy) / zy + camera.scrollY + oy;
    }
    const wantScale = 1 / entry.density;
    const wantAlpha = alpha * pose.multiply[3];
    if (image.x !== wantX || image.y !== wantY) image.setPosition(wantX, wantY);
    if (image.scaleX !== wantScale || image.scaleY !== wantScale) image.setScale(wantScale);
    if (image.alpha !== wantAlpha) image.setAlpha(wantAlpha);
    if (pose.blend === 3) {
      let second = entry.multiplyImage;
      if (!second) {
        second = entry.multiplyImage = new Phaser.GameObjects.Image(
          this.scene,
          0,
          0,
          image.texture,
        ).setOrigin(0, 0);
        second.setBlendMode(nativeMultiplyModes(this.renderer)[1]);
        if (!this.detached) this.scene.add.existing(second);
      }
      if (second.texture !== image.texture) {
        // Phaser accepts a Texture instance here; its declaration only lists keys.
        second.setTexture(image.texture as unknown as string);
        entry.multiplyCrop = 0;
      }
      const crop = entry.width * 0x10000 + entry.height;
      if (entry.multiplyCrop !== crop) {
        second.setCrop(0, 0, entry.width, entry.height);
        entry.multiplyCrop = crop;
      }
      setGroupColor(second, tint, tint2, NATIVE_COLOR_TINT_MODE);
      if (second.x !== wantX || second.y !== wantY) second.setPosition(wantX, wantY);
      if (second.scaleX !== wantScale || second.scaleY !== wantScale) second.setScale(wantScale);
      if (second.alpha !== wantAlpha) second.setAlpha(wantAlpha);
    } else if (entry.multiplyImage) {
      entry.multiplyImage.destroy();
      entry.multiplyImage = undefined;
    }
    return entry;
  }
  /** Grow-only buffers: reallocate when content outgrows them or stays far smaller for a while. */
  private allocate(entry: GroupEntry, filtered: boolean) {
    const pool = groupBufferPool(this.scene);
    const { width, height } = entry;
    const current = entry.buffer;
    const fits = current && current.width >= width && current.height >= height;
    if (current && !fits) {
      // Grow in place with headroom: same framebuffer wrapper, no pool churn while content grows.
      pool.resize(
        current,
        Math.max(current.width, Math.ceil(width * 1.25)),
        Math.max(current.height, Math.ceil(height * 1.25)),
      );
    } else if (!current || entry.oversized > SHRINK_FRAMES) {
      if (current) pool.release(current);
      entry.buffer = pool.acquire(width, height);
      entry.image = entry.buffer.image;
      const image = entry.buffer.image;
      if (!this.detached) this.scene.add.existing(image);
      image.setVisible(true);
    }
    entry.oversized = 0;
    const buffer = entry.buffer!;
    if (buffer.cropWidth !== width || buffer.cropHeight !== height) {
      buffer.image.setCrop(0, 0, width, height);
      buffer.cropWidth = width;
      buffer.cropHeight = height;
    }
    if (filtered) {
      // The source only needs to cover the content; it is drawn unscaled at the buffer origin.
      let source = entry.source;
      if (!source || source.width < width || source.height < height) {
        if (source) pool.release(source);
        source = entry.source = pool.acquire(width, height, true);
        const image = source.image;
        image.setVisible(true).setPosition(0, 0).setScale(1).setAlpha(1);
        image.setBlendMode(Phaser.BlendModes.NORMAL);
        source.color ??= new NativeGroupColor(image);
      }
    } else if (entry.source) {
      pool.release(entry.source);
      entry.source = undefined;
    }
  }
  /** Draws retained content into the group buffer (through the color filter when colored). */
  private paint(entry: GroupEntry) {
    const buffer = entry.buffer;
    if (!buffer) return;
    nativeSceneStats.paints++;
    const target = buffer.image;
    const content = entry.content.objects;
    if (entry.source) {
      const source = entry.source.image;
      const color = entry.source.color!;
      color.active = true;
      color.setColor(entry.multiply, entry.add);
      source.clear().draw(content).render();
      target.clear().draw(source).render();
    } else target.clear().draw(content).render();
  }
  private release(entry: GroupEntry) {
    const pool = groupBufferPool(this.scene);
    entry.content.destroy();
    entry.multiplyImage?.destroy();
    if (entry.buffer) pool.release(entry.buffer);
    if (entry.source) pool.release(entry.source);
    entry.buffer = entry.source = entry.multiplyImage = entry.image = undefined;
  }
  clear() {
    this.leaves.clear();
    for (const entry of this.groups.values()) this.release(entry);
    this.groups.clear();
    this.objects.length = 0;
  }
  destroy() {
    if (this.tracked) {
      untrack(this.renderer, this);
      this.tracked = false;
    }
    this.clear();
  }
  /**
   * Ends the view like `destroy`, but its meshes park in the scene-wide spare pool (hidden,
   * still listed) for the next view instead of being spliced out of the display list one by
   * one. Group buffers return to their pool as they do on destroy.
   */
  retire() {
    if (this.tracked) {
      untrack(this.renderer, this);
      this.tracked = false;
    }
    this.leaves.retire();
    for (const entry of this.groups.values()) this.release(entry);
    this.groups.clear();
    this.objects.length = 0;
  }
}
