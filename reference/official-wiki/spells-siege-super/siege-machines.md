# Siege Machines

- **Source:** https://clashofclans.fandom.com/wiki/Siege_Machines
- **Wiki revision:** 623486; retrieved 2026-09-15
- **Category:** `mechanic`
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Siege Machines are built in the Workshop and act as transports for the attacker's Clan Castle troops; each type delivers them differently (ram, blimp, slammer, barracks, logs, catapult, drill, barrel launchers).
- A machine is destroyed when it completes its objective, when defenses deal enough damage, or when the player orders it; on destruction it releases the Clan Castle troops it carries at that spot.
- Only one Siege Machine can be deployed per battle (a level 12+ Clan Castle can hold two, but only one is usable).
- All are immune to the attacker's spells, cannot be healed by Healers, cloned or recalled; certain Grand Warden equipment (Eternal Tome, Life Gem on some) still affects them.
- They are researched in the Laboratory with Elixir; donated machines are level-capped by the receiving Clan Castle (table in clan-castle.md) and each machine has a minimum Clan Castle level to be received (listed below).
- The wiki overview page currently lists nine machines including the Sky Wagon (April 2026).

## Constants (wiki)

| Field | Value |
|---|---|
| machinesPerBattle | 1 |
| workshopUnlockTownHall | 12 |
| clanCastleLevelForFirstSiege | 6 |

## Level table

| Workshop level | Siege machine | Client name | TH req. | Min clan castle level | Max level | Movement | Target | Client workshop level |
|---|---|---|---|---|---|---|---|---|
| 1 | Wall Wrecker | Wall Wrecker | 12 | 6 | 6 | ground | Town Hall (rams through) | 1 |
| 2 | Battle Blimp | Battle Blimp | 12 | 6 | 6 | air | Town Hall (flies over) | 2 |
| 3 | Stone Slammer | Stone Slammer | 12 | 6 | 6 | air | Defenses | 3 |
| 4 | Siege Barracks | Siege Barracks | 13 | 7 | 6 | stationary | none (stationary spawner) | 4 |
| 5 | Log Launcher | Log Launcher | 13 | 7 | 6 | ground | Town Hall (logs) | 5 |
| 6 | Flame Flinger | Flame Flinger | 14 | 8 | 5 | ground | Defenses (long range) | 6 |
| 7 | Battle Drill | Battle Drill | 15 | 9 | 6 | underground | Defenses (underground) | 7 |
| 8 | Troop Launcher | Troop Launcher | 16 | 10 | 4 | stationary | friendly groups (barrels) | 8 |
| 9 | Sky Wagon | Air Troop Launcher | 17 | 11 | 4 | air | buildings (barrels) | 9 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- machine class -> characters rows with `ProductionBuilding` 'Siege Workshop' and `BarrackLevel` = Workshop level
- spell immunity -> `ImmunitySiegeMachines` = TRUE on spell rows (Healing, Rage, Jump, Clone, Invisibility, Recall, Revive, Totem, Poison, Haste, Overgrowth, Ice Block, Angry)
- healing immunity -> `ImmuneToHealing` = TRUE on siege rows
- release -> each siege has a *SelfDestruct special ability (`SelfDestruct`, `ActiveAfterPlayerInput`); globals `SIEGE_MACHINE_SELF_DESTRUCT_ON_REACHING_TARGET` TRUE
- tornado -> globals `TORNADO_SIEGE_FORCE_TIER` = 1

**Notes, ambiguities and manual checks**

- Earthquake and Lightning rows do not carry `ImmunitySiegeMachines`; they cannot target attackers anyway (they hit defending structures/units).
