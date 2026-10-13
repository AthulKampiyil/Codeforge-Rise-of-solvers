# Invisibility Spell

- **Source:** https://clashofclans.fandom.com/wiki/Invisibility_Spell
- **Wiki revision:** 623168; retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Invisibility` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 6 (Town Hall 11). Housing space 1.
- Everything inside the 4-tile radius (attacking units, defending units and buildings) becomes invisible and cannot be targeted until it leaves the radius or the spell ends. Walls and Siege Machines are never made invisible.
- Duration: 3.5 s at L1, +0.25 s per level to 4.25 s at L4 (all levels were cut by 0.25 s in February 2025).
- Attackers whose target turns invisible pick another nearby target; if every target is invisible most attackers stand still (Wall Breakers still go for remaining Walls, Town-Hall-bound Siege Machines keep advancing).
- Invisible units still take splash/indirect damage and other spell effects, and projectiles fired before the effect still land.
- Stacking: not documented on the wiki (overlapping casts only extend coverage in time/space).

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 4 |
| housingSpace | 1 |
| spellFactoryLevel | 6 |

## Level table

| Level | Duration (s) | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 3.5 | N/A | N/A | N/A |
| 2 | 3.75 | 5,000,000 | 3d | 9 |
| 3 | 4 | 6,000,000 | 4d | 10 |
| 4 | 4.25 | 7,000,000 | 5d | 11 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- duration -> `NumberOfHits` (14..17) x `TimeBetweenHitsMS` 250
- per-pulse grant -> `InvisibilityTime` = 600 ms
- radius -> `Radius` 400
- immunities -> `ImmunitySiegeMachines`, `ImmunityWalls`

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 4 vs client 4 (`Radius/100`)
- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 6 vs client 6 (`SpellForgeLevel`)
- MATCH `durationSeconds` at levels 1-4 (`NumberOfHits*TimeBetweenHitsMS/1000`)
- MATCH `researchCost` at levels 2-4 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-4 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-4 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- `InvisibilityTime` = 600 ms is constant across levels and is not on the wiki; it is most plausibly how long each pulse keeps a unit invisible after it leaves the field or the last pulse fires.
