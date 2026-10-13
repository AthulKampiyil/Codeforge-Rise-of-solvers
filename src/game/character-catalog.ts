import raw from '../../reference/characters/catalog.json' with { type: 'json' };

/** Source cells are retained as strings; parse each field explicitly where it is used. */
export type SourceRow = Readonly<Record<string, string | number>>;
interface AnimationBlock {
  columns: string[];
  types: string[];
  rows: Record<string, string>[];
}
interface CatalogRoster {
  stage: number;
  stageIndex: number;
  npc: string;
  layout: string;
  bunkers: {
    globalId: number;
    name: string;
    sourceId: number;
    level: number;
    x: number;
    y: number;
    mode: number | null;
  }[];
  members: {
    character: string;
    sourceLevel: number;
    count: number;
    defensiveCharacter: string;
    row: number;
    animation: string;
    swf: string[];
    graph: string | null;
  }[];
}
const catalog = raw as unknown as {
  characters: Record<string, SourceRow[]>;
  animations: Record<string, AnimationBlock>;
  projectiles: Record<string, Record<string, string>[]>;
  specialAbilities: Record<string, Record<string, string>[]>;
  spells: Record<string, Record<string, string>[]>;
  rosters: CatalogRoster[];
  bunkers: Record<string, { name: string; rows: Record<string, string>[] }>;
  graphs: Record<string, { swf: string; animation: string | null; exports: string[] }>;
  graphAliases: Record<string, string>;
  projectileGroups: Record<string, string[]>;
  trapSpawners: Record<string, Record<string, string>[]>;
  defenceTroops: Record<string, Record<string, string>[]>;
  absentGlobals: string[];
  repairGlobals: { HEAL_STACK_PERCENT: number[]; ALLOW_REPAIR_AFTER_DAMAGE_TICKS: number };
};
export const CHARACTER_ROSTERS = catalog.rosters;
export const CHARACTER_GRAPHS = catalog.graphs;
/** Animation blocks that name exactly another captured block's exports (Golemite: Golem graph). */
export const CHARACTER_GRAPH_ALIASES = catalog.graphAliases;
/** Later projectile rows grouped into their own graphs (`projectiles/<group>`). */
export const PROJECTILE_GROUPS = catalog.projectileGroups;
/** Globals read by the pinned older engine that this client no longer contains. */
export const ABSENT_GLOBALS = catalog.absentGlobals;
/** Pinned globals read by Defending Builder repairs (healer slot percentages, post-damage delay). */
export const REPAIR_GLOBALS = catalog.repairGlobals;
/** A trap row that spawns characters (Ghost Trap), with explicit level inheritance. */
export function trapSpawnerLevel(name: string, level: number) {
  const rows = catalog.trapSpawners[name];
  if (!rows || !Number.isSafeInteger(level) || level < 1 || level > rows.length)
    throw Error(`Missing native trap spawner ${name} ${level}`);
  return Object.assign({}, ...rows.slice(0, level)) as Record<string, string>;
}
/** Per-level `DefenceTroop*` fields of a building (Builder's Hut), already inherited. */
export function defenceTroopLevel(building: string, level: number) {
  const rows = catalog.defenceTroops[building];
  const row = rows?.find((r) => Number(r.BuildingLevel) === level);
  if (!row) throw Error(`Missing native defence troop row ${building} ${level}`);
  return row;
}
/** Bunker buildings (source `Bunker=TRUE`) keyed by GlobalID. */
export const BUNKER_BUILDINGS = catalog.bunkers;

export const sourceNumber = (row: SourceRow | Record<string, string>, key: string) => {
  const value = row[key];
  if (value === undefined || value === '') return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw Error(`Invalid source number ${key}: ${value}`);
  return parsed;
};
export const sourceFlag = (row: SourceRow | Record<string, string>, key: string) =>
  row[key] === 'TRUE';

/**
 * AllianceUnitLevel names a VisualLevel, not a row ordinal. The pinned client includes a
 * challenge roster (Rocket Balloon 10) that is only resolvable as a VisualLevel; for every
 * family whose VisualLevels match their row ordinals both readings coincide.
 */
export function characterLevel(name: string, visualLevel: number): SourceRow | undefined {
  const rows = catalog.characters[name];
  if (!rows || !Number.isSafeInteger(visualLevel)) return undefined;
  const matches = rows.filter((row) => sourceNumber(row, 'VisualLevel') === visualLevel);
  return matches.length === 1 ? matches[0] : undefined;
}
/** Every inherited source row of a captured character, in table order. */
export function characterRows(name: string): readonly SourceRow[] {
  const rows = catalog.characters[name];
  if (!rows) throw Error(`Missing native character: ${name}`);
  return rows;
}
/** Explicit `DefensiveTroop` substitution at the same VisualLevel (for example Super Minion). */
export function defendingCharacterLevel(name: string, visualLevel: number) {
  const row = characterLevel(name, visualLevel);
  if (!row) return undefined;
  const defensive = typeof row.DefensiveTroop === 'string' ? row.DefensiveTroop : undefined;
  if (!defensive) return { character: name, row };
  const substitute = characterLevel(defensive, visualLevel);
  return substitute ? { character: defensive, row: substitute } : undefined;
}
/** Character rows reference blocks ignoring spaces (for example `Baby Dragon 6`). */
export function animationBlock(name: string): AnimationBlock {
  const matches = Object.keys(catalog.animations).filter(
    (key) => key.replaceAll(' ', '') === name.replaceAll(' ', ''),
  );
  if (matches.length !== 1) throw Error(`Missing native animation block: ${name}`);
  return catalog.animations[matches[0]];
}
export function projectileRow(name: string) {
  const rows = catalog.projectiles[name];
  if (!rows) throw Error(`Missing native projectile: ${name}`);
  return rows[0];
}
/** Explicit level-table inheritance for ability and spell rows (level 1 is the first row). */
function inheritedLevel(rows: Record<string, string>[] | undefined, level: number, kind: string) {
  if (!rows || !Number.isSafeInteger(level) || level < 1 || level > rows.length)
    throw Error(`Missing native ${kind} level ${level}`);
  return Object.assign({}, ...rows.slice(0, level)) as Record<string, string>;
}
export const specialAbility = (name: string, level: number) =>
  inheritedLevel(catalog.specialAbilities[name], level, `ability ${name}`);
export const spellLevel = (name: string, level: number) =>
  inheritedLevel(catalog.spells[name], level, `spell ${name}`);
