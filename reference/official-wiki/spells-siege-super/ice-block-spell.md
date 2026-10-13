# Ice Block Spell

- **Source:** https://clashofclans.fandom.com/wiki/Ice_Block_Spell
- **Wiki revision:** 623794; retrieved 2026-09-15
- **Category:** `dark-spell`
- **Client row:** `spells.json` -> `Ice Block` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Dark Spell Factory level 7 (Town Hall 14). Housing space 1. Affects friendly ground and air units.
- Units inside the 5-tile radius at the moment of casting are encased in ice for 7 s: they cannot move or attack, but incoming damage is reduced by 86% (L1) to 96% (L6). Enemy buildings are not affected.
- Snapshot rule: units that walk in or spawn afterwards (Golemites, Lava Pups, Yetimites) are not encased; troops from Bat/Skeleton spells cast there are frozen even before they spawn.
- Siege Machines are immune; underground units (Miners, Super Miners) are only affected if surfaced at cast time. Encased units can still be displaced (Air Sweeper, Tornado Trap).
- Does not stack with other damage reductions (Giant Gauntlet, Eternal Tome = 100%): the single best reduction applies. Ability timers (e.g. Rocket Balloon boost, Druid form) keep counting; a Furnace keeps spawning.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 5 |
| effectType | Area Splash |
| targets | Ground & Air |
| housingSpace | 1 |
| darkSpellFactoryLevel | 7 |

## Level table

| Level | Damage reduction % | Duration (s) | Research cost | Research time | Lab level |
|---|---|---|---|---|---|
| 1 | 86 | 7 | N/A | N/A | N/A |
| 2 | 88 | 7 | 140,000 | 10d | 12 |
| 3 | 90 | 7 | 200,000 | 11d | 13 |
| 4 | 92 | 7 | 280,000 | 12d | 14 |
| 5 | 94 | 7 | 320,000 | 14d | 15 |
| 6 | 96 | 7 | 380,000 | 16d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- duration -> `FreezeTimeMS` = `FreezeOuterTimeMS` = 7000; ability `DeactivateAfterTime` 7000
- damage reduction -> `GiveSpecialAbility` 'IceBlockSpell' at `GivenSpecialAbilityLevel` 1..6 -> special_abilities `IceBlockSpell`.`ShieldProtectionPercent` 86..96
- flags -> `BoostDefenders` = TRUE, `ImmunitySiegeMachines`, `ImmunityTotems`
- radius -> `Radius` 500
- recall -> ability `NotPausedWhileRecalled` TRUE

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 5 vs client 5 (`Radius/100`)
- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `darkSpellFactoryLevel`: wiki 7 vs client 7 (`SpellForgeLevel`)
- MATCH `damageReductionPercent` at levels 1-6 (`IceBlockSpell.ShieldProtectionPercent`)
- MATCH `durationSeconds` at levels 1-6 (`FreezeTimeMS/1000`)
- MATCH `researchCost` at levels 2-6 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-6 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-6 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- The row carries `BoostDefenders` = TRUE even though the wiki says only friendly (attacking) units are encased; confirm the owner filter in code before reusing the flag.
