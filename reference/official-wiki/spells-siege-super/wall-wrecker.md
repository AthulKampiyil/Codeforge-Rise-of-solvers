# Wall Wrecker

- **Source:** https://clashofclans.fandom.com/wiki/Wall_Wrecker
- **Wiki revision:** 624364; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Wall Wrecker` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Workshop level 1 (Town Hall 12). Occupies the single siege slot (housing 1). Researched with Elixir (L2 needs Laboratory 10).
- Ground machine that drives straight for the enemy Town Hall and batters anything in its way with a splash ram attack every 1.3 s; Walls take 10x damage (they are hit, not sought out).
- Stats: speed 12; DPS 250 (L1) to 670 (L6); damage per hit = DPS x 1.3 (325 to 871); HP 5,500 to 10,000 (L5/L6 buffed January 2026).
- Carries the attacker's Clan Castle troops and releases them where it is destroyed (by damage, by reaching/finishing its objective, or by the player tapping release). It can be deployed with an empty Clan Castle, in which case nothing comes out. It self-destructs on reaching the Town Hall.
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply. Life Gem and Eternal Tome affect it.
- Jump Spells do not change its pathing; Overgrowth-covered buildings in its path stop it (it keeps hitting them for no damage).

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Walls (Damage x10) |
| attackType | Area Splash |
| housingSpace | 1 |
| movementSpeed | 12 |
| attackSpeedSeconds | 1.3 |
| workshopLevel | 1 |

## Level table

| Level | DPS | Damage / hit | Damage vs Walls | HP | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|---|
| 1 | 250 | 325 | 3,250 | 5,500 | N/A | N/A | N/A |
| 2 | 300 | 390 | 3,900 | 6,000 | 2,500,000 | 2d | 10 |
| 3 | 350 | 455 | 4,550 | 6,500 | 3,500,000 | 3d | 10 |
| 4 | 400 | 520 | 5,200 | 7,000 | 6,500,000 | 7d | 11 |
| 5 | 580 | 754 | 7,540 | 8,500 | 10,000,000 | 9d | 13 |
| 6 | 670 | 871 | 8,710 | 10,000 | 26,000,000 | 13d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- DPS / damage per hit -> `DPS` x `AttackSpeed` 1300 ms
- wall bonus -> `PreferedTargetBuildingClass` Wall + `PreferedTargetDamageMod` 10 + `PreferredTargetNoTargeting` TRUE
- destination -> `PreferredMovementTarget` Town Hall; globals `SIEGE_MACHINE_SELF_DESTRUCT_ON_REACHING_TARGET` TRUE
- splash / reach -> `DamageRadius` 150, `AttackRange` 150 (1.5 tiles), `CoolDownOverride` 550
- speed -> `Speed` 150 internal = 12 in-game (internal / 12.5)
- manual release -> `SpecialAbilities` SiegeMachineRamSelfDestruct (`SelfDestruct`, `ActiveAfterPlayerInput`)
- healing immunity -> `ImmuneToHealing` TRUE
- pathing -> `WallMovementCost` 16

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `workshopLevel`: wiki 1 vs client 1 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 12 vs client 12 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1.3 vs client 1.3 (`AttackSpeed/1000`)
- MATCH `hitpoints` at levels 1-6 (`Hitpoints`)
- MATCH `dps` at levels 1-6 (`DPS`)
- MATCH `damagePerHit` at levels 1-6 (`DPS*AttackSpeed/1000`)
- MATCH `damageVsWalls` at levels 1-6 (`DPS*AttackSpeed/1000*PreferedTargetDamageMod`)
- MATCH `researchCost` at levels 2-6 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-6 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-6 (`row[N].LaboratoryLevel`)
