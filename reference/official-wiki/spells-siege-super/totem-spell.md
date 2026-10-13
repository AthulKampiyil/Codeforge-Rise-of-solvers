# Totem Spell

- **Source:** https://clashofclans.fandom.com/wiki/Totem_Spell
- **Wiki revision:** 625235; retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Totem Spell` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 9 (Town Hall 16). Housing space 1.
- On impact it stuns buildings and troops in a 5-tile radius (radius cut from 6 in February 2026) and makes nearby defenders retarget; defenses may still pick a closer unit instead of the Totem.
- It leaves a stationary Totem with 10,000 (L1) to 13,000 (L4) HP that loses 334 HP per second (added January 2026) and deals no damage (removed February 2026).
- The Totem can be targeted by ground-only and air-only defenses, but it is not an air unit for Baby Dragon / Dragon Duke enrage checks.
- It does not trigger Traps, Clan Castle troops or Spell Towers; Clone, Recall and Ice Block spells and Life Gem / Apprentice Warden auras ignore it; Healing Spells heal it but Healers/Druids do not; it is immune to displacement.
- It counts as 20 housing for Dark Crown / Spring Trap interactions but only as a 1-housing spell (5 units) for Eagle Artillery activation.
- Stacking: not documented; each cast drops its own Totem and stun.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 5 |
| hitpointDecayPerSecond | 334 |
| housingSpace | 1 |
| targets | Ground & Air |
| spellFactoryLevel | 9 |

## Level table

| Level | Totem HP | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 10,000 | N/A | N/A | N/A |
| 2 | 11,000 | 21,000,000 | 12d | 14 |
| 3 | 12,000 | 22,000,000 | 14d | 15 |
| 4 | 13,000 | 23,000,000 | 16d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- impact -> `Radius` 500, `StunTimeMS` = `FreezeTimeMS` = 200
- totem summon -> `ChainSpell` 'TotemSummon' at `ChainSpellLevel` 1..4 -> spell `TotemSummon`.`SummonTroop` 'Totem', `SpawnUpgradeLevel` 1..4
- Totem HP -> characters `Totem`.`Hitpoints` (10000..13000)
- decay -> `Totem`.`LoseHpPerTick` 167 every `LoseHpInterval` 500 ms = 334 HP/s
- targetability -> `Totem`.`TargetableByGroundAndAir` TRUE, `IsTotem` TRUE, `HousingSpace` 20
- no damage -> `Totem`.`SpecialAbilities` 'DisableAttacking' (DPS column 1..4 is inert)
- aggro -> globals `TOTEM_ALWAYS_PREFERRED_TARGET` = FALSE
- immunity on other spells -> `ImmunityTotems` = TRUE on Rage, Jump, Clone, Recall, Revive, Haste, Overgrowth, Ice Block rows

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 5 vs client 5 (`Radius/100`)
- MATCH `hitpointDecayPerSecond`: wiki 334 vs client 334 (`Totem.LoseHpPerTick*1000/LoseHpInterval`)
- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 9 vs client 9 (`SpellForgeLevel`)
- MATCH `totemHitpoints` at levels 1-4 (`Totem.Hitpoints via TotemSummon.SpawnUpgradeLevel`)
- MATCH `researchCost` at levels 2-4 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-4 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-4 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- The 0.2 s impact stun (`StunTimeMS` 200) is not stated on the wiki.
