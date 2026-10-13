# Giant Bomb

- Source: [Giant Bomb](https://clashofclans.fandom.com/wiki/Giant_Bomb) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `622993`; retrieved 2026-09-15
- Category: trap
- Client reference (18.400.21): `traps.csv` -> `Giant Bomb` (12 levels)

## Mechanics

- Unlocked at Town Hall 6. Count (wiki): TH6 1, TH7 2, TH8 3, TH9 4, TH10 5, TH12 6, TH14 7, TH17 8. Footprint 2x2 (same as a Hidden Tesla, useful for bluffing).
- Triggered by a ground unit within 2 tiles; explodes (with a short delay like the Bomb) damaging all ground units in its radius: 3 tiles (level 1), 3.5 (levels 2-3), 4 (levels 4-11), 4.2 (level 12). Damage 175 ... 490.
- Knocks back ground troops of 3 housing space or less.
- If the battle ends before it explodes it remains armed. Free automatic re-arm.

### Recent balance notes (from the page's History table)

- April 27, 2026: level 12 added.
- November 17, 2025: level 11 cheaper/faster.
- March 25, 2025: levels 2-10 cheaper/faster.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH6: 1, TH7: 2, TH8: 3, TH9: 4, TH10: 5, TH12: 6, TH14: 7, TH17: 8

Size: 2x2

**Statistics**

| Level | Damage | Damage Radius | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | 175 | 3 tiles | 12,500 | N/A | N/A | 6 |
| 2 | 200 | 3.5 tiles | 75,000 | 1h | 60 | 6 |
| 3 | 225 | 3.5 tiles | 220,000 | 3h | 103 | 8 |
| 4 | 250 | 4 tiles | 750,000 | 4h | 120 | 10 |
| 5 | 275 | 4 tiles | 900,000 | 10h | 189 | 11 |
| 6 | 325 | 4 tiles | 1,300,000 | 11h | 198 | 13 |
| 7 | 375 | 4 tiles | 1,500,000 | 12h | 207 | 13 |
| 8 | 400 | 4 tiles | 2,000,000 | 1d | 293 | 14 |
| 9 | 425 | 4 tiles | 3,200,000 | 2d | 415 | 15 |
| 10 | 450 | 4 tiles | 5,500,000 | 2d 12h | 464 | 16 |
| 11 | 475 | 4 tiles | 10,000,000 | 4d | 587 | 17 |
| 12 | 490 | 4.2 tiles | 17,000,000 | 10d 12h | 952 | 18 |

**Statistics**

| Trigger Radius | Damage Type | Unit Type Targeted | Favorite Target |
|---|---|---|---|
| 2 tiles | Area Splash | Ground | None |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | cost | 12 | 0 |
| Statistics | townHall | 11 | 1 |
| Statistics | damagePerHit | 12 | 0 |
| Statistics | damageRadius | 12 | 0 |
| Statistics | buildSeconds | 11 | 0 |
| Statistics | xp | 11 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Giant Bomb`): 13/13 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall | 1 | 6 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |

**Game table check** (`reference/full-client/progression.json` -> `giantbomb` vs wiki): 1 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| townhall | 1 | 6 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |

**Interpretation of client columns**

- Constants verified equal (wiki vs client): `triggerRadius`.
- `Damage` and `DamageRadius` (300/350/400/420) match every level.
- `Pushback` 100 / `PushbackHousingLimit` 3; `EjectHousingLimit` 30 (unused - `EjectVictims` FALSE); `ActionFrame` 37.
