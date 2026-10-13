/** Retained native scene data. Source UVs are normalized after lossless packing. */
export interface NativeMeshGraph {
  exports: Record<string, number>;
  shapes: Record<string, [texture: number, vertices: number[]][]>;
  clips: Record<
    string,
    {
      fps: number;
      children: number[];
      names: string[];
      blending: number[];
      frames: number[][][];
      timeline: number[];
      /** Retained source frame labels: activation, battle idle, attack and reload segments. */
      labels?: [frame: number, label: string][];
    }
  >;
  matrices: number[][];
  colors: number[][];
  /** `levels`: a level page (scripts/native-pages.mjs) drawn only by these pack levels. */
  textures: Record<string, { path: string; width: number; height: number; levels?: number[] }>;
}
export type NativeMatrix = [number, number, number, number, number, number];
export type NativeBlend = 0 | 3 | 4 | 8;
export interface NativeMeshPose {
  key: string;
  texture: number;
  vertices: number[];
  matrix: NativeMatrix;
  multiply: number[];
  add: number[];
  blend: NativeBlend;
  /**
   * A leaf lifted out of a disjoint blend group (flattenDisjointGroups): its color already
   * includes the group's and applies on the GPU after filtering, as the group buffer's would.
   */
  folded?: boolean;
}
export interface NativeGroupPose {
  key: string;
  group: NativeScenePose[];
  multiply: number[];
  add: number[];
  blend: 3 | 4 | 8;
}
export type NativeScenePose = NativeMeshPose | NativeGroupPose;
export const NATIVE_IDENTITY: NativeMatrix = [1, 0, 0, 0, 1, 0];
/** Texture key of one retained source texture page inside a renderer namespace. */
export const nativeMeshTexture = (prefix: string, id: string | number) => `${prefix}:mesh:${id}`;

export function nativeMatrix(a: readonly number[], b: readonly number[]): NativeMatrix {
  return [
    a[0] * b[0] + a[1] * b[3],
    a[0] * b[1] + a[1] * b[4],
    a[0] * b[2] + a[1] * b[5] + a[2],
    a[3] * b[0] + a[4] * b[3],
    a[3] * b[1] + a[4] * b[4],
    a[3] * b[2] + a[4] * b[5] + a[5],
  ];
}

const ages = new WeakMap<NativeMeshGraph, Map<number, Map<number, number[]>>>();
/** -1 means the slot is continuously present across the complete source loop. */
function placementAges(graph: NativeMeshGraph, id: number, slot: number) {
  let byClip = ages.get(graph);
  if (!byClip) ages.set(graph, (byClip = new Map()));
  let bySlot = byClip.get(id);
  if (!bySlot) byClip.set(id, (bySlot = new Map()));
  let result = bySlot.get(slot);
  if (result) return result;
  const clip = graph.clips[id];
  const present = clip.timeline.map((i) => clip.frames[i].some((p) => p[0] === slot));
  result = present.map((exists, f) => {
    if (!exists) return 0;
    let age = 0;
    while (age < present.length && present[(f - age - 1 + present.length) % present.length]) age++;
    return age === present.length ? -1 : age;
  });
  bySlot.set(slot, result);
  return result;
}

/**
 * Deterministic source playback. Named controls select source frames directly;
 * native engine direction mapping and subclip clocks need separate validation.
 * Sampling cost is independent of how long the battle has been running.
 */
export function nativeMeshPoses(
  graph: NativeMeshGraph,
  name: string,
  seconds: number,
  controls: Readonly<Record<string, number | false>> = {},
  root: NativeMatrix = NATIVE_IDENTITY,
): NativeMeshPose[] {
  return sampleNativeScene(graph, name, seconds, controls, root, false, 1) as NativeMeshPose[];
}

/**
 * Retains screen/additive container boundaries instead of distributing their blend to leaves.
 * `alpha` scales the root opacity: top-level leaves and groups carry it in `multiply[3]`, exactly
 * as multiplying each returned pose's alpha afterwards would, without copying the poses.
 */
export function nativeScenePoses(
  graph: NativeMeshGraph,
  name: string,
  seconds: number,
  controls: Readonly<Record<string, number | false>> = {},
  root: NativeMatrix = NATIVE_IDENTITY,
  alpha = 1,
): NativeScenePose[] {
  return sampleNativeScene(graph, name, seconds, controls, root, true, alpha);
}

