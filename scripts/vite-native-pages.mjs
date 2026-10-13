/**
 * Serves and builds level-paged native packs (see native-pages.mjs).
 *
 * Development: a `graph.json` requested under `/assets/village-native/` or
 * `/assets/troops-native/` is answered with the paged pack, and `/assets/native-pages/<key>/…`
 * with its pages, from a disk cache keyed by the pack and its textures, so the dev server and
 * every browser spec draw what production draws.
 *
 * Build: rewrites each pack in dist and writes its pages under dist/assets/native-pages, before
 * scripts/webp-dist.mjs compresses them. Packs paging would not help are left as they are.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { pageNativeGraph, pageNativePack } from './native-pages.mjs';

const PACK = /^\/assets\/(?:village-native|troops-native)\/.+\/graph\.json$/;
/** An export's level from its name (`basic_turret_lvl7`, `tower_turret_lvl10_down`). */
const levelInName = (name) => {
  const match = /_lvl(\d+)(?:_|$)/.exec(name);
  return match ? Number(match[1]) : undefined;
};
/**
 * The Archer Tower levels whose rooftop Archer draws each export: a tower level names its
 * defender character (native.json), whose idle and attack rows name the exports
 * (`archer2_idle1`, drawn as `archer2_idle1_1` to `_3` by facing).
 */
function residentLevels(root) {
  const definitions = JSON.parse(
    readFileSync(path.join(root, 'reference/archer-tower/native.json'), 'utf8'),
  );
  const animations = JSON.parse(
    readFileSync(path.join(root, 'reference/archer-tower/defenders-source.json'), 'utf8'),
  ).animations;
  const levels = new Map();
  definitions.levels.forEach((row, index) => {
    for (const animation of animations[row.DefenderCharacter].rows)
      for (const facing of [1, 2, 3]) {
        const name = `${animation.ExportName}_${facing}`;
        levels.set(name, [...(levels.get(name) ?? []), index + 1]);
      }
  });
  return (name) => levels.get(name);
}
/** Graphs bundled into the code, paged as they are imported, with each export's levels. */
const BUNDLED = {
  'reference/cannon/runtime.json': () => levelInName,
  'reference/archer-tower/buildings-runtime.json': () => levelInName,
  'reference/archer-tower/defenders-runtime.json': residentLevels,
};
const PAGES = '/assets/native-pages/';

/** Reads source textures as RGBA bytes, once per path, from `dir`. */
function imageReader(dir) {
  const cache = new Map();
  return (file) => {
    let pending = cache.get(file);
    if (!pending) {
      pending = sharp(path.join(dir, file))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ data, info }) => ({ data, width: info.width, height: info.height }));
      cache.set(file, pending);
    }
    return pending;
  };
}

/** Pages one pack: { json, pages: [{ path, png }] }, or null when paging is not worth it. */
async function page(dir, packFile, key) {
  const pack = JSON.parse(await fs.readFile(path.join(dir, packFile), 'utf8'));
  const result = await pageNativePack(pack, imageReader(dir), `assets/native-pages/${key}`);
  if (!result) return null;
  const pages = [];
  for (const p of result.pages)
    pages.push({
      path: p.path,
      png: await sharp(p.pixels, { raw: { width: p.width, height: p.height, channels: 4 } })
        .png({ compressionLevel: 6 })
        .toBuffer(),
    });
  return { json: JSON.stringify(result.pack), pages };
}

/** Cache key: the pack's bytes and the size and time of each texture it draws. */
async function packKey(dir, packFile, contents) {
  const text = contents ?? (await fs.readFile(path.join(dir, packFile)));
  const hash = createHash('sha256').update(text);
  const pack = JSON.parse(text.toString('utf8'));
  const files = new Set();
  for (const graph of pack.scenes ? Object.values(pack.scenes) : [pack])
    for (const t of Object.values(graph.textures)) files.add(t.path);
  for (const file of [...files].sort()) {
    const stat = await fs.stat(path.join(dir, file));
    hash.update(`${file}:${stat.size}:${stat.mtimeMs}`);
  }
  return hash.digest('hex').slice(0, 16);
}

