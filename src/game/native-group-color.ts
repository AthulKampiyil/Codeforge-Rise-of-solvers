import Phaser from 'phaser';

const NAME = 'NativeGroupColor';
/** Idle filter framebuffers older than this are destroyed by pruneFilterPool. */
const IDLE_FILTER_MS = 4000;
type PooledContext = Phaser.Renderer.WebGL.DrawingContext & { lastUsed: number };
/**
 * Filter passes take exact-size drawing contexts from Phaser's shared pool, which keeps up to
 * 1024 idle framebuffers and only drops them past that cap (its own prune() and setMaxPoolSize
 * do not help: lowering the cap reaches a Phaser 4.2.1 bug in DrawingContextPool.get that reads
 * the wrong size bucket). Destroy contexts that have sat idle for a while instead.
 */
export function pruneFilterPool(renderer: Phaser.Renderer.WebGL.WebGLRenderer) {
  const pool = renderer.drawingContextPool as unknown as {
    agePool: PooledContext[];
    sizePool: Record<string, PooledContext[]>;
  };
  if (!pool?.agePool.length) return;
  const before = Date.now() - IDLE_FILTER_MS;
  // agePool is ordered by release time: stale contexts form its head.
  let stale = 0;
  while (stale < pool.agePool.length && pool.agePool[stale].lastUsed < before) stale++;
  if (!stale) return;
  for (const context of pool.agePool.splice(0, stale)) {
    const bucket = pool.sizePool[context.width + 'x' + context.height];
    const at = bucket ? bucket.indexOf(context) : -1;
    if (at >= 0) bucket.splice(at, 1);
    context.destroy();
  }
}
/**
 * Phaser 4.2.1 hands out a pooled drawing context in this order: an exact-size spare, then the
 * oldest spare *resized*, then a fresh context (while under the 1024 cap). Resizing recreates the
 * framebuffer, and a framebuffer with the config's stencil renderbuffer runs
 * `gl.checkFramebufferStatus` — a full pipeline sync that cost whole 30-50 ms frames once a
 * battle showed effects at many different sizes. The aged-spare branch fires as soon as the
 * oldest spare is older than `maxAge` (1 s by default), so in a busy battle nearly every filter
 * pass took it. Never aging a spare sends every miss to the fresh-context branch instead: each
 * distinct size is created once and then hits its exact-size bucket, and `pruneFilterPool` still
 * destroys the ones that fall idle, so the pool stays bounded and far below the cap.
 */
export function holdFilterContexts(renderer: Phaser.Renderer.WebGL.WebGLRenderer) {
  const pool = renderer.drawingContextPool as unknown as { maxAge: number } | undefined;
  if (pool) pool.maxAge = Infinity;
}
const registered = new WeakSet<Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager>();
const SOURCE = `
#pragma phaserTemplate(shaderName)
precision highp float;
uniform sampler2D uMainSampler;
uniform vec3 uMultiply;
uniform vec3 uAdd;
varying vec2 outTexCoord;
void main () {
  vec4 pixel = texture2D(uMainSampler, outTexCoord);
  if (pixel.a <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 color = clamp(pixel.rgb / pixel.a * uMultiply + uAdd, 0.0, 1.0);
  gl_FragColor = vec4(color * pixel.a, pixel.a);
}`;

class NativeGroupColorNode extends Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader {
  constructor(manager: Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager) {
    super(NAME, manager, undefined, SOURCE);
  }
  setupUniforms(controller: NativeGroupColor) {
    this.programManager.setUniform('uMultiply', controller.multiply);
    this.programManager.setUniform('uAdd', controller.add);
  }
}

/** Color changes happen after children compose, with clamping before premultiplication. */
export class NativeGroupColor extends Phaser.Filters.Controller {
  multiply = [1, 1, 1];
  add = [0, 0, 0];
  constructor(image: Phaser.GameObjects.RenderTexture) {
    const renderer = image.scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    if (!registered.has(renderer.renderNodes)) {
      renderer.renderNodes.addNodeConstructor(NAME, NativeGroupColorNode);
      registered.add(renderer.renderNodes);
    }
    image.enableFilters();
    super(image.filterCamera!, NAME);
    image.filters!.internal.add(this);
  }
  setColor(multiply: readonly number[], add: readonly number[]) {
    for (let i = 0; i < 3; i++) {
      this.multiply[i] = multiply[i];
      this.add[i] = add[i];
    }
  }
}
