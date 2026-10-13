# Giant

- Source: [Giant](https://clashofclans.fandom.com/wiki/Giant)
- Wiki revision id: `625274` - retrieved 2026-09-15
- Client row: `characters.Giant` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 3, Town Hall 2 (client buildings.TownHallLevel; the wiki Barracks page shows "1*" - its footnote says the game files allow this Barracks level at Town Hall 1 but it is impossible in practice before Town Hall 2). Researched in the Laboratory with Elixir.
- Housing space: 5.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: every 2 s; range 1 tile.
- Damage type (wiki): Melee (Ground only); client targets ground only.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Ground unit.
- Super Troop: Super Giant can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 9.
- Slow, high-hitpoint melee tank (1-tile reach, one punch every 2 s) that targets defenses.
- No bonus damage against defenses (PreferedTargetDamageMod=1).

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 12 | 24 | 400 | N/A | N/A | N/A |
| 2 | 15 | 30 | 500 | 40,000 | 2h | 2 |
| 3 | 20 | 40 | 600 | 150,000 | 4h | 4 |
| 4 | 24 | 48 | 700 | 400,000 | 6h | 5 |
| 5 | 31 | 62 | 900 | 800,000 | 12h | 6 |
| 6 | 43 | 86 | 1,100 | 1,500,000 | 1d | 7 |
| 7 | 55 | 110 | 1,300 | 2,300,000 | 1d 12h | 8 |
| 8 | 62 | 124 | 1,500 | 2,600,000 | 2d | 9 |
| 9 | 70 | 140 | 1,850 | 3,400,000 | 2d 6h | 10 |
| 10 | 78 | 156 | 2,000 | 5,000,000 | 3d | 11 |
| 11 | 86 | 172 | 2,200 | 7,500,000 | 4d | 13 |
| 12 | 94 | 188 | 2,400 | 10,000,000 | 5d | 14 |
| 13 | 104 | 208 | 2,700 | 15,000,000 | 9d 12h | 15 |
| 14 | 114 | 228 | 3,000 | 25,000,000 | 13d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| Defenses | Melee (Ground only) | 5 | 12 | 2s | 3 | 1 tile |

## Client comparison

Checked 89 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 89 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 5 = client 5 - characters.HousingSpace
- `attackSeconds`: wiki 2 = client 2 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 1 = client 1 - characters.AttackRange/100
- `barracksLevel`: wiki 3 = client 3 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 14 = client 14 - number of characters rows
- `dps`: 14 values match (levels 1-14) - characters.DPS
- `damagePerHit`: 14 values match (levels 1-14) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 14 values match (levels 1-14) - characters.Hitpoints
- `researchCost`: 13 values match (levels 2-14) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 13 values match (levels 2-14) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 13 values match (levels 2-14) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- PreferedTargetBuildingClass=Defense drives the targeting; PreferedTargetDamageMod=1.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
