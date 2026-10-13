# Clan Castle

- Source: [Clan Castle](https://clashofclans.fandom.com/wiki/Clan_Castle) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `623293`; retrieved 2026-09-15
- Category: building
- Client reference (18.400.21): `buildings.csv` -> `Clan Castle` (14 levels)

## Mechanics

- Present from the start as a ruin (TH1); rebuilt for 10,000 Elixir without a builder, normally at TH3 (TH2 possible only with extra storage). One per base; footprint 3x3.
- Stores donated reinforcements: troop capacity 10 (level 1) to 55 (levels 13-14); spell capacity 1 from level 4 (2 at 7, 3 at 10, 4 at 14); Siege Machine slots 1 from level 6 and 2 from level 12 (only one siege can be used per battle). Donation levels are capped by a 'Laboratory level cap' per CC level (5 at level 1 ... 16 at levels 12-14).
- Defense: in Guard mode, stored troops leave the castle when an attacking unit enters the **trigger radius (13 tiles** per the statistics table; the strategy text says 12). In Sleep mode they do not defend. Defending CC troops, Skeleton Trap skeletons and defending heroes can jump over Walls.
- Deployment order of defending troops: lower housing space first; ties broken by an internal troop ID (roughly release order - e.g. Barbarian > Archer > Goblin; Giant > Balloon > Hog Rider > Super Barbarian); same troop type leaves lowest level first.
- Treasury: holds Star Bonus / war / Clan Games loot independent of CC level; attackers can steal only 3%. Client treasury caps grow with CC level.
- Donation XP: 1 per troop housing space, 5 per spell housing space, 30 per Siege Machine.

### Recent balance notes (from the page's History table)

- November 17, 2025: level 14 added; level 13 cheaper/faster.
- March 24-27, 2025: upgrade cost/time cuts; spell gem donation cost 5 -> 3 per housing space.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH1: 1*#, TH2: 1*, TH3: 1

Size: 3x3

**Statistics**

| Level | Hitpoints | Troop Capacity | Spell Capacity | Siege Machine Capacity | Laboratory Level Cap&#8224; | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 600 | 10 | - | - | 5 | 10,000 | N/A | N/A | 2* |
| 2 | 1,200 | 15 | - | - | 6 | 50,000 | 2h | 84 | 4 |
| 3 | 1,800 | 20 | - | - | 7 | 600,000 | 12h | 207 | 6 |
| 4 | 2,600 | 25 | 1 | - | 8 | 1,200,000 | 1d | 293 | 8 |
| 5 | 3,000 | 30 | 1 | - | 9 | 2,000,000 | 1d 12h | 360 | 9 |
| 6 | 3,400 | 35 | 1 | 1 | 10 | 3,000,000 | 2d | 415 | 10 |
| 7 | 4,000 | 35 | 2 | 1 | 11 | 5,000,000 | 3d | 509 | 11 |
| 8 | 4,400 | 40 | 2 | 1 | 12 | 5,000,000 | 4d | 587 | 12 |
| 9 | 4,800 | 45 | 2 | 1 | 13 | 8,000,000 | 6d | 720 | 13 |
| 10 | 5,200 | 45 | 3 | 1 | 14 | 10,000,000 | 7d | 777 | 14 |
| 11 | 5,400 | 50 | 3 | 1 | 15 | 12,000,000 | 8d | 831 | 15 |
| 12 | 5,600 | 50 | 3 | 2 | 16 | 14,500,000 | 9d | 881 | 16 |
| 13 | 5,800 | 55 | 3 | 2 | 16 | 19,000,000 | 10d | 929 | 17 |
| 14 | 6,000 | 55 | 4 | 2 | 16 | 28,000,000 | 14d | 1,099 | 18 |

**Statistics**

| Trigger Radius |
|---|
| 13 tiles |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 14 | 0 |
| Statistics | cost | 14 | 0 |
| Statistics | troopCapacity | 14 | 0 |
| Statistics | buildSeconds | 13 | 0 |
| Statistics | townHall | 13 | 0 |
| Statistics | xp | 13 | 0 |
| Statistics | spellCapacity | 11 | 0 |
| Statistics | siegeMachineCapacity | 9 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Clan Castle`): 18/18 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall | 1 | 2* (TH3 in normal play) | 3 | client TownHallLevel 3 for rebuilding; the wiki footnote allows TH2 only with purchased storage |
| triggerRadius | all | 13 tiles (table) / 12 tiles (strategy text) | globals CLAN_CASTLE_RADIUS 13; CASTLE_DEFENDER_SEARCH_RADIUS 9 | table value matches the client; the strategy text is inconsistent |

**Game table check** (`reference/full-client/progression.json` -> `clancastle` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `Hitpoints`, `BuildCost` (Elixir), build time and `TownHallLevel` match levels 2-14.
- Capacities: `HousingSpace` (troops), `HousingSpaceAlt` (spells), `HousingSpaceSiege` (siege machines) - all match the wiki.
- `Bunker` TRUE (houses defenders); `BuildingClass` Army with `SecondaryTargetingClass` Resource; `LootOnDestruction` TRUE; `Locked` TRUE with `ExportNameLocked` for the ruin.
- Treasury caps: `MaxStoredWarGold`/`MaxStoredWarElixir` (75,000 ... 5,200,000) and `MaxStoredWarDarkElixir` (500 ... 26,000) - not on this wiki page.
- Trigger radius is global: `CLAN_CASTLE_RADIUS` 13; defending troops search with `CASTLE_DEFENDER_SEARCH_RADIUS` 9. The deployment-order rule is engine logic (housing space, then data order, then level).
- The Laboratory level cap per CC level is not in this row.
