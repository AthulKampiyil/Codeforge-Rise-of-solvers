# Town Hall/Giga Inferno (TH14)

- Source: [Town Hall/Giga Inferno (TH14)](https://clashofclans.fandom.com/wiki/Town_Hall/Giga_Inferno_%28TH14%29) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `620073`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `weapons.csv` -> `Townhall14`

## Mechanics

- Built into the Town Hall 14 (not a separate building): its hitpoints are the Town Hall's (8,900). Since October 6, 2025 the weapon has no upgrade levels - one fixed stat line per Town Hall level.
- Activation: stays hidden until the Town Hall is damaged by a troop or spell, or the attack reaches 51% destruction; troops entering range do not wake it. Before activation the Town Hall is not a 'defense' for defense-targeting troops (Giants, Balloons, Hog Riders). If the Town Hall is upgrading, the weapon neither fires nor explodes and is not targeted as a defense.
- Attack: range 10 tiles, ground and air, hits up to 4 targets at once; 280 DPS per target, 35.84 per hit every 0.128 s.
- Death bomb: when the Town Hall is destroyed it explodes for 900 damage in 4 tiles (ground and air). The death blast leaves a poison cloud: up to 180 DPS, -50% movement and attack speed, lasting 12 s.

### Recent balance notes (from the page's History table)

- October 6, 2025: weapon levels removed; build time 9d -> 7d 12h.

## Level table

**Statistics**

| Damage per Second per Target | Damage per Hit | Number of targets | Damage when destroyed | Death Damage Radius | Poison Max DPS | Speed decrease | Attack Rate decrease | Poison duration when Destroyed | Hitpoints |
|---|---|---|---|---|---|---|---|---|---|
| 280 | 35.84 | 4 | 900 | 4 tiles | 180 | 50% | 50% | 12s | 8,900 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 10 | 0.128s | Multiple Targets | Ground & Air |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| damageWhenDestroyed | all | 900 | 1000 | DieDamage |

**Interpretation of client columns**

- weapons.csv `Townhall14` (single level): `AttackRange` 1000, `AttackSpeed` 128, `DPS` 280, `MultiTargets` TRUE with `NumMultiTargets` 4, `DieDamage` 1000, `DieDamageRadius` 400, `DieDamageDelay` 1600 ms, `DieDamageSpell` `TH14 Poison`.
- Town Hall level 14 row: `Weapon` Townhall14, `ActivateCombatOnDamageTaken` 1, `CombatActivationDelay` 500 ms; the 51% rule is the global `HIDDEN_BUILDING_APPEAR_DESTRUCTION_PERCENTAGE` 50.
- Verified equal (wiki vs client): `dpsPerTarget`, `damagePerHit`, `numberOfTargets`, `deathDamageRadius`, `hitpoints`, `range`, `attackSeconds`, `poisonMaxDps`, `speedDecrease`, `attackRateDecrease`, `poisonDurationWhenDestroyed`.
- spells.csv `TH14 Poison`: `Radius` 400 (4.0 tiles), `PoisonDPS` 180, `SpeedBoost` -50, `AttackSpeedBoost` -50, 30 x 400 ms, `HeroDamageMultiplier` 100, `PoisonAffectAir` TRUE. The wiki gives no poison radius; the client poison cloud is 4.0 tiles.
- Death damage: the wiki page lists 900 while `Townhall14.DieDamage` is 1,000 (the Giga Weapons overview page also says 900). History only records the TH15 change (1,100 -> 1,000, Oct 2025), so either the client or the wiki is off for TH14.
