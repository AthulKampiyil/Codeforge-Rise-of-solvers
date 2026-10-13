# Miner

- Source: [Miner](https://clashofclans.fandom.com/wiki/Miner)
- Wiki revision id: `624732` - retrieved 2026-09-15
- Client row: `characters.Miner` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 12, Town Hall 10 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 6.
- Movement speed: 32 in-game (wiki) = internal Speed 400 (32 before rounding) = 4 tiles/s.
- Attack: every 1.7 s; range 0.5 tiles (client AttackRange/100 = 0.6).
- Damage type (wiki): Single Target; client targets ground only.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit. Travels underground (IsUnderground=TRUE).
- Super Troop: Super Miner can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 7.
- Burrows underground whenever he travels: while burrowed he cannot be targeted or damaged, ignores walls and does not set off traps, but spells still affect him. He surfaces next to his target to attack.
- Traps near buildings still catch him when he pops up; the Tornado Trap cannot pull him.
- Single-target ground attacker, one strike every 1.7 s.
- As a defending Clan Castle troop he does not burrow and walks above ground more slowly (Troop Movement Speed page: 20 / internal 250).

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 80 | 136 | 550 | N/A | N/A | N/A |
| 2 | 88 | 149.6 | 610 | 1,500,000 | 1d | 8 |
| 3 | 96 | 163.2 | 670 | 2,600,000 | 2d | 8 |
| 4 | 104 | 176.8 | 730 | 3,000,000 | 2d 6h | 9 |
| 5 | 112 | 190.4 | 800 | 4,000,000 | 2d 12h | 9 |
| 6 | 120 | 204 | 900 | 4,800,000 | 3d | 10 |
| 7 | 128 | 217.6 | 1,000 | 6,000,000 | 4d | 11 |
| 8 | 136 | 231.2 | 1,150 | 8,600,000 | 6d | 12 |
| 9 | 144 | 244.8 | 1,350 | 10,500,000 | 6d 12h | 13 |
| 10 | 160 | 272 | 1,550 | 12,500,000 | 7d | 14 |
| 11 | 175 | 297.5 | 1,750 | 16,500,000 | 9d 12h | 15 |
| 12 | 195 | 331.5 | 2,050 | 28,000,000 | 14d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Single Target | 6 | 32 | 1.7s | 12 | 0.5 tiles |

## Client comparison

Checked 77 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 75 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 0.5 | 0.6 | characters.AttackRange/100 | wiki - client = -0.1 tiles; no history entry explains the difference |
| defensiveWalkSpeed (Troop Movement Speed page) | - | internal 250 (20) | Speed 400 x UNDERGROUND_UNIT_GROUND_SPEED_PERCENTAGE 70% = 280 (22.4) | globals.UNDERGROUND_UNIT_GROUND_SPEED_PERCENTAGE | unverified whether the global applies to defensive Miners |

### Ambiguities

- Range: wiki 0.5 tile vs client AttackRange=60 (0.6 tile).
- Defensive walking speed: wiki 250 internal; client global UNDERGROUND_UNIT_GROUND_SPEED_PERCENTAGE=70 would give 280 (in-game 22.4) if it applies to him.

### Matches

- `housingSpace`: wiki 6 = client 6 - characters.HousingSpace
- `attackSeconds`: wiki 1.7 = client 1.7 - characters.AttackSpeed/1000
- `barracksLevel`: wiki 12 = client 12 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 32 = client 32 - characters.Speed=400 -> /12.5 = 32
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 12 = client 12 - number of characters rows
- `dps`: 12 values match (levels 1-12) - characters.DPS
- `damagePerHit`: 12 values match (levels 1-12) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 12 values match (levels 1-12) - characters.Hitpoints
- `researchCost`: 11 values match (levels 2-12) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 11 values match (levels 2-12) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 11 values match (levels 2-12) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- IsUnderground=TRUE (no IsJumper); globals MINER_HIDE_TIME=1000, MINER_HIDE_TIME_RANDOM=250, MINER_TARGET_RAND_P=0, MINER_SPEED_RAND_P=0, UNDERGROUND_UNIT_GROUND_SPEED_PERCENTAGE=70.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
