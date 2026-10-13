# Yeti

- Source: [Yeti](https://clashofclans.fandom.com/wiki/Yeti)
- Wiki revision id: `624065` - retrieved 2026-09-15
- Client row: `characters.Yeti` (pinned client 18.400.21)
- Spawns: [Yetimite](yeti-yetimite.md)

## Mechanics

- Unlock: Barracks level 14, Town Hall 12 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 18.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: every 1 s; range 0.8 tiles.
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: Any (wiki info box); template rule "None" - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Slow single-target melee unit (0.8-tile reach, 1 s) with high hitpoints and damage; ground only.
- Carries a stock of Yetimites (8 at level 1 up to 14 at level 8). For every 600 damage he takes, one Yetimite jumps out; since October 2024 a single large hit releases several at once (1 per 600 damage). When he dies, all remaining Yetimites are released.
- Spawned Yetimites have the same level as the Yeti.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Yetimites spawned | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 230 | 230 | 2,900 | 8 | N/A | N/A | N/A |
| 2 | 250 | 250 | 3,200 | 9 | 5,000,000 | 3d | 10 |
| 3 | 270 | 270 | 3,500 | 10 | 6,500,000 | 4d 12h | 11 |
| 4 | 290 | 290 | 3,700 | 11 | 10,000,000 | 7d | 12 |
| 5 | 310 | 310 | 3,900 | 12 | 12,000,000 | 7d 12h | 13 |
| 6 | 330 | 330 | 4,100 | 13 | 14,500,000 | 8d 6h | 14 |
| 7 | 350 | 350 | 4,300 | 13 | 17,000,000 | 10d | 15 |
| 8 | 380 | 380 | 4,650 | 14 | 27,500,000 | 15d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| Any | Melee (Ground Only) | 18 | 12 | 1s | 14 | 0.8 tiles |

### Client-only per-level values (not on the wiki table)

| Level | spawnLevel |
|---|---|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5 | 5 |
| 6 | 6 |
| 7 | 7 |
| 8 | 8 |

## Client comparison

Checked 61 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 61 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 18 = client 18 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.8 = client 0.8 - characters.AttackRange/100
- `barracksLevel`: wiki 14 = client 14 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 8 = client 8 - number of characters rows
- `dps`: 8 values match (levels 1-8) - characters.DPS
- `damagePerHit`: 8 values match (levels 1-8) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 8 values match (levels 1-8) - characters.Hitpoints
- `spawnCount`: 8 values match (levels 1-8) - spawn count column (see Client columns)
- `researchCost`: 7 values match (levels 2-8) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 7 values match (levels 2-8) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 7 values match (levels 2-8) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- SpawnWhenDamaged=600, SecondarySpawnDist=100; SpecialAbilities=YetiSpawnYetiMites: TroopCount, TroopLevel, SpawnnedTroopsPerHit, SpawnnedTroopsPerDamage=600, SpawnRemainingTroopsOnDeath=TRUE, DeactivateWhenAllSpawnsDone=TRUE.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
