# Skeleton Trap

- Source: [Skeleton Trap](https://clashofclans.fandom.com/wiki/Skeleton_Trap) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `621660`; retrieved 2026-09-15
- Category: trap
- Client reference (18.400.21): `traps.csv` -> `Skeleton Trap` (5 levels)

## Mechanics

- Unlocked at Town Hall 8. Count (wiki): TH8 2, TH10 3, TH14 4. Footprint 1x1.
- Mode is set by the owner: **ground** (triggered by and attacking ground units) or **air** (Skeletons float on balloons and attack only air). A trap in one mode stays hidden when units of the other layer pass.
- When a unit enters its 5-tile trigger radius, the coffin rises and releases Skeletons: 2 / 3 / 4 / 5 / 5 at levels 1-5; level 5 upgrades them to level-2 Skeletons instead of adding more.
- Trap Skeletons: melee, 0.7 s attack, range 0.4 tiles; level 1 25 DPS / 30 HP, level 2 30 DPS / 45 HP; ground ones move at 24, air ones at 17.6. They act like defending Clan Castle skeletons (skull icon, permanent health bar), can jump Walls, go idle if nothing is left to attack, and are boosted by a Rage Spell Tower.
- Air Skeletons count 1 housing space (reduced from 2 in March 2025).
- Free automatic re-arm.

### Recent balance notes (from the page's History table)

- November 17, 2025: level 5 added (level-2 Skeletons).
- March 24, 2025: Air Skeleton housing space 2 -> 1; level 2-4 costs and times reduced.

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH8: 2, TH10: 3, TH14: 4

Size: 1x1

**Statistics**

| Level | Spawned Units | Skeleton Level | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | 2 | 1 | 6,000 | N/A | N/A | 8 |
| 2 | 3 | 1 | 250,000 | 5h | 134 | 8 |
| 3 | 4 | 1 | 400,000 | 8h | 169 | 9 |
| 4 | 5 | 1 | 1,000,000 | 12h | 207 | 10 |
| 5 | 5 | 2 | 18,000,000 | 7d | 777 | 18 |

**Statistics - Ground Mode**

| Trigger Radius | Unit Type Targeted | Favorite Target |
|---|---|---|
| 5 tiles | Ground | None |

**Statistics - Skeleton Stats**

| Favorite Target | Attack Type | Attack Speed | Range | Movement Speed |
|---|---|---|---|---|
| None | Melee (Ground Only) | 0.7s | 0.4 | 24 |

**Statistics - Ground Skeleton (per Skeleton level)**

| Level | Damage per Second | Damage per Hit | Hitpoints |
|---|---|---|---|
| 1 | 25 | 17.5 | 30 |
| 2 | 30 | 21 | 45 |

**Statistics - Air Mode**

| Trigger Radius | Unit Type Targeted | Favorite Target |
|---|---|---|
| 5 tiles | Air | None |

**Statistics - Skeleton Stats**

| Favorite Target | Attack Type | Attack Speed | Range | Movement Speed |
|---|---|---|---|---|
| None | Melee (Air Only) | 0.7s | 0.4 | 17.6 |

**Statistics - Air Skeleton (per Skeleton level)**

| Level | Damage per Second | Damage per Hit | Hitpoints |
|---|---|---|---|
| 1 | 25 | 17.5 | 30 |
| 2 | 30 | 21 | 45 |

**Statistics - Unarmed Skeleton Traps**

|  |  |  |
|---|---|---|
| Levels 1-2 | Levels 3-4 | Level 5 |

## Client comparison

Automatic per-level check (wiki value vs client value; tolerance 0.01 or 0.05%):

| Wiki table | Field | Matches | Mismatches |
|---|---|---|---|
| Statistics | cost | 5 | 0 |
| Statistics | townHall | 4 | 1 |
| Statistics | spawnedUnits | 5 | 0 |
| Statistics | skeletonLevel | 5 | 0 |
| Statistics | buildSeconds | 4 | 0 |
| Statistics | xp | 4 | 0 |

Count per Town Hall (wiki `NumberAvailable` vs client `townhall_levels.csv` column `Skeleton Trap`): 11/11 TH levels match.

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall | 1 | 8 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |

**Game table check** (`reference/full-client/progression.json` -> `skeletontrap` vs wiki): 1 discrepancies.

| Field | Level | Wiki | progression.json | Note |
|---|---|---|---|---|
| townhall | 1 | 8 | 1 | client trap rows use TownHallLevel 1 for level 1 (availability comes from townhall_levels counts); the wiki lists the unlock Town Hall |

**Interpretation of client columns**

- Constants verified equal (wiki vs client): `groundSkeletonDps@1`, `groundSkeletonHitpoints@1`, `groundSkeletonDps@2`, `groundSkeletonHitpoints@2`, `groundSkeletonAttackSeconds`, `groundSkeletonMovementSpeed`, `airSkeletonDps@1`, `airSkeletonHitpoints@1`, `airSkeletonDps@2`, `airSkeletonHitpoints@2`, `airSkeletonAttackSeconds`, `airSkeletonMovementSpeed`, `triggerRadius`.
- `NumSpawns` 2/3/4/5/5 and `SpawnLvl` 1/1/1/1/2 match the wiki's spawned units and Skeleton level.
- `HasAltMode` TRUE (ground/air), `SpawnedCharGround` = Trap Skeleton, `SpawnedCharAir` = Trap Air Skeleton, `SpawnInitialDelayMs` 600, `TimeBetweenSpawnsMs` 150, `TriggerRadius` 500, `ActionFrame` 37.
- Skeleton stats in characters.csv: `DPS` 25/30, `Hitpoints` 30/45, `AttackSpeed` 700, `AttackRange` 40, `Speed` 300 (ground) / 220 (air); `HousingSpace` 1 for both.
