# Seeking Air Mine

- Source: [Seeking Air Mine](https://clashofclans.fandom.com/wiki/Seeking_Air_Mine) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `623233`; retrieved 2026-09-15
- Category: trap
- Client reference (18.400.21): `traps.csv` -> `Seeking Air Mine` (8 levels)

## Mechanics

- Unlocked at Town Hall 7. Count (wiki): TH7 1, TH8 2, TH9 4, TH10 5, TH12 6, TH13 7, TH14 8, TH17 9. Footprint 1x1.
- Triggered by a single air unit of **at least 5 housing space** within 4 tiles (Healers, air Siege Machines, flying Heroes and Pets included). Housing space is not summed across units. Minions, Lava Pups, Bats and other sub-5 flyers neither trigger it nor take damage from it (threshold raised from 4 to 5 on March 24, 2025).
- Seeks its target and deals heavy single-target damage (level 1: 1,500 ... level 8: 3,350). No stun.
- The Angry Jelly cannot be targeted while it is brainwashing a Hero.
- Free automatic re-arm; always armed in Clan Wars and Legend League.

### Recent balance notes (from the page's History table)

- February 23, 2026: level 8 added.
- November 17, 2025: level 7 cheaper/faster.
- March 24, 2025: trigger housing space 4 -> 5.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH7: 1, TH8: 2, TH9: 4, TH10: 5, TH12: 6, TH13: 7, TH14: 8, TH17: 9

Size: 1x1

**Statistics**

| Level | Damage | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 1,500 | 12,000 | N/A | N/A | 7 |
| 2 | 1,800 | 600,000 | 6h | 146 | 9 |
| 3 | 2,100 | 1,200,000 | 1d | 293 | 10 |
| 4 | 2,500 | 2,500,000 | 1d 12h | 360 | 13 |
| 5 | 2,800 | 5,000,000 | 2d | 415 | 15 |
| 6 | 3,000 | 6,500,000 | 3d | 509 | 16 |
| 7 | 3,200 | 12,000,000 | 5d | 657 | 17 |
| 8 | 3,350 | 19,000,000 | 11d 12h | 996 | 18 |

**Statistics**

| Trigger Radius | Damage Type | Unit Type Targeted | Favorite Target |
|---|---|---|---|
| 4 tiles | Single Target | Air | None |

**Statistics**

| Unarmed Seeking Air Mine | Unarmed Seeking Air Mine | Unarmed Seeking Air Mine | Unarmed Seeking Air Mine | Unarmed Seeking Air Mine | Unarmed Seeking Air Mine | Unarmed Seeking Air Mine | Unarmed Seeking Air Mine |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | cost | 8 | 0 |
| Statistics | townHall | 7 | 1 |
| Statistics | damagePerHit | 8 | 0 |
| Statistics | buildSeconds | 6 | 1 |
| Statistics | xp | 6 | 1 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Seeking Air Mine`): 12/12 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall | 1 | 7 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |
| buildSeconds | 3 | 86400 | 43200 | level 3 build time: wiki 1d (XP 293) vs client 12h (XP 207) |
| xp | 3 | 293 | 207 | follows the build time difference |

**Game table check** (`reference/full-client/progression.json` -> `seekingairmine` vs wiki): 3 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| townhall | 1 | 7 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |
| seconds | 3 | 86400 | 43200 | level 3 build time differs (see above) |
| targets | all | air | ground | progression.json marks the Seeking Air Mine as a ground trap (AirTrigger not read) |

**Interpretation of client columns**

- Constants verified equal (wiki vs client): `triggerRadius`.
- `MinTriggerHousingLimit` 5 = the 5-housing-space rule (post March 2025); `AirTrigger` TRUE; `DamageRadius` 0 (single target); `Damage` per level matches.
