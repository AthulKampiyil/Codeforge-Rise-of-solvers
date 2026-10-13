# Tornado Trap

- Source: [Tornado Trap](https://clashofclans.fandom.com/wiki/Tornado_Trap) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `619079`; retrieved 2026-09-15
- Category: trap
- Client reference (18.400.21): `traps.csv` -> `Tornado Trap` (3 levels)

## Mechanics

- Unlocked at Town Hall 11; one per base. Footprint 1x1. Levels 1-3.
- Triggered by ground or air units within 3 tiles. For its duration (5 / 6 / 7 s) it drags units in a 3-tile area toward and around its center and deals about 8 DPS (total 39 / 47 / 55).
- Pull strength by 'weight class' = housing space / 3 rounded up, capped at 5 (Heroes and Pets count as 5, Siege Machines as 1); lighter classes are moved more, and at the same class air units are moved more than ground units.
- Miners, Super Miners, Diggy and the Battle Drill are not displaced (they still take the damage). Units can keep attacking targets that stay in range.
- Free automatic re-arm (re-arm costs were removed in April 2019).

### Recent balance notes (from the page's History table)

- June 16, 2025: visual effect update.
- December 9, 2021: level 3 cost 3M -> 2.5M.
- April 2, 2019: durations reduced (6/8/10 s -> 5/6/7 s).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH11: 1

Size: 1x1

**Statistics**

| Level | Duration | Total Damage | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | 5 seconds | 39 | 1,800,000 | N/A | N/A | 11 |
| 2 | 6 seconds | 47 | 2,000,000 | 1d | 293 | 11 |
| 3 | 7 seconds | 55 | 2,500,000 | 2d | 415 | 12 |

**Statistics**

| Damage per Second | Trigger Radius | Damage Radius | Damage Type | Unit Type Targeted | Favorite Target |
|---|---|---|---|---|---|
| 8 | 3 tiles | 3 tiles | Area Splash | Ground & Air | None |

**Statistics**

| Unarmed Tornado Trap |
|---|
|  |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | cost | 2 | 1 |
| Statistics | townHall | 3 | 0 |
| Statistics | duration | 3 | 0 |
| Statistics | totalDamage | 3 | 0 |
| Statistics | buildSeconds | 2 | 0 |
| Statistics | xp | 2 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Tornado Trap`): 8/8 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| cost | 1 | 1800000 | 1000000 | level 1 build cost: wiki 1,800,000 vs client 1,000,000 |
| effect radius | all | 3 | spell Radius 400 (4 tiles); trap DamageRadius 300 | the pull/damage spell covers 4 tiles in the client vs 3 on the wiki |

**Interpretation of client columns**

- Constants verified equal (wiki vs client): `triggerRadius`, `damageRadius`.
- Trap row: `TriggerRadius` 300, `DamageRadius` 300, `DurationMS` 5000/6000/7000, `AirTrigger`/`GroundTrigger` TRUE, `SpeedMod` 100, `Spell` = `Tornado Trap`.
- spells.csv `Tornado Trap`: `Damage` 1 per hit, `NumberOfHits` 39/47/55 every `TimeBetweenHitsMS` 128 (= the wiki's total damage and ~7.8 DPS), `Radius` 400, pull forces by class `TornadoForce1..5` 400/300/200/100/100 (ground) and `TornadoForceAir1..5` 500/400/300/200/150, `TornadoRotationSpeed` -180, `TornadoSpeedTowardsCenter` 75, `TornadoInnerRadius` 70, inner/outer force 100% / 65%.
- Level 1 `TownHallLevel` 11 here (unlike other traps whose level 1 row says 1).
