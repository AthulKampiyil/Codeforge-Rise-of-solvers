# Bomb

- Source: [Bomb](https://clashofclans.fandom.com/wiki/Bomb) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `622989`; retrieved 2026-09-15
- Category: trap
- Client reference (18.400.21): `traps.csv` -> `Bomb` (14 levels)

## Mechanics

- Unlocked at Town Hall 3. Count (wiki): TH3 2, TH5 4, TH7 6, TH13 7, TH14 8. Footprint 1x1. Traps need no builder to place or re-arm but need one to upgrade.
- Hidden from attackers until triggered. Triggered by ground units only, when one enters the 1.5-tile trigger radius; it explodes about 1.5 s later, so troops that keep moving can escape.
- Explosion: area damage to all ground units within 3 tiles (level 1: 20 ... level 14: 200). Knocks back ground troops of 3 housing space or less (less push for bigger troops).
- Skeletons (and other units that cannot trigger traps) do not set it off but are hit if it explodes.
- Re-arming after use is free and automatic on login; untriggered traps stay armed. In Clan Wars, Legend League and Friendly Battles traps are always active. If the battle ends before the delayed explosion, the Bomb stays armed.
- Traps do not count toward destruction percentage and have no no-deploy (red) zone.

### Recent balance notes (from the page's History table)

- November 17, 2025: level 14 added; level 13 cheaper/faster.
- November 25, 2024: level 13 added.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH3: 2, TH5: 4, TH7: 6, TH13: 7, TH14: 8

Size: 1x1

**Statistics**

| Level | Damage | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 20 | 400 | N/A | N/A | 3 |
| 2 | 24 | 1,000 | 1m | 7 | 3 |
| 3 | 29 | 10,000 | 5m | 17 | 5 |
| 4 | 35 | 40,000 | 40m | 48 | 7 |
| 5 | 42 | 100,000 | 1h | 60 | 8 |
| 6 | 54 | 230,000 | 2h | 84 | 9 |
| 7 | 72 | 330,000 | 3h | 103 | 10 |
| 8 | 92 | 500,000 | 4h | 120 | 11 |
| 9 | 125 | 750,000 | 6h | 146 | 13 |
| 10 | 140 | 1,300,000 | 12h | 207 | 14 |
| 11 | 155 | 2,500,000 | 18h | 254 | 15 |
| 12 | 170 | 4,000,000 | 1d | 293 | 16 |
| 13 | 185 | 8,500,000 | 2d | 415 | 17 |
| 14 | 200 | 14,000,000 | 8d | 831 | 18 |

**Statistics**

| Trigger Radius | Damage Radius | Damage Type | Unit Type Targeted | Favorite Target |
|---|---|---|---|---|
| 1.5 tiles | 3 tiles | Area Splash | Ground | None |

**Statistics**

| Unarmed Bombs | Unarmed Bombs | Unarmed Bombs | Unarmed Bombs | Unarmed Bombs | Unarmed Bombs | Unarmed Bombs | Unarmed Bombs |
|---|---|---|---|---|---|---|---|
| Level 1-2 | Level 3-4 | Level 5-6 | Level 7-8 | Level 9-10 | Level 11-12 | Level 13-14 |  |
|  |  |  |  |  |  |  |  |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | cost | 14 | 0 |
| Statistics | townHall | 13 | 1 |
| Statistics | damagePerHit | 14 | 0 |
| Statistics | buildSeconds | 12 | 1 |
| Statistics | xp | 12 | 1 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Bomb`): 16/16 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall | 1 | 3 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |
| buildSeconds | 4 | 2400 | 1800 | level 4 build time: wiki 40m (XP 48) vs client 30m (XP 42) |
| xp | 4 | 48 | 42 | follows the build time difference |

**Game table check** (`reference/full-client/progression.json` -> `bomb` vs wiki): 2 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| townhall | 1 | 3 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |
| seconds | 4 | 2400 | 1800 | level 4 build time differs (see above) |

**Interpretation of client columns**

- Constants verified equal (wiki vs client): `triggerRadius`, `damageRadius`.
- `Damage` per level matches. `GroundTrigger` TRUE / `AirTrigger` FALSE; `MinTriggerHousingLimit` 1.
- `ActionFrame` 35 is the arming animation frame at which it explodes (the ~1.5 s delay).
- Knockback: `Pushback` 100 with `PushbackHousingLimit` 3.
- `Passable` TRUE: units walk over it; `EjectVictims` FALSE.
