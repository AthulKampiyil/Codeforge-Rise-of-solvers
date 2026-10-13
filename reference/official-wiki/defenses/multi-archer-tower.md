# Multi-Archer Tower

- Source: [Multi-Archer Tower](https://clashofclans.fandom.com/wiki/Multi-Archer_Tower) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624863`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Multi Archer Tower` (4 levels)

## Mechanics

- Unlocked at Town Hall 16 by **merging two level 21 Archer Towers that are not geared up**. The merge is permanent (no split). Count (wiki): TH16 2, TH17 3. All possible merges must be completed before the next Town Hall upgrade. Footprint 3x3.
- Range 10 tiles, attack every 0.6 s (slowed from 0.5 s on Jan 28, 2026), ground and air.
- Three archers fire independently: with 3+ units in range each archer shoots a different unit; with 2 units the closer one takes two archers' fire (if both are equally far and far apart, the first-deployed unit takes two; if the two are close together the third archer alternates); with 1 unit all three focus it.
- Damage per arrow = 60 (level 1) to 73 (level 4); displayed DPS per archer = arrow / 0.6 s (100-121). Total potential DPS is 3x that.
- Supercharge (TH18 at level 4): charge 1 +5 DPS per archer (126 / 76 per arrow), charge 2 +100 HP (5,600).

### Recent balance notes (from the page's History table)

- January 28, 2026: attack speed 0.5 s -> 0.6 s.
- November 17, 2025: level 4 added; supercharges moved to level 4.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH16: 2, TH17: 3

Size: 3x3

**Statistics**

| Level | Damage per Second per Archer | Damage per Hit | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 100 | 60 | 5,000 | 12,000,000 | 7d | 777 | 16 |
| 2 | 108 | 65 | 5,200 | 13,000,000 | 8d | 831 | 16 |
| 3 | 116 | 70 | 5,400 | 17,500,000 | 9d | 881 | 17 |
| 4 | 121 | 73 | 5,500 | 27,000,000 | 14d | 1,099 | 18 |

**Supercharges**

| Charge Level | Damage per Second per Archer | Damage per Shot | Hitpoints | Build Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 126 | 76 | 5,500 | 12,000,000 | 6d | 720 | 18 |
| 2 | 126 | 76 | 5,600 | 10,000,000 | 7d | 777 | 18 |

**Supercharges**

| Number of Targets | Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|---|
| 3 | 10 | 0.6s | Multiple Targets | Ground & Air |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 4 | 0 |
| Statistics | cost | 4 | 0 |
| Statistics | buildSeconds | 4 | 0 |
| Statistics | townHall | 4 | 0 |
| Statistics | xp | 4 | 0 |
| Statistics | damagePerHit | 4 | 0 |
| Statistics | dpsPerArcher | 4 | 0 |
| Supercharges | cost | 2 | 0 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | damagePerHit | 2 | 0 |
| Supercharges | dpsPerArcher | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Multi Archer Tower`): 3/3 TH levels match.

No mismatches found in the compared fields.

**Game table check** (`reference/full-client/progression.json` -> `multiarchertower` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `Damage` (60/65/70/73) is the per-arrow damage and `AttackSpeed` 600 ms (already the Jan 2026 value); there is no DPS column. `MultiTargets` TRUE, `NumMultiTargets` 3, `MultiHitsTarget` TRUE (several archers may shoot the same unit) and `DefenderCount` 3 archers model the target-distribution rules.
- `MergeRequirement` = `Archer Tower:21:0;Archer Tower:21:0` (two level-21 towers, geared-up flag 0).
- Supercharge `Multi Archer Tower Mini Levels`: `DPS` +5 is added on top of Damage/0.6 (121.67 + 5 = 126.67 -> 76 per arrow), charge 2 `Hitpoints` +100; 12M / 10M Gold, 6d / 7d, TH18 - matches.
- progression.json derives dps 121.67 and damage 73 with multiTargets 3 - consistent.
