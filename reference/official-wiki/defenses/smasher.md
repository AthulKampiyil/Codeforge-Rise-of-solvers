# Smasher

- Source: [Smasher](https://clashofclans.fandom.com/wiki/Smasher) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625037`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `characters.csv` -> `Smasher (guardians.csv MeleeAreaaaa)`

## Mechanics

- Town Hall 18 Guardian (see Town Hall/Guardians for the shared rules: one active at a time, waits on the Town Hall, not a Hero, Poison at 30%, no housing value).
- Attack: melee range 1.25 tiles but reaches **air units** too thanks to its size; one swing every 1.8 s with 2.5-tile splash. Level 5: 700 DPS / 1,260 per hit, 16,000 HP.
- Movement speed 20; search radius 12 tiles; trigger radius 14 tiles (both raised on Jan 12, 2026).
- 'Sore Loser': if the Town Hall is destroyed while it lives, it becomes enraged until death: +60% damage and +12 movement speed.
- On death it releases a defensive Rage Spell (same effect as the Spell Tower's Rage) whether or not it had enraged.
- Upgrades: levels 2-5 cost 18M / 22M / 26M / 28M and take 7 / 9 / 11 / 13 days.

### Recent balance notes (from the page's History table)

- April 27, 2026: affected by Poison at 30%.
- January 12, 2026: search 10 -> 12 tiles, alert 12 -> 14 tiles.

## Level table

**Statistics**

| Targets | Attack Type | Movement Speed | Attack Speed | Range | Search Radius | Trigger Radius | Damage Radius | Special Ability | Rage Speed Increase | Rage Damage Increase |
|---|---|---|---|---|---|---|---|---|---|---|
| Ground & Air | Splash Damage | 20 | 1.8s | 1.25 tiles | 12 tiles | 14 tiles | 2.5 tiles | Sore Loser | 12 | 60% |

**Statistics**

| Level | Damage per Second | Damage per Hit | Hitpoints | Upgrade Cost | Upgrade Time |
|---|---|---|---|---|---|
| 1 | 500 | 900 | 12,000 | N/A | N/A |
| 2 | 550 | 990 | 13,000 | 18,000,000 | 7d |
| 3 | 600 | 1,080 | 14,000 | 22,000,000 | 9d |
| 4 | 650 | 1,170 | 15,000 | 26,000,000 | 11d |
| 5 | 700 | 1,260 | 16,000 | 28,000,000 | 13d |

## Client comparison

No mismatches found in the compared fields.

**Interpretation of client columns**

- Verified equal (wiki vs client): `dps@1`, `damagePerHit@1`, `hitpoints@1`, `dps@2`, `damagePerHit@2`, `hitpoints@2`, `upgradeCost@2`, `upgradeTime@2`, `dps@3`, `damagePerHit@3`, `hitpoints@3`, `upgradeCost@3`, `upgradeTime@3`, `dps@4`, `damagePerHit@4`, `hitpoints@4`, `upgradeCost@4`, `upgradeTime@4`, `dps@5`, `damagePerHit@5`, `hitpoints@5`, `upgradeCost@5`, `upgradeTime@5`, `movementSpeed`, `attackSeconds`, `range`, `triggerRadius`, `searchRadius`, `damageRadius`.
- characters.csv `Smasher`: `DPS` 500..700, `Hitpoints` 12000..16000, `AttackSpeed` 1800 (`CoolDownOverride` 900), `AttackRange` 125, `DamageRadius` 250, `Speed` 250, air+ground, `AlertRadius` 1400, `MaxSearchRadiusForDefender` 1200 (Jan 2026 values).
- `SpecialAbilities` `MeleeGuardianOnDeath` (`SelfSpell` SmasherRageArea, `ActiveOnDeath`) and `MeleeGuardianOnHomeDeath` (`ActivateAfterHomeBuildingDies`, `BoostDamagePercentage` 60, `SpeedBoost` 150 = +12 speed).
- spells.csv `SmasherRageArea`: `Radius` 500, 60 x 300 ms = 18 s, `DamageBoostPercent` 60, `SpeedBoost` 30 / `SpeedBoost2` 15 - identical to `Spell Tower Rage`.
- guardians.csv `MeleeAreaaaa` (sic): `ActivationRadius` 12, `PatrolRadius` 350, `LeapTimeMS` 750.
