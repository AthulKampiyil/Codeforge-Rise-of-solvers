# Overgrowth Spell

- **Source:** https://clashofclans.fandom.com/wiki/Overgrowth_Spell
- **Wiki revision:** 623007; retrieved 2026-09-15
- **Category:** `dark-spell`
- **Client row:** `spells.json` -> `Overgrowth` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Dark Spell Factory level 6 (Town Hall 12). Housing space 2.
- Every building inside a 6-tile radius (7 before September 2024) is wrapped in roots for 22 s (L1) to 26 s (L5): defenses stop attacking and all buildings become untargetable and immune to every kind of damage, including splash and spells.
- Attackers already hitting an overgrown building drop it and pick another target. Attacking units inside are NOT hidden (unlike Invisibility).
- Walls and Traps keep working; defending troops, Heroes and Builders are unaffected; an overgrown Clan Castle can still release its troops.
- Overgrown buildings still absorb chain lightning hops (no damage). Wall Wrecker and Log Launcher still collide with them (no damage) and can get stuck; logs lose pierce on them.
- After a multiplayer battle it leaves debris the defender can clear like tombstones.
- Stacking: not documented on the wiki.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 6 |
| effectType | Area Splash |
| targets | Ground & Air |
| housingSpace | 2 |
| darkSpellFactoryLevel | 6 |

## Level table

| Level | Duration (s) | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 22 | N/A | N/A | N/A |
| 2 | 23 | 62,500 | 5d | 10 |
| 3 | 24 | 125,000 | 8d 12h | 12 |
| 4 | 25 | 175,000 | 10d | 14 |
| 5 | 26 | 360,000 | 16d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- duration -> `FreezeTimeMS` = `ShieldTime` = `InvisibilityTime` = `FreezeOuterTimeMS` (22000..26000)
- invulnerability -> `ShieldProtectionPercent` = 100
- radius -> `Radius` 600
- unaffected -> `ImmunityHeroes`, `ImmunityOtherCharacters`, `ImmunityWalls`, `ImmunityGuardians`, `ImmunitySiegeMachines`, `ImmunityTotems`
- debris -> `Overgrowth` TRUE, `NumTombStones` = 40

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 6 vs client 6 (`Radius/100`)
- MATCH `housingSpace`: wiki 2 vs client 2 (`HousingSpace`)
- MATCH `darkSpellFactoryLevel`: wiki 6 vs client 6 (`SpellForgeLevel`)
- MATCH `durationSeconds` at levels 1-5 (`FreezeTimeMS/1000`)
- MATCH `researchCost` at levels 2-5 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-5 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-5 (`row[N].LaboratoryLevel`)
