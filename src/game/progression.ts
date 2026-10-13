import nativeProgressionSource from '../../reference/full-client/progression.json' with { type: 'json' };
import { BUILDING_LEVELS, WITHHELD } from './tiers';
const nativeProgression = nativeProgressionSource as unknown as {
  buildings: Record<string, (typeof nativeProgressionSource.buildings)['townhall']>;
};
import { infernoStats } from './inferno-weapon';
import { cannonStats } from './cannon-stats';
import { castleStats } from './castle-art';
import { mortarStats } from './mortar-stats';
import { darkStorageStats } from './dark-storage-stats';
import type { BuildingKind } from './data';
import { XBOW_LEVELS } from './xbow-stats';
import { teslaStats } from './tesla-stats';
import { bombTowerStats } from './bomb-tower-stats';
import { seekingMineStats } from './seeking-mine-stats';
import { wizardTowerStats } from './wizard-tower-stats';
import { SWEEPER_LEVELS } from './air-control-stats';

/** Derived from the pinned tier tables; see src/game/tiers.ts and docs/TOWNHALL-TIERS.md. */
export { BUILDING_LEVELS } from './tiers';

export const requiredTownHall = (kind: BuildingKind, level: number) => {
  if (kind === 'townhall') return level >= 1 && level <= 18 ? Math.max(1, level - 1) : null;
  // A level this game withholds is never reachable, so it has no requirement to report.
  const withheld = WITHHELD[kind];
  if (withheld && level > withheld.level) return null;
  const native = nativeProgression.buildings[kind]?.levels[level - 1];
  if (native && native.townhall > 8) return native.townhall;
  if (kind === 'inferno')
    return Number.isInteger(level) && level >= 1 && level <= 12
      ? infernoStats(level).townhall
      : null;
  if (kind === 'clancastle') return castleStats(level)?.townhall ?? null;
  if (kind === 'cannon') return cannonStats(level)?.townhall ?? null;
  if (kind === 'mortar') return mortarStats(level)?.townhall ?? null;
  if (kind === 'airsweeper') return SWEEPER_LEVELS[level - 1]?.townhall ?? null;
  if (kind === 'wizardtower') return wizardTowerStats(level)?.townhall ?? null;
  if (kind === 'bombtower') return bombTowerStats(level)?.townhall ?? null;
  if (kind === 'tesla') return teslaStats(level)?.townhall ?? null;
  if (kind === 'darkstorage') return darkStorageStats(level)?.townhall ?? null;
  if (kind === 'xbow') return XBOW_LEVELS[level - 1]?.townhall ?? null;
  // Level-one source trap rows use TH1; the actual purchase unlock is TH7.
  if (kind === 'seekingairmine' && level > 1) return seekingMineStats(level)?.townhall ?? null;
  // Native trap rows retain later requirements even while the home village caps at TH9.
  if (kind === 'skeletontrap' && level === 4) return 10;
  const index = BUILDING_LEVELS[kind].findIndex((cap) => cap >= level);
  return index < 0 ? null : index + 1;
};
