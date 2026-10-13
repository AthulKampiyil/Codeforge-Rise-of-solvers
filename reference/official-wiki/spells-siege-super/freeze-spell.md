# Freeze Spell

- **Source:** https://clashofclans.fandom.com/wiki/Freeze_Spell
- **Wiki revision:** 622839; retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Freeze` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 4 with Jump (Town Hall 9). Housing space 1 (was 2 before June 2018).
- On cast, every defensive building and enemy unit (Clan Castle troops, defending Heroes, etc.) inside a 3.5-tile radius is frozen: it cannot move, attack or heal until the timer ends.
- It is an instant snapshot: units outside the radius at cast time stay unaffected even if they walk in while the visual lingers.
- Duration 2.5 s at L1, +0.5 s per level to 6.0 s at L8.
- Also disables Town Hall weapons temporarily; a frozen single-target Inferno Tower restarts its damage ramp afterwards.
- Stacking: not documented on the wiki; each cast is its own snapshot freeze.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 3.5 |
| housingSpace | 1 |
| spellFactoryLevel | 4 |

## Level table

| Level | Freeze (s) | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 2.5 | N/A | N/A | N/A |
| 2 | 3 | 1,200,000 | 1d | 7 |
| 3 | 3.5 | 1,700,000 | 1d 12h | 8 |
| 4 | 4 | 3,000,000 | 2d | 8 |
| 5 | 4.5 | 4,200,000 | 2d 12h | 8 |
| 6 | 5 | 6,000,000 | 3d 12h | 9 |
| 7 | 5.5 | 7,000,000 | 5d | 10 |
| 8 | 6 | 28,000,000 | 15d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- freeze duration -> `FreezeTimeMS` (2500..6000)
- secondary duration -> `FreezeOuterTimeMS` (= 90% of `FreezeTimeMS`)
- radius -> `Radius` 350
- single application -> `NumberOfHits` = 1, `TimeBetweenHitsMS` = 0

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 3.5 vs client 3.5 (`Radius/100`)
- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 4 vs client 4 (`SpellForgeLevel`)
- MATCH `freezeSeconds` at levels 1-8 (`FreezeTimeMS/1000`)
- MATCH `researchCost` at levels 2-8 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-8 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-8 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- `FreezeOuterTimeMS` (2250..5400 ms, 90% of the main duration) is not documented by the wiki; it likely applies to a secondary target class (the wiki gives one duration for everything). Needs engine confirmation before use.
- No immunity flags are set on the client row, consistent with the wiki (defenses and units both freeze).
