# Workshop

- **Source:** https://clashofclans.fandom.com/wiki/Workshop
- **Wiki revision:** 624497; retrieved 2026-09-15
- **Category:** `building`
- **Client row:** `buildings.json` -> `Siege Workshop` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- The wiki page is titled 'Workshop' (the client building is 'Siege Workshop'). Unlocked at Town Hall 12; 4x4 footprint (was 5x5 before Dec 2019); 9 levels (TH 12, 12, 12, 13, 13, 14, 15, 16, 17).
- Each level unlocks one Siege Machine: L1 Wall Wrecker, L2 Battle Blimp, L3 Stone Slammer, L4 Siege Barracks, L5 Log Launcher, L6 Flame Flinger, L7 Battle Drill, L8 Troop Launcher, L9 Sky Wagon.
- Stores built machines: 1 at L1, 2 at L2, 3 from L3 on. Only one Siege Machine can be deployed per battle.
- Building Siege Machines is free and instant, works during upgrades, and is not affected if the Workshop is destroyed in a defense.
- Siege Machines are researched in the Laboratory with Elixir and can be donated to Clan Castles level 6+.

## Constants (wiki)

| Field | Value |
|---|---|
| footprint | 4x4 |
| unlockTownHall | 12 |
| siegeMachinesPerBattle | 1 |

## Level table

| Level | Unlocks | Siege capacity | HP | Build cost | Build time | XP | TH req. |
|---|---|---|---|---|---|---|---|
| 1 | Wall Wrecker | 1 | 1,000 | 2,400,000 | 2d | 415 | 12 |
| 2 | Battle Blimp | 2 | 1,100 | 3,700,000 | 3d | 509 | 12 |
| 3 | Stone Slammer | 3 | 1,200 | 5,000,000 | 3d 12h | 549 | 12 |
| 4 | Siege Barracks | 3 | 1,300 | 8,700,000 | 4d | 587 | 13 |
| 5 | Log Launcher | 3 | 1,400 | 9,000,000 | 5d | 657 | 13 |
| 6 | Flame Flinger | 3 | 1,500 | 10,000,000 | 5d 12h | 689 | 14 |
| 7 | Battle Drill | 3 | 1,600 | 11,000,000 | 6d | 720 | 15 |
| 8 | Troop Launcher | 3 | 1,700 | 13,000,000 | 7d | 777 | 16 |
| 9 | Sky Wagon | 3 | 1,800 | 26,000,000 | 13d 12h | 1,080 | 17 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- capacity -> `HousingSpaceSiege` (1,2,3,...)
- unlocks -> characters.json siege rows `BarrackLevel` with `ProductionBuilding` = 'Siege Workshop'
- HP / cost / time / TH -> `Hitpoints`, `BuildCost`, `BuildTimeD/H/M/S`, `TownHallLevel`
- other -> `UnitProduction` 2,3,3,... ; `ProducesUnitsOfType` = 3; footprint `Width`/`Height` 4
- globals -> `USE_SIEGE_IN_PRESETS` TRUE, `SIEGE_MACHINE_USE_DOUBLE_TAP_DEPLOY_FIX` TRUE

**Automatic wiki-vs-client check**

- MATCH `hitpoints` at levels 1-9 (`Hitpoints`)
- MATCH `buildCost` at levels 1-9 (`BuildCost`)
- MATCH `buildTimeHours` at levels 1-9 (`BuildTimeD/H/M/S`)
- MATCH `experience` at levels 1-9 (`floor(sqrt(build seconds))`)
- MATCH `townHallLevel` at levels 1-9 (`TownHallLevel`)
- MATCH `siegeCapacity` at levels 1-9 (`HousingSpaceSiege`)
- MATCH `siegeUnlocked` at levels 1-9 (`characters.BarrackLevel`)

**Notes, ambiguities and manual checks**

- Wiki summary still says eight Siege Machines; the table lists nine (Sky Wagon, April 2026). The Sky Wagon is the client row 'Air Troop Launcher' (`BarrackLevel` 9).
