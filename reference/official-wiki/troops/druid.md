# Druid

- Source: [Druid](https://clashofclans.fandom.com/wiki/Druid)
- Wiki revision id: `624267` - retrieved 2026-09-15
- Client row: `characters.Druid` (pinned client 18.400.21)
- Spawns: [Bear (Druid form)](druid-bear.md)

## Mechanics

- Unlock: Dark Barracks level 11, Town Hall 14 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 16.
- Movement speed: 24 in-game (wiki) = internal Speed 300 (24 before rounding) = 3 tiles/s.
- Heal cadence: every 1 s; range 5 tiles.
- Damage type (wiki): Ranged (Ground & Air) / Chain Healing; client targets ground and air.
- Favorite target: None (wiki info box); template rule "HealTransitionToAttack" - Cannot attack in its initial form (heals instead, ignores enemies, idles when there is nothing to heal) but later transforms into a unit that fights.
- Ground unit. Jumps/passes over walls (IsJumper=TRUE).
- Ground healer (no attack) for the first 30 s after deployment: his staff projectile heals a target within 5 tiles once per second and bounces to up to 4 targets in total, ground or air. Siege Machines cannot be healed.
- Heroes receive 105% of the heal at levels 1-2, 110% at 3-4 and 115% at 5-6 (unlike the Healer's reduced hero rate).
- A blue bar fills over 30 s; when full, or when his health reaches zero first, he turns into a Bear (see druid-bear). If a Spring Trap ejects him, no Bear appears.
- He can hop walls in human form; the Bear cannot. If he is the last unit on the field the battle does not end immediately (he transforms and fights).
- Evolution time history: 30 s, reduced to 25 s on 2024-10-02, restored to 30 s on 2026-01-12.
- Multiple heal sources on one target use the shared diminishing table (100/100/90/90/70/40/10/0%).

## Level table (wiki)

| Level | Healing per Second | Healing per Hit | Hero Healing | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|
| 1 | 80 | 80 | 84 | 1,300 | N/A | N/A | N/A |
| 2 | 85 | 85 | 89.25 | 1,400 | 125,000 | 8d | 12 |
| 3 | 90 | 90 | 99 | 1,500 | 175,000 | 9d | 13 |
| 4 | 95 | 95 | 104.5 | 1,600 | 187,500 | 11d | 14 |
| 5 | 105 | 105 | 120.75 | 1,700 | 300,000 | 12d | 15 |
| 6 | 115 | 115 | 132.25 | 1,850 | 380,000 | 15d 12h | 16 |

### Wiki info box

| Preferred Target | Effect Type | Number of Targets | Housing Space | Movement Speed | Heal Speed | Dark Barracks Level Required | Range | Evolve Time |
|---|---|---|---|---|---|---|---|---|
| None | Ranged (Ground & Air) / Chain Healing | 4 | 16 | 24 | 1s | 11 | 5 tiles | 30s |

### Client-only per-level values (not on the wiki table)

| Level | heroHealPercent |
|---|---|
| 1 | 105 |
| 2 | 105 |
| 3 | 110 |
| 4 | 110 |
| 5 | 115 |
| 6 | 115 |

## Client comparison

Checked 49 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 49 match exactly.

### Mismatches and version skew

None found: every compared wiki number equals the client-derived value.

### Matches

- `housingSpace`: wiki 16 = client 16 - characters.HousingSpace
- `attackSeconds`: wiki 1 = client 1 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 5 = client 5 - characters.AttackRange/100
- `barracksLevel`: wiki 11 = client 11 - characters.BarrackLevel
- `chainTargets`: wiki 4 = client 4 - characters.ChainAttackDepth (Druid: ProjectileBounces+1)
- `evolveSeconds`: wiki 30 = client 30 - characters.EvolveTime/1000
- `movementSpeedWiki`: wiki 24 = client 24 - characters.Speed=300 -> /12.5 = 24
- `targets`: wiki ground+air = client ground+air - characters.GroundTargets / AirTargets
- `favoriteTarget`: wiki None = client None - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `maxLevel`: wiki 6 = client 6 - number of characters rows
- `hps`: 6 values match (levels 1-6) - -characters.DPS (negative DPS = healing)
- `healPerHit`: 6 values match (levels 1-6) - -characters.DPS x AttackSpeed/1000
- `heroHealPerHit`: 6 values match (levels 1-6) - -DPS x AttackSpeed/1000 x HeroDamageMultiplier/100
- `hitpoints`: 6 values match (levels 1-6) - characters.Hitpoints
- `researchCost`: 5 values match (levels 2-6) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 5 values match (levels 2-6) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 5 values match (levels 2-6) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- DPS<0 (heal), AttackSpeed=1000, CoolDownOverride=450, ProjectileBounces=3 (4 targets), projectile BattleDruidProjectile MaxBounceDistance=450, HeroDamageMultiplier per level, EvolveToCharacter=Bear, EvolveTime=30000, SecondaryTroop=Bear (on death), SecondaryTroopCnt=1, DontSpawnSecondaryWhenEjected=TRUE, IsJumper=TRUE.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
