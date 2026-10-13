import Phaser from 'phaser';

type Sortable = Phaser.GameObjects.GameObject & { _depth: number };
type DisplayList = Phaser.GameObjects.DisplayList & {
  list: Sortable[];
  sortChildrenFlag: boolean;
};

let keys = new Float64Array(0);
let order = new Uint32Array(0);
let spare = new Uint32Array(0);
let runs = new Uint32Array(0);
let placed = new Uint32Array(0);
let stamp = 0;

function reserve(n: number) {
  if (keys.length >= n) return;
  const size = n + (n >> 1);
  keys = new Float64Array(size);
  order = new Uint32Array(size);
  spare = new Uint32Array(size);
  runs = new Uint32Array(size + 1);
  placed = new Uint32Array(size);
  stamp = 0;
}

/**
 * Stable sort of a display list by depth, without a comparator call per comparison.
 *
 * Phaser's `depthSort` hands the whole list to a generic stable sort every time any object's
 * depth is written, which in a big battle is most frames and thousands of objects. This sorts an
 * index array against depths held in a Float64Array instead, and starts from the list's own
 * ascending runs: a battle list is built from a few hundred of them (layers of buildings, a unit's
 * parts), so the merge finishes in about half the passes a blind sort needs. Ties keep their
 * earlier position, exactly as Phaser's stable sort leaves them, so the drawn order is the same.
 */
export function sortByDepth(list: Sortable[]) {
  const n = list.length;
  if (n < 2) return;
  reserve(n);
  for (let i = 0; i < n; i++) {
    keys[i] = list[i]._depth;
    order[i] = i;
  }
  // Ascending runs, as boundaries into `order`. One run means the list is already in order.
  let count = 0;
  runs[0] = 0;
  for (let i = 1; i < n; i++)
    if (keys[i] < keys[i - 1]) {
      count++;
      runs[count] = i;
    }
  if (count === 0) return;
  count++;
  runs[count] = n;
  let from = order,
    into = spare;
  while (count > 1) {
    let merged = 0;
    for (let r = 0; r < count; r += 2) {
      const start = runs[r];
      if (r + 1 === count) {
        // An odd run passes through untouched; its boundary carries over.
        for (let i = start; i < n; i++) into[i] = from[i];
        runs[merged] = start;
        merged++;
        break;
      }
      const middle = runs[r + 1],
        end = runs[r + 2];
      let a = start,
        b = middle,
        out = start;
      while (a < middle && b < end)
        into[out++] = keys[from[a]] <= keys[from[b]] ? from[a++] : from[b++];
      while (a < middle) into[out++] = from[a++];
      while (b < end) into[out++] = from[b++];
      runs[merged] = start;
      merged++;
    }
    runs[merged] = n;
    count = merged;
    const swap = from;
    from = into;
    into = swap;
  }
  // Apply the permutation in place, one cycle at a time: no second object array, and nothing
  // holds on to a display object after the sort. `placed` is stamped rather than cleared.
  if (++stamp === 0xffffffff) {
    placed.fill(0);
    stamp = 1;
  }
  for (let i = 0; i < n; i++) {
    if (placed[i] === stamp) continue;
    let at = i;
    const held = list[i];
    for (;;) {
      placed[at] = stamp;
      const source = from[at];
      if (source === i) {
        list[at] = held;
        break;
      }
      list[at] = list[source];
      at = source;
    }
  }
}

/** Replaces a scene display list's depth sort with the keyed one above. */
export function useFastDepthSort(scene: Phaser.Scene) {
  const children = scene.children as DisplayList & { fastDepthSort?: boolean };
  if (!children || children.fastDepthSort) return;
  children.fastDepthSort = true;
  children.depthSort = function (this: DisplayList) {
    if (!this.sortChildrenFlag) return;
    sortByDepth(this.list);
    this.sortChildrenFlag = false;
  };
}

type CameraManager = Phaser.Cameras.Scene2D.CameraManager & {
  getVisibleChildren(
    children: Phaser.GameObjects.GameObject[],
    camera: Phaser.Cameras.Scene2D.Camera,
  ): Phaser.GameObjects.GameObject[];
  fastVisibleChildren?: boolean;
};
/**
 * Replaces the camera manager's visible-children scan (`Array.filter` with a closure over
 * thousands of objects, every frame) with a plain loop. Same result, in the same order.
 */
export function useFastVisibleChildren(scene: Phaser.Scene) {
  const cameras = scene.cameras as CameraManager | undefined;
  if (!cameras || cameras.fastVisibleChildren) return;
  cameras.fastVisibleChildren = true;
  cameras.getVisibleChildren = function (children, camera) {
    const visible: Phaser.GameObjects.GameObject[] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.willRender(camera)) visible.push(child);
    }
    return visible;
  };
}
