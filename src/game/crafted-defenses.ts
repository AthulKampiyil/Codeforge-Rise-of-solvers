import catalog from '../../reference/crafted-defenses/catalog.json' with { type: 'json' };
import type { Resource } from './data';

/**
 * The Crafting Station and its Crafted Defenses (reference/crafted-defenses, from the wiki pages
 * that were checked against client 18.400.21). The station is one free 3x3 building at Town
 * Hall 18. Its owner picks one of three defenses and may switch at any time; each defense keeps
 * three modules (hitpoints, damage and an effect) at levels 1-10, upgraded with a builder.
 */
export type CraftedKind = 'candle' | 'hunter' | 'cake';
export const CRAFTED_KINDS: readonly CraftedKind[] = ['candle', 'hunter', 'cake'];
export type ModuleLevels = [number, number, number];
export interface CraftingState {
  /** The defense on the platform; absent while the station stands empty. */
  chosen?: CraftedKind;
  /** Module levels by defense, kept when switching. */
  modules: Record<CraftedKind, ModuleLevels>;
}
interface ModuleLevel {
  value: number;
  second?: number;
  cost: number;
  seconds: number;
  townHall: number;
}
interface CraftedModule {
  name: string;
  stat: string;
  resource: Resource;
  levels: ModuleLevel[];
}
interface CraftedSource {
  key: CraftedKind;
  name: string;
  range: number;
  minRange: number;
  attackSeconds: number;
  targets: 'both';
  stageTargets?: number[];
  heroMultiplier?: number;
  poisonSeconds?: number;
  splashRadius?: number;
  bombRadius?: number;
  bombDelay?: number;
  modules: CraftedModule[];
}
const DEFENSES = Object.fromEntries(
  (catalog.defenses as unknown as CraftedSource[]).map((d) => [d.key, d]),
) as Record<CraftedKind, CraftedSource>;

export const CRAFTING_STATION = catalog.station;
export const MODULE_MAX_LEVEL = 10;
export const craftedName = (kind: CraftedKind) => DEFENSES[kind].name;
export const craftedModules = (kind: CraftedKind) => DEFENSES[kind].modules;
export const craftedArt = (kind: CraftedKind) => `/assets/crafted/${kind}.png`;
export const freshCrafting = (): CraftingState => ({
  modules: { candle: [1, 1, 1], hunter: [1, 1, 1], cake: [1, 1, 1] },
});
/** The defense's displayed level: its three module levels added together (3 to 30). */
export const craftedLevel = (levels: ModuleLevels) => levels[0] + levels[1] + levels[2];

/** The next level of one module, or null at its maximum. */
export function moduleUpgrade(kind: CraftedKind, module: number, level: number) {
  const next = DEFENSES[kind].modules[module]?.levels[level];
  if (!next || level >= MODULE_MAX_LEVEL) return null;
  const resource = DEFENSES[kind].modules[module].resource;
  return {
    level: level + 1,
    cost: next.cost,
    seconds: next.seconds,
    resource,
    townHall: next.townHall,
  };
}

export interface CraftedStats {
  kind: CraftedKind;
  hp: number;
  range: number;
  minRange: number;
  attackSeconds: number;
  /** Damage of one flame, card or cake. */
  damage: number;
  /** Hot Candle: flames per volley in each stage, and when the second and third stages begin. */
  stageTargets?: number[];
  stageStarts?: [number, number];
  /** Hero Hunter: damage multiplier against heroes, and the poison it leaves. */
  heroMultiplier?: number;
  poisonLevel?: number;
  poisonSeconds?: number;
  /** Cake-A-Pult: the cake's splash on its target's layer, then the bomb on both layers. */
  splashRadius?: number;
  bombDamage?: number;
  bombRadius?: number;
  bombDelay?: number;
}

