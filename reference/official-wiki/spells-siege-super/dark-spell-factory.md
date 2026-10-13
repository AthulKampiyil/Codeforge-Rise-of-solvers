# Dark Spell Factory

- **Source:** https://clashofclans.fandom.com/wiki/Dark_Spell_Factory
- **Wiki revision:** 624552; retrieved 2026-09-15
- **Category:** `building`
- **Client row:** `buildings.json` -> `Dark Spell Factory` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Army building unlocked at Town Hall 8; 3x3 footprint; 8 levels (TH 8, 8, 9, 9, 10, 12, 14, 15).
- Unlocks Dark spells: L1 Poison, L2 Earthquake, L3 Haste, L4 Skeleton, L5 Bat, L6 Overgrowth, L7 Ice Block, L8 Angry (June 2026).
- Spell storage is shared with the Spell Factory: building the Dark Spell Factory adds 1 housing once; upgrades add nothing.
- Dark spells are researched with Dark Elixir; brewing is free and instant and continues during upgrades. Dark spells can be received as reinforcements when the Clan Castle has spell space.

## Constants (wiki)

| Field | Value |
|---|---|
| footprint | 3x3 |
| unlockTownHall | 8 |

## Level table

| Level | HP | Unlocks | Spell capacity | Build cost | Build time | XP | TH req. |
|---|---|---|---|---|---|---|---|
| 1 | 600 | Poison Spell | 1 | 130,000 | 6h | 146 | 8 |
| 2 | 660 | Earthquake Spell | 1 | 260,000 | 12h | 207 | 8 |
| 3 | 720 | Haste Spell | 1 | 600,000 | 2d | 415 | 9 |
| 4 | 780 | Skeleton Spell | 1 | 1,200,000 | 3d | 587 (client 509) | 9 |
| 5 | 840 | Bat Spell | 1 | 2,500,000 | 5d | 657 | 10 |
| 6 | 950 | Overgrowth Spell | 1 | 4,000,000 | 6d | 720 | 12 |
| 7 | 1,010 | Ice Block Spell | 1 | 11,000,000 | 7d | 777 | 14 |
| 8 | 1,070 | Angry Spell | 1 | 18,000,000 | 10d | 929 | 15 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- spell capacity -> `HousingSpaceAlt` = 1 at every level
- unlocks -> spells.json `SpellForgeLevel` with `ProductionBuilding` = 'Dark Spell Factory'
- HP / cost / time / TH -> `Hitpoints`, `BuildCost` (Elixir), `BuildTimeD/H/M/S`, `TownHallLevel`
- other -> `UnitProduction` 2,4,6,8,10,12,12,14 (legacy queue size, not the housing cap), `ProducesUnitsOfType` = 2, `ForgesMiniSpells` = TRUE

**Automatic wiki-vs-client check**

- MATCH `hitpoints` at levels 1-8 (`Hitpoints`)
- MATCH `buildCost` at levels 1-8 (`BuildCost`)
- MATCH `buildTimeHours` at levels 1-8 (`BuildTimeD/H/M/S`)
- MISMATCH `experience` (1 of 8 levels; `floor(sqrt(build seconds))`): L4: wiki 587 vs client 509
- MATCH `townHallLevel` at levels 1-8 (`TownHallLevel`)
- MATCH `spellCapacity` at levels 1-8 (`HousingSpaceAlt`)
- MATCH `spellsUnlocked` at levels 1-8 (`spells.SpellForgeLevel`)

**Notes, ambiguities and manual checks**

- Wiki level-4 experience (587) corresponds to a 4-day build, but both the wiki's own build time and the client say 3 days (which would give 509 XP); the XP cell looks stale.
- Wiki summary text says 'seven spells'; the table (and client) have eight after the Angry Spell.
