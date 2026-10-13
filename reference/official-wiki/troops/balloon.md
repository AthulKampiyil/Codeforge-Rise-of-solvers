# Balloon

- Source: [Balloon](https://clashofclans.fandom.com/wiki/Balloon)
- Wiki revision id: `624220` - retrieved 2026-09-15
- Client row: `characters.Balloon` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 6, Town Hall 4 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 5.
- Movement speed: 10 in-game (wiki) = internal Speed 130 (10.4 before rounding) = 1.3 tiles/s.
- Attack: every 3 s; range 0.5 tiles (client AttackRange/100 = 0).
- Damage type (wiki): Area Splash 1.2 Tile Radius (Ground Only); client targets ground only; client splash radius 1.2 tiles.
- Favorite target: Defenses - Defense-first: ignores every other building and all defending units (even while being attacked) as long as any defensive building stands. The Clan Castle is never a defense; an activated Town Hall weapon is. Once no defenses remain it behaves like a no-preference troop, but only switches to enemy units after its current target is destroyed.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Death damage: 25-425 by level in a 1.2-tile radius (client DieDamageRadius), delay 416 ms (client DieDamageDelay; 0/absent = immediate).
- Super Troop: Rocket Balloon can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 8.
- Flying, defense-targeting bomber: drops a bomb every 3 s that splashes 1.2 tiles; hits ground only.
- The bomb is centred on the Balloon itself (SelfAsAoeCenter=TRUE) rather than on a projectile impact; wiki range is 0.5 tiles (client AttackRange=0).
- On death it falls and explodes for death damage in a 1.2-tile radius; the client delays the blast by 416 ms (DieDamageDelay). Death damage equals DPS up to level 6 and is higher from level 7.
- Triggers air traps; commonly sent first to set off Seeking Air Mines.
- NewTargetAttackDelay=2250 ms in the client (not described by the wiki): presumed delay before the first bomb on a new target.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Damage Upon Death | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 25 | 75 | 25 | 150 | N/A | N/A | N/A |
| 2 | 32 | 96 | 32 | 180 | 100,000 | 4h | 2 |
| 3 | 48 | 144 | 48 | 216 | 400,000 | 6h | 4 |
| 4 | 72 | 216 | 72 | 280 | 720,000 | 18h | 5 |
| 5 | 108 | 324 | 108 | 390 | 1,300,000 | 1d | 6 |
| 6 | 162 | 486 | 162 | 545 | 2,750,000 | 3d | 7 |
| 7 | 198 | 594 | 214 | 690 | 4,400,000 | 3d 6h | 9 |
| 8 | 236 | 708 | 268 | 840 | 5,000,000 | 3d 12h | 10 |
| 9 | 256 | 768 | 322 | 940 | 7,000,000 | 4d 12h | 11 |
| 10 | 276 | 828 | 352 | 1,040 | 10,000,000 | 7d | 12 |
| 11 | 290 | 870 | 375 | 1,140 | 14,000,000 | 8d 12h | 14 |
| 12 | 304 | 912 | 398 | 1,240 | 17,500,000 | 11d | 15 |
| 13 | 326 | 978 | 425 | 1,360 | 28,000,000 | 14d 18h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range | Death Damage Radius |
|---|---|---|---|---|---|---|---|
| Defenses | Area Splash 1.2 Tile Radius (Ground Only) | 5 | 10 | 3s | 6 | 0.5 tiles | 1.2 tiles |

## Client comparison

Checked 98 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 97 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 0.5 | 0 | characters.AttackRange/100 | wiki - client = +0.5 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles) |

### Matches

- `housingSpace`: wiki 5 = client 5 - characters.HousingSpace
- `attackSeconds`: wiki 3 = client 3 - characters.AttackSpeed/1000
- `deathDamageRadiusTiles`: wiki 1.2 = client 1.2 - characters.DieDamageRadius/100
- `barracksLevel`: wiki 6 = client 6 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 10 = client 10 - characters.Speed=130 -> /12.5 = 10.4
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `splashTiles`: wiki 1.2 = client 1.2 - characters.DamageRadius/100
- `favoriteTarget`: wiki Defense = client Defense - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 13 = client 13 - number of characters rows
- `dps`: 13 values match (levels 1-13) - characters.DPS
- `damagePerHit`: 13 values match (levels 1-13) - characters.DPS x AttackSpeed/1000
- `deathDamage`: 13 values match (levels 1-13) - characters.DieDamage
- `hitpoints`: 13 values match (levels 1-13) - characters.Hitpoints
- `researchCost`: 12 values match (levels 2-13) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 12 values match (levels 2-13) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 12 values match (levels 2-13) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- IsFlying=TRUE, AirTargets=FALSE, DamageRadius=120, SelfAsAoeCenter=TRUE, DieDamage per level, DieDamageRadius=120, DieDamageDelay=416, NewTargetAttackDelay=2250, MovementOffsetSpeed=20 (bobbing).
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
