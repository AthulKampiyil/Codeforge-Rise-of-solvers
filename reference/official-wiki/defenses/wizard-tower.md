# Wizard Tower

- Source: [Wizard Tower](https://clashofclans.fandom.com/wiki/Wizard_Tower) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625327`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `buildings.csv` -> `Wizard Tower` (17 levels)

## Mechanics

- Unlocked at Town Hall 5. Count (wiki): TH5 1, TH6 2, TH8 3, TH9 4, TH11 5, TH18 6 (2 remain if all Super Wizard Towers are built). Footprint 3x3.
- Range 7 tiles, attack every 1.3 s, no blind spot, targets ground and air.
- Splash radius 1 tile around the target, but each blast damages only the layer (ground or air) of the unit it targeted: a blast at a Giant does not hurt Balloons above it and vice versa.
- Damage per shot = DPS x 1.3 (level 17: 110 DPS / 143 per shot).
- Merging: at TH18 two level 17 Wizard Towers merge into a Super Wizard Tower. Its Supercharge levels were removed permanently in the TH18 update.

### Recent balance notes (from the page's History table)

- November 17, 2025 (TH18 update): sixth Wizard Tower added; Supercharges removed permanently; level 17 cost and time reduced (current table: 14,000,000 Gold, 5d 12h - same as the client).
- June 3, 2024: hitpoints reduced at levels 9-14.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH5: 1, TH6: 2, TH8: 3, TH9: 4, TH11: 5, TH18: 6/2*

Size: 3x3

**Statistics**

| Level | Damage per Second | Damage per Shot | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 11 | 14.3 | 620 | 100,000 | 1h | 60 | 5 |
| 2 | 13 | 16.9 | 650 | 150,000 | 1h 30m | 73 | 5 |
| 3 | 16 | 20.8 | 680 | 250,000 | 4h | 120 | 6 |
| 4 | 20 | 26 | 730 | 400,000 | 8h | 169 | 7 |
| 5 | 24 | 31.2 | 840 | 550,000 | 10h | 189 | 8 |
| 6 | 32 | 41.6 | 960 | 660,000 | 12h | 207 | 8 |
| 7 | 40 | 52 | 1,200 | 1,000,000 | 18h | 254 | 9 |
| 8 | 45 | 58.5 | 1,440 | 1,100,000 | 20h | 268 | 10 |
| 9 | 50 | 65 | 1,600 | 1,300,000 | 1d | 293 | 10 |
| 10 | 62 | 80.6 | 1,900 | 2,000,000 | 1d 6h | 328 | 11 |
| 11 | 70 | 91 | 2,120 | 2,500,000 | 1d 12h | 360 | 12 |
| 12 | 78 | 101.4 | 2,240 | 2,600,000 | 1d 18h | 388 | 13 |
| 13 | 84 | 109.2 | 2,500 | 3,000,000 | 2d | 415 | 13 |
| 14 | 90 | 117 | 2,800 | 4,500,000 | 3d | 509 | 14 |
| 15 | 95 | 123.5 | 3,000 | 5,500,000 | 4d | 587 | 15 |
| 16 | 102 | 132.6 | 3,150 | 8,000,000 | 4d 12h | 623 | 16 |
| 17 | 110 | 143 | 3,300 | 14,000,000 | 5d 12h | 689 | 17 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 7 | 1.3s | Splash - 1 tile | Ground & Air |

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

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Wizard Tower`): 14/14 TH levels match.

No mismatches found in the compared fields.

**Game table check** (`reference/full-client/progression.json` -> `wizardtower` vs wiki): no discrepancies in hp/cost/time/dps/damage/range/rate.

**Interpretation of client columns**

- `AttackRange` 700, `AttackSpeed` 1300, `DamageRadius` 100 (1 tile), air+ground; per shot = `DPS` x 1.3 matches all 17 levels.
- `DefenderCharacter` (Wizard..Wizard13) is the cosmetic wizard on top.
- `Wizard Tower Mini Levels` still exists in mini_levels.csv but with `RequiredTownHallLevel` 100 and it is not linked from the building rows - consistent with the wiki saying supercharges were removed.
- The layer-restricted splash is not a column here; the projectile/splash code must apply damage only to units sharing the primary target's air/ground layer.
