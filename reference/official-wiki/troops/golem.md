# Golem

- Source: [Golem](https://clashofclans.fandom.com/wiki/Golem)
- Wiki revision id: `625101` - retrieved 2026-09-15
- Client row: `characters.Golem` (pinned client 18.400.21)
- Spawns: [Golemite](golem-golemite.md)

## Mechanics

- Unlock: Dark Barracks level 4, Town Hall 8 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 30.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: every 2.4 s; range 1 tile.
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Ground unit.
- Death damage: 350-1050 by level in a 1.5-tile radius (client DieDamageRadius), delay 0 ms (client DieDamageDelay; 0/absent = immediate).
- Interactions (client flags): Healer target weight 5 (HealerWeight).
- Very high-hitpoint, low-damage defense-targeting melee tank (1 tile, 2.4 s).
- On death he explodes (damage within 1.5 tiles, no delay) and splits into Golemites: 2 at levels 1-7, 3 at levels 8-12, 4 at levels 13-15; Golemites have the golem's level.
- Above a Spring Trap's capacity, so he is not ejected; his Golemites (6 housing each) are.
- Since December 2023 Healers are less inclined to pick Golems/Golemites as heal targets.
- A defending Clan Castle Golem that splits is not returned to the castle even if Golemites survive.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Damage Upon Death | Golemites spawned Upon Death | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 35 | 84 | 350 | 2 | 5,100 | N/A | N/A | N/A |
| 2 | 40 | 96 | 400 | 2 | 5,400 | 4,000 | 16h | 6 |
| 3 | 45 | 108 | 450 | 2 | 5,700 | 6,000 | 1d 12h | 7 |
| 4 | 50 | 120 | 500 | 2 | 6,000 | 10,000 | 2d | 7 |
| 5 | 55 | 132 | 550 | 2 | 6,300 | 18,500 | 2d 6h | 8 |
| 6 | 60 | 144 | 600 | 2 | 6,600 | 26,500 | 2d 12h | 9 |
| 7 | 65 | 156 | 650 | 2 | 7,000 | 38,500 | 2d 18h | 9 |
| 8 | 70 | 168 | 700 | 3 | 7,500 | 50,000 | 3d | 10 |
| 9 | 75 | 180 | 750 | 3 | 7,900 | 62,500 | 3d 12h | 10 |
| 10 | 80 | 192 | 800 | 3 | 8,200 | 80,000 | 4d | 11 |
| 11 | 85 | 204 | 850 | 3 | 8,500 | 105,000 | 5d | 12 |
| 12 | 90 | 216 | 900 | 3 | 8,800 | 122,500 | 5d 12h | 13 |
| 13 | 95 | 228 | 950 | 4 | 9,200 | 175,000 | 6d | 14 |
| 14 | 100 | 240 | 1,000 | 4 | 9,600 | 230,000 | 10d | 15 |
| 15 | 120 | 288 | 1,050 | 4 | 10,600 | 350,000 | 14d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range | Death Damage Radius |
|---|---|---|---|---|---|---|---|
| Defenses | Melee (Ground Only) | 30 | 12 | 2.4s | 4 | 1 tile | 1.5 tiles |

## Client comparison

Checked 126 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 126 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 30 = client 30 - characters.HousingSpace
- `attackSeconds`: wiki 2.4 = client 2.4 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 1 = client 1 - characters.AttackRange/100
- `deathDamageRadiusTiles`: wiki 1.5 = client 1.5 - characters.DieDamageRadius/100
- `barracksLevel`: wiki 4 = client 4 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 15 = client 15 - number of characters rows
- `dps`: 15 values match (levels 1-15) - characters.DPS
- `damagePerHit`: 15 values match (levels 1-15) - characters.DPS x AttackSpeed/1000
- `deathDamage`: 15 values match (levels 1-15) - characters.DieDamage
- `spawnCount`: 15 values match (levels 1-15) - spawn count column (see Client columns)
- `hitpoints`: 15 values match (levels 1-15) - characters.Hitpoints
- `researchCost`: 14 values match (levels 2-15) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 14 values match (levels 2-15) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 14 values match (levels 2-15) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- DieDamage per level, DieDamageRadius=150, DieDamageDelay=0, SecondaryTroop=Golemite, SecondaryTroopCnt per level, SecondarySpawnDist=150, HealerWeight=5.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
