import { CHARACTER_ROSTERS } from './character-catalog';
import { createGarrisonReserve, type GarrisonTroop } from './garrison-reserve';
import { garrisonKindForCharacter, garrisonTroopVersion } from './garrison-kinds';
import type { GarrisonSetup } from './garrison-release';
import type { Building } from './model';
import { BUILD_MIN } from './grid';

/** Source bunker GlobalIDs and the runtime identity each must match exactly. */
const BUNKERS: Record<number, (b: Building) => boolean> = {
  1000014: (b) => b.kind === 'clancastle' && b.npc === undefined,
  1000061: (b) => b.kind === 'clancastle' && b.npc === 'goblin-castle',
  1000062: (b) => b.kind === 'camp' && b.npc === 'foreboding-cave',
};

/**
 * Rosters whose layout has no `Bunker=TRUE` building can never deploy. The pinned older
 * [LogicComponentManager.AddAvatarAllianceUnitsToCastle](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/GameObject/Component/LogicComponentManager.cs)
 * loads alliance units only into `GetAllianceCastle()`, the building whose data has `Bunker`
 * ([LogicBuildingData.IsAllianceCastle](https://github.com/bns34/Supercell.Magic-my-turn/blob/52c5953f5e5802c64ac36e53d5599f8700976085/Supercell.Magic.Logic/Data/LogicBuildingData.cs)),
 * and returns without a castle; no other spawner reads the roster. Besieged (index 73) lists
 * Electro Dragon 3 ×3 but its layout holds only Communications Masts, so the roster is retained
 * and inert: no Castle is synthesized and no defender is released.
 */
export function inertCampaignGarrison(index: number) {
  const source = CHARACTER_ROSTERS.find((g) => g.stageIndex === index);
  if (!source || source.bunkers.length) return undefined;
  return { reason: 'No source bunker' as const, members: source.members };
}

/** Why a campaign roster cannot be released yet; empty when it resolves completely. */
export function campaignGarrisonIssues(index: number): string[] {
  const source = CHARACTER_ROSTERS.find((g) => g.stageIndex === index);
  if (!source) return [];
  const issues: string[] = [];
  // More than one bunker, or a bunker identity without a runtime match, is unsupported.
  if (source.bunkers.length > 1 || (source.bunkers.length && !BUNKERS[source.bunkers[0].globalId]))
    issues.push('Unsupported source bunker');
  for (const row of source.members) {
    const kind = garrisonKindForCharacter(row.character);
    if (!kind || garrisonTroopVersion(kind, row.sourceLevel) === undefined)
      issues.push(`${row.character} ${row.sourceLevel}`);
  }
  return issues;
}

/**
 * Resolve every member or reject the whole roster; source levels are not home levels. A
 * bunkerless roster resolves with `castle: null`: it is recorded, validated and never released.
 */
export function resolvedCampaignGarrison(index: number) {
  const source = CHARACTER_ROSTERS.find((g) => g.stageIndex === index);
  if (!source) return undefined;
  if (campaignGarrisonIssues(index).length) return null;
  const troops: GarrisonTroop[] = source.members.map((row) => ({
    kind: garrisonKindForCharacter(row.character)!,
    level: row.sourceLevel,
    count: row.count,
  }));
  try {
    createGarrisonReserve(1, troops);
  } catch {
    return null;
  }
  return { castle: source.bunkers[0] ?? null, troops };
}

export function campaignGarrisonSetup(
  index: number,
  buildings: Building[],
): GarrisonSetup[] | undefined {
  const source = resolvedCampaignGarrison(index);
  if (source === undefined) return undefined;
  if (!source) throw Error('Unsupported campaign garrison');
  // Inert roster (no source bunker): nothing to load or release.
  if (!source.castle) return undefined;
  const identity = BUNKERS[source.castle.globalId];
  const matches = buildings.filter(
    (b) =>
      identity(b) &&
      b.x === source.castle!.x + BUILD_MIN &&
      b.y === source.castle!.y + BUILD_MIN &&
      b.level === source.castle!.level,
  );
  if (matches.length !== 1)
    throw Error('Campaign garrison Castle does not match its source placement');
  return [{ castleId: matches[0].id, mode: 'guard', troops: source.troops }];
}