/** Integer source frame an export plays at `seconds` (the sampling clock of sampleNativeScene). */
function sourceFrame(graph: NativeMeshGraph, id: number, seconds: number) {
  const fps = graph.clips[id]?.fps ?? 1;
  return Math.floor((Number.isFinite(seconds) ? Math.max(0, seconds) : 0) * fps + 1e-9);
}

const SHARED_LIMIT = 512;
const shared = new WeakMap<NativeMeshGraph, Map<string, NativeScenePose[]>>();
function controlsKey(controls: Readonly<Record<string, number | false>>) {
  let key = '';
  for (const name in controls) {
    const value = controls[name];
    key +=
      name +
      '=' +
      (value === false ? 'x' : Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 'n') +
      ';';
  }
  return key;
}
function sharedPoses(
  graph: NativeMeshGraph,
  name: string,
  seconds: number,
  controls: Readonly<Record<string, number | false>>,
  root: NativeMatrix,
  isolate: boolean,
) {
  const id = graph.exports[name];
  if (id === undefined) throw Error(`Unknown native export: ${name}`);
  let cache = shared.get(graph);
  if (!cache) shared.set(graph, (cache = new Map()));
  const key =
    (isolate ? 's|' : 'm|') +
    name +
    '|' +
    sourceFrame(graph, id, seconds) +
    '|' +
    controlsKey(controls) +
    '|' +
    root.join(',');
  let poses = cache.get(key);
  if (poses) {
    // Refresh recency.
    cache.delete(key);
    cache.set(key, poses);
    return poses;
  }
  poses = sampleNativeScene(graph, name, seconds, controls, root, isolate, 1);
  cache.set(key, poses);
  if (cache.size > SHARED_LIMIT) cache.delete(cache.keys().next().value!);
  return poses;
}

/**
 * Memoized nativeScenePoses: identical requests (same export, integer source frame, controls and
 * root matrix) within and across frames return the same arrays, so identical units sample once.
 * The result is shared and must be treated as immutable — no pushing into the array and no
 * reassigning pose fields. Callers that edit poses must keep using nativeScenePoses.
 */
export function nativeScenePosesShared(
  graph: NativeMeshGraph,
  name: string,
  seconds: number,
  controls: Readonly<Record<string, number | false>> = {},
  root: NativeMatrix = NATIVE_IDENTITY,
): readonly NativeScenePose[] {
  return sharedPoses(graph, name, seconds, controls, root, true);
}

/** Memoized nativeMeshPoses with the same immutability contract as nativeScenePosesShared. */
export function nativeMeshPosesShared(
  graph: NativeMeshGraph,
  name: string,
  seconds: number,
  controls: Readonly<Record<string, number | false>> = {},
  root: NativeMatrix = NATIVE_IDENTITY,
): readonly NativeMeshPose[] {
  return sharedPoses(graph, name, seconds, controls, root, false) as NativeMeshPose[];
}

