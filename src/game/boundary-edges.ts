/**
 * Joins unit tile edges ([x0, y0, x1, y1], each one tile long and axis aligned) that continue
 * each other into longer segments, so an outline records a few hundred lines, not thousands.
 */
export function mergeEdges(edges: readonly number[][]) {
  const horizontal = new Map<number, number[]>(),
    vertical = new Map<number, number[]>();
  for (const [x0, y0, x1, y1] of edges) {
    if (y0 === y1) {
      const row = horizontal.get(y0) ?? [];
      row.push(Math.min(x0, x1));
      horizontal.set(y0, row);
    } else {
      const column = vertical.get(x0) ?? [];
      column.push(Math.min(y0, y1));
      vertical.set(x0, column);
    }
  }
  const merged: number[][] = [];
  const runs = (starts: number[], emit: (from: number, to: number) => void) => {
    starts.sort((a, b) => a - b);
    let from = starts[0],
      to = from + 1;
    for (let i = 1; i < starts.length; i++) {
      // Duplicated edges (two blocked sides meeting) stay one line.
      if (starts[i] <= to) to = Math.max(to, starts[i] + 1);
      else {
        emit(from, to);
        from = starts[i];
        to = from + 1;
      }
    }
    emit(from, to);
  };
  for (const [y, starts] of horizontal) runs(starts, (a, b) => merged.push([a, y, b, y]));
  for (const [x, starts] of vertical) runs(starts, (a, b) => merged.push([x, a, x, b]));
  return merged;
}
