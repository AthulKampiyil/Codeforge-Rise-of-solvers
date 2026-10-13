# Spring Trap

- Source: [Spring Trap/Home Village](https://clashofclans.fandom.com/wiki/Spring_Trap/Home_Village) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `623249`; retrieved 2026-09-15
- Category: trap
- Client reference (18.400.21): `traps.csv` -> `Spring Trap` (13 levels)

## Mechanics

- Unlocked at Town Hall 4. Count (wiki): TH4 2, TH6 4, TH8 6, TH12 8, TH13 9. Footprint 1x1.
- Trigger: a ground unit within 1 tile. It targets the **unit with the highest housing space** in its radius (reworked October 6, 2025: it ejects only one unit, not several adding up to its capacity).
- If that unit's housing space is at or below the spring capacity (10 at level 1, 12/14/16 at levels 2-4, 18 from level 5), it is thrown off the map (instantly removed, no tombstone/death effects). If the unit is larger, it is launched upward, stunned briefly and (from level 2) takes heavy damage (250 ... 1,400); if that damage kills it, it is thrown away too. Heroes defeated this way stay where they fell.
- Damage against Heroes, Pets and Siege Machines is halved; Siege Machines are never launched.
- Short activation delay: fast units (movement speed 32+, e.g. Goblins) can cross unaffected unless they stop on it; slower units can dodge by clipping a corner.
- Re-armed for free on login, like other traps.

### Recent balance notes (from the page's History table)

- November 17, 2025: level 13 added.
- October 6, 2025: levels 6-12 added and the single-target rework (throw the highest-housing unit; stun and damage bigger ones).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH4: 2, TH6: 4, TH8: 6, TH12: 8, TH13: 9

Size: 1x1

**Statistics**

| Level | Spring Capacity | Damage | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | 10 | 0 | 2,000 | N/A | N/A | 4 |
| 2 | 12 | 250 | 130,000 | 1h | 60 | 7 |
| 3 | 14 | 300 | 240,000 | 2h | 84 | 8 |
| 4 | 16 | 350 | 350,000 | 3h | 103 | 9 |
| 5 | 18 | 400 | 800,000 | 4h | 120 | 10 |
| 6 | 18 | 500 | 1,000,000 | 6h | 146 | 11 |
| 7 | 18 | 600 | 1,700,000 | 8h | 169 | 12 |
| 8 | 18 | 750 | 2,000,000 | 12h | 207 | 13 |
| 9 | 18 | 900 | 3,000,000 | 18h | 254 | 14 |
| 10 | 18 | 1,050 | 4,000,000 | 1d | 293 | 15 |
| 11 | 18 | 1,200 | 6,000,000 | 2d | 415 | 16 |
| 12 | 18 | 1,300 | 13,000,000 | 3d | 509 | 17 |
| 13 | 18 | 1,400 | 16,000,000 | 11d | 974 | 18 |

**Statistics**

| Trigger Radius | Damage Type | Unit Type Targeted | Favorite Target | Special Ability |
|---|---|---|---|---|
| 1 tile | Single Target | Ground | Highest housing space troop | Powerful Push |

**Statistics**

| Unarmed Spring Traps | Unarmed Spring Traps | Unarmed Spring Traps | Unarmed Spring Traps | Unarmed Spring Traps | Unarmed Spring Traps | Unarmed Spring Traps | Unarmed Spring Traps |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |
| Level 1-2 | Level 3-6 | Level 7-13 |  |  |  |  |  |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | cost | 13 | 0 |
| Statistics | townHall | 12 | 1 |
| Statistics | damagePerHit | 13 | 0 |
| Statistics | springCapacity | 13 | 0 |
| Statistics | buildSeconds | 12 | 0 |
| Statistics | xp | 12 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Spring Trap`): 15/15 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall | 1 | 4 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |

**Game table check** (`reference/full-client/progression.json` -> `springtrap` vs wiki): 1 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| townhall | 1 | 4 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |

**Interpretation of client columns**

- Constants verified equal (wiki vs client): `triggerRadius`.
- `EjectHousingLimit` 10..18 = spring capacity and `Damage` 0..1,400 - both match every level (checked per level).
- `TargetHighestHousing` TRUE, `AttemptEjectBeforeDamage` TRUE, `EjectWhenKilling` TRUE (a kill also ejects), `EjectRadius` 200, `RadialThrowDistance` 1 / `RadialThrowRadius` 200.
- `HeroDamageReductionPercent`, `PetDamageReductionPercent`, `SiegeDamageReductionPercent` all 50 = the halved damage.
- `ActionFrame` 5 (short arming delay), `TriggerTickModulo` 1; `SpecialAbilities` SpringTrapAbilityInfo from level 2 is the 'Powerful Push' info entry.
- globals `USE_SMART_SPRING_TRAPS` FALSE.
