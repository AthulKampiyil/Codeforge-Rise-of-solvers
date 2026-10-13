# Sneaky Goblin

- **Source:** https://clashofclans.fandom.com/wiki/Sneaky_Goblin
- **Wiki revision:** 622829; retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Sneaky Goblin` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Goblin. Fast melee ground troop targeting resource buildings with 2x damage against them; housing 3, speed 32, 1 s attacks, 0.4-tile range. Wiki levels 7-10.
- Boosting: needs Town Hall 11 in practice (global minimum TH11 plus the base Goblin at level 7+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 4+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Goblin.
- Stat change vs the base Goblin at level 7 (client rows): housing 1 -> 3, HP 105 -> 270, DPS 52 -> 155, speed 32 -> 32.
- Special ability Cloak: invisible (untargetable) for the first 5 s after deployment, like the Sneaky Archer.

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | Resources (Damage x2) |
| attackType | Melee (Ground Only) |
| housingSpace | 3 |
| movementSpeed | 32 |
| attackSpeedSeconds | 1 |
| rangeTiles | 0.4 |
| specialAbility | Cloak |

## Level table

| Level | DPS | Damage / attack | DPS vs resources | HP |
|---|---|---|---|---|
| 7 | 155 | 155 | 310 | 270 |
| 8 | 170 | 170 | 340 | 320 |
| 9 | 180 | 180 | 360 | 350 |
| 10 | 190 | 190 | 380 | 380 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- cloak -> `SpecialAbilities` EliteGoblinAbility: `IsInvisible` TRUE, `DeactivateAfterTime` 5000
- resource bonus -> `PreferedTargetBuildingClass` Resource + `PreferedTargetDamageMod` 2
- stats -> `DPS`, `Hitpoints`, `Speed` 400

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 3 vs client 3 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 32 vs client 32 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1 vs client 1 (`AttackSpeed/1000`)
- MATCH `rangeTiles`: wiki 0.4 vs client 0.4 (`AttackRange/100`)
- MATCH `hitpoints` at levels 7-10 (`Hitpoints`)
- MATCH `dps` at levels 7-10 (`DPS`)
- MATCH `damagePerAttack` at levels 7-10 (`DPS*AttackSpeed/1000`)
- MATCH `dpsVsResources` at levels 7-10 (`DPS*PreferedTargetDamageMod`)

**Notes, ambiguities and manual checks**

- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
