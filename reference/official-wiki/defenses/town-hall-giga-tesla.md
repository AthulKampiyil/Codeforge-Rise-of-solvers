# Town Hall/Giga Tesla

- Source: [Town Hall/Giga Tesla](https://clashofclans.fandom.com/wiki/Town_Hall/Giga_Tesla) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `620077`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `weapons.csv` -> `Townhall12`

## Mechanics

- Built into the Town Hall 12 (not a separate building): its hitpoints are the Town Hall's (7,500). Since October 6, 2025 the weapon has no upgrade levels - one fixed stat line per Town Hall level.
- Activation: stays hidden until the Town Hall is damaged by a troop or spell, or the attack reaches 51% destruction; troops entering range do not wake it. Before activation the Town Hall is not a 'defense' for defense-targeting troops (Giants, Balloons, Hog Riders). If the Town Hall is upgrading, the weapon neither fires nor explodes and is not targeted as a defense.
- Attack: range 10 tiles, ground and air, hits up to 4 targets at once; 140 DPS per target, 70 per hit every 0.5 s.
- Death bomb: when the Town Hall is destroyed it explodes for 500 damage in 4 tiles (ground and air).

### Recent balance notes (from the page's History table)

- October 6, 2025: weapon levels removed (fixed stats).
- June 3, 2024: damage reduced by 20 at all levels; level 5 death damage 1,000 -> 500.

## Level table

**Statistics**

| Damage per Second per Target | Damage per Hit | Number of Targets | Damage when Destroyed | Death Damage Radius | Hitpoints |
|---|---|---|---|---|---|
| 140 | 70 | 4 | 500 | 4 tiles | 7,500 |

**Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted |
|---|---|---|---|
| 10 | 0.5s | Multiple Targets | Ground & Air |

## Client comparison

No mismatches found in the compared fields.

**Interpretation of client columns**

- weapons.csv `Townhall12` (single level): `AttackRange` 1000, `AttackSpeed` 500, `DPS` 140, `MultiTargets` TRUE with `NumMultiTargets` 4, `DieDamage` 500, `DieDamageRadius` 400, `DieDamageDelay` 1600 ms.
- Town Hall level 12 row: `Weapon` Townhall12, `ActivateCombatOnDamageTaken` 1, `CombatActivationDelay` 500 ms; the 51% rule is the global `HIDDEN_BUILDING_APPEAR_DESTRUCTION_PERCENTAGE` 50.
- Verified equal (wiki vs client): `dpsPerTarget`, `damagePerHit`, `numberOfTargets`, `damageWhenDestroyed`, `deathDamageRadius`, `hitpoints`, `range`, `attackSeconds`.
