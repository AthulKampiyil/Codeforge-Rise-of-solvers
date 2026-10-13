# Super Minion

- **Source:** https://clashofclans.fandom.com/wiki/Super_Minion
- **Wiki revision:** 620782; retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Minion` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Minion. Flying single-target attacker, no preferred target; housing 12, speed 16, 1 s attacks; wiki range 4 tiles. Wiki levels 8-14 (4-7 only in the March 2025 Mini Spotlight).
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Minion at level 8+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 6+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Minion.
- Stat change vs the base Minion at level 8 (client rows): housing 2 -> 12, HP 96 -> 1500, DPS 62 -> 300, speed 32 -> 16.
- Special ability Long Shot: its first 8 shots on offense (3 when defending from a Clan Castle) use a much longer range (wiki 10.25 tiles; raised from 10 and from 7 to 8 shots in Jan 2026).
- Unlike regular Minions it is detected by Seeking Air Mines.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Single Target |
| housingSpace | 12 |
| movementSpeed | 16 |
| attackSpeedSeconds | 1 |
| range | 4 tiles (Normal) 10.25 tiles (Long Shot) |
| specialAbility | Long Shot |
| rangeTiles | 4 |
| longShotRangeTiles | 10.25 |
| longShotsOffense | 8 |
| longShotsDefense | 3 |

## Level table

| Level | DPS | Damage / shot | HP | TH req. |
|---|---|---|---|---|
| 4* | 200 | 200 | 1,100 | 7 |
| 5* | 225 | 225 | 1,200 | 9 |
| 6* | 250 | 250 | 1,300 | 10 |
| 7* | 275 | 275 | 1,400 | 11 |
| 8 | 300 | 300 | 1,500 | 12 |
| 9 | 325 | 325 | 1,600 | 13 |
| 10 | 350 | 350 | 1,700 | 14 |
| 11 | 360 | 360 | 1,800 | 15 |
| 12 | 370 | 370 | 1,900 | 16 |
| 13 | 385 | 385 | 2,100 | 17 |
| 14 | 400 | 400 | 2,300 | 18 |

`*` = level only reachable in a wiki-documented event/spotlight (not through normal boosting).

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- long shot -> `SpecialAbilities` SuperMinionSpecialProjectiles: `AttackRange` 975, `DeactivateAfterNumberOfHits` 8, `Projectile` super_gargoyle_projectile_big; defensive row _DEF: 3 shots
- stats -> `DPS`, `Hitpoints`, `Speed` 200, `AttackRange` 350, `ProductionBuilding` Dark Barracks, `DefensiveTroop` 'Defensive Super Minion'
- TH per level -> derived: Laboratory TH needed for the Minion level

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 12 vs client 12 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 16 vs client 16 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1 vs client 1 (`AttackSpeed/1000`)
- MISMATCH `rangeTiles`: wiki 4 vs client 3.5 (`AttackRange/100`)
- MATCH `longShotsOffense`: wiki 8 vs client 8 (`SuperMinionSpecialProjectiles.DeactivateAfterNumberOfHits`)
- MATCH `longShotsDefense`: wiki 3 vs client 3 (`_DEF.DeactivateAfterNumberOfHits`)
- MATCH `hitpoints` at levels 4-14 (`Hitpoints`)
- MATCH `dps` at levels 4-14 (`DPS`)
- MATCH `damagePerShot` at levels 4-14 (`DPS*AttackSpeed/1000`)
- MATCH `townHallLevel` at levels 8-14 (`Laboratory TH for Minion[L].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Ranges: wiki 4 tiles normal / 10.25 tiles Long Shot vs client 3.5 / 9.75 - a consistent +0.5 tile on the wiki (same offset seen for other flying units).
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
