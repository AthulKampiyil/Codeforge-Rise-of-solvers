# Dragon

- Source: [Dragon](https://clashofclans.fandom.com/wiki/Dragon)
- Wiki revision id: `624759` - retrieved 2026-09-15
- Client row: `characters.Dragon` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 9, Town Hall 7 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 20.
- Movement speed: 16 in-game (wiki) = internal Speed 200 (16 before rounding) = 2 tiles/s.
- Attack: every 1.25 s; range 3 tiles (client AttackRange/100 = 2.5).
- Damage type (wiki): Area Splash 0.3 Tile Radius (Ground & Air); client targets ground and air; client splash radius 0.3 tiles.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Super Troop: Super Dragon can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 7.
- Flying ranged splash attacker (0.3-tile splash every 1.25 s) that hits ground and air.
- Like all flyers it ignores walls; its splash can still damage walls next to targets.
- It will attack nearby ground-only defending units (e.g. a Barbarian King) if they are the closest target.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 140 | 175 | 1,900 | N/A | N/A | N/A |
| 2 | 160 | 200 | 2,100 | 1,000,000 | 18h | 5 |
| 3 | 180 | 225 | 2,300 | 2,000,000 | 1d 12h | 6 |
| 4 | 210 | 262.5 | 2,700 | 3,000,000 | 2d | 7 |
| 5 | 240 | 300 | 3,100 | 3,800,000 | 3d | 8 |
| 6 | 270 | 337.5 | 3,400 | 4,900,000 | 4d | 9 |
| 7 | 310 | 387.5 | 3,900 | 5,000,000 | 4d 12h | 10 |
| 8 | 330 | 412.5 | 4,200 | 7,500,000 | 5d | 11 |
| 9 | 350 | 437.5 | 4,500 | 10,500,000 | 7d | 12 |
| 10 | 370 | 462.5 | 4,900 | 12,000,000 | 7d 12h | 13 |
| 11 | 390 | 487.5 | 5,300 | 14,000,000 | 8d 12h | 14 |
| 12 | 410 | 512.5 | 5,700 | 18,500,000 | 10d | 15 |
| 13 | 430 | 537.5 | 6,000 | 28,500,000 | 15d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Area Splash 0.3 Tile Radius (Ground & Air) | 20 | 16 | 1.25s | 9 | 3 tiles |

## Client comparison

Checked 84 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 83 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 3 | 2.5 | characters.AttackRange/100 | wiki - client = +0.5 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles) |

### Ambiguities

- Range: wiki 3 tiles vs client AttackRange=250 (2.5 tiles).

### Matches

- `housingSpace`: wiki 20 = client 20 - characters.HousingSpace
- `attackSeconds`: wiki 1.25 = client 1.25 - characters.AttackSpeed/1000
- `barracksLevel`: wiki 9 = client 9 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 16 = client 16 - characters.Speed=200 -> /12.5 = 16
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `splashTiles`: wiki 0.3 = client 0.3 - characters.DamageRadius/100
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 13 = client 13 - number of characters rows
- `dps`: 13 values match (levels 1-13) - characters.DPS
- `damagePerHit`: 13 values match (levels 1-13) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 13 values match (levels 1-13) - characters.Hitpoints
- `researchCost`: 12 values match (levels 2-13) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 12 values match (levels 2-13) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 12 values match (levels 2-13) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- DamageRadius=30, IsFlying=TRUE, MovementOffsetSpeed=15.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
