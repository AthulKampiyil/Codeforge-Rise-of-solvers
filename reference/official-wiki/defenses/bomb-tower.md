# Bomb Tower

- Source: [Bomb Tower/Home Village](https://clashofclans.fandom.com/wiki/Bomb_Tower/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `624487`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Bomb Tower` (13 levels)

## Mechanics

- Unlocked at Town Hall 8. Count (wiki): TH8 1, TH10 2. Footprint 3x3.
- Range 6 tiles (the shortest-range damaging defense in the Home Village), one bomb every 1.1 s, **ground only**, splash radius 1.5 tiles. Damage per shot = DPS x 1.1 (level 13: 122 DPS / 134.2).
- Death damage: when destroyed, the bomb under the tower arms and explodes **1 second later**, hitting all ground units within **2.75 tiles** (level 1: 150, level 13: 700). Troops can be killed by it after the tower is gone; a Blimp's own death damage can trigger it early.
- Supercharge (TH18 at level 13): charge 1 +5 DPS (127 / 139.7 per shot), charge 2 +100 HP (3,150).

### Recent balance notes (from the page's History table)

- November 17, 2025 (TH18 update): level 13 added; level 12 made cheaper/faster; supercharges re-based (the page's note mentions levels 15/16 but refers to the current max level).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH8: 1, TH10: 2

Size: 3x3

**Statistics**

| Level | Damage per Second | Damage per Shot | Damage when destroyed | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 24 | 26.4 | 150 | 650 | 700,000 | 12h | 207 | 8 |
| 2 | 28 | 30.8 | 180 | 700 | 1,000,000 | 18h | 254 | 8 |
| 3 | 32 | 35.2 | 220 | 750 | 1,300,000 | 1d | 293 | 9 |
| 4 | 40 | 44 | 260 | 850 | 1,800,000 | 1d 12h | 360 | 10 |
| 5 | 48 | 52.8 | 300 | 1,050 | 1,900,000 | 1d 18h | 388 | 11 |
| 6 | 56 | 61.6 | 350 | 1,300 | 2,000,000 | 2d | 415 | 11 |
| 7 | 64 | 70.4 | 400 | 1,600 | 4,000,000 | 3d | 509 | 12 |
| 8 | 72 | 79.2 | 450 | 1,900 | 5,000,000 | 3d 12h | 549 | 13 |
| 9 | 84 | 92.4 | 500 | 2,300 | 6,000,000 | 4d | 587 | 14 |
| 10 | 94 | 103.4 | 550 | 2,500 | 7,000,000 | 4d 12h | 623 | 15 |
| 11 | 104 | 114.4 | 600 | 2,700 | 8,500,000 | 5d | 657 | 16 |
| 12 | 114 | 125.4 | 650 | 2,900 | 14,500,000 | 7d | 777 | 17 |
| 13 | 122 | 134.2 | 700 | 3,050 | 25,000,000 | 13d | 1,059 | 18 |

**Supercharges**

| Charge Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 127 | 139.7 | 3,050 | 6,000,000 | 2d 12h | 464 | 18 |
| 2 | 127 | 139.7 | 3,150 | 3,000,000 | 4d | 587 | 18 |

**Supercharges**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 6 tiles | 1.1s | Splash - 1.5 tiles | Ground |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | hitpoints | 13 | 0 |
| Statistics | cost | 13 | 0 |
| Statistics | buildSeconds | 13 | 0 |
| Statistics | townHall | 13 | 0 |
| Statistics | xp | 13 | 0 |
| Statistics | dps | 13 | 0 |
| Statistics | damagePerHit | 13 | 0 |
| Statistics | damageWhenDestroyed | 13 | 0 |
| Supercharges | cost | 2 | 0 |
| Supercharges | buildSeconds | 2 | 0 |
| Supercharges | townHall | 2 | 0 |
| Supercharges | hitpoints | 2 | 0 |
| Supercharges | dps | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Bomb Tower`): 11/11 TH levels match.

No mismatches found in the compared fields.

**Game table check** (`reference/full-client/progression.json` -> `bombtower` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `AttackRange` 600, `AttackSpeed` 1100, `DamageRadius` 150, ground only; per shot = `DPS` x 1.1 matches all 13 levels.
- Death damage: `DieDamage` (150..700, matches every level), `DieDamageRadius` 275 (2.75 tiles), `DieDamageDelay` 1000 ms.
- `DefenderCharacter` BomberTower_lvlN is the cosmetic bomber on top.
- Supercharge `Bomb Tower Mini Levels`: charge 1 DPS +5, charge 2 Hitpoints +100; 6M / 3M Gold, 2d12h / 4d; TH18 - all match.
- progression.json has no death-damage fields for the Bomb Tower.
