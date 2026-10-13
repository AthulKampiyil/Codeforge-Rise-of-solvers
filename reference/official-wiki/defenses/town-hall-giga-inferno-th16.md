# Town Hall/Giga Inferno (TH16)

- Source: [Town Hall/Giga Inferno (TH16)](https://clashofclans.fandom.com/wiki/Town_Hall/Giga_Inferno_%28TH16%29) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `620864`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `weapons.csv` -> `Townhall16`

## Mechanics

- Built into the Town Hall 16 (not a separate building): its hitpoints are the Town Hall's (10,000). Since October 6, 2025 the weapon has no upgrade levels - one fixed stat line per Town Hall level.
- Activation: stays hidden until the Town Hall is damaged by a troop or spell, or the attack reaches 51% destruction; troops entering range do not wake it. Before activation the Town Hall is not a 'defense' for defense-targeting troops (Giants, Balloons, Hog Riders). If the Town Hall is upgrading, the weapon neither fires nor explodes and is not targeted as a defense.
- Attack: range 10 tiles, ground and air, hits up to 4 targets at once; 300 DPS per target, 38.4 per hit every 0.128 s.
- Death bomb: when the Town Hall is destroyed it explodes for 1,100 damage in 4.5 tiles (ground and air). The death blast leaves a 12 s poison cloud (180 DPS max, -50% movement and attack speed). At TH17 this Town Hall is merged with a level 7 Eagle Artillery into the Inferno Artillery.

### Recent balance notes (from the page's History table)

- October 6, 2025: weapon levels removed; build cost 16M -> 15M; build time 11d -> 9d.

## Level table

**Statistics**

| Damage per Second per Target | Damage per Hit | Number of Targets | Damage when Destroyed | Death Damage Radius | Poison Max DPS | Speed Decrease | Attack Rate Decrease | Poison duration when Destroyed | Hitpoints |
|---|---|---|---|---|---|---|---|---|---|
| 300 | 38.4 | 4 | 1,100 | 4.5 tiles | 180 | 50% | 50% | 12s | 10,000 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 10 | 0.128s | Multiple Targets | Ground & Air |

## Client comparison

No mismatches found in the compared fields.

**Interpretation of client columns**

- weapons.csv `Townhall16` (single level): `AttackRange` 1000, `AttackSpeed` 128, `DPS` 300, `MultiTargets` TRUE with `NumMultiTargets` 4, `DieDamage` 1100, `DieDamageRadius` 450, `DieDamageDelay` 1600 ms, `DieDamageSpell` `TH15 Poison`.
- Town Hall level 16 row: `Weapon` Townhall16, `ActivateCombatOnDamageTaken` 1, `CombatActivationDelay` 500 ms; the 51% rule is the global `HIDDEN_BUILDING_APPEAR_DESTRUCTION_PERCENTAGE` 50.
- Verified equal (wiki vs client): `dpsPerTarget`, `damagePerHit`, `numberOfTargets`, `damageWhenDestroyed`, `deathDamageRadius`, `hitpoints`, `range`, `attackSeconds`, `poisonMaxDps`, `speedDecrease`, `attackRateDecrease`, `poisonDurationWhenDestroyed`.
- spells.csv `TH15 Poison`: `Radius` 400 (4.0 tiles), `PoisonDPS` 180, `SpeedBoost` -50, `AttackSpeedBoost` -50, 30 x 400 ms, `HeroDamageMultiplier` 100, `PoisonAffectAir` TRUE. The wiki gives no poison radius; the client poison cloud is 4.0 tiles.
- `Townhall16.DieDamageSpell` reuses `TH15 Poison` (same cloud as TH15).
