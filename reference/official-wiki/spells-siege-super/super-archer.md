# Super Archer

- **Source:** https://clashofclans.fandom.com/wiki/Super_Archer
- **Wiki revision:** 621780; retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Archer` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Archer. Ranged attacker (ground and air targets), no preferred target; housing 12, speed 24, 1.5 s attacks. Wiki levels 8-14.
- Boosting: needs Town Hall 11 in practice (global minimum TH11 plus the base Archer at level 8+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 5+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Archer.
- Stat change vs the base Archer at level 8 (client rows): housing 1 -> 12, HP 52 -> 450, DPS 28 -> 120, speed 24 -> 24.
- Special ability Sharp Shot: arrows keep flying through the first target and damage every building along the line; the wiki lists 6 tiles to acquire a target and 12 tiles of projectile travel.
- Since Oct 2020 it no longer misses targets within 0.1 tile; the info screen shows the attack as Area Splash.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Ranged (Ground & Air) |
| housingSpace | 12 |
| movementSpeed | 24 |
| attackSpeedSeconds | 1.5 |
| range | 6 (Target) 12 (Projectile) |
| specialAbility | Sharp Shot |
| rangeTiles | 6 |
| projectileRangeTiles | 12 |

## Level table

| Level | DPS | Damage / hit | HP |
|---|---|---|---|
| 8 | 120 | 180 | 450 |
| 9 | 132 | 198 | 510 |
| 10 | 144 | 216 | 565 |
| 11 | 156 | 234 | 605 |
| 12 | 162 | 243 | 645 |
| 13 | 166 | 249 | 685 |
| 14 | 170 | 255 | 725 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- piercing -> `PenetratingProjectile` TRUE, `PenetratingRadius` 30, `PenetratingExtraRange` 400, `Projectile` magic_archer_projectile
- range -> `AttackRange` 600
- stats -> `DPS` x 1.5 s, `Hitpoints`, `Speed` 300

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 12 vs client 12 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 24 vs client 24 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1.5 vs client 1.5 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 6 vs client 6 (`AttackRange/100`)
- MATCH `hitpoints` at levels 8-14 (`Hitpoints`)
- MATCH `dps` at levels 8-14 (`DPS`)
- MATCH `damagePerHit` at levels 8-14 (`DPS*AttackSpeed/1000`)

**Notes, ambiguities and manual checks**

- Projectile reach: wiki 12 tiles vs client `AttackRange` 600 + `PenetratingExtraRange` 400 = 10 tiles (unless the engine adds more).
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
