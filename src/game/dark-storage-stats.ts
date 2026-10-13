import levels from '../../reference/dark-storage/levels.json' with { type: 'json' };

/** Undiscounted source values from the pinned 18.400.21 client bundle. */
export const DARK_STORAGE_LEVELS = levels;
export const darkStorageStats = (level: number) => DARK_STORAGE_LEVELS[level - 1];
export const darkStorageCapacity = (level: number) => darkStorageStats(level)?.capacity ?? 0;
