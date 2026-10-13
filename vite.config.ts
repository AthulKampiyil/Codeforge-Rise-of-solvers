import { defineConfig } from 'vite';
import { nativePages } from './scripts/vite-native-pages.mjs';

const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:8001';

type ModuleInfo = { isEntry: boolean; importers: readonly string[] } | null;

/**
 * Whether a module is part of the startup graph: reachable from the entry through
 * static imports alone. Modules only reached through import() (the developer panel,
 * the late campaign scene) must stay out of eagerly loaded manual chunks.
 */
function eagerlyImported(id: string, info: (id: string) => ModuleInfo) {
  const seen = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const current = queue.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    const module = info(current);
    if (!module) continue;
    if (module.isEntry) return true;
    queue.push(...module.importers);
  }
  return false;
}

/** Render-only scene graphs (poses, meshes, effect timelines) versus gameplay tables. */
const SCENE_GRAPH =
  /\/reference\/(?:.*\/(?:[\w-]*runtime|defender|castle|effect-art|defense-art|effects)\.json$|characters\/|garrison\/)/;

export default defineConfig({
  // Publish the curated CodeForge static bundle rather than the upstream game art tree.
  publicDir: 'cp-public',
  plugins: [nativePages()],
  build: {
    // scripts/build-sw.mjs reads the chunk graph to precache only what the entry imports
    // statically, then removes the manifest from dist.
    manifest: true,
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: (id: string, meta: { getModuleInfo: (id: string) => ModuleInfo }) => {
          if (id.includes('node_modules/phaser')) return 'phaser';
          if (id.includes('node_modules')) return 'vendor';
          // Developer tools are not given a manual chunk: main.ts imports the small
          // access check statically and the panel lazily, and a named `dev` chunk
          // would pull shared modules (and a modulepreload) into every player's boot.
          if (id.includes('src/dev/')) return undefined;
          if (id.includes('src/ui/')) return 'ui';
          // Startup JSON is split out of the application chunk so the multi-megabyte
          // tables download in parallel with the code and stay cached across code-only
          // deploys. JSON only needed by lazy chunks is left to them.
          if (/\/reference\/.*\.json$/.test(id) && eagerlyImported(id, meta.getModuleInfo))
            return SCENE_GRAPH.test(id) ? 'scene-graphs' : 'game-data';
          return undefined;
        },
      },
    },
  },
  server: {
    port: Number(process.env.VITE_PORT ?? 5174),
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws/events': {
        target: apiTarget.replace(/^http/, 'ws'),
        ws: true,
      },
    },
    // Generated reports and verification checkouts must not reload a live game.
    watch: { ignored: ['**/output/**', '**/art/source/native-client-*/files/**'] },
  },
});
