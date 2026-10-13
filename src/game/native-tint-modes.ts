/**
 * Tint modes the native renderers add to Phaser's tint shader (see quad-renderer.ts). Kept
 * Phaser-free so presentations can name them without loading the engine.
 */

/**
 * Multiply/add color transform of a native leaf: `clamp(texel * tint + tint2)` before
 * premultiplication. Mode 0 is Phaser's MULTIPLY, so callers that reset a mesh to MULTIPLY
 * (status tints) keep its source color.
 */
export const NATIVE_COLOR_TINT_MODE = 0;
/**
 * Additive drawing inside the normal (premultiplied source-over) blend state: the fragment keeps
 * its premultiplied color and reports zero alpha, so `ONE, ONE_MINUS_SRC_ALPHA` adds the color and
 * leaves the destination alpha alone. On the opaque backbuffer that is pixel for pixel the native
 * additive mode, without a blend-state change (Phaser finishes the batch on every change, twice).
 * Phaser 4.2.1 leaves tint mode 3 unused.
 */
export const NATIVE_ADDITIVE_TINT_MODE = 3;
