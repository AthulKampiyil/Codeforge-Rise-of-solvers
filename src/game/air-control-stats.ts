import source from '../../reference/air-sweeper/combat.json' with { type: 'json' };

/** Supercell client 18.400.21 tables; interpretation notes in docs/AIR-CONTROL.md. */
export const SWEEPER_LEVELS = source.levels.map((row, i) => ({
  level: i + 1,
  hp: Number(row.Hitpoints),
  cost: Number(row.BuildCost),
  seconds: (Number(row.BuildTimeD) * 24 + Number(row.BuildTimeH)) * 3600,
  push: Number(row.ShockwavePushStrength) / 100,
  townhall: Number(row.TownHallLevel),
  export: row.ExportName,
  upgrade: row.ExportNameUpgradeAnim,
  ruin: row.ExportNameDamaged,
}));

export const SWEEPER = {
  range: 15,
  minRange: 1,
  rate: 5,
  prepare: 0.6,
  speed: 6,
  offset: 1.25,
  cone: (105 * Math.PI) / 180,
  waveCone: Math.PI / 3,
  halfWidth: 2.5,
  // The client table does not define the displacement easing duration.
  pushSeconds: 0.6,
} as const;

export { SEEKING_MINE } from './seeking-mine-stats';

export const validDirection = (v: unknown) =>
  v === undefined || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 8);

/** Zero points along +x (screen lower-right); each step turns clockwise on the map. */
export const sweeperAngle = (direction = 0) => (direction * Math.PI) / 4;
export const sweeperStats = (level: number) => {
  const row = Number.isInteger(level) && SWEEPER_LEVELS[level - 1];
  if (!row) throw Error(`Unsupported native Air Sweeper level: ${level}`);
  return row;
};
