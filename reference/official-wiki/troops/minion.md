# Minion

- Source: [Minion](https://clashofclans.fandom.com/wiki/Minion)
- Wiki revision id: `625278` - retrieved 2026-09-15
- Client row: `characters.Minion` (pinned client 18.400.21)

## Mechanics

- Unlock: Dark Barracks level 1, Town Hall 7 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 2.
- Movement speed: 32 in-game (wiki) = internal Speed 400 (32 before rounding) = 4 tiles/s.
- Attack: every 1 s; range 2.75 tiles (client AttackRange/100 = 2.25).
- Damage type (wiki): Ranged (Ground & Air); client targets ground and air.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Super Troop: Super Minion can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 8.
- Fast, fragile flying ranged unit (2.75 tiles on the wiki) that hits ground and air once per second.
- Cannot be targeted by Seeking Air Mines (the only flying troop immune to them; also true for Lava/Ice Pups) but does trigger Air Bombs; a moving Minion can outrun an Air Bomb.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 38 | 38 | 58 | N/A | N/A | N/A |
| 2 | 41 | 41 | 63 | 1,000 | 6h | 5 |
| 3 | 44 | 44 | 68 | 2,500 | 8h | 6 |
| 4 | 47 | 47 | 73 | 5,000 | 12h | 6 |
| 5 | 50 | 50 | 78 | 10,000 | 1d | 7 |
| 6 | 54 | 54 | 84 | 15,000 | 1d 12h | 8 |
| 7 | 58 | 58 | 90 | 31,500 | 1d 18h | 9 |
| 8 | 62 | 62 | 96 | 47,500 | 2d | 10 |
| 9 | 66 | 66 | 102 | 75,000 | 3d | 11 |
| 10 | 70 | 70 | 108 | 100,000 | 4d | 12 |
| 11 | 74 | 74 | 114 | 115,000 | 4d 12h | 13 |
| 12 | 78 | 78 | 120 | 160,000 | 5d | 14 |
| 13 | 84 | 84 | 130 | 220,000 | 9d | 15 |
| 14 | 92 | 92 | 140 | 335,000 | 14d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Ranged (Ground & Air) | 2 | 32 | 1s | 1 | 2.75 tiles |

## Client comparison

Checked 89 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 88 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 2.75 | 2.25 | characters.AttackRange/100 | wiki - client = +0.5 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles) |

### Ambiguities

- Range: wiki 2.75 tiles vs client AttackRange=225 (2.25 tiles).

### Matches

- `housingSpace`: wiki 2 = client 2 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `barracksLevel`: wiki 1 = client 1 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 32 = client 32 - characters.Speed=400 -> /12.5 = 32
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 14 = client 14 - number of characters rows
- `dps`: 14 values match (levels 1-14) - characters.DPS
- `damagePerHit`: 14 values match (levels 1-14) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 14 values match (levels 1-14) - characters.Hitpoints
- `researchCost`: 13 values match (levels 2-14) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 13 values match (levels 2-14) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 13 values match (levels 2-14) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- IsFlying=TRUE, MovementOffsetSpeed=100 (bobbing). No explicit Seeking-Air-Mine immunity column in characters; the trap side decides.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
