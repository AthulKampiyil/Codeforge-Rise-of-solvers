# Barbarian

- Source: [Barbarian/Home Village](https://clashofclans.fandom.com/wiki/Barbarian/Home_Village) (Home Village tab of the [Barbarian](https://clashofclans.fandom.com/wiki/Barbarian) tabber page)
- Wiki revision id: `624623` - retrieved 2026-09-15
- Client row: `characters.Barbarian` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 1, Town Hall 1 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 1.
- Movement speed: 18 in-game (wiki) = internal Speed 220 (17.6 before rounding) = 2.2 tiles/s.
- Attack: every 1 s; range 0.4 tiles.
- Damage type (wiki): Melee (Ground Only); client targets ground only.
- Favorite target: None - No preferred target: attacks the nearest building. If it (or a nearby ally) is attacked by defending Clan Castle troops, Heroes or Skeleton Trap skeletons that it is able to hit, it breaks off to fight them, then resumes with the nearest structure.
- Ground unit.
- Super Troop: Super Barbarian can be boosted (25,000 Dark Elixir on the wiki table) once this troop is level 8.
- Single-target melee unit with no ability; the baseline cheap filler/tank troop.
- Movement speed was raised from 16 to 18 on 2025-06-16 (internal 220; 220/12.5 = 17.6 is displayed as 18).
- Research times on the wiki are whole hours from level 3 onward (1h, 2h, 4h ... 12d 12h); see Ambiguities for the client minute column.

## Level table (wiki)

| Level | Damage per Second | Damage per Attack | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|
| 1 | 9 | 9 | 45 | N/A | N/A | N/A |
| 2 | 12 | 12 | 54 | 10,000 | 30m | 1 |
| 3 | 15 | 15 | 65 | 50,000 | 1h | 3 |
| 4 | 18 | 18 | 85 | 130,000 | 2h | 5 |
| 5 | 23 | 23 | 105 | 300,000 | 4h | 6 |
| 6 | 26 | 26 | 125 | 800,000 | 8h | 7 |
| 7 | 30 | 30 | 160 | 1,000,000 | 12h | 8 |
| 8 | 34 | 34 | 205 | 1,500,000 | 1d | 9 |
| 9 | 38 | 38 | 230 | 2,500,000 | 1d 12h | 10 |
| 10 | 42 | 42 | 250 | 4,300,000 | 2d | 12 |
| 11 | 45 | 45 | 270 | 6,000,000 | 3d | 13 |
| 12 | 48 | 48 | 290 | 8,000,000 | 4d | 14 |
| 13 | 51 | 51 | 310 | 24,000,000 | 12d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Melee (Ground Only) | 1 | 18 | 1s | 1 | 0.4 tiles |

### Client-only per-level values (not on the wiki table)

| Level | researchSecondsIfMinutesInherited |
|---|---|
| 1 | - |
| 2 | - |
| 3 | 5,400 |
| 4 | 9,000 |
| 5 | 16,200 |
| 6 | 30,600 |
| 7 | 45,000 |
| 8 | 88,200 |
| 9 | 131,400 |
| 10 | 174,600 |
| 11 | 261,000 |
| 12 | 347,400 |
| 13 | 1,081,800 |

## Client comparison

Checked 83 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 83 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| researchSeconds if UpgradeTimeM were inherited | 3-13 | whole hours (e.g. L3 1h = 3,600) | +1,800 s each (e.g. L3 5,400) | characters.UpgradeTimeM (row 1 only = 30) | wiki matches blank minute = 0; reference/full-client/progression.json uses the inherited reading |

### Ambiguities

- Barbarian row 1 is the only row in the whole 18.400.21 logic set that sets UpgradeTimeM (30) and leaves it blank on later rows. The wiki (troop page and Laboratory/Upgrade Chart) shows 1h for level 3, 2h for level 4, etc., i.e. blank minutes = 0. reference/full-client/progression.json forward-inherits the 30 minutes and therefore lists 5,400 s, 9,000 s ... for levels 3-13 (+1,800 s each).

### Matches

- `housingSpace`: wiki 1 = client 1 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 0.4 = client 0.4 - characters.AttackRange/100
- `barracksLevel`: wiki 1 = client 1 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 18 = client 18 - characters.Speed=220 -> /12.5 = 17.6
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 13 = client 13 - number of characters rows
- `dps`: 13 values match (levels 1-13) - characters.DPS
- `damagePerHit`: 13 values match (levels 1-13) - characters.DPS x AttackSpeed/1000
- `hitpoints`: 13 values match (levels 1-13) - characters.Hitpoints
- `researchCost`: 12 values match (levels 2-13) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 12 values match (levels 2-13) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 12 values match (levels 2-13) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- No ability columns; Speed=220, AttackRange=40, AttackSpeed=1000, DPS/Hitpoints per level.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
