# Meteor Golem

- Source: [Meteor Golem](https://clashofclans.fandom.com/wiki/Meteor_Golem)
- Wiki revision id: `624499` - retrieved 2026-09-15
- Client row: `characters.Meteor Golem` (pinned client 18.400.21)
- Spawns: [Meteormite](meteor-golem-meteormite.md)

## Mechanics

- Unlock: Barracks level 19, Town Hall 17 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 40.
- Movement speed: 12 in-game (wiki) = internal Speed 150 (12 before rounding) = 1.5 tiles/s.
- Attack: every 1 s; range 5 tiles.
- Damage type (wiki): Area Splash (Ground & Air); client targets ground and air; client splash radius 1 tile.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure. Bonus: x5 vs Wall without targeting preference.
- Ground unit.
- Heavy ground unit (40 housing) made of two stacked Meteormites. It attacks from 5 tiles by having one Meteormite hurl the other at the target; the attack deals area damage to ground and air units and 5x damage to walls, and the pair splits into two Meteormites.
- Each Meteormite from a split starts with half of the golem's current health (rounded down to a 1% step of Meteormite health). Below 1% health only one Meteormite (1 HP) appears where the throw lands.
- Separated Meteormites fight on their own or look for another Meteormite nearby and merge back into a golem, which is briefly invulnerable after forming. Cloned golems and defending Clan Castle golems do not merge again.
- The golem cannot cross walls, but its Meteormites can jump them.
- A separate temporary-troop version (Cosmic Rock event) has its own Town Hall-based table, archived below.

## Level table (wiki)

| Level | Damage | Hitpoints | Upgrade Cost | Upgrade Time | Laboratory Level Required |
|---|---|---|---|---|---|
| 1 | 480 | 14,500 | N/A | N/A | N/A |
| 2 | 530 | 16,000 | 28,000,000 | 14d | 15 |
| 3 | 580 | 17,500 | 30,000,000 | 16d | 16 |

### Archived temporary-troop table (wiki "As Temporary Troop")

| Level | Damage | Hitpoints | Town Hall Level Required |
|---|---|---|---|
| 1 | 170 | 4,000 | 6 |
| 2 | 198 | 5,000 | 7 |
| 3 | 226 | 6,000 | 8 |
| 4 | 254 | 7,000 | 9 |
| 5 | 282 | 8,000 | 10 |
| 6 | 310 | 8,500 | 11 |
| 7 | 338 | 9,000 | 12 |
| 8 | 366 | 10,000 | 13 |
| 9 | 394 | 11,000 | 14 |
| 10 | 430 | 12,000 | 15 |
| 11 | 465 | 13,000 | 16 |
| 12 | 500 | 14,500 | 17 |
| 13 | 550 | 16,000 | 18 |

### Wiki info box

| Preferred Target | Target Multiplier | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|---|
| None | Walls (5x Damage) | Area Splash (Ground & Air) | 40 | 12 | 1s | 19 | 5 tiles |

## Client comparison

Checked 22 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 21 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| defensiveVariantStats | 1 | not documented (attacking L1 14,500 HP / 480) | Defensive Meteor Golem 13,000 HP / 450 DPS | characters.Defensive Meteor Golem | client defensive rows keep pre-2026-07-14 values |

### Ambiguities

- Splash radius not given on the wiki; client DamageRadius=100 (1 tile).
- Client Defensive Meteor Golem / Defensive Meteormite still carry the pre-2026-07-14 stats (13,000 HP / 450 DPS at level 1), while the attacking versions have the buffed values the wiki shows.

### Matches

- `housingSpace`: wiki 40 = client 40 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 5 = client 5 - characters.AttackRange/100
- `barracksLevel`: wiki 19 = client 19 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 12 = client 12 - characters.Speed=150 -> /12.5 = 12
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `bonusMultiplier`: wiki Wall x5 = client Wall x5 - characters.DamageMultiplierTarget + DamageMultiplierPercent/100
- `maxLevel`: wiki 3 = client 3 - number of characters rows
- `damagePerHit`: 3 values match (levels 1-3) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 3 values match (levels 1-3) - characters.Hitpoints
- `researchCost`: 2 values match (levels 2-3) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 2 values match (levels 2-3) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 2 values match (levels 2-3) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- SecondaryTroop=Meteormite, SecondaryTroopCnt=1, SpawnOnAttack=TRUE, AttackCount=1, DamageRadius=100, DamageMultiplierTarget=Wall, DamageMultiplierPercent=500, DefensiveTroop=Defensive Meteor Golem; merge columns live on Meteormite (MergeToCharacter, MergeSearchRadius, InheritHealthPercentage).
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
