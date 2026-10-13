# Troop Launcher

- **Source:** https://clashofclans.fandom.com/wiki/Troop_Launcher
- **Wiki revision:** 625335; retrieved 2026-09-15
- **Category:** `siege-machine`
- **Client row:** `characters.json` -> `Troop Launcher` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Unlock: Workshop level 8 (Town Hall 16). Housing 1. Researched with Elixir. Needs Clan Castle 10 (Town Hall 14+) to be received; its CC capacity is the owner's own Clan Castle capacity.
- Stays where it is dropped and loses HP over time (25 HP/s; lifetime 80 s at L1 to 104 s at L4). Every 6 s it can launch a barrel toward friendly attacking units anywhere on the map (range effectively unlimited; far targets take longer to reach).
- Each barrel releases a Giant (always first, to draw fire), Barbarians, Archers and Wall Breakers at fixed levels 9-12 set by the launcher level (not the player's lab), plus one Clan Castle troop while any remain (lowest housing first).
- Barrels: 5 / 5 / 6 / 7. After the last barrel it self-destructs; destroyed by damage or released manually, it drops all remaining Clan Castle troops at its position and unfired barrels are wasted.
- Activation needs a deployed friendly unit of at least 2 housing (or two 1-housing units close together); Heroes count, spell Skeletons/Bats, Furnaces and Firemites do not. Living Giants from its barrels keep it active between shots.
- Target choice: the group with the highest total housing, re-evaluated for each barrel (like the Eagle Artillery), with earlier-deployed groups served first. It also has a hidden 1 HP/s (6 per shot) heal splash.
- Like every Siege Machine it ignores the attacker's spells (no Rage/Heal/Haste/etc.) and cannot be healed by Healers, cloned or recalled; Grand Warden auras such as Eternal Tome (and Life Gem where noted) still apply.

## Constants (wiki)

| Field | Value |
|---|---|
| housingSpace | 1 |
| attackType | Heal Splash; 1 Tiles (Ground Only) |
| movementSpeed | 0 |
| healingPerSecond | 1 |
| healingPerHit | 6 |
| attackSpeedSeconds | 6 |
| workshopLevel | 8 |

## Level table

| Level | HP | Lifetime (s) | Barrels | Barbarians | Archers | Giants | Wall Breakers | Troop level | Research cost | Research time | Lab level |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2,000 | 80 | 5 | 2 | 3 | 1 | 1 | 9 | N/A | N/A | N/A |
| 2 | 2,200 | 88 | 5 | 2 | 3 | 1 | 2 | 10 | 8,500,000 | 6d | 14 |
| 3 | 2,400 | 96 | 6 | 2 | 4 | 1 | 2 | 11 | 10,000,000 | 8d | 14 |
| 4 | 2,600 | 104 | 7 | 2 | 4 | 1 | 2 | 12 | 17,000,000 | 9d | 15 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- barrels -> `AttackCount` 5,5,6,7; `AttackSpeed` 6000; `AttackRange` 8000
- barrel content -> `Projectile` CommandTower Barrel1..4 -> `HitSpell` TroopCatapultSummonTroopNew level 1..4 (`HasBunkerTroops` TRUE = one CC troop, `FixedTravelTime` 2200)
- troops -> TroopCatapultSummonTroopNew `SummonTroop` Giant;Barbarian;Archer;Wall Breaker with `UnitsToSpawn` and `SpawnUpgradeLevel` 9..12, `SpawnDuration` 200;1000;500(750);1200
- decay -> `LoseHpPerTick` 25 / `LoseHpInterval` 1000
- heal -> `DPS` -1 (x6 s = 6 per shot), `DamageRadius` 1
- abilities -> `SpecialAbilities` SiegeMachineCommandTowerSelfDestruct + 'Command Tower Mortar Mode N' (`ActiveAfterTime` 800, `InfoScreenAttribute1` 150)

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 1 vs client 1 (`HousingSpace`)
- MATCH `workshopLevel`: wiki 8 vs client 8 (`BarrackLevel`)
- MATCH `movementSpeed`: wiki 0 vs client 0 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 6 vs client 6 (`AttackSpeed/1000`)
- MATCH `healingPerSecond`: wiki 1 vs client 1 (`-DPS`)
- MATCH `healingPerHit`: wiki 6 vs client 6 (`-DPS*AttackSpeed/1000`)
- MATCH `hitpoints` at levels 1-4 (`Hitpoints`)
- MATCH `lifetimeSeconds` at levels 1-4 (`Hitpoints/LoseHpPerTick`)
- MATCH `barrelCount` at levels 1-4 (`AttackCount`)
- MATCH `barbarians` at levels 1-4 (`TroopCatapultSummonTroopNew.UnitsToSpawn[Barbarian]`)
- MATCH `archers` at levels 1-4 (`UnitsToSpawn[Archer]`)
- MATCH `giants` at levels 1-4 (`UnitsToSpawn[Giant]`)
- MATCH `wallBreakers` at levels 1-4 (`UnitsToSpawn[Wall Breaker]`)
- MATCH `troopLevel` at levels 1-4 (`SpawnUpgradeLevel`)
- MATCH `researchCost` at levels 2-4 (`row[N-1].UpgradeCost`)
- MATCH `researchTimeHours` at levels 2-4 (`row[N-1].UpgradeTimeD/H/M`)
- MATCH `laboratoryLevel` at levels 2-4 (`row[N].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Heal radius: wiki constants say 'Heal Splash; 1 Tiles' while client `DamageRadius` = 1 (0.01 tile in the usual 1/100-tile unit); the hidden heal is effectively single-point in the client data.
- Deployment order of its CC troops follows the Clan Castle order (see clan-castle.md).