function sampleNativeScene(
  graph: NativeMeshGraph,
  name: string,
  seconds: number,
  controls: Readonly<Record<string, number | false>>,
  root: NativeMatrix,
  isolate: boolean,
  alpha: number,
): NativeScenePose[] {
  const id = graph.exports[name];
  if (id === undefined) throw Error(`Unknown native export: ${name}`);
  const poses: NativeScenePose[] = [];
  const ancestors: number[] = [];
  const walk = (
    id: number,
    frame: number,
    matrix: NativeMatrix,
    multiply: number[],
    add: number[],
    blend: NativeBlend,
    path: string,
    output: NativeScenePose[],
  ) => {
    if (ancestors.includes(id) || ancestors.length >= 32) throw Error('Recursive native scene');
    const commands = graph.shapes[id];
    if (commands) {
      for (const [index, [texture, vertices]] of commands.entries())
        output.push({ key: `${path}:${index}`, texture, vertices, matrix, multiply, add, blend });
      return;
    }
    const clip = graph.clips[id];
    if (!clip) throw Error(`Missing native object: ${id}`);
    const f = frame % clip.timeline.length;
    for (const [slot, transform, tint] of clip.frames[clip.timeline[f]]) {
      const child = clip.children[slot];
      const nested = graph.clips[child];
      const age = placementAges(graph, id, slot)[f];
      const elapsed = age < 0 ? frame : Math.min(frame, age);
      const control = controls[clip.names[slot]];
      if (control === false) continue;
      const phase = Number.isFinite(control)
        ? Math.max(0, Math.floor(control))
        : nested
          ? Math.floor((elapsed * nested.fps) / clip.fps)
          : 0;
      const mode = clip.blending[slot];
      if (mode !== 0 && mode !== 3 && mode !== 4 && mode !== 8)
        throw Error('Unsupported native blend');
      const color = graph.colors[tint];
      if (color[7] !== 0) throw Error('Additive native alpha is unsupported');
      const nextMatrix = nativeMatrix(matrix, graph.matrices[transform]);
      // Identity tints (1,1,1,1,0,0,0,0) are common: reuse the parent arrays.
      const identity =
        color[0] === 1 &&
        color[1] === 1 &&
        color[2] === 1 &&
        color[3] === 1 &&
        color[4] === 0 &&
        color[5] === 0 &&
        color[6] === 0 &&
        color[7] === 0;
      const nextMultiply = identity
        ? multiply
        : [
            multiply[0] * color[0],
            multiply[1] * color[1],
            multiply[2] * color[2],
            multiply[3] * color[3],
          ];
      const nextAdd = identity
        ? add
        : [
            multiply[0] * color[4] + add[0],
            multiply[1] * color[5] + add[1],
            multiply[2] * color[6] + add[2],
            multiply[3] * color[7] + add[3],
          ];
      if (mode === 3 || ((mode === 4 || mode === 8) && nested?.children.length)) {
        if (!isolate) throw Error('Native blend group requires isolated compositing');
        const group: NativeScenePose[] = [];
        output.push({
          key: `${path}/${slot}`,
          group,
          multiply: nextMultiply,
          add: nextAdd,
          blend: mode,
        });
        ancestors.push(id);
        walk(child, phase, nextMatrix, [1, 1, 1, 1], [0, 0, 0, 0], 0, `${path}/${slot}`, group);
        ancestors.pop();
        continue;
      }
      ancestors.push(id);
      walk(
        child,
        phase,
        nextMatrix,
        nextMultiply,
        nextAdd,
        mode || blend,
        `${path}/${slot}`,
        output,
      );
      ancestors.pop();
    }
  };
  walk(
    id,
    sourceFrame(graph, id, seconds),
    root,
    [1, 1, 1, alpha],
    [0, 0, 0, 0],
    0,
    String(id),
    poses,
  );
  return poses;
}

/** Triangle topology depends only on vertex count: cache per strip length. */
const triangleCache = new Map<number, number[]>();
export function nativeTriangles(vertices: readonly number[]) {
  const quads = vertices.length / 4 - 2;
  let cached = triangleCache.get(quads);
  if (!cached) {
    cached = [];
    for (let i = 0; i < quads; i++) cached.push(i % 2 ? i + 1 : i, i % 2 ? i : i + 1, i + 2, 0);
    triangleCache.set(quads, cached);
  }
  return cached;
}

/** Grows `bounds` ([left, top, right, bottom]) by a leaf's transformed vertices, allocation-free. */
export function includeNativeVertices(pose: NativeMeshPose, bounds: number[]) {
  const m = pose.matrix,
    src = pose.vertices;
  const a = m[0],
    c = m[1],
    x = m[2],
    b = m[3],
    d = m[4],
    y = m[5];
  let left = bounds[0],
    top = bounds[1],
    right = bounds[2],
    bottom = bounds[3];
  for (let i = 0; i < src.length; i += 4) {
    const px = a * src[i] + c * src[i + 1] + x,
      py = b * src[i] + d * src[i + 1] + y;
    if (px < left) left = px;
    if (px > right) right = px;
    if (py < top) top = py;
    if (py > bottom) bottom = py;
  }
  bounds[0] = left;
  bounds[1] = top;
  bounds[2] = right;
  bounds[3] = bottom;
}

export function nativeVertices(pose: NativeMeshPose) {
  const [a, c, x, b, d, y] = pose.matrix;
  const src = pose.vertices;
  const out = new Array<number>(src.length);
  for (let i = 0; i < src.length; i += 4) {
    out[i] = a * src[i] + c * src[i + 1] + x;
    out[i + 1] = b * src[i] + d * src[i + 1] + y;
    out[i + 2] = src[i + 2];
    out[i + 3] = src[i + 3];
  }
  return out;
}
