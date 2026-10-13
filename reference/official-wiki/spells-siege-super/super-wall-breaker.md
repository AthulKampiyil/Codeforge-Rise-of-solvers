# Super Wall Breaker

- **Source:** https://clashofclans.fandom.com/wiki/Super_Wall_Breaker
- **Wiki revision:** 624690; retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Wall Breaker` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Wall Breaker. Rolls a large barrel bomb toward Walls (preferred target, 40x damage); housing 8, speed 28, 0.6-tile range. Wiki levels 7-14 (5-6 only in the Spotlight event).
- Boosting: needs Town Hall 11 in practice (global minimum TH11 plus the base Wall Breaker at level 7+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 5+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Wall Breaker.
- Stat change vs the base Wall Breaker at level 7 (client rows): housing 2 -> 8, HP 82 -> 350, DPS 66 -> 78, speed 24 -> 28.
- Special ability Mega Bomb: on reaching its target it deals its attack damage and its death damage together in a 1.6-tile splash; if killed on the way it still explodes but only for the death damage (no duds).
- Uses Jump Spells like the Wall Breaker (Oct 2020).

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Walls (Damage x40) |
| attackType | Melee (Ground Only) Splash (1.6 tiles) |
| housingSpace | 8 |
| movementSpeed | 28 |
| rangeTiles | 0.6 |
| specialAbility | Mega Bomb |

## Level table

| Level | Damage | Death damage | Damage vs Walls | Death dmg vs Walls | HP |
|---|---|---|---|---|---|
| 5* | 34 | 105 | 1,360 | 4,200 | 250 |
| 6* | 56 | 140 | 2,240 | 5,600 | 300 |
| 7 | 78 | 175 | 3,120 | 7,000 | 350 |
| 8 | 100 | 225 | 4,000 | 9,000 | 400 |
| 9 | 120 | 275 | 4,800 | 11,000 | 450 |
| 10 | 130 | 313 | 5,200 | 12,520 | 475 |
| 11 | 140 | 338 | 5,600 | 13,520 | 500 |
| 12 | 150 | 363 | 6,000 | 14,520 | 525 |
| 13 | 160 | 388 | 6,400 | 15,520 | 550 |
| 14 | 170 | 413 | 6,800 | 16,520 | 575 |

`*` = level only reachable in a wiki-documented event/spotlight (not through normal boosting).

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- attack -> `DPS` (one hit, `AttackCount` 1), `DamageRadius` 80
- death -> `DieDamage`, `DieDamageRadius` 160
- wall bonus -> `PreferedTargetBuildingClass` Wall + `PreferedTargetDamageMod` 40
- pathing -> `WallMovementCost` 128

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 8 vs client 8 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 28 vs client 28 (`trunc(Speed/12.5)`)
- MATCH `rangeTiles`: wiki 0.6 vs client 0.6 (`AttackRange/100`)
- MATCH `hitpoints` at levels 5-14 (`Hitpoints`)
- MATCH `damage` at levels 5-14 (`DPS (1 s, single hit)`)
- MATCH `deathDamage` at levels 5-14 (`DieDamage`)
- MATCH `damageVsWalls` at levels 5-14 (`DPS*PreferedTargetDamageMod`)
- MATCH `deathDamageVsWalls` at levels 5-14 (`DieDamage*40`)

**Notes, ambiguities and manual checks**

- Splash radius: wiki gives one 1.6-tile splash; client uses 0.8 tile (`DamageRadius` 80) for the contact hit and 1.6 tiles (`DieDamageRadius` 160) for the death explosion.
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
