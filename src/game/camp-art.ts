/** Original camp renders. Ground centers are measured in the aligned 384px frames. */
export const CAMP_ART_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const safeLevel = (level: number) => Math.min(8, Math.max(1, Math.floor(level) || 1));
export const campTexture = (level: number) =>
  safeLevel(level) === 1 ? 'camp' : `camp-level-${safeLevel(level)}`;
export const campAsset = (level: number) =>
  `/assets/buildings/camp-levels-v1/level-${safeLevel(level)}.webp`;

// The compact fire pit sits within a 4×4 gathering area. A spit projects left
// of the pit, so centering the entire canvas would shift its ground footprint.
const GEOMETRY = [
  { width: 88, x: 192, y: 266 },
  { width: 112, x: 230, y: 270 },
  { width: 112, x: 227, y: 274 },
  { width: 112, x: 230, y: 270 },
  { width: 112, x: 230, y: 270 },
  { width: 124, x: 227, y: 284 },
  { width: 132, x: 192, y: 292 },
  { width: 132, x: 192, y: 294 },
] as const;
export const campArt = (level: number) => {
  const { width, x, y } = GEOMETRY[safeLevel(level) - 1];
  return { width, originX: x / 384, originY: y / 384 };
};
