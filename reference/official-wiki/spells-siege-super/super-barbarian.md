# Super Barbarian

- **Source:** https://clashofclans.fandom.com/wiki/Super_Barbarian/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Super_Barbarian)
- **Wiki revision:** 622930 (parent page `Super Barbarian` rev 588088); retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Barbarian` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Barbarian. Melee ground attacker with no preferred target; housing 5, speed 20, 0.8 s attacks, 0.6-tile range. Wiki levels 8-13.
- Boosting: needs Town Hall 11 in practice (global minimum TH11 plus the base Barbarian at level 8+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 5+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Barbarian.
- Stat change vs the base Barbarian at level 8 (client rows): housing 1 -> 5, HP 205 -> 1000, DPS 34 -> 180, speed 17.6 -> 20.
- Special ability Rage: for the first 8 s after deployment it moves faster (+16 in-game speed per wiki) and deals +70% damage, like the Builder Base Raged Barbarian.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Melee (Ground Only) |
| housingSpace | 5 |
| movementSpeed | 20 |
| attackSpeedSeconds | 0.8 |
| rangeTiles | 0.6 |
| specialAbility | Rage |
| rageSpeedIncrease | 16 |
| rageDamageIncreasePercent | 70 |

## Level table

| Level | DPS | Damage / attack | HP |
|---|---|---|---|
| 8 | 180 | 144 | 1,000 |
| 9 | 200 | 160 | 1,100 |
| 10 | 220 | 176 | 1,200 |
| 11 | 240 | 192 | 1,300 |
| 12 | 250 | 200 | 1,350 |
| 13 | 270 | 216 | 1,450 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- rage -> `SpecialAbilities` 'Super Barbarian Ability': `BoostDamagePercentage` 70, `SpeedBoost` 150, `DeactivateAfterTime` 8000
- legacy rage row -> spells `TroopRage` (`SpeedBoost` 16, `DamageBoostPercent` 70) matches the wiki's +16 / +70% exactly
- stats -> `DPS` x `AttackSpeed` 800, `Hitpoints`, `Speed` 250, `AttackRange` 60, `VisualLevel` = base Barbarian level (5..13 present)

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 5 vs client 5 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 20 vs client 20 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 0.8 vs client 0.8 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 0.6 vs client 0.6 (`AttackRange/100`)
- MATCH `rageDamageIncreasePercent`: wiki 70 vs client 70 (`Super Barbarian Ability.BoostDamagePercentage`)
- MATCH `hitpoints` at levels 8-13 (`Hitpoints`)
- MATCH `dps` at levels 8-13 (`DPS`)
- MATCH `damagePerAttack` at levels 8-13 (`DPS*AttackSpeed/1000`)

**Notes, ambiguities and manual checks**

- Rage speed units are ambiguous: the wiki's +16 matches the legacy `TroopRage` spell row, while the ability the character actually references stores `SpeedBoost` = 150 (=+12 if read as internal speed units). Damage (+70%) and duration (8 s) agree.
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
