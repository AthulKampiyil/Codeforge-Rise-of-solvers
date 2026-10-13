/**
 * Level pages for native family packs (village buildings and troops).
 *
 * A family pack draws every level of a building or troop from shared atlases, so the village
 * downloads, decodes and uploads every level's art to draw one: a Level 2 Town Hall loads the
 * whole 3002×3066 Town Hall atlas, about 37 MB of GPU memory, to sample 4% of it. This transform
 * regroups each pack's shapes by the set of levels that draw them and packs each group into its
 * own pages. Every page records those levels, so a loader fetches only the pages of the levels it
 * draws; a page every level draws carries no tag. Nothing is stored twice: each shape lives on
 * exactly one page.
 *
 * Exactness: each shape's source rectangle is copied with a two-texel border of its original
 * neighbors, so bilinear filtering (the atlases have no mipmaps) reads exactly the texels it read
 * before. Overlapping rectangles of a group merge first, and a side on the atlas edge repeats its
 * edge texels as the atlas's clamp-to-edge sampling did. Texture coordinates move by whole
 * texels. Positions, clips, matrices and colors are unchanged.
 *
 * Shapes no level row reaches keep drawing: they join a page every level loads.
 */
const PAD = 2;
const MAX_PAGE = 4096;
/**
 * A pack is paged only when its average level needs at most this share of the family's texels
 * and no level needs more than the family atlases held (overlapping source regions drawn at
 * different levels are copied once per group, so heavy sharing can cost more than it saves).
 */
export const PAGE_WORTH = 0.6;

/** (scene, export) pairs a level row draws: building fields or troop states. */
function rowExports(row) {
  if (row.refs) return Object.values(row.refs).map((r) => [r.scene, r.export]);
  if (row.states)
    return Object.values(row.states).flatMap((s) => s.exports.map((e) => [s.scene, e]));
  return [];
}
/** Shape ids an export reaches. */
function reach(graph, exportName, shapes) {
  const seen = new Set();
  const stack = [graph.exports[exportName]];
  while (stack.length) {
    const id = String(stack.pop());
    if (seen.has(id)) continue;
    seen.add(id);
    if (graph.shapes[id]) shapes.add(id);
    const clip = graph.clips[id];
    if (clip) stack.push(...clip.children);
  }
}
/** Texel rectangle a shape entry samples, with its border, clamped to the atlas. */
function rectOf(vertices, texture) {
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
  return {
    x0: Math.max(0, Math.floor(u0 * texture.width) - PAD),
    y0: Math.max(0, Math.floor(v0 * texture.height) - PAD),
    x1: Math.min(texture.width, Math.ceil(u1 * texture.width) + PAD),
    y1: Math.min(texture.height, Math.ceil(v1 * texture.height) + PAD),
  };
}
const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
/** Merge intersecting rectangles until none intersect. */
function merge(rects) {
  const out = [];
  for (const rect of rects) {
    let r = { ...rect };
    for (let i = 0; i < out.length;) {
      if (overlaps(r, out[i])) {
        const o = out.splice(i, 1)[0];
        r = {
          x0: Math.min(r.x0, o.x0),
          y0: Math.min(r.y0, o.y0),
          x1: Math.max(r.x1, o.x1),
          y1: Math.max(r.y1, o.y1),
        };
        i = 0;
      } else i++;
    }
    out.push(r);
  }
  return out;
}
/** Shelf packing, tallest first, into pages no larger than MAX_PAGE on a side. */
function pack(rects) {
  const items = rects
    .map((r) => {
      // A side on the atlas edge gets a border of repeated edge texels, standing in for the
      // clamp-to-edge sampling the atlas had there.
      const ox = r.x0 === 0 ? PAD : 0,
        oy = r.y0 === 0 ? PAD : 0;
      const w = r.x1 - r.x0 + ox + (r.x1 === r.W ? PAD : 0),
        h = r.y1 - r.y0 + oy + (r.y1 === r.H ? PAD : 0);
      return { ...r, ox, oy, w, h };
    })
    .sort(
      (a, b) =>
        b.h - a.h || b.w - a.w || a.texture.localeCompare(b.texture) || a.y0 - b.y0 || a.x0 - b.x0,
    );
  const area = items.reduce((n, r) => n + r.w * r.h, 0);
  const width = Math.min(
    MAX_PAGE,
    Math.max(...items.map((r) => r.w), Math.ceil(Math.sqrt(area) * 1.15)),
  );
  const pages = [];
  let page = null,
    x = 0,
    y = 0,
    shelf = 0;
  for (const item of items) {
    if (!page || x + item.w > width) {
      y += shelf;
      x = 0;
      shelf = 0;
    }
    if (!page || y + item.h > MAX_PAGE) {
      page = { width: 0, height: 0, items: [] };
      pages.push(page);
      x = y = shelf = 0;
    }
    item.dx = x;
    item.dy = y;
    item.page = page;
    page.items.push(item);
    page.width = Math.max(page.width, x + item.w);
    page.height = Math.max(page.height, y + item.h);
    x += item.w;
    shelf = Math.max(shelf, item.h);
  }
  return pages;
}
const clamp = (v, size) => Math.min(size - 1, Math.max(0, v));

/**
 * Pages a family pack by level. `readImage(path)` resolves to the RGBA bytes of a texture
 * (`{ data, width, height }`); `prefix` is the published directory the pages go under. Returns
 * null when paging would not save enough to be worth it.
 */
