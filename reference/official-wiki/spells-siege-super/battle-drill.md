# Battle Drill

- **Source:** https://clashofclans.fandom.com/wiki/Battle_Drill
- **Wiki revision:** 624361; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Battle Drill` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Workshop level 7 (Town Hall 15). Housing 1. Researched with Elixir. Needs Clan Castle 9 (Town Hall 13+) to be received.
- Travels underground (untargetable, ignores Walls) toward the nearest defense, surfaces next to it and stuns defenses in a small area around it; any Wall where it surfaces is destroyed outright.
- Attacks its defense with a single-target drill every 1.7 s at 1-tile range (DPS 430-640, 731-1,088 per hit); after the target falls it burrows to the next defense and repeats the surfacing stun.
- HP 4,800-6,900 (raised January 2026).
- Carries the attacker's Clan Castle troops and releases them where it is destroyed (by damage, by reaching/finishing its objective, or by the player tapping release). It can be deployed with an empty Clan Castle, in which case nothing comes out.
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Defenses |
| attackType | Single Target (Ground Only) |
| rangeTiles | 1 |
| housingSpace | 1 |
| movementSpeed | 24 |
| attackSpeedSeconds | 1.7 |
| workshopLevel | 7 |

## Level table

| Level | DPS | Damage / attack | HP | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|
| 1 | 430 | 731 | 4,800 | N/A | N/A | N/A |
| 2 | 470 | 799 | 5,100 | 6,000,000 | 4d | 13 |
| 3 | 510 | 867 | 5,400 | 8,500,000 | 5d | 13 |
| 4 | 550 | 935 | 5,800 | 10,000,000 | 8d | 13 |
| 5 | 590 | 1,003 | 6,300 | 17,000,000 | 9d | 15 |
| 6 | 640 | 1,088 | 6,900 | 28,000,000 | 15d 12h | 16 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- burrowing -> `IsUnderground` TRUE, `Speed` 300 (24), `SpawnIdle` 1700
- attack -> `DPS` x `AttackSpeed` 1700, `AttackRange` 100, `PreferedTargetBuildingClass` Defense
- surfacing stun -> `SpecialAbilities` BattleDrillStunOnSurface (`ActiveOnBecomingTargetable`) -> `SelfSpell` DrillerSurfacing: `Radius` 150, `StunTimeMS` 2000, `DestroyWalls` TRUE, immune: Heroes, other characters, storages, walls, siege, totems, guardians
- manual release -> SiegeMachineBattleDrillSelfDestruct

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `workshopLevel`: wiki 7 vs client 7 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 24 vs client 24 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1.7 vs client 1.7 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 1 vs client 1 (`AttackRange/100`)
- MATCH `hitpoints` at levels 1-6 (`Hitpoints`)
- MATCH `dps` at levels 1-6 (`DPS`)
- MATCH `damagePerAttack` at levels 1-6 (`DPS*AttackSpeed/1000`)
- MATCH `researchCost` at levels 2-6 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-6 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-6 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- The wiki gives no stun numbers; client surfacing stun is 2.0 s within 1.5 tiles, identical at every level (`SelfSpellLevel` stays 1).
