# Baby Dragon

- Source: [Baby Dragon/Home Village](https://clashofclans.fandom.com/wiki/Baby_Dragon/Home_Village) (Home Village tab of the [Baby Dragon](https://clashofclans.fandom.com/wiki/Baby_Dragon) tabber page)
- Wiki revision id: `624765` - retrieved 2026-09-15
- Client row: `characters.Baby Dragon` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 11, Town Hall 9 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 10.
- Movement speed: 20 in-game (wiki) = internal Speed 250 (20 before rounding) = 2.5 tiles/s.
- Attack: every 1 s; range 2.75 tiles (client AttackRange/100 = 2.25).
- Damage type (wiki): Area Splash - 0.3 Tiles Radius (Ground & Air); client targets ground and air; client splash radius 0.3 tiles.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Super Troop: Inferno Dragon can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 6.
- Flying splash attacker (0.3-tile splash) hitting ground and air, one attack per second.
- Tantrum: while no allied air unit is within 4.5 tiles he is enraged, dealing +100% damage per hit and attacking 50% faster (enraged DPS = 3x base); movement speed is unchanged. The rage switches off as soon as an allied flyer comes within 4.5 tiles. The wiki notes that air-mode Skeleton Trap skeletons also cancel it.

## Level table (wiki)

| Level | Damage per Second | Enraged Damage per Second | Damage per Hit | Enraged Damage per Hit | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 75 | 225 | 75 | 150 | 1,200 | N/A | N/A | N/A |
| 2 | 85 | 255 | 85 | 170 | 1,300 | 1,500,000 | 1d | 7 |
| 3 | 95 | 285 | 95 | 190 | 1,400 | 2,000,000 | 1d 12h | 8 |
| 4 | 105 | 315 | 105 | 210 | 1,500 | 2,800,000 | 2d | 8 |
| 5 | 115 | 345 | 115 | 230 | 1,600 | 3,700,000 | 2d 18h | 9 |
| 6 | 125 | 375 | 125 | 250 | 1,700 | 4,800,000 | 3d | 10 |
| 7 | 135 | 405 | 135 | 270 | 1,800 | 6,200,000 | 4d | 11 |
| 8 | 145 | 435 | 145 | 290 | 1,900 | 9,500,000 | 6d | 12 |
| 9 | 155 | 465 | 155 | 310 | 2,000 | 11,000,000 | 7d | 13 |
| 10 | 165 | 495 | 165 | 330 | 2,100 | 13,500,000 | 7d 6h | 14 |
| 11 | 175 | 525 | 175 | 350 | 2,200 | 16,500,000 | 10d | 15 |
| 12 | 185 | 555 | 185 | 370 | 2,350 | 29,000,000 | 15d 6h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range | Ability Damage Increase | Ability Attack Speed Increase |
|---|---|---|---|---|---|---|---|---|
| None | Area Splash - 0.3 Tiles Radius (Ground & Air) | 10 | 20 | 1s | 11 | 2.75 tiles | 100% | 50% |

## Client comparison

Checked 105 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 103 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 2.75 | 2.25 | characters.AttackRange/100 | wiki - client = +0.5 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles) |
| movementSpeed (Troop Movement Speed page) | - | 16 / internal 200 | Speed=250 (20) | characters.Speed | troop page (20) matches client; TMS page stale |

### Ambiguities

- Range: wiki 2.75 tiles vs client AttackRange=225 (2.25 tiles).
- Troop Movement Speed page still lists 16 / internal 200; the troop page (20) matches client Speed=250.
- Enraged DPS on the wiki (225 at level 1) implies the +50% attack-speed boost multiplies attack rate (x1.5), not the interval.

### Matches

- `housingSpace`: wiki 10 = client 10 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `barracksLevel`: wiki 11 = client 11 - characters.BarrackLevel
- `abilityDamagePercent`: wiki 100 = client 100 - special_abilities.BabyDragonRageWhenAlone.BoostDamagePercentage
- `abilityAttackSpeedPercent`: wiki 50 = client 50 - special_abilities.BabyDragonRageWhenAlone.BoostAttackSpeedPercentage
- `movementSpeedWiki`: wiki 20 = client 20 - characters.Speed=250 -> /12.5 = 20
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `splashTiles`: wiki 0.3 = client 0.3 - characters.DamageRadius/100
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 12 = client 12 - number of characters rows
- `dps`: 12 values match (levels 1-12) - characters.DPS
- `enragedDps`: 12 values match (levels 1-12) - DPS x (100+BoostDamagePercentage)/100 x (100+BoostAttackSpeedPercentage)/100
- `damagePerHit`: 12 values match (levels 1-12) - characters.DPS x AttackSpeed/1000
- `enragedDamagePerHit`: 12 values match (levels 1-12) - damagePerHit x (100+BoostDamagePercentage)/100
- `hitpoints`: 12 values match (levels 1-12) - characters.Hitpoints
- `researchCost`: 11 values match (levels 2-12) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 11 values match (levels 2-12) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 11 values match (levels 2-12) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- SpecialAbilities=BabyDragonRageWhenAlone: BoostDamagePercentage=100, BoostAttackSpeedPercentage=50, ActiveWhileAloneRadius=450, DeactivateWhileNotAloneRadius=450, ActiveWhileAlive=TRUE.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
