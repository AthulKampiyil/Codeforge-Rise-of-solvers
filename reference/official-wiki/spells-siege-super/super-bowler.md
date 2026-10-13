# Super Bowler

- **Source:** https://clashofclans.fandom.com/wiki/Super_Bowler
- **Wiki revision:** 623122; retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Bowler` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Bowler. Ranged ground splash attacker, no preferred target; housing 30, speed 14, 2.2 s attacks, 3-tile range. Wiki levels 4-10.
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Bowler at level 4+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 6+ is needed to receive one (page text).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Bowler.
- Stat change vs the base Bowler at level 4 (client rows): housing 6 -> 30, HP 470 -> 1600, DPS 96 -> 170, speed 14 -> 14.
- Special ability Triple Strike: each boulder hits, then bounces onward twice more (three impacts vs the Bowler's two), each bounce landing 3 tiles further and dealing 0.6-tile splash damage.
- Page text: boosting needs Town Hall 12; because of the Laboratory cap a level 6 Clan Castle is needed to receive one.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Area Splash 0.6 Tile Radius (Ground Only) |
| housingSpace | 30 |
| movementSpeed | 14 |
| attackSpeedSeconds | 2.2 |
| range | 3 tiles from first target |
| specialAbility | Triple Strike |
| rangeTiles | 3 |
| bounceDistanceTiles | 3 |
| splashRadiusTiles | 0.6 |

## Level table

| Level | DPS | Damage / attack | HP |
|---|---|---|---|
| 4 | 170 | 374 | 1,600 |
| 5 | 185 | 407 | 1,800 |
| 6 | 200 | 440 | 2,000 |
| 7 | 220 | 484 | 2,300 |
| 8 | 240 | 528 | 2,600 |
| 9 | 270 | 594 | 3,000 |
| 10 | 310 | 682 | 3,700 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- bounces -> `ProjectileBounces` 3, `ChainShootingDistance` 300, `Projectile` SuperBowlerProjectile
- splash -> `DamageRadius` 60
- stats -> `DPS` x 2.2 s, `Hitpoints`, `Speed` 175, `AttackRange` 300, `NewTargetAttackDelay` 1100

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 30 vs client 30 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 14 vs client 14 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 2.2 vs client 2.2 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 3 vs client 3 (`AttackRange/100`)
- MATCH `bounceDistanceTiles`: wiki 3 vs client 3 (`ChainShootingDistance/100`)
- MATCH `splashRadiusTiles`: wiki 0.6 vs client 0.6 (`DamageRadius/100`)
- MATCH `hitpoints` at levels 4-10 (`Hitpoints`)
- MATCH `dps` at levels 4-10 (`DPS`)
- MATCH `damagePerAttack` at levels 4-10 (`DPS*AttackSpeed/1000`)

**Notes, ambiguities and manual checks**

- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
