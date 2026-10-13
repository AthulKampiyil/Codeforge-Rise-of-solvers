import type { TroopKind, UnitKind } from './data';

const normal = {
  nativeFacing: -1,
  frameMs: 140,
  displayScale: 1.48,
  idleFrame: 0,
  version: '',
  bob: 1.6,
};
const specialist = {
  ...normal,
  nativeFacing: 1,
  displayScale: 1.25,
  idleFrame: 1,
  version: '-v1',
  bob: 0,
};
const profiles: Partial<Record<TroopKind, typeof normal>> = {
  swordsman: { ...normal, displayScale: 1.6, idleFrame: 1, bob: 0 },
  goblin: { ...specialist, frameMs: 100 },
  wallbreaker: { ...specialist, frameMs: 110 },
  balloon: { ...normal, frameMs: 360 },
  healer: { ...specialist, frameMs: 180, displayScale: 1.6 },
  dragon: { ...specialist, frameMs: 200, displayScale: 1.6 },
  pekka: { ...specialist, frameMs: 180, displayScale: 1.5 },
};

/** Rendering metadata stays separate from troop balance and saved progression. */
export const troopArt = (kind: UnitKind) => profiles[kind as TroopKind] ?? normal;
