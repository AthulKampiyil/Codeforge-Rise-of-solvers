# Siege Barracks

- **Source:** https://clashofclans.fandom.com/wiki/Siege_Barracks
- **Wiki revision:** 624362; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Siege Barracks` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Workshop level 4 (Town Hall 13). Housing 1. Researched with Elixir. Receiving one needs Clan Castle 7 (Town Hall 11+).
- Parachutes onto the drop point and never moves. It first spawns P.E.K.K.A(s), then Wizards: 1 + 6 (L1), 1 + 8, 1 + 10, 1 + 11, 2 + 11, 2 + 12 (L6).
- Spawned P.E.K.K.As and Wizards use the attacker's own Laboratory levels (level 1 if not unlocked).
- It lives 30 s, draining HP over time; if defenses destroy it early, unspawned troops are lost. Upgrades raise HP and spawn rate (lifetime is fixed).
- Carries the attacker's Clan Castle troops and releases them where it is destroyed (by damage, by reaching/finishing its objective, or by the player tapping release). It can be deployed with an empty Clan Castle, in which case nothing comes out. The battle does not end while it is the last unit alive (Oct 2020).
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply.

## Constants (wiki)

| Field | Value |
|---|---|
| housingSpace | 1 |
| movementSpeed | 0 |
| lifetimeSeconds | 30 |
| workshopLevel | 4 |

## Level table

| Level | HP | P.E.K.K.As | Wizards | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|
| 1 | 3,300 | 1 | 6 | N/A | N/A | N/A |
| 2 | 3,700 | 1 | 8 | 3,500,000 | 3d | 10 |
| 3 | 4,100 | 1 | 10 | 5,000,000 | 4d | 10 |
| 4 | 4,500 | 1 | 11 | 8,000,000 | 7d | 11 |
| 5 | 4,800 | 2 | 11 | 18,000,000 | 12d | 14 |
| 6 | 5,100 | 2 | 12 | 27,000,000 | 15d | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- spawns -> `BunkerTroops` = [PEKKA, Wizard] (array stored across client rows 1-2) with counts `BunkerTroopCount1` (P.E.K.K.A) and `BunkerTroopCount2` (Wizards)
- lifetime -> `BunkerDegenerationTime` 30000 ms
- spawn start -> `SpawnIdle` 1300 ms
- stationary -> `Speed` 0, `AttackRange` 0, `DPS` 0
- manual release -> SiegeMachineCarrierSelfDestruct

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `workshopLevel`: wiki 4 vs client 4 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 0 vs client 0 (`trunc(Speed/12.5)`)
- MATCH `lifetimeSeconds`: wiki 30 vs client 30 (`BunkerDegenerationTime/1000`)
- MATCH `hitpoints` at levels 1-6 (`Hitpoints`)
- MATCH `pekkas` at levels 1-6 (`BunkerTroopCount1`)
- MATCH `wizards` at levels 1-6 (`BunkerTroopCount2`)
- MATCH `researchCost` at levels 2-6 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-6 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-6 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Array columns in the decoded client table span rows: `BunkerTroops` row 1 = PEKKA, row 2 = Wizard; forward-inheriting naively would wrongly make level 2+ spawn only Wizards.
