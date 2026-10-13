import { TROOP_KEYS, SPELL_KEYS, type SpellKind, type TroopKind } from '../game/data';
import { TROOP_UNLOCK, SPELL_UNLOCK, spellFactory, troopFacility } from '../game/army-unlocks';
import { superOriginal } from '../game/special-troops';

// Elixir troops first, then dark troops, siege machines and finally super troops: each group
// keeps its own facility order, so the shared hotkeys stay on the core barracks roster.
const troopGroup = (kind: TroopKind) =>
  superOriginal(kind)
    ? 3
    : troopFacility(kind) === 'workshop'
      ? 2
      : troopFacility(kind) === 'darkbarracks'
        ? 1
        : 0;
// Presentation order follows facility progression without changing simulation or save order.
export const TROOP_ORDER = [...TROOP_KEYS].sort(
  (a, b) => troopGroup(a) - troopGroup(b) || TROOP_UNLOCK[a] - TROOP_UNLOCK[b],
);
export const SPELL_ORDER = [...SPELL_KEYS].sort(
  (a, b) =>
    Number(spellFactory(a) === 'darkspellfactory') - Number(spellFactory(b) === 'darkspellfactory') ||
    SPELL_UNLOCK[a] - SPELL_UNLOCK[b],
);
/** "Spell Factory 4" / "Dark Spell Factory 2" for unlock labels. */
export const spellUnlockLabel = (kind: SpellKind) =>
  `${spellFactory(kind) === 'darkspellfactory' ? 'Dark Spell Factory' : 'Spell Factory'} ${SPELL_UNLOCK[kind]}`;
