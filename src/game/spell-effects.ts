import { distance2D } from './distance';
import { SPELLS, spellStatsAt } from './data';
import type { Aura, Battle, Unit } from './model';
import { unitHidden } from './native-status';
import {
  HEAL_PULSES,
  RAGE_PULSES,
  SPELL_PULSE_INTERVAL,
  HEAL_HERO_MULTIPLIER,
  INVISIBILITY_INTERVAL,
  INVISIBILITY_LINGER,
  RAGE_LINGER,
  invisibilitySeconds,
} from './spell-progression';

/**
 * Pulses and their spacing. The original three are this game's own sequencing; the
 * Invisibility Spell states both in its own source row, so it is read rather than chosen.
 */
const rhythm = (kind: Aura['kind'], level: number) =>
  kind === 'invisibility'
    ? {
        count: Math.round(invisibilitySeconds(level) / INVISIBILITY_INTERVAL),
        interval: INVISIBILITY_INTERVAL,
      }
    : // The Jump Spell's ring is scenery: it opens a breach rather than touching troops, so
      // it needs no pulses at all and simply lives out its stated length.
      kind === 'jump'
      ? { count: 0, interval: 1 }
      : {
        count: kind === 'heal' ? HEAL_PULSES : RAGE_PULSES,
        interval: SPELL_PULSE_INTERVAL,
      };

/** Resolve each scheduled pulse exactly once, including pulses crossed by a long frame. */
export function stepSpellAuras(battle: Battle) {
  for (const aura of battle.auras) {
    const level = battle.spellLevels?.[aura.kind] ?? 1;
    const { count, interval } = rhythm(aura.kind, level);
    const stats = spellStatsAt(aura.kind, level);
    while (aura.pulses < count) {
      const at = aura.start + aura.pulses * interval;
      if (at >= aura.end || at > battle.elapsed + 1e-9) break;
      aura.pulses++;
      for (const unit of battle.units) {
        if (
          unit.hp <= 0 ||
          (unit.spawnedAt ?? 0) > at + 1e-9 ||
          distance2D(unit.x - aura.x, unit.y - aura.y) > stats.radius
        )
          continue;
        if (aura.kind === 'heal')
          unit.hp = Math.min(
            unit.maxHp,
            unit.hp + stats.heal * (unit.hero ? HEAL_HERO_MULTIPLIER : 1),
          );
        else if (aura.kind === 'rage')
          unit.spellRageUntil = Math.max(unit.spellRageUntil ?? 0, at + RAGE_LINGER);
        // The ring hides what stands in it now; each unit keeps that cover for its own
        // short linger after stepping out, exactly as the Rage Spell's boost does.
        else if (aura.kind === 'invisibility')
          unit.invisibleUntil = Math.max(unit.invisibleUntil ?? 0, at + INVISIBILITY_LINGER);
      }
    }
  }
  battle.auras = battle.auras.filter((aura) => aura.end > battle.elapsed);
}

/** Spells whose whole effect is a ring that pulses over time. */
export type AuraSpell = 'heal' | 'rage' | 'invisibility' | 'jump';

/** Rings that are holding a breach open right now, for the pathfinder to walk through. */
export const openBreaches = (battle: Battle) =>
  battle.auras.filter((aura) => aura.kind === 'jump' && aura.end > battle.elapsed);

/**
 * Whether a defence may fire at this attacker. The Invisibility Spell hides it in every
 * version; from version 51 a native status (burrowed, recalled, its own invisibility) does too.
 */
export const untargetable = (battle: Battle, unit: { invisibleUntil?: number }) =>
  (unit.invisibleUntil ?? 0) > battle.elapsed || unitHidden(unit as Unit, battle.elapsed);

export function startSpellAura(battle: Battle, kind: AuraSpell, x: number, y: number): Aura {
  const aura = {
    kind,
    x,
    y,
    start: battle.elapsed,
    end: battle.elapsed + SPELLS[kind].duration,
    pulses: 0,
  };
  battle.auras.push(aura);
  stepSpellAuras(battle);
  return aura;
}
