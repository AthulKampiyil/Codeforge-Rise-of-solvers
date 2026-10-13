# Ice Hound

- **Source:** https://clashofclans.fandom.com/wiki/Ice_Hound
- **Wiki revision:** 622637; retrieved 2026-09-15
- **Also used:** https://clashofclans.fandom.com/wiki/Ice_Hound/Ice_Pup (rev 619675)
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Ice Hound` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Lava Hound. Flying tank that targets Air Defenses with weak melee hits; housing 40, speed 20, 2 s attacks. Wiki levels 5-8 (1-4 only in the Meltdown Mayhem event, which did not use a boost slot).
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Lava Hound at level 5+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 8+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Lava Hound.
- Stat change vs the base Lava Hound at level 5 (client rows): housing 30 -> 40, HP 7600 -> 9500, DPS 18 -> 10, speed 20 -> 20.
- Compared with the Lava Hound: more HP, slightly less damage and fewer pups. Its hits chill the target (slower movement and attack, like the Ice Golem/Ice Wizard).
- Special ability Dish Served Cold: on death it freezes the surrounding area like an Ice Golem (3.75 s at L1-5, then 4.25 / 4.75 / 5.25 s) and releases Ice Pups (10/12/14/16 on offense at L5-8; 10/11/12/13 on defense).
- Ice Pups: flying ranged attackers (ground and air), 35 DPS, 50 HP, speed 32, 1 s attacks; they also slow their targets. 1 housing for Tornado Trap/Clone/Recall/Dark Crown; they trigger Air Bombs but not Seeking Air Mines.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Air Defense |
| attackType | Melee (Ground Only) |
| housingSpace | 40 |
| movementSpeed | 20 |
| attackSpeedSeconds | 2 |
| rangeTiles | 0.75 |
| specialAbility | Dish Served Cold |

## Level table

| Level | DPS | Damage / attack | Death freeze (s) | Ice Pups (offense) | Ice Pups (defense) | HP | TH req. |
|---|---|---|---|---|---|---|---|
| 1* | 2 | 4 | 3.75 | 6 | 6 | 7,500 | 7 |
| 2* | 4 | 8 | 3.75 | 7 | 7 | 8,000 | 9 |
| 3* | 6 | 12 | 3.75 | 8 | 8 | 8,500 | 10 |
| 4* | 8 | 16 | 3.75 | 9 | 9 | 9,000 | 11 |
| 5 | 10 | 20 | 3.75 | 10 | 10 | 9,500 | 12 |
| 6 | 15 | 30 | 4.25 | 12 | 11 | 10,000 | 13 |
| 7 | 20 | 40 | 4.75 | 14 | 12 | 10,500 | 16 |
| 8 | 25 | 50 | 5.25 | 16 | 13 | 11,500 | 18 |

`*` = level only reachable in a wiki-documented event/spotlight (not through normal boosting).

Cells shown as `wiki (client X)` differ from the pinned client.

### Ice Pup (wiki sub-page)

| Preferred target | Attack type | Housing | Movement speed | Attack speed seconds | Range tiles | DPS | Damage / attack | HP |
|---|---|---|---|---|---|---|---|---|
| None | Ranged (Ground & Air) | 1 | 32 | 1 | 2.75 | 35 | 35 | 50 |

## Client comparison

**Which client columns encode each mechanic**

- chill on hit -> `FrostOnHitTime` 2000, `FrostOnHitPercent` 50
- death freeze -> `SpecialAbilities` IceHoundOnDeath (level 1,1,1,1,1,2,3,4 by troop level) -> `SelfSpell` IceHoundFreeze: `FreezeTimeMS` 3750/4250/4750/5250, `FreezeOuterTimeMS` ~75%, `Radius` 650
- pups -> `SecondaryTroop` Ice Hound Pup, `SecondaryTroopCnt` (offense); `Defensive Ice Hound`.`SecondaryTroopCnt` (defense); `SecondarySpawnDist` 250
- targeting -> `PreferedTargetBuilding` Air Defense
- stats -> `DPS` x 2 s, `Hitpoints`, `Speed` 250, `AttackRange` 25
- TH per level -> derived: Laboratory TH needed for the Lava Hound level

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 40 vs client 40 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 20 vs client 20 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 2 vs client 2 (`AttackSpeed/1000`)
- MISMATCH `rangeTiles`: wiki 0.75 vs client 0.25 (`AttackRange/100`)
- MATCH `hitpoints` at levels 1-8 (`Hitpoints`)
- MATCH `dps` at levels 1-8 (`DPS`)
- MATCH `damagePerAttack` at levels 1-8 (`DPS*AttackSpeed/1000`)
- MATCH `freezeSecondsOnDeath` at levels 1-8 (`IceHoundFreeze.FreezeTimeMS via IceHoundOnDeath level`)
- MATCH `icePupsOffense` at levels 1-8 (`SecondaryTroopCnt`)
- MATCH `icePupsDefense` at levels 1-8 (`Defensive Ice Hound.SecondaryTroopCnt`)
- MATCH `townHallLevel` at levels 5-8 (`Laboratory TH for Lava Hound[L].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Chill strength/duration (client 50% for 2 s) and death-freeze radius (client `Radius` 650 = 6.5 tiles) are not given on the wiki.
- Range mismatch: wiki 0.75 tile vs client `AttackRange` 25 (0.25); Ice Pup range wiki 2.75 vs client 2.25 - the recurring +0.5 tile offset for flying units.
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
