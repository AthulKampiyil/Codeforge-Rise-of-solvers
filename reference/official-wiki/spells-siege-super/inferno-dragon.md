# Inferno Dragon

- **Source:** https://clashofclans.fandom.com/wiki/Inferno_Dragon/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Inferno_Dragon)
- **Wiki revision:** 624086 (parent page `Inferno Dragon` rev 594174); retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Inferno Dragon` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Baby Dragon. Flying single-target attacker (ground and air), no preferred target; housing 15, speed 18, damage applied every 0.128 s. Wiki levels 6-12.
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Baby Dragon at level 6+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 6+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Baby Dragon.
- Stat change vs the base Baby Dragon at level 6 (client rows): housing 10 -> 15, HP 1700 -> 1900, DPS 125 -> 75, speed 20 -> 18.
- Special ability Inferno Beam: damage ramps like a single-target Inferno Tower - initial DPS, doubled after 1.7 s on the same target, and ten times that (20x initial) after 3.2 s. The beam no longer heats up while flying (Oct 2020) and has a 0.6 s cooldown after a target dies (April 2021).

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Single Target |
| housingSpace | 15 |
| movementSpeed | 18 |
| attackSpeedSeconds | 0.128 |
| rangeTiles | 4 |
| specialAbility | Inferno Beam |
| stage2AfterSeconds | 1.7 |
| stage3AfterSeconds | 3.2 |

## Level table

| Level | DPS initial | DPS stage 2 | DPS stage 3 | HP | Wiki label |
|---|---|---|---|---|---|
| 6 | 75 | 150 | 1,500 | 1,900 | N/A |
| 7 | 79 | 158 | 1,580 | 2,050 | N/A |
| 8 | 83 | 166 | 1,660 | 2,200 | N/A |
| 9 | 85 | 170 | 1,700 | 2,300 | N/A |
| 10 | 86 (client 87) | 174 | 1,740 | 2,400 | N/A |
| 11 | 88 (client 89) | 178 | 1,780 | 2,500 | N/A |
| 12 | 90 (client 91) | 182 | 1,820 | 2,700 | 11 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- ramp -> `IncreasingDamage` TRUE, `DPS` / `DPSLv2` / `DPSLv3`, `Lv2SwitchTime` 1700, `Lv3SwitchTime` 3200
- tick -> `AttackSpeed` 128
- retarget cooldown -> `TargetKilledCooldownTimer` 600
- stats -> `Hitpoints`, `Speed` 225, `AttackRange` 350

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 15 vs client 15 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 18 vs client 18 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 0.128 vs client 0.128 (`AttackSpeed/1000`)
- MISMATCH `rangeTiles`: wiki 4 vs client 3.5 (`AttackRange/100`)
- MATCH `stage2AfterSeconds`: wiki 1.7 vs client 1.7 (`Lv2SwitchTime/1000`)
- MATCH `stage3AfterSeconds`: wiki 3.2 vs client 3.2 (`Lv3SwitchTime/1000`)
- MATCH `hitpoints` at levels 6-12 (`Hitpoints`)
- MISMATCH `dpsInitial` (3 of 7 levels; `DPS`): L10: wiki 86 vs client 87; L11: wiki 88 vs client 89; L12: wiki 90 vs client 91
- MATCH `dpsStage2` at levels 6-12 (`DPSLv2`)
- MATCH `dpsStage3` at levels 6-12 (`DPSLv3`)

**Notes, ambiguities and manual checks**

- Wiki table labels its last row '11' twice; by position it is level 12 (recorded here as level 12 with `wikiLabel` '11').
- Wiki L10/L11/L12 initial DPS (86/88/90) break the client's exact 1x/2x/20x pattern (client 87/89/91 with stage 2 = 174/178/182). The wiki history also mentions a May 2026 L12 cut to 90/180/1,800 inside a partially commented line, but the wiki table still shows 182/1,820 and the client has 91/182/1,820. Treat client values as authoritative.
- Range mismatch: wiki 4 tiles vs client `AttackRange` 350 (3.5).
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
