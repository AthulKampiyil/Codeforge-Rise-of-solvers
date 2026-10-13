# Super Witch

- **Source:** https://clashofclans.fandom.com/wiki/Super_Witch
- **Wiki revision:** 623218; retrieved 2026-09-15
- **Also used:** https://clashofclans.fandom.com/wiki/Super_Witch/Big_Boy (rev 624186)
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Witch` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Witch. Ranged splash attacker (ground and air), no preferred target; housing 40, speed 12, 0.7 s attacks, 4-tile range. Wiki levels 5-8 (1-4 only in its Mini Spotlight).
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Witch at level 5+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 8+ is needed to receive one (page text).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Witch.
- Stat change vs the base Witch at level 5 (client rows): housing 12 -> 40, HP 520 -> 3200, DPS 185 -> 360, speed 12 -> 12.
- Special ability Big Boy: instead of many Skeletons she raises a single giant skeleton; only one Big Boy can exist per Super Witch, and she raises a new one after it is destroyed.
- Big Boy: single-target melee with no preferred target, 350 DPS (700 per 2 s hit), 4,100 HP, speed 12, 1-tile range; counts as 20 housing for Spring Trap, Tornado Trap, Giga Bomb, Clone and Recall.
- Page text: boosting needs Town Hall 12; receiving one needs a level 8 Clan Castle.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Area Splash |
| housingSpace | 40 |
| movementSpeed | 12 |
| attackSpeedSeconds | 0.7 |
| rangeTiles | 4 |
| specialAbility | Big Boy |

## Level table

| Level | DPS | Damage / attack | HP |
|---|---|---|---|
| 1* | 240 | 168 | 2,400 |
| 2* | 270 | 189 | 2,600 |
| 3* | 300 | 210 | 2,800 |
| 4* | 330 | 231 | 3,000 |
| 5 | 360 | 252 | 3,200 |
| 6 | 390 | 273 | 3,400 |
| 7 | 430 | 301 | 3,750 |
| 8 | 470 | 329 | 4,100 |

`*` = level only reachable in a wiki-documented event/spotlight (not through normal boosting).

Cells shown as `wiki (client X)` differ from the pinned client.

### Big Boy (wiki sub-page)

| DPS | Damage / attack | HP | Preferred target | Attack type | Movement speed | Attack speed seconds | Range tiles |
|---|---|---|---|---|---|---|---|
| 350 | 700 | 4,100 | None | Single Target | 12 | 2 | 1 |

## Client comparison

**Which client columns encode each mechanic**

- summon -> `SummonTroop` Big Boy, `SummonTroopCount` 1, `SummonLimit` 1, `SummonTime` 1000, `SummonCooldown` 25000, `SummonLevel` 1, `SecondarySpawnDist` 150
- Big Boy -> characters `Big Boy`: `Hitpoints` 4100, `DPS` 350, `AttackSpeed` 2000, `Speed` 150, `AttackRange` 100, `HousingSpace` 20 (single level)
- stats -> `DPS` x 0.7 s, `Hitpoints`, `Speed` 150, `AttackRange` 400, `DamageRadius` 30, `Projectile` Witch_projectile

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 40 vs client 40 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 12 vs client 12 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 0.7 vs client 0.7 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 4 vs client 4 (`AttackRange/100`)
- MATCH `hitpoints` at levels 1-8 (`Hitpoints`)
- MATCH `dps` at levels 1-8 (`DPS`)
- MATCH `damagePerAttack` at levels 1-8 (`DPS*AttackSpeed/1000`)

**Notes, ambiguities and manual checks**

- `SummonCooldown` = 25000 ms (25 s between Big Boy summons) is not stated on the wiki.
- Big Boy has a single client level (`SummonLevel` 1), consistent with the wiki listing one stat line for all Super Witch levels.
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
