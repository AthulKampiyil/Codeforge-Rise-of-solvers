import source from '../../reference/full-client/combat.json' with { type: 'json' };

/**
 * Pinned client 18.400.21 Home Village combat tables (scripts/import-native-combat.py).
 * Each record lists level rows; later rows carry only changed columns and inherit the rest.
 * Absent numeric columns read as zero and absent flags as false, exactly like the client.
 */
export type NativeTable =
  | 'characters'
  | 'heroes'
  | 'pets'
  | 'items'
  | 'spells'
  | 'abilities'
  | 'buildings'
  | 'traps'
  | 'weapons'
  | 'projectiles'
  | 'guardians'
  | 'upgrades';
export type NativeRow = Readonly<Record<string, string>>;
interface CombatTables {
  clientVersion: string;
  roster: Record<
    'troops' | 'super' | 'siege' | 'heroes' | 'pets' | 'spells' | 'buildings' | 'traps',
    string[]
  >;
  townhall: Record<string, string>[];
  globals: Record<string, Record<string, string>[]>;
  superLicences: Record<string, Record<string, string>[]>;
  superchargeRows: Record<string, Record<string, string>[]>;
}
const combat = source as unknown as CombatTables &
  Record<NativeTable, Record<string, Record<string, string>[]>>;
export const NATIVE_CLIENT_VERSION = combat.clientVersion;
export const NATIVE_ROSTER = combat.roster;

const cache = new Map<string, readonly NativeRow[]>();
export const hasNative = (table: NativeTable, name: string) => Object.hasOwn(combat[table], name);
export function nativeLevels(table: NativeTable, name: string): readonly NativeRow[] {
  const key = `${table}/${name}`;
  let rows = cache.get(key);
  if (!rows) {
    const declared = combat[table][name];
    if (!declared) throw Error(`Missing native ${table} record: ${name}`);
    let inherited: Record<string, string> = {};
    rows = Object.freeze(
      declared.map((row) => Object.freeze((inherited = { ...inherited, ...row }))),
    );
    cache.set(key, rows);
  }
  return rows;
}
/** Level rows are ordered from level one; out-of-range requests clamp to the declared table. */
export function nativeRow(table: NativeTable, name: string, level = 1): NativeRow {
  const rows = nativeLevels(table, name);
  const index = Math.max(1, Math.min(rows.length, Math.floor(level) || 1)) - 1;
  return rows[index];
}
export const nativeLevelCount = (table: NativeTable, name: string) =>
  nativeLevels(table, name).length;
export function num(row: NativeRow | undefined, key: string, fallback = 0) {
  const value = row?.[key];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
export const flag = (row: NativeRow | undefined, key: string) => row?.[key] === 'TRUE';
export const text = (row: NativeRow | undefined, key: string) => row?.[key] ?? '';
export const list = (row: NativeRow | undefined, key: string) =>
  (row?.[key] ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
export const numbers = (row: NativeRow | undefined, key: string) => list(row, key).map(Number);
/** Client distances are hundredths of a tile. */
export const tiles = (row: NativeRow | undefined, key: string) => num(row, key) / 100;
/** Client times are milliseconds unless a column names another unit. */
export const seconds = (row: NativeRow | undefined, key: string) => num(row, key) / 1000;
export const durationSeconds = (row: NativeRow | undefined, prefix: string) =>
  num(row, `${prefix}D`) * 86400 +
  num(row, `${prefix}H`) * 3600 +
  num(row, `${prefix}M`) * 60 +
  num(row, `${prefix}S`);
export function nativeGlobal(name: string, fallback = 0) {
  const row = combat.globals[name]?.[0];
  if (!row) return fallback;
  if (row.BooleanValue !== undefined) return row.BooleanValue === 'TRUE' ? 1 : 0;
  return num(row, 'NumberValue', num(row, 'NumberArray', fallback));
}
export const nativeGlobalArray = (name: string, column = 'NumberArray') =>
  (combat.globals[name] ?? []).map((row) => num(row, column));
/** Town Hall level table rows (1..18) including per-building count columns. */
export const nativeTownHall = (level: number): NativeRow =>
  combat.townhall[Math.max(1, Math.min(combat.townhall.length, Math.floor(level) || 1)) - 1];
export const nativeTownHallLevels = () => combat.townhall.length;
export const nativeSuperLicence = (name: string): NativeRow | undefined =>
  combat.superLicences[name]?.[0];
export const nativeSuperLicences = () => Object.keys(combat.superLicences);
export const nativeNames = (table: NativeTable) => Object.keys(combat[table]);
/** Supercharge rows linked from a building (mini_levels.csv), inherited like level rows. */
export function nativeSupercharges(building: string): readonly NativeRow[] {
  const declared = combat.superchargeRows[building];
  if (!declared) return [];
  let inherited: Record<string, string> = {};
  return declared.map((row) => Object.freeze((inherited = { ...inherited, ...row })));
}
