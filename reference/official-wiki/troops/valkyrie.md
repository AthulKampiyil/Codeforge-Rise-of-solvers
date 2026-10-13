# Valkyrie

- Source: [Valkyrie](https://clashofclans.fandom.com/wiki/Valkyrie)
- Wiki revision id: `624089` - retrieved 2026-09-15
- Client row: `characters.Valkyrie` (pinned client 18.400.21)

## Mechanics

- Unlock: Dark Barracks level 3, Town Hall 8 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 8.
- Movement speed: 24 in-game (wiki) = internal Speed 300 (24 before rounding) = 3 tiles/s.
- Attack: every 1.8 s; range 0.5 tiles.
- Damage type (wiki): Area Splash 1 Tile Radius (Ground Only); client targets ground only; client splash radius 1 tile.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Super Troop: Super Valkyrie can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 7.
- Spins her axe in a 1-tile radius around herself every 1.8 s, damaging every ground target in reach (several buildings and troops at once); ground only.
- She moves into gaps between buildings to hit more of them when that is ideal, but will not walk past a building just to improve the spin.
- Army Camps have a smaller hitbox than their footprint, so a Valkyrie next to an Army Camp and another building may not reach both.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 94 | 169.2 | 750 | N/A | N/A | N/A |
| 2 | 106 | 190.8 | 850 | 3,000 | 8h | 6 |
| 3 | 119 | 214.2 | 950 | 5,000 | 1d | 7 |
| 4 | 133 | 239.4 | 1,050 | 10,000 | 1d 12h | 7 |
| 5 | 148 | 266.4 | 1,300 | 16,000 | 1d 18h | 8 |
| 6 | 167 | 300.6 | 1,500 | 31,500 | 2d | 9 |
| 7 | 185 | 333 | 1,650 | 55,000 | 2d 6h | 10 |
| 8 | 196 | 352.8 | 1,800 | 77,500 | 3d | 11 |
| 9 | 208 | 374.4 | 2,000 | 105,000 | 4d 12h | 12 |
| 10 | 223 | 401.4 | 2,400 | 120,000 | 5d | 13 |
| 11 | 238 | 428.4 | 2,600 | 170,000 | 6d | 14 |
| 12 | 255 | 459 | 2,900 | 340,000 | 14d | 15 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Area Splash 1 Tile Radius (Ground Only) | 8 | 24 | 1.8s | 3 | 0.5 tiles |

## Client comparison

Checked 78 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 78 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 8 = client 8 - characters.HousingSpace
- `attackSeconds`: wiki 1.8 = client 1.8 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.5 = client 0.5 - characters.AttackRange/100
- `barracksLevel`: wiki 3 = client 3 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 24 = client 24 - characters.Speed=300 -> /12.5 = 24
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `splashTiles`: wiki 1 = client 1 - characters.DamageRadius/100
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 12 = client 12 - number of characters rows
- `dps`: 12 values match (levels 1-12) - characters.DPS
- `damagePerHit`: 12 values match (levels 1-12) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 12 values match (levels 1-12) - characters.Hitpoints
- `researchCost`: 11 values match (levels 2-12) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 11 values match (levels 2-12) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 11 values match (levels 2-12) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- DamageRadius=100, SelfAsAoeCenter=TRUE, AttackMultipleBuildings=TRUE, NewTargetAttackDelay=600.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
