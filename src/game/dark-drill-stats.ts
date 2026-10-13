import catalog from '../../reference/dark-drill/catalog.json' with { type: 'json' };

export const MAX_DARK_DRILL_LEVEL = Math.max(...catalog.levels.map((row) => row.level));

/** Original base levels; mini-level bonuses remain separate and uninterpreted. */
export function darkDrillStats(level: number) {
  const row = catalog.levels.find((row) => row.level === level);
  if (!row) throw new Error(`Unsupported Dark Elixir Drill level: ${level}`);
  return row;
}
