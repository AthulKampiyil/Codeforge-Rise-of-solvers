# Super Wizard

- **Source:** https://clashofclans.fandom.com/wiki/Super_Wizard/Home_Village (transcluded into https://clashofclans.fandom.com/wiki/Super_Wizard)
- **Wiki revision:** 624748 (parent page `Super Wizard` rev 618174); retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Wizard` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Wizard. Ranged attacker (ground and air), no preferred target; housing 10, speed 20, 2 s attacks. Wiki levels 9-14 (HP raised at all levels in Jan 2026).
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Wizard at level 9+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 6+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Wizard.
- Stat change vs the base Wizard at level 9 (client rows): housing 4 -> 10, HP 230 -> 545, DPS 230 -> 220, speed 16 -> 20.
- Special ability Chain Magic: each attack hits the primary target and then chains from that primary target (not hop-to-hop like the Electro Dragon) to up to nine other targets within 3 tiles, each taking 40% of the damage (60% decay since Jan 2021).

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Single Target |
| chainDamageDecayPercent | 60 |
| chainDistanceTiles | 3 |
| housingSpace | 10 |
| movementSpeed | 20 |
| attackSpeedSeconds | 2 |
| rangeTiles | 3 |
| specialAbility | Chain Magic |

## Level table

| Level | DPS | Dmg / hit (primary) | Dmg / hit (chain) | HP |
|---|---|---|---|---|
| 9 | 220 | 440 | 176 | 545 |
| 10 | 240 | 480 | 192 | 705 |
| 11 | 265 | 530 | 212 | 760 |
| 12 | 285 | 570 | 228 | 815 |
| 13 | 305 | 610 | 244 | 870 |
| 14 | 335 | 670 | 268 | 925 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- chain -> `ChainAttackDistance` 300, `ChainAttackFactor` 10 (targets incl. primary), `ChainAttackDepth` 1 (branches from primary), `ChainAttackDamageReductionPercent` 60, `ChainAttackDelay` 128
- stats -> `DPS` x 2 s, `Hitpoints`, `Speed` 250, `AttackRange` 350

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 10 vs client 10 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 20 vs client 20 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 2 vs client 2 (`AttackSpeed/1000`)
- MISMATCH `rangeTiles`: wiki 3 vs client 3.5 (`AttackRange/100`)
- MATCH `chainDamageDecayPercent`: wiki 60 vs client 60 (`ChainAttackDamageReductionPercent`)
- MATCH `chainDistanceTiles`: wiki 3 vs client 3 (`ChainAttackDistance/100`)
- MATCH `hitpoints` at levels 9-14 (`Hitpoints`)
- MATCH `dps` at levels 9-14 (`DPS`)
- MATCH `damagePerHitPrimary` at levels 9-14 (`DPS*AttackSpeed/1000`)
- MATCH `damagePerHitSecondary` at levels 9-14 (`primary*(100-ChainAttackDamageReductionPercent)/100`)

**Notes, ambiguities and manual checks**

- Range mismatch: wiki 3 tiles vs client `AttackRange` 350 (3.5 tiles).
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
