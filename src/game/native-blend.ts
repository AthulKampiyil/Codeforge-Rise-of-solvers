import Phaser from 'phaser';
import type { NativeBlend } from './native-mesh';

const modes = new WeakMap<Phaser.Renderer.WebGL.WebGLRenderer, Map<NativeBlend, number>>();

/** Premultiplied RGB with source-over alpha, including transparent intermediate buffers. */
export function nativeBlendMode(renderer: Phaser.Renderer.WebGL.WebGLRenderer, blend: NativeBlend) {
  if (blend === 3) throw Error('Native multiply requires two ordered passes');
  if (blend === 0) return Phaser.BlendModes.NORMAL;
  let rendererModes = modes.get(renderer);
  if (!rendererModes) modes.set(renderer, (rendererModes = new Map()));
  let mode = rendererModes.get(blend);
  if (mode === undefined) {
    const gl = renderer.gl;
    const destination = blend === 4 ? gl.ONE_MINUS_SRC_COLOR : gl.ONE;
    // Phaser 4.2.1 returns the preceding slot and initially sets combined factors.
    mode = renderer.blendModes.length;
    renderer.addBlendMode([gl.ONE, destination], gl.FUNC_ADD);
    renderer.updateBlendMode(
      mode,
      [gl.ONE, destination, gl.ONE, gl.ONE_MINUS_SRC_ALPHA],
      gl.FUNC_ADD,
    );
    rendererModes.set(blend, mode);
  }
  return mode;
}

const multiplyModes = new WeakMap<Phaser.Renderer.WebGL.WebGLRenderer, [number, number]>();
/** Two consecutive passes implement premultiplied Multiply with source-over alpha.
 * Pass one preserves destination alpha so pass two can add Cs * (1 - Ad).
 */
export function nativeMultiplyModes(renderer: Phaser.Renderer.WebGL.WebGLRenderer) {
  let result = multiplyModes.get(renderer);
  if (result) return result;
  const gl = renderer.gl;
  const register = (factors: number[]) => {
    const mode = renderer.blendModes.length;
    renderer.addBlendMode(factors.slice(0, 2), gl.FUNC_ADD);
    renderer.updateBlendMode(mode, factors, gl.FUNC_ADD);
    return mode;
  };
  result = [
    register([gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE]),
    register([gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA]),
  ];
  multiplyModes.set(renderer, result);
  return result;
}