export function nativePages() {
  let root = process.cwd();
  let publicDir = path.join(root, 'public');
  let outDir = path.join(root, 'dist');
  let serving = false;
  const encode = (p) =>
    sharp(p.pixels, { raw: { width: p.width, height: p.height, channels: 4 } })
      .png({ compressionLevel: 6 })
      .toBuffer();
  return {
    name: 'native-pages',
    enforce: 'pre',
    configResolved(config) {
      serving = config.command === 'serve';
      root = config.root;
      publicDir = config.publicDir || path.join(root, 'public');
      outDir = path.resolve(root, config.build.outDir);
    },
    async transform(code, id) {
      const file = path.relative(root, id.split('?')[0]).split(path.sep).join('/');
      const levelOf = BUNDLED[file]?.(root);
      if (!levelOf || process.env.NATIVE_PAGES === '0') return;
      const key = await packKey(publicDir, file, code);
      const result = await pageNativeGraph(
        JSON.parse(code),
        levelOf,
        imageReader(publicDir),
        `assets/native-pages/${key}`,
      );
      if (!result) return;
      for (const p of result.pages) {
        if (serving) {
          const target = path.join(
            root,
            'node_modules/.cache/native-pages',
            p.path.slice('assets/native-pages/'.length),
          );
          if (await fs.stat(target).catch(() => null)) continue;
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, await encode(p));
        } else this.emitFile({ type: 'asset', fileName: p.path, source: await encode(p) });
      }
      return { code: JSON.stringify(result.graph), map: null };
    },
    configureServer(server) {
      const cacheDir = path.join(root, 'node_modules/.cache/native-pages');
      const pending = new Map();
      /** Paged JSON for a pack path, generating its cache entry on first use; null if unpaged. */
      const paged = (url) => {
        const file = url.slice(1);
        const run = async () => {
          const key = await packKey(publicDir, file);
          const dir = path.join(cacheDir, key);
          const done = path.join(dir, 'pack.json');
          const none = path.join(dir, 'unpaged');
          try {
            return await fs.readFile(done, 'utf8');
          } catch {
            if (await fs.stat(none).catch(() => null)) return null;
          }
          const result = await page(publicDir, file, key);
          await fs.mkdir(dir, { recursive: true });
          if (!result) {
            await fs.writeFile(none, '');
            return null;
          }
          for (const p of result.pages)
            await fs.writeFile(path.join(cacheDir, p.path.slice(PAGES.length - 1)), p.png);
          await fs.writeFile(done, result.json);
          return result.json;
        };
        // A changed pack gets a new key; concurrent requests for one share a single run.
        let job = pending.get(url);
        if (!job) {
          job = run().finally(() => pending.delete(url));
          pending.set(url, job);
        }
        return job;
      };
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        try {
          if (PACK.test(url)) {
            const json = await paged(url);
            if (json === null) return next();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            return res.end(json);
          }
          if (url.startsWith(PAGES)) {
            const bytes = await fs.readFile(path.join(cacheDir, url.slice(PAGES.length)));
            res.setHeader('Content-Type', 'image/png');
            return res.end(bytes);
          }
        } catch (error) {
          server.config.logger.error(`native-pages: ${url}: ${error}`);
        }
        next();
      });
    },
    async closeBundle() {
      if (process.env.NATIVE_PAGES === '0') return;
      const packs = [];
      const walk = async (dir) => {
        for (const entry of await fs
          .readdir(path.join(outDir, dir), { withFileTypes: true })
          .catch(() => [])) {
          const rel = `${dir}/${entry.name}`;
          if (entry.isDirectory()) await walk(rel);
          else if (entry.name === 'graph.json') packs.push(rel);
        }
      };
      await walk('assets/village-native');
      await walk('assets/troops-native');
      let paged = 0,
        pages = 0;
      for (const file of packs) {
        const key = await packKey(outDir, file);
        const result = await page(outDir, file, key);
        if (!result) continue;
        for (const p of result.pages) {
          const target = path.join(outDir, p.path);
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, p.png);
          pages++;
        }
        await fs.writeFile(path.join(outDir, file), result.json);
        paged++;
      }
      console.log(`Native pages: ${paged} of ${packs.length} packs paged into ${pages} pages`);
    },
  };
}
