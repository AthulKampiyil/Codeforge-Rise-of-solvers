import { nativeSuperLicence, nativeSuperLicences, num, text } from './native-data';
import { TROOP_SOURCE } from './native-units';
import source from '../../reference/full-client/progression.json' with { type: 'json' };
import type { TroopKind } from './data';
export const isSiege = (kind: string) =>
  (source.troopDefs as Record<string, { ProductionBuilding?: string }>)[kind]
    ?.ProductionBuilding === 'Siege Workshop';
// Both are pure functions of static data and run per unit per tick through `troopLevel`.
const licences = new Map<TroopKind, ReturnType<typeof nativeSuperLicence> | undefined>();
export const superLicence = (kind: TroopKind) => {
  if (licences.has(kind)) return licences.get(kind);
  const row = nativeSuperLicences()
    .map(nativeSuperLicence)
    .find((row) => text(row, 'Replacement') === TROOP_SOURCE[kind]);
  licences.set(kind, row);
  return row;
};
const originals = new Map<TroopKind, TroopKind | undefined>();
export function superOriginal(kind: TroopKind): TroopKind | undefined {
  if (originals.has(kind)) return originals.get(kind);
  const name = text(superLicence(kind), 'Original');
  const original = Object.entries(TROOP_SOURCE).find(([, value]) => value === name)?.[0] as
    TroopKind | undefined;
  originals.set(kind, original);
  return original;
}
export const superMinimum = (kind: TroopKind) => num(superLicence(kind), 'MinOriginalLevel');

export const superLevelOffset = (kind: TroopKind) =>
  Number((source.troopDefs[kind] as Record<string, string>).VisualLevel || 1) - 1;
