/**
 * Render-path failure handling. Phaser schedules the next frame only after the current one
 * returns, so a throw while drawing (an unsupported level from an old save, a missing export)
 * freezes the game for good. Presentations skip the offending object and log once instead.
 */
const reported = new Set<string>();
export function warnOnce(key: string, message: string) {
  if (reported.has(key)) return;
  reported.add(key);
  console.warn(message);
}
/** Runs `draw`; on a throw, logs once under `key` and returns `fallback`. */
export function guardRender<T>(key: string, draw: () => T, fallback: T): T {
  try {
    return draw();
  } catch (error) {
    warnOnce(key, `Skipped drawing ${key}: ${error instanceof Error ? error.message : error}`);
    return fallback;
  }
}
