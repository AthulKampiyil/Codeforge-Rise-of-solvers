# Super Hog Rider

- **Source:** https://clashofclans.fandom.com/wiki/Super_Hog_Rider
- **Wiki revision:** 621779; retrieved 2026-09-15
- **Also used:** https://clashofclans.fandom.com/wiki/Super_Hog_Rider/Super_Rider (rev 621782)
- **Also used:** https://clashofclans.fandom.com/wiki/Super_Hog_Rider/Super_Hog (rev 623407)
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Hog Rider` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Hog Rider. Ground troop that targets defenses and jumps over Walls; housing 12, speed 24, 1 s attacks, 0.6-tile range. Wiki levels 10-15.
- Boosting: needs Town Hall 13 in practice (global minimum TH11 plus the base Hog Rider at level 10+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 7+ is needed to receive one (page text).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Hog Rider.
- Stat change vs the base Hog Rider at level 10 (client rows): housing 5 -> 12, HP 970 -> 1500, DPS 176 -> 190, speed 24 -> 24.
- Special ability Divide and Conquer: when defeated, the Rider is thrown several tiles backwards and both halves keep fighting.
- Super Rider: targets anything on the ground, deals the same DPS as the combined unit and 2x damage to Walls, cannot jump Walls, speed 16, 0.4-tile range (counts as 5 housing for traps/Clone/Recall).
- Super Hog: keeps targeting defenses and jumping Walls, higher HP but much lower DPS (50-80), speed 32, 0.6-tile range (5 housing for traps/Clone/Recall).

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Defenses |
| attackType | Single Target (Ground Only) |
| housingSpace | 12 |
| movementSpeed | 24 |
| attackSpeedSeconds | 1 |
| rangeTiles | 0.6 |
| specialAbility | Divide and Conquer |

## Level table

| Level | DPS | Damage / hit | HP |
|---|---|---|---|
| 10 | 180 (client 190) | 180 (client 190) | 1,500 |
| 11 | 200 (client 210) | 200 (client 210) | 1,600 |
| 12 | 230 | 230 | 1,750 |
| 13 | 250 | 250 | 1,900 |
| 14 | 270 | 270 | 2,100 |
| 15 | 300 | 300 | 2,350 |

Cells shown as `wiki (client X)` differ from the pinned client.

### Super Rider (wiki sub-page)

| Level | DPS | Damage / hit | Damage vs Walls | HP |
|---|---|---|---|---|
| 10 | 180 | 180 | 360 | 550 |
| 11 | 200 | 200 | 400 | 625 |
| 12 | 230 | 230 | 460 | 700 |
| 13 | 250 | 250 | 500 | 750 |
| 14 | 270 | 270 | 540 | 800 |
| 15 | 300 | 300 | 600 | 900 |

### Super Hog (wiki sub-page)

| Level | DPS | Damage / attack | HP |
|---|---|---|---|
| 10 | 50 | 50 | 800 |
| 11 | 55 | 55 | 900 |
| 12 | 60 | 60 | 1,000 |
| 13 | 65 | 65 | 1,050 |
| 14 | 70 | 70 | 1,100 |
| 15 | 80 | 80 | 1,200 |

## Client comparison

**Which client columns encode each mechanic**

- split -> `SpecialAbilities` SuperHogRiderSummonRider (`ProjectileOnActivation` JumpingRiderProjectileN, `AttackRange` 350 throw) ; SuperHogRiderSummonHog (`SelfSpell` SuperHogRiderSummonHog level N); `SpecialAbilitiesLevel` 1..12 = VisualLevel 4..15
- sub-units -> characters `Super Rider` (`Speed` 200, `AttackRange` 40, `DamageMultiplierTarget` Wall 200%) and `Super Hog` (`Speed` 400, `AttackRange` 60, `IsJumper` TRUE)
- stats -> `DPS`, `Hitpoints`, `Speed` 300, `IsJumper` TRUE, `PreferedTargetBuildingClass` Defense

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 12 vs client 12 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 24 vs client 24 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1 vs client 1 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 0.6 vs client 0.6 (`AttackRange/100`)
- MATCH `hitpoints` at levels 10-15 (`Hitpoints`)
- MISMATCH `dps` (2 of 6 levels; `DPS`): L10: wiki 180 vs client 190; L11: wiki 200 vs client 210
- MISMATCH `damagePerHit` (2 of 6 levels; `DPS*AttackSpeed/1000`): L10: wiki 180 vs client 190; L11: wiki 200 vs client 210

**Notes, ambiguities and manual checks**

- DPS mismatch at L10/L11 on both the Super Hog Rider and Super Rider pages (wiki 180/200 vs client 190/210); L12-15 agree.
- No `DonatingSuperTroop` template; page text says a level 7 Clan Castle is needed to hold one. TH requirement derived from client data: TH13 (Hog Rider level 10 needs Laboratory 11).
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
