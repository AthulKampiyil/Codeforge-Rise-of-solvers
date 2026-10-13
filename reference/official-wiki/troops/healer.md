# Healer

- Source: [Healer](https://clashofclans.fandom.com/wiki/Healer)
- Wiki revision id: `624772` - retrieved 2026-09-15
- Client row: `characters.Healer` (pinned client 18.400.21)

## Mechanics

- Unlock: Barracks level 8, Town Hall 6 (client buildings.TownHallLevel). Researched in the Laboratory with Elixir.
- Housing space: 14.
- Movement speed: 16 in-game (wiki) = internal Speed 200 (16 before rounding) = 2 tiles/s.
- Heal cadence: every 0.7 s; range 5 tiles (client AttackRange/100 = 4.5).
- Damage type (wiki): Heal Splash; 1.5 Tiles (Ground Only); client targets ground only; client splash radius 1.5 tiles.
- Favorite target: None (wiki info box); template rule "Healing" - Cannot attack: ignores enemy buildings and troops, even ones attacking it, and idles in place when nothing needs healing.
- Flying (only air-targeting defenses can hit it; ignores walls).
- Flying support unit with no attack; heals ground units only (never air units, siege machines or buildings). Each pulse (every 0.7 s) heals everything in 1.5 tiles around her target.
- Locks onto the closest friendly ground unit/Hero regardless of damage and keeps healing it until it dies. Per the wiki she will not heal a target group worth 2 housing or less (a lone Barbarian or Wall Breaker).
- Heroes are healed at a reduced rate: 55% of normal at levels 1-4, rising to 67/78/87/90/94/98% and 108% at level 11 (client HeroDamageMultiplier). The wiki rounds the hero HPS down to a whole number.
- Diminishing returns when several heal the same unit: 1st-2nd 100%, 3rd-4th 90%, 5th 70%, 6th 40%, 7th 10%, 8th+ 0% (the same table is shared with Druids and the Unicorn).
- A battle ends if Healers are the only troops left. She triggers air traps (Air Bomb, Seeking Air Mine).
- On defense she heals Clan Castle troops, Heroes and Skeleton Trap skeletons; while poisoned a defending Healer neither leaves the poison nor heals.

## Level table (wiki)

| Level | Healing per Second | Healing per Pulse | HPS on Heroes | HPP on Heroes | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 36 | 25.2 | 19 | 13.3 | 500 | N/A | N/A | N/A |
| 2 | 48 | 33.6 | 26 | 18.2 | 700 | 450,000 | 12h | 5 |
| 3 | 60 | 42 | 33 | 23.1 | 900 | 900,000 | 1d | 6 |
| 4 | 66 | 46.2 | 36 | 25.2 | 1,200 | 2,500,000 | 2d | 7 |
| 5 | 72 | 50.4 | 48 | 33.6 | 1,500 | 4,000,000 | 3d | 9 |
| 6 | 72 | 50.4 | 56 | 39.2 | 1,600 | 6,000,000 | 4d 12h | 11 |
| 7 | 72 | 50.4 | 62 | 43.4 | 1,700 | 9,500,000 | 6d 12h | 12 |
| 8 | 76 | 53.2 | 68 | 47.6 | 1,800 | 11,000,000 | 7d | 13 |
| 9 | 80 | 56 | 75 | 52.5 | 1,900 | 13,000,000 | 7d 6h | 14 |
| 10 | 80 | 56 | 78 | 54.6 | 2,000 | 17,000,000 | 11d | 15 |
| 11 | 82 | 57.4 | 88 | 61.6 | 2,100 | 28,500,000 | 15d | 16 |

### Wiki info box

| Preferred Target | Effect Type | Housing Space | Movement Speed | Heal Speed | Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| None | Heal Splash; 1.5 Tiles (Ground Only) | 14 | 16 | 0.7s | 8 | 5 tiles |

### Client-only per-level values (not on the wiki table)

| Level | heroHealPercent | hpsHeroesExact | healPerPulseHeroesExact |
|---|---|---|---|
| 1 | 55 | 19.8 | 13.86 |
| 2 | 55 | 26.4 | 18.48 |
| 3 | 55 | 33 | 23.1 |
| 4 | 55 | 36.3 | 25.41 |
| 5 | 67 | 48.24 | 33.768 |
| 6 | 78 | 56.16 | 39.312 |
| 7 | 87 | 62.64 | 43.848 |
| 8 | 90 | 68.4 | 47.88 |
| 9 | 94 | 75.2 | 52.64 |
| 10 | 98 | 78.4 | 54.88 |
| 11 | 108 | 88.56 | 61.992 |

## Client comparison

Checked 94 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 93 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| attackRangeTiles | - | 5 | 4.5 | characters.AttackRange/100 | wiki - client = +0.5 tiles; flying unit (most wiki flyer ranges are client range + 0.5 tiles) |

### Ambiguities

- Range: wiki 5 tiles vs client AttackRange=450 (4.5 tiles).
- The "housing 2 or less" rule is not a visible column; the client instead carries per-unit HealerWeight (0 for Wall Breaker, Skeleton, Yetimite, Firemite, Furnace, Ruin Witch; 1 Golemite/Ice Golem/Ruin Knight; 2 Headhunter; 5 Golem/Bear; 10 Apprentice Warden) and the global USE_SMARTER_HEALER=TRUE. A commented-out Healer Weight table in the wiki source lists exactly these weights.

### Matches

- `housingSpace`: wiki 14 = client 14 - characters.HousingSpace
- `attackSeconds`: wiki 0.7 = client 0.7 - characters.AttackSpeed/1000
- `barracksLevel`: wiki 8 = client 8 - characters.BarrackLevel
- `movementSpeedWiki`: wiki 16 = client 16 - characters.Speed=200 -> /12.5 = 16
- `targets`: wiki ground = client ground - characters.GroundTargets / AirTargets
- `splashTiles`: wiki 1.5 = client 1.5 - characters.DamageRadius/100
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 11 = client 11 - number of characters rows
- `hps`: 11 values match (levels 1-11) - -characters.DPS (negative DPS = healing)
- `healPerPulse`: 11 values match (levels 1-11) - -characters.DPS x AttackSpeed/1000
- `hpsHeroes`: 11 values match (levels 1-11) - floor(-DPS x HeroDamageMultiplier/100)
- `healPerPulseHeroes`: 11 values match (levels 1-11) - floor(-DPS x HeroDamageMultiplier/100) x AttackSpeed/1000
- `hitpoints`: 11 values match (levels 1-11) - characters.Hitpoints
- `researchCost`: 10 values match (levels 2-11) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 10 values match (levels 2-11) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 10 values match (levels 2-11) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- DPS<0 encodes heal per second; AttackSpeed=700 pulse; DamageRadius=150 heal splash; HeroDamageMultiplier per level; globals HEAL_STACK_PERCENT=[100,100,90,90,70,40,10,0], USE_SMARTER_HEALER, CLONE_HEALER_WEIGHT_PERCENT=40; per-target HealerWeight on other characters.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
