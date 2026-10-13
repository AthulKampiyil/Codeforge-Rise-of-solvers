# Town Hall/Inferno Artillery

- Source: [Town Hall/Inferno Artillery](https://clashofclans.fandom.com/wiki/Town_Hall/Inferno_Artillery) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `622642`; retrieved 2026-09-15
- Category: townhall-weapon
- Client reference (18.400.21): `weapons.csv` -> `Townhall17`

## Mechanics

- Created at Town Hall 17 by merging the Town Hall 16 with a **level 7 Eagle Artillery**; before the TH17 upgrade all TH16 merges must also be done. The merge is permanent and the Eagle Artillery disappears. Hitpoints are the Town Hall's (10,400).
- Activates automatically at the start of every battle (unlike the Giga weapons); during its short arming animation it is not yet treated as a defense. No blind spot, never runs out of ammo, immune to Lightning Spells.
- Attack: range 12 tiles, ground and air, one volley every 3.5 s of **4 homing fireballs launched together**. Target spread: 4+ units in range -> the 4 closest each get one; 3 units -> the nearest gets two; 2 units -> two each; 1 unit -> all four. Fireballs home in and can re-target if their target dies; closer targets are hit sooner, and a fast target can drag a fireball beyond the normal range.
- Each fireball: single-target impact damage (level 1: 140 ... level 5: 210 = DPS x 3.5) and a **fire pool** that damages every enemy inside for 6.8 s (up to 75 DPS). Pools from several fireballs do not stack damage (overlap only reaches max tick rate faster). Pool damage is not boosted by the Rage Spell Tower or difficulty modifiers and does not slow units.
- No death damage: the former Giga death bomb became the separate Giga Bomb trap.
- Levels 2-5 are upgraded like a building (10M / 12M / 14M / 18M Gold; 6 / 7 / 8 / 10 days).

### Recent balance notes (from the page's History table)

- November 17, 2025: level 3-5 upgrade costs and level 2-5 times reduced.
- March 24 / October 6, 2025: merge (build) cost 20M -> 16M and time 15d -> 12d -> 10d.

## Level table

**Statistics**

| Level | Damage per Second per Target | Damage per Hit per Target | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|---|
| 1 | 40 | 140 | N/A | N/A | N/A | 17 |
| 2 | 45 | 157.5 | 10,000,000 | 6d | 720 | 17 |
| 3 | 50 | 175 | 12,000,000 | 7d | 777 | 17 |
| 4 | 55 | 192.5 | 14,000,000 | 8d | 831 | 17 |
| 5 | 60 | 210 | 18,000,000 | 10d | 929 | 17 |

**Statistics**

| Hitpoints | Range | Number of Targets | Attack Speed | Flame Max DPS | Flame Duration | Damage Type | Unit Type Targeted |
|---|---|---|---|---|---|---|---|
| 10,400 | 12 tiles | 4 | 3.5s | 75 | 6.8s | Multiple Targets | Ground & Air |

## Client comparison

No mismatches found in the compared fields.

**Interpretation of client columns**

- Verified equal (wiki vs client): `dpsPerTarget@1`, `damagePerHitPerTarget@1`, `dpsPerTarget@2`, `damagePerHitPerTarget@2`, `cost@2`, `buildSeconds@2`, `dpsPerTarget@3`, `damagePerHitPerTarget@3`, `cost@3`, `buildSeconds@3`, `dpsPerTarget@4`, `damagePerHitPerTarget@4`, `cost@4`, `buildSeconds@4`, `dpsPerTarget@5`, `damagePerHitPerTarget@5`, `cost@5`, `buildSeconds@5`, `hitpoints`, `range`, `numberOfTargets`, `attackSeconds`, `flameMaxDps`, `flameDuration`.
- weapons.csv `Townhall17` has 5 levels: `DPS` 40..60, `AttackSpeed` 3500 (`CoolDownOverride` 3000), `AttackRange` 1200, `MultiTargets` TRUE, `NumMultiTargets` 4, `MultiHitsTarget` TRUE (several fireballs may hit the same unit), `BuildCost`/`BuildTime*` on levels 2-5 = the upgrade prices.
- Projectile `TH17CannonProjectile`: ballistic, `RetargetRadius` 35 and `RetargetTimer` 750 (homing re-target), `HitSpell` `TH17WeaponAreaDamage`.
- Fire pool spell `TH17WeaponAreaDamage`: `Radius` 250 (2.5 tiles - not stated on the wiki), `PoisonDPS` 75, 17 x 400 ms = 6.8 s, affects air, immune buildings/walls/storages.
- Town Hall 17 row: `ActivateCombatOnDamageTaken` 0, `ActivateAfterSeconds` 1 (auto-activation), `MergeRequirement` `Eagle Artillery:7:0`.
