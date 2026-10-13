# Wall Breaker

- Source: [Wall Breaker](https://clashofclans.fandom.com/wiki/Wall_Breaker)
- Wiki revision id: `624864` - retrieved 2026-09-15
- Client row: `characters.Wall Breaker` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 5, Town Hall 3 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 2.
- Movement speed: 24 in-game (wiki) = internal Speed 300 (24 before rounding) = 3 tiles/s.
- Attack: every 1 s; range 1 tile (client AttackRange/100 = 0.5).
- Damage type (wiki): Area Splash (Ground Only); client targets ground only; client splash radius 0.8 tiles.
- Favorite target: Walls (Damage x40) - Wall-first: while even one wall segment exists it ignores buildings and enemy units entirely. With no walls left it behaves like a no-preference troop. Damage multiplier vs preferred target: x40.
- Ground unit.
- Death damage: 6-78 by level in a 1.5-tile radius (client DieDamageRadius), delay 0 ms (client DieDamageDelay; 0/absent = immediate).
- Interactions (client flags): Healer target weight 0 (HealerWeight).
- Super Troop: Super Wall Breaker can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 7.
- Walks to a wall and blows himself up: the explosion is a single hit (AttackCount=1) that deals splash damage and 40x damage to walls; buildings in the blast take normal damage.
- If killed before reaching a wall he still explodes for his (smaller) death damage, which is also 40x against walls. The wiki notes the death blast is not boosted by Rage.
- Wall choice (wiki strategy notes): prefers walls that protect buildings, needs a run of at least 3 connected wall segments, and since October 2020 ignores walls already bypassed by a Jump Spell. With no walls at all he runs to the nearest building and explodes there.
- Radii: the wiki lists a single "Damage Radius" of 2 tiles; the client uses 0.8 tiles for the attack (DamageRadius=80) and 1.5 tiles for the death blast (DieDamageRadius=150).
- Spring Traps can eject several at once (2 housing each).

## Level table (wiki)

| Level | Damage | Damage when destroyed | Damage vs. Walls | Damage when destroyed vs. Walls | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 10 | 6 | 400 | 240 | 20 | N/A | N/A | N/A |
| 2 | 20 | 9 | 800 | 360 | 24 | 80,000 | 3h | 2 |
| 3 | 25 | 13 | 1,000 | 520 | 29 | 200,000 | 4h | 4 |
| 4 | 30 | 16 | 1,200 | 640 | 35 | 450,000 | 12h | 5 |
| 5 | 43 | 23 | 1,720 | 920 | 53 | 1,000,000 | 16h | 6 |
| 6 | 55 | 30 | 2,200 | 1,200 | 72 | 2,400,000 | 1d | 8 |
| 7 | 66 | 36 | 2,640 | 1,440 | 82 | 2,800,000 | 1d 12h | 9 |
| 8 | 75 | 42 | 3,000 | 1,680 | 92 | 3,800,000 | 2d 12h | 10 |
| 9 | 86 | 48 | 3,440 | 1,920 | 112 | 5,200,000 | 3d | 11 |
| 10 | 94 | 54 | 3,760 | 2,160 | 130 | 6,500,000 | 5d | 12 |
| 11 | 102 | 60 | 4,080 | 2,400 | 140 | 9,500,000 | 5d 12h | 13 |
| 12 | 110 | 66 | 4,400 | 2,640 | 150 | 11,000,000 | 6d | 14 |
| 13 | 118 | 72 | 4,720 | 2,880 | 160 | 15,500,000 | 10d | 15 |
| 14 | 126 | 78 | 5,040 | 3,120 | 170 | 26,000,000 | 14d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range | Damage Radius |
|---|---|---|---|---|---|---|---|
| Walls (Damage x40) | Area Splash (Ground Only) | 2 | 24 | 1s | 5 | 1 tile | 2 tiles |

## Client comparison

Checked 120 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 117 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 1 | 0.5 | characters.AttackRange/100 | wiki - client = +0.5 tiles |
| splashTiles | - | 2 | 0.8 | characters.DamageRadius/100 | wiki "Damage Radius" 2 tiles; client DamageRadius=80 (attack) and DieDamageRadius=150 (death) |
| barracksLevel (summary text) | - | 4 | 5 | characters.BarrackLevel | wiki statistics table says 5 |

### Ambiguities

- Summary text says "unlocked at Barracks level 4" but the wiki statistics table, the Barracks page and the client (BarrackLevel=5) all say level 5.
- Attack range: wiki 1 tile vs client AttackRange=50 (0.5 tile).

### Matches

- `housingSpace`: wiki 2 = client 2 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `barracksLevel`: wiki 5 = client 5 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 24 = client 24 - characters.Speed=300 -> /12.5 = 24
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki Wall = client Wall - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `favoriteMultiplier`: wiki 40 = client 40 - characters.PreferedTargetDamageMod (Headhunter: HeroDamageMultiplier/100)
- `maxLevel`: wiki 14 = client 14 - number of characters rows
- `damagePerHit`: 14 values match (levels 1-14) - characters.DPS x AttackSpeed/1000
- `deathDamage`: 14 values match (levels 1-14) - characters.DieDamage
- `damageVsWalls`: 14 values match (levels 1-14) - damagePerHit x PreferedTargetDamageMod / DamageMultiplierPercent
- `deathDamageVsWalls`: 14 values match (levels 1-14) - DieDamage x PreferedTargetDamageMod
- `hitpoints`: 14 values match (levels 1-14) - characters.Hitpoints
- `researchCost`: 13 values match (levels 2-14) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 13 values match (levels 2-14) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 13 values match (levels 2-14) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- PreferedTargetBuildingClass=Wall, PreferedTargetDamageMod=40, AttackCount=1, DamageRadius=80, DieDamage per level, DieDamageRadius=150, WallMovementCost=128, HealerWeight=0, AvoidNoiseInAttackPositionSelection=TRUE; globals WALL_BREAKER_SMART_RADIUS=2500, WALL_BREAKER_SMART_CNT_LIMIT=30, WALL_BREAKER_SMART_RETARGET_LIMIT=2000, WALL_BREAKER_USE_ROOMS=FALSE.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
