# Stone Slammer

- **Source:** https://clashofclans.fandom.com/wiki/Stone_Slammer
- **Wiki revision:** 624370; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Stone Slammer` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Workshop level 3 (Town Hall 12). Housing 1. Researched with Elixir.
- Flying machine that behaves like a huge Balloon: it targets defenses, moves fast (16) and drops boulders every 2.5 s that only hit ground targets.
- Each drop has two simultaneous hitboxes: a heavy 1-tile splash (1,000 at L1 to 2,050 at L6) that usually only hits the target, and a light 3-tile splash (100-200 at L1 to 350-700 at L6) that deals full damage within 2 tiles, falls to its minimum at 3 tiles and does 25x damage to Walls. The target takes both.
- Deals 500 damage when destroyed (all levels) and leaves earthquake-like cracks after attacks. HP 5,600-7,200.
- Carries the attacker's Clan Castle troops and releases them where it is destroyed (by damage, by reaching/finishing its objective, or by the player tapping release). It can be deployed with an empty Clan Castle, in which case nothing comes out.
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply. It is also unaffected by enemy Poison/Invisibility Spell Towers but is hit by the Giga Inferno's poison.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Defenses |
| attackType | Area Splash 1 and 3 tile Radius (Ground Only) |
| movementSpeed | 16 |
| attackSpeedSeconds | 2.5 |
| workshopLevel | 3 |
| hitbox2WikiUncertainLevels | [6] |

## Level table

| Level | DPS | Hitbox 1 dmg | Hitbox 2 min | Hitbox 2 max | Death damage | HP | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 400 | 1,000 | 100 | 200 | 500 | 5,600 | N/A | N/A | N/A |
| 2 | 500 | 1,250 | 150 | 300 | 500 | 5,900 | 2,500,000 | 2d | 10 |
| 3 | 600 | 1,500 | 200 | 400 | 500 | 6,200 | 3,500,000 | 3d | 10 |
| 4 | 700 | 1,750 | 250 | 500 | 500 | 6,500 | 6,500,000 | 7d | 11 |
| 5 | 750 | 1,875 | 300 | 600 | 500 | 6,800 | 10,000,000 | 9d | 13 |
| 6 | 820 | 2,050 | 350 | 700 | 500 | 7,200 | 26,000,000 | 13d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- hitbox 1 -> `DPS` x `AttackSpeed` 2500 ms, `DamageRadius` 100
- hitbox 2 -> `Damage2` (max) / `Damage2Min` (min), `Damage2Radius` 300, `Damage2FalloffStart` 200, `Damage2FalloffEnd` 300
- wall bonus -> `DamageMultiplierTarget` Wall, `DamageMultiplierPercent` 2500
- death -> `DieDamage` 500, `DieDamageRadius` 300, `DieDamageDelay` 416
- targeting -> `PreferedTargetBuildingClass` Defense, `NewTargetAttackDelay` 2250, `IsFlying` TRUE, `AirTargets` FALSE

**Automatic wiki-vs-client check**

- MATCH `workshopLevel`: wiki 3 vs client 3 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 16 vs client 16 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 2.5 vs client 2.5 (`AttackSpeed/1000`)
- MATCH `hitpoints` at levels 1-6 (`Hitpoints`)
- MATCH `dps` at levels 1-6 (`DPS`)
- MATCH `hitbox1Damage` at levels 1-6 (`DPS*AttackSpeed/1000`)
- MATCH `hitbox2MinDamage` at levels 1-6 (`Damage2Min`)
- MATCH `hitbox2MaxDamage` at levels 1-6 (`Damage2`)
- MATCH `deathDamage` at levels 1-6 (`DieDamage`)
- MATCH `researchCost` at levels 2-6 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-6 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-6 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Wiki marks L6 hitbox 2 as '350?-700?'; the client (`Damage2Min` 350, `Damage2` 700) confirms both numbers.
- The wiki applies the 25x Wall bonus to hitbox 2 only; the client stores it on the character (`DamageMultiplierPercent` 2500), so whether hitbox 1 also gets it is not determinable from data alone.
