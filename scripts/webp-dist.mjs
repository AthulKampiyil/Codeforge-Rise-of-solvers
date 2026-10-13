/**
 * Production texture compression: writes a lossless WebP beside every PNG under dist/assets and
 * points the built code, packs and styles at it.
 *
 * The repository keeps PNG sources (asset scripts regenerate and byte-check them, and dev/specs
 * read them), so this runs on the build output only. The encoding is lossless with `exact`, so
 * every RGBA value, including colors under zero alpha, survives; the shipped PNGs carry no gamma
 * or color-profile chunks, so browsers decode both formats to the same pixels. Encodings are
 * cached by source hash.
 *
 * After the rewrite every built text file is audited for PNG names still in use. Only when none
 * remains (a URL assembled at runtime from a bare `name.png` would be one) are the PNG copies of
 * converted textures removed from dist, roughly halving what is deployed and hashed; otherwise
 * every PNG stays and the unresolved names are listed. The repository keeps its PNG sources.
 *
 *   node scripts/webp-dist.mjs            # after `vite build`, before scripts/build-sw.mjs
 *   KEEP_PNG=1 node scripts/webp-dist.mjs # keep the PNG copies regardless
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { cpus } from 'node:os';
import sharp from 'sharp';

const dist = path.resolve('dist');
const assets = path.join(dist, 'assets');
const cache = path.resolve('node_modules/.cache/webp-dist');
const SETTINGS = { lossless: true, exact: true, effort: 4 };
const settingsKey = JSON.stringify(SETTINGS);

async function walk(dir, out = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = await walk(dist);
const pngs = files.filter((f) => f.startsWith(assets + path.sep) && f.endsWith('.png'));
await fs.mkdir(cache, { recursive: true });

let pngBytes = 0,
  webpBytes = 0,
  encoded = 0;
const queue = [...pngs];
async function worker() {
  for (let file = queue.pop(); file; file = queue.pop()) {
    const source = await fs.readFile(file);
    const hash = createHash('sha1').update(settingsKey).update(source).digest('hex');
    const cached = path.join(cache, hash + '.webp');
    let webp;
    try {
      webp = await fs.readFile(cached);
    } catch {
      webp = await sharp(source).webp(SETTINGS).toBuffer();
      await fs.writeFile(cached, webp);
      encoded++;
    }
    await fs.writeFile(file.slice(0, -4) + '.webp', webp);
    pngBytes += source.length;
    webpBytes += webp.length;
  }
}
await Promise.all(Array.from({ length: Math.max(1, cpus().length) }, worker));

// Every PNG under assets/ now has a WebP beside it, so any path to one can switch, including
// template literals whose tail is `.png` (`.../level-${level}.png`).
const REFERENCE = /(\/?assets\/[^"'`\s()<>\\]*?)\.png(?=["'`)\s\\])/g;
// A whole template literal under assets/ whose expressions call functions or hold nested
// template literals (`/assets/.../troop-${name.replace(/x/g, `-`)}.png`).
const TEMPLATE = /(`\/?assets\/(?:[^`$]|\$\{(?:[^{}]|\{[^{}]*\})*\})*?)\.png`/g;
// A JSON file under assets/ can name a texture relative to its own directory (hero atlases list
// `"image": "idle.png"`, joined to their directory at runtime): switch those whose sibling WebP
// exists.
const SIBLING = /"([^"/\\]+)\.png"/g;
const converted = new Set(pngs);
let rewritten = 0;
for (const file of files) {
  if (!/\.(js|json|css|html)$/.test(file)) continue;
  const text = await fs.readFile(file, 'utf8');
  let next = text.replace(REFERENCE, '$1.webp').replace(TEMPLATE, '$1.webp`');
  if (file.endsWith('.json') && file.startsWith(assets + path.sep))
    next = next.replace(SIBLING, (match, name) =>
      converted.has(path.join(path.dirname(file), name + '.png')) ? `"${name}.webp"` : match,
    );
  if (next !== text) {
    await fs.writeFile(file, next);
    rewritten++;
  }
}

// Reference audit: any string still naming a PNG. Phaser's own format table (a bare ".png"
// extension) names no file and is ignored.
const PNG_NAME = /[\w@%$./{}-]+\.png(?![\w])/g;
// PNGs outside assets/ (the home-screen icons) are never converted and always ship, so naming
// one by its root path cannot point at a removed copy.
const shipped = new Set(
  files
    .filter((f) => f.endsWith('.png') && !f.startsWith(assets + path.sep))
    .map((f) => '/' + path.relative(dist, f).split(path.sep).join('/')),
);
const unresolved = new Map();
for (const file of files) {
  if (!/\.(js|json|css|html)$/.test(file)) continue;
  const text = await fs.readFile(file, 'utf8');
  for (const [name] of text.matchAll(PNG_NAME)) {
    if (name === '.png' || shipped.has(name)) continue;
    if (!unresolved.has(name)) unresolved.set(name, path.relative(dist, file));
  }
}
let removed = 0,
  removedBytes = 0;
if (process.env.KEEP_PNG) console.log('KEEP_PNG is set: PNG copies stay in dist.');
else if (unresolved.size) {
  console.warn(
    `PNG copies kept: ${unresolved.size} PNG name(s) still referenced, e.g. ` +
      [...unresolved]
        .slice(0, 5)
        .map(([name, file]) => `${name} (${file})`)
        .join(', '),
  );
} else
  for (const file of pngs) {
    removedBytes += (await fs.stat(file)).size;
    await fs.rm(file);
    removed++;
  }

console.log(
  `WebP textures: ${pngs.length} files, ${(pngBytes / 1e6).toFixed(1)} MB PNG -> ` +
    `${(webpBytes / 1e6).toFixed(1)} MB WebP (${encoded} encoded, ${pngs.length - encoded} cached); ` +
    `${rewritten} files point at WebP; ${removed} PNG copies removed (${(removedBytes / 1e6).toFixed(1)} MB)`,
);
