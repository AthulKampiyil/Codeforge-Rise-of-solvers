import { migrateSave, validateSave } from '../game/save';
import type { Save } from '../game/model';

/** A whole village kept under a name, so several bases can be switched between. */
export interface VillageSlot {
  name: string;
  townhall: number;
  at: number;
  save: Save;
}

const KEY = 'crown-clan-developer-villages';
const SLOT_LIMIT = 8;
const NAME_LIMIT = 32;

const restore = (value: unknown): VillageSlot | null => {
  if (!value || typeof value !== 'object') return null;
  const slot = value as Partial<VillageSlot>;
  if (typeof slot.name !== 'string' || !slot.name) return null;
  const save = migrateSave(slot.save);
  if (!validateSave(save)) return null;
  return {
    name: slot.name.slice(0, NAME_LIMIT),
    townhall: save.buildings.find((b) => b.kind === 'townhall')?.level ?? 1,
    at: typeof slot.at === 'number' && Number.isFinite(slot.at) ? slot.at : 0,
    save,
  };
};

/** Stored villages, newest last. Unreadable storage, or a village that no longer validates, is dropped. */
export function readVillageSlots(storage: Storage | undefined = safeStorage()): VillageSlot[] {
  try {
    const raw = JSON.parse(storage?.getItem(KEY) ?? 'null');
    if (!Array.isArray(raw)) return [];
    return raw
      .map(restore)
      .filter((slot): slot is VillageSlot => slot !== null)
      .slice(0, SLOT_LIMIT);
  } catch {
    return [];
  }
}
/** Add or replace a village by name. Storage that is full reports it rather than failing silently. */
export function writeVillageSlot(
  name: string,
  save: Save,
  storage: Storage | undefined = safeStorage(),
): VillageSlot[] {
  const trimmed = name.trim().slice(0, NAME_LIMIT);
  if (!trimmed) throw Error('Name this village first.');
  const kept = readVillageSlots(storage).filter((slot) => slot.name !== trimmed);
  const slots = [
    ...kept,
    {
      name: trimmed,
      townhall: save.buildings.find((b) => b.kind === 'townhall')?.level ?? 1,
      at: Date.now(),
      save: structuredClone(save),
    },
  ].slice(-SLOT_LIMIT);
  try {
    storage?.setItem(KEY, JSON.stringify(slots));
  } catch {
    throw Error('This browser has no room left for another saved village.');
  }
  return slots;
}
export function deleteVillageSlot(
  name: string,
  storage: Storage | undefined = safeStorage(),
): VillageSlot[] {
  const slots = readVillageSlots(storage).filter((slot) => slot.name !== name);
  try {
    storage?.setItem(KEY, JSON.stringify(slots));
  } catch {
    /* The slot list is a convenience; a blocked store leaves it as it was. */
  }
  return slots;
}
function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
