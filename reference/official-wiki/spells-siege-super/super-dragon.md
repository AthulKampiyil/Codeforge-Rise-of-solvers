# Super Dragon

- **Source:** https://clashofclans.fandom.com/wiki/Super_Dragon/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Super_Dragon)
- **Wiki revision:** 623387 (parent page `Super Dragon` rev 613580); retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Dragon` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Dragon. Flying splash attacker (ground and air), no preferred target; housing 40, speed 14, 3-tile range (cut from 3.5 in May 2022). Wiki levels 7-13 (3-6 only in its Spotlight event).
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Dragon at level 7+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 8+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Dragon.
- Stat change vs the base Dragon at level 7 (client rows): housing 20 -> 40, HP 3900 -> 6100, DPS 310 -> 402, speed 16 -> 14.
- Special ability Roast: fires bursts of 10 flame shots, 0.192 s apart, then pauses 1.8 s; every shot splashes a roughly 1-tile area (the wiki describes a 21-tile 5x5 square minus corners).

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Any |
| attackType | Area Splash |
| housingSpace | 40 |
| movementSpeed | 14 |
| timeBetweenShotsSeconds | 0.192 |
| timeBetweenBurstsSeconds | 1.8 |
| shotsPerBurst | 10 |
| rangeTiles | 3 |
| specialAbility | Roast |

## Level table

| Level | DPS | Damage / shot | HP | TH req. |
|---|---|---|---|---|
| 3* | 300 (client 301) | 108 | 3,900 | 8 |
| 4* | 325 (client 326) | 117 | 4,500 | 9 |
| 5* | 351 (client 352) | 126 | 5,100 | 10 |
| 6* | 376 (client 377) | 135 | 5,600 | 11 |
| 7 | 401 (client 402) | 144.07 | 6,100 | 12 |
| 8 | 426 (client 427) | 153.03 | 6,400 | 13 |
| 9 | 451 (client 452) | 161.99 | 6,700 | 14 |
| 10 | 476 (client 477) | 170.95 | 7,200 | 15 |
| 11 | 496 (client 497) | 178.12 | 7,600 | 16 |
| 12 | 516 (client 517) | 185.29 | 8,000 | 17 |
| 13 | 536 (client 537) | 192.46 | 8,400 | 18 |

`*` = level only reachable in a wiki-documented event/spotlight (not through normal boosting).

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- burst -> `BurstCount` 10, `BurstDelay` 192, `AttackSpeed` 1800, `CoolDownOverride` 1500, `Projectile` SuperDragonProjectile
- splash -> `DamageRadius` 160
- stats -> `DPS`, `Hitpoints`, `Speed` 175, `AttackRange` 300
- TH per level -> derived: Laboratory TH needed for the Dragon level

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 40 vs client 40 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 14 vs client 14 (`trunc(Speed/12.5)`)
- MATCH `rangeTiles`: wiki 3 vs client 3 (`AttackRange/100`)
- MATCH `timeBetweenShotsSeconds`: wiki 0.192 vs client 0.192 (`BurstDelay/1000`)
- MATCH `timeBetweenBurstsSeconds`: wiki 1.8 vs client 1.8 (`AttackSpeed/1000`)
- MATCH `shotsPerBurst`: wiki 10 vs client 10 (`BurstCount`)
- MATCH `hitpoints` at levels 3-13 (`Hitpoints`)
- MISMATCH `dps` (11 of 11 levels; `DPS`): L3: wiki 300 vs client 301; L4: wiki 325 vs client 326; L5: wiki 351 vs client 352; L6: wiki 376 vs client 377; L7: wiki 401 vs client 402; L8: wiki 426 vs client 427; L9: wiki 451 vs client 452; L10: wiki 476 vs client 477; L11: wiki 496 vs client 497; L12: wiki 516 vs client 517; L13: wiki 536 vs client 537
- MATCH `townHallLevel` at levels 7-13 (`Laboratory TH for Dragon[L].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- DPS is 1 lower on the wiki at every level (e.g. L7 401 vs client 402); the wiki's per-shot damage (144.07 at L7) is derived from its DPS and cannot be recomputed exactly from `DPS`, `AttackSpeed` and `BurstDelay`.
- Splash: wiki summary says 'about 1-tile radius'; client `DamageRadius` = 160 (1.6 tiles).
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
