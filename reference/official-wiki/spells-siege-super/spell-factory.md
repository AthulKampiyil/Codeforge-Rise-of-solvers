# Spell Factory

- **Source:** https://clashofclans.fandom.com/wiki/Spell_Factory
- **Wiki revision:** 624556; retrieved 2026-09-15
- **Category:** `building`
- **Client row:** `buildings.json` -> `Spell Factory` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Army building unlocked at Town Hall 5; 3x3 footprint; 9 levels (TH requirements 5, 6, 7, 9, 10, 11, 13, 15, 16).
- Each level unlocks Elixir spells: L1 Lightning, L2 Healing, L3 Rage, L4 Jump + Freeze, L5 Clone, L6 Invisibility, L7 Recall, L8 Revive, L9 Totem.
- Spell storage (housing) is 2 per level up to 10 at level 5 and stays 10 afterwards; building the Dark Spell Factory adds 1 more to the same shared pool (total 11).
- Brewing costs nothing and is instant; it keeps working while the factory upgrades. Every brewed spell is single-use in battle.
- Spells can be donated if the receiver's Clan Castle holds them: 1-housing spells need CC level 4+, 2-housing spells CC 7+, the 3-housing Clone Spell CC 10+.
- Experience per upgrade equals floor(sqrt(build time in seconds)).

## Constants (wiki)

| Field | Value |
|---|---|
| footprint | 3x3 |
| unlockTownHall | 5 |

## Level table

| Level | HP | Unlocks | Spell capacity | Build cost | Build time | XP | TH req. |
|---|---|---|---|---|---|---|---|
| 1 | 425 | Lightning Spell | 2 | 150,000 | 6h | 146 | 5 |
| 2 | 470 | Healing Spell | 4 | 300,000 | 12h | 207 | 6 |
| 3 | 520 | Rage Spell | 6 | 600,000 | 1d | 293 | 7 |
| 4 | 600 | Freeze Spell, Jump Spell | 8 | 1,200,000 | 2d | 415 | 9 |
| 5 | 720 | Clone Spell | 10 | 2,000,000 | 3d | 509 | 10 |
| 6 | 840 | Invisibility Spell | 10 | 3,500,000 | 5d | 657 | 11 |
| 7 | 960 | Recall Spell | 10 | 9,000,000 | 7d | 777 | 13 |
| 8 | 1,080 | Revive Spell | 10 | 14,000,000 | 8d | 831 | 15 |
| 9 | 1,150 | Totem Spell | 10 | 24,000,000 | 9d | 881 | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- spell capacity -> `HousingSpaceAlt` (2,4,6,8,10,10,10,10,10)
- unlocks -> spells.json `SpellForgeLevel` with `ProductionBuilding` = 'Spell Factory'
- HP / cost / time / TH -> `Hitpoints`, `BuildCost` (`BuildResource` Elixir), `BuildTimeD/H/M/S`, `TownHallLevel` (aligned with the level, unlike research rows)
- other -> `UnitProduction` (2..10, legacy queue size), `ProducesUnitsOfType` = 1, `ForgesSpells` = TRUE, footprint `Width`/`Height` 3

**Automatic wiki-vs-client check**

- MATCH `hitpoints` at levels 1-9 (`Hitpoints`)
- MATCH `buildCost` at levels 1-9 (`BuildCost`)
- MATCH `buildTimeHours` at levels 1-9 (`BuildTimeD/H/M/S`)
- MATCH `experience` at levels 1-9 (`floor(sqrt(build seconds))`)
- MATCH `townHallLevel` at levels 1-9 (`TownHallLevel`)
- MATCH `spellCapacity` at levels 1-9 (`HousingSpaceAlt`)
- MATCH `spellsUnlocked` at levels 1-9 (`spells.SpellForgeLevel`)

**Notes, ambiguities and manual checks**

- Wiki summary still describes 'nine spells' while the level table lists ten (Totem added at L9 in Nov 2025).
