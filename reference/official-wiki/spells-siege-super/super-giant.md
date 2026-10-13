# Super Giant

- **Source:** https://clashofclans.fandom.com/wiki/Super_Giant/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Super_Giant)
- **Wiki revision:** 622246 (parent page `Super Giant` rev 600738); retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Giant` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Giant. Melee ground troop that targets defenses; housing 10, speed 12, 2 s attacks, 1-tile range. Wiki levels 9-14.
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Giant at level 9+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 6+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Giant.
- Stat change vs the base Giant at level 9 (client rows): housing 5 -> 10, HP 1850 -> 4000, DPS 70 -> 130, speed 12 -> 12.
- Special ability Wall Buster: 5x damage against Walls, although Walls are not a preferred target.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Defenses |
| attackType | Melee (Ground Only) |
| housingSpace | 10 |
| movementSpeed | 12 |
| attackSpeedSeconds | 2 |
| rangeTiles | 1 |
| specialAbility | Wall Buster |

## Level table

| Level | DPS | Damage / attack | Damage vs Walls | HP |
|---|---|---|---|---|
| 9 | 130 | 260 | 1,300 | 4,000 |
| 10 | 140 | 280 | 1,400 | 4,200 |
| 11 | 150 | 300 | 1,500 | 4,400 |
| 12 | 160 | 320 | 1,600 | 4,600 |
| 13 | 175 | 350 | 1,750 | 4,900 |
| 14 | 205 | 410 | 2,050 | 5,600 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- wall bonus -> `DamageMultiplierTarget` Wall, `DamageMultiplierPercent` 500
- targeting -> `PreferedTargetBuildingClass` Defense
- stats -> `DPS` x 2 s, `Hitpoints`, `Speed` 150

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 10 vs client 10 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 12 vs client 12 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 2 vs client 2 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 1 vs client 1 (`AttackRange/100`)
- MATCH `hitpoints` at levels 9-14 (`Hitpoints`)
- MATCH `dps` at levels 9-14 (`DPS`)
- MATCH `damagePerAttack` at levels 9-14 (`DPS*AttackSpeed/1000`)
- MATCH `damageVsWalls` at levels 9-14 (`DPS*2*DamageMultiplierPercent/100`)

**Notes, ambiguities and manual checks**

- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
