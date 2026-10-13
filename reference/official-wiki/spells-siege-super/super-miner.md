# Super Miner

- **Source:** https://clashofclans.fandom.com/wiki/Super_Miner/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Super_Miner)
- **Wiki revision:** 622280 (parent page `Super Miner` rev 620353); retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Miner` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Miner. Ground troop that burrows between targets (invulnerable underground, ignores Walls), no preferred target; housing 24, speed 32, 0.25 s drill ticks, 0.6-tile range. Wiki levels 7-12.
- Boosting: needs Town Hall 13 in practice (global minimum TH11 plus the base Miner at level 7+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 7+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Miner.
- Stat change vs the base Miner at level 7 (client rows): housing 6 -> 24, HP 1000 -> 3000, DPS 128 -> 170, speed 32 -> 32.
- Drill damage ramps while it keeps attacking the same target: initial DPS, about 2x after 1.5 s and about 3x after 3 s (smaller ramp than the Inferno Dragon's).
- Special ability Last Blast: on death its barrel explodes, damaging buildings and enemy ground units within 2 tiles (1,400-2,400).

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Single Target |
| housingSpace | 24 |
| movementSpeed | 32 |
| attackSpeedSeconds | 0.25 |
| rangeTiles | 0.6 |
| specialAbility | Last Blast |
| stage2AfterSeconds | 1.5 |
| stage3AfterSeconds | 3 |
| deathDamageRadiusTiles | 2 |

## Level table

| Level | DPS initial | DPS stage 2 | DPS stage 3 | Death damage | HP |
|---|---|---|---|---|---|
| 7 | 170 | 340 | 520 | 1,400 | 3,000 |
| 8 | 185 | 370 | 560 | 1,600 | 3,300 |
| 9 | 205 | 405 | 605 | 1,800 | 3,600 |
| 10 | 225 | 440 | 650 | 2,000 | 4,000 |
| 11 | 245 | 475 | 695 | 2,200 | 4,400 |
| 12 | 265 | 510 | 740 | 2,400 | 5,000 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- ramp -> `IncreasingDamage` TRUE, `DPS`/`DPSLv2`/`DPSLv3`, `Lv2SwitchTime` 1500, `Lv3SwitchTime` 3000
- death -> `DieDamage`, `DieDamageRadius` 200, `DieDamageDelay` 1000
- burrow -> `IsUnderground` TRUE
- stats -> `Hitpoints`, `Speed` 400, `AttackSpeed` 250, `AttackRange` 60

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 24 vs client 24 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 32 vs client 32 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 0.25 vs client 0.25 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 0.6 vs client 0.6 (`AttackRange/100`)
- MATCH `stage2AfterSeconds`: wiki 1.5 vs client 1.5 (`Lv2SwitchTime/1000`)
- MATCH `stage3AfterSeconds`: wiki 3 vs client 3 (`Lv3SwitchTime/1000`)
- MATCH `deathDamageRadiusTiles`: wiki 2 vs client 2 (`DieDamageRadius/100`)
- MATCH `hitpoints` at levels 7-12 (`Hitpoints`)
- MATCH `dpsInitial` at levels 7-12 (`DPS`)
- MATCH `dpsStage2` at levels 7-12 (`DPSLv2`)
- MATCH `dpsStage3` at levels 7-12 (`DPSLv3`)
- MATCH `deathDamage` at levels 7-12 (`DieDamage`)

**Notes, ambiguities and manual checks**

- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
