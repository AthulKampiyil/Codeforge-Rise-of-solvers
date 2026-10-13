# Log Launcher

- **Source:** https://clashofclans.fandom.com/wiki/Log_Launcher
- **Wiki revision:** 624644; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Log Launcher` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Workshop level 5 (Town Hall 13). Housing 1. Researched with Elixir. Needs Clan Castle 7 to be received (TH10 donations removed Sept 2024; lower caps at TH11/12).
- Crawls toward the Town Hall (speed 5) and every 3 s rolls a log forward that travels up to 20 tiles or until it has hit 4 buildings, damaging structures and ground units along its path; Walls take 4x.
- With each log it also blasts everything within 1 tile of itself (point-blank damage 2,900-3,600, also 4x to Walls) so it does not get stuck on buildings.
- Loses 156 HP every second from deployment regardless of damage (not prevented by Eternal Tome); lifetime = HP / 156 = 25.64 s (L1) to 37.17 s (L6).
- Overgrown buildings in front of it absorb its logs and block it (no damage); it can still fire once clear of the Overgrowth area.
- Carries the attacker's Clan Castle troops and releases them where it is destroyed (by damage, by reaching/finishing its objective, or by the player tapping release). It can be deployed with an empty Clan Castle, in which case nothing comes out.
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Walls (Damage x4) |
| attackType | Area Splash (Ground Only) |
| housingSpace | 1 |
| movementSpeed | 5 |
| attackSpeedSeconds | 3 |
| workshopLevel | 5 |
| hpDecayPerSecond | 156 |

## Level table

| Level | DPS | Damage / hit | Damage / hit vs Walls | Point-blank dmg | Lifetime (s) | HP | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 140 | 420 | 1,680 | 2,900 | 25.64 | 4,000 | N/A | N/A | N/A |
| 2 | 160 | 480 | 1,920 | 3,000 | 28.2 | 4,400 | 3,200,000 | 3d | 10 |
| 3 | 180 | 540 | 2,160 | 3,100 | 30.76 | 4,800 | 4,500,000 | 4d | 10 |
| 4 | 200 | 600 | 2,400 | 3,200 | 33.33 | 5,200 | 7,500,000 | 7d | 11 |
| 5 | 220 | 660 | 2,640 | 3,400 | 35.25 | 5,500 | 18,000,000 | 12d | 14 |
| 6 | 230 | 690 | 2,760 | 3,600 | 37.17 | 5,800 | 27,000,000 | 15d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- log -> `Projectile` RollingLog (`MaxHitBuildings` 4, `Speed` 420, `PenetratingHitBoxWidth` 30), `PenetratingProjectile` TRUE, `PenetratingRadius` 120
- log reach -> `AttackRange` 100 + `PenetratingExtraRange` 1900 = 20 tiles
- point blank -> `Damage2` 2900..3600, `Damage2Radius` 100
- wall bonus -> `PreferedTargetBuildingClass` Wall + `PreferedTargetDamageMod` 4 + `PreferredTargetNoTargeting` TRUE
- decay -> `LoseHpPerTick` 156 per `LoseHpInterval` 1000 ms
- speed -> `Speed` 70 internal = 5.6 in-game (wiki shows 5)
- destination -> `PreferredMovementTarget` Town Hall, `CanAttackWhileMoving` TRUE

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `workshopLevel`: wiki 5 vs client 5 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 5 vs client 5 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 3 vs client 3 (`AttackSpeed/1000`)
- MATCH `hpDecayPerSecond`: wiki 156 vs client 156 (`LoseHpPerTick*1000/LoseHpInterval`)
- MATCH `hitpoints` at levels 1-6 (`Hitpoints`)
- MATCH `dps` at levels 1-6 (`DPS`)
- MATCH `damagePerHit` at levels 1-6 (`DPS*AttackSpeed/1000`)
- MATCH `damagePerHitVsWalls` at levels 1-6 (`DPS*3*PreferedTargetDamageMod`)
- MATCH `pointBlankDamage` at levels 1-6 (`Damage2`)
- MATCH `lifetimeSeconds` at levels 1-6 (`Hitpoints/(LoseHpPerTick per LoseHpInterval)`)
- MATCH `researchCost` at levels 2-6 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-6 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-6 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Speed: client `Speed` 70 / 12.5 = 5.6; the wiki (and in-game info) show 5, i.e. the display truncates. Simulation should use 70 internal units (0.7 tiles/s).
