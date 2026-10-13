import catalog from '../../reference/achievements/catalog.json' with { type: 'json' };
import type { BuildingKind, TroopKind } from './data';
import type { Building } from './model';

/**
 * Pinned client 18.400.21 Home Village achievements (logic/achievements.csv). Each has up to
 * three tiers; claiming a finished tier pays its gems and XP. See reference/achievements.
 */
export type AchievementDef = (typeof catalog.achievements)[number];
export type AchievementTier = AchievementDef['tiers'][number];

/** Per-achievement event counts and claimed tiers, keyed by achievement id. */
export interface AchievementState {
  counts: Record<string, number>;
  claimed: Record<string, number>;
}
export const emptyAchievements = (): AchievementState => ({ counts: {}, claimed: {} });

/** Client `ActionData` building names, as this village's building kinds. */
const BUILDING_KINDS: Record<string, BuildingKind> = {
  'Gold Storage': 'goldstorage',
  'Town Hall': 'townhall',
  'Clan Castle': 'clancastle',
  'Builders Hut': 'builder',
  Wall: 'wall',
  Mortar: 'mortar',
  'X-Bow': 'xbow',
  'Inferno Tower': 'inferno',
  'Eagle Artillery': 'eagleartillery',
  Scattershot: 'scattershot',
  'Spell Tower': 'spelltower',
  Monolith: 'monolith',
  'Multi Archer Tower': 'multiarchertower',
  'Ricochet Cannon': 'ricochetcannon',
  Firespitter: 'firespitter',
  'Multi Gear Tower': 'multigeartower',
  'Crafting Station': 'craftingstation',
};
const UNIT_KINDS: Record<string, TroopKind> = {
  Archer: 'archer',
  'Wall Breaker': 'wallbreaker',
  Dragon: 'dragon',
};
/** The campaign garrison units the two slayer achievements name. */
export const SLAIN_KINDS: Record<string, string> = {
  'Golden Dragon': 'goldendragon',
  MOMMA: 'momma',
};
export const LOOT_RESOURCES: Record<string, 'gold' | 'elixir' | 'dark'> = {
  Gold: 'gold',
  Elixir: 'elixir',
  DarkElixir: 'dark',
};

/** Counted as they happen. */
const COUNTED = [
  'clear_obstacles',
  'loot',
  'win_pvp_attack',
  'destroy',
  'slay',
  'activate_super_licence',
  'supercharge',
  'seasonal_defense',
  'war_loot',
];
/** Read from the village as it stands. */
const READ = ['upgrade', 'unit_unlock', 'npc_stars', 'victory_points'];

/** The achievements this village can count, in the client's display order. */
export const ACHIEVEMENTS = catalog.achievements.filter(
  (a) => COUNTED.includes(a.action) || READ.includes(a.action),
);
/**
 * The rest need clans, wars, Clan Games, Season Challenges, ranked leagues, defenses or an
 * account, none of which this offline village has.
 */
export const UNAVAILABLE_ACHIEVEMENTS = catalog.achievements.filter(
  (a) => !ACHIEVEMENTS.includes(a),
);
const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
export const achievementById = (id: string) => BY_ID.get(id);
export const countedAchievement = (a: AchievementDef) => COUNTED.includes(a.action);

/**
 * Whether a destroyed building counts toward a "destroy" achievement. A level in the row asks
 * for the weaponized form (Town Hall 12, Builder's Hut 2). The Town Hall 17 weapon is the
 * Inferno Artillery, which the Eagle Artillery achievement names alongside it.
 */
export function destroyCounts(a: AchievementDef, b: Pick<Building, 'kind' | 'level'>) {
  if (a.action !== 'destroy' || !a.data) return false;
  if (a.data === 'Eagle Artillery' && b.kind === 'townhall' && b.level >= 17) return true;
  return BUILDING_KINDS[a.data] === b.kind && b.level >= (a.dataLevel ?? 1);
}

export interface AchievementVillage {
  counts: Record<string, number>;
  /** Highest finished level of a building kind; zero when none stands. */
  buildingLevel(kind: BuildingKind): number;
  troopUnlocked(kind: TroopKind): boolean;
  goblinStars: number;
  trophies: number;
}
/** How far a tier's target the village has come. Unit unlocks read the tier's own troop. */
export function achievementValue(a: AchievementDef, tier: number, v: AchievementVillage) {
  switch (a.action) {
    case 'upgrade':
      return v.buildingLevel(BUILDING_KINDS[a.data!]);
    case 'unit_unlock': {
      const unit = (a.tiers[Math.min(tier, a.tiers.length - 1)] as { unit?: string }).unit;
      return unit && v.troopUnlocked(UNIT_KINDS[unit]) ? 1 : 0;
    }
    case 'npc_stars':
      return v.goblinStars;
    case 'victory_points':
      return Math.max(v.counts[a.id] ?? 0, v.trophies);
    default:
      return v.counts[a.id] ?? 0;
  }
}

export function validAchievements(value: unknown): value is AchievementState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const { counts, claimed } = value as AchievementState;
  const record = (r: unknown): r is Record<string, number> =>
    !!r && typeof r === 'object' && !Array.isArray(r);
  if (!record(counts) || !record(claimed)) return false;
  return (
    Object.entries(counts).every(([id, n]) => BY_ID.has(id) && Number.isSafeInteger(n) && n >= 0) &&
    Object.entries(claimed).every(
      ([id, n]) =>
        BY_ID.has(id) && Number.isInteger(n) && n >= 0 && n <= BY_ID.get(id)!.tiers.length,
    )
  );
}
