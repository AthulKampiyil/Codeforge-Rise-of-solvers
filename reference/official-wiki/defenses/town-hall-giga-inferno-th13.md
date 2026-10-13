# Town Hall/Giga Inferno (TH13)

- Source: [Town Hall/Giga Inferno (TH13)](https://clashofclans.fandom.com/wiki/Town_Hall/Giga_Inferno_%28TH13%29) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `620072`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `weapons.csv` -> `Townhall13`

## Mechanics

- Built into the Town Hall 13 (not a separate building): its hitpoints are the Town Hall's (8,200). Since October 6, 2025 the weapon has no upgrade levels - one fixed stat line per Town Hall level.
- Activation: stays hidden until the Town Hall is damaged by a troop or spell, or the attack reaches 51% destruction; troops entering range do not wake it. Before activation the Town Hall is not a 'defense' for defense-targeting troops (Giants, Balloons, Hog Riders). If the Town Hall is upgrading, the weapon neither fires nor explodes and is not targeted as a defense.
- Attack: range 10 tiles, ground and air, hits up to 4 targets at once; 220 DPS per target, 28.16 per hit every 0.128 s.
- Death bomb: when the Town Hall is destroyed it explodes for 700 damage in 4 tiles (ground and air). The TH13 death blast also slows attackers: -50% movement and attack speed for 8 s (a slow, not a full freeze).

### Recent balance notes (from the page's History table)

- October 6, 2025: weapon levels removed; build time 7d 12h -> 7d.

## Level table

**Statistics**

| Damage per Second per Target | Damage per Hit | Number of Targets | Damage when Destroyed | Death Damage Radius | Speed Decrease | Attack Rate Decrease | Slowdown Time when Destroyed | Hitpoints |
|---|---|---|---|---|---|---|---|---|
| 220 | 28.16 | 4 | 700 | 4 tiles | 50% | 50% | 8s | 8,200 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 10 | 0.128s | Multiple Targets | Ground & Air |

## Client comparison

No mismatches found in the compared fields.

**Interpretation of client columns**

- weapons.csv `Townhall13` (single level): `AttackRange` 1000, `AttackSpeed` 128, `DPS` 220, `MultiTargets` TRUE with `NumMultiTargets` 4, `DieDamage` 700, `DieDamageRadius` 400, `DieDamageDelay` 1600 ms, `DieDamageSpell` `TH13 Frost`.
- Town Hall level 13 row: `Weapon` Townhall13, `ActivateCombatOnDamageTaken` 1, `CombatActivationDelay` 500 ms; the 51% rule is the global `HIDDEN_BUILDING_APPEAR_DESTRUCTION_PERCENTAGE` 50.
- Verified equal (wiki vs client): `dpsPerTarget`, `damagePerHit`, `numberOfTargets`, `damageWhenDestroyed`, `deathDamageRadius`, `hitpoints`, `range`, `attackSeconds`, `speedDecrease`, `attackRateDecrease`, `slowdownTimeWhenDestroyed`.
- spells.csv `TH13 Frost`: `Radius` 500 (the slow area is 5.0 tiles, larger than the 4-tile blast, as the page's trivia notes), `FreezePercent` 50, `FreezeTimeMS` 8000.