export async function pageNativePack(source, readImage, prefix) {
  const levels = [...new Set(source.levels.map((row) => row.level))].sort((a, b) => a - b);
  if (levels.length < 2) return null;
  const out = { ...source, scenes: {} };
  const pages = [];
  const need = new Map(levels.map((l) => [l, 0]));
  let total = 0;
  for (const [name, graph] of Object.entries(source.scenes).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    for (const t of Object.values(graph.textures)) total += t.width * t.height;
    // Levels drawing each shape.
    const users = new Map();
    for (const row of source.levels)
      for (const [scene, exportName] of rowExports(row)) {
        if (scene !== name || graph.exports[exportName] === undefined) continue;
        const shapes = new Set();
        reach(graph, exportName, shapes);
        for (const id of shapes) {
          if (!users.has(id)) users.set(id, new Set());
          users.get(id).add(row.level);
        }
      }
    const groups = new Map();
    for (const id of Object.keys(graph.shapes).sort((a, b) => Number(a) - Number(b))) {
      const signature = (users.has(id) ? [...users.get(id)] : levels).sort((a, b) => a - b);
      const key = signature.join(',');
      if (!groups.has(key)) groups.set(key, { levels: signature, shapes: [] });
      groups.get(key).shapes.push(id);
    }
    const textures = {};
    const shapes = {};
    const sourceTexture = (id) => graph.textures[String(id)];
    for (const group of [...groups.values()].sort((a, b) =>
      a.levels.join(',').localeCompare(b.levels.join(',')),
    )) {
      const bySource = new Map();
      for (const id of group.shapes)
        for (const [texture, vertices] of graph.shapes[id]) {
          const key = String(texture);
          if (!bySource.has(key)) bySource.set(key, []);
          bySource.get(key).push(rectOf(vertices, sourceTexture(texture)));
        }
      const rects = [];
      for (const [texture, list] of [...bySource].sort(([a], [b]) => Number(a) - Number(b))) {
        const t = sourceTexture(texture);
        for (const rect of merge(list)) rects.push({ ...rect, texture, W: t.width, H: t.height });
      }
      if (!rects.length) continue;
      const placed = pack(rects);
      for (const page of placed) {
        const id = Object.keys(textures).length;
        const file = `${prefix}/${name}-${id}.png`;
        const pixels = Buffer.alloc(page.width * page.height * 4);
        for (const item of page.items) {
          const src = await readImage(sourceTexture(item.texture).path);
          for (let y = 0; y < item.h; y++) {
            const sy = clamp(item.y0 - item.oy + y, src.height);
            for (let x = 0; x < item.w;) {
              const sx = item.x0 - item.ox + x;
              const to = ((item.dy + y) * page.width + item.dx + x) * 4;
              if (sx < 0 || sx >= src.width) {
                const from = (sy * src.width + clamp(sx, src.width)) * 4;
                src.data.copy(pixels, to, from, from + 4);
                x++;
              } else {
                const run = Math.min(item.w - x, src.width - sx);
                const from = (sy * src.width + sx) * 4;
                src.data.copy(pixels, to, from, from + run * 4);
                x += run;
              }
            }
          }
          item.pageId = id;
        }
        // A page every level draws carries no tag: loaders fetch untagged pages for any level.
        textures[id] = {
          path: file,
          width: page.width,
          height: page.height,
          ...(group.levels.length < levels.length ? { levels: group.levels } : {}),
        };
        pages.push({ path: file, width: page.width, height: page.height, pixels });
        for (const level of group.levels)
          need.set(level, need.get(level) + page.width * page.height);
      }
      const items = placed.flatMap((p) => p.items);
      for (const id of group.shapes)
        shapes[id] = graph.shapes[id].map(([texture, vertices]) => {
          const key = String(texture);
          const src = sourceTexture(texture);
          const r = rectOf(vertices, src);
          const item = items.find(
            (p) =>
              p.texture === key && p.x0 <= r.x0 && p.y0 <= r.y0 && p.x1 >= r.x1 && p.y1 >= r.y1,
          );
          const page = textures[item.pageId];
          const moved = vertices.slice();
          for (let i = 0; i < moved.length; i += 4) {
            moved[i + 2] = (moved[i + 2] * src.width - item.x0 + item.ox + item.dx) / page.width;
            moved[i + 3] = (moved[i + 3] * src.height - item.y0 + item.oy + item.dy) / page.height;
          }
          return [item.pageId, moved];
        });
    }
    out.scenes[name] = { ...graph, shapes, textures };
  }
  const mean = [...need.values()].reduce((a, b) => a + b, 0) / need.size;
  const max = Math.max(...need.values());
  if (mean > total * PAGE_WORTH || max > total) return null;
  return { pack: out, pages, stats: { total, mean, max } };
}

/**
 * Pages a single bundled graph by the levels that draw each export: `levelOf` returns an
 * export's level (`basic_turret_lvl7`), a list of levels (the rooftop Archer variant several
 * Archer Tower levels share), or undefined for exports every level shares (ammunition, debris,
 * upgrade animations), whose shapes land on pages every level loads.
 */
export async function pageNativeGraph(graph, levelOf, readImage, prefix) {
  const byLevel = new Map();
  for (const name of Object.keys(graph.exports)) {
    // An export drawn at one level, at several (a list), or at every level (undefined).
    const levels = levelOf(name);
    for (const level of levels === undefined ? [] : [levels].flat()) {
      if (!byLevel.has(level)) byLevel.set(level, {});
      byLevel.get(level)[name] = { scene: 'graph', export: name };
    }
  }
  const levels = [...byLevel].sort(([a], [b]) => a - b).map(([level, refs]) => ({ level, refs }));
  const result = await pageNativePack({ levels, scenes: { graph } }, readImage, prefix);
  return result && { graph: result.pack.scenes.graph, pages: result.pages, stats: result.stats };
}
