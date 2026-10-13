# Goblin

- Source: [Goblin](https://clashofclans.fandom.com/wiki/Goblin)
- Wiki revision id: `625104` - retrieved 2026-09-15
- Client row: `characters.Goblin` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 4, Town Hall 2 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 1.
- Movement speed: 32 in-game (wiki) = internal Speed 400 (32 before rounding) = 4 tiles/s.
- Attack: every 1 s; range 0.4 tiles.
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: Resources (Damage x2) - Resource-first: ignores other buildings and defending units while any resource building stands. The Town Hall and Clan Castle always count as resource buildings (with or without loot, weapon active or not) and receive the resource damage bonus. Afterwards it behaves like a no-preference troop. Damage multiplier vs preferred target: x2.
- Ground unit.
- Super Troop: Sneaky Goblin can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 7.
- Resource-targeting melee unit dealing double damage to resource buildings: mines, collectors, drills, all storages, plus the Town Hall and Clan Castle (the template treats both as resources).
- Builder's Huts are not treated as resource buildings (wiki trivia); they are left until other resources fall.
- One of the fastest ground units (32 / 4 tiles per second): it often clears a Spring Trap or Bomb before the trap fires, but is not immune if it stops on it.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | DPS on Resource Buildings | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 11 | 11 | 22 | 25 | N/A | N/A | N/A |
| 2 | 14 | 14 | 28 | 30 | 45,000 | 2h | 1 |
| 3 | 19 | 19 | 38 | 36 | 100,000 | 3h | 3 |
| 4 | 24 | 24 | 48 | 50 | 500,000 | 6h | 5 |
| 5 | 32 | 32 | 64 | 65 | 700,000 | 12h | 6 |
| 6 | 42 | 42 | 84 | 80 | 1,600,000 | 1d | 7 |
| 7 | 52 | 52 | 104 | 105 | 2,200,000 | 1d 12h | 8 |
| 8 | 62 | 62 | 124 | 126 | 3,700,000 | 2d 6h | 10 |
| 9 | 72 | 72 | 144 | 146 | 8,000,000 | 5d | 13 |
| 10 | 82 | 82 | 164 | 166 | 26,000,000 | 14d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| Resources (Damage x2) | Melee (Ground Only) | 1 | 32 | 1s | 4 | 0.4 tiles |

## Client comparison

Checked 76 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 76 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 1 = client 1 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.4 = client 0.4 - characters.AttackRange/100
- `barracksLevel`: wiki 4 = client 4 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 32 = client 32 - characters.Speed=400 -> /12.5 = 32
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Resource = client Resource - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `favoriteMultiplier`: wiki 2 = client 2 - characters.PreferedTargetDamageMod (Headhunter: HeroDamageMultiplier/100)
- `maxLevel`: wiki 10 = client 10 - number of characters rows
- `dps`: 10 values match (levels 1-10) - characters.DPS
- `damagePerHit`: 10 values match (levels 1-10) - characters.DPS x AttackSpeed/1000
- `dpsVsFavorite`: 10 values match (levels 1-10) - DPS x PreferedTargetDamageMod (or HeroDamageMultiplier/100)
- `hitpoints`: 10 values match (levels 1-10) - characters.Hitpoints
- `researchCost`: 9 values match (levels 2-10) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 9 values match (levels 2-10) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 9 values match (levels 2-10) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- PreferedTargetBuildingClass=Resource and PreferedTargetDamageMod=2 give the x2 bonus.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
