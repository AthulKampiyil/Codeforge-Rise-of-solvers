# Longshot

- Source: [Longshot](https://clashofclans.fandom.com/wiki/Longshot) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625038`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `characters.csv` -> `Longshot (guardians.csv InfernoArtillery)`

## Mechanics

- One of the three Guardians that defend a Town Hall 18 (selected by default). Only one Guardian is active at a time; it waits on top of the Town Hall and jumps down to fight when an attacker enters its trigger radius (19 tiles). If the Town Hall is destroyed first, it jumps down immediately.
- Guardian-wide rules (Town Hall/Guardians page): not a Hero (Headhunters ignore it; Spell Tower / Super Valkyrie Rage apply fully; Healers/Druids heal it like a normal troop); Poison affects it at 30% strength (since Apr 27, 2026); no housing space value (no Dark Crown value). Upgrading Guardians cannot defend in Multiplayer battles.
- Attack: range 11 tiles, one explosive bolt every 1.8 s, targets ground and air; splash radius 1 tile that only damages the layer (ground/air) of the unit it hit (since Feb 23, 2026). Level 5: 450 DPS / 810 per shot, 11,000 HP.
- Movement speed 12; patrol radius 17 tiles around the Town Hall; trigger radius 19 tiles.
- Death ('Final Blow'): collapses and explodes for 1,000 damage to ground and air within 3.5 tiles (no knockback).
- Upgrades: levels 2-5 cost 18M / 22M / 26M / 28M and take 7 / 9 / 11 / 13 days.

### Recent balance notes (from the page's History table)

- April 27, 2026: now affected by Poison at 30%.
- February 23, 2026: splash no longer hits ground and air together.
- January 12, 2026: range 12 -> 11, search 18 -> 17, alert 20 -> 19, splash 1.5 -> 1 tile.

## Level table

**Statistics**

| Targets | Attack Type | Movement Speed | Attack Speed | Range | Patrol Radius | Trigger Radius | Damage Radius | Death Damage Radius | Special Ability |
|---|---|---|---|---|---|---|---|---|---|
| Ground & Air | Splash Damage | 12 | 1.8s | 11 tiles | 17 tiles | 19 tiles | 1 tiles | 3.5 tiles | Final Blow |

**Statistics**

| Level | Damage per Second | Damage per Hit | Hitpoints | Damage Upon Death | Upgrade Cost | Upgrade Time |
|---|---|---|---|---|---|---|
| 1 | 330 | 594 | 7,000 | 1,000 | N/A | N/A |
| 2 | 360 | 648 | 8,000 | 1,000 | 18,000,000 | 7d |
| 3 | 390 | 702 | 9,000 | 1,000 | 22,000,000 | 9d |
| 4 | 420 | 756 | 10,000 | 1,000 | 26,000,000 | 11d |
| 5 | 450 | 810 | 11,000 | 1,000 | 28,000,000 | 13d |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| patrolRadius | all | 17 | 16 | MaxSearchRadiusForDefender/100 |

**Interpretation of client columns**

- Verified equal (wiki vs client): `dps@1`, `damagePerHit@1`, `hitpoints@1`, `damageUponDeath@1`, `dps@2`, `damagePerHit@2`, `hitpoints@2`, `upgradeCost@2`, `upgradeTime@2`, `damageUponDeath@2`, `dps@3`, `damagePerHit@3`, `hitpoints@3`, `upgradeCost@3`, `upgradeTime@3`, `damageUponDeath@3`, `dps@4`, `damagePerHit@4`, `hitpoints@4`, `upgradeCost@4`, `upgradeTime@4`, `damageUponDeath@4`, `dps@5`, `damagePerHit@5`, `hitpoints@5`, `upgradeCost@5`, `upgradeTime@5`, `damageUponDeath@5`, `movementSpeed`, `attackSeconds`, `range`, `triggerRadius`, `damageRadius`, `deathDamageRadius`.
- characters.csv `Longshot` (5 levels): `DPS` 330..450, `Hitpoints` 7000..11000, `AttackSpeed` 1800 (`CoolDownOverride` 1200), `AttackRange` 1100, `DamageRadius` 100, `Speed` 150, `DieDamage` 1000, `DieDamageRadius` 350, `DieDamageDelay` 200, `DieDamageAffectsAir` TRUE, `AlertRadius` 1900, `MaxSearchRadiusForDefender` 1600, `SpecialAbilities` RangedGuardianAbility (an empty info row), `HousingSpace` 25 (the wiki says Guardians have no housing value).
- guardians.csv `InfernoArtillery` (the Longshot entry, `isDefault` TRUE): `ActivationRadius` 20, `LeapTimeMS` 750, `LeapDistance` 3, `PatrolRadius` 350, `CharacterLevels` 1-5. upgrade_data.csv `GuardianGeneral`: Elixir 18M/22M/26M/28M, 7/9/11/13 days.
- Poison at 30%: globals `GUARDIAN_POISON_SPEED_MULTIPLIER` 30 and `GUARDIAN_POISON_ATTACK_SPEED_MULTIPLIER` 30.
- The patrol/search radius differs: wiki 17 tiles vs `MaxSearchRadiusForDefender` 1600 (16); guardians.csv `ActivationRadius` 20 still equals the pre-January-2026 alert range.
