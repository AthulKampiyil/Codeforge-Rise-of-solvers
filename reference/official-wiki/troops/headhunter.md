# Headhunter

- Source: [Headhunter](https://clashofclans.fandom.com/wiki/Headhunter)
- Wiki revision id: `625334` - retrieved 2026-09-15
- Client row: `characters.Headhunter` (pinned client 18.400.21)

## Mechanics

- Unlock: Dark Barracks level 9, Town Hall 12 (client buildings.TownHallLevel). Researched in the Laboratory with Dark Elixir.
- Housing space: 6.
- Movement speed: 32 in-game (wiki) = internal Speed 300 (24 before rounding) = 3 tiles/s.
- Attack: every 0.6 s; range 3 tiles.
- Damage type (wiki): Single Target; client targets ground and air.
- Favorite target: Heroes (x4 Damage) - Hero-first: bypasses all buildings and defending troops while any enemy Hero is on the battlefield, even when attacked by Clan Castle troops or Skeleton Trap skeletons. Guardians are not Heroes. Once all Heroes are knocked out it behaves like a no-preference troop. Damage multiplier vs preferred target: x4.
- Ground unit. Jumps/passes over walls (IsJumper=TRUE).
- Interactions (client flags): Healer target weight 2 (HealerWeight).
- Fast ranged hero-hunter (3 tiles, 0.6 s, hits ground and air) that jumps over walls.
- Goes for enemy Heroes above everything else and deals 4x damage to them; once all Heroes are down she has no preference (she does not specifically chase Clan Castle troops, Guardians or skeletons).
- Every hit poisons troops and Heroes (not buildings) for a short time: movement slowed 40-46% and attack rate reduced 55-68% by level, with poison damage that ramps up toward 220-300 DPS; a single Headhunter rarely lets the ramp build, so the damage matters mainly when several stack.
- A Spring Trap only springs one Headhunter at a time and prefers heavier troops caught with her.

## Level table (wiki)

| Level | Damage per Second | Damage per Hit | DPS on Heroes | Poison Max DPS | Speed Decrease | Attack Rate Decrease | Hitpoints | Research Cost | Research Time | Laboratory Level Required |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 105 | 63 | 420 | 220 | 40% | 55% | 360 | N/A | N/A | N/A |
| 2 | 115 | 69 | 460 | 260 | 42% | 60% | 400 | 57,500 | 5d | 10 |
| 3 | 125 | 75 | 500 | 280 | 44% | 65% | 440 | 90,000 | 7d | 11 |
| 4 | 135 | 81 | 540 | 300 | 46% | 68% | 500 | 370,000 | 15d 12h | 16 |

### Wiki info box

| Preferred Target | Attack Type | Housing Space | Movement Speed | Attack Speed | Dark Barracks Level Required | Range |
|---|---|---|---|---|---|---|
| Heroes (x4 Damage) | Single Target | 6 | 32 | 0.6s | 9 | 3 tiles |

### Client-only per-level values (not on the wiki table)

| Level | poisonSpellLevel |
|---|---|
| 1 | 5 |
| 2 | 6 |
| 3 | 7 |
| 4 | 8 |

## Client comparison

Checked 45 wiki values against `characters.json` (and linked spells, abilities, projectiles, globals); 44 match exactly.

### Mismatches and version skew

| Field | Level | Wiki | Client | Client column | Note |
|---|---|---|---|---|---|
| movementSpeedWiki | - | 32 | 24 | characters.Speed=300 -> /12.5 = 24 | Troop Movement Speed page lists 24 / internal 300, matching the client |

### Ambiguities

- Movement speed: troop page says 32 ("same as Goblins/Minions/Miners"); client Speed=300 (24) and the Troop Movement Speed page (24 / 300) disagree with the troop page.
- Her poison reuses the Poison spell rows (levels 5-8), which also carry HeroDamageMultiplier=5 and GuardianDamageMultiplier=30; the wiki does not say whether those scale her poison damage.

### Matches

- `housingSpace`: wiki 6 = client 6 - characters.HousingSpace
- `attackSeconds`: wiki 0.6 = client 0.6 - characters.AttackSpeed/1000
- `attackRangeTiles`: wiki 3 = client 3 - characters.AttackRange/100
- `barracksLevel`: wiki 9 = client 9 - characters.BarrackLevel
- `favoriteTarget`: wiki Heroes = client Heroes - characters.PreferedTargetBuildingClass / PreferedTargetBuilding / PreferHeroes
- `favoriteMultiplier`: wiki 4 = client 4 - characters.PreferedTargetDamageMod (Headhunter: HeroDamageMultiplier/100)
- `maxLevel`: wiki 4 = client 4 - number of characters rows
- `dps`: 4 values match (levels 1-4) - characters.DPS
- `damagePerHit`: 4 values match (levels 1-4) - characters.DPS x AttackSpeed/1000
- `dpsVsFavorite`: 4 values match (levels 1-4) - DPS x PreferedTargetDamageMod (or HeroDamageMultiplier/100)
- `poisonMaxDps`: 4 values match (levels 1-4) - spells.Poison.PoisonDPS at HeadhunterPoison.PoisonOnHitSpellLevel
- `poisonSpeedDecreasePercent`: 4 values match (levels 1-4) - -spells.Poison.SpeedBoost
- `poisonAttackRateDecreasePercent`: 4 values match (levels 1-4) - -spells.Poison.AttackSpeedBoost
- `hitpoints`: 4 values match (levels 1-4) - characters.Hitpoints
- `researchCost`: 3 values match (levels 2-4) - characters.UpgradeCost of row (level-1)
- `researchSeconds`: 3 values match (levels 2-4) - characters.UpgradeTimeH*3600 + UpgradeTimeM*60 of row (level-1), blank minute = 0
- `laboratoryLevel`: 3 values match (levels 2-4) - characters.LaboratoryLevel of row (level)

### Client columns that encode the mechanics

- PreferHeroes=TRUE, HeroDamageMultiplier=400, IsJumper=TRUE, HealerWeight=2; SpecialAbilities=HeadhunterPoison: PoisonOnHitSpell=Poison, PoisonOnHitSpellLevel=troop level+4, PoisonOnHitDuration=3000 -> Poison.PoisonDPS, SpeedBoost, AttackSpeedBoost, PoisonIncreaseSlowly=TRUE.
- Research: level N costs `UpgradeCost` and takes `UpgradeTimeH`(+`UpgradeTimeM`) from row N-1, and requires `LaboratoryLevel` from row N; row 1 values of LaboratoryLevel are placeholders.
