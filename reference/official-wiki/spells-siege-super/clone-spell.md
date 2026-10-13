# Clone Spell

- **Source:** https://clashofclans.fandom.com/wiki/Clone_Spell
- **Wiki revision:** 622840; retrieved 2026-09-15
- **Category:** `elixir-spell`
- **Client row:** `spells.json` -> `Clone` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Spell Factory level 5 (Town Hall 10). Housing space 3.
- Creates a 3.5-tile radius zone for 18 s. Troops that enter are duplicated at the same level with full HP until the spell's housing budget is spent (22 at L1 to 48 at L9).
- Clones expire 30 s after creation (or earlier if killed). A clone that times out does not trigger death effects (e.g. Balloon bomb, Ice Golem freeze).
- One troop can be copied repeatedly until capacity is used; if several are inside, the earliest-spawned troop is copied first. A troop larger than the remaining capacity is not copied.
- Any troop can be cloned, including Super Troops and sub-troops (each counts its own housing: Skeleton/Bat/Frostmite 1, Lava/Ice Pup and Yetimite 2, Golemite 6, Big Boy 10). Clones can be cloned again, and cloned spawners spawn cloned sub-troops.
- Heroes, Pets and Siege Machines cannot be cloned (client also excludes Totems). Multiple Clone Spells keep separate capacities.

## Constants (wiki)

| Field | Value |
|---|---|
| radiusTiles | 3.5 |
| spellDurationSeconds | 18 |
| clonedLifespanSeconds | 30 |
| housingSpace | 3 |
| spellFactoryLevel | 5 |

## Level table

| Level | Clone capacity (housing) | Research cost | Research time | Lab level |
|---|---|---|---|---|
| 1 | 22 | N/A | N/A | N/A |
| 2 | 24 | 1,500,000 | 1d | 8 |
| 3 | 26 | 2,500,000 | 2d | 8 |
| 4 | 28 | 3,000,000 | 2d 6h | 9 |
| 5 | 30 | 4,000,000 | 2d 12h | 9 |
| 6 | 34 | 5,000,000 | 4d | 11 |
| 7 | 38 | 8,000,000 | 5d | 12 |
| 8 | 42 | 9,000,000 | 7d | 13 |
| 9 | 48 | 26,000,000 | 13d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- clone capacity -> `DuplicateHousing` (22..48)
- clone lifetime -> `DuplicateLifetime` = 30000 ms
- zone duration -> `NumberOfHits` 60 x `TimeBetweenHitsMS` 300 = 18 s
- radius -> `Radius` 350
- immunities -> `ImmunitySiegeMachines`, `ImmunityTotems`
- Healer AI -> globals `CLONE_HEALER_WEIGHT_PERCENT` = 40

**Automatic wiki-vs-client check**

- MATCH `radiusTiles`: wiki 3.5 vs client 3.5 (`Radius/100`)
- MATCH `spellDurationSeconds`: wiki 18 vs client 18 (`NumberOfHits*TimeBetweenHitsMS/1000`)
- MATCH `clonedLifespanSeconds`: wiki 30 vs client 30 (`DuplicateLifetime/1000`)
- MATCH `housingSpace`: wiki 3 vs client 3 (`HousingSpace`)
- MATCH `spellFactoryLevel`: wiki 5 vs client 5 (`SpellForgeLevel`)
- MATCH `clonedCapacityHousing` at levels 1-9 (`DuplicateHousing`)
- MATCH `researchCost` at levels 2-9 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-9 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-9 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- `CLONE_HEALER_WEIGHT_PERCENT` = 40 (client global) suggests Healers weigh cloned troops at 40% when choosing heal targets; undocumented on the wiki.
- Hero/Pet exclusion is not a column on the spell row; it must be enforced by unit type in code.
