# Lava Hound

- Source: [Lava Hound](https://clashofclans.fandom.com/wiki/Lava_Hound)
- Wiki revision id: `624357` - retrieved 2026-09-15
- Client row: `characters.Lava Hound` (pinned client 18.400.21)
- Spawns: [Lava Pup](lava-hound-lava-pup.md)

## Mechanics

- Unlock: Dark Barracks level 6, Town Hall 9 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 30.
- Movement speed: 20 in-game (wiki) = internal Speed 250 (20 before rounding) = 2.5 tiles/s.
- Attack: every 2 s; range 1 tile (client AttackRange/100 = 0.25).
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: Air Defense - Air-Defense-first: bypasses all other buildings and units while any Air Defense stands, then targets any remaining defenses, then behaves like a no-preference troop. The Clan Castle is not a defense; an activated Town Hall weapon is.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Death damage: 100-450 by level in a 1.2-tile radius (client DieDamageRadius), delay 0 ms (client DieDamageDelay; 0/absent = immediate).
- Super Troop: Ice Hound can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 5.
- Flying tank that goes for Air Defenses first, then other defenses; it attacks ground targets only, one target at a time (its fireballs do not splash), every 2 s.
- On death it explodes for a small amount of area damage and releases Lava Pups in a ring around it: 8 at level 1 up to 22 at level 8 on offense; a defending Lava Hound releases fewer (8 up to 15).
- As a defending Clan Castle troop it only comes out for ground attackers near the castle, since it cannot hit air.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Damage Upon Death | Lava Pups Spawned (After Death) - On Offense | Lava Pups Spawned (After Death) - On Defense | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 10 | 20 | 100 | 8 | 8 | 6,100 | N/A | N/A | N/A |
| 2 | 12 | 24 | 150 | 10 | 9 | 6,500 | 14,000 | 2d | 7 |
| 3 | 14 | 28 | 200 | 12 | 10 | 6,800 | 21,500 | 2d 12h | 8 |
| 4 | 16 | 32 | 250 | 14 | 11 | 7,200 | 42,500 | 3d | 9 |
| 5 | 18 | 36 | 300 | 16 | 12 | 7,600 | 60,000 | 4d | 10 |
| 6 | 20 | 40 | 350 | 18 | 13 | 8,000 | 80,000 | 7d | 11 |
| 7 | 22 | 44 | 400 | 20 | 14 | 8,500 | 200,000 | 8d | 14 |
| 8 | 24 | 48 | 450 | 22 | 15 | 9,500 | 345,000 | 15d 6h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| Air Defense | Melee (Ground Only) | 30 | 20 | 2s | 6 | 1 tile |

## Client comparison

Checked 77 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 76 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 1 | 0.25 | characters.AttackRange/100 | wiki - client = +0.75 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles); not the +0.5 flyer pattern seen on other air troops |

### Ambiguities

- Range: wiki 1 tile vs client AttackRange=25 (0.25 tile); does not follow the +0.5 flyer pattern.
- Death damage radius is not on the wiki; client DieDamageRadius=120 (1.2 tiles).

### Matches

- `housingSpace`: wiki 30 = client 30 - characters.HousingSpace
- `attackSeconds`: wiki 2 = client 2 - characters.AttackSpeed/1000
- `barracksLevel`: wiki 6 = client 6 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 20 = client 20 - characters.Speed=250 -> /12.5 = 20
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Air Defense = client Air Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 8 = client 8 - number of characters rows
- `dps`: 8 values match (levels 1-8) - characters.DPS
- `damagePerHit`: 8 values match (levels 1-8) - characters.DPS x AttackSpeed/1000
- `deathDamage`: 8 values match (levels 1-8) - characters.DieDamage
- `spawnCount`: 8 values match (levels 1-8) - spawn count column (see Client columns)
- `spawnCountDefense`: 8 values match (levels 1-8) - Defensive variant spawn count
- `hitpoints`: 8 values match (levels 1-8) - characters.Hitpoints
- `researchCost`: 7 values match (levels 2-8) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 7 values match (levels 2-8) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 7 values match (levels 2-8) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- PreferedTargetBuilding=Air Defense (a specific building, not a class), SecondaryTroop=Lava Pup, SecondaryTroopCnt per level, SecondarySpawnDist=350, RandomizeSecSpawnDist=TRUE, SecondarySpawnOffset=100, DieDamage per level, DieDamageRadius=120, DefensiveTroop=Defensive Lava Hound.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
