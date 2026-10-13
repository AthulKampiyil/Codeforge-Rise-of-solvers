# Haste Spell

- **Source:** https://clashofclans.fandom.com/wiki/Haste_Spell
- **Wiki revision:** 620321; retrieved 2026-09-15
- **Category:** `dark-spell`
- **Client row:** `spells.json` -> `Haste` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Dark Spell Factory level 3 (Town Hall 9). Housing space 1. Affects ground and air.
- Boosts movement speed of friendly units in its area more than Rage (+28 at L1 up to +56 at L6-7) but gives no damage bonus.
- Duration 10 s at L1, +5 s per level to 30 s at L5-L7. Radius 4 tiles; L7 raises it to 5 tiles.
- Heroes receive 50% of the speed boost. Siege Machines are unaffected.
- Does not stack with other Haste Spells or with Rage speed; the larger speed boost is used.

## Constants (wiki)

| Field | Value |
|---|---|
| effectType | Area Splash |
| housingSpace | 1 |
| targets | Ground & Air |
| darkSpellFactoryLevel | 3 |

## Level table

| Level | Speed increase | Duration (s) | Radius (tiles) | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|
| 1 | 28 | 10 | 4 | N/A | N/A | N/A |
| 2 | 34 | 15 | 4 | 8,000 | 1d | 7 |
| 3 | 40 | 20 | 4 | 17,000 | 2d | 8 |
| 4 | 46 | 25 | 4 | 30,000 | 3d | 8 |
| 5 | 52 | 30 | 4 | 38,500 | 4d | 9 |
| 6 | 56 | 30 | 4 | 200,000 | 9d | 15 |
| 7 | 56 | 30 | 5 | 320,000 | 12d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- speed boost -> `SpeedBoost` (28..56); Heroes `SpeedBoost2` (14..28)
- duration -> `NumberOfHits` (41..121) x `TimeBetweenHitsMS` 250
- linger -> `BoostTimeMS` = 1000
- radius -> `Radius` 400 / 500 at L7
- immunities -> `ImmunitySiegeMachines`, `ImmunityTotems`

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `darkSpellFactoryLevel`: wiki 3 vs client 3 (`SpellForgeLevel`)
- MATCH `speedIncrease` at levels 1-7 (`SpeedBoost`)
- MATCH `durationSeconds` at levels 1-7 (`NumberOfHits*TimeBetweenHitsMS/1000`)
- MATCH `radiusTiles` at levels 1-7 (`Radius/100`)
- MATCH `researchCost` at levels 2-7 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-7 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-7 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Client durations are 0.25 s longer than the wiki's (one extra pulse), same pattern as Jump.
