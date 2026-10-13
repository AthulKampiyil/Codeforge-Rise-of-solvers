# Dragon Rider

- Source: [Dragon Rider](https://clashofclans.fandom.com/wiki/Dragon_Rider)
- Wiki revision id: `625318` - retrieved 2026-09-15
- Client row: `characters.Dragon Rider` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 15, Town Hall 13 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 25.
- Movement speed: 20 in-game (wiki) = internal Speed 250 (20 before rounding) = 2.5 tiles/s.
- Attack: every 1.2 s; range 4 tiles (client AttackRange/100 = 3.5).
- Damage type (wiki): Single Target; client targets ground and air.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Death damage: 700-1200 by level in a 2-tile radius (client DieDamageRadius), delay 600 ms (client DieDamageDelay; 0/absent = immediate).
- Flying, defense-targeting single-target ranged attacker (one shot every 1.2 s) that hits ground and air.
- When destroyed it crashes and explodes, damaging everything within 2 tiles; client delay 600 ms.
- Because it ignores defending units while defenses remain, air-mode Skeleton Trap skeletons can pick at it freely.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Damage Upon Death | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 340 | 408 | 700 | 4,100 | N/A | N/A | N/A |
| 2 | 370 | 444 | 800 | 4,400 | 7,500,000 | 6d | 11 |
| 3 | 400 | 480 | 900 | 4,700 | 12,000,000 | 8d | 12 |
| 4 | 430 | 516 | 1,000 | 5,100 | 14,500,000 | 9d | 14 |
| 5 | 470 | 564 | 1,100 | 5,600 | 19,000,000 | 10d 6h | 15 |
| 6 | 490 | 588 | 1,200 | 5,900 | 29,500,000 | 15d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Range | Death Damage Radius | Barracks Level Required |
|---|---|---|---|---|---|---|---|
| Defenses | Single Target | 25 | 20 | 1.2s | 4 tiles | 2 tiles | 15 |

## Client comparison

Checked 47 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 46 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 4 | 3.5 | characters.AttackRange/100 | wiki - client = +0.5 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles) |

### Ambiguities

- Range: wiki 4 tiles vs client AttackRange=350 (3.5 tiles).

### Matches

- `housingSpace`: wiki 25 = client 25 - characters.HousingSpace
- `attackSeconds`: wiki 1.2 = client 1.2 - characters.AttackSpeed/1000
- `deathDamageRadiusTiles`: wiki 2 = client 2 - characters.DieDamageRadius/100
- `barracksLevel`: wiki 15 = client 15 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 20 = client 20 - characters.Speed=250 -> /12.5 = 20
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 6 = client 6 - number of characters rows
- `dps`: 6 values match (levels 1-6) - characters.DPS
- `damagePerHit`: 6 values match (levels 1-6) - characters.DPS x AttackSpeed/1000
- `deathDamage`: 6 values match (levels 1-6) - characters.DieDamage
- `hitpoints`: 6 values match (levels 1-6) - characters.Hitpoints
- `researchCost`: 5 values match (levels 2-6) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 5 values match (levels 2-6) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 5 values match (levels 2-6) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- PreferedTargetBuildingClass=Defense, DieDamage per level, DieDamageRadius=200, DieDamageDelay=600.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
