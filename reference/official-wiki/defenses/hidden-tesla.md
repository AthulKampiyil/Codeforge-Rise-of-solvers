# Hidden Tesla

- Source: [Hidden Tesla/Home Village](https://clashofclans.fandom.com/wiki/Hidden_Tesla/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624470`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Hidden Tesla` (17 levels)

## Mechanics

- Unlocked at Town Hall 7. Count (wiki): TH7 2, TH8 3, TH9 4, TH12 5. Footprint 2x2.
- Hidden until triggered: it pops up when a ground or air unit comes within its 6-tile trigger radius, or when the attacker reaches 51% destruction. Unlike a trap it never needs re-arming. It is visible to its owner and clanmates only.
- Once revealed: range 7 tiles, zap every 0.6 s, single target, ground and air. Damage per shot = DPS x 0.6 (level 17: 190 DPS / 114).
- It is a defensive building, not a trap; while hidden, defense-targeting troops ignore it, and Lightning, Freeze, Overgrowth and Earthquake spells cannot interact with it. An Overgrowth Spell over it will reveal it but disable it until the spell ends.
- Revealing it forces all units to re-target.
- It does not enlarge the no-deploy zone: troops can be dropped onto it (which triggers it). If every revealed building dies before 51% (possible in challenges) unrevealed Teslas stay hidden.
- Supercharge (TH18 at level 17): charge 1 +5 DPS (195 / 117 per shot), charge 2 +50 HP (1,800).

### Recent balance notes (from the page's History table)

- February 23, 2026: level 17 added and supercharges moved to it.
- November 17, 2025: level 16 and charges made cheaper/faster.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH7: 2, TH8: 3, TH9: 4, TH12: 5

Size: 2x2

**Statistics**

| Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 34 | 20.4 | 600 | 250,000 | 2h | 84 | 7 |
| 2 | 40 | 24 | 630 | 350,000 | 3h | 103 | 7 |
| 3 | 48 | 28.8 | 660 | 500,000 | 4h | 120 | 7 |
| 4 | 55 | 33 | 690 | 600,000 | 6h | 146 | 8 |
| 5 | 64 | 38.4 | 730 | 800,000 | 12h | 207 | 8 |
| 6 | 75 | 45 | 770 | 1,200,000 | 1d | 293 | 8 |
| 7 | 87 | 52.2 | 810 | 1,400,000 | 1d 6h | 328 | 9 |
| 8 | 99 | 59.4 | 850 | 1,600,000 | 1d 12h | 360 | 10 |
| 9 | 110 | 66 | 900 | 2,100,000 | 1d 18h | 388 | 11 |
| 10 | 120 | 72 | 980 | 3,000,000 | 2d | 415 | 12 |
| 11 | 130 | 78 | 1,100 | 3,100,000 | 2d 12h | 464 | 13 |
| 12 | 140 | 84 | 1,200 | 3,700,000 | 3d | 509 | 13 |
| 13 | 150 | 90 | 1,350 | 5,100,000 | 3d 12h | 549 | 14 |
| 14 | 160 | 96 | 1,450 | 6,500,000 | 4d | 587 | 15 |
| 15 | 170 | 102 | 1,550 | 8,200,000 | 5d | 657 | 16 |
| 16 | 180 | 108 | 1,650 | 15,000,000 | 7d | 777 | 17 |
| 17 | 190 | 114 | 1,750 | 25,000,000 | 13d | 1,059 | 18 |

**Supercharges**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 195 | 117 | 1,750 | 12,000,000 | 4d 12h | 623 | 18 |
| 2 | 195 | 117 | 1,800 | 8,000,000 | 6d 12h | 749 | 18 |

**Supercharges**

| Range | Trigger Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|---|
| 7 | 6 | 0.6s | Single Target | Ground & Air |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 17 | 0 |
| Statistics | cost | 17 | 0 |
| Statistics | buildSeconds | 17 | 0 |
| Statistics | townHall | 17 | 0 |
| Statistics | xp | 17 | 0 |
| Statistics | dps | 17 | 0 |
| Statistics | damagePerHit | 17 | 0 |
| Supercharges | cost | 2 | 0 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Hidden Tesla`): 12/12 TH levels match.

No mismatches found in the compared fields.

**Game table check** (`reference/full-client/progression.json` -> `tesla` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `Hidden` TRUE and `TriggerRadius` 600 (6 tiles) encode the pop-up rule; `AttackRange` 700, `AttackSpeed` 600; per shot = `DPS` x 0.6 matches all 17 levels.
- The 51% reveal is not a column on the Tesla; it is a battle-global rule (the Town Hall weapons use the same threshold).
- Supercharge: `Hidden Tesla Mini Levels` charge 1 DPS +5, charge 2 Hitpoints +50; 12M / 8M Gold; 4d12h / 6d12h; TH18 - all match.
