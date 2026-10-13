# Electro Titan

- Source: [Electro Titan](https://clashofclans.fandom.com/wiki/Electro_Titan)
- Wiki revision id: `624602` - retrieved 2026-09-15
- Client row: `characters.Electro Titan` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 16, Town Hall 14 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 32.
- Movement speed: 16 in-game (wiki) = internal Speed 200 (16 before rounding) = 2 tiles/s.
- Attack: every 1.5 s; range 1.25 tiles.
- Damage type (wiki): Ranged (Ground & Air); client targets ground and air.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Very tough ground unit with a short whip (1.25 tiles, every 1.5 s) that can hit ground and air.
- Electro aura: every 0.4 s she damages all enemy buildings (except walls) and enemy troops within 3.5 tiles (75 DPS at level 1 up to 150 at level 5). The aura cannot be boosted by Rage; on defense Poison and Freeze do not stop it, and Invisibility does not protect troops from it.
- With only 1.25 tiles of reach she cannot whip buildings standing one tile behind a wall.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | Aura Damage per Second | Aura Damage per Hit | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 180 | 270 | 75 | 30 | 7,200 | N/A | N/A | N/A |
| 2 | 200 | 300 | 100 | 40 | 7,700 | 14,000,000 | 8d | 12 |
| 3 | 220 | 330 | 125 | 50 | 8,200 | 16,000,000 | 9d | 13 |
| 4 | 240 | 360 | 137.5 | 55 | 8,700 | 18,500,000 | 11d | 14 |
| 5 | 270 | 405 | 150 | 60 | 9,200 | 30,000,000 | 16d | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Aura Attack Speed | Range | Aura Radius | Barracks Level Required |
|---|---|---|---|---|---|---|---|---|
| None | Ranged (Ground & Air) | 32 | 16 | 1.5s | 0.4s | 1.25 tiles | 3.5 tiles | 16 |

## Client comparison

Checked 48 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 47 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| auraHeroDamagePercent | - | not stated | 25 | spells.Electro Titan Aura.HeroDamageMultiplier |  |

### Ambiguities

- Client aura spell has HeroDamageMultiplier=25 (Heroes take 25% aura damage); not mentioned on the wiki page.

### Matches

- `housingSpace`: wiki 32 = client 32 - characters.HousingSpace
- `attackSeconds`: wiki 1.5 = client 1.5 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 1.25 = client 1.25 - characters.AttackRange/100
- `barracksLevel`: wiki 16 = client 16 - characters.BarrackLevel
- `auraSeconds`: wiki 0.4 = client 0.4 - aura spell TimeBetweenHitsMS/1000
- `auraRadiusTiles`: wiki 3.5 = client 3.5 - aura spell Radius/100
- `movementSpeedWiki`: wiki 16 = client 16 - characters.Speed=200 -> /12.5 = 16
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 5 = client 5 - number of characters rows
- `dps`: 5 values match (levels 1-5) - characters.DPS
- `damagePerHit`: 5 values match (levels 1-5) - characters.DPS x AttackSpeed/1000
- `auraDps`: 5 values match (levels 1-5) - aura spell Damage x 1000/TimeBetweenHitsMS
- `auraDamagePerHit`: 5 values match (levels 1-5) - aura spell Damage
- `hitpoints`: 5 values match (levels 1-5) - characters.Hitpoints
- `researchCost`: 4 values match (levels 2-5) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 4 values match (levels 2-5) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 4 values match (levels 2-5) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- AuraSpell=Electro Titan Aura, AuraSpellLevel=troop level: Damage per hit, Radius=350, TimeBetweenHitsMS=400, NumberOfHits=4000 (effectively permanent), HeroDamageMultiplier=25, ImmunityWalls=TRUE.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
