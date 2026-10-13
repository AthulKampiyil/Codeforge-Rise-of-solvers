/** Presentation offsets in world pixels; no combat or renderer state is changed. */
export function defeatPose(
  age: number,
  mode: 'ground' | 'air' | 'spring',
  facing: number,
  reduced: boolean,
  airLift = 46,
) {
  const duration = mode === 'spring' ? 0.65 : mode === 'air' ? 0.55 : 0.4;
  const t = reduced ? 1 : Math.max(0, Math.min(1, age / duration));
  const side = facing < 0 ? -1 : 1;
  return {
    visible: t < 1,
    alpha: mode === 'ground' ? 1 - t : 1 - t * t,
    x: mode === 'spring' ? side * 70 * t : 0,
    y: mode === 'spring' ? -180 * (1 - (1 - t) ** 2) : mode === 'air' ? airLift * t * t : 0,
    angle: side * (mode === 'spring' ? 360 : mode === 'air' ? 22 : 70) * t,
  };
}
