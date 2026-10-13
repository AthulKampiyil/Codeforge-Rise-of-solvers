import {
  includeNativeVertices,
  type NativeGroupPose,
  type NativeMeshPose,
  type NativeScenePose,
} from './native-mesh';

const white = (m: readonly number[]) => m[0] === 1 && m[1] === 1 && m[2] === 1;
/** No RGB multiply or add: the pose only carries alpha, blend and geometry. */
export const colorless = (p: { multiply: readonly number[]; add: readonly number[] }) =>
  white(p.multiply) && p.add[0] === 0 && p.add[1] === 0 && p.add[2] === 0;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** Colors an 8-bit GPU tint can carry: every multiply and add channel within 0..1. */
export function inUnitRange(p: { multiply: readonly number[]; add: readonly number[] }) {
  for (let c = 0; c < 3; c++) {
    const m = p.multiply[c],
      a = p.add[c];
    if (!(m >= 0 && m <= 1 && a >= 0 && a <= 1)) return false;
  }
  return true;
}
/** Leaf colors whose clamp never engages, so a later group clamp composes with them linearly. */
function nonSaturating(p: { multiply: readonly number[]; add: readonly number[] }) {
  for (let c = 0; c < 3; c++) {
    const m = p.multiply[c],
      a = p.add[c];
    if (!(m >= 0 && m <= 1 && a >= 0 && m + a <= 1)) return false;
  }
  return true;
}

/** Dev-only counters (browser benchmarks read them): group renders, buffer paints, flattened groups. */
export const nativeSceneStats = {
  renders: 0,
  groups: 0,
  paints: 0,
  lifted: 0,
  bakes: 0,
  skipGroups: false,
};
if (import.meta.env.DEV)
  (globalThis as { __nativeSceneStats?: unknown }).__nativeSceneStats = nativeSceneStats;

/** World pixels two lifted leaves must keep apart so their bilinear edges never meet. */
const DISJOINT_MARGIN = 1;
const disjointCache = new WeakMap<readonly NativeScenePose[], readonly NativeScenePose[]>();
const foldScratch: NativeMeshPose[] = [];
const boxScratch: number[][] = [];
/** Collects a group's leaves with its color and alpha folded in; false when that is not exact. */
function foldLeaves(
  group: NativeGroupPose,
  multiply: readonly number[],
  add: readonly number[],
  blend: 4 | 8,
  out: NativeMeshPose[],
): boolean {
  for (const child of group.group) {
    if ('group' in child) {
      // A nested colored or multiply group clamps before this group would: keep the buffer.
      if (child.blend === 3 || !colorless(child)) return false;
      const alpha = child.multiply[3];
      const inner =
        alpha === 1 ? multiply : [multiply[0], multiply[1], multiply[2], multiply[3] * alpha];
      if (!foldLeaves(child, inner, add, blend, out)) return false;
      continue;
    }
    if (!nonSaturating(child)) return false;
    const m = child.multiply,
      a = child.add;
    out.push({
      key: child.key,
      texture: child.texture,
      vertices: child.vertices,
      matrix: child.matrix,
      multiply: [
        clamp01(m[0] * multiply[0]),
        clamp01(m[1] * multiply[1]),
        clamp01(m[2] * multiply[2]),
        m[3] * multiply[3],
      ],
      add: [
        clamp01(a[0] * multiply[0] + add[0]),
        clamp01(a[1] * multiply[1] + add[1]),
        clamp01(a[2] * multiply[2] + add[2]),
        0,
      ],
      blend,
      folded: true,
    });
  }
  return true;
}
function disjoint(leaves: readonly NativeMeshPose[]) {
  for (let i = 0; i < leaves.length; i++) {
    const box = (boxScratch[i] ??= [0, 0, 0, 0]);
    box[0] = box[1] = Infinity;
    box[2] = box[3] = -Infinity;
    includeNativeVertices(leaves[i], box);
    box[0] -= DISJOINT_MARGIN;
    box[1] -= DISJOINT_MARGIN;
    box[2] += DISJOINT_MARGIN;
    box[3] += DISJOINT_MARGIN;
  }
  for (let i = 0; i < leaves.length; i++) {
    const a = boxScratch[i];
    for (let j = i + 1; j < leaves.length; j++) {
      const b = boxScratch[j];
      if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]) return false;
    }
  }
  return true;
}
/**
 * Lifts the leaves of screen/additive groups whose leaves never overlap out of their group. With
 * at most one leaf per pixel, compositing the group first changes nothing, so the leaves draw
 * directly with the group's blend, alpha and color folded in (NativeMeshPose.folded). Exact, and
 * it saves an offscreen buffer, its repaints and a framebuffer switch per group per frame. Cached
 * per pose array, so shared samples (nativeScenePosesShared) fold once.
 */
export function flattenDisjointGroups(
  poses: readonly NativeScenePose[],
): readonly NativeScenePose[] {
  const cached = disjointCache.get(poses);
  if (cached) return cached;
  let result: NativeScenePose[] | undefined;
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i];
    let lifted: NativeMeshPose[] | undefined;
    if ('group' in pose && pose.blend !== 3 && inUnitRange(pose)) {
      foldScratch.length = 0;
      if (
        foldLeaves(pose, pose.multiply, pose.add, pose.blend, foldScratch) &&
        foldScratch.length &&
        disjoint(foldScratch)
      )
        lifted = foldScratch.slice();
    }
    if (!lifted) {
      result?.push(pose);
      continue;
    }
    nativeSceneStats.lifted++;
    result ??= poses.slice(0, i);
    for (const leaf of lifted) result.push(leaf);
  }
  const out = result ?? poses;
  disjointCache.set(poses, out);
  return out;
}