/** Battle numbers for a defense with the given module levels. */
export function craftedStats(kind: CraftedKind, levels: ModuleLevels): CraftedStats {
  const d = DEFENSES[kind];
  const at = (module: number) => d.modules[module].levels[levels[module] - 1];
  const stats: CraftedStats = {
    kind,
    hp: at(0).value,
    range: d.range,
    minRange: d.minRange,
    attackSeconds: d.attackSeconds,
    damage: at(1).value,
  };
  if (kind === 'candle') {
    const melt = at(2);
    stats.stageTargets = d.stageTargets;
    stats.stageStarts = [melt.value + 1, melt.second!];
  } else if (kind === 'hunter') {
    stats.heroMultiplier = d.heroMultiplier;
    stats.poisonLevel = at(2).value;
    stats.poisonSeconds = d.poisonSeconds;
  } else {
    stats.splashRadius = d.splashRadius;
    stats.bombDamage = at(2).value;
    stats.bombRadius = d.bombRadius;
    stats.bombDelay = d.bombDelay;
  }
  return stats;
}

/** Hot Candle flames per volley once `seconds` have passed since its timer started. */
export function candleTargets(stats: CraftedStats, seconds: number) {
  const [first, second] = stats.stageStarts!;
  const [base, decay, last] = stats.stageTargets!;
  return seconds >= second ? last : seconds >= first ? decay : base;
}

export const validCraftedKind = (v: unknown): v is CraftedKind =>
  typeof v === 'string' && (CRAFTED_KINDS as readonly string[]).includes(v);
export function validCrafting(value: unknown): value is CraftingState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  if (c.chosen !== undefined && !validCraftedKind(c.chosen)) return false;
  const modules = c.modules as Record<string, unknown> | undefined;
  return (
    !!modules &&
    typeof modules === 'object' &&
    CRAFTED_KINDS.every((k) => {
      const levels = modules[k];
      return (
        Array.isArray(levels) &&
        levels.length === 3 &&
        levels.every((l) => Number.isInteger(l) && l >= 1 && l <= MODULE_MAX_LEVEL)
      );
    }) &&
    Object.keys(modules).every((k) => validCraftedKind(k))
  );
}

/**
 * A building's Crafting Station fields: only a station carries them, module levels are 1-10,
 * and a module job names a module still below its maximum.
 */
export function validCraftedFields(b: {
  kind: string;
  crafted?: unknown;
  craftedModules?: unknown;
  moduleUpgrade?: unknown;
  improving?: unknown;
  upgradeEnd?: unknown;
}) {
  const station = b.kind === 'craftingstation';
  if (!station)
    return (
      b.crafted === undefined && b.craftedModules === undefined && b.moduleUpgrade === undefined
    );
  if (b.crafted !== undefined && !validCraftedKind(b.crafted)) return false;
  const modules = b.craftedModules;
  if (modules !== undefined) {
    if (!modules || typeof modules !== 'object' || Array.isArray(modules)) return false;
    for (const [kind, levels] of Object.entries(modules))
      if (
        !validCraftedKind(kind) ||
        !Array.isArray(levels) ||
        levels.length !== 3 ||
        !levels.every((l) => Number.isInteger(l) && l >= 1 && l <= MODULE_MAX_LEVEL)
      )
        return false;
  }
  const job = b.moduleUpgrade as { kind?: unknown; module?: unknown } | undefined;
  if ((job !== undefined) !== (b.improving === 'module')) return false;
  if (job === undefined) return true;
  if (
    !job ||
    typeof job !== 'object' ||
    !validCraftedKind(job.kind) ||
    !Number.isInteger(job.module) ||
    (job.module as number) < 0 ||
    (job.module as number) > 2 ||
    b.upgradeEnd === undefined
  )
    return false;
  const levels = (modules as Partial<Record<CraftedKind, ModuleLevels>> | undefined)?.[job.kind];
  return (levels?.[job.module as number] ?? 1) < MODULE_MAX_LEVEL;
}
