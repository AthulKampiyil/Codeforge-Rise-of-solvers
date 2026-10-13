# Recall Spell

- **Source:** https://clashofclans.fandom.com/wiki/Recall_Spell
- **Wiki revision:** 625271; retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Recall` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 7 (Town Hall 13). Housing space 2. Hits ground and air units.
- Units inside the 5-tile radius go back to the deployment bar and can be redeployed anywhere legal. Siege Machines cannot be recalled.
- Capacity (housing) 83 at L1 to 120 at L7. When over capacity: Heroes first (since April 2026), then highest housing, ties broken by earliest deployment. Heroes count as 25 housing and Pets as 20 (a Phoenix egg only comes back with its Hero; an Angry Jelly brainwashing its Hero rides along for free).
- Redeployment order: highest housing first, then original deployment order.
- Recalled units keep current HP and status effects; spell buffs usually lapse, and most timers keep counting down while waiting, except clone lifetimes and Phoenix revive timers, which pause.
- Stacking: not documented; capacity is stated per spell.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 5 |
| targets | Ground & Air |
| housingSpace | 2 |
| spellFactoryLevel | 7 |

## Level table

| Level | Recall capacity (housing) | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 83 | N/A | N/A | N/A |
| 2 | 89 | 7,500,000 | 7d | 11 |
| 3 | 95 | 8,000,000 | 7d 12h | 12 |
| 4 | 101 | 9,000,000 | 8d | 13 |
| 5 | 107 | 13,000,000 | 9d | 14 |
| 6 | 113 | 19,000,000 | 11d | 15 |
| 7 | 120 | 29,000,000 | 16d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- recall capacity -> `RecallHousing` (83..120)
- radius -> `Radius` 500
- immunities -> `ImmunitySiegeMachines`, `ImmunityTotems`

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 5 vs client 5 (`Radius/100`)
- MATCH `housingSpace`: wiki 2 vs client 2 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 7 vs client 7 (`SpellForgeLevel`)
- MATCH `recallCapacityHousing` at levels 1-7 (`RecallHousing`)
- MATCH `researchCost` at levels 2-7 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-7 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-7 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- The Hero = 25 / Pet = 20 housing weights and the Hero-first priority are not columns on the spell row; they must come from code or other tables (not found in spells.json).
