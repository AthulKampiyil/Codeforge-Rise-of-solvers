# Air Bomb

- Source: [Air Bomb](https://clashofclans.fandom.com/wiki/Air_Bomb) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `623237`; retrieved 2026-09-15
- Category: trap
- Client reference (18.400.21): `traps.csv` -> `Air Bomb` (13 levels)

## Mechanics

- Unlocked at Town Hall 5; the first anti-air trap. Count (wiki): TH5 2, TH8 4, TH10 5, TH12 6, TH14 7, TH18 8. Footprint 1x1.
- Triggered when an air unit comes within 4 tiles. After its trapdoor animation it rises and **follows the nearest flying unit**, exploding on contact (or where the target died) for area damage to air units within 3 tiles (level 1: 100 ... level 13: 425).
- Retarget quirk: if other air units are within twice its activation radius when the trigger unit dies during the animation, it switches to them. Fast flyers can outrun it.
- Very effective against Minions, Lava Pups and Bats; much less against high-HP flyers.
- Free automatic re-arm on login.

### Recent balance notes (from the page's History table)

- April 27, 2026: eighth Air Bomb at TH18; build times of levels 7-12 (except 9) reduced.
- November 17, 2025: level 13 added.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH5: 2, TH8: 4, TH10: 5, TH12: 6, TH14: 7, TH18: 8

Size: 1x1

**Statistics**

| Level | Damage | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 100 | 4,000 | N/A | N/A | 5 |
| 2 | 120 | 20,000 | 30m | 42 | 5 |
| 3 | 144 | 75,000 | 1h | 60 | 7 |
| 4 | 173 | 300,000 | 4h | 120 | 9 |
| 5 | 208 | 550,000 | 8h | 169 | 11 |
| 6 | 232 | 800,000 | 12h | 207 | 12 |
| 7 | 252 | 1,000,000 | 14h | 224 | 13 |
| 8 | 280 | 1,200,000 | 16h | 240 | 13 |
| 9 | 325 | 2,000,000 | 1d | 293 | 14 |
| 10 | 350 | 3,000,000 | 1d 12h | 360 | 15 |
| 11 | 375 | 5,000,000 | 2d | 415 | 16 |
| 12 | 400 | 9,500,000 | 3d | 509 | 17 |
| 13 | 425 | 15,000,000 | 9d | 881 | 18 |

**Statistics**

| Trigger Radius | Damage Radius | Damage Type | Unit Type Targeted | Favorite Target |
|---|---|---|---|---|
| 4 tiles | 3 tiles | Area Splash | Air | None |

**Statistics**

| Unarmed Air Bomb | Unarmed Air Bomb | Unarmed Air Bomb | Unarmed Air Bomb | Unarmed Air Bomb | Unarmed Air Bomb | Unarmed Air Bomb | Unarmed Air Bomb |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | cost | 13 | 0 |
| Statistics | townHall | 12 | 1 |
| Statistics | damagePerHit | 13 | 0 |
| Statistics | buildSeconds | 12 | 0 |
| Statistics | xp | 12 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Air Bomb`): 14/14 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall | 1 | 5 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |

**Game table check** (`reference/full-client/progression.json` -> `airbomb` vs wiki): 2 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| townhall | 1 | 5 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |
| targets | all | air | ground | progression.json marks the Air Bomb as a ground trap (AirTrigger not read) |

**Interpretation of client columns**

- Constants verified equal (wiki vs client): `triggerRadius`, `damageRadius`.
- `Damage` per level, cost, build time and required TH (levels 2-13) match; the count column already includes the eighth TH18 Air Bomb (April 2026).
- `AirTrigger` TRUE / `GroundTrigger` FALSE; `ActionFrame` 7. The chase behaviour is not a column (engine behaviour of air-triggered damage traps).
