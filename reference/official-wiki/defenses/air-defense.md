# Air Defense

- Source: [Air Defense/Home Village](https://clashofclans.fandom.com/wiki/Air_Defense/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624478`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Air Defense` (16 levels)

## Mechanics

- Unlocked at Town Hall 4. Count (wiki): TH4 1, TH6 2, TH7 3, TH9 4. Footprint 3x3.
- Range 10 tiles, one rocket per second, single target, **air only**; it cannot affect ground troops at all (it can only distract them as a target).
- Damage per attack equals DPS because the interval is 1 s (level 16: 700). The rocket explosion is cosmetic: no splash.
- Favorite target of Lava Hounds (troop-side rule).
- Supercharge (TH18 at level 16): both charges raise damage (720, then 740) - unlike other defenses where charge 2 adds hitpoints.

### Recent balance notes (from the page's History table)

- November 2025 (TH18 update): level 16 added; supercharges moved to level 16 (charge 1 670 -> 720 damage, charge 2 690 -> 740). The page's History dates this entry as Nov 25, 2024 (a wiki typo).
- October 6, 2025: level 14 build time 7d -> 6d 12h.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH4: 1, TH6: 2, TH7: 3, TH9: 4

Size: 3x3

**Statistics**

| Level | Damage per Second | Damage per Attack | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 80 | 80 | 800 | 22,000 | 1h | 60 | 4 |
| 2 | 110 | 110 | 850 | 90,000 | 2h | 84 | 4 |
| 3 | 140 | 140 | 900 | 210,000 | 6h | 146 | 5 |
| 4 | 160 | 160 | 950 | 500,000 | 12h | 207 | 6 |
| 5 | 190 | 190 | 1,000 | 800,000 | 18h | 254 | 7 |
| 6 | 230 | 230 | 1,050 | 1,000,000 | 1d | 293 | 8 |
| 7 | 280 | 280 | 1,100 | 1,750,000 | 2d | 415 | 9 |
| 8 | 320 | 320 | 1,210 | 2,300,000 | 2d 12h | 464 | 10 |
| 9 | 360 | 360 | 1,300 | 3,400,000 | 3d | 509 | 11 |
| 10 | 400 | 400 | 1,400 | 5,000,000 | 4d | 587 | 12 |
| 11 | 440 | 440 | 1,500 | 5,600,000 | 4d 12h | 623 | 13 |
| 12 | 500 | 500 | 1,650 | 6,500,000 | 5d | 657 | 14 |
| 13 | 540 | 540 | 1,750 | 8,000,000 | 6d | 720 | 15 |
| 14 | 600 | 600 | 1,850 | 9,000,000 | 6d 12h | 749 | 16 |
| 15 | 650 | 650 | 1,950 | 15,000,000 | 7d | 777 | 17 |
| 16 | 700 | 700 | 2,000 | 26,000,000 | 13d 6h | 1,069 | 18 |

**Supercharges**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 720 | 720 | 2,000 | 6,000,000 | 2d 18h | 487 | 18 |
| 2 | 740 | 740 | 2,000 | 3,000,000 | 4d 6h | 605 | 18 |

**Supercharges**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 10 | 1s | Single Target | Air |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 16 | 0 |
| Statistics | cost | 16 | 0 |
| Statistics | buildSeconds | 16 | 0 |
| Statistics | townHall | 16 | 0 |
| Statistics | xp | 16 | 0 |
| Statistics | dps | 16 | 0 |
| Statistics | damagePerHit | 16 | 0 |
| Supercharges | cost | 2 | 0 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Air Defense`): 15/15 TH levels match.

No mismatches found in the compared fields.

**Game table check** (`reference/full-client/progression.json` -> `airdefense` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `AttackRange` 1000, `AttackSpeed` 1000, `AirTargets` TRUE / `GroundTargets` FALSE; per attack = `DPS` x 1.0.
- `SecondaryTargetingClass` = `Air Defense` is what lets troops (e.g. Lava Hound) prefer it.
- Supercharge: `Air Defense Mini Levels` charge 1 DPS +20, charge 2 DPS +40 (cumulative, HP unchanged), 6M / 3M Gold, 2d18h / 4d6h, TH18 - all match.
