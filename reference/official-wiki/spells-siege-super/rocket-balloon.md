# Rocket Balloon

- **Source:** https://clashofclans.fandom.com/wiki/Rocket_Balloon/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Rocket_Balloon)
- **Wiki revision:** 622932 (parent page `Rocket Balloon` rev 588358); retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Rocket Balloon` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Balloon. Flying bomber that targets defenses with area splash and drops death damage (1.2-tile radius); housing 8, speed 12, 3 s attacks. Wiki levels 8-13 (5-7 only in its Spotlight event).
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Balloon at level 8+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 6+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Balloon.
- Stat change vs the base Balloon at level 8 (client rows): housing 5 -> 8, HP 840 -> 840, DPS 236 -> 270, speed 10.4 -> 12.
- Special ability Boosters: for the first 4 s after deployment its speed rises by 52 (same as a level 5 Haste Spell). Afterwards it is slightly faster and hits slightly harder than a Balloon, with the same HP as a Balloon of equal level.
- Boosters keep ticking while encased by an Ice Block Spell.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Defenses |
| attackType | Area Splash |
| housingSpace | 8 |
| movementSpeed | 12 |
| attackSpeedSeconds | 3 |
| rangeTiles | 0.5 |
| deathDamageRadiusTiles | 1.2 |
| specialAbility | Boosters |
| boosterSpeedIncrease | 52 |

## Level table

| Level | DPS | Damage / attack | Death damage | HP | TH req. |
|---|---|---|---|---|---|
| 5* | 170 | 510 | 300 | 390 | 8 |
| 6* | 220 | 660 | 400 | 545 | 9 |
| 7* | 260 | 780 | 500 | 690 | 11 |
| 8 | 270 | 810 | 580 | 840 | 12 |
| 9 | 280 | 840 | 620 | 940 | 13 |
| 10 | 285 | 855 | 650 | 1,040 | 14 |
| 11 | 290 | 870 | 700 | 1,140 | 16 |
| 12 | 304 | 912 | 730 | 1,240 | 17 |
| 13 | 326 | 978 | 760 | 1,360 | 18 |

`*` = level only reachable in a wiki-documented event/spotlight (not through normal boosting).

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- boosters -> `SpecialAbilities` RocketBallonAbility: `SpeedBoost` 318, `DeactivateAfterTime` 4000
- legacy haste row -> spells `TroopHaste` (`SpeedBoost` 52, `BoostTimeMS` 4000) matches the wiki's +52 for 4 s
- bombing -> `DPS` x 3 s, `DamageRadius` 120, `SelfAsAoeCenter` TRUE, `DieDamage`, `DieDamageRadius` 120, `DieDamageDelay` 416
- TH per level -> derived: Laboratory TH needed for the Balloon level

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 8 vs client 8 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 12 vs client 12 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 3 vs client 3 (`AttackSpeed/1000`)
- MISMATCH `rangeTiles`: wiki 0.5 vs client 0 (`AttackRange/100`)
- MATCH `deathDamageRadiusTiles`: wiki 1.2 vs client 1.2 (`DieDamageRadius/100`)
- MATCH `hitpoints` at levels 5-13 (`Hitpoints`)
- MATCH `dps` at levels 5-13 (`DPS`)
- MATCH `damagePerAttack` at levels 5-13 (`DPS*AttackSpeed/1000`)
- MATCH `deathDamage` at levels 5-13 (`DieDamage`)
- MATCH `townHallLevel` at levels 8-13 (`Laboratory TH for Balloon[L].LaboratoryLevel`)

**Notes, ambiguities and manual checks**

- Boost speed units ambiguous: wiki +52 equals legacy `TroopHaste` spell; the referenced ability stores `SpeedBoost` 318 (unit unknown). Duration 4 s agrees.
- Range: wiki 0.5 tile, client has no `AttackRange` (0); several flying units show +0.5 tile on the wiki.
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
