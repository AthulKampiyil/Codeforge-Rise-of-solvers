# Wizard

- Source: [Wizard](https://clashofclans.fandom.com/wiki/Wizard)
- Wiki revision id: `625289` - retrieved 2026-09-15
- Client row: `characters.Wizard` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 7, Town Hall 5 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 4.
- Movement speed: 16 in-game (wiki) = internal Speed 200 (16 before rounding) = 2 tiles/s.
- Attack: every 1.5 s; range 3 tiles.
- Damage type (wiki): Area Splash 0.3 Tile Radius (Ground & Air); client targets ground and air; client splash radius 0.3 tiles.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Super Troop: Super Wizard can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 9.
- Fragile ranged splash unit: 0.3-tile splash, 3-tile range, one fireball every 1.5 s, hits ground and air.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 50 | 75 | 75 | N/A | N/A | N/A |
| 2 | 70 | 105 | 90 | 120,000 | 4h | 3 |
| 3 | 90 | 135 | 108 | 300,000 | 5h | 4 |
| 4 | 125 | 187.5 | 135 | 600,000 | 12h | 5 |
| 5 | 170 | 255 | 165 | 1,200,000 | 18h | 6 |
| 6 | 185 | 277.5 | 180 | 2,000,000 | 1d 12h | 7 |
| 7 | 200 | 300 | 195 | 2,500,000 | 2d | 8 |
| 8 | 215 | 322.5 | 210 | 3,100,000 | 2d 6h | 9 |
| 9 | 230 | 345 | 230 | 4,000,000 | 2d 12h | 10 |
| 10 | 245 | 367.5 | 250 | 5,500,000 | 3d 12h | 11 |
| 11 | 260 | 390 | 270 | 10,000,000 | 5d 12h | 13 |
| 12 | 275 | 412.5 | 290 | 11,500,000 | 7d | 14 |
| 13 | 290 | 435 | 310 | 16,000,000 | 10d 12h | 15 |
| 14 | 310 | 465 | 330 | 27,000,000 | 14d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Area Splash 0.3 Tile Radius (Ground & Air) | 4 | 16 | 1.5s | 7 | 3 tiles |

## Client comparison

Checked 92 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 90 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| unlockTownHall (summary text) | - | 6 | 5 | buildings.Barracks row 7 TownHallLevel | wiki Barracks page also says 5 |
| researchSeconds (Laboratory/Upgrade Chart) | 13 | 1,080,000 | 907,200 | characters.UpgradeTimeH row 12 = 252 | Wizard page itself says 10d 12h = client |

### Ambiguities

- Summary says Barracks 7 "requires Town Hall level 6"; the wiki Barracks page and client Barracks row 7 (TownHallLevel=5) say Town Hall 5.
- Laboratory/Upgrade Chart lists level 13 as 12d 12h, but the Wizard page and client (row 12 UpgradeTimeH=252 = 10d 12h) agree on 10d 12h.

### Matches

- `housingSpace`: wiki 4 = client 4 - characters.HousingSpace
- `attackSeconds`: wiki 1.5 = client 1.5 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 3 = client 3 - characters.AttackRange/100
- `barracksLevel`: wiki 7 = client 7 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 16 = client 16 - characters.Speed=200 -> /12.5 = 16
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `splashTiles`: wiki 0.3 = client 0.3 - characters.DamageRadius/100
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 14 = client 14 - number of characters rows
- `dps`: 14 values match (levels 1-14) - characters.DPS
- `damagePerHit`: 14 values match (levels 1-14) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 14 values match (levels 1-14) - characters.Hitpoints
- `researchCost`: 13 values match (levels 2-14) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 13 values match (levels 2-14) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 13 values match (levels 2-14) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- DamageRadius=30; Projectile per level (visual).
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
