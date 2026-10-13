# Cake-A-Pult

- Source: [Cake-A-Pult](https://clashofclans.fandom.com/wiki/Cake-A-Pult) (Clash of Clans Wiki, CC BY-SA)
- Wiki revision id: `625029`; retrieved 2026-09-15
- Category: defense
- Client reference (18.400.21): `seasonal_defense_modules.csv` -> `Cake Thrower (CakeThrowerHPModule / AttackModule / EffectModule)`

## Mechanics

- Crafted Defense chosen at the Crafting Station (Phase 4). 3x3.
- Range 3-12 tiles (3-tile blind spot), one cake every 3 s, targets ground and air.
- The cake explodes on impact for area damage in 2.5 tiles, but only against the layer (ground or air) of its target.
- It leaves a bomb that detonates after a delay (3 s on the wiki) for heavy damage in 2.5 tiles to **both** ground and air units.
- Modules: Hitpoints 1,600 -> 5,800; Damage 195 -> 375 per cake; Explosion Damage 400 -> 950.

### Recent balance notes (from the page's History table)

- August 1, 2026: added for Phase 4 (in the game files since June 16, 2026).

## Level table

Number available per Town Hall (wiki `NumberAvailable`): TH11: 1

Size: 3x3

**Common Statistics**

| Range | Attack Speed | Damage Type | Unit Type Targeted | Bomb Explosion Radius | Bomb Detonation Delay |
|---|---|---|---|---|---|
| 3-12 Tiles | 3s | Area Splash - 2.5 Tiles | Ground & Air | 2.5 Tiles | 3s |

**Module 1: Hitpoints**

| Level | Hitpoints | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 1,600 | N/A | N/A | N/A | 11 |
| 2 | 1,800 | 3,000,000 | 4h | 120 | 12 |
| 3 | 2,150 | 4,000,000 | 6h | 146 | 13 |
| 4 | 2,500 | 5,000,000 | 8h | 169 | 14 |
| 5 | 2,700 | 6,000,000 | 10h | 189 | 15 |
| 6 | 3,150 | 7,000,000 | 16h | 240 | 16 |
| 7 | 3,800 | 8,000,000 | 1d 16h | 379 | 17 |
| 8 | 4,300 | 9,000,000 | 3d 2h | 516 | 18 |
| 9 | 4,950 | 10,000,000 | 5d 6h | 673 | 18 |
| 10 | 5,800 | 11,000,000 | 9d | 881 | 18 |

**Module 2: Damage**

| Level | Damage per Hit | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 195 | N/A | N/A | N/A | 11 |
| 2 | 210 | 35,000 | 6h | 146 | 12 |
| 3 | 225 | 45,000 | 8h | 169 | 13 |
| 4 | 246 | 55,000 | 10h | 189 | 14 |
| 5 | 264 | 65,000 | 12h | 207 | 15 |
| 6 | 285 | 75,000 | 18h | 254 | 16 |
| 7 | 315 | 85,000 | 1d 19h | 393 | 17 |
| 8 | 333 | 95,000 | 3d 8h | 536 | 18 |
| 9 | 354 | 105,000 | 5d 18h | 704 | 18 |
| 10 | 375 | 115,000 | 9d 12h | 905 | 18 |

**Module 3: Explosion Damage**

| Level | Explosion Damage | Cost | Build Time | Experience Gained | Town Hall Level Required |
|---|---|---|---|---|---|
| 1 | 400 | N/A | N/A | N/A | 11 |
| 2 | 450 | 4,000,000 | 8h | 169 | 12 |
| 3 | 480 | 5,000,000 | 10h | 189 | 13 |
| 4 | 510 | 6,000,000 | 11h | 198 | 14 |
| 5 | 530 | 7,500,000 | 13h | 216 | 15 |
| 6 | 550 | 9,000,000 | 19h | 261 | 16 |
| 7 | 600 | 10,500,000 | 1d 22h | 406 | 17 |
| 8 | 750 | 12,000,000 | 3d 11h | 546 | 18 |
| 9 | 900 | 13,500,000 | 6d 4h | 729 | 18 |
| 10 | 950 | 15,000,000 | 10d | 929 | 18 |

## Client comparison

**Mismatches / ambiguities**

| Field | Level | Wiki (live) | Client 18.400.21 | Note |
|---|---|---|---|---|
| townHall [Module 1: Hitpoints] | 1 | 11 | 12 | CakeThrowerHPModule.TownHallLevel |
| townHall [Module 2: Damage] | 1 | 11 | 12 | CakeThrowerAttackModule.TownHallLevel |
| townHall [Module 3: Explosion Damage] | 1 | 11 | 12 | CakeThrowerEffectModule.TownHallLevel |
| bombDelaySeconds | all | 3 | CakeThrowerExplosion DeployTimeMS 1999 + ChargingTimeMS 300 | client timing suggests ~2.0-2.3 s from impact; verify in game |

**Interpretation of client columns**

- Verified equal (wiki vs client): `hitpoints [Module 1: Hitpoints]@1`, `cost [Module 1: Hitpoints]@2`, `buildSeconds [Module 1: Hitpoints]@2`, `xp [Module 1: Hitpoints]@2`, `townHall [Module 1: Hitpoints]@2`, `hitpoints [Module 1: Hitpoints]@2`, `cost [Module 1: Hitpoints]@3`, `buildSeconds [Module 1: Hitpoints]@3`, `xp [Module 1: Hitpoints]@3`, `townHall [Module 1: Hitpoints]@3`, `hitpoints [Module 1: Hitpoints]@3`, `cost [Module 1: Hitpoints]@4`, `buildSeconds [Module 1: Hitpoints]@4`, `xp [Module 1: Hitpoints]@4`, `townHall [Module 1: Hitpoints]@4`, `hitpoints [Module 1: Hitpoints]@4`, `cost [Module 1: Hitpoints]@5`, `buildSeconds [Module 1: Hitpoints]@5`, `xp [Module 1: Hitpoints]@5`, `townHall [Module 1: Hitpoints]@5`, `hitpoints [Module 1: Hitpoints]@5`, `cost [Module 1: Hitpoints]@6`, `buildSeconds [Module 1: Hitpoints]@6`, `xp [Module 1: Hitpoints]@6`, `townHall [Module 1: Hitpoints]@6`, `hitpoints [Module 1: Hitpoints]@6`, `cost [Module 1: Hitpoints]@7`, `buildSeconds [Module 1: Hitpoints]@7`, `xp [Module 1: Hitpoints]@7`, `townHall [Module 1: Hitpoints]@7`, `hitpoints [Module 1: Hitpoints]@7`, `cost [Module 1: Hitpoints]@8`, `buildSeconds [Module 1: Hitpoints]@8`, `xp [Module 1: Hitpoints]@8`, `townHall [Module 1: Hitpoints]@8`, `hitpoints [Module 1: Hitpoints]@8`, `cost [Module 1: Hitpoints]@9`, `buildSeconds [Module 1: Hitpoints]@9`, `xp [Module 1: Hitpoints]@9`, `townHall [Module 1: Hitpoints]@9`, `hitpoints [Module 1: Hitpoints]@9`, `cost [Module 1: Hitpoints]@10`, `buildSeconds [Module 1: Hitpoints]@10`, `xp [Module 1: Hitpoints]@10`, `townHall [Module 1: Hitpoints]@10`, `hitpoints [Module 1: Hitpoints]@10`, `damagePerHit [Module 2: Damage]@1`, `cost [Module 2: Damage]@2`, `buildSeconds [Module 2: Damage]@2`, `xp [Module 2: Damage]@2`, `townHall [Module 2: Damage]@2`, `damagePerHit [Module 2: Damage]@2`, `cost [Module 2: Damage]@3`, `buildSeconds [Module 2: Damage]@3`, `xp [Module 2: Damage]@3`, `townHall [Module 2: Damage]@3`, `damagePerHit [Module 2: Damage]@3`, `cost [Module 2: Damage]@4`, `buildSeconds [Module 2: Damage]@4`, `xp [Module 2: Damage]@4`, `townHall [Module 2: Damage]@4`, `damagePerHit [Module 2: Damage]@4`, `cost [Module 2: Damage]@5`, `buildSeconds [Module 2: Damage]@5`, `xp [Module 2: Damage]@5`, `townHall [Module 2: Damage]@5`, `damagePerHit [Module 2: Damage]@5`, `cost [Module 2: Damage]@6`, `buildSeconds [Module 2: Damage]@6`, `xp [Module 2: Damage]@6`, `townHall [Module 2: Damage]@6`, `damagePerHit [Module 2: Damage]@6`, `cost [Module 2: Damage]@7`, `buildSeconds [Module 2: Damage]@7`, `xp [Module 2: Damage]@7`, `townHall [Module 2: Damage]@7`, `damagePerHit [Module 2: Damage]@7`, `cost [Module 2: Damage]@8`, `buildSeconds [Module 2: Damage]@8`, `xp [Module 2: Damage]@8`, `townHall [Module 2: Damage]@8`, `damagePerHit [Module 2: Damage]@8`, `cost [Module 2: Damage]@9`, `buildSeconds [Module 2: Damage]@9`, `xp [Module 2: Damage]@9`, `townHall [Module 2: Damage]@9`, `damagePerHit [Module 2: Damage]@9`, `cost [Module 2: Damage]@10`, `buildSeconds [Module 2: Damage]@10`, `xp [Module 2: Damage]@10`, `townHall [Module 2: Damage]@10`, `damagePerHit [Module 2: Damage]@10`, `explosionDamage [Module 3: Explosion Damage]@1`, `cost [Module 3: Explosion Damage]@2`, `buildSeconds [Module 3: Explosion Damage]@2`, `xp [Module 3: Explosion Damage]@2`, `townHall [Module 3: Explosion Damage]@2`, `explosionDamage [Module 3: Explosion Damage]@2`, `cost [Module 3: Explosion Damage]@3`, `buildSeconds [Module 3: Explosion Damage]@3`, `xp [Module 3: Explosion Damage]@3`, `townHall [Module 3: Explosion Damage]@3`, `explosionDamage [Module 3: Explosion Damage]@3`, `cost [Module 3: Explosion Damage]@4`, `buildSeconds [Module 3: Explosion Damage]@4`, `xp [Module 3: Explosion Damage]@4`, `townHall [Module 3: Explosion Damage]@4`, `explosionDamage [Module 3: Explosion Damage]@4`, `cost [Module 3: Explosion Damage]@5`, `buildSeconds [Module 3: Explosion Damage]@5`, `xp [Module 3: Explosion Damage]@5`, `townHall [Module 3: Explosion Damage]@5`, `explosionDamage [Module 3: Explosion Damage]@5`, `cost [Module 3: Explosion Damage]@6`, `buildSeconds [Module 3: Explosion Damage]@6`, `xp [Module 3: Explosion Damage]@6`, `townHall [Module 3: Explosion Damage]@6`, `explosionDamage [Module 3: Explosion Damage]@6`, `cost [Module 3: Explosion Damage]@7`, `buildSeconds [Module 3: Explosion Damage]@7`, `xp [Module 3: Explosion Damage]@7`, `townHall [Module 3: Explosion Damage]@7`, `explosionDamage [Module 3: Explosion Damage]@7`, `cost [Module 3: Explosion Damage]@8`, `buildSeconds [Module 3: Explosion Damage]@8`, `xp [Module 3: Explosion Damage]@8`, `townHall [Module 3: Explosion Damage]@8`, `explosionDamage [Module 3: Explosion Damage]@8`, `cost [Module 3: Explosion Damage]@9`, `buildSeconds [Module 3: Explosion Damage]@9`, `xp [Module 3: Explosion Damage]@9`, `townHall [Module 3: Explosion Damage]@9`, `explosionDamage [Module 3: Explosion Damage]@9`, `cost [Module 3: Explosion Damage]@10`, `buildSeconds [Module 3: Explosion Damage]@10`, `xp [Module 3: Explosion Damage]@10`, `townHall [Module 3: Explosion Damage]@10`, `explosionDamage [Module 3: Explosion Damage]@10`.
- Base ability `SeasonalDefenseCakeThrower`: `AttackRange` 1200, `MinAttackRange` 300, `DamageRadius` 250 (cake splash), air+ground. Attack module: `AttackSpeed` 3000 (`CoolDownOverride` 2200), `DPS` 65..125 (x 3 s = damage per cake).
- Effect module: `HitSpellOverride` CakeThrowerExplosion with `HitSpellLevelOverride` = module level; spell `Damage` 400..950, `Radius` 250, `DeployTimeMS` 1999, `ChargingTimeMS` 300. Projectile `CakeThrower Ammo N` is ballistic and does not track.
- `CakeThrowerHPModule` (Module 1: Hitpoints): resource Gold, `StatType` HitPoints; `CakeThrowerAttackModule` (Module 2: Damage): resource Dark Elixir, `StatType` DamagePerHit; `CakeThrowerEffectModule` (Module 3: Explosion Damage): resource Elixir, `StatType` ProjectileHitSpellExplosionDamage.
