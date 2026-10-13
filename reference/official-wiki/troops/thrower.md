# Thrower

- Source: [Thrower](https://clashofclans.fandom.com/wiki/Thrower)
- Wiki revision id: `625288` - retrieved 2026-09-15
- Client row: `characters.Thrower` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 18, Town Hall 16 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 16.
- Movement speed: 18 in-game (wiki) = internal Speed 220 (17.6 before rounding) = 2.2 tiles/s.
- Attack: every 2.5 s; range 6 tiles.
- Damage type (wiki): Single Target (Ground & Air); client targets ground and air.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Long-range (6 tiles) single-target ground unit that hits ground and air every 2.5 s.
- Movement speed raised from 16 to 18 on 2026-01-28.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 190 | 475 | 2,200 | N/A | N/A | N/A |
| 2 | 210 | 525 | 2,350 | 16,000,000 | 9d 12h | 14 |
| 3 | 230 | 575 | 2,600 | 18,000,000 | 10d 12h | 15 |
| 4 | 240 | 600 | 2,800 | 27,000,000 | 15d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Single Target (Ground & Air) | 16 | 18 | 2.5s | 18 | 6 tiles |

## Client comparison

Checked 30 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 29 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| internalSpeed (Troop Movement Speed page) | - | 225 | 220 | characters.Speed | both display 18 |

### Ambiguities

- Troop Movement Speed page lists internal 225; client Speed=220 (both display 18).

### Matches

- `housingSpace`: wiki 16 = client 16 - characters.HousingSpace
- `attackSeconds`: wiki 2.5 = client 2.5 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 6 = client 6 - characters.AttackRange/100
- `barracksLevel`: wiki 18 = client 18 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 18 = client 18 - characters.Speed=220 -> /12.5 = 17.6
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 4 = client 4 - number of characters rows
- `dps`: 4 values match (levels 1-4) - characters.DPS
- `damagePerHit`: 4 values match (levels 1-4) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 4 values match (levels 1-4) - characters.Hitpoints
- `researchCost`: 3 values match (levels 2-4) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 3 values match (levels 2-4) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 3 values match (levels 2-4) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- CoolDownOverride=1250; Projectile per level (visual).
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
