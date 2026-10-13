# Witch

- Source: [Witch](https://clashofclans.fandom.com/wiki/Witch)
- Wiki revision id: `624601` - retrieved 2026-09-15
- Client row: `characters.Witch` (pinned client 18.400.21)
- Spawns: [Skeleton (Witch)](witch-skeleton.md)

## Mechanics

- Unlock: Dark Barracks level 5, Town Hall 9 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 12.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: every 0.7 s; range 4 tiles.
- Damage type (wiki): Area Splash 0.3 Tile Radius (Ground & Air); client targets ground and air; client splash radius 0.3 tiles.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Super Troop: Super Witch can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 5.
- Ground ranged splash unit: 0.3-tile splash, 4-tile range, attacks every 0.7 s, hits ground and air.
- Summons Skeletons every 7 s: 4 per summon (5 from level 7), while never having more than her cap alive (6 at level 1 rising to 16). Skeletons are level 1, level 2 once the Witch reaches level 8. No graves are needed.
- Skeletons raised by a defending Witch do not go back into the Clan Castle.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Skeletons per Summon | Maximum Skeletons Summoned | Skeleton Level | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 100 | 70 | 4 | 6 | 1 | 300 | N/A | N/A | N/A |
| 2 | 110 | 77 | 4 | 8 | 1 | 320 | 20,000 | 2d | 7 |
| 3 | 140 | 98 | 4 | 10 | 1 | 400 | 29,000 | 3d | 8 |
| 4 | 165 | 115.5 | 4 | 12 | 1 | 470 | 45,000 | 3d 12h | 9 |
| 5 | 185 | 129.5 | 4 | 14 | 1 | 520 | 62,500 | 4d | 10 |
| 6 | 200 | 140 | 4 | 15 | 1 | 540 | 150,000 | 5d 12h | 13 |
| 7 | 220 | 154 | 5 | 16 | 1 | 560 | 180,000 | 7d 6h | 14 |
| 8 | 260 | 182 | 5 | 16 | 2 | 650 | 355,000 | 15d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Summon Cooldown | Dark Barracks Level Required | Range |
|---|---|---|---|---|---|---|---|
| None | Area Splash 0.3 Tile Radius (Ground & Air) | 12 | 12 | 0.7s | 7s | 5 | 4 tiles |

## Client comparison

Checked 79 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 79 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 12 = client 12 - characters.HousingSpace
- `attackSeconds`: wiki 0.7 = client 0.7 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 4 = client 4 - characters.AttackRange/100
- `barracksLevel`: wiki 5 = client 5 - characters.BarrackLevel
- `summonCooldownSeconds`: wiki 7 = client 7 - characters.SummonCooldown/1000
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `splashTiles`: wiki 0.3 = client 0.3 - characters.DamageRadius/100
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 8 = client 8 - number of characters rows
- `dps`: 8 values match (levels 1-8) - characters.DPS
- `damagePerHit`: 8 values match (levels 1-8) - characters.DPS x AttackSpeed/1000
- `summonCount`: 8 values match (levels 1-8) - characters.SummonTroopCount
- `summonLimit`: 8 values match (levels 1-8) - characters.SummonLimit
- `summonLevel`: 8 values match (levels 1-8) - characters.SummonLevel
- `hitpoints`: 8 values match (levels 1-8) - characters.Hitpoints
- `researchCost`: 7 values match (levels 2-8) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 7 values match (levels 2-8) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 7 values match (levels 2-8) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- SummonTroop=Skeleton, SummonTroopCount, SummonLimit, SummonLevel per level, SummonCooldown=7000, SummonTime=875 (summon animation), SecondarySpawnDist=150, DamageRadius=30.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
