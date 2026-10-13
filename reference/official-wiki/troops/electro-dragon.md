# Electro Dragon

- Source: [Electro Dragon](https://clashofclans.fandom.com/wiki/Electro_Dragon)
- Wiki revision id: `625283` - retrieved 2026-09-15
- Client row: `characters.Electro Dragon` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 13, Town Hall 11 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 30.
- Movement speed: 13 in-game (wiki) = internal Speed 160 (12.8 before rounding) = 1.6 tiles/s.
- Attack: every 3.5 s; range 3 tiles (client AttackRange/100 = 2.5).
- Damage type (wiki): Ranged (Ground and Air) / Chain Lightning; client targets ground and air.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Slow flying unit whose breath is a chain lightning: it hits the primary target and then jumps to up to 4 more targets (5 in total), each within 3 tiles of the previous one, losing 20% per jump (multiplicative). One attack every 3.5 s; hits ground and air.
- Chain order: the closest not-yet-hit target to the previous target; ties go to the target with the highest maximum hitpoints.
- On death it calls down 6 lightning strikes, 0.4 s apart, landing randomly within 2.5 tiles and hitting a 2-tile radius each (damage per strike 65 at level 1 up to 145 at level 9).

## Level table (wiki)

| Level | Damage per Second / (Primary Target) | Damage per Hit / (Primary Target) | Damage when destroyed | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 260 | 910 | 65 x6 | 3,400 | N/A | N/A | N/A |
| 2 | 290 | 1,015 | 75 x6 | 3,900 | 6,000,000 | 4d | 9 |
| 3 | 320 | 1,120 | 85 x6 | 4,400 | 7,000,000 | 4d 12h | 10 |
| 4 | 350 | 1,225 | 95 x6 | 4,700 | 9,000,000 | 7d | 11 |
| 5 | 380 | 1,330 | 105 x6 | 5,000 | 11,000,000 | 8d | 12 |
| 6 | 410 | 1,435 | 115 x6 | 5,400 | 14,000,000 | 8d 12h | 13 |
| 7 | 440 | 1,540 | 125 x6 | 5,700 | 16,000,000 | 9d | 14 |
| 8 | 475 | 1,662.5 | 135 x6 | 6,400 | 20,000,000 | 10d | 15 |
| 9 | 510 | 1,785 | 145 x6 | 6,900 | 30,000,000 | 16d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Number of Targets | Chain Damage Decay | Chain Distance | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|---|---|---|
| None | Ranged (Ground and Air) / Chain Lightning | 5 | -20% | 3 tiles | 30 | 13 | 3.5s | 13 | 3 tiles |

### Client-only per-level values (not on the wiki table)

| Level | deathSpellLevel |
|---|---|
| 1 | 4 |
| 2 | 5 |
| 3 | 6 |
| 4 | 7 |
| 5 | 8 |
| 6 | 9 |
| 7 | 10 |
| 8 | 11 |
| 9 | 12 |

## Client comparison

Checked 81 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 79 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 3 | 2.5 | characters.AttackRange/100 | wiki - client = +0.5 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles) |
| movementSpeed (Troop Movement Speed page) | - | 12 / internal 150 | Speed=160 (12.8) | characters.Speed | troop page (13) matches client; TMS page stale |

### Ambiguities

- Range: wiki 3 tiles vs client AttackRange=250 (2.5 tiles).
- Troop Movement Speed page lists 12 / internal 150; the troop page (13) matches client Speed=160 (12.8).

### Matches

- `housingSpace`: wiki 30 = client 30 - characters.HousingSpace
- `attackSeconds`: wiki 3.5 = client 3.5 - characters.AttackSpeed/1000
- `barracksLevel`: wiki 13 = client 13 - characters.BarrackLevel
- `chainTargets`: wiki 5 = client 5 - characters.ChainAttackDepth (Druid: ProjectileBounces+1)
- `chainDecayPercent`: wiki -20 = client -20 - -characters.ChainAttackDamageReductionPercent
- `chainDistanceTiles`: wiki 3 = client 3 - characters.ChainAttackDistance/100
- `movementSpeedWiki`: wiki 13 = client 13 - characters.Speed=160 -> /12.5 = 12.8
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 9 = client 9 - number of characters rows
- `dps`: 9 values match (levels 1-9) - characters.DPS
- `damagePerHit`: 9 values match (levels 1-9) - characters.DPS x AttackSpeed/1000
- `deathDamage`: 9 values match (levels 1-9) - characters.DieDamage
- `deathDamageHits`: 9 values match (levels 1-9) - spells.ElectroDragonDie.NumberOfHits
- `hitpoints`: 9 values match (levels 1-9) - characters.Hitpoints
- `researchCost`: 8 values match (levels 2-9) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 8 values match (levels 2-9) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 8 values match (levels 2-9) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- ChainAttackDepth=5, ChainAttackDistance=300, ChainAttackDamageReductionPercent=20, ChainAttackFactor=1, ChainAttackDelay=128 ms, CoolDownOverride=625; SpecialAbilities=ElectroDragonOnDeath (SelfSpell ElectroDragonDie, SelfSpellLevel = troop level + 3): Damage, NumberOfHits=6, Radius=200, RandomRadius=250, TimeBetweenHitsMS=400, DeployTimeMS=800, ChargingTimeMS=1000.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
