# Wall

- Source: [Wall/Home Village](https://clashofclans.fandom.com/wiki/Wall/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `622801`; retrieved 2026-09-15
- Category: building
- Client reference (18.400.21): `buildings.csv` -> `Wall` (19 levels)

## Mechanics

- Unlocked at Town Hall 2. Pieces per TH (wiki): TH2 25, TH3 50, TH4 75, TH5 100, TH6 125, TH7 175, TH8 225, TH9 250, TH10 275, TH11 300, TH14 325. Footprint 1x1 per piece; adjacent pieces connect visually.
- Upgrades are instant (no build time on the page) and paid in Gold; from level 5 Elixir can be used instead; Wall Rings can replace the resource cost (1 ring per level up to level 12, then 2, 3, 4, 5, 7, 10 rings).
- Hitpoints: 100 at level 1 up to 14,000 at level 19 (the highest-HP structure in the Home Village).
- Level 19 is capped to a limited number of pieces: 125 at launch (Nov 2025), 200 from Feb 23, 2026 and 275 from Apr 27, 2026.
- Pathing: Walls block ground units, which must break through or path around gaps (funnels). Units that ignore or hop Walls: Hog Riders, Miners, Headhunters, Yetimites, Root Riders (who also destroy walls they pass), Druids in human form, the Grand Warden, Royal Champion, Meteormites and all ground pets except the Mighty Yak. Air units ignore Walls; air troops never target them.
- Wall-specialist attackers (troop-side rules): Wall Breakers / Super Wall Breakers target Walls and deal 40x damage with splash that can hit two layers; Battle Ram 40x to one Wall; Super Giant, Wall Wrecker, Stone Slammer, Log Launcher, Mighty Yak and M.E.C.H.A deal extra wall damage; Jump Spells let ground troops cross; four Earthquake Spells destroy any Wall in range.
- Walls do not count toward the destruction percentage.

### Recent balance notes (from the page's History table)

- April 27, 2026: level 19 cap raised to 275 pieces (from 200, Feb 23, 2026).
- November 17, 2025: level 19 added (125 pieces); level 18 cost 8M -> 7M.
- June 30, 2025: hitpoints reduced at levels 13-18 (e.g. level 18 15,500 -> 13,000).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH2: 25, TH3: 50, TH4: 75, TH5: 100, TH6: 125, TH7: 175, TH8: 225, TH9: 250, TH10: 275, TH11: 300, TH14: 325

Size: 1x1

**Statistics**

| Level | Hitpoints | Cost | Cumulative Cost | Cost | Cumulative Cost | Cost | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 100 | 0 | 0 | N/A | N/A | N/A | 2 |
| 2 | 200 | 1,000 | 1,000 | N/A | N/A | 1 | 2 |
| 3 | 400 | 5,000 | 6,000 | N/A | N/A | 1 | 3 |
| 4 | 800 | 10,000 | 16,000 | N/A | N/A | 1 | 4 |
| 5 | 1,200 | 20,000 | 36,000 | 20,000 | 20,000 | 1 | 5 |
| 6 | 1,800 | 30,000 | 66,000 | 30,000 | 50,000 | 1 | 6 |
| 7 | 2,400 | 50,000 | 116,000 | 50,000 | 100,000 | 1 | 7 |
| 8 | 3,000 | 75,000 | 191,000 | 75,000 | 175,000 | 1 | 8 |
| 9 | 3,500 | 100,000 | 291,000 | 100,000 | 275,000 | 1 | 9 |
| 10 | 4,000 | 200,000 | 491,000 | 200,000 | 475,000 | 1 | 9 |
| 11 | 5,000 | 500,000 | 991,000 | 500,000 | 975,000 | 1 | 10 |
| 12 | 7,000 | 1,000,000 | 1,991,000 | 1,000,000 | 1,975,000 | 1 | 11 |
| 13 | 8,000 | 1,500,000 | 3,491,000 | 1,500,000 | 3,475,000 | 2 | 12 |
| 14 | 9,000 | 2,000,000 | 5,491,000 | 2,000,000 | 5,475,000 | 2 | 13 |
| 15 | 10,000 | 3,000,000 | 8,491,000 | 3,000,000 | 8,475,000 | 3 | 14 |
| 16 | 11,000 | 4,000,000 | 12,491,000 | 4,000,000 | 12,475,000 | 4 | 15 |
| 17 | 12,000 | 5,000,000 | 17,491,000 | 5,000,000 | 17,475,000 | 5 | 16 |
| 18 | 13,000 | 7,000,000 | 24,491,000 | 7,000,000 | 24,475,000 | 7 | 17 |
| 19 | 14,000 | 10,000,000 | 34,491,000 | 10,000,000 | 34,475,000 | 10 | 18 |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 19 | 0 |
| Statistics | townHall | 19 | 0 |
| Statistics | costGold | 19 | 0 |
| Statistics | costWallRing | 18 | 0 |
| Statistics | costElixir | 15 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Wall`): 17/17 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| level19PieceCap | 19 | 275 | not found in buildings/townhall_levels/globals | the per-level piece cap is probably server-controlled; implement as data |

**Game table check** (`reference/full-client/progression.json` -> `wall` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `Hitpoints`, `BuildCost`, `TownHallLevel` match all 19 levels; build time is 0 (instant).
- `AltBuildResource` Elixir from level 5 = the Elixir cost column (same amount).
- Wall Ring cost = ceil(`BuildCost` / `StartUpgradeBoosterCostDivisor` 1,000,000) - reproduces the wiki's ring column (1 ... 10). The Wall Ring booster itself is in boosters.csv (`Wall Ring`, MaxItems 25).
- Piece counts per TH come from townhall_levels.csv column `Wall` (TH2 25 ... TH14-18 325) - match.
- `WallCornerPieces`, `UseCustomCornerPiecesIn*` are visual connection rules only.
- The list of wall-ignoring units is troop-side data (jumper/ignore-wall flags), not on this row.
