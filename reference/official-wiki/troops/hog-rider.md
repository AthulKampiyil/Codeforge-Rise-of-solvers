# Hog Rider

- Source: [Hog Rider](https://clashofclans.fandom.com/wiki/Hog_Rider)
- Wiki revision id: `624385` - retrieved 2026-09-15
- Client row: `characters.Hog Rider` (pinned client 18.400.21)

## Mechanics

- Unlock: Dark Barracks level 2, Town Hall 7 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 5.
- Movement speed: 24 in-game (wiki) = internal Speed 300 (24 before rounding) = 3 tiles/s.
- Attack: every 1 s; range 0.6 tiles.
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Ground unit. Jumps/passes over walls (IsJumper=TRUE).
- Super Troop: Super Hog Rider can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 10.
- Fast defense-targeting melee unit (0.6 tile, 1 s) that leaps over walls without breaking them, so other ground troops cannot follow through.
- Will not fight defending Heroes, Clan Castle troops or skeletons while defenses remain.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 60 | 60 | 270 | N/A | N/A | N/A |
| 2 | 70 | 70 | 312 | 2,000 | 10h | 5 |
| 3 | 80 | 80 | 370 | 3,500 | 18h | 6 |
| 4 | 92 | 92 | 430 | 5,000 | 1d | 6 |
| 5 | 105 | 105 | 500 | 10,000 | 2d | 7 |
| 6 | 118 | 118 | 590 | 18,500 | 2d 6h | 8 |
| 7 | 140 | 140 | 700 | 35,000 | 2d 12h | 9 |
| 8 | 155 | 155 | 810 | 47,500 | 3d | 10 |
| 9 | 165 | 165 | 890 | 50,000 | 3d 12h | 10 |
| 10 | 176 | 176 | 970 | 85,000 | 4d | 11 |
| 11 | 187 | 187 | 1,080 | 107,500 | 5d | 12 |
| 12 | 200 | 200 | 1,230 | 125,000 | 5d 12h | 13 |
| 13 | 213 | 213 | 1,380 | 175,000 | 6d 12h | 14 |
| 14 | 225 | 225 | 1,500 | 240,000 | 10d | 15 |
| 15 | 250 | 250 | 1,750 | 340,000 | 14d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| Defenses | Melee (Ground Only) | 5 | 24 | 1s | 2 | 0.6 tiles |

## Client comparison

Checked 95 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 95 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 5 = client 5 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.6 = client 0.6 - characters.AttackRange/100
- `barracksLevel`: wiki 2 = client 2 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 24 = client 24 - characters.Speed=300 -> /12.5 = 24
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 15 = client 15 - number of characters rows
- `dps`: 15 values match (levels 1-15) - characters.DPS
- `damagePerHit`: 15 values match (levels 1-15) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 15 values match (levels 1-15) - characters.Hitpoints
- `researchCost`: 14 values match (levels 2-15) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 14 values match (levels 2-15) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 14 values match (levels 2-15) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- IsJumper=TRUE, PreferedTargetBuildingClass=Defense.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
