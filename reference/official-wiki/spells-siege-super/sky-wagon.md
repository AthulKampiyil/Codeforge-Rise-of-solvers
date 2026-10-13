# Sky Wagon

- **Source:** https://clashofclans.fandom.com/wiki/Sky_Wagon
- **Wiki revision:** 624686; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Air Troop Launcher` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Not in the original task list; the wiki's Workshop table and the client (row 'Air Troop Launcher') both include it. Unlock: Workshop level 9 (Town Hall 17). Housing 1. Needs Clan Castle 11 to be received.
- Flying machine (speed 16) that moves and picks targets on its own and fires a barrel from 5.5 tiles every 8 s. Each barrel deals a little impact damage (8-32, a hidden DPS equal to its level) and releases 2-4 Minions, 1 Balloon and 1 Baby Dragon at fixed levels, plus one Clan Castle troop while any remain (lowest housing first).
- Barrels: 4 / 4 / 5 / 5 (cut by one in May 2026, along with lower troop levels and Minion counts). After the last barrel it self-destructs.
- If destroyed first, the unfired barrels are lost but all remaining Clan Castle troops drop where it died. HP 3,600-4,200.
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply.

## Constants (wiki)

| Field | Value |
|---|---|
| rangeTiles | 5.5 |
| housingSpace | 1 |
| movementSpeed | 16 |
| attackSpeedSeconds | 8 |
| workshopLevel | 9 |

## Level table

| Level | DPS | Damage / hit | HP | Barrels | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 8 | 3,600 | 4 | N/A | N/A | N/A |
| 2 | 2 | 16 | 3,800 | 4 | 22,000,000 | 10d | 15 |
| 3 | 3 | 24 | 4,000 | 5 | 26,000,000 | 13d 12h | 16 |
| 4 | 4 | 32 | 4,200 | 5 | 29,000,000 | 16d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

### Barrel contents (wiki, all match client AirTroopSummon)

| Level | Minions | Balloons | Baby Dragons | Minion lvl | Balloon lvl | Baby Dragon lvl |
|---|---|---|---|---|---|---|
| 1 | 2 | 1 | 1 | 10 | 9 | 8 |
| 2 | 3 | 1 | 1 | 11 | 10 | 9 |
| 3 | 4 | 1 | 1 | 12 | 11 | 10 |
| 4 | 4 | 1 | 1 | 13 | 12 | 11 |

## Client comparison

**Which client columns encode each mechanic**

- barrels -> `AttackCount` 4,4,5,5; `AttackSpeed` 8000; `CoolDownOverride` 6000; `AttackRange` 550
- barrel content -> `Projectile` 'Air Troop Launcher Barrel1..4' -> `HitSpell` AirTroopSummon level 1..4 (`HasBunkerTroops` TRUE, `FixedTravelTime` 1500)
- troops -> AirTroopSummon `SummonTroop` Minion;Balloon;Baby Dragon, `UnitsToSpawn`, `SpawnUpgradeLevel`
- impact damage -> `DPS` 1..4 x 8 s
- targeting -> `PreferedTargetBuildingClass` 'Any Building', `IsFlying` TRUE, `TargetAlwaysValidDuringAttack` TRUE
- manual release -> SiegeMachineAirTroopLauncherSelfDestruct

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `workshopLevel`: wiki 9 vs client 9 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 16 vs client 16 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 8 vs client 8 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 5.5 vs client 5.5 (`AttackRange/100`)
- MATCH `hitpoints` at levels 1-4 (`Hitpoints`)
- MATCH `dps` at levels 1-4 (`DPS`)
- MATCH `damagePerHit` at levels 1-4 (`DPS*AttackSpeed/1000`)
- MATCH `barrelCount` at levels 1-4 (`AttackCount`)
- MATCH `researchCost` at levels 2-4 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-4 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-4 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Targeting ambiguity: the wiki summary says it targets defenses; the client row's `PreferedTargetBuildingClass` is 'Any Building'.
- The May 26, 2026 barrel/troop nerf documented on the wiki is already present in the pinned client (AttackCount 4,4,5,5; Minions 2,3,4,4 at levels 10-13).
