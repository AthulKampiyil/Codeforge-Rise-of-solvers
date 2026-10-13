import type { Battle, Building } from './model';

/**
 * Whether the version 51 native engine steps this building, rather than the late campaign
 * family that owned it before. A campaign layout and every older recording keep their family.
 */
export const nativeOwned = (battle: Battle, building: Pick<Building, 'npc'>) =>
  !!battle.nativeRoster && !building.npc && battle.catalog !== 'goblin-v1';
