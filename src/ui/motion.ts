import type { GameModel } from '../game/model';

/** Applies the effective reduced-motion value to CSS; canvas code reads `model.reducedMotion`. */
export function applyMotionPreference(model: GameModel) {
  const root = document.documentElement;
  root.classList.toggle('reduce-motion', model.reducedMotion);
  // Lets an explicit full-motion choice outrank the stylesheet's own system media query.
  root.classList.toggle('full-motion', !model.reducedMotion);
}

/** Follows the operating system's reduced-motion preference, including later changes. */
export function watchSystemMotion(model: GameModel) {
  const query =
    typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  model.systemReducedMotion = !!query?.matches;
  applyMotionPreference(model);
  query?.addEventListener('change', (event) => {
    model.systemReducedMotion = event.matches;
    applyMotionPreference(model);
    model.changed();
  });
}
