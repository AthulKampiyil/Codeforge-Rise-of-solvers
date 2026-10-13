# Bowler

- Source: [Bowler](https://clashofclans.fandom.com/wiki/Bowler)
- Wiki revision id: `625333` - retrieved 2026-09-15
- Client row: `characters.Bowler` (pinned client 18.400.21)

## Mechanics

- Unlock: Dark Barracks level 7, Town Hall 10 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 6.
- Movement speed: 14 in-game (wiki) = internal Speed 175 (14 before rounding) = 1.75 tiles/s.
- Attack: every 2.2 s; range 3 tiles.
- Damage type (wiki): Area Splash; client targets ground only; client splash radius 0.3 tiles.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Super Troop: Super Bowler can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 4.
- Throws a large boulder at a ground target within 3 tiles every 2.2 s: it splashes on impact, then bounces onward in a straight line and splashes again where it lands, so it can hit a second target behind the first (only two hits per throw). Ground only.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 60 | 132 | 325 | N/A | N/A | N/A |
| 2 | 72 | 158.4 | 375 | 32,500 | 2d | 8 |
| 3 | 84 | 184.8 | 420 | 44,000 | 2d 12h | 9 |
| 4 | 96 | 211.2 | 470 | 62,500 | 3d | 10 |
| 5 | 102 | 224.4 | 505 | 85,000 | 4d | 11 |
| 6 | 108 | 237.6 | 530 | 110,000 | 6d | 12 |
| 7 | 114 | 250.8 | 565 | 145,000 | 7d | 13 |
| 8 | 126 | 277.2 | 600 | 175,000 | 7d 12h | 14 |
| 9 | 140 | 308 | 700 | 260,000 | 10d | 15 |
| 10 | 160 | 352 | 860 | 360,000 | 15d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Area Splash | 6 | 14 | 2.2s | 7 | 3 tiles from first target - can hit more |

## Client comparison

Checked 64 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 64 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Ambiguities

- Bounce travel distance is not on the wiki ("3 tiles from first target - can hit more"); client ChainShootingDistance=400 (4 tiles) and ProjectileBounces=2.

### Matches

- `housingSpace`: wiki 6 = client 6 - characters.HousingSpace
- `attackSeconds`: wiki 2.2 = client 2.2 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 3 = client 3 - characters.AttackRange/100
- `barracksLevel`: wiki 7 = client 7 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 14 = client 14 - characters.Speed=175 -> /12.5 = 14
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 10 = client 10 - number of characters rows
- `dps`: 10 values match (levels 1-10) - characters.DPS
- `damagePerHit`: 10 values match (levels 1-10) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 10 values match (levels 1-10) - characters.Hitpoints
- `researchCost`: 9 values match (levels 2-10) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 9 values match (levels 2-10) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 9 values match (levels 2-10) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- ProjectileBounces=2, ChainShootingDistance=400, DamageRadius=30, NewTargetAttackDelay=1100, projectile trollBoulder_* TrajectoryStyle=3.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
