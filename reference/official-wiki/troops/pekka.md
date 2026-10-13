# P.E.K.K.A

- Source: [P.E.K.K.A](https://clashofclans.fandom.com/wiki/P.E.K.K.A)
- Wiki revision id: `625276` - retrieved 2026-09-15
- Client row: `characters.PEKKA` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 10, Town Hall 8 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 25.
- Movement speed: 16 in-game (wiki) = internal Speed 200 (16 before rounding) = 2 tiles/s.
- Attack: every 1.8 s; range 0.8 tiles.
- Damage type (wiki): Melee Single Target (Ground); client targets ground only.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Slow-swinging single-target melee unit (0.8-tile reach, 1.8 s) with very high damage and hitpoints; ground only.
- At 25 housing she is too heavy for a Spring Trap to eject outright (wiki: troops above the trap's 18-housing capacity), though the trap still damages her and can finish a weakened P.E.K.K.A.
- She no longer takes double damage from Hidden Teslas (removed December 2016).

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 260 | 468 | 3,000 | N/A | N/A | N/A |
| 2 | 290 | 522 | 3,500 | 600,000 | 12h | 6 |
| 3 | 320 | 576 | 4,000 | 1,300,000 | 18h | 6 |
| 4 | 360 | 648 | 4,500 | 2,000,000 | 1d | 7 |
| 5 | 410 | 738 | 5,000 | 2,100,000 | 1d 12h | 8 |
| 6 | 470 | 846 | 5,500 | 2,500,000 | 2d | 8 |
| 7 | 540 | 972 | 5,900 | 4,500,000 | 3d | 9 |
| 8 | 610 | 1,098 | 6,300 | 5,000,000 | 3d 12h | 10 |
| 9 | 680 | 1,224 | 6,700 | 5,800,000 | 4d | 11 |
| 10 | 750 | 1,350 | 7,200 | 10,500,000 | 5d 12h | 13 |
| 11 | 810 | 1,458 | 7,700 | 12,000,000 | 7d | 14 |
| 12 | 870 | 1,566 | 8,200 | 16,000,000 | 10d | 15 |
| 13 | 940 | 1,692 | 8,800 | 28,000,000 | 14d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range | Transport |
|---|---|---|---|---|---|---|---|
| None | Melee Single Target (Ground) | 25 | 16 | 1.8s | 10 | 0.8 tiles | Ground |

## Client comparison

Checked 83 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 83 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 25 = client 25 - characters.HousingSpace
- `attackSeconds`: wiki 1.8 = client 1.8 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.8 = client 0.8 - characters.AttackRange/100
- `barracksLevel`: wiki 10 = client 10 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 16 = client 16 - characters.Speed=200 -> /12.5 = 16
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 13 = client 13 - number of characters rows
- `dps`: 13 values match (levels 1-13) - characters.DPS
- `damagePerHit`: 13 values match (levels 1-13) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 13 values match (levels 1-13) - characters.Hitpoints
- `researchCost`: 12 values match (levels 2-13) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 12 values match (levels 2-13) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 12 values match (levels 2-13) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- Plain character row: Speed=200, AttackRange=80, AttackSpeed=1800.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
