# Super Valkyrie

- **Source:** https://clashofclans.fandom.com/wiki/Super_Valkyrie
- **Wiki revision:** 622824; retrieved 2026-09-15
- **Category:** `super-troop`
- **Client row:** `characters.json` -> `Super Valkyrie` (pinned client 18.400.21)
- **License note:** mechanics are paraphrased from the Clash of Clans Wiki (CC BY-SA 3.0); numbers are facts transcribed from its tables.

## Mechanics

- Base troop: Valkyrie. Melee splash attacker (ground only), no preferred target; housing 20, speed 24, 1.1 s attacks, 0.6-tile range. Wiki levels 7-12.
- Boosting: needs Town Hall 12 in practice (global minimum TH11 plus the base Valkyrie at level 7+); costs 25,000 Dark Elixir or one Super Potion and lasts 3 days; at most two different Super Troop types can be boosted at once. Clan Castle level 6+ can receive one through donations (possibly before the receiver can boost it).
- Level mapping: there is no separate research - the Super Troop's level always equals the researched level of the Valkyrie.
- Stat change vs the base Valkyrie at level 7 (client rows): housing 8 -> 20, HP 1650 -> 2400, DPS 185 -> 250, speed 24 -> 24.
- Its first swing is much slower than a Valkyrie's but later swings are faster.
- Special ability Farewell Gift: on death it leaves a rage field that behaves like a level 4 Rage Spell (+160% damage, +26 speed) with a smaller 4-tile radius and (per wiki) a shorter duration. On defense the rage also boosts nearby defenses by +60% damage (Jan 2026).

## Constants (wiki)

| Field | Value |
|---|---|
| preferredTarget | None |
| attackType | Area Splash (Ground Only) |
| housingSpace | 20 |
| movementSpeed | 24 |
| attackSpeedSeconds | 1.1 |
| rangeTiles | 0.6 |
| specialAbility | Farewell Gift |

## Level table

| Level | DPS | Damage / hit | HP |
|---|---|---|---|
| 7 | 250 | 275 | 2,400 |
| 8 | 300 | 330 | 2,700 |
| 9 | 325 | 357.5 | 2,900 |
| 10 | 350 | 385 | 3,400 |
| 11 | 375 | 412.5 | 3,900 |
| 12 | 405 | 445.5 | 4,500 |

Cells shown as `wiki (client X)` differ from the pinned client.

## Client comparison

**Which client columns encode each mechanic**

- death rage -> `SpecialAbilities` EliteValkyrieOnDeath -> `SelfSpell` EliteValkyrieRage: `DamageBoostPercent` 160, `SpeedBoost` 26/`SpeedBoost2` 13, `BuildingDamageBoostPercent` 60, `Radius` 400, `NumberOfHits` 60 x `TimeBetweenHitsMS` 300
- splash -> `DamageRadius` 100, `SelfAsAoeCenter` TRUE, `AttackMultipleBuildings` TRUE
- stats -> `DPS` x 1.1 s, `Hitpoints`, `Speed` 300, `AttackRange` 50, `NewTargetAttackDelay` 600

**Automatic wiki-vs-client check**

- MATCH `housingSpace`: wiki 20 vs client 20 (`HousingSpace`)
- MATCH `movementSpeed`: wiki 24 vs client 24 (`trunc(Speed/12.5)`)
- MATCH `attackSpeedSeconds`: wiki 1.1 vs client 1.1 (`AttackSpeed/1000`)
- MISMATCH `rangeTiles`: wiki 0.6 vs client 0.5 (`AttackRange/100`)
- MATCH `hitpoints` at levels 7-12 (`Hitpoints`)
- MATCH `dps` at levels 7-12 (`DPS`)
- MATCH `damagePerHit` at levels 7-12 (`DPS*AttackSpeed/1000`)

**Notes, ambiguities and manual checks**

- Death-rage duration: wiki says shorter than a Rage Spell, but the client row pulses 60 x 300 ms = 18 s, the same as the Rage Spell.
- Range mismatch: wiki 0.6 tile vs client `AttackRange` 50 (0.5).
- Boost data: client `super_licences` row (`ResourceCost` 25000 `Resource` DarkElixir, `DurationH` 72, `MinOriginalLevel` is 0-based) and globals `MAX_ACTIVE_SUPER_LICENCES` = 2, `MIN_TH_LEVEL_FOR_SUPER_LICENCES` = 10 (0-based, i.e. TH11). The client row also has `CooldownH` 72, which the wiki does not mention.
