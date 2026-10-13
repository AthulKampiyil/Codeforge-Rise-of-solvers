# Archer

- Source: [Archer](https://clashofclans.fandom.com/wiki/Archer)
- Wiki revision id: `624208` - retrieved 2026-09-15
- Client row: `characters.Archer` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 2, Town Hall 2 (client buildings.TownHallLevel; the wiki Barracks page shows "1*" - its footnote says the game files allow this Barracks level at Town Hall 1 but it is impossible in practice before Town Hall 2). Researched in the Laboratory with Elixir.
- Housing space: 1.
- Movement speed: 24 in-game (wiki) = internal Speed 300 (24 before rounding) = 3 tiles/s.
- Attack: every 1 s; range 3.5 tiles.
- Damage type (wiki): Ranged (Ground & Air); client targets ground and air.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Super Troop: Super Archer can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 8.
- Single-target ranged unit (3.5 tiles) that can hit both ground and air units.
- Her Projectile column changes with level (Arrow_small -> ..._darkElixirFire2); this is visual only.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 8 | 8 | 22 | N/A | N/A | N/A |
| 2 | 10 | 10 | 26 | 20,000 | 1h | 1 |
| 3 | 13 | 13 | 29 | 80,000 | 2h | 3 |
| 4 | 16 | 16 | 33 | 200,000 | 3h | 5 |
| 5 | 20 | 20 | 40 | 500,000 | 8h | 6 |
| 6 | 22 | 22 | 44 | 1,000,000 | 12h | 7 |
| 7 | 25 | 25 | 48 | 1,500,000 | 1d | 8 |
| 8 | 28 | 28 | 52 | 2,300,000 | 1d 12h | 9 |
| 9 | 31 | 31 | 56 | 3,000,000 | 2d | 10 |
| 10 | 34 | 34 | 60 | 4,500,000 | 3d | 12 |
| 11 | 37 | 37 | 64 | 6,500,000 | 4d | 13 |
| 12 | 40 | 40 | 68 | 9,000,000 | 4d 12h | 14 |
| 13 | 43 | 43 | 72 | 14,000,000 | 9d | 15 |
| 14 | 46 | 46 | 76 | 25,000,000 | 13d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Ranged (Ground & Air) | 1 | 24 | 1s | 2 | 3.5 tiles |

## Client comparison

Checked 89 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 89 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 1 = client 1 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 3.5 = client 3.5 - characters.AttackRange/100
- `barracksLevel`: wiki 2 = client 2 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 24 = client 24 - characters.Speed=300 -> /12.5 = 24
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

- Projectile per level (visual); AirTargets=TRUE, GroundTargets=TRUE.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
