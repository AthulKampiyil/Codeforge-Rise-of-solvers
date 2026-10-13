import source from '../../reference/archer-tower/portraits.json' with { type: 'json' };

/** UI composition uses the same explicit local rooftop placement as the village. */
export function archerTowerPortrait(level: number) {
  const portrait = source.portraits.find((row) => row.level === level);
  if (!portrait) throw new Error(`Unsupported Archer Tower portrait: ${level}`);
  return '/' + portrait.path;
}
